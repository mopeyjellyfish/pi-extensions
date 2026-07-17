import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { watch as watchFilesystem } from "node:fs";
import { lstat, mkdir, readFile, realpath, rename } from "node:fs/promises";
import { dirname, isAbsolute, matchesGlob, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";

import { LspClient } from "./client.ts";
import { introducedDiagnostics } from "./diagnostics.ts";
import {
  normalizeDocumentSymbols,
  normalizeHover,
  normalizeIncomingCalls,
  normalizeLocations,
  normalizeOutgoingCalls,
  normalizeTypeHierarchy,
  normalizeWorkspaceSymbols,
  QUERY_ITEM_LIMIT,
  queryMethod,
  toLspPosition,
} from "./query.ts";
import {
  DEFAULT_SERVER_DEFINITIONS,
  findWorkspaceRoot,
  languageKey,
  resolveServerCommand,
} from "./servers.ts";
import { buildValidationOutcome } from "./validation.ts";
import { applyWorkspaceEdit } from "./workspace-edit.ts";

import type { DocumentSynchronization, LspClientOptions } from "./client.ts";
import type { LspQueryOutcome, LspQueryRequest } from "./query.ts";
import type { ServerDefinition } from "./servers.ts";
import type { ValidationOutcome, ValidationRequest } from "./validation.ts";
import type { WorkspaceEditFileChange } from "./workspace-edit.ts";
import type {
  CallHierarchyIncomingCall,
  CallHierarchyItem,
  CallHierarchyOutgoingCall,
  CodeAction,
  CodeActionContext,
  Command,
  Diagnostic,
  DocumentDiagnosticReport,
  DocumentSymbol,
  Hover,
  Location,
  LocationLink,
  SymbolInformation,
  TypeHierarchyItem,
  WorkspaceDiagnosticReport,
  WorkspaceDocumentDiagnosticReport,
  WorkspaceEdit,
  WorkspaceSymbol,
} from "vscode-languageserver-protocol";

const MAX_SYNC_FILE_BYTES = 2 * 1024 * 1024;
const MAX_PULL_CACHE_ENTRIES = 256;
const DIAGNOSTIC_WAIT_MS = 10_000;
const MAX_WATCHED_FILE_PATTERNS = 32;
const MAX_WATCHED_FILE_BATCH = 128;
const WATCHED_FILE_DEBOUNCE_MS = 50;

export interface MutationSnapshot {
  readonly diagnostics: readonly Diagnostic[];
  readonly text: string | undefined;
}

export interface FileDiagnostics {
  readonly diagnostics: readonly Diagnostic[];
  readonly path: string;
}

export type SupportedCodeActionKind = "quickfix" | "source.organizeImports";

export interface CodeActionRequest {
  readonly column?: number;
  readonly endColumn?: number;
  readonly endLine?: number;
  readonly kind: SupportedCodeActionKind;
  readonly line?: number;
  readonly mode: "apply" | "list";
  readonly path: string;
  readonly title?: string;
}

export interface CodeActionSummary {
  readonly applicable: boolean;
  readonly disabledReason?: string;
  readonly isPreferred: boolean;
  readonly kind: string;
  readonly title: string;
}

export interface CodeActionOutcome {
  readonly actions: readonly CodeActionSummary[];
  readonly applied: boolean;
  readonly changedFiles: readonly string[];
  readonly changes: readonly WorkspaceEditFileChange[];
  readonly diagnostics: readonly FileDiagnostics[];
  readonly serverName: string;
  readonly warning?: string;
}

export interface SymbolRenameRequest {
  readonly column: number;
  readonly dryRun: boolean;
  readonly line: number;
  readonly newName: string;
  readonly path: string;
}

export interface SymbolRenameOutcome {
  readonly applied: boolean;
  readonly changedFiles: readonly string[];
  readonly changes: readonly WorkspaceEditFileChange[];
  readonly diagnostics: readonly FileDiagnostics[];
  readonly serverName: string;
  readonly warning?: string;
}

export interface RenameOutcome {
  readonly changedFiles: readonly string[];
  readonly diagnostics: readonly FileDiagnostics[];
  readonly newPath: string;
  readonly oldPath: string;
  readonly serverName: string;
  readonly warning?: string;
}

export interface LspStatus {
  readonly id: string;
  readonly message?: string;
  readonly name: string;
  readonly root?: string;
  readonly state: "running" | "starting" | "unavailable" | "failed";
}

export interface LspService {
  codeAction(request: CodeActionRequest, signal?: AbortSignal): Promise<CodeActionOutcome>;
  diagnoseMutation(
    path: string,
    text: string,
    snapshot: MutationSnapshot | undefined,
    signal?: AbortSignal,
  ): Promise<readonly Diagnostic[]>;
  query(request: LspQueryRequest, signal?: AbortSignal): Promise<LspQueryOutcome>;
  renameFile(oldPath: string, newPath: string, signal?: AbortSignal): Promise<RenameOutcome>;
  renameSymbol(request: SymbolRenameRequest, signal?: AbortSignal): Promise<SymbolRenameOutcome>;
  shutdown(): Promise<void>;
  snapshot(path: string): Promise<MutationSnapshot | undefined>;
  status(): readonly LspStatus[];
  validate(request: ValidationRequest, signal?: AbortSignal): Promise<ValidationOutcome>;
  warmFile(path: string, signal?: AbortSignal): Promise<void>;
}

interface PreparedCodeActions {
  readonly actions: readonly CodeAction[];
  readonly expectedDocuments: ReadonlyMap<
    string,
    { readonly text: string; readonly version: number }
  >;
  readonly route: ClientRoute;
}

interface PullDiagnosticCacheEntry {
  readonly diagnostics: readonly Diagnostic[];
  readonly resultId?: string;
}

interface ClientRoute {
  readonly client: LspClient;
  readonly languageId: string;
}

export interface WorkspaceWatcher {
  close(): void;
  onError?(listener: (error: Error) => void): void;
}

export type WorkspaceWatchFactory = (
  root: string,
  listener: (eventType: string, filename: Buffer | string | null) => void,
) => WorkspaceWatcher;

interface WatchedFilePattern {
  readonly basePath: string;
  readonly glob: string;
  readonly kind: number;
}

interface WatchedFileState {
  readonly client: LspClient;
  eventQueue: Promise<void>;
  readonly patterns: readonly WatchedFilePattern[];
  readonly pending: Map<string, number>;
  timer?: ReturnType<typeof setTimeout>;
  readonly watcher: WorkspaceWatcher;
}

export interface LspManagerOptions {
  readonly clientFactory?: (options: LspClientOptions) => LspClient;
  readonly cwd: string;
  readonly diagnosticWaitMs?: number;
  readonly definitions?: readonly ServerDefinition[];
  readonly env?: NodeJS.ProcessEnv;
  readonly trusted: boolean;
  readonly watchFactory?: WorkspaceWatchFactory;
}

function isInside(root: string, target: string): boolean {
  const path = relative(root, target);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

function matches(definition: ServerDefinition, filePath: string): boolean {
  const key = languageKey(filePath);
  const base = filePath.slice(Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")) + 1);
  return definition.extensions.includes(key) || definition.filenames?.includes(base) === true;
}

function combinedSignal(session: AbortSignal, signal?: AbortSignal): AbortSignal {
  return signal === undefined ? session : AbortSignal.any([session, signal]);
}

function combineWarnings(...warnings: (string | undefined)[]): string | undefined {
  const combined = warnings.filter((warning): warning is string => warning !== undefined).join(" ");
  return combined || undefined;
}

function codeActionKindMatches(
  kind: string | undefined,
  requested: SupportedCodeActionKind,
): boolean {
  return kind === requested || kind?.startsWith(`${requested}.`) === true;
}

function asCodeAction(value: CodeAction | Command): CodeAction | undefined {
  if (typeof value.title !== "string" || value.title.length === 0 || value.title.length > 512) {
    return undefined;
  }
  const kind: unknown = "kind" in value ? value.kind : undefined;
  if (kind !== undefined && (typeof kind !== "string" || kind.length > 128)) return undefined;
  if ("command" in value && typeof value.command === "string") return undefined;
  return value as CodeAction;
}

function codeActionRange(
  text: string,
  request: CodeActionRequest,
): {
  readonly end: { readonly character: number; readonly line: number };
  readonly start: { readonly character: number; readonly line: number };
} {
  if (request.line === undefined && request.column === undefined) {
    if (request.endLine !== undefined || request.endColumn !== undefined) {
      throw new Error("LSP code action end positions require a start position.");
    }
    const lines = text.split("\n");
    const lastLine = lines.at(-1) ?? "";
    return {
      end: { character: lastLine.length, line: Math.max(0, lines.length - 1) },
      start: { character: 0, line: 0 },
    };
  }
  if (request.line === undefined || request.column === undefined) {
    throw new Error("LSP code actions require line and column together.");
  }
  if ((request.endLine === undefined) !== (request.endColumn === undefined)) {
    throw new Error("LSP code action endLine and endColumn must be provided together.");
  }
  const start = toLspPosition(text, request.line, request.column);
  const end =
    request.endLine === undefined || request.endColumn === undefined
      ? start
      : toLspPosition(text, request.endLine, request.endColumn);
  if (end.line < start.line || (end.line === start.line && end.character < start.character)) {
    throw new Error("LSP code action range must not be reversed.");
  }
  return { end, start };
}

function codeActionSummary(action: CodeAction, canResolve: boolean): CodeActionSummary {
  const disabledReason = action.disabled?.reason;
  return {
    applicable:
      disabledReason === undefined &&
      action.command === undefined &&
      (action.edit !== undefined || canResolve),
    ...(disabledReason ? { disabledReason: disabledReason.slice(0, 512) } : {}),
    isPreferred: action.isPreferred === true,
    kind: action.kind?.slice(0, 128) ?? "",
    title: action.title,
  };
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function watchedFileEvent(
  eventType: string,
  existsNow: boolean,
): { readonly mask: number; readonly type: number } {
  if (eventType === "change") return { mask: 2, type: 2 };
  return existsNow ? { mask: 1, type: 1 } : { mask: 4, type: 3 };
}

function watchedFileKind(value: unknown): number {
  const kind = value === undefined ? 7 : value;
  if (typeof kind !== "number" || !Number.isInteger(kind) || kind < 1 || kind > 7) {
    throw new TypeError("the server registered an invalid watcher kind");
  }
  return kind;
}

async function canonicalExistingAncestor(path: string): Promise<string> {
  let existing = resolve(path);
  while (!(await exists(existing))) {
    const parent = dirname(existing);
    if (parent === existing) throw new Error("no existing watcher base ancestor was found");
    existing = parent;
  }
  return realpath(existing);
}

async function watchedFilePattern(
  canonicalRoot: string,
  displayRoot: string,
  value: unknown,
): Promise<WatchedFilePattern> {
  const watcher = recordValue(value);
  if (watcher === undefined) throw new TypeError("the server registered a malformed watcher");
  const globPattern = watcher["globPattern"];
  const kind = watchedFileKind(watcher["kind"]);
  const relativePattern = recordValue(globPattern);
  let basePath = displayRoot;
  let glob: unknown = globPattern;
  if (relativePattern !== undefined) {
    glob = relativePattern["pattern"];
    const baseUri = relativePattern["baseUri"];
    const uri = typeof baseUri === "string" ? baseUri : recordValue(baseUri)?.["uri"];
    if (typeof uri !== "string") {
      throw new TypeError("the server registered an invalid watcher base URI");
    }
    const url = new URL(uri);
    if (url.protocol !== "file:") throw new TypeError("the watcher base URI is not a file URI");
    basePath = resolve(fileURLToPath(url));
    if (!isInside(displayRoot, basePath)) {
      throw new Error("the watcher base URI escapes the workspace");
    }
    const canonicalBase = await canonicalExistingAncestor(basePath);
    if (!isInside(canonicalRoot, canonicalBase)) {
      throw new Error("the watcher base URI escapes the workspace");
    }
  }
  if (typeof glob !== "string" || glob.length === 0 || glob.length > 512) {
    throw new TypeError("the server registered an invalid watcher glob");
  }
  matchesGlob("probe.ts", glob);
  return { basePath, glob, kind };
}

function pathFromDocumentUri(uri: string): string {
  try {
    return fileURLToPath(uri);
  } catch {
    return uri;
  }
}

async function waitForSharedOperation<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal === undefined) return operation;
  if (signal.aborted) throw new Error("LSP operation aborted.");
  const cleanup = new AbortController();
  const cancelled = (async (): Promise<never> => {
    await once(signal, "abort", { signal: cleanup.signal });
    throw new Error("LSP operation aborted.");
  })();
  try {
    return await Promise.race([operation, cancelled]);
  } finally {
    cleanup.abort();
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

export class LspManager implements LspService {
  readonly #cwd: string;
  readonly #trusted: boolean;
  readonly #definitions: readonly ServerDefinition[];
  readonly #diagnosticWaitMs: number;
  readonly #env: NodeJS.ProcessEnv;
  readonly #clientFactory: (options: LspClientOptions) => LspClient;
  readonly #watchFactory: WorkspaceWatchFactory;
  readonly #clients = new Map<string, LspClient>();
  readonly #starting = new Map<string, Promise<LspClient | undefined>>();
  readonly #broken = new Set<string>();
  readonly #unavailable = new Set<string>();
  readonly #statuses = new Map<string, LspStatus>();
  readonly #pendingDiagnostics = new Map<string, AbortController>();
  readonly #pullDiagnostics = new Map<LspClient, Map<string, PullDiagnosticCacheEntry>>();
  readonly #pullRefreshSequences = new Map<LspClient, number>();
  readonly #baselines = new Map<string, LspClient>();
  readonly #warming = new Map<string, Promise<void>>();
  readonly #watchedFiles = new Map<string, WatchedFileState>();
  readonly #watchRefreshes = new Map<string, Promise<void>>();
  readonly #watchWarnings = new Map<string, string>();
  readonly #session = new AbortController();

  constructor(options: LspManagerOptions) {
    this.#cwd = resolve(options.cwd);
    this.#trusted = options.trusted;
    this.#definitions = options.definitions ?? DEFAULT_SERVER_DEFINITIONS;
    this.#diagnosticWaitMs = options.diagnosticWaitMs ?? DIAGNOSTIC_WAIT_MS;
    this.#env = options.env ?? process.env;
    this.#clientFactory =
      options.clientFactory ?? ((clientOptions) => new LspClient(clientOptions));
    this.#watchFactory =
      options.watchFactory ??
      ((root, listener) => {
        const watcher = watchFilesystem(root, { persistent: false, recursive: true }, listener);
        return {
          close: () => {
            watcher.close();
          },
          onError: (onError) => {
            watcher.on("error", onError);
          },
        };
      });
  }

  status(): readonly LspStatus[] {
    return [...this.#statuses]
      .map(([key, status]) => {
        const warning = this.#watchWarnings.get(key);
        return warning === undefined || status.state !== "running"
          ? status
          : { ...status, message: warning };
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async snapshot(path: string): Promise<MutationSnapshot | undefined> {
    const absolutePath = resolve(path);
    await this.#warming.get(absolutePath);
    const client = this.#baselines.get(absolutePath);
    if (client === undefined) return undefined;
    const uri = pathToFileURL(absolutePath).href;
    const text = client.documentText(uri);
    if (text === undefined) return undefined;
    return { diagnostics: client.diagnostics(uri), text };
  }

  async warmFile(path: string, signal?: AbortSignal): Promise<void> {
    const absolutePath = resolve(path);
    let operation = this.#warming.get(absolutePath);
    if (operation === undefined) {
      operation = (async (): Promise<void> => {
        try {
          await this.#warmFile(absolutePath);
        } finally {
          if (this.#warming.get(absolutePath) === operation) {
            this.#warming.delete(absolutePath);
          }
        }
      })();
      this.#warming.set(absolutePath, operation);
    }
    await waitForSharedOperation(operation, signal);
  }

  async #warmFile(absolutePath: string): Promise<void> {
    const operationSignal = this.#session.signal;
    const content = await readFile(absolutePath, "utf8");
    if (Buffer.byteLength(content, "utf8") > MAX_SYNC_FILE_BYTES) return;
    const resolved = await this.#clientForFile(absolutePath, operationSignal);
    if (resolved === undefined) return;
    const synchronization = await resolved.client.syncDocument(
      absolutePath,
      resolved.languageId,
      content,
    );
    const result = await resolved.client.freshDiagnosticsResult(
      synchronization,
      operationSignal,
      this.#diagnosticWaitMs,
    );
    if (result.observed) this.#baselines.set(absolutePath, resolved.client);
    else this.#baselines.delete(absolutePath);
  }

  async diagnoseMutation(
    path: string,
    text: string,
    snapshot: MutationSnapshot | undefined,
    signal?: AbortSignal,
  ): Promise<readonly Diagnostic[]> {
    if (Buffer.byteLength(text, "utf8") > MAX_SYNC_FILE_BYTES) return [];
    const absolutePath = resolve(path);
    this.#pendingDiagnostics.get(absolutePath)?.abort();
    const controller = new AbortController();
    this.#pendingDiagnostics.set(absolutePath, controller);
    const operationSignal = combinedSignal(
      combinedSignal(this.#session.signal, controller.signal),
      signal,
    );
    try {
      const resolved = await this.#clientForFile(absolutePath, operationSignal);
      if (resolved === undefined) return [];
      const synchronization = await resolved.client.syncDocument(
        absolutePath,
        resolved.languageId,
        text,
      );
      const result = await resolved.client.freshDiagnosticsResult(
        synchronization,
        operationSignal,
        this.#diagnosticWaitMs,
      );
      if (!result.observed) {
        this.#baselines.delete(absolutePath);
        return [];
      }
      this.#baselines.set(absolutePath, resolved.client);
      if (snapshot === undefined) return [];
      return introducedDiagnostics(snapshot.diagnostics, result.diagnostics, snapshot.text, text);
    } finally {
      if (this.#pendingDiagnostics.get(absolutePath) === controller) {
        this.#pendingDiagnostics.delete(absolutePath);
      }
    }
  }

  async codeAction(request: CodeActionRequest, signal?: AbortSignal): Promise<CodeActionOutcome> {
    if (!this.#trusted) throw new Error("LSP code actions require a trusted project.");
    if (request.mode === "apply" && !request.title) {
      throw new Error("Applying an LSP code action requires its exact title.");
    }
    const operationSignal = combinedSignal(this.#session.signal, signal);
    const prepared = await this.#requestCodeActions(request, operationSignal);
    if (request.mode === "list") return this.#listedCodeActions(prepared);
    const title = request.title;
    if (!title) throw new Error("Applying an LSP code action requires its exact title.");
    const selected = this.#selectCodeAction(prepared.actions, title);
    const resolved = await this.#resolveCodeAction(
      selected,
      request.kind,
      title,
      prepared.route.client,
      operationSignal,
    );
    return this.#applyCodeAction(resolved, prepared, operationSignal);
  }

  async #requestCodeActions(
    request: CodeActionRequest,
    signal: AbortSignal,
  ): Promise<PreparedCodeActions> {
    return this.#withSynchronizedDocument(request.path, signal, async (route, text, uri) => {
      if (!route.client.supportsCodeActions()) {
        throw new Error(`${route.client.name} does not support textDocument/codeAction.`);
      }
      const expectedDocuments = await this.#snapshotClientDocuments(route.client);
      const context: CodeActionContext = {
        diagnostics: route.client.diagnostics(uri).slice(0, 64),
        only: [request.kind],
        triggerKind: 1,
      };
      const response = await route.client.request<readonly (CodeAction | Command)[] | null>(
        "textDocument/codeAction",
        {
          context,
          range: codeActionRange(text, request),
          textDocument: { uri },
        },
        signal,
      );
      const responseItems = response ?? [];
      if (responseItems.length > 256) {
        throw new Error("The LSP code action response exceeds the 256 action limit.");
      }
      const actions = responseItems
        .map((item) => asCodeAction(item))
        .filter(
          (item): item is CodeAction =>
            item !== undefined && codeActionKindMatches(item.kind, request.kind),
        );
      return { actions, expectedDocuments, route };
    });
  }

  #listedCodeActions(prepared: PreparedCodeActions): CodeActionOutcome {
    return {
      actions: prepared.actions
        .slice(0, 32)
        .map((action) =>
          codeActionSummary(action, prepared.route.client.supportsCodeActionResolve()),
        ),
      applied: false,
      changedFiles: [],
      changes: [],
      diagnostics: [],
      serverName: prepared.route.client.name,
    };
  }

  #selectCodeAction(actions: readonly CodeAction[], title: string): CodeAction {
    const matches = actions.filter((action) => action.title === title);
    if (matches.length === 0) {
      throw new Error("No matching supported LSP code action was returned by the fresh request.");
    }
    if (matches.length !== 1) {
      throw new Error("The fresh LSP code action request returned more than one matching title.");
    }
    const selected = matches[0];
    if (selected === undefined) throw new Error("The selected LSP code action is unavailable.");
    return selected;
  }

  async #resolveCodeAction(
    selected: CodeAction,
    kind: SupportedCodeActionKind,
    title: string,
    client: LspClient,
    signal: AbortSignal,
  ): Promise<CodeAction & { readonly edit: WorkspaceEdit }> {
    this.#assertApplicableCodeAction(selected);
    if (selected.edit !== undefined)
      return selected as CodeAction & { readonly edit: WorkspaceEdit };
    if (!client.supportsCodeActionResolve()) {
      throw new Error("The selected LSP code action does not contain a text edit.");
    }
    const response = await client.request<CodeAction>("codeAction/resolve", selected, signal);
    const resolved = asCodeAction(response);
    if (resolved === undefined) {
      throw new Error("The resolved LSP code action is malformed or exceeds output limits.");
    }
    if (resolved.title !== title || !codeActionKindMatches(resolved.kind, kind)) {
      throw new Error("The resolved LSP code action changed its title or supported kind.");
    }
    this.#assertApplicableCodeAction(resolved);
    if (resolved.edit === undefined) {
      throw new Error("The selected LSP code action did not resolve to a text edit.");
    }
    return resolved as CodeAction & { readonly edit: WorkspaceEdit };
  }

  #assertApplicableCodeAction(action: CodeAction): void {
    if (action.disabled) {
      throw new Error(
        `The selected LSP code action is disabled: ${action.disabled.reason.slice(0, 512)}`,
      );
    }
    if (action.command !== undefined) {
      throw new Error("LSP code actions containing commands are not supported.");
    }
  }

  async #applyCodeAction(
    selected: CodeAction & { readonly edit: WorkspaceEdit },
    prepared: PreparedCodeActions,
    signal: AbortSignal,
  ): Promise<CodeActionOutcome> {
    const transaction = await applyWorkspaceEdit(selected.edit, prepared.route.client.root, {
      documentState: (path) => this.#documentStateForClientPath(prepared.route.client, path),
      expectedDocumentState: (path) => prepared.expectedDocuments.get(path),
      signal,
    });
    for (const path of transaction.changedFiles) this.#baselines.delete(resolve(path));
    const warning = (await this.#synchronizeChangedFiles(transaction.changedFiles, signal)).at(0);
    const diagnostics = warning
      ? []
      : await this.#collectDiagnostics(transaction.changedFiles, signal);
    return {
      actions: [codeActionSummary(selected, false)],
      applied: true,
      changedFiles: transaction.changedFiles,
      changes: transaction.changes,
      diagnostics,
      serverName: prepared.route.client.name,
      ...(warning ? { warning } : {}),
    };
  }

  async query(request: LspQueryRequest, signal?: AbortSignal): Promise<LspQueryOutcome> {
    if (!this.#trusted) throw new Error("LSP queries require a trusted project.");
    const operationSignal = combinedSignal(this.#session.signal, signal);
    if (request.operation === "workspaceSymbols") {
      const query = request.query?.trim();
      if (query === undefined) throw new Error("workspaceSymbols requires a query string.");
      if (request.path !== undefined) {
        return this.#withSynchronizedDocument(request.path, operationSignal, (route) =>
          this.#queryWorkspaceSymbols([route.client], query, operationSignal),
        );
      }
      const clients = [...new Set(this.#clients.values())].slice(0, 8);
      return this.#queryWorkspaceSymbols(clients, query, operationSignal);
    }
    if (request.path === undefined) throw new Error(`${request.operation} requires a path.`);
    return this.#withSynchronizedDocument(request.path, operationSignal, (route, text, uri) =>
      this.#queryDocument(route, text, uri, request, operationSignal),
    );
  }

  async #withSynchronizedDocument<T>(
    path: string,
    signal: AbortSignal,
    callback: (
      route: ClientRoute,
      text: string,
      uri: string,
      synchronization: DocumentSynchronization,
    ) => Promise<T>,
  ): Promise<T> {
    const absolutePath = resolve(path);
    if (!(await this.#isTrustedPath(absolutePath))) {
      throw new Error("LSP query path must remain inside the trusted project.");
    }
    return withFileMutationQueue(absolutePath, async () => {
      if (signal.aborted) throw new Error("LSP query aborted.");
      const text = await readFile(absolutePath, "utf8");
      if (Buffer.byteLength(text, "utf8") > MAX_SYNC_FILE_BYTES) {
        throw new Error(`LSP query file exceeds ${String(MAX_SYNC_FILE_BYTES)} bytes.`);
      }
      const route = await this.#clientForFile(absolutePath, signal);
      if (route === undefined) throw new Error(`No installed LSP server is available for ${path}.`);
      const synchronization = await route.client.syncDocument(absolutePath, route.languageId, text);
      return callback(route, text, pathToFileURL(absolutePath).href, synchronization);
    });
  }

  async #queryDocument(
    route: ClientRoute,
    text: string,
    uri: string,
    request: LspQueryRequest,
    signal: AbortSignal,
  ): Promise<LspQueryOutcome> {
    if (!route.client.supportsQuery(request.operation)) {
      throw new Error(`${route.client.name} does not support ${queryMethod(request.operation)}.`);
    }
    const base = { textDocument: { uri } };
    if (request.operation === "documentSymbols") {
      const raw = await route.client.request<
        readonly DocumentSymbol[] | readonly SymbolInformation[] | null
      >(queryMethod(request.operation), base, signal);
      return {
        items: normalizeDocumentSymbols(raw, fileURLToPath(uri)),
        omitted: 0,
        operation: request.operation,
        serverNames: [route.client.name],
      };
    }
    if (request.line === undefined || request.column === undefined) {
      throw new Error(`${request.operation} requires line and column.`);
    }
    const position = toLspPosition(text, request.line, request.column);
    if (
      request.operation === "callHierarchyIncoming" ||
      request.operation === "callHierarchyOutgoing"
    ) {
      return this.#queryCallHierarchy(route, uri, position, request.operation, signal);
    }
    if (
      request.operation === "typeHierarchySubtypes" ||
      request.operation === "typeHierarchySupertypes"
    ) {
      return this.#queryTypeHierarchy(route, uri, position, request.operation, signal);
    }
    if (request.operation === "hover") {
      const raw = await route.client.request<Hover | null>(
        queryMethod(request.operation),
        { ...base, position },
        signal,
      );
      const hover = normalizeHover(raw);
      return {
        ...(hover === undefined ? {} : { hover }),
        items: [],
        omitted: 0,
        operation: request.operation,
        serverNames: [route.client.name],
      };
    }
    const params =
      request.operation === "references"
        ? {
            ...base,
            context: { includeDeclaration: request.includeDeclaration ?? true },
            position,
          }
        : { ...base, position };
    const raw = await route.client.request<
      Location | readonly Location[] | readonly LocationLink[] | null
    >(queryMethod(request.operation), params, signal);
    const items = normalizeLocations(raw, request.operation);
    const count = raw === null ? 0 : Array.isArray(raw) ? raw.length : 1;
    return {
      items,
      omitted: Math.max(0, count - items.length),
      operation: request.operation,
      serverNames: [route.client.name],
    };
  }

  async #queryCallHierarchy(
    route: ClientRoute,
    uri: string,
    position: { readonly character: number; readonly line: number },
    operation: "callHierarchyIncoming" | "callHierarchyOutgoing",
    signal: AbortSignal,
  ): Promise<LspQueryOutcome> {
    const prepared = await route.client.request<readonly CallHierarchyItem[] | null>(
      "textDocument/prepareCallHierarchy",
      { position, textDocument: { uri } },
      signal,
    );
    if ((prepared?.length ?? 0) > 8) {
      throw new Error("The LSP call hierarchy prepare response exceeds the 8 root limit.");
    }
    const roots = prepared ?? [];
    const items: LspQueryOutcome["items"][number][] = [];
    let omitted = 0;
    for (const item of roots) {
      const incoming = operation === "callHierarchyIncoming";
      const raw = incoming
        ? await route.client.request<readonly CallHierarchyIncomingCall[] | null>(
            "callHierarchy/incomingCalls",
            { item },
            signal,
          )
        : await route.client.request<readonly CallHierarchyOutgoingCall[] | null>(
            "callHierarchy/outgoingCalls",
            { item },
            signal,
          );
      const normalized = incoming
        ? normalizeIncomingCalls(raw as readonly CallHierarchyIncomingCall[] | null)
        : normalizeOutgoingCalls(raw as readonly CallHierarchyOutgoingCall[] | null);
      const accepted = normalized.slice(0, Math.max(0, QUERY_ITEM_LIMIT - items.length));
      items.push(...accepted);
      omitted += Math.max(0, (raw?.length ?? 0) - accepted.length);
    }
    return {
      items,
      omitted,
      operation,
      serverNames: [route.client.name],
    };
  }

  async #queryTypeHierarchy(
    route: ClientRoute,
    uri: string,
    position: { readonly character: number; readonly line: number },
    operation: "typeHierarchySubtypes" | "typeHierarchySupertypes",
    signal: AbortSignal,
  ): Promise<LspQueryOutcome> {
    const prepared = await route.client.request<readonly TypeHierarchyItem[] | null>(
      "textDocument/prepareTypeHierarchy",
      { position, textDocument: { uri } },
      signal,
    );
    if ((prepared?.length ?? 0) > 8) {
      throw new Error("The LSP type hierarchy prepare response exceeds the 8 root limit.");
    }
    const roots = prepared ?? [];
    const items: LspQueryOutcome["items"][number][] = [];
    let omitted = 0;
    for (const item of roots) {
      const subtypes = operation === "typeHierarchySubtypes";
      const raw = await route.client.request<readonly TypeHierarchyItem[] | null>(
        subtypes ? "typeHierarchy/subtypes" : "typeHierarchy/supertypes",
        { item },
        signal,
      );
      const normalized = normalizeTypeHierarchy(raw, subtypes ? "subtype" : "supertype");
      const accepted = normalized.slice(0, Math.max(0, QUERY_ITEM_LIMIT - items.length));
      items.push(...accepted);
      omitted += Math.max(0, (raw?.length ?? 0) - accepted.length);
    }
    return {
      items,
      omitted,
      operation,
      serverNames: [route.client.name],
    };
  }

  async #queryWorkspaceSymbols(
    clients: readonly LspClient[],
    query: string,
    signal: AbortSignal,
  ): Promise<LspQueryOutcome> {
    const supported = clients.filter((client) => client.supportsQuery("workspaceSymbols"));
    if (supported.length === 0) {
      throw new Error("No running language server supports workspace/symbol.");
    }
    const settled = await Promise.allSettled(
      supported.map((client) =>
        client.request<readonly (SymbolInformation | WorkspaceSymbol)[] | null>(
          queryMethod("workspaceSymbols"),
          { query },
          signal,
        ),
      ),
    );
    const items = [] as ReturnType<typeof normalizeWorkspaceSymbols>[number][];
    let omitted = 0;
    const seen = new Set<string>();
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      const normalized = normalizeWorkspaceSymbols(result.value);
      const rawCount = result.value?.length ?? 0;
      omitted += Math.max(0, rawCount - normalized.length);
      for (const item of normalized) {
        const key = JSON.stringify(item);
        if (seen.has(key)) continue;
        seen.add(key);
        if (items.length >= QUERY_ITEM_LIMIT) {
          omitted += 1;
          continue;
        }
        items.push(item);
      }
    }
    return {
      items,
      omitted,
      operation: "workspaceSymbols",
      serverNames: supported.map((client) => client.name),
    };
  }

  async validate(request: ValidationRequest, signal?: AbortSignal): Promise<ValidationOutcome> {
    if (!this.#trusted) throw new Error("LSP validation requires a trusted project.");
    const paths = request.paths === undefined ? [] : [...new Set(request.paths)];
    if (paths.length > 32) throw new Error("LSP validation accepts at most 32 paths.");
    const operationSignal = combinedSignal(this.#session.signal, signal);
    if (request.scope === "document") {
      if (paths.length === 0) throw new Error("Document validation requires at least one path.");
      const groups: FileDiagnostics[] = [];
      const serverNames: string[] = [];
      for (const path of paths) {
        const result = await this.#withSynchronizedDocument(
          path,
          operationSignal,
          async (route, _text, uri, synchronization) => {
            serverNames.push(route.client.name);
            if (route.client.supportsDocumentDiagnostics()) {
              return this.#pullDocumentDiagnostics(route.client, uri, operationSignal);
            }
            const published = await route.client.freshDiagnosticsResult(
              synchronization,
              operationSignal,
              this.#diagnosticWaitMs,
              true,
            );
            return published.observed
              ? [{ diagnostics: published.diagnostics, path: pathFromDocumentUri(uri) }]
              : [];
          },
        );
        groups.push(...result);
      }
      return buildValidationOutcome(request.scope, request.severity, serverNames, groups);
    }
    const clients = new Set<LspClient>();
    for (const path of paths) {
      await this.#withSynchronizedDocument(path, operationSignal, (route) => {
        clients.add(route.client);
        return Promise.resolve();
      });
    }
    if (paths.length === 0) {
      for (const client of this.#clients.values()) clients.add(client);
    }
    const supported = [...clients].filter((client) => client.supportsWorkspaceDiagnostics());
    if (supported.length === 0) {
      throw new Error("No running language server supports workspace diagnostics.");
    }
    const groups: FileDiagnostics[] = [];
    for (const client of supported) {
      groups.push(...(await this.#pullWorkspaceDiagnostics(client, operationSignal)));
    }
    return buildValidationOutcome(
      request.scope,
      request.severity,
      supported.map((client) => client.name),
      groups,
    );
  }

  #pullCache(client: LspClient): Map<string, PullDiagnosticCacheEntry> {
    const refreshSequence = client.diagnosticRefreshSequence;
    if (this.#pullRefreshSequences.get(client) !== refreshSequence) {
      this.#pullDiagnostics.set(client, new Map());
      this.#pullRefreshSequences.set(client, refreshSequence);
    }
    let cache = this.#pullDiagnostics.get(client);
    if (cache === undefined) {
      cache = new Map();
      this.#pullDiagnostics.set(client, cache);
    }
    return cache;
  }

  #consumeDiagnosticReport(
    client: LspClient,
    uri: string,
    report: DocumentDiagnosticReport | WorkspaceDocumentDiagnosticReport,
  ): FileDiagnostics {
    const cache = this.#pullCache(client);
    if (!cache.has(uri) && cache.size >= MAX_PULL_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (typeof oldest === "string") cache.delete(oldest);
    }
    if (report.kind === "unchanged") {
      const previous = cache.get(uri);
      const diagnostics = previous?.diagnostics ?? [];
      cache.set(uri, { diagnostics, resultId: report.resultId });
      return { diagnostics, path: pathFromDocumentUri(uri) };
    }
    const entry: PullDiagnosticCacheEntry = {
      diagnostics: report.items,
      ...(report.resultId === undefined ? {} : { resultId: report.resultId }),
    };
    cache.set(uri, entry);
    return { diagnostics: entry.diagnostics, path: pathFromDocumentUri(uri) };
  }

  async #pullDocumentDiagnostics(
    client: LspClient,
    uri: string,
    signal: AbortSignal,
  ): Promise<FileDiagnostics[]> {
    const previous = this.#pullCache(client).get(uri);
    const identifier = client.diagnosticIdentifier();
    const report = await client.request<DocumentDiagnosticReport>(
      "textDocument/diagnostic",
      {
        ...(identifier === undefined ? {} : { identifier }),
        ...(previous?.resultId === undefined ? {} : { previousResultId: previous.resultId }),
        textDocument: { uri },
      },
      signal,
    );
    const groups = [this.#consumeDiagnosticReport(client, uri, report)];
    const relatedDocuments = "relatedDocuments" in report ? report.relatedDocuments : undefined;
    if (relatedDocuments !== undefined) {
      for (const [relatedUri, related] of Object.entries(relatedDocuments).slice(
        0,
        MAX_PULL_CACHE_ENTRIES,
      )) {
        groups.push(this.#consumeDiagnosticReport(client, relatedUri, related));
      }
    }
    return groups;
  }

  async #pullWorkspaceDiagnostics(
    client: LspClient,
    signal: AbortSignal,
  ): Promise<FileDiagnostics[]> {
    const cache = this.#pullCache(client);
    const identifier = client.diagnosticIdentifier();
    const report = await client.request<WorkspaceDiagnosticReport>(
      "workspace/diagnostic",
      {
        ...(identifier === undefined ? {} : { identifier }),
        previousResultIds: [...cache]
          .filter(
            (entry): entry is [string, PullDiagnosticCacheEntry & { resultId: string }] =>
              entry[1].resultId !== undefined,
          )
          .map(([uri, entry]) => ({ uri, value: entry.resultId })),
      },
      signal,
    );
    return report.items
      .slice(0, MAX_PULL_CACHE_ENTRIES)
      .map((item) => this.#consumeDiagnosticReport(client, item.uri, item));
  }

  async renameSymbol(
    request: SymbolRenameRequest,
    signal?: AbortSignal,
  ): Promise<SymbolRenameOutcome> {
    if (!this.#trusted) throw new Error("LSP symbol rename requires a trusted project.");
    if (!request.newName || request.newName.length > 256) {
      throw new Error("LSP symbol rename requires a non-empty name of at most 256 characters.");
    }
    const operationSignal = combinedSignal(this.#session.signal, signal);
    const prepared = await this.#withSynchronizedDocument(
      request.path,
      operationSignal,
      async (route, text, uri) => {
        if (!route.client.supportsSymbolRename()) {
          throw new Error(`${route.client.name} does not support textDocument/rename.`);
        }
        const position = toLspPosition(text, request.line, request.column);
        const expectedDocuments = await this.#snapshotClientDocuments(route.client);
        if (route.client.supportsPrepareRename()) {
          const prepareResult = await route.client.request<unknown>(
            "textDocument/prepareRename",
            { position, textDocument: { uri } },
            operationSignal,
          );
          if (prepareResult === null) throw new Error("The selected symbol cannot be renamed.");
        }
        const workspaceEdit = await route.client.request<WorkspaceEdit | null>(
          "textDocument/rename",
          { newName: request.newName, position, textDocument: { uri } },
          operationSignal,
        );
        return { expectedDocuments, route, workspaceEdit };
      },
    );
    const transaction = await applyWorkspaceEdit(
      prepared.workspaceEdit,
      prepared.route.client.root,
      {
        documentState: (path) => this.#documentStateForClientPath(prepared.route.client, path),
        dryRun: request.dryRun,
        expectedDocumentState: (path) => prepared.expectedDocuments.get(path),
        signal: operationSignal,
      },
    );
    if (request.dryRun) {
      return {
        applied: false,
        changedFiles: transaction.changedFiles,
        changes: transaction.changes,
        diagnostics: [],
        serverName: prepared.route.client.name,
      };
    }
    for (const path of transaction.changedFiles) this.#baselines.delete(resolve(path));
    const warning = (
      await this.#synchronizeChangedFiles(transaction.changedFiles, operationSignal)
    ).at(0);
    const diagnostics = warning
      ? []
      : await this.#collectDiagnostics(transaction.changedFiles, operationSignal);
    return {
      applied: true,
      changedFiles: transaction.changedFiles,
      changes: transaction.changes,
      diagnostics,
      serverName: prepared.route.client.name,
      ...(warning ? { warning } : {}),
    };
  }

  async renameFile(oldPath: string, newPath: string, signal?: AbortSignal): Promise<RenameOutcome> {
    const oldAbsolute = resolve(oldPath);
    const newAbsolute = resolve(newPath);
    if (oldAbsolute === newAbsolute) throw new Error("The old and new paths are identical.");
    if (!(await this.#isTrustedPath(oldAbsolute)) || !(await this.#isTrustedPath(newAbsolute))) {
      throw new Error("LSP semantic renames must remain inside the trusted project.");
    }
    const operationSignal = combinedSignal(this.#session.signal, signal);
    const resolved = await this.#clientForFile(oldAbsolute, operationSignal);
    if (resolved === undefined) {
      const definitions = this.#definitions.filter((definition) =>
        matches(definition, oldAbsolute),
      );
      const hints = definitions.map((definition) => definition.installHint).join(" ");
      throw new Error(
        `No installed LSP server is available for ${oldPath}.${hints ? ` ${hints}` : ""}`,
      );
    }
    const { destination, intermediatePath } = await this.#prepareRenameDestination(
      resolved,
      oldAbsolute,
      newAbsolute,
      newPath,
      operationSignal,
    );
    const oldContent = await readFile(oldAbsolute, "utf8");
    await resolved.client.syncDocument(oldAbsolute, resolved.languageId, oldContent);
    const expectedDocuments = await this.#snapshotClientDocuments(resolved.client);
    const workspaceEdit = await resolved.client.willRenameFiles(
      oldAbsolute,
      newAbsolute,
      operationSignal,
    );
    const transaction = await this.#applySemanticRename(
      workspaceEdit,
      resolved.client.root,
      resolved.client,
      oldAbsolute,
      newAbsolute,
      operationSignal,
      expectedDocuments,
      intermediatePath,
    );

    const synchronizedPaths = transaction.changedFiles.map((path) =>
      resolve(path) === oldAbsolute ? newAbsolute : path,
    );
    const affected = [...new Set([oldAbsolute, newAbsolute, ...synchronizedPaths])];
    for (const path of affected) this.#baselines.delete(path);
    let notificationWarning: string | undefined;
    try {
      await resolved.client.didRenameFiles(oldAbsolute, newAbsolute, destination.languageId);
    } catch (error) {
      notificationWarning = `The file rename committed, but ${resolved.client.name} did not accept didRenameFiles: ${error instanceof Error ? error.message : String(error)}`;
    }
    const synchronizationWarning = (
      await this.#synchronizeChangedFiles(synchronizedPaths, operationSignal)
    ).at(0);
    const warning = combineWarnings(notificationWarning, synchronizationWarning);
    const diagnostics = warning ? [] : await this.#collectDiagnostics(affected, operationSignal);
    return {
      changedFiles: transaction.changedFiles,
      diagnostics,
      newPath: newAbsolute,
      oldPath: oldAbsolute,
      serverName: resolved.client.name,
      ...(warning ? { warning } : {}),
    };
  }

  async #prepareRenameDestination(
    source: ClientRoute,
    oldPath: string,
    newPath: string,
    displayNewPath: string,
    signal: AbortSignal,
  ): Promise<{ readonly destination: ClientRoute; readonly intermediatePath?: string }> {
    if (!isInside(source.client.root, oldPath) || !isInside(source.client.root, newPath)) {
      throw new Error("LSP semantic renames must remain inside one detected workspace.");
    }
    const destination = await this.#clientForFile(newPath, signal);
    if (destination?.client !== source.client) {
      throw new Error("LSP semantic renames must preserve one language-server workspace.");
    }
    const oldStat = await lstat(oldPath);
    if (!oldStat.isFile()) throw new Error("LSP semantic rename currently supports files only.");
    if (!(await exists(newPath))) return { destination };
    const [canonicalOld, canonicalNew] = await Promise.all([realpath(oldPath), realpath(newPath)]);
    if (canonicalOld !== canonicalNew) {
      throw new Error(`Rename destination already exists: ${displayNewPath}`);
    }
    return { destination, intermediatePath: `${newPath}.pi-lsp-case-${randomUUID()}` };
  }

  async #applySemanticRename(
    workspaceEdit: WorkspaceEdit | null,
    workspaceRoot: string,
    sourceClient: LspClient,
    oldPath: string,
    newPath: string,
    signal: AbortSignal,
    expectedDocuments: ReadonlyMap<string, { readonly text: string; readonly version: number }>,
    intermediatePath?: string,
  ): Promise<Awaited<ReturnType<typeof applyWorkspaceEdit>>> {
    return applyWorkspaceEdit(workspaceEdit, workspaceRoot, {
      additionalQueuePaths: [oldPath, newPath, ...(intermediatePath ? [intermediatePath] : [])],
      documentState: (path) => this.#documentStateForClientPath(sourceClient, path),
      expectedDocumentState: (path) => expectedDocuments.get(path),
      signal,
      whileApplied: async () => {
        if (signal.aborted) throw new Error("LSP rename aborted before filesystem mutation.");
        await mkdir(dirname(newPath), { recursive: true });
        if (intermediatePath === undefined) {
          await rename(oldPath, newPath);
          return;
        }
        await rename(oldPath, intermediatePath);
        try {
          await rename(intermediatePath, newPath);
        } catch (error) {
          try {
            await rename(intermediatePath, oldPath);
          } catch (rollbackError) {
            throw new AggregateError(
              [error, rollbackError],
              "Case-only file rename failed and rollback was incomplete.",
              { cause: rollbackError },
            );
          }
          throw error;
        }
      },
    });
  }

  async #snapshotClientDocuments(
    client: LspClient,
  ): Promise<Map<string, { readonly text: string; readonly version: number }>> {
    const snapshots = new Map<string, { readonly text: string; readonly version: number }>();
    for (const state of client.openDocumentStates()) {
      try {
        const path = await realpath(fileURLToPath(state.uri));
        snapshots.set(path, { text: state.text, version: state.version });
      } catch {
        // Ignore stale or non-file client document entries; edits to them will fail closed.
      }
    }
    return snapshots;
  }

  async #documentStateForClientPath(
    client: LspClient,
    path: string,
  ): Promise<{ readonly text: string; readonly version: number } | undefined> {
    const canonicalRoot = await realpath(this.#cwd);
    const displayPath = resolve(this.#cwd, relative(canonicalRoot, path));
    return (
      client.documentState(pathToFileURL(displayPath).href) ??
      client.documentState(pathToFileURL(path).href)
    );
  }

  #scheduleWatchedFilesRefresh(key: string, client: LspClient): void {
    const previous = this.#watchRefreshes.get(key) ?? Promise.resolve();
    const refresh = this.#runWatchedFilesRefresh(key, client, previous);
    this.#watchRefreshes.set(key, refresh);
    void this.#completeWatchedFilesRefresh(key, refresh);
  }

  async #runWatchedFilesRefresh(
    key: string,
    client: LspClient,
    previous: Promise<void>,
  ): Promise<void> {
    try {
      await previous;
    } catch {
      // A later registration still replaces a failed refresh.
    }
    await this.#refreshWatchedFiles(key, client);
  }

  async #completeWatchedFilesRefresh(key: string, refresh: Promise<void>): Promise<void> {
    try {
      await refresh;
    } catch (error) {
      this.#watchWarnings.set(
        key,
        `Watched files unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (this.#watchRefreshes.get(key) === refresh) this.#watchRefreshes.delete(key);
  }

  async #refreshWatchedFiles(key: string, client: LspClient): Promise<void> {
    this.#stopWatchedFiles(key);
    this.#watchWarnings.delete(key);
    const registrations = client.watchedFileRegistrations();
    if (registrations.length === 0 || this.#session.signal.aborted) return;
    try {
      const patterns = await this.#watchedFilePatterns(client.root, registrations);
      if (patterns.length === 0 || this.#sessionAborted()) return;
      const holder: { state?: WatchedFileState } = {};
      const watcher = this.#watchFactory(client.root, (eventType, filename) => {
        const current = holder.state;
        if (current === undefined || this.#watchedFiles.get(key) !== current) return;
        this.#enqueueWatchedFileOperation(key, current, () =>
          this.#queueWatchedFileChange(key, current, eventType, filename),
        );
      });
      const state: WatchedFileState = {
        client,
        eventQueue: Promise.resolve(),
        patterns,
        pending: new Map(),
        watcher,
      };
      holder.state = state;
      this.#watchedFiles.set(key, state);
      watcher.onError?.((error) => {
        this.#failWatchedFiles(key, state, error);
      });
    } catch (error) {
      this.#watchWarnings.set(
        key,
        `Watched files unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  #sessionAborted(): boolean {
    return this.#session.signal.aborted;
  }

  #failWatchedFiles(key: string, state: WatchedFileState, error: Error): void {
    if (this.#watchedFiles.get(key) !== state) return;
    this.#stopWatchedFiles(key);
    this.#watchWarnings.set(key, `Watched files unavailable: ${error.message}`);
  }

  async #watchedFilePatterns(
    workspaceRoot: string,
    registrations: readonly unknown[],
  ): Promise<WatchedFilePattern[]> {
    const displayRoot = resolve(workspaceRoot);
    const canonicalRoot = await realpath(displayRoot);
    const patterns: WatchedFilePattern[] = [];
    for (const registration of registrations) {
      const watchers = recordValue(registration)?.["watchers"];
      if (!Array.isArray(watchers)) {
        throw new TypeError("the server registered malformed watcher options");
      }
      for (const watcher of watchers) {
        if (patterns.length >= MAX_WATCHED_FILE_PATTERNS) {
          throw new Error(
            `the server exceeded the ${String(MAX_WATCHED_FILE_PATTERNS)} pattern limit`,
          );
        }
        patterns.push(await watchedFilePattern(canonicalRoot, displayRoot, watcher));
      }
    }
    return patterns;
  }

  #enqueueWatchedFileOperation(
    key: string,
    state: WatchedFileState,
    operation: () => Promise<void>,
  ): void {
    state.eventQueue = this.#runWatchedFileOperation(key, state, state.eventQueue, operation);
  }

  async #runWatchedFileOperation(
    key: string,
    state: WatchedFileState,
    previous: Promise<void>,
    operation: () => Promise<void>,
  ): Promise<void> {
    try {
      await previous;
      if (this.#watchedFiles.get(key) === state) await operation();
    } catch (error) {
      this.#watchWarnings.set(
        key,
        `Watched file processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async #queueWatchedFileChange(
    key: string,
    state: WatchedFileState,
    eventType: string,
    filename: Buffer | string | null,
  ): Promise<void> {
    if (filename === null || this.#session.signal.aborted) return;
    const name = Buffer.isBuffer(filename) ? filename.toString("utf8") : filename;
    const path = resolve(state.client.root, name);
    if (!isInside(state.client.root, path) || !(await this.#isTrustedPath(path))) return;
    const existsNow = await exists(path);
    if (this.#sessionAborted() || this.#watchedFiles.get(key) !== state) return;
    const event = watchedFileEvent(eventType, existsNow);
    const matched = state.patterns.some((pattern) => {
      if ((pattern.kind & event.mask) === 0 || !isInside(pattern.basePath, path)) return false;
      const candidate = relative(pattern.basePath, path).replaceAll("\\", "/");
      return matchesGlob(candidate, pattern.glob);
    });
    if (!matched) return;
    const uri = pathToFileURL(path).href;
    state.pending.set(uri, event.type);
    if (state.pending.size >= MAX_WATCHED_FILE_BATCH) {
      if (state.timer !== undefined) clearTimeout(state.timer);
      delete state.timer;
      await this.#flushWatchedFileChanges(key, state);
      return;
    }
    if (state.timer !== undefined) return;
    state.timer = setTimeout(() => {
      delete state.timer;
      this.#enqueueWatchedFileOperation(key, state, () =>
        this.#flushWatchedFileChanges(key, state),
      );
    }, WATCHED_FILE_DEBOUNCE_MS);
  }

  async #flushWatchedFileChanges(key: string, state: WatchedFileState): Promise<void> {
    if (this.#watchedFiles.get(key) !== state || state.pending.size === 0) return;
    const changes = [...state.pending].map(([uri, type]) => ({ type, uri }));
    state.pending.clear();
    try {
      await state.client.notify("workspace/didChangeWatchedFiles", { changes });
    } catch (error) {
      this.#watchWarnings.set(
        key,
        `Watched file notification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  #stopWatchedFiles(key: string): void {
    const state = this.#watchedFiles.get(key);
    if (state === undefined) return;
    if (state.timer !== undefined) clearTimeout(state.timer);
    state.watcher.close();
    this.#watchedFiles.delete(key);
  }

  async #synchronizeChangedFiles(paths: readonly string[], signal: AbortSignal): Promise<string[]> {
    const warnings: string[] = [];
    for (const path of paths) {
      try {
        const content = await readFile(path, "utf8");
        const route = await this.#clientForFile(path, signal);
        if (route === undefined) {
          warnings.push(
            `The LSP edit committed, but no language server route could synchronize ${path}.`,
          );
          continue;
        }
        await route.client.syncDocument(path, route.languageId, content);
      } catch (error) {
        warnings.push(
          `The LSP edit committed, but an edited document could not be synchronized: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return warnings;
  }

  async #collectDiagnostics(
    paths: readonly string[],
    signal: AbortSignal,
  ): Promise<FileDiagnostics[]> {
    const diagnostics: FileDiagnostics[] = [];
    for (const path of paths) {
      try {
        const content = await readFile(path, "utf8");
        const route = await this.#clientForFile(path, signal);
        if (route === undefined) continue;
        const synchronization = await route.client.syncDocument(path, route.languageId, content);
        const current = await route.client.freshDiagnosticsResult(
          synchronization,
          signal,
          this.#diagnosticWaitMs,
        );
        if (current.observed) this.#baselines.set(resolve(path), route.client);
        else this.#baselines.delete(resolve(path));
        if (current.diagnostics.length > 0) {
          diagnostics.push({ diagnostics: current.diagnostics, path });
        }
      } catch {
        // The rename has committed; diagnostics are best effort after this point.
      }
    }
    return diagnostics;
  }

  async shutdown(): Promise<void> {
    this.#session.abort();
    for (const controller of this.#pendingDiagnostics.values()) controller.abort();
    this.#pendingDiagnostics.clear();
    this.#pullDiagnostics.clear();
    this.#pullRefreshSequences.clear();
    this.#baselines.clear();
    const watchedFileQueues = [...this.#watchedFiles.values()].map((state) => state.eventQueue);
    for (const key of this.#watchedFiles.keys()) this.#stopWatchedFiles(key);
    await Promise.allSettled(watchedFileQueues);
    await Promise.allSettled(this.#watchRefreshes.values());
    this.#watchRefreshes.clear();
    const finalWatchedFileQueues = [...this.#watchedFiles.values()].map(
      (state) => state.eventQueue,
    );
    for (const key of this.#watchedFiles.keys()) this.#stopWatchedFiles(key);
    await Promise.allSettled(finalWatchedFileQueues);
    this.#watchWarnings.clear();
    await Promise.allSettled(this.#warming.values());
    this.#warming.clear();
    const starting = await Promise.allSettled(this.#starting.values());
    const clients = new Set(this.#clients.values());
    for (const result of starting) {
      if (result.status === "fulfilled" && result.value) clients.add(result.value);
    }
    await Promise.allSettled([...clients].map((client) => client.shutdown()));
    this.#clients.clear();
    this.#starting.clear();
  }

  async #isTrustedPath(path: string): Promise<boolean> {
    const absolutePath = resolve(path);
    if (!isInside(this.#cwd, absolutePath)) return false;
    const canonicalRoot = await realpath(this.#cwd);
    let existing = absolutePath;
    while (!(await exists(existing))) {
      const parent = dirname(existing);
      if (parent === existing) return false;
      existing = parent;
    }
    return isInside(canonicalRoot, await realpath(existing));
  }

  async #clientForFile(path: string, signal?: AbortSignal): Promise<ClientRoute | undefined> {
    if (signal?.aborted) throw new Error("LSP operation aborted.");
    if (!this.#trusted) return undefined;
    const absolutePath = resolve(path);
    if (!(await this.#isTrustedPath(absolutePath))) return undefined;
    const keyForLanguage = languageKey(absolutePath);
    for (const definition of this.#definitions) {
      if (!matches(definition, absolutePath)) continue;
      const root = await findWorkspaceRoot(absolutePath, definition.rootMarkers, this.#cwd);
      const key = JSON.stringify([definition.id, root]);
      const languageId = definition.languageIds[keyForLanguage];
      if (languageId === undefined) continue;
      const existing = this.#clients.get(key);
      if (existing) return { client: existing, languageId };
      if (this.#broken.has(key) || this.#unavailable.has(key)) continue;
      let starting = this.#starting.get(key);
      if (starting === undefined) {
        starting = this.#startClient(definition, root, key);
        this.#starting.set(key, starting);
      }
      const client = await waitForSharedOperation(starting, signal);
      if (client) return { client, languageId };
    }
    return undefined;
  }

  async #startClient(
    definition: ServerDefinition,
    root: string,
    key: string,
  ): Promise<LspClient | undefined> {
    this.#statuses.set(key, {
      id: definition.id,
      name: definition.name,
      root,
      state: "starting",
    });
    let client: LspClient | undefined;
    try {
      const command = await resolveServerCommand(
        definition,
        root,
        this.#trusted,
        this.#env,
        process.platform,
        this.#cwd,
      );
      if (command === undefined) {
        this.#unavailable.add(key);
        this.#statuses.set(key, {
          id: definition.id,
          message: definition.installHint,
          name: definition.name,
          root,
          state: "unavailable",
        });
        return undefined;
      }
      client = this.#clientFactory({
        args: command.args,
        command: command.command,
        env: this.#env,
        id: definition.id,
        name: definition.name,
        onWatchedFilesChange: () => {
          if (client !== undefined) this.#scheduleWatchedFilesRefresh(key, client);
        },
        root,
      });
      await client.start(this.#session.signal);
      this.#clients.set(key, client);
      this.#statuses.set(key, {
        id: definition.id,
        name: definition.name,
        root,
        state: "running",
      });
      this.#scheduleWatchedFilesRefresh(key, client);
      return client;
    } catch (error) {
      await client?.shutdown();
      this.#broken.add(key);
      this.#statuses.set(key, {
        id: definition.id,
        message: error instanceof Error ? error.message : String(error),
        name: definition.name,
        root,
        state: "failed",
      });
      throw error;
    } finally {
      this.#starting.delete(key);
    }
  }
}
