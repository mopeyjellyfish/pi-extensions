import { readFile, realpath } from "node:fs/promises";
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
import { renderQueryOutcome } from "./query.ts";
import { renderValidationOutcome } from "./validation.ts";

import type {
  CodeActionOutcome,
  LspService,
  MutationSnapshot,
  RenameOutcome,
  SymbolRenameOutcome,
} from "./manager.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Diagnostic } from "vscode-languageserver-protocol";

const DEFAULT_INLINE_WAIT_MS = 500;
const MAX_RENAME_OUTPUT_BYTES = 8192;
const MESSAGE_TYPE = "mopeyjellyfish-pi-lsp-diagnostics";
const UNICODE_SPACES = /[\u{A0}\u{2000}-\u{200A}\u{202F}\u{205F}\u{3000}]/gu;

const QueryOperation = Type.Union([
  Type.Literal("callHierarchyIncoming"),
  Type.Literal("callHierarchyOutgoing"),
  Type.Literal("declaration"),
  Type.Literal("definition"),
  Type.Literal("documentSymbols"),
  Type.Literal("hover"),
  Type.Literal("implementation"),
  Type.Literal("references"),
  Type.Literal("typeDefinition"),
  Type.Literal("typeHierarchySubtypes"),
  Type.Literal("typeHierarchySupertypes"),
  Type.Literal("workspaceSymbols"),
]);

const QueryParameters = Type.Object(
  {
    column: Type.Optional(
      Type.Integer({ description: "One-based UTF-16 column for position queries", minimum: 1 }),
    ),
    includeDeclaration: Type.Optional(
      Type.Boolean({ description: "Include the declaration in reference results" }),
    ),
    line: Type.Optional(
      Type.Integer({ description: "One-based line for position queries", minimum: 1 }),
    ),
    operation: QueryOperation,
    path: Type.Optional(
      Type.String({ description: "File path for document queries or workspace selection" }),
    ),
    query: Type.Optional(Type.String({ description: "Symbol search text for workspaceSymbols" })),
  },
  { additionalProperties: false },
);

const ValidateParameters = Type.Object(
  {
    paths: Type.Optional(
      Type.Array(Type.String({ description: "File path to validate" }), {
        description: "Document paths or workspace selectors",
        maxItems: 32,
      }),
    ),
    scope: Type.Union([Type.Literal("document"), Type.Literal("workspace")]),
    severity: Type.Optional(
      Type.Union([Type.Literal("error"), Type.Literal("warning"), Type.Literal("all")]),
    ),
  },
  { additionalProperties: false },
);

const CodeActionParameters = Type.Object(
  {
    column: Type.Optional(
      Type.Integer({ description: "One-based UTF-16 start column", minimum: 1 }),
    ),
    endColumn: Type.Optional(
      Type.Integer({ description: "One-based UTF-16 end column", minimum: 1 }),
    ),
    endLine: Type.Optional(Type.Integer({ description: "One-based end line", minimum: 1 })),
    kind: Type.Union([Type.Literal("quickfix"), Type.Literal("source.organizeImports")], {
      description: "Restricted code-action kind",
    }),
    line: Type.Optional(Type.Integer({ description: "One-based start line", minimum: 1 })),
    mode: Type.Union([Type.Literal("list"), Type.Literal("apply")], {
      description: "List fresh actions or apply one uniquely matching title",
    }),
    path: Type.String({ description: "File to request code actions for" }),
    title: Type.Optional(
      Type.String({
        description: "Exact fresh action title required by apply mode",
        maxLength: 512,
      }),
    ),
  },
  { additionalProperties: false },
);

const RenameSymbolParameters = Type.Object(
  {
    column: Type.Integer({ description: "One-based UTF-16 column of the symbol", minimum: 1 }),
    dryRun: Type.Optional(
      Type.Boolean({ description: "Preview affected files and edit counts without writing" }),
    ),
    line: Type.Integer({ description: "One-based line of the symbol", minimum: 1 }),
    newName: Type.String({ description: "New semantic symbol name", maxLength: 256, minLength: 1 }),
    path: Type.String({ description: "File containing the symbol" }),
  },
  { additionalProperties: false },
);

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

function listedCodeActions(outcome: CodeActionOutcome): string {
  const lines = [
    `${outcome.serverName} returned ${String(outcome.actions.length)} supported code action${outcome.actions.length === 1 ? "" : "s"}.`,
  ];
  for (const action of outcome.actions) {
    const flags = [
      action.isPreferred ? "preferred" : undefined,
      action.applicable ? "applicable" : "not applicable",
      action.disabledReason ? `disabled: ${action.disabledReason}` : undefined,
    ].filter((flag): flag is string => flag !== undefined);
    lines.push(`- ${action.title} [${action.kind || "unspecified"}; ${flags.join(", ")}]`);
  }
  return truncateHead(lines.join("\n"), { maxBytes: MAX_RENAME_OUTPUT_BYTES, maxLines: 80 })
    .content;
}

function appliedCodeAction(cwd: string, outcome: CodeActionOutcome): string {
  const editCount = outcome.changes.reduce((count, change) => count + change.editCount, 0);
  const lines = [
    `Applied ${outcome.actions[0]?.title ?? "LSP code action"} with ${outcome.serverName}.`,
    `${String(editCount)} edit${editCount === 1 ? "" : "s"} across ${String(outcome.changedFiles.length)} file${outcome.changedFiles.length === 1 ? "" : "s"}.`,
  ];
  for (const change of outcome.changes) {
    lines.push(
      `${relative(cwd, change.path)}: ${String(change.editCount)} edit${change.editCount === 1 ? "" : "s"}`,
    );
  }
  if (outcome.warning) lines.push(`Warning: ${outcome.warning}`);
  for (const group of outcome.diagnostics) {
    const rendered = renderDiagnostics(group.diagnostics);
    if (rendered) lines.push(`Diagnostics for ${relative(cwd, group.path)}:\n${rendered}`);
  }
  return truncateHead(lines.join("\n"), { maxBytes: MAX_RENAME_OUTPUT_BYTES, maxLines: 120 })
    .content;
}

function codeActionSummary(cwd: string, outcome: CodeActionOutcome): string {
  return outcome.applied ? appliedCodeAction(cwd, outcome) : listedCodeActions(outcome);
}

function symbolRenameSummary(cwd: string, outcome: SymbolRenameOutcome): string {
  const editCount = outcome.changes.reduce((count, change) => count + change.editCount, 0);
  const lines = [
    `${outcome.applied ? "Applied" : "Previewed"} semantic symbol rename with ${outcome.serverName}.`,
    `${String(editCount)} edit${editCount === 1 ? "" : "s"} across ${String(outcome.changedFiles.length)} file${outcome.changedFiles.length === 1 ? "" : "s"}.`,
  ];
  for (const change of outcome.changes) {
    lines.push(
      `${relative(cwd, change.path)}: ${String(change.editCount)} edit${change.editCount === 1 ? "" : "s"}, ${String(change.beforeBytes)} → ${String(change.afterBytes)} bytes`,
    );
  }
  if (outcome.warning) lines.push(`Warning: ${outcome.warning}`);
  for (const group of outcome.diagnostics) {
    const rendered = renderDiagnostics(group.diagnostics);
    if (rendered) lines.push(`Diagnostics for ${relative(cwd, group.path)}:\n${rendered}`);
  }
  return truncateHead(lines.join("\n"), { maxBytes: MAX_RENAME_OUTPUT_BYTES, maxLines: 120 })
    .content;
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
    const mutationQueues = new Map<string, Promise<void>>();
    let mutationRegistration = Promise.resolve();
    let service: LspService | undefined;

    const withMutationTransaction = async <T>(
      path: string,
      signal: AbortSignal | undefined,
      callback: () => Promise<T>,
    ): Promise<T> => {
      const previousRegistration = mutationRegistration;
      const registration = (async () => {
        await previousRegistration;
        let queueKey = path;
        try {
          queueKey = await realpath(path);
        } catch {
          // The built-in write tool may be creating a new path.
        }
        const previous = mutationQueues.get(queueKey) ?? Promise.resolve();
        const operation = (async (): Promise<T> => {
          await previous;
          if (signal?.aborted) throw new Error("LSP mutation transaction aborted.");
          return callback();
        })();
        const tail = (async (): Promise<void> => {
          try {
            await operation;
          } catch {
            // Failed transactions must not break the next queued mutation.
          }
        })();
        mutationQueues.set(queueKey, tail);
        return { operation, queueKey, tail };
      })();
      mutationRegistration = (async (): Promise<void> => {
        try {
          await registration;
        } catch {
          // Failed registrations must not block later mutation transactions.
        }
      })();
      const { operation, queueKey, tail } = await registration;
      try {
        return await operation;
      } finally {
        if (mutationQueues.get(queueKey) === tail) mutationQueues.delete(queueKey);
      }
    };

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
        return withMutationTransaction(path, signal, async () => {
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
        });
      },
    });

    const edit = createEditToolDefinition(process.cwd());
    pi.registerTool({
      ...edit,
      async execute(toolCallId, input, signal, onUpdate, ctx) {
        const path = normalizePath(ctx.cwd, input.path);
        return withMutationTransaction(path, signal, async () => {
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
        });
      },
    });

    pi.registerTool({
      name: "lsp_query",
      label: "LSP Query",
      description:
        "Query language-server semantics for navigation, references, hover information, symbols, incoming or outgoing calls, and subtype or supertype hierarchies.",
      promptSnippet:
        "Query semantic navigation, symbols, call graphs, and type hierarchies through the active language server",
      promptGuidelines: [
        "Use lsp_query for semantic definitions, references, implementations, symbols, call relationships, type hierarchies, and inferred type documentation when lexical search is ambiguous or expensive.",
        "Use one-based line and UTF-16 column values with lsp_query position operations.",
      ],
      parameters: QueryParameters,
      async execute(_toolCallId, input, signal, _onUpdate, ctx) {
        if (!ctx.isProjectTrusted()) throw new Error("lsp_query requires a trusted project.");
        const outcome = await ensureService(ctx).query(
          {
            ...(input.column === undefined ? {} : { column: input.column }),
            ...(input.includeDeclaration === undefined
              ? {}
              : { includeDeclaration: input.includeDeclaration }),
            ...(input.line === undefined ? {} : { line: input.line }),
            operation: input.operation,
            ...(input.path === undefined ? {} : { path: normalizePath(ctx.cwd, input.path) }),
            ...(input.query === undefined ? {} : { query: input.query }),
          },
          signal,
        );
        return {
          content: [{ text: renderQueryOutcome(ctx.cwd, outcome), type: "text" }],
          details: {
            items: outcome.items.slice(0, 100),
            omitted: outcome.omitted,
            operation: outcome.operation,
            serverNames: outcome.serverNames,
          },
        };
      },
    });

    pi.registerTool({
      name: "lsp_validate",
      label: "LSP Validate",
      description:
        "Explicitly validate documents or a language-server workspace using LSP 3.17 pull diagnostics when available and synchronized push diagnostics otherwise.",
      promptSnippet: "Validate current files or workspaces through language-server diagnostics",
      promptGuidelines: [
        "Use lsp_validate before finishing language-sensitive changes when focused compiler or test feedback is unavailable or when the server supports richer diagnostics.",
        "Prefer document-scoped lsp_validate calls; use workspace scope explicitly because workspace diagnostics may be broader and slower.",
      ],
      parameters: ValidateParameters,
      async execute(_toolCallId, input, signal, _onUpdate, ctx) {
        if (!ctx.isProjectTrusted()) throw new Error("lsp_validate requires a trusted project.");
        const outcome = await ensureService(ctx).validate(
          {
            ...(input.paths === undefined
              ? {}
              : { paths: input.paths.map((path) => normalizePath(ctx.cwd, path)) }),
            scope: input.scope,
            severity: input.severity ?? "error",
          },
          signal,
        );
        return {
          content: [{ text: renderValidationOutcome(ctx.cwd, outcome), type: "text" }],
          details: {
            diagnosticCount: outcome.diagnostics.reduce(
              (count, group) => count + group.diagnostics.length,
              0,
            ),
            files: outcome.diagnostics.map((group) => group.path).slice(0, 64),
            omitted: outcome.omitted,
            scope: outcome.scope,
            serverNames: outcome.serverNames,
          },
        };
      },
    });

    pi.registerTool({
      name: "lsp_code_action",
      label: "LSP Code Action",
      description:
        "List a fresh restricted set of language-server code actions or apply one exact, uniquely matched text-edit-only action.",
      executionMode: "sequential",
      promptSnippet: "List and apply safe quick fixes or organize-imports edits",
      promptGuidelines: [
        "List lsp_code_action results before apply and use the exact returned title.",
        "Only quickfix and source.organizeImports text-edit actions are supported; commands are rejected.",
      ],
      parameters: CodeActionParameters,
      async execute(_toolCallId, input, signal, _onUpdate, ctx) {
        if (!ctx.isProjectTrusted()) throw new Error("lsp_code_action requires a trusted project.");
        const outcome = await ensureService(ctx).codeAction(
          {
            ...(input.column === undefined ? {} : { column: input.column }),
            ...(input.endColumn === undefined ? {} : { endColumn: input.endColumn }),
            ...(input.endLine === undefined ? {} : { endLine: input.endLine }),
            kind: input.kind,
            ...(input.line === undefined ? {} : { line: input.line }),
            mode: input.mode,
            path: normalizePath(ctx.cwd, input.path),
            ...(input.title === undefined ? {} : { title: input.title }),
          },
          signal,
        );
        return {
          content: [{ text: codeActionSummary(ctx.cwd, outcome), type: "text" }],
          details: {
            actions: outcome.actions.slice(0, 32),
            applied: outcome.applied,
            changedFiles: outcome.changedFiles.slice(0, 64),
            changes: outcome.changes.slice(0, 64),
            diagnosticCount: outcome.diagnostics.reduce(
              (count, group) => count + group.diagnostics.length,
              0,
            ),
            serverName: outcome.serverName,
            ...(outcome.warning ? { warning: outcome.warning } : {}),
          },
        };
      },
    });

    pi.registerTool({
      name: "lsp_rename_symbol",
      label: "LSP Rename Symbol",
      description:
        "Prepare, preview, and apply a language-server semantic symbol rename through a validated multi-file WorkspaceEdit.",
      executionMode: "sequential",
      promptSnippet:
        "Preview and apply semantic identifier renames through the active language server",
      promptGuidelines: [
        "Call lsp_rename_symbol with dryRun true before applying a multi-file symbol rename.",
        "Use lsp_rename_symbol instead of textual replacement when changing an identifier across references.",
      ],
      parameters: RenameSymbolParameters,
      async execute(_toolCallId, input, signal, _onUpdate, ctx) {
        if (!ctx.isProjectTrusted()) {
          throw new Error("lsp_rename_symbol requires a trusted project.");
        }
        const outcome = await ensureService(ctx).renameSymbol(
          {
            column: input.column,
            dryRun: input.dryRun ?? true,
            line: input.line,
            newName: input.newName,
            path: normalizePath(ctx.cwd, input.path),
          },
          signal,
        );
        return {
          content: [{ text: symbolRenameSummary(ctx.cwd, outcome), type: "text" }],
          details: {
            applied: outcome.applied,
            changedFiles: outcome.changedFiles.slice(0, 64),
            changes: outcome.changes.slice(0, 64),
            diagnosticCount: outcome.diagnostics.reduce(
              (count, group) => count + group.diagnostics.length,
              0,
            ),
            serverName: outcome.serverName,
            ...(outcome.warning ? { warning: outcome.warning } : {}),
          },
        };
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
