import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { registerHerdrSubagentSupervisor } from "../src/supervisor.ts";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  delete (globalThis as { __piHerdrSubagentsReloadV1?: unknown }).__piHerdrSubagentsReloadV1;
});

describe("supervisor lifecycle integration", () => {
  it("opens an exact current-session pane and closes only its owned pane", async () => {
    expect.hasAssertions();
    process.env["HERDR_ENV"] = "1";
    process.env["HERDR_PANE_ID"] = "main-pane";
    const bus = new Map<string, Set<(value: unknown) => void>>();
    const lifecycle = new Map<string, ((event: never, context: never) => unknown)[]>();
    const exec = vi.fn((_command: string, arguments_: string[]) => {
      if (arguments_[0] === "--version") return Promise.resolve(result("herdr 0.8.2"));
      if (arguments_[1] === "split") {
        return Promise.resolve(
          result(JSON.stringify({ result: { pane: { pane_id: "owned-pane" } } })),
        );
      }
      if (arguments_[1] === "process-info") {
        return Promise.resolve(
          result(
            JSON.stringify({
              result: { process_info: { foreground_process_group_id: 7, shell_pid: 7 } },
            }),
          ),
        );
      }
      return Promise.resolve(result());
    });
    const pi = {
      events: {
        emit(channel: string, value: unknown) {
          if (channel === "subagents:rpc:v1:request") {
            const request = value as { requestId: string };
            for (const listener of bus.get(`subagents:rpc:v1:reply:${request.requestId}`) ?? []) {
              listener({ requestId: request.requestId, success: true, version: 1 });
            }
          }
          for (const listener of bus.get(channel) ?? []) listener(value);
        },
        on(channel: string, listener: (value: unknown) => void) {
          const listeners = bus.get(channel) ?? new Set();
          listeners.add(listener);
          bus.set(channel, listeners);
          return () => listeners.delete(listener);
        },
      },
      exec,
      on(name: string, handler: (event: never, context: never) => unknown) {
        lifecycle.set(name, [...(lifecycle.get(name) ?? []), handler]);
      },
    };
    registerHerdrSubagentSupervisor(pi as never);
    const staleShutdown = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "__piHerdrSubagentsReloadV1", {
      configurable: true,
      value: {
        mainPaneId: "main-pane",
        sessionId: "another-session",
        supervisor: { shutdown: staleShutdown },
      },
      writable: true,
    });
    pi.events.emit("subagent:async-started", {
      asyncDir: "/missing/pre-session",
      id: "pre-session",
      sessionId: "/sessions/current.jsonl",
    });
    await emitLifecycle(lifecycle, "tool_execution_end", { result: {}, toolName: "subagent" }, {});
    const sessionFile = "/sessions/current.jsonl";
    let branch: Record<string, unknown>[] = [];
    const context = {
      cwd: "/projects/example",
      mode: "tui",
      sessionManager: {
        getBranch: () => branch,
        getSessionFile: () => sessionFile,
        getSessionId: () => "fallback",
      },
    };
    await emitLifecycle(lifecycle, "session_start", { reason: "startup" }, context);
    expect(staleShutdown).toHaveBeenCalledWith({ closePanes: true });
    const asyncDir = await mkdtemp(join(tmpdir(), "herdr-lifecycle-"));
    await writeFile(
      join(asyncDir, "status.json"),
      JSON.stringify({ runId: "run-1", sessionId: sessionFile, state: "running" }),
      "utf8",
    );
    pi.events.emit("subagent:async-started", {
      agent: "utility",
      asyncDir,
      id: "run-1",
      sessionId: sessionFile,
    });

    await vi.waitFor(() => {
      expect(exec).toHaveBeenCalledWith(
        "herdr",
        ["pane", "run", "owned-pane", 'exec node "$PI_HERDR_SUBAGENT_VIEWER"'],
        expect.any(Object),
      );
    });
    await emitLifecycle(
      lifecycle,
      "tool_execution_update",
      {
        args: {},
        partialResult: {
          content: [{ text: "foreground output", type: "text" }],
          details: { results: [{ agent: "worker", index: 0, runId: "foreground-1" }] },
        },
        toolCallId: "tool-1",
        toolName: "subagent",
      },
      context,
    );
    await emitLifecycle(
      lifecycle,
      "tool_execution_end",
      {
        args: {},
        result: {
          content: [{ text: "foreground output complete", type: "text" }],
          details: {
            results: [{ agent: "worker", index: 0, runId: "foreground-1", success: true }],
          },
        },
        toolCallId: "tool-1",
        toolName: "subagent",
      },
      context,
    );
    await emitLifecycle(
      lifecycle,
      "tool_result",
      {
        content: [{ text: "foreground output complete", type: "text" }],
        details: {
          results: [{ agent: "worker", index: 0, runId: "foreground-1", success: true }],
        },
        toolCallId: "tool-1",
        toolName: "subagent",
      },
      context,
    );
    await emitLifecycle(
      lifecycle,
      "message_end",
      { message: { content: [], role: "assistant" } },
      context,
    );
    await emitLifecycle(
      lifecycle,
      "message_end",
      { message: { content: [], role: "toolResult", toolName: "read" } },
      context,
    );
    await emitLifecycle(
      lifecycle,
      "message_end",
      {
        message: {
          content: [{ text: "foreground output complete", type: "text" }],
          details: {
            results: [{ agent: "worker", index: 0, runId: "foreground-1", success: true }],
          },
          role: "toolResult",
          toolCallId: "tool-1",
          toolName: "subagent",
        },
      },
      context,
    );
    branch = [
      { id: "assistant-1", message: { content: [], role: "assistant" }, type: "message" },
      {
        id: "read-1",
        message: { content: [], role: "toolResult", toolName: "read" },
        type: "message",
      },
      {
        id: "subagent-1",
        message: {
          content: [{ text: "foreground output complete", type: "text" }],
          details: {
            results: [{ agent: "worker", index: 0, runId: "foreground-1", success: true }],
          },
          role: "toolResult",
          toolCallId: "tool-1",
          toolName: "subagent",
        },
        type: "message",
      },
    ];
    await emitLifecycle(
      lifecycle,
      "turn_end",
      {
        message: { content: [], role: "assistant" },
        toolResults: [],
        turnIndex: 0,
      },
      context,
    );
    await emitLifecycle(lifecycle, "agent_settled", {}, context);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await vi.waitFor(() => {
      expect(exec.mock.calls.filter((call) => call[1][1] === "run")).toHaveLength(2);
    });
    await writeFile(
      join(asyncDir, "status.json"),
      JSON.stringify({ runId: "run-1", sessionId: sessionFile, state: "complete" }),
      "utf8",
    );
    pi.events.emit("subagent:async-complete", {
      agent: "utility",
      asyncDir,
      id: "run-1",
      sessionId: sessionFile,
    });
    await emitLifecycle(lifecycle, "session_shutdown", { reason: "reload" }, context);
    expect(exec.mock.calls.some((call) => call[1][1] === "close")).toBe(false);
    await emitLifecycle(lifecycle, "session_start", { reason: "reload" }, context);
    await emitLifecycle(lifecycle, "session_shutdown", { reason: "quit" }, context);
    expect(exec).toHaveBeenCalledWith("herdr", ["pane", "close", "owned-pane"], expect.any(Object));
  });

  it("does not touch Herdr from inherited environment without a TUI session", async () => {
    expect.hasAssertions();
    process.env["HERDR_ENV"] = "1";
    process.env["HERDR_PANE_ID"] = "main-pane";
    const lifecycle = new Map<string, ((event: never, context: never) => unknown)[]>();
    const exec = vi.fn();
    registerHerdrSubagentSupervisor({
      events: { emit: vi.fn(), on: vi.fn(() => vi.fn()) },
      exec,
      on(name: string, handler: (event: never, context: never) => unknown) {
        lifecycle.set(name, [handler]);
      },
    } as never);
    const staleShutdown = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "__piHerdrSubagentsReloadV1", {
      configurable: true,
      value: {
        mainPaneId: "main-pane",
        sessionId: "stale-session",
        supervisor: { shutdown: staleShutdown },
      },
      writable: true,
    });

    await emitLifecycle(
      lifecycle,
      "session_start",
      { reason: "startup" },
      {
        mode: "rpc",
        sessionManager: { getSessionFile: () => "/session" },
      },
    );
    expect(staleShutdown).toHaveBeenCalledWith({ closePanes: true });
    delete process.env["HERDR_ENV"];
    await emitLifecycle(
      lifecycle,
      "session_start",
      { reason: "startup" },
      {
        mode: "tui",
        sessionManager: { getSessionFile: () => "/session" },
      },
    );
    process.env["HERDR_ENV"] = "1";
    delete process.env["HERDR_PANE_ID"];
    await emitLifecycle(
      lifecycle,
      "session_start",
      { reason: "startup" },
      {
        mode: "tui",
        sessionManager: { getSessionFile: () => "/session" },
      },
    );

    expect(exec).not.toHaveBeenCalled();
  });

  it("leaves upstream active when Herdr is too old", async () => {
    expect.hasAssertions();
    process.env["HERDR_ENV"] = "1";
    process.env["HERDR_PANE_ID"] = "main-pane";
    const bus = new Map<string, (value: unknown) => void>();
    const lifecycle = new Map<string, ((event: never, context: never) => unknown)[]>();
    const exec = vi.fn().mockResolvedValue(result("herdr 0.7.4"));
    registerHerdrSubagentSupervisor({
      events: {
        emit(channel: string, value: unknown) {
          if (channel !== "subagents:rpc:v1:request") return;
          const request = value as { requestId: string };
          bus.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({
            requestId: request.requestId,
            success: true,
            version: 1,
          });
        },
        on(channel: string, listener: (value: unknown) => void) {
          bus.set(channel, listener);
          return () => bus.delete(channel);
        },
      },
      exec,
      on(name: string, handler: (event: never, context: never) => unknown) {
        lifecycle.set(name, [handler]);
      },
    } as never);

    await emitLifecycle(
      lifecycle,
      "session_start",
      { reason: "startup" },
      {
        mode: "tui",
        sessionManager: { getSessionFile: () => "/session", getSessionId: () => "fallback" },
      },
    );
    exec.mockResolvedValue({ ...result(), code: 1 });
    await emitLifecycle(
      lifecycle,
      "session_start",
      { reason: "reload" },
      {
        mode: "tui",
        sessionManager: { getSessionFile: () => "/session", getSessionId: () => "fallback" },
      },
    );

    expect(exec).not.toHaveBeenCalledWith(
      "herdr",
      expect.arrayContaining(["split"]),
      expect.any(Object),
    );
  });

  it("does not create pane state without an authoritative Pi session identity", async () => {
    expect.hasAssertions();
    process.env["HERDR_ENV"] = "1";
    process.env["HERDR_PANE_ID"] = "main-pane";
    const bus = new Map<string, (value: unknown) => void>();
    const lifecycle = new Map<string, ((event: never, context: never) => unknown)[]>();
    const exec = vi.fn().mockResolvedValue(result("herdr 0.8.2"));
    registerHerdrSubagentSupervisor({
      events: {
        emit(channel: string, value: unknown) {
          if (channel !== "subagents:rpc:v1:request") return;
          const request = value as { requestId: string };
          bus.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({
            requestId: request.requestId,
            success: true,
            version: 1,
          });
        },
        on(channel: string, listener: (value: unknown) => void) {
          bus.set(channel, listener);
          return () => bus.delete(channel);
        },
      },
      exec,
      on(name: string, handler: (event: never, context: never) => unknown) {
        lifecycle.set(name, [handler]);
      },
    } as never);

    await emitLifecycle(
      lifecycle,
      "session_start",
      { reason: "startup" },
      {
        cwd: "/project",
        mode: "tui",
        sessionManager: { getSessionFile: () => "", getSessionId: () => "" },
      },
    );

    expect(exec).not.toHaveBeenCalledWith(
      "herdr",
      expect.arrayContaining(["split"]),
      expect.any(Object),
    );
  });

  it("reports a bounded pane failure through Pi UI", async () => {
    expect.hasAssertions();
    process.env["HERDR_ENV"] = "1";
    process.env["HERDR_PANE_ID"] = "main-pane";
    const bus = new Map<string, (value: unknown) => void>();
    const lifecycle = new Map<string, ((event: never, context: never) => unknown)[]>();
    const notify = vi.fn();
    const exec = vi.fn((_command: string, arguments_: string[]) =>
      Promise.resolve(result(arguments_[0] === "--version" ? "herdr 0.8.2" : "{}")),
    );
    const events = {
      emit(channel: string, value: unknown) {
        if (channel === "subagents:rpc:v1:request") {
          const request = value as { requestId: string };
          bus.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({
            requestId: request.requestId,
            success: true,
            version: 1,
          });
        }
        bus.get(channel)?.(value);
      },
      on(channel: string, listener: (value: unknown) => void) {
        bus.set(channel, listener);
        return () => bus.delete(channel);
      },
    };
    registerHerdrSubagentSupervisor({
      events,
      exec,
      on(name: string, handler: (event: never, context: never) => unknown) {
        lifecycle.set(name, [handler]);
      },
    } as never);
    const context = {
      cwd: "/project",
      hasUI: true,
      mode: "tui",
      sessionManager: { getSessionFile: () => "/session", getSessionId: () => "fallback" },
      ui: { notify },
    };
    await emitLifecycle(lifecycle, "session_start", { reason: "startup" }, context);
    const asyncDir = await mkdtemp(join(tmpdir(), "herdr-failure-"));
    events.emit("subagent:async-started", {
      asyncDir,
      id: "failed-pane",
      sessionId: "/session",
    });

    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith(expect.stringContaining("exact pane id"), "warning");
    });
    await emitLifecycle(lifecycle, "session_shutdown", { reason: "quit" }, context);
  });
  it("closes a new bridge when retained descriptor rebinding fails", async () => {
    expect.hasAssertions();
    process.env["HERDR_ENV"] = "1";
    process.env["HERDR_PANE_ID"] = "main-pane";
    const listeners = new Map<string, (value: unknown) => void>();
    const lifecycle = new Map<string, ((event: never, context: never) => unknown)[]>();
    const events = {
      emit(channel: string, value: unknown) {
        if (channel !== "subagents:rpc:v1:request") return;
        const request = value as { requestId: string };
        listeners.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({
          requestId: request.requestId,
          success: true,
          version: 1,
        });
      },
      on(channel: string, listener: (value: unknown) => void) {
        listeners.set(channel, listener);
        return () => listeners.delete(channel);
      },
    };
    registerHerdrSubagentSupervisor({
      events,
      exec: vi.fn().mockResolvedValue(result("herdr 0.8.2")),
      on(name: string, handler: (event: never, context: never) => unknown) {
        lifecycle.set(name, [handler]);
      },
    } as never);
    const rebind = vi.fn().mockRejectedValue(new Error("descriptor update failed"));
    const shutdown = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "__piHerdrSubagentsReloadV1", {
      configurable: true,
      value: {
        descriptors: {},
        mainPaneId: "main-pane",
        sessionId: "/session",
        supervisor: { rebind, shutdown },
      },
      writable: true,
    });
    const context = {
      cwd: "/project",
      mode: "tui",
      sessionManager: {
        getBranch: () => [],
        getSessionFile: () => "/session",
        getSessionId: () => "fallback",
      },
    };

    await expect(
      emitLifecycle(lifecycle, "session_start", { reason: "reload" }, context),
    ).rejects.toThrow("descriptor update failed");
    expect(rebind).toHaveBeenCalledOnce();
    expect(shutdown).toHaveBeenCalledWith({ closePanes: true });
  });
});

function result(stdout = "") {
  return { code: 0, killed: false, stderr: "", stdout };
}

async function emitLifecycle(
  handlers: Map<string, ((event: never, context: never) => unknown)[]>,
  name: string,
  event: unknown,
  context: unknown,
): Promise<void> {
  await Promise.all(
    (handlers.get(name) ?? []).map((handler) => handler(event as never, context as never)),
  );
}
