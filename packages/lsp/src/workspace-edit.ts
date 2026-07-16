import { readFile, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";

import type { Position, TextEdit, WorkspaceEdit } from "vscode-languageserver-protocol";

const MAX_CHANGED_FILES = 64;
const MAX_TEXT_EDITS = 512;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_INSERTED_BYTES = 2 * 1024 * 1024;

export interface WorkspaceEditTransaction {
  readonly changedFiles: readonly string[];
  rollback(): Promise<void>;
}

interface OffsetEdit {
  readonly end: number;
  readonly newText: string;
  readonly start: number;
}

function isInside(root: string, target: string): boolean {
  const path = relative(root, target);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

async function canonicalExistingPath(path: string): Promise<string> {
  return realpath(path);
}

async function canonicalMutationPath(path: string): Promise<string> {
  const absolutePath = resolve(path);
  let existing = absolutePath;
  const suffix: string[] = [];
  for (;;) {
    try {
      return resolve(await realpath(existing), ...suffix);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        (error.code !== "ENOENT" && error.code !== "ENOTDIR")
      ) {
        throw error;
      }
      const parent = dirname(existing);
      if (parent === existing) return absolutePath;
      suffix.unshift(basename(existing));
      existing = parent;
    }
  }
}

function offsetAt(text: string, position: Position): number {
  if (!Number.isInteger(position.line) || position.line < 0) {
    throw new Error("LSP workspace edit contains an invalid line position.");
  }
  if (!Number.isInteger(position.character) || position.character < 0) {
    throw new Error("LSP workspace edit contains an invalid character position.");
  }
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text.codePointAt(index) === 10) starts.push(index + 1);
  }
  const start = starts[position.line];
  if (start === undefined) throw new Error("LSP workspace edit points past the end of a file.");
  const next = starts[position.line + 1] ?? text.length + 1;
  let lineLength = next - start - (next <= text.length ? 1 : 0);
  if (lineLength > 0 && text.codePointAt(start + lineLength - 1) === 13) lineLength -= 1;
  if (position.character > lineLength) {
    throw new Error("LSP workspace edit points past the end of a line.");
  }
  return start + position.character;
}

function applyTextEdits(text: string, edits: readonly TextEdit[]): string {
  const offsets: OffsetEdit[] = edits.map((edit) => ({
    end: offsetAt(text, edit.range.end),
    newText: edit.newText,
    start: offsetAt(text, edit.range.start),
  }));
  offsets.sort((left, right) => left.start - right.start || left.end - right.end);
  let previousEnd = -1;
  for (const edit of offsets) {
    if (edit.end < edit.start) throw new Error("LSP workspace edit contains a reversed range.");
    if (edit.start < previousEnd)
      throw new Error("LSP workspace edit contains overlapping text edits.");
    previousEnd = edit.end;
  }
  let result = text;
  for (let index = offsets.length - 1; index >= 0; index -= 1) {
    const edit = offsets[index];
    if (edit === undefined) continue;
    result = `${result.slice(0, edit.start)}${edit.newText}${result.slice(edit.end)}`;
  }
  return result;
}

function collectWorkspaceEdits(edit: WorkspaceEdit): Map<string, TextEdit[]> {
  const collected = new Map<string, TextEdit[]>();
  const add = (uri: string, edits: readonly TextEdit[]): void => {
    let path: string;
    try {
      const url = new URL(uri);
      if (url.protocol !== "file:") throw new Error("not file");
      path = fileURLToPath(url);
    } catch {
      throw new Error(`LSP workspace edit contains a non-file URI: ${uri}`);
    }
    collected.set(path, [...(collected.get(path) ?? []), ...edits]);
  };
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) add(uri, edits);
  for (const change of edit.documentChanges ?? []) {
    if ("kind" in change) {
      throw new Error("LSP rename preflight returned unsupported resource operations.");
    }
    if (change.textDocument.version !== null) {
      throw new Error(
        "LSP rename preflight returned a versioned document edit that cannot be validated.",
      );
    }
    add(change.textDocument.uri, change.edits);
  }
  return collected;
}

async function withQueues<T>(paths: readonly string[], callback: () => Promise<T>): Promise<T> {
  const [path, ...remaining] = paths;
  if (path === undefined) return callback();
  return withFileMutationQueue(path, () => withQueues(remaining, callback));
}

export async function applyWorkspaceEdit(
  workspaceEdit: WorkspaceEdit | null | undefined,
  workspaceRoot: string,
  whileApplied?: (changedFiles: readonly string[]) => Promise<void>,
  additionalQueuePaths: readonly string[] = [],
): Promise<WorkspaceEditTransaction> {
  const canonicalAdditionalPaths = await Promise.all(
    additionalQueuePaths.map((path) => canonicalMutationPath(path)),
  );
  if (workspaceEdit === null || workspaceEdit === undefined) {
    const queuePaths = [...new Set(canonicalAdditionalPaths)].sort((left, right) =>
      left.localeCompare(right),
    );
    await withQueues(queuePaths, async () => whileApplied?.([]));
    return { changedFiles: [], rollback: () => Promise.resolve() };
  }
  const grouped = collectWorkspaceEdits(workspaceEdit);
  if (grouped.size > MAX_CHANGED_FILES) {
    throw new Error(`LSP workspace edit exceeds the ${String(MAX_CHANGED_FILES)} file limit.`);
  }
  let totalEdits = 0;
  let insertedBytes = 0;
  for (const edits of grouped.values()) {
    totalEdits += edits.length;
    for (const edit of edits) insertedBytes += Buffer.byteLength(edit.newText, "utf8");
  }
  if (totalEdits > MAX_TEXT_EDITS) {
    throw new Error(`LSP workspace edit exceeds the ${String(MAX_TEXT_EDITS)} edit limit.`);
  }
  if (insertedBytes > MAX_INSERTED_BYTES) {
    throw new Error(`LSP workspace edit inserts more than ${String(MAX_INSERTED_BYTES)} bytes.`);
  }
  const resolvedRoot = resolve(workspaceRoot);
  const canonicalRoot = await realpath(resolvedRoot);
  const canonicalGrouped = new Map<string, TextEdit[]>();
  for (const [path, edits] of grouped) {
    const canonicalPath = await canonicalExistingPath(resolve(path));
    canonicalGrouped.set(canonicalPath, [...(canonicalGrouped.get(canonicalPath) ?? []), ...edits]);
  }
  const paths = [...canonicalGrouped.keys()].sort((left, right) => left.localeCompare(right));
  const changedFiles = paths.map((path) => resolve(resolvedRoot, relative(canonicalRoot, path)));
  const queuePaths = [...new Set([...paths, ...canonicalAdditionalPaths])].sort((left, right) =>
    left.localeCompare(right),
  );
  const originals = new Map<string, string>();

  const restore = async (): Promise<void> => {
    const failures: unknown[] = [];
    for (const path of paths) {
      try {
        await writeFile(path, originals.get(path) ?? "", "utf8");
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, "Failed to restore every LSP workspace edit file.");
    }
  };

  await withQueues(queuePaths, async () => {
    const replacements = new Map<string, string>();
    for (const path of paths) {
      if (!isInside(canonicalRoot, path)) {
        throw new Error(`LSP workspace edit targets a file outside the LSP workspace: ${path}`);
      }
      const text = await readFile(path, "utf8");
      if (Buffer.byteLength(text, "utf8") > MAX_FILE_BYTES) {
        throw new Error(
          `LSP workspace edit targets a file larger than ${String(MAX_FILE_BYTES)} bytes.`,
        );
      }
      originals.set(path, text);
      const replacement = applyTextEdits(text, canonicalGrouped.get(path) ?? []);
      if (Buffer.byteLength(replacement, "utf8") > MAX_FILE_BYTES) {
        throw new Error(
          `LSP workspace edit produces a file larger than ${String(MAX_FILE_BYTES)} bytes.`,
        );
      }
      replacements.set(path, replacement);
    }
    try {
      for (const path of paths) await writeFile(path, replacements.get(path) ?? "", "utf8");
      await whileApplied?.(changedFiles);
    } catch (error) {
      try {
        await restore();
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "LSP workspace edit failed and rollback was incomplete.",
          { cause: rollbackError },
        );
      }
      throw error;
    }
  });

  let rolledBack = false;
  return {
    changedFiles,
    async rollback() {
      if (rolledBack) return;
      await withQueues(paths, restore);
      rolledBack = true;
    },
  };
}
