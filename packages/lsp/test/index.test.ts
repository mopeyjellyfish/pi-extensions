import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { createLspExtension } from "../src/index.ts";

import type { LspService, RenameOutcome } from "../src/manager.ts";
import type {
  ExtensionAPI,
  ExtensionContext,
  ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import type { Diagnostic } from "vscode-languageserver-protocol";

interface RegisteredToolResult {
  readonly content: readonly { readonly text?: string; readonly type: string }[];
  readonly details?: unknown;
}

interface RegisteredCommand {
  handler(arguments_: string, context: ExtensionContext): Promise<void>;
}

interface RegisteredTool {
  readonly executionMode?: string;
  readonly name: string;
  readonly prepareArguments?: (input: unknown) => unknown;
  readonly promptSnippet?: string;
  readonly renderShell?: string;
  execute(
    id: string,
    input: Record<string, unknown>,
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<RegisteredToolResult>;
}

interface Harness {
  readonly commands: Map<string, RegisteredCommand>;
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >;
  readonly messages: string[];
  readonly notifications: string[];
  readonly statuses: (string | undefined)[];
  readonly tools: Map<string, RegisteredTool>;
}

function harness(service?: LspService, inlineWaitMs = 50): Harness {
  const commands = new Map<string, RegisteredCommand>();
  const events = new Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >();
  const messages: string[] = [];
  const notifications: string[] = [];
  const statuses: (string | undefined)[] = [];
  const tools = new Map<string, RegisteredTool>();
  const pi = {
    on(name: string, handler: (event: Record<string, unknown>, ctx: ExtensionContext) => unknown) {
      events.set(name, [...(events.get(name) ?? []), handler]);
    },
    registerCommand(name: string, command: RegisteredCommand) {
      commands.set(name, command);
    },
    registerMessageRenderer() {
      return;
    },
    registerTool(tool: ToolDefinition) {
      tools.set(tool.name, tool);
    },
    sendMessage(message: { content: string }) {
      messages.push(message.content);
    },
  } as unknown as ExtensionAPI;
  if (service === undefined) {
    createLspExtension({ inlineWaitMs })(pi);
  } else {
    createLspExtension({ inlineWaitMs, serviceFactory: () => service })(pi);
  }
  return { commands, events, messages, notifications, statuses, tools };
}

async function emit(
  state: Harness,
  name: string,
  event: Record<string, unknown>,
  context: ExtensionContext,
): Promise<unknown[]> {
  return Promise.all((state.events.get(name) ?? []).map((handler) => handler(event, context)));
}

function context(
  cwd: string,
  trusted = true,
  state?: Harness,
  mode: "print" | "tui" = "print",
): ExtensionContext {
  return {
    cwd,
    hasPendingMessages: () => false,
    hasUI: mode === "tui",
    isIdle: () => true,
    isProjectTrusted: () => trusted,
    mode,
    sessionManager: { getBranch: () => [] },
    signal: undefined,
    ui: {
      notify(message: string) {
        state?.notifications.push(message);
      },
      setStatus(_key: string, value: string | undefined) {
        state?.statuses.push(value);
      },
    },
  } as unknown as ExtensionContext;
}

function requiredCommand(state: Harness, name: string): RegisteredCommand {
  const command = state.commands.get(name);
  if (command === undefined) throw new Error(`Command not registered: ${name}`);
  return command;
}

function requiredTool(state: Harness, name: string): RegisteredTool {
  const tool = state.tools.get(name);
  if (tool === undefined) throw new Error(`Tool not registered: ${name}`);
  return tool;
}

function error(line = 2): Diagnostic {
  return {
    code: "TS1",
    message: "introduced",
    range: {
      end: { character: 3, line },
      start: { character: 1, line },
    },
    severity: 1,
    source: "typescript",
  };
}

function fakeService(overrides: Partial<LspService> = {}): LspService {
  return {
    diagnoseMutation: vi.fn().mockResolvedValue([error()]),
    query: vi.fn().mockResolvedValue({
      items: [],
      omitted: 0,
      operation: "definition",
      serverNames: ["fake"],
    }),
    renameFile: vi.fn().mockResolvedValue({
      changedFiles: ["imports.ts"],
      diagnostics: [{ diagnostics: [error(0)], path: "new.ts" }],
      newPath: "new.ts",
      oldPath: "old.ts",
      serverName: "fake",
    } satisfies RenameOutcome),
    shutdown: vi.fn().mockResolvedValue(undefined),
    snapshot: vi.fn().mockResolvedValue(undefined),
    status: vi.fn().mockReturnValue([]),
    validate: vi.fn().mockResolvedValue({
      diagnostics: [],
      omitted: 0,
      scope: "document",
      serverNames: ["fake"],
    }),
    warmFile: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("Pi LSP extension", () => {
  it("wraps built-in write and edit while preserving their results", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-extension-"));
    const diagnoseMutation = vi.fn().mockResolvedValue([error()]);
    const service = fakeService({ diagnoseMutation });
    const state = harness(service);
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);

    const write = requiredTool(state, "write");
    const edit = requiredTool(state, "edit");
    expect(write.promptSnippet).toBe("Create or overwrite files");
    expect(edit.prepareArguments).toBeTypeOf("function");
    expect(edit.renderShell).toBe("self");

    const writeResult = await write.execute(
      "write-1",
      { content: "const value = 1;\n", path: "@example.ts" },
      undefined,
      undefined,
      ctx,
    );
    expect(await readFile(join(cwd, "example.ts"), "utf8")).toContain("value = 1");
    expect(writeResult.content.at(-1)?.type).toBe("text");
    expect(writeResult.content.at(-1)?.text).toContain("LSP: 1 new error");

    const editResult = await edit.execute(
      "edit-1",
      {
        edits: [{ newText: "const value = 2;", oldText: "const value = 1;" }],
        path: "example.ts",
      },
      undefined,
      undefined,
      ctx,
    );
    expect(JSON.stringify(editResult.details)).toContain("value = 2");
    expect(editResult.content.at(-1)?.text).toContain("LSP: 1 new error");
    expect(diagnoseMutation).toHaveBeenCalledTimes(2);
  });

  it("keeps successful filesystem writes successful when LSP diagnostics fail", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-best-effort-"));
    const service = fakeService({
      diagnoseMutation: vi.fn().mockRejectedValue(new Error("server stopped")),
      snapshot: vi.fn().mockRejectedValue(new Error("snapshot unavailable")),
    });
    const state = harness(service);
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);

    const result = await requiredTool(state, "write").execute(
      "write-2",
      { content: "ok\n", path: "ok.ts" },
      undefined,
      undefined,
      ctx,
    );
    expect(result.content).toHaveLength(1);
    await expect(readFile(join(cwd, "ok.ts"), "utf8")).resolves.toBe("ok\n");
  });

  it("serializes same-file snapshots, mutations, and diagnostics", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-transaction-"));
    const path = join(cwd, "example.ts");
    const events: string[] = [];
    const snapshot = vi.fn().mockImplementation(async () => {
      let text = "missing";
      try {
        text = (await readFile(path, "utf8")).trim();
      } catch {
        // The first transaction snapshots a file that has not been created yet.
      }
      events.push(`snapshot:${text}`);
    });
    const diagnoseMutation = vi.fn().mockImplementation(async (_path: string, text: string) => {
      events.push(`diagnose:${text.trim()}`);
      if (text === "first\n") {
        await new Promise<void>((resolveDelay) => {
          setTimeout(resolveDelay, 30);
        });
      }
      return [];
    });
    const state = harness(fakeService({ diagnoseMutation, snapshot }), 100);
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);
    const write = requiredTool(state, "write");

    await Promise.all([
      write.execute(
        "write-first",
        { content: "first\n", path: "example.ts" },
        undefined,
        undefined,
        ctx,
      ),
      write.execute(
        "write-second",
        { content: "second\n", path: "example.ts" },
        undefined,
        undefined,
        ctx,
      ),
    ]);

    expect(events).toEqual([
      "snapshot:missing",
      "diagnose:first",
      "snapshot:first",
      "diagnose:second",
    ]);
    await expect(readFile(path, "utf8")).resolves.toBe("second\n");
  });

  it("exposes bounded semantic LSP queries", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-query-tool-"));
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ column: 2, kind: "definition", line: 3, path: join(cwd, "example.ts") }],
        omitted: 0,
        operation: "definition",
        serverNames: ["Fake LSP"],
      })
      .mockResolvedValueOnce({
        items: [],
        omitted: 2,
        operation: "workspaceSymbols",
        serverNames: ["Fake LSP"],
      });
    const state = harness(fakeService({ query }));
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);
    const tool = requiredTool(state, "lsp_query");
    const result = await tool.execute(
      "query-1",
      { column: 1, line: 1, operation: "definition", path: "example.ts" },
      undefined,
      undefined,
      ctx,
    );
    expect(query).toHaveBeenCalledExactlyOnceWith(
      {
        column: 1,
        line: 1,
        operation: "definition",
        path: join(cwd, "example.ts"),
      },
      undefined,
    );
    expect(result.content[0]?.text).toContain("example.ts:3:2");
    const workspaceResult = await tool.execute(
      "query-workspace",
      { operation: "workspaceSymbols", query: "Example" },
      undefined,
      undefined,
      ctx,
    );
    expect(query).toHaveBeenLastCalledWith(
      { operation: "workspaceSymbols", query: "Example" },
      undefined,
    );
    expect(workspaceResult.content[0]?.text).toContain("2 additional results omitted");
    await expect(
      tool.execute(
        "query-untrusted",
        { operation: "documentSymbols", path: "example.ts" },
        undefined,
        undefined,
        context(cwd, false),
      ),
    ).rejects.toThrow("trusted project");
  });

  it("exposes explicit document and workspace validation", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-validation-tool-"));
    const path = join(cwd, "example.ts");
    const validate = vi.fn().mockResolvedValue({
      diagnostics: [{ diagnostics: [error(0)], path }],
      omitted: 0,
      scope: "document",
      serverNames: ["Fake LSP"],
    });
    const state = harness(fakeService({ validate }));
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);
    const tool = requiredTool(state, "lsp_validate");
    const result = await tool.execute(
      "validate-1",
      { paths: ["example.ts"], scope: "document" },
      undefined,
      undefined,
      ctx,
    );
    expect(validate).toHaveBeenCalledExactlyOnceWith(
      { paths: [path], scope: "document", severity: "error" },
      undefined,
    );
    expect(result.content[0]?.text).toContain("example.ts:1:2 error");
    await expect(
      tool.execute(
        "validate-untrusted",
        { paths: ["example.ts"], scope: "document" },
        undefined,
        undefined,
        context(cwd, false),
      ),
    ).rejects.toThrow("trusted project");
  });

  it("delegates semantic renames and cleans up the session", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-rename-"));
    await writeFile(join(cwd, "old.ts"), "export const value = 1;\n");
    const renameFile = vi.fn().mockResolvedValue({
      changedFiles: ["imports.ts"],
      diagnostics: [{ diagnostics: [error(0)], path: "new.ts" }],
      newPath: "new.ts",
      oldPath: "old.ts",
      serverName: "fake",
    } satisfies RenameOutcome);
    const shutdown = vi.fn().mockResolvedValue(undefined);
    const service = fakeService({ renameFile, shutdown });
    const state = harness(service);
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);

    const rename = requiredTool(state, "lsp_rename_file");
    expect(rename.executionMode).toBe("sequential");
    const result = await rename.execute(
      "rename-1",
      { newPath: "new.ts", oldPath: pathToFileURL(join(cwd, "old.ts")).href },
      undefined,
      undefined,
      ctx,
    );
    expect(renameFile).toHaveBeenCalledWith(join(cwd, "old.ts"), join(cwd, "new.ts"), undefined);
    expect(result.content[0]?.text).toContain("fake");

    await emit(state, "session_shutdown", {}, ctx);
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it("warms successful reads, reports status, and rebuilds TUI lifecycle state", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-events-"));
    const warmFile = vi.fn().mockResolvedValue(undefined);
    const shutdown = vi.fn().mockResolvedValue(undefined);
    const service = fakeService({
      shutdown,
      status: vi
        .fn()
        .mockReturnValue([
          { id: "fake", message: "ready", name: "Fake LSP", root: cwd, state: "running" },
        ]),
      warmFile,
    });
    const state = harness(service);
    const ctx = context(cwd, true, state, "tui");
    await emit(state, "session_start", {}, ctx);
    await emit(
      state,
      "tool_result",
      {
        content: [],
        details: {},
        input: { path: "example.ts" },
        isError: false,
        toolCallId: "read-1",
        toolName: "read",
      },
      ctx,
    );
    await new Promise<void>((resolveDelay) => {
      setTimeout(() => {
        resolveDelay();
      }, 0);
    });
    expect(warmFile).toHaveBeenCalledExactlyOnceWith(join(cwd, "example.ts"), undefined);

    await emit(
      state,
      "tool_result",
      {
        content: [],
        details: {},
        input: { path: "ignored.ts" },
        isError: true,
        toolCallId: "read-2",
        toolName: "read",
      },
      ctx,
    );
    await emit(
      state,
      "tool_result",
      {
        content: [],
        details: {},
        input: { path: 42 },
        isError: false,
        toolCallId: "read-3",
        toolName: "read",
      },
      ctx,
    );
    await emit(
      state,
      "tool_result",
      {
        content: [],
        details: {},
        input: { path: "write.ts" },
        isError: false,
        toolCallId: "write-1",
        toolName: "write",
      },
      ctx,
    );
    expect(warmFile).toHaveBeenCalledTimes(1);
    await requiredCommand(state, "lsp").handler("", ctx);
    expect(state.notifications.some((message) => message.includes("Fake LSP: running"))).toBe(true);
    expect(state.statuses).toContain("LSP: ready");

    await emit(state, "session_start", {}, ctx);
    expect(shutdown).toHaveBeenCalledOnce();
    await emit(state, "session_shutdown", {}, ctx);
    expect(shutdown).toHaveBeenCalledTimes(2);
    expect(state.statuses.at(-1)).toBeUndefined();
  });

  it("delivers slow diagnostics later and omits clean inline diagnostics", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-late-"));
    const diagnoseMutation = vi
      .fn()
      .mockImplementationOnce(async () => {
        await new Promise<void>((resolveDelay) => {
          setTimeout(() => {
            resolveDelay();
          }, 30);
        });
        return [error()];
      })
      .mockResolvedValueOnce([]);
    const state = harness(fakeService({ diagnoseMutation }), 5);
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);
    const write = requiredTool(state, "write");
    const lateResult = await write.execute(
      "write-late",
      { content: "late\n", path: "late.ts" },
      undefined,
      undefined,
      ctx,
    );
    expect(lateResult.content).toHaveLength(1);
    await new Promise<void>((resolveDelay) => {
      setTimeout(() => {
        resolveDelay();
      }, 50);
    });
    expect(state.messages.some((message) => message.includes("Late diagnostics"))).toBe(true);

    const cleanResult = await write.execute(
      "write-clean",
      { content: "clean\n", path: "clean.ts" },
      undefined,
      undefined,
      ctx,
    );
    expect(cleanResult.content).toHaveLength(1);
  });

  it("normalizes home paths and bounds warning-only rename results", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-paths-"));
    const renameFile = vi.fn().mockResolvedValue({
      changedFiles: [],
      diagnostics: [{ diagnostics: [], path: join(cwd, "new.ts") }],
      newPath: join(homedir(), "new.ts"),
      oldPath: homedir(),
      serverName: "fake",
      warning: "notification unavailable",
    } satisfies RenameOutcome);
    const state = harness(fakeService({ renameFile }));
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);
    const result = await requiredTool(state, "lsp_rename_file").execute(
      "rename-home",
      { newPath: "~/new.ts", oldPath: "~" },
      undefined,
      undefined,
      ctx,
    );
    expect(renameFile).toHaveBeenCalledExactlyOnceWith(
      homedir(),
      join(homedir(), "new.ts"),
      undefined,
    );
    expect(result.content[0]?.text).toContain("Warning: notification unavailable");
    expect(result.details).toMatchObject({ changedFiles: [], diagnosticCount: 0 });
  });

  it("uses the default manager and reports an empty status without UI", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-default-manager-"));
    const state = harness();
    const ctx = context(cwd);
    await emit(state, "session_start", {}, ctx);
    await expect(requiredCommand(state, "lsp").handler("", ctx)).resolves.toBeUndefined();
    expect(state.notifications).toEqual([]);
    await emit(state, "session_shutdown", {}, ctx);
    await emit(state, "session_shutdown", {}, ctx);
    expect(state.messages).toEqual([]);
  });

  it("refuses semantic renames in untrusted projects", async () => {
    expect.hasAssertions();
    const cwd = await mkdtemp(join(tmpdir(), "pi-lsp-untrusted-"));
    const state = harness(fakeService());
    const ctx = context(cwd, false);
    await emit(state, "session_start", {}, ctx);
    await expect(
      requiredTool(state, "lsp_rename_file").execute(
        "rename-2",
        { newPath: "new.ts", oldPath: "old.ts" },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow("trusted project");
  });
});
