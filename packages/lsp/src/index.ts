import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createEditToolDefinition,
  createWriteToolDefinition,
  isReadToolResult,
  truncateHead,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import { renderDiagnostics } from "./diagnostics.ts";
import { LspManager } from "./manager.ts";

import type { LspService, MutationSnapshot, RenameOutcome } from "./manager.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Diagnostic } from "vscode-languageserver-protocol";

const DEFAULT_INLINE_WAIT_MS = 500;
const MAX_RENAME_OUTPUT_BYTES = 8192;
const MESSAGE_TYPE = "mopeyjellyfish-pi-lsp-diagnostics";
const UNICODE_SPACES = /[\u{A0}\u{2000}-\u{200A}\u{202F}\u{205F}\u{3000}]/gu;

const RenameFileParameters = Type.Object(
  {
    newPath: Type.String({
      description: "Destination file path, relative to the workspace or absolute",
    }),
    oldPath: Type.String({
      description: "Existing file path to rename, relative to the workspace or absolute",
    }),
  },
  { additionalProperties: false },
);

export interface LspExtensionOptions {
  readonly inlineWaitMs?: number;
  readonly serviceFactory?: (ctx: ExtensionContext) => LspService;
}

function normalizePath(cwd: string, path: string): string {
  let normalized = path.replaceAll(UNICODE_SPACES, " ");
  if (normalized.startsWith("@")) normalized = normalized.slice(1);
  if (normalized === "~") return homedir();
  if (normalized.startsWith("~/")) normalized = join(homedir(), normalized.slice(2));
  if (normalized.startsWith("file://")) normalized = fileURLToPath(normalized);
  return resolve(cwd, normalized);
}

function timeout(milliseconds: number): Promise<symbol> {
  return new Promise((resolveTimeout) => {
    setTimeout(() => {
      resolveTimeout(Symbol.for("pi-lsp-timeout"));
    }, milliseconds);
  });
}

async function safeSnapshot(
  service: LspService,
  path: string,
): Promise<MutationSnapshot | undefined> {
  try {
    return await service.snapshot(path);
  } catch {
    return undefined;
  }
}

function appendDiagnostics<T extends { content: readonly unknown[] }>(result: T, text: string): T {
  if (!text) return result;
  return {
    ...result,
    content: [...result.content, { text: `\n\n${text}`, type: "text" }],
  };
}

function renameSummary(cwd: string, outcome: RenameOutcome): string {
  const changed = outcome.changedFiles.length;
  const lines = [
    `Renamed ${relative(cwd, outcome.oldPath)} to ${relative(cwd, outcome.newPath)} with ${outcome.serverName}.`,
    `Applied semantic edits to ${String(changed)} file${changed === 1 ? "" : "s"}.`,
  ];
  if (outcome.warning) lines.push(`Warning: ${outcome.warning}`);
  for (const group of outcome.diagnostics) {
    const rendered = renderDiagnostics(group.diagnostics);
    if (rendered) lines.push(`Diagnostics for ${relative(cwd, group.path)}:\n${rendered}`);
  }
  return truncateHead(lines.join("\n"), { maxBytes: MAX_RENAME_OUTPUT_BYTES, maxLines: 100 })
    .content;
}

export function createLspExtension(options: LspExtensionOptions = {}): (pi: ExtensionAPI) => void {
  return (pi: ExtensionAPI): void => {
    const serviceFactory =
      options.serviceFactory ??
      ((ctx: ExtensionContext) =>
        new LspManager({ cwd: ctx.cwd, trusted: ctx.isProjectTrusted() }));
    const inlineWaitMs = options.inlineWaitMs ?? DEFAULT_INLINE_WAIT_MS;
    let service: LspService | undefined;

    const ensureService = (ctx: ExtensionContext): LspService => {
      service ??= serviceFactory(ctx);
      return service;
    };

    const enrich = async <T extends { content: readonly unknown[] }>(
      current: LspService,
      cwd: string,
      result: T,
      path: string,
      text: string,
      snapshot: MutationSnapshot | undefined,
      signal: AbortSignal | undefined,
    ): Promise<T> => {
      const settle = async (): Promise<
        | { readonly diagnostics: readonly Diagnostic[]; readonly ok: true }
        | { readonly diagnostics: readonly Diagnostic[]; readonly ok: false }
      > => {
        try {
          return {
            diagnostics: await current.diagnoseMutation(path, text, snapshot, signal),
            ok: true,
          };
        } catch {
          return { diagnostics: [], ok: false };
        }
      };
      const settled = settle();
      const raced = await Promise.race([settled, timeout(inlineWaitMs)]);
      if (typeof raced === "symbol") {
        const deliverLate = async (): Promise<void> => {
          const late = await settled;
          if (!late.ok) return;
          const rendered = renderDiagnostics(late.diagnostics);
          if (!rendered) return;
          pi.sendMessage(
            {
              content: `Late diagnostics for ${relative(cwd, path)}:\n${rendered}`,
              customType: MESSAGE_TYPE,
              details: { path },
              display: true,
            },
            { deliverAs: "steer", triggerTurn: true },
          );
        };
        void deliverLate();
        return result;
      }
      return raced.ok ? appendDiagnostics(result, renderDiagnostics(raced.diagnostics)) : result;
    };

    pi.on("session_start", async (_event, ctx) => {
      if (service) await service.shutdown();
      service = serviceFactory(ctx);
      if (ctx.mode === "tui") ctx.ui.setStatus("lsp", "LSP: ready");
    });

    pi.on("session_shutdown", async (_event, ctx) => {
      const current = service;
      service = undefined;
      if (ctx.mode === "tui") ctx.ui.setStatus("lsp", undefined);
      await current?.shutdown();
    });

    pi.on("tool_result", (event, ctx) => {
      if (!isReadToolResult(event) || event.isError) return;
      const rawPath = event.input["path"];
      if (typeof rawPath !== "string") return;
      const path = normalizePath(ctx.cwd, rawPath);
      const warm = async (): Promise<void> => {
        try {
          await ensureService(ctx).warmFile(path, ctx.signal);
        } catch {
          // Language-server warmup is best effort after a successful read.
        }
      };
      void warm();
    });

    const write = createWriteToolDefinition(process.cwd());
    pi.registerTool({
      ...write,
      async execute(toolCallId, input, signal, onUpdate, ctx) {
        const path = normalizePath(ctx.cwd, input.path);
        const current = ensureService(ctx);
        const snapshot = await safeSnapshot(current, path);
        const result = await createWriteToolDefinition(ctx.cwd).execute(
          toolCallId,
          input,
          signal,
          onUpdate,
          ctx,
        );
        return enrich(current, ctx.cwd, result, path, input.content, snapshot, signal);
      },
    });

    const edit = createEditToolDefinition(process.cwd());
    pi.registerTool({
      ...edit,
      async execute(toolCallId, input, signal, onUpdate, ctx) {
        const path = normalizePath(ctx.cwd, input.path);
        const current = ensureService(ctx);
        const snapshot = await safeSnapshot(current, path);
        const result = await createEditToolDefinition(ctx.cwd).execute(
          toolCallId,
          input,
          signal,
          onUpdate,
          ctx,
        );
        let text: string;
        try {
          text = await readFile(path, "utf8");
        } catch {
          return result;
        }
        return enrich(current, ctx.cwd, result, path, text, snapshot, signal);
      },
    });

    pi.registerTool({
      name: "lsp_rename_file",
      label: "LSP Rename File",
      description:
        "Rename a file through workspace/willRenameFiles so imports, re-exports, barrel files, and aliases can be updated before the filesystem move.",
      executionMode: "sequential",
      promptSnippet: "Semantically rename files through the active language server",
      promptGuidelines: [
        "Use lsp_rename_file instead of bash mv, git mv, or write-plus-delete when moving a source file.",
        "Do not use lsp_rename_file unless the old and new paths are both inside the same trusted workspace.",
      ],
      parameters: RenameFileParameters,
      async execute(_toolCallId, input, signal, _onUpdate, ctx) {
        if (!ctx.isProjectTrusted()) {
          throw new Error("lsp_rename_file requires a trusted project.");
        }
        const outcome = await ensureService(ctx).renameFile(
          normalizePath(ctx.cwd, input.oldPath),
          normalizePath(ctx.cwd, input.newPath),
          signal,
        );
        return {
          content: [{ text: renameSummary(ctx.cwd, outcome), type: "text" }],
          details: {
            changedFiles: outcome.changedFiles.slice(0, 64),
            diagnosticCount: outcome.diagnostics.reduce(
              (count, group) => count + group.diagnostics.length,
              0,
            ),
            newPath: outcome.newPath,
            oldPath: outcome.oldPath,
            serverName: outcome.serverName,
            ...(outcome.warning ? { warning: outcome.warning } : {}),
          },
        };
      },
    });

    pi.registerCommand("lsp", {
      description: "Show detected language-server status",
      handler: (_arguments, ctx) => {
        const statuses = ensureService(ctx).status();
        const text =
          statuses.length === 0
            ? "No language servers have been needed in this session."
            : statuses
                .map(
                  (status) =>
                    `${status.name}: ${status.state}${status.root ? ` (${status.root})` : ""}${status.message ? ` — ${status.message}` : ""}`,
                )
                .join("\n");
        if (ctx.hasUI) ctx.ui.notify(text, "info");
        return Promise.resolve();
      },
    });
  };
}

export default createLspExtension();
