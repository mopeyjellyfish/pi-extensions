import { spawn } from "node:child_process";
import { once } from "node:events";
import { basename, matchesGlob, relative } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import {
  CancellationTokenSource,
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
} from "vscode-jsonrpc/node.js";

import { queryMethod } from "./query.ts";

import type { LspQueryOperation } from "./query.ts";
import type { ChildProcess, ChildProcessWithoutNullStreams } from "node:child_process";
import type { MessageConnection } from "vscode-jsonrpc";
import type {
  Diagnostic,
  FileOperationRegistrationOptions,
  InitializeResult,
  PublishDiagnosticsParams,
  RegistrationParams,
  UnregistrationParams,
  WorkspaceEdit,
} from "vscode-languageserver-protocol";

const REQUEST_TIMEOUT_MS = 5000;
const UNVERSIONED_SETTLE_MS = 150;
const DIAGNOSTIC_POLL_MS = 25;
const MAX_STDERR_BYTES = 4096;

export interface LspClientOptions {
  readonly args: readonly string[];
  readonly command: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly id: string;
  readonly name: string;
  readonly onWatchedFilesChange?: () => void;
  readonly requestTimeoutMs?: number;
  readonly root: string;
}

export interface DocumentSynchronization {
  readonly sequence: number;
  readonly uri: string;
  readonly version: number;
}

export interface OpenDocumentState {
  readonly text: string;
  readonly uri: string;
  readonly version: number;
}

export interface FreshDiagnostics {
  readonly diagnostics: readonly Diagnostic[];
  readonly observed: boolean;
}

interface PublishedDiagnostics {
  readonly diagnostics: readonly Diagnostic[];
  readonly sequence: number;
  readonly version: number | undefined;
}

interface OpenDocument {
  readonly languageId: string;
  readonly text: string;
  readonly version: number;
}

type FileOperationMethod = "workspace/didRenameFiles" | "workspace/willRenameFiles";

interface FileOperationFilterShape {
  readonly pattern: {
    readonly glob: string;
    readonly matches?: "file" | "folder";
    readonly options?: { readonly ignoreCase?: boolean };
  };
  readonly scheme?: string;
}

interface DynamicRegistration {
  readonly id: string;
  readonly method: string;
  readonly registerOptions: unknown;
}

interface SynchronizationOptions {
  readonly changeKind: number;
  readonly openClose: boolean;
  readonly save: boolean | { readonly includeText?: boolean } | undefined;
}

function synchronizationOptions(
  options: InitializeResult["capabilities"]["textDocumentSync"],
): SynchronizationOptions {
  if (typeof options === "number") {
    return { changeKind: options, openClose: true, save: undefined };
  }
  return {
    changeKind: options?.change ?? 0,
    openClose: options?.openClose === true,
    save: options?.save,
  };
}

function contentChanges(
  previous: OpenDocument | undefined,
  text: string,
  changeKind: number,
): readonly unknown[] {
  if (previous === undefined || changeKind !== 2) return [{ text }];
  return [
    {
      range: {
        end: documentEnd(previous.text),
        start: { character: 0, line: 0 },
      },
      text,
    },
  ];
}

function abortedError(): Error {
  return new Error("LSP operation aborted.");
}

function isFileOperationRegistrationOptions(
  value: unknown,
): value is FileOperationRegistrationOptions {
  if (typeof value !== "object" || value === null || !("filters" in value)) return false;
  return Array.isArray(value.filters);
}

function matchesFileOperationFilter(
  root: string,
  filter: FileOperationFilterShape,
  filePath: string,
): boolean {
  if (filter.scheme !== undefined && filter.scheme !== "file") return false;
  if (filter.pattern.matches === "folder") return false;
  const candidate = relative(root, filePath).replaceAll("\\", "/");
  const glob = filter.pattern.glob;
  const ignoreCase = filter.pattern.options?.ignoreCase === true;
  return ignoreCase
    ? matchesGlob(candidate.toLowerCase(), glob.toLowerCase())
    : matchesGlob(candidate, glob);
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortedError());
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      signal?.removeEventListener("abort", abort);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, milliseconds);
    const abort = (): void => {
      clearTimeout(timer);
      cleanup();
      reject(abortedError());
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function documentEnd(text: string): { character: number; line: number } {
  return {
    character: text.length - text.lastIndexOf("\n") - 1,
    line: text.split("\n").length - 1,
  };
}

function isRunning(child: ChildProcess): boolean {
  return child.exitCode === null && child.signalCode === null;
}

async function waitForExit(child: ChildProcess, milliseconds: number): Promise<void> {
  if (!isRunning(child)) return;
  const controller = new AbortController();
  const exited = (async (): Promise<void> => {
    await once(child, "exit", { signal: controller.signal });
  })();
  try {
    await Promise.race([exited, delay(milliseconds)]);
  } finally {
    controller.abort();
  }
}

function processTreeExists(child: ChildProcessWithoutNullStreams): boolean {
  if (process.platform === "win32" || child.pid === undefined) return isRunning(child);
  try {
    process.kill(-child.pid, 0);
    return true;
  } catch (error) {
    return !(
      error instanceof Error &&
      "code" in error &&
      (error.code === "ESRCH" || error.code === "EINVAL")
    );
  }
}

async function waitForProcessTreeExit(
  child: ChildProcessWithoutNullStreams,
  milliseconds: number,
): Promise<void> {
  const deadline = Date.now() + milliseconds;
  while (processTreeExists(child) && Date.now() < deadline) await delay(25);
}

export function windowsTaskkillArguments(pid: number, force: boolean): readonly string[] {
  return ["/PID", String(pid), "/T", ...(force ? ["/F"] : [])];
}

async function signalProcessTree(
  child: ChildProcessWithoutNullStreams,
  signal: NodeJS.Signals,
): Promise<void> {
  if (process.platform === "win32" && child.pid !== undefined) {
    const taskkill = spawn("taskkill", windowsTaskkillArguments(child.pid, signal === "SIGKILL"), {
      stdio: "ignore",
      windowsHide: true,
    });
    taskkill.once("error", () => {
      // A missing taskkill executable is handled by the bounded direct-process fallback below.
    });
    await waitForExit(taskkill, 1000);
    if (isRunning(taskkill)) taskkill.kill("SIGKILL");
    if (isRunning(child)) child.kill("SIGKILL");
    return;
  }
  if (child.pid !== undefined) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to signalling the direct process when the group is unavailable.
    }
  }
  if (isRunning(child)) child.kill(signal);
}

export class LspClient {
  readonly #options: LspClientOptions;
  readonly #diagnostics = new Map<string, PublishedDiagnostics>();
  readonly #documents = new Map<string, OpenDocument>();
  readonly #dynamicRegistrations = new Map<string, DynamicRegistration>();
  readonly #syncQueues = new Map<string, Promise<void>>();
  #capabilities: InitializeResult["capabilities"] | undefined;
  #connection: MessageConnection | undefined;
  #diagnosticRefreshSequence = 0;
  #process: ChildProcessWithoutNullStreams | undefined;
  #sequence = 0;
  #shutdownPromise: Promise<void> | undefined;
  #stderr = "";

  constructor(options: LspClientOptions) {
    this.#options = options;
  }

  get id(): string {
    return this.#options.id;
  }

  get name(): string {
    return this.#options.name;
  }

  get root(): string {
    return this.#options.root;
  }

  async start(signal?: AbortSignal): Promise<void> {
    if (this.#connection !== undefined) return;
    if (signal?.aborted) throw abortedError();
    const child = spawn(this.#options.command, [...this.#options.args], {
      cwd: this.#options.root,
      env: this.#options.env ?? process.env,
      detached: process.platform !== "win32",
      shell: process.platform === "win32" && /\.(?:bat|cmd)$/i.test(this.#options.command),
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.#process = child;
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      this.#stderr = `${this.#stderr}${chunk}`.slice(-MAX_STDERR_BYTES);
    });
    await new Promise<void>((resolve, reject) => {
      function cleanup(): void {
        child.removeListener("error", failed);
        child.removeListener("spawn", spawned);
      }
      function failed(error: Error): void {
        cleanup();
        reject(error);
      }
      function spawned(): void {
        cleanup();
        resolve();
      }
      child.once("error", failed);
      child.once("spawn", spawned);
    });
    if (signal?.aborted) {
      child.kill();
      throw abortedError();
    }

    const connection = createMessageConnection(
      new StreamMessageReader(child.stdout),
      new StreamMessageWriter(child.stdin),
    );
    this.#connection = connection;
    connection.onNotification(
      "textDocument/publishDiagnostics",
      (params: PublishDiagnosticsParams) => {
        this.#sequence += 1;
        this.#diagnostics.set(params.uri, {
          diagnostics: params.diagnostics,
          sequence: this.#sequence,
          version: params.version,
        });
      },
    );
    connection.onRequest("workspace/configuration", (params: { items?: unknown[] }) =>
      (params.items ?? []).map(() => null),
    );
    connection.onRequest("workspace/workspaceFolders", () => [
      {
        name: basename(this.#options.root),
        uri: pathToFileURL(this.#options.root).href,
      },
    ]);
    connection.onRequest("client/registerCapability", (params: RegistrationParams) => {
      let watchedFilesChanged = false;
      for (const registration of params.registrations) {
        const candidate = registration as {
          id?: unknown;
          method?: unknown;
          registerOptions?: unknown;
        };
        if (typeof candidate.id !== "string" || typeof candidate.method !== "string") continue;
        this.#dynamicRegistrations.set(candidate.id, {
          id: candidate.id,
          method: candidate.method,
          registerOptions: candidate.registerOptions,
        });
        if (candidate.method === "workspace/didChangeWatchedFiles") watchedFilesChanged = true;
      }
      if (watchedFilesChanged) this.#options.onWatchedFilesChange?.();
      return null;
    });
    connection.onRequest("client/unregisterCapability", (params: UnregistrationParams) => {
      let watchedFilesChanged = false;
      for (const unregistration of params.unregisterations) {
        const candidate = unregistration as { id?: unknown };
        if (typeof candidate.id !== "string") continue;
        const existing = this.#dynamicRegistrations.get(candidate.id);
        this.#dynamicRegistrations.delete(candidate.id);
        if (existing?.method === "workspace/didChangeWatchedFiles") watchedFilesChanged = true;
      }
      if (watchedFilesChanged) this.#options.onWatchedFilesChange?.();
      return null;
    });
    connection.onRequest("window/workDoneProgress/create", () => null);
    connection.onRequest("workspace/diagnostic/refresh", () => {
      this.#diagnosticRefreshSequence += 1;
      return null;
    });
    connection.onRequest("workspace/applyEdit", () => ({
      applied: false,
      failureReason: "Unsolicited language-server workspace edits are disabled.",
    }));
    connection.listen();

    try {
      const initialize = await this.#request<InitializeResult>(
        "initialize",
        {
          capabilities: {
            general: { positionEncodings: ["utf-16"] },
            textDocument: {
              callHierarchy: { dynamicRegistration: true },
              codeAction: {
                codeActionLiteralSupport: {
                  codeActionKind: {
                    valueSet: ["quickfix", "source.organizeImports"],
                  },
                },
                dataSupport: true,
                disabledSupport: true,
                dynamicRegistration: true,
                honorsChangeAnnotations: false,
                isPreferredSupport: true,
                resolveSupport: { properties: ["edit"] },
              },
              declaration: { dynamicRegistration: true, linkSupport: true },
              definition: { dynamicRegistration: true, linkSupport: true },
              diagnostic: { dynamicRegistration: true, relatedDocumentSupport: true },
              documentSymbol: {
                dynamicRegistration: true,
                hierarchicalDocumentSymbolSupport: true,
              },
              hover: {
                contentFormat: ["plaintext", "markdown"],
                dynamicRegistration: true,
              },
              implementation: { dynamicRegistration: true, linkSupport: true },
              publishDiagnostics: { versionSupport: true },
              references: { dynamicRegistration: true },
              rename: {
                dynamicRegistration: true,
                honorsChangeAnnotations: false,
                prepareSupport: true,
              },
              synchronization: {
                didSave: true,
                dynamicRegistration: false,
                willSave: false,
                willSaveWaitUntil: false,
              },
              typeDefinition: { dynamicRegistration: true, linkSupport: true },
              typeHierarchy: { dynamicRegistration: true },
            },
            workspace: {
              applyEdit: false,
              didChangeWatchedFiles: { dynamicRegistration: true },
              diagnostics: { refreshSupport: true },
              configuration: true,
              fileOperations: {
                didRename: true,
                dynamicRegistration: true,
                willRename: true,
              },
              symbol: { dynamicRegistration: true },
              workspaceEdit: {
                documentChanges: true,
              },
              workspaceFolders: true,
            },
          },
          clientInfo: { name: "@mopeyjellyfish/pi-lsp", version: "0.0.0" },
          processId: process.pid,
          rootPath: this.#options.root,
          rootUri: pathToFileURL(this.#options.root).href,
          workspaceFolders: [
            {
              name: basename(this.#options.root),
              uri: pathToFileURL(this.#options.root).href,
            },
          ],
        },
        signal,
      );
      if (
        initialize.capabilities.positionEncoding !== undefined &&
        initialize.capabilities.positionEncoding !== "utf-16"
      ) {
        throw new Error(
          `${this.name} selected unsupported position encoding ${initialize.capabilities.positionEncoding}.`,
        );
      }
      this.#capabilities = initialize.capabilities;
      await connection.sendNotification("initialized", {});
    } catch (error) {
      await this.shutdown();
      throw error;
    }
  }

  diagnostics(uri: string): readonly Diagnostic[] {
    return this.#diagnostics.get(uri)?.diagnostics ?? [];
  }

  documentText(uri: string): string | undefined {
    return this.#documents.get(uri)?.text;
  }

  documentState(uri: string): { readonly text: string; readonly version: number } | undefined {
    const document = this.#documents.get(uri);
    return document === undefined ? undefined : { text: document.text, version: document.version };
  }

  openDocumentStates(): readonly OpenDocumentState[] {
    return [...this.#documents].map(([uri, document]) => ({
      text: document.text,
      uri,
      version: document.version,
    }));
  }

  supportsSymbolRename(): boolean {
    const provider = this.#capabilities?.renameProvider;
    if (provider !== undefined && provider !== false) return true;
    for (const registration of this.#dynamicRegistrations.values()) {
      if (registration.method === "textDocument/rename") return true;
    }
    return false;
  }

  supportsPrepareRename(): boolean {
    const provider: unknown = this.#capabilities?.renameProvider;
    if (
      typeof provider === "object" &&
      provider !== null &&
      "prepareProvider" in provider &&
      provider.prepareProvider === true
    ) {
      return true;
    }
    for (const registration of this.#dynamicRegistrations.values()) {
      const options: unknown = registration.registerOptions;
      if (
        registration.method === "textDocument/rename" &&
        typeof options === "object" &&
        options !== null &&
        "prepareProvider" in options &&
        options.prepareProvider === true
      ) {
        return true;
      }
    }
    return false;
  }

  supportsCodeActions(): boolean {
    const provider = this.#capabilities?.codeActionProvider;
    if (provider !== undefined && provider !== false) return true;
    for (const registration of this.#dynamicRegistrations.values()) {
      if (registration.method === "textDocument/codeAction") return true;
    }
    return false;
  }

  supportsCodeActionResolve(): boolean {
    const provider: unknown = this.#capabilities?.codeActionProvider;
    if (
      typeof provider === "object" &&
      provider !== null &&
      "resolveProvider" in provider &&
      provider.resolveProvider === true
    ) {
      return true;
    }
    for (const registration of this.#dynamicRegistrations.values()) {
      const options: unknown = registration.registerOptions;
      if (
        registration.method === "textDocument/codeAction" &&
        typeof options === "object" &&
        options !== null &&
        "resolveProvider" in options &&
        options.resolveProvider === true
      ) {
        return true;
      }
    }
    return false;
  }

  supportsWillRenameFiles(oldPath?: string, newPath?: string): boolean {
    return this.#supportsFileOperation("workspace/willRenameFiles", oldPath, newPath);
  }

  get diagnosticRefreshSequence(): number {
    return this.#diagnosticRefreshSequence;
  }

  diagnosticIdentifier(): string | undefined {
    const provider = this.#diagnosticProvider();
    if (typeof provider !== "object" || provider === null || !("identifier" in provider)) {
      return undefined;
    }
    return typeof provider.identifier === "string" ? provider.identifier : undefined;
  }

  supportsDocumentDiagnostics(): boolean {
    return this.#diagnosticProvider() !== undefined;
  }

  supportsWorkspaceDiagnostics(): boolean {
    const provider = this.#diagnosticProvider();
    return (
      typeof provider === "object" &&
      provider !== null &&
      "workspaceDiagnostics" in provider &&
      provider.workspaceDiagnostics === true
    );
  }

  #diagnosticProvider(): unknown {
    if (this.#capabilities?.diagnosticProvider !== undefined) {
      return this.#capabilities.diagnosticProvider;
    }
    for (const registration of this.#dynamicRegistrations.values()) {
      if (registration.method === "textDocument/diagnostic") return registration.registerOptions;
    }
    return undefined;
  }

  supportsDidRenameFiles(oldPath?: string, newPath?: string): boolean {
    return this.#supportsFileOperation("workspace/didRenameFiles", oldPath, newPath);
  }

  supportsQuery(operation: LspQueryOperation): boolean {
    const capabilities = this.#capabilities;
    const provider =
      capabilities === undefined
        ? undefined
        : {
            callHierarchyIncoming: capabilities.callHierarchyProvider,
            callHierarchyOutgoing: capabilities.callHierarchyProvider,
            declaration: capabilities.declarationProvider,
            definition: capabilities.definitionProvider,
            documentSymbols: capabilities.documentSymbolProvider,
            hover: capabilities.hoverProvider,
            implementation: capabilities.implementationProvider,
            references: capabilities.referencesProvider,
            typeDefinition: capabilities.typeDefinitionProvider,
            typeHierarchySubtypes: capabilities.typeHierarchyProvider,
            typeHierarchySupertypes: capabilities.typeHierarchyProvider,
            workspaceSymbols: capabilities.workspaceSymbolProvider,
          }[operation];
    if (provider !== undefined && provider !== false) return true;
    const method = queryMethod(operation);
    for (const registration of this.#dynamicRegistrations.values()) {
      if (registration.method === method) return true;
    }
    return false;
  }

  watchedFileRegistrations(): readonly unknown[] {
    return [...this.#dynamicRegistrations.values()]
      .filter((registration) => registration.method === "workspace/didChangeWatchedFiles")
      .map((registration) => registration.registerOptions);
  }

  request<T>(method: string, params: unknown, signal?: AbortSignal): Promise<T> {
    return this.#request<T>(method, params, signal);
  }

  async notify(method: string, params: unknown): Promise<void> {
    if (this.#connection === undefined) {
      throw new Error(`${this.name} is not running.`);
    }
    await this.#connection.sendNotification(method, params);
  }

  #supportsFileOperation(method: FileOperationMethod, oldPath?: string, newPath?: string): boolean {
    const registrations: FileOperationRegistrationOptions[] = [];
    const staticOptions =
      method === "workspace/willRenameFiles"
        ? this.#capabilities?.workspace?.fileOperations?.willRename
        : this.#capabilities?.workspace?.fileOperations?.didRename;
    if (staticOptions) registrations.push(staticOptions);
    for (const registration of this.#dynamicRegistrations.values()) {
      if (
        registration.method === method &&
        isFileOperationRegistrationOptions(registration.registerOptions)
      ) {
        registrations.push(registration.registerOptions);
      }
    }
    if (oldPath === undefined || newPath === undefined) return registrations.length > 0;
    return registrations.some((registration) =>
      registration.filters.some(
        (filter) =>
          matchesFileOperationFilter(this.root, filter, oldPath) ||
          matchesFileOperationFilter(this.root, filter, newPath),
      ),
    );
  }

  async syncDocument(
    filePath: string,
    languageId: string,
    text: string,
  ): Promise<DocumentSynchronization> {
    const uri = pathToFileURL(filePath).href;
    const previousQueue = this.#syncQueues.get(uri) ?? Promise.resolve();
    const operation = (async (): Promise<DocumentSynchronization> => {
      await previousQueue;
      return this.#syncDocument(filePath, languageId, text);
    })();
    const tail = (async (): Promise<void> => {
      try {
        await operation;
      } catch {
        // A failed synchronization must not break the next queued update.
      }
    })();
    this.#syncQueues.set(uri, tail);
    try {
      return await operation;
    } finally {
      if (this.#syncQueues.get(uri) === tail) this.#syncQueues.delete(uri);
    }
  }

  async freshDiagnostics(
    synchronization: DocumentSynchronization,
    signal?: AbortSignal,
    timeoutMs = REQUEST_TIMEOUT_MS,
  ): Promise<readonly Diagnostic[]> {
    const result = await this.freshDiagnosticsResult(synchronization, signal, timeoutMs, true);
    return result.diagnostics;
  }

  async freshDiagnosticsResult(
    synchronization: DocumentSynchronization,
    signal?: AbortSignal,
    timeoutMs = REQUEST_TIMEOUT_MS,
    acceptUnversioned = false,
  ): Promise<FreshDiagnostics> {
    const started = Date.now();
    let candidateSequence = -1;
    let settledAt = 0;
    while (Date.now() - started < timeoutMs) {
      if (signal?.aborted) throw abortedError();
      const publication = this.#diagnostics.get(synchronization.uri);
      if (publication && publication.sequence > synchronization.sequence) {
        if (publication.version === synchronization.version) {
          return { diagnostics: publication.diagnostics, observed: true };
        }
        if (publication.version === undefined && acceptUnversioned) {
          if (publication.sequence !== candidateSequence) {
            candidateSequence = publication.sequence;
            settledAt = Date.now();
          } else if (Date.now() - settledAt >= UNVERSIONED_SETTLE_MS) {
            return { diagnostics: publication.diagnostics, observed: true };
          }
        }
      }
      await delay(DIAGNOSTIC_POLL_MS, signal);
    }
    return { diagnostics: [], observed: false };
  }

  async willRenameFiles(
    oldPath: string,
    newPath: string,
    signal?: AbortSignal,
  ): Promise<WorkspaceEdit | null> {
    if (!this.supportsWillRenameFiles(oldPath, newPath)) {
      throw new Error(`${this.name} does not support workspace/willRenameFiles.`);
    }
    return this.#request<WorkspaceEdit | null>(
      "workspace/willRenameFiles",
      { files: [{ newUri: pathToFileURL(newPath).href, oldUri: pathToFileURL(oldPath).href }] },
      signal,
    );
  }

  async didRenameFiles(oldPath: string, newPath: string, newLanguageId?: string): Promise<void> {
    const connection = this.#requiredConnection();
    if (this.supportsDidRenameFiles(oldPath, newPath)) {
      await delay(20);
      if (this.#process === undefined || !isRunning(this.#process)) {
        throw new Error(`${this.name} exited before workspace/didRenameFiles.`);
      }
      await connection.sendNotification("workspace/didRenameFiles", {
        files: [{ newUri: pathToFileURL(newPath).href, oldUri: pathToFileURL(oldPath).href }],
      });
    }
    const oldUri = pathToFileURL(oldPath).href;
    const newUri = pathToFileURL(newPath).href;
    const previous = this.#documents.get(oldUri);
    this.#documents.delete(oldUri);
    this.#diagnostics.delete(oldUri);
    if (previous) {
      const sync = synchronizationOptions(this.#capabilities?.textDocumentSync);
      const reopened = {
        ...previous,
        languageId: newLanguageId ?? previous.languageId,
        version: 1,
      };
      if (sync.openClose) {
        await connection.sendNotification("textDocument/didClose", {
          textDocument: { uri: oldUri },
        });
        await connection.sendNotification("textDocument/didOpen", {
          textDocument: {
            languageId: reopened.languageId,
            text: reopened.text,
            uri: newUri,
            version: reopened.version,
          },
        });
      }
      this.#documents.set(newUri, reopened);
    }
  }

  async shutdown(): Promise<void> {
    if (this.#shutdownPromise) return this.#shutdownPromise;
    this.#shutdownPromise = this.#shutdown();
    return this.#shutdownPromise;
  }

  async #syncDocument(
    filePath: string,
    languageId: string,
    text: string,
  ): Promise<DocumentSynchronization> {
    const connection = this.#requiredConnection();
    const uri = pathToFileURL(filePath).href;
    const previous = this.#documents.get(uri);
    const version = (previous?.version ?? 0) + 1;
    const sequence = this.#sequence;
    const sync = synchronizationOptions(this.#capabilities?.textDocumentSync);
    if (previous === undefined && sync.openClose) {
      await connection.sendNotification("textDocument/didOpen", {
        textDocument: { languageId, text, uri, version },
      });
    } else if (previous !== undefined && sync.changeKind !== 0) {
      await connection.sendNotification("textDocument/didChange", {
        contentChanges: contentChanges(previous, text, sync.changeKind),
        textDocument: { uri, version },
      });
    }
    this.#documents.set(uri, { languageId, text, version });
    if (sync.save) {
      await connection.sendNotification("textDocument/didSave", {
        ...(typeof sync.save === "object" && sync.save.includeText ? { text } : {}),
        textDocument: { uri },
      });
    }
    return { sequence, uri, version };
  }

  async #request<T>(
    method: string,
    params: unknown,
    signal?: AbortSignal,
    timeoutMs = this.#options.requestTimeoutMs ?? REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    if (signal?.aborted) throw abortedError();
    const connection = this.#requiredConnection();
    const cancellation = new CancellationTokenSource();
    const abortEvents = new EventTarget();
    const abortWaitController = new AbortController();
    const aborted = (async (): Promise<never> => {
      await once(abortEvents, "abort", { signal: abortWaitController.signal });
      throw abortedError();
    })();
    const abort = () => {
      cancellation.cancel();
      abortEvents.dispatchEvent(new Event("abort"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    const timeoutController = new AbortController();
    const timeout = (async (): Promise<never> => {
      await sleep(timeoutMs, undefined, { signal: timeoutController.signal });
      cancellation.cancel();
      throw new Error(`LSP request ${method} timed out after ${String(timeoutMs)}ms.`);
    })();
    try {
      return await Promise.race([
        connection.sendRequest<T>(method, params, cancellation.token),
        timeout,
        aborted,
      ]);
    } catch (error) {
      if (signal?.aborted) throw abortedError();
      throw error;
    } finally {
      timeoutController.abort();
      abortWaitController.abort();
      signal?.removeEventListener("abort", abort);
      cancellation.dispose();
    }
  }

  #requiredConnection(): MessageConnection {
    if (this.#connection === undefined) {
      const stderr = this.#stderr.trim();
      throw new Error(`LSP client ${this.name} is not running.${stderr ? ` ${stderr}` : ""}`);
    }
    return this.#connection;
  }

  async #shutdown(): Promise<void> {
    const connection = this.#connection;
    const child = this.#process;
    this.#connection = undefined;
    this.#process = undefined;
    if (connection) {
      try {
        await Promise.race([connection.sendRequest("shutdown"), delay(1000)]);
        await connection.sendNotification("exit");
      } catch {
        // The process may already have exited.
      }
      connection.dispose();
    }
    if (child) {
      if (process.platform === "win32") {
        await signalProcessTree(child, "SIGKILL");
        await waitForExit(child, 500);
      } else {
        await waitForExit(child, 500);
        if (processTreeExists(child)) {
          await signalProcessTree(child, "SIGTERM");
          await waitForProcessTreeExit(child, 500);
        }
        if (processTreeExists(child)) {
          await signalProcessTree(child, "SIGKILL");
          await waitForProcessTreeExit(child, 500);
        }
      }
    }
    this.#documents.clear();
    this.#diagnostics.clear();
    this.#syncQueues.clear();
  }
}
