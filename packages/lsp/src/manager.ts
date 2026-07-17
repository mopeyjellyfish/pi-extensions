import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { lstat, mkdir, readFile, realpath, rename } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";

import { LspClient } from "./client.ts";
import { introducedDiagnostics } from "./diagnostics.ts";
import {
  normalizeDocumentSymbols,
  normalizeHover,
  normalizeLocations,
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
import { applyWorkspaceEdit } from "./workspace-edit.ts";

import type { LspClientOptions } from "./client.ts";
import type { LspQueryOutcome, LspQueryRequest } from "./query.ts";
import type { ServerDefinition } from "./servers.ts";
import type {
  Diagnostic,
  DocumentSymbol,
  Hover,
  Location,
  LocationLink,
  SymbolInformation,
  WorkspaceEdit,
  WorkspaceSymbol,
} from "vscode-languageserver-protocol";

const MAX_SYNC_FILE_BYTES = 2 * 1024 * 1024;
const DIAGNOSTIC_WAIT_MS = 10_000;

export interface MutationSnapshot {
  readonly diagnostics: readonly Diagnostic[];
  readonly text: string | undefined;
}

export interface FileDiagnostics {
  readonly diagnostics: readonly Diagnostic[];
  readonly path: string;
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
  diagnoseMutation(
    path: string,
    text: string,
    snapshot: MutationSnapshot | undefined,
    signal?: AbortSignal,
  ): Promise<readonly Diagnostic[]>;
  query(request: LspQueryRequest, signal?: AbortSignal): Promise<LspQueryOutcome>;
  renameFile(oldPath: string, newPath: string, signal?: AbortSignal): Promise<RenameOutcome>;
  shutdown(): Promise<void>;
  snapshot(path: string): Promise<MutationSnapshot | undefined>;
  status(): readonly LspStatus[];
  warmFile(path: string, signal?: AbortSignal): Promise<void>;
}

interface ClientRoute {
  readonly client: LspClient;
  readonly languageId: string;
}

export interface LspManagerOptions {
  readonly clientFactory?: (options: LspClientOptions) => LspClient;
  readonly cwd: string;
  readonly diagnosticWaitMs?: number;
  readonly definitions?: readonly ServerDefinition[];
  readonly env?: NodeJS.ProcessEnv;
  readonly trusted: boolean;
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
  readonly #clients = new Map<string, LspClient>();
  readonly #starting = new Map<string, Promise<LspClient | undefined>>();
  readonly #broken = new Set<string>();
  readonly #unavailable = new Set<string>();
  readonly #statuses = new Map<string, LspStatus>();
  readonly #pendingDiagnostics = new Map<string, AbortController>();
  readonly #baselines = new Map<string, LspClient>();
  readonly #warming = new Map<string, Promise<void>>();
  readonly #session = new AbortController();

  constructor(options: LspManagerOptions) {
    this.#cwd = resolve(options.cwd);
    this.#trusted = options.trusted;
    this.#definitions = options.definitions ?? DEFAULT_SERVER_DEFINITIONS;
    this.#diagnosticWaitMs = options.diagnosticWaitMs ?? DIAGNOSTIC_WAIT_MS;
    this.#env = options.env ?? process.env;
    this.#clientFactory =
      options.clientFactory ?? ((clientOptions) => new LspClient(clientOptions));
  }

  status(): readonly LspStatus[] {
    return [...this.#statuses.values()].sort((left, right) => left.name.localeCompare(right.name));
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
    callback: (route: ClientRoute, text: string, uri: string) => Promise<T>,
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
      await route.client.syncDocument(absolutePath, route.languageId, text);
      return callback(route, text, pathToFileURL(absolutePath).href);
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
    const workspaceEdit = await resolved.client.willRenameFiles(
      oldAbsolute,
      newAbsolute,
      operationSignal,
    );
    const transaction = await this.#applySemanticRename(
      workspaceEdit,
      resolved.client.root,
      oldAbsolute,
      newAbsolute,
      operationSignal,
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
    oldPath: string,
    newPath: string,
    signal: AbortSignal,
    intermediatePath?: string,
  ): Promise<Awaited<ReturnType<typeof applyWorkspaceEdit>>> {
    return applyWorkspaceEdit(
      workspaceEdit,
      workspaceRoot,
      async () => {
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
      [oldPath, newPath, ...(intermediatePath ? [intermediatePath] : [])],
    );
  }

  async #synchronizeChangedFiles(paths: readonly string[], signal: AbortSignal): Promise<string[]> {
    const warnings: string[] = [];
    for (const path of paths) {
      try {
        const content = await readFile(path, "utf8");
        const route = await this.#clientForFile(path, signal);
        if (route) await route.client.syncDocument(path, route.languageId, content);
      } catch (error) {
        warnings.push(
          `The file rename committed, but an edited document could not be synchronized: ${error instanceof Error ? error.message : String(error)}`,
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
    this.#baselines.clear();
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
