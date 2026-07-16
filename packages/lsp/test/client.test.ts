import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { LspClient, windowsTaskkillArguments } from "../src/client.ts";

const fixture = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-lsp-server.mjs");

function processIsRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false;
    throw error;
  }
}

describe("LspClient", () => {
  it("initializes, synchronizes versioned diagnostics, and performs rename notifications", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-client-"));
    const file = join(root, "old.ts");
    const importFile = join(root, "imports.ts");
    const log = join(root, "server.log");
    await writeFile(file, "BROKEN\n");
    await writeFile(importFile, 'export { value } from "./old";\n');

    const client = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: {
        ...process.env,
        FAKE_CLIENT_EDGE_REQUESTS: "1",
        FAKE_IMPORT_FILE: importFile,
        FAKE_LSP_LOG: log,
      },
      id: "fake",
      name: "Fake LSP",
      root,
    });

    await client.start();
    await client.start();
    expect(client.id).toBe("fake");
    expect(client.name).toBe("Fake LSP");
    expect(client.root).toBe(root);
    const synchronization = await client.syncDocument(file, "typescript", "BROKEN\n");
    const diagnostics = await client.freshDiagnostics(synchronization, undefined, 1000);
    expect(diagnostics).toMatchObject([{ code: "FAKE1", message: "synthetic failure" }]);
    expect(client.diagnostics(synchronization.uri)).toHaveLength(1);
    expect(client.documentText(synchronization.uri)).toBe("BROKEN\n");

    expect(client.supportsWillRenameFiles()).toBe(true);
    const workspaceEdit = await client.willRenameFiles(file, join(root, "new.ts"));
    expect(workspaceEdit?.changes?.[pathToFileURL(importFile).href]).toHaveLength(1);
    await client.didRenameFiles(file, join(root, "new.ts"));
    await client.shutdown();
    await client.shutdown();

    const calls = await readFile(log, "utf8");
    expect(calls).toContain("initialize");
    expect(calls).toContain("textDocument/didOpen");
    expect(calls).toContain("workspace/willRenameFiles");
    expect(calls).toContain("workspace/didRenameFiles");
    expect(calls).toContain("textDocument/didClose");
    expect(calls).toContain("workspace/configuration");
    expect(calls).toContain("workspace/applyEdit");
    expect(calls).not.toContain("BAD_RESOURCE_OPERATIONS");
    expect(calls).not.toContain("BAD_FILE_OPERATION_CAPABILITIES");
    expect(calls).toContain("shutdown");
  });

  it("rejects requests when startup is aborted", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-abort-"));
    const controller = new AbortController();
    controller.abort();
    const client = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: process.env,
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await expect(client.start(controller.signal)).rejects.toThrow(/abort/i);
    await client.shutdown();
  });

  it("serializes incremental document updates and settles unversioned diagnostics", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-incremental-"));
    const file = join(root, "example.ts");
    const log = join(root, "server.log");
    const client = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: {
        ...process.env,
        FAKE_INCREMENTAL: "1",
        FAKE_LSP_LOG: log,
        FAKE_UNVERSIONED: "1",
      },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await client.start();
    const [first, second] = await Promise.all([
      client.syncDocument(file, "typescript", "first\n😀"),
      client.syncDocument(file, "typescript", "BROKEN\n"),
    ]);
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    await expect(client.freshDiagnostics(second, undefined, 1000)).resolves.toHaveLength(1);
    expect(client.documentText(second.uri)).toBe("BROKEN\n");
    expect(await readFile(log, "utf8")).toContain("didChangeVersion:2");
    await client.shutdown();
  });

  it("rejects stale versioned diagnostics instead of treating them as settled", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-stale-"));
    const file = join(root, "example.ts");
    const client = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_STALE_VERSION: "1" },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await client.start();
    const synchronization = await client.syncDocument(file, "typescript", "BROKEN\n");
    await expect(client.freshDiagnostics(synchronization, undefined, 100)).resolves.toEqual([]);
    await client.shutdown();
  });

  it("honors static and dynamically registered rename capabilities", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-capabilities-"));
    const oldPath = join(root, "old.ts");
    const newPath = join(root, "new.ts");
    const unsupported = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_NO_RENAME: "1" },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await unsupported.start();
    expect(unsupported.supportsWillRenameFiles()).toBe(false);
    await expect(unsupported.willRenameFiles(oldPath, newPath)).rejects.toThrow("does not support");
    await unsupported.didRenameFiles(oldPath, newPath);
    await unsupported.shutdown();

    const dynamic = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_DYNAMIC_RENAME: "1", FAKE_NO_RENAME: "1" },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await dynamic.start();
    await new Promise<void>((resolveDelay) => {
      setTimeout(() => {
        resolveDelay();
      }, 25);
    });
    expect(dynamic.supportsWillRenameFiles()).toBe(true);
    await expect(dynamic.willRenameFiles(oldPath, newPath)).resolves.toBeNull();
    const controller = new AbortController();
    controller.abort();
    await expect(dynamic.willRenameFiles(oldPath, newPath, controller.signal)).rejects.toThrow(
      /abort/i,
    );
    await dynamic.shutdown();
  });

  it("respects disabled and legacy numeric document synchronization", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-sync-options-"));
    const file = join(root, "example.ts");
    const disabledLog = join(root, "disabled.log");
    const disabled = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_DISABLED_SYNC: "1", FAKE_LSP_LOG: disabledLog },
      id: "disabled",
      name: "Disabled Sync LSP",
      root,
    });
    await disabled.start();
    await disabled.syncDocument(file, "typescript", "first\n");
    await disabled.syncDocument(file, "typescript", "second\n");
    await disabled.didRenameFiles(file, join(root, "renamed.ts"));
    await disabled.shutdown();
    const disabledCalls = await readFile(disabledLog, "utf8");
    expect(disabledCalls).not.toMatch(/textDocument\/did(?:Open|Change|Save|Close)/u);

    const numericLog = join(root, "numeric.log");
    const numeric = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_LSP_LOG: numericLog, FAKE_NUMERIC_SYNC: "1" },
      id: "numeric",
      name: "Numeric Sync LSP",
      root,
    });
    await numeric.start();
    await numeric.syncDocument(file, "typescript", "first\n");
    await numeric.syncDocument(file, "typescript", "second\n");
    await numeric.didRenameFiles(file, join(root, "renamed.ts"));
    await numeric.shutdown();
    const numericCalls = await readFile(numericLog, "utf8");
    expect(numericCalls).toContain("textDocument/didOpen");
    expect(numericCalls).toContain("textDocument/didChange");
    expect(numericCalls).toContain("textDocument/didClose");
    expect(numericCalls).not.toContain("textDocument/didSave");

    const incrementalLog = join(root, "incremental-no-open.log");
    const incremental = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: {
        ...process.env,
        FAKE_INCREMENTAL_NO_OPEN: "1",
        FAKE_LSP_LOG: incrementalLog,
      },
      id: "incremental",
      name: "Incremental Sync LSP",
      root,
    });
    await incremental.start();
    await incremental.syncDocument(file, "typescript", "first\n");
    expect(await readFile(incrementalLog, "utf8")).not.toContain("textDocument/didChange");
    await incremental.syncDocument(file, "typescript", "second\n");
    await incremental.shutdown();
    expect(await readFile(incrementalLog, "utf8")).toContain("textDocument/didChange");
    expect(windowsTaskkillArguments(42, true)).toEqual(["/PID", "42", "/T", "/F"]);
  });

  it("cancels in-flight diagnostics and rename requests and times out missing responses", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-cancellation-"));
    const file = join(root, "example.ts");
    const delayed = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: {
        ...process.env,
        FAKE_NO_DIAGNOSTICS: "1",
        FAKE_RENAME_DELAY_MS: "200",
      },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await delayed.start();
    const synchronization = await delayed.syncDocument(file, "typescript", "BROKEN\n");
    const diagnosticAbort = new AbortController();
    const pendingDiagnostics = delayed.freshDiagnostics(
      synchronization,
      diagnosticAbort.signal,
      1000,
    );
    setTimeout(() => {
      diagnosticAbort.abort();
    }, 10);
    await expect(pendingDiagnostics).rejects.toThrow(/abort/i);

    const renameAbort = new AbortController();
    const pendingRename = delayed.willRenameFiles(file, join(root, "new.ts"), renameAbort.signal);
    setTimeout(() => {
      renameAbort.abort();
    }, 10);
    await expect(pendingRename).rejects.toThrow(/abort/i);
    await delayed.shutdown();

    const timeout = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_NO_RENAME_RESPONSE: "1" },
      id: "fake",
      name: "Fake LSP",
      requestTimeoutMs: 1000,
      root,
    });
    await timeout.start();
    await expect(timeout.willRenameFiles(file, join(root, "new.ts"))).rejects.toThrow("timed out");
    await timeout.shutdown();
  });

  it("rejects missing executables and cleans up failed initialization", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-spawn-failure-"));
    const missing = new LspClient({
      args: [],
      command: join(root, "missing-lsp"),
      id: "missing",
      name: "Missing LSP",
      root,
    });
    await expect(missing.start()).rejects.toMatchObject({ code: "ENOENT" });
    await missing.shutdown();

    const failed = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_INITIALIZE_ERROR: "1", FAKE_STDERR: "1" },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await expect(failed.start()).rejects.toThrow("initialize failed");
    await new Promise<void>((resolveDelay) => {
      setTimeout(() => {
        resolveDelay();
      }, 10);
    });
    await expect(
      failed.syncDocument(join(root, "failed.ts"), "typescript", "clean\n"),
    ).rejects.toThrow("fake server stderr");
    await failed.shutdown();
  });

  it("bounds shutdown and escalates when a server ignores termination", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-failure-"));
    const childPidFile = join(root, "child.pid");
    const log = join(root, "signals.log");
    const unresponsive = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: {
        ...process.env,
        FAKE_CHILD_PID_FILE: childPidFile,
        FAKE_IGNORE_EXIT: "1",
        FAKE_IGNORE_SIGTERM: "1",
        FAKE_LSP_LOG: log,
        FAKE_NO_SHUTDOWN_RESPONSE: "1",
      },
      id: "fake",
      name: "Fake LSP",
      root,
    });
    await unresponsive.start();
    const started = Date.now();
    await unresponsive.shutdown();
    expect(Date.now() - started).toBeLessThan(3500);
    await expect(readFile(log, "utf8")).resolves.toContain("SIGTERM");
    const childPid = Number(await readFile(childPidFile, "utf8"));
    const childRunning = processIsRunning(childPid);
    if (childRunning) process.kill(childPid, "SIGKILL");
    expect(childRunning).toBe(false);

    const gracefulPidFile = join(root, "graceful-child.pid");
    const graceful = new LspClient({
      args: [fixture],
      command: process.execPath,
      env: { ...process.env, FAKE_CHILD_PID_FILE: gracefulPidFile },
      id: "graceful",
      name: "Graceful LSP",
      root,
    });
    await graceful.start();
    await graceful.shutdown();
    const gracefulPid = Number(await readFile(gracefulPidFile, "utf8"));
    const gracefulChildRunning = processIsRunning(gracefulPid);
    if (gracefulChildRunning) process.kill(gracefulPid, "SIGKILL");
    expect(gracefulChildRunning).toBe(false);
  });
});
