import { readFile, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";

import type { Position, TextEdit, WorkspaceEdit } from "vscode-languageserver-protocol";

const MAX_CHANGED_FILES = 64;
const MAX_TEXT_EDITS = 512;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_INSERTED_BYTES = 2 * 1024 * 1024;

export interface WorkspaceDocumentState {
  readonly text: string;
  readonly version: number;
}

export interface WorkspaceEditFileChange {
  readonly afterBytes: number;
  readonly beforeBytes: number;
  readonly editCount: number;
  readonly path: string;
}

export interface ApplyWorkspaceEditOptions {
  readonly additionalQueuePaths?: readonly string[];
  readonly documentState?: (
    path: string,
  ) => Promise<WorkspaceDocumentState | undefined> | WorkspaceDocumentState | undefined;
  readonly dryRun?: boolean;
  readonly expectedDocumentState?: (
    path: string,
  ) => Promise<WorkspaceDocumentState | undefined> | WorkspaceDocumentState | undefined;
  readonly signal?: AbortSignal;
  readonly whileApplied?: (changedFiles: readonly string[]) => Promise<void>;
}

export interface WorkspaceEditTransaction {
  readonly changedFiles: readonly string[];
  readonly changes: readonly WorkspaceEditFileChange[];
  rollback(): Promise<void>;
}

interface CollectedEdits {
  readonly edits: TextEdit[];
  readonly version?: number;
}

interface PreparedWorkspaceFiles {
  readonly changes: readonly WorkspaceEditFileChange[];
  readonly replacements: ReadonlyMap<string, string>;
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

function mergeCollectedEdits(
  existing: CollectedEdits | undefined,
  edits: readonly TextEdit[],
  version: number | undefined,
  conflictMessage: string,
): CollectedEdits {
  if (existing?.version !== undefined && version !== undefined && existing.version !== version) {
    throw new Error(conflictMessage);
  }
  const selectedVersion = version ?? existing?.version;
  return selectedVersion === undefined
    ? { edits: [...(existing?.edits ?? []), ...edits] }
    : { edits: [...(existing?.edits ?? []), ...edits], version: selectedVersion };
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
    if (edit.start < previousEnd) {
      throw new Error("LSP workspace edit contains overlapping text edits.");
    }
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

function validateAnnotations(workspaceEdit: WorkspaceEdit, edits: readonly TextEdit[]): void {
  for (const edit of edits) {
    const annotationId = "annotationId" in edit ? edit.annotationId : undefined;
    if (typeof annotationId !== "string") continue;
    const annotation = workspaceEdit.changeAnnotations?.[annotationId];
    if (annotation === undefined) {
      throw new Error(`LSP workspace edit references unknown change annotation ${annotationId}.`);
    }
    if (annotation.needsConfirmation === true) {
      throw new Error("LSP workspace edit requires unsupported interactive confirmation.");
    }
  }
}

function collectWorkspaceEdits(edit: WorkspaceEdit): Map<string, CollectedEdits> {
  const collected = new Map<string, CollectedEdits>();
  const add = (uri: string, edits: readonly TextEdit[], version?: number): void => {
    let path: string;
    try {
      const url = new URL(uri);
      if (url.protocol !== "file:") throw new Error("not file");
      path = fileURLToPath(url);
    } catch {
      throw new Error(`LSP workspace edit contains a non-file URI: ${uri}`);
    }
    validateAnnotations(edit, edits);
    if (edits.length === 0) return;
    collected.set(
      path,
      mergeCollectedEdits(
        collected.get(path),
        edits,
        version,
        "LSP workspace edit contains conflicting document versions.",
      ),
    );
  };
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) add(uri, edits);
  for (const change of edit.documentChanges ?? []) {
    if ("kind" in change) {
      throw new Error("LSP workspace edit returned unsupported resource operations.");
    }
    add(change.textDocument.uri, change.edits, change.textDocument.version ?? undefined);
  }
  return collected;
}

async function withQueues<T>(paths: readonly string[], callback: () => Promise<T>): Promise<T> {
  const [path, ...remaining] = paths;
  if (path === undefined) return callback();
  return withFileMutationQueue(path, () => withQueues(remaining, callback));
}

function validateWorkspaceEditLimits(grouped: ReadonlyMap<string, CollectedEdits>): void {
  if (grouped.size > MAX_CHANGED_FILES) {
    throw new Error(`LSP workspace edit exceeds the ${String(MAX_CHANGED_FILES)} file limit.`);
  }
  let totalEdits = 0;
  let insertedBytes = 0;
  for (const { edits } of grouped.values()) {
    totalEdits += edits.length;
    for (const edit of edits) insertedBytes += Buffer.byteLength(edit.newText, "utf8");
  }
  if (totalEdits > MAX_TEXT_EDITS) {
    throw new Error(`LSP workspace edit exceeds the ${String(MAX_TEXT_EDITS)} edit limit.`);
  }
  if (insertedBytes > MAX_INSERTED_BYTES) {
    throw new Error(`LSP workspace edit inserts more than ${String(MAX_INSERTED_BYTES)} bytes.`);
  }
}

async function canonicalizeWorkspaceEdits(
  grouped: ReadonlyMap<string, CollectedEdits>,
): Promise<Map<string, CollectedEdits>> {
  const canonicalGrouped = new Map<string, CollectedEdits>();
  for (const [path, collected] of grouped) {
    const canonicalPath = await canonicalExistingPath(resolve(path));
    canonicalGrouped.set(
      canonicalPath,
      mergeCollectedEdits(
        canonicalGrouped.get(canonicalPath),
        collected.edits,
        collected.version,
        "LSP workspace edit aliases contain conflicting document versions.",
      ),
    );
  }
  return canonicalGrouped;
}

async function validateDocumentSnapshot(
  path: string,
  text: string,
  collected: CollectedEdits,
  options: ApplyWorkspaceEditOptions,
): Promise<void> {
  const expectedDocumentState = await options.expectedDocumentState?.(path);
  if (
    options.expectedDocumentState !== undefined &&
    collected.version === undefined &&
    expectedDocumentState === undefined
  ) {
    throw new Error(
      "LSP workspace edit contains an unversioned document that cannot be validated.",
    );
  }
  if (expectedDocumentState !== undefined && expectedDocumentState.text !== text) {
    throw new Error("LSP workspace edit document snapshot is stale.");
  }
  if (collected.version === undefined) return;
  const documentState = await options.documentState?.(path);
  if (documentState?.version !== collected.version || documentState.text !== text) {
    throw new Error("LSP workspace edit document version is stale or cannot be validated.");
  }
}

async function prepareWorkspaceFiles(
  paths: readonly string[],
  canonicalGrouped: ReadonlyMap<string, CollectedEdits>,
  canonicalRoot: string,
  resolvedRoot: string,
  options: ApplyWorkspaceEditOptions,
  originals: Map<string, string>,
): Promise<PreparedWorkspaceFiles> {
  const replacements = new Map<string, string>();
  const changes: WorkspaceEditFileChange[] = [];
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
    const collected = canonicalGrouped.get(path);
    if (collected === undefined) continue;
    await validateDocumentSnapshot(path, text, collected, options);
    originals.set(path, text);
    const replacement = applyTextEdits(text, collected.edits);
    if (Buffer.byteLength(replacement, "utf8") > MAX_FILE_BYTES) {
      throw new Error(
        `LSP workspace edit produces a file larger than ${String(MAX_FILE_BYTES)} bytes.`,
      );
    }
    replacements.set(path, replacement);
    changes.push({
      afterBytes: Buffer.byteLength(replacement, "utf8"),
      beforeBytes: Buffer.byteLength(text, "utf8"),
      editCount: collected.edits.length,
      path: resolve(resolvedRoot, relative(canonicalRoot, path)),
    });
  }
  return { changes, replacements };
}

async function commitWorkspaceFiles(
  paths: readonly string[],
  replacements: ReadonlyMap<string, string>,
  changedFiles: readonly string[],
  options: ApplyWorkspaceEditOptions,
  restore: () => Promise<void>,
): Promise<void> {
  try {
    for (const path of paths) {
      options.signal?.throwIfAborted();
      await writeFile(path, replacements.get(path) ?? "", "utf8");
    }
    options.signal?.throwIfAborted();
    await options.whileApplied?.(changedFiles);
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
}

export async function applyWorkspaceEdit(
  workspaceEdit: WorkspaceEdit | null | undefined,
  workspaceRoot: string,
  options: ApplyWorkspaceEditOptions = {},
): Promise<WorkspaceEditTransaction> {
  options.signal?.throwIfAborted();
  const canonicalAdditionalPaths = await Promise.all(
    (options.additionalQueuePaths ?? []).map((path) => canonicalMutationPath(path)),
  );
  if (workspaceEdit === null || workspaceEdit === undefined) {
    const queuePaths = [...new Set(canonicalAdditionalPaths)].sort((left, right) =>
      left.localeCompare(right),
    );
    if (!options.dryRun) {
      await withQueues(queuePaths, async () => {
        options.signal?.throwIfAborted();
        await options.whileApplied?.([]);
      });
    }
    return { changedFiles: [], changes: [], rollback: () => Promise.resolve() };
  }
  const grouped = collectWorkspaceEdits(workspaceEdit);
  validateWorkspaceEditLimits(grouped);
  const resolvedRoot = resolve(workspaceRoot);
  const canonicalRoot = await realpath(resolvedRoot);
  const canonicalGrouped = await canonicalizeWorkspaceEdits(grouped);
  const paths = [...canonicalGrouped.keys()].sort((left, right) => left.localeCompare(right));
  const changedFiles = paths.map((path) => resolve(resolvedRoot, relative(canonicalRoot, path)));
  const queuePaths = [...new Set([...paths, ...canonicalAdditionalPaths])].sort((left, right) =>
    left.localeCompare(right),
  );
  const originals = new Map<string, string>();
  let changes: readonly WorkspaceEditFileChange[] = [];

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
    options.signal?.throwIfAborted();
    const prepared = await prepareWorkspaceFiles(
      paths,
      canonicalGrouped,
      canonicalRoot,
      resolvedRoot,
      options,
      originals,
    );
    changes = prepared.changes;
    if (!options.dryRun) {
      await commitWorkspaceFiles(paths, prepared.replacements, changedFiles, options, restore);
    }
  });

  let rolledBack = options.dryRun === true;
  return {
    changedFiles,
    changes,
    async rollback() {
      if (rolledBack) return;
      await withQueues(paths, restore);
      rolledBack = true;
    },
  };
}
