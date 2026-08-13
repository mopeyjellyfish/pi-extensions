import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import playwrightCleanupExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type Handler = (event: Record<string, unknown>, ctx: ExtensionContext) => unknown;

interface RegisteredTool {
  readonly execute: (
    id: string,
    input: Record<string, unknown>,
    signal: AbortSignal | undefined,
    update: undefined,
    ctx: ExtensionContext,
  ) => Promise<unknown>;
  readonly promptGuidelines?: readonly string[];
  readonly promptSnippet?: string;
}

interface FakeProcess {
  command: string;
  pid: number;
  ppid: number;
  startedAt: string;
}

function processOutput(processes: ReadonlyMap<number, FakeProcess>): string {
  return [...processes.values()]
    .map(
      (process) =>
        `${String(process.pid)} ${String(process.ppid)} ${process.startedAt} ${process.command}`,
    )
    .join("\n");
}

function result(stdout = "", code = 0) {
  return { code, killed: false, stderr: "", stdout };
}

function harness(
  exec: ReturnType<typeof vi.fn>,
  leaseDirectory: string,
  sessionId = "pi-session-1",
) {
  const handlers = new Map<string, Handler[]>();
  const bus = new Map<string, ((value: unknown) => void)[]>();
  const notify = vi.fn();
  let tool: RegisteredTool | undefined;
  const pi = {
    events: {
      emit(name: string, value: unknown) {
        for (const handler of bus.get(name) ?? []) handler(value);
      },
      on(name: string, handler: (value: unknown) => void) {
        bus.set(name, [...(bus.get(name) ?? []), handler]);
        return () => {
          bus.delete(name);
        };
      },
    },
    exec,
    on(name: string, handler: Handler) {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    },
    registerTool(value: RegisteredTool) {
      tool = value;
    },
  } as unknown as ExtensionAPI;
  const ctx = {
    cwd: "/repo/main",
    hasUI: true,
    sessionManager: { getSessionId: () => sessionId },
    ui: { notify },
  } as unknown as ExtensionContext;
  playwrightCleanupExtension(pi, { leaseDirectory });
  return {
    ctx,
    notify,
    pi,
    tool() {
      if (tool === undefined) throw new Error("tool was not registered");
      return tool;
    },
    async emit(name: string, event: Record<string, unknown> = {}) {
      let response: unknown;
      for (const handler of handlers.get(name) ?? []) response = await handler(event, ctx);
      return response;
    },
  };
}

function fakeRuntime() {
  const ownerPid = process.pid;
  const owner: FakeProcess = {
    command: "node pi",
    pid: ownerPid,
    ppid: 1,
    startedAt: "Mon Jan 1 00:00:00 2024",
  };
  const processes = new Map([[ownerPid, owner]]);
  let nextPid = 10_000;
  const exec = vi.fn(
    (command: string, arguments_: readonly string[], options: { readonly cwd?: string }) => {
      if (command === "ps") return result(processOutput(processes));
      if (command !== "playwright-cli") return result("", 1);
      const session = arguments_.find((argument) => argument.startsWith("-s="))?.slice(3) ?? "";
      if (arguments_.includes("open")) {
        const daemonPid = ++nextPid;
        const browserPid = ++nextPid;
        processes.set(daemonPid, {
          command: `/playwright/cliDaemon.js ${session}`,
          pid: daemonPid,
          ppid: 1,
          startedAt: "Mon Jan 1 00:00:01 2024",
        });
        processes.set(browserPid, {
          command: "Google Chrome --headless",
          pid: browserPid,
          ppid: daemonPid,
          startedAt: "Mon Jan 1 00:00:02 2024",
        });
        return result(JSON.stringify({ pid: daemonPid, session }));
      }
      if (arguments_.includes("close")) {
        const owned = [...processes.values()].filter(
          (process) =>
            process.command.endsWith(` ${session}`) ||
            processes.get(process.ppid)?.command.endsWith(` ${session}`) === true,
        );
        for (const process of owned) processes.delete(process.pid);
        return result(JSON.stringify({ session, status: "closed" }));
      }
      return result(JSON.stringify({ ok: true, cwd: options.cwd }));
    },
  );
  return { exec, owner, processes };
}

function commandHash(command: string): string {
  return createHash("sha256").update(command).digest("hex");
}

describe("playwright cleanup", () => {
  it("uses one Pi-session-owned browser and closes it from the opening worktree", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const state = harness(runtime.exec, leases, "019ffcef-6379-7aba");
    await state.emit("session_start");
    state.pi.events.emit("mopeyjellyfish:pi-worktrunk:route:v1", {
      activePath: "/repo/worktree-a",
      version: 1,
    });

    const opened = state
      .tool()
      .execute(
        "open",
        { action: "open", url: "https://example.com" },
        undefined,
        undefined,
        state.ctx,
      );
    const openResult = (await opened) as { details: { sessionName: string } };
    const session = openResult.details.sessionName;
    expect(session).toMatch(/^pi-[a-zA-Z0-9]+-[0-9a-f]{12}$/u);

    const reused = await state
      .tool()
      .execute(
        "reuse",
        { action: "open", url: "https://example.com/cart" },
        undefined,
        undefined,
        state.ctx,
      );
    expect(reused).toBeDefined();
    expect(
      runtime.exec.mock.calls.filter(([, arguments_]) => arguments_.includes("open")),
    ).toHaveLength(1);
    expect(runtime.exec).toHaveBeenCalledWith(
      "playwright-cli",
      ["--json", `-s=${session}`, "goto", "https://example.com/cart"],
      expect.objectContaining({ cwd: "/repo/worktree-a" }),
    );

    await state.emit("agent_settled");
    expect(runtime.exec).toHaveBeenCalledWith(
      "playwright-cli",
      ["--json", `-s=${session}`, "close"],
      expect.objectContaining({ cwd: "/repo/worktree-a" }),
    );
    expect(runtime.processes.size).toBe(1);
    expect(state.notify).not.toHaveBeenCalled();
  });

  it("serializes concurrent opens so only one daemon is created", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");

    await Promise.all([
      state.tool().execute("a", { action: "open" }, undefined, undefined, state.ctx),
      state.tool().execute("b", { action: "open" }, undefined, undefined, state.ctx),
    ]);

    expect(
      runtime.exec.mock.calls.filter(([, arguments_]) => arguments_.includes("open")),
    ).toHaveLength(1);
    expect(
      runtime.exec.mock.calls.filter(([, arguments_]) => arguments_.includes("snapshot")),
    ).toHaveLength(1);
  });

  it("blocks Playwright CLI through Bash and context-mode tools", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const state = harness(fakeRuntime().exec, leases);

    const bash = await state.emit("tool_call", {
      input: { command: "playwright-cli open https://example.com" },
      toolCallId: "bash",
      toolName: "bash",
    });
    const context = await state.emit("tool_call", {
      input: { code: "playwright-cli open https://example.com", language: "shell" },
      toolCallId: "ctx",
      toolName: "ctx_execute",
    });

    expect(bash).toEqual(expect.objectContaining({ block: true }));
    expect(context).toEqual(expect.objectContaining({ block: true }));
    expect(state.tool().promptSnippet).toContain("Pi-owned Playwright CLI browser");
    expect(state.tool().promptGuidelines).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Use playwright_browser instead of running playwright-cli"),
        expect.stringContaining("action=close"),
      ]),
    );
  });

  it("recovers a stale exact lease but leaves another live Pi owner's lease", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const liveOwner: FakeProcess = {
      command: "node another-pi",
      pid: 20_000,
      ppid: 1,
      startedAt: "Mon Jan 1 00:00:00 2024",
    };
    const staleDaemon: FakeProcess = {
      command: "/playwright/cliDaemon.js pi-stale-owner",
      pid: 20_001,
      ppid: 1,
      startedAt: "Mon Jan 1 00:00:01 2024",
    };
    const liveDaemon: FakeProcess = {
      command: "/playwright/cliDaemon.js pi-live-owner",
      pid: 20_002,
      ppid: 1,
      startedAt: "Mon Jan 1 00:00:01 2024",
    };
    runtime.processes.set(liveOwner.pid, liveOwner);
    runtime.processes.set(staleDaemon.pid, staleDaemon);
    runtime.processes.set(liveDaemon.pid, liveDaemon);
    const lease = (sessionName: string, owner: FakeProcess, daemon: FakeProcess) => ({
      createdAt: new Date(0).toISOString(),
      daemonPid: daemon.pid,
      launcher: "playwright-cli",
      ownerPiSessionId: sessionName,
      ownerProcess: {
        commandHash: commandHash(owner.command),
        pid: owner.pid,
        ppid: owner.ppid,
        startedAt: owner.startedAt,
      },
      processes: [
        {
          commandHash: commandHash(daemon.command),
          pid: daemon.pid,
          ppid: daemon.ppid,
          startedAt: daemon.startedAt,
        },
      ],
      sessionName,
      updatedAt: new Date(0).toISOString(),
      version: 1,
      workspace: "/repo/worktree",
    });
    await writeFile(
      join(leases, "pi-stale-owner.json"),
      JSON.stringify(lease("pi-stale-owner", { ...runtime.owner, pid: 99_999 }, staleDaemon)),
    );
    await writeFile(
      join(leases, "pi-live-owner.json"),
      JSON.stringify(lease("pi-live-owner", liveOwner, liveDaemon)),
    );
    const state = harness(runtime.exec, leases);

    await state.emit("session_start");

    expect(runtime.processes.has(staleDaemon.pid)).toBe(false);
    expect(runtime.processes.has(liveDaemon.pid)).toBe(true);
    expect(
      runtime.exec.mock.calls.some(([, arguments_]) => arguments_.includes("-s=pi-live-owner")),
    ).toBe(false);
    await expect(readFile(join(leases, "pi-live-owner.json"), "utf8")).resolves.toContain(
      "pi-live-owner",
    );
    await expect(readFile(join(leases, "pi-stale-owner.json"), "utf8")).rejects.toThrow();
  });

  it("uses exact recorded identities when registry close cannot find the daemon", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps") return result(processOutput(runtime.processes));
      if (command === "playwright-cli" && arguments_.includes("open")) {
        runtime.processes.set(30_000, {
          command: `/playwright/cliDaemon.js ${arguments_.find((argument) => argument.startsWith("-s="))?.slice(3) ?? ""}`,
          pid: 30_000,
          ppid: 1,
          startedAt: "Mon Jan 1 00:00:01 2024",
        });
        return result(JSON.stringify({ pid: 30_000 }));
      }
      if (command === "playwright-cli" && arguments_.includes("close")) {
        return result(JSON.stringify({ status: "not-open" }));
      }
      return result(JSON.stringify({ ok: true }));
    });
    const kill = vi.spyOn(process, "kill").mockImplementation((pid) => {
      runtime.processes.delete(pid);
      return true;
    });
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");
    await state.tool().execute("open", { action: "open" }, undefined, undefined, state.ctx);

    await state.emit("session_shutdown");

    expect(kill).toHaveBeenCalledWith(30_000, "SIGTERM");
    expect(runtime.processes.has(30_000)).toBe(false);
    kill.mockRestore();
  });

  it("validates inputs, runs safe commands, reports status, and closes idempotently", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");

    const closed = (await state
      .tool()
      .execute("status", { action: "status" }, undefined, undefined, state.ctx)) as {
      content: { text: string }[];
    };
    expect(closed.content[0]?.text).toContain("closed");
    await expect(
      state
        .tool()
        .execute("run", { action: "run", command: "snapshot" }, undefined, undefined, state.ctx),
    ).rejects.toThrow("Open the Playwright browser first");
    await expect(
      state
        .tool()
        .execute(
          "invalid-open",
          { action: "open", arguments: ["unexpected"] },
          undefined,
          undefined,
          state.ctx,
        ),
    ).rejects.toThrow("action=open does not accept");

    await state.tool().execute(
      "open",
      {
        action: "open",
        browser: "firefox",
        config: "/repo/playwright.json",
        headed: true,
        persistent: true,
        profile: "qa",
      },
      undefined,
      undefined,
      state.ctx,
    );
    expect(runtime.exec).toHaveBeenCalledWith(
      "playwright-cli",
      expect.arrayContaining([
        "--headed",
        "--browser=firefox",
        "--persistent",
        "--profile=qa",
        "--config=/repo/playwright.json",
      ]),
      expect.objectContaining({ cwd: "/repo/main" }),
    );

    const run = await state
      .tool()
      .execute(
        "run",
        { action: "run", arguments: ["button"], command: "click" },
        undefined,
        undefined,
        state.ctx,
      );
    expect(run).toBeDefined();
    await expect(
      state
        .tool()
        .execute(
          "blocked",
          { action: "run", arguments: [], command: "kill-all" },
          undefined,
          undefined,
          state.ctx,
        ),
    ).rejects.toThrow("does not permit");
    await expect(
      state
        .tool()
        .execute(
          "session-flag",
          { action: "run", arguments: ["--session=other"], command: "click" },
          undefined,
          undefined,
          state.ctx,
        ),
    ).rejects.toThrow("Session and JSON flags are owned");

    await state.tool().execute("close", { action: "close" }, undefined, undefined, state.ctx);
    const secondClose = (await state
      .tool()
      .execute("close-again", { action: "close" }, undefined, undefined, state.ctx)) as {
      content: { text: string }[];
    };
    expect(secondClose.content[0]?.text).toContain("closed and verified");
  });

  it("keeps an exact lease when process inspection cannot verify cleanup", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");
    const opened = (await state
      .tool()
      .execute("open", { action: "open" }, undefined, undefined, state.ctx)) as {
      details: { sessionName: string };
    };
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps") return result("", 1);
      if (command === "playwright-cli" && arguments_.includes("close")) {
        return result(JSON.stringify({ status: "not-open" }));
      }
      return result();
    });

    await state.emit("agent_settled");

    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("durable lease remains"),
      "warning",
    );
    await expect(
      readFile(join(leases, `${opened.details.sessionName}.json`), "utf8"),
    ).resolves.toContain(opened.details.sessionName);
  });

  it("ignores malformed and oversized stale lease files", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    await mkdir(leases, { recursive: true });
    await writeFile(join(leases, "malformed.json"), "{not-json");
    await writeFile(join(leases, "oversized.json"), "x".repeat(65_537));
    const runtime = fakeRuntime();
    const state = harness(runtime.exec, leases);

    await state.emit("session_start");

    expect(runtime.processes.size).toBe(1);
    expect(state.notify).not.toHaveBeenCalled();
  });

  it("retains authority after a failed open and recovers it at settlement", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps") return result(processOutput(runtime.processes));
      if (command === "playwright-cli" && arguments_.includes("open")) {
        const session = arguments_.find((argument) => argument.startsWith("-s="))?.slice(3) ?? "";
        runtime.processes.set(40_000, {
          command: `/playwright/cliDaemon.js ${session}`,
          pid: 40_000,
          ppid: 1,
          startedAt: "Mon Jan 1 00:00:01 2024",
        });
        return result("provider returned invalid JSON", 1);
      }
      if (command === "playwright-cli" && arguments_.includes("close")) {
        return result(JSON.stringify({ status: "not-open" }));
      }
      return result(JSON.stringify({ ok: true }));
    });
    const kill = vi.spyOn(process, "kill").mockImplementation((pid) => {
      runtime.processes.delete(pid);
      return true;
    });
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");

    await expect(
      state.tool().execute("open", { action: "open" }, undefined, undefined, state.ctx),
    ).rejects.toThrow("provider returned invalid JSON");
    expect(await readdir(leases)).toHaveLength(1);

    await state.emit("agent_settled");

    expect(kill).toHaveBeenCalledWith(40_000, "SIGTERM");
    expect(runtime.processes.has(40_000)).toBe(false);
    expect(await readdir(leases)).toHaveLength(0);
    kill.mockRestore();
  });

  it("escalates exact cleanup to SIGKILL when SIGTERM does not stop the daemon", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps") return result(processOutput(runtime.processes));
      if (command === "playwright-cli" && arguments_.includes("open")) {
        const session = arguments_.find((argument) => argument.startsWith("-s="))?.slice(3) ?? "";
        runtime.processes.set(50_000, {
          command: `/playwright/cliDaemon.js ${session}`,
          pid: 50_000,
          ppid: 1,
          startedAt: "Mon Jan 1 00:00:01 2024",
        });
        return result(JSON.stringify({ pid: 50_000 }));
      }
      if (command === "playwright-cli" && arguments_.includes("close")) {
        return result(JSON.stringify({ status: "not-open" }));
      }
      return result(JSON.stringify({ ok: true }));
    });
    const kill = vi.spyOn(process, "kill").mockImplementation((pid, signal) => {
      if (signal === "SIGKILL") runtime.processes.delete(pid);
      return true;
    });
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");
    await state.tool().execute("open", { action: "open" }, undefined, undefined, state.ctx);

    await state.emit("session_shutdown");

    expect(kill).toHaveBeenCalledWith(50_000, "SIGTERM");
    expect(kill).toHaveBeenCalledWith(50_000, "SIGKILL");
    expect(runtime.processes.has(50_000)).toBe(false);
    kill.mockRestore();
  });

  it.each<[string, (daemon: FakeProcess) => FakeProcess]>([
    ["command", (daemon) => ({ ...daemon, command: "node unrelated-service" })],
    ["start time", (daemon) => ({ ...daemon, startedAt: "Tue Jan 2 00:00:01 2024" })],
  ])("does not signal a reused daemon PID whose %s changed", async (_identity, change) => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const kill = vi.spyOn(process, "kill").mockImplementation(() => true);
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");
    const opened = (await state
      .tool()
      .execute("open", { action: "open" }, undefined, undefined, state.ctx)) as {
      details: { sessionName: string };
    };
    let daemon: FakeProcess | undefined;
    for (const candidate of runtime.processes.values()) {
      if (candidate.command.includes("cliDaemon.js")) daemon = candidate;
    }
    if (daemon === undefined) throw new Error("fake daemon was not created");
    const replacement = change(daemon);
    runtime.processes.set(daemon.pid, replacement);
    expect(runtime.processes.get(daemon.pid)).toEqual(replacement);
    expect(processOutput(runtime.processes)).toContain(replacement.startedAt);
    const recorded = JSON.parse(
      await readFile(join(leases, `${opened.details.sessionName}.json`), "utf8"),
    ) as { processes: { startedAt: string }[] };
    expect(recorded.processes[0]?.startedAt).toBe(daemon.startedAt);
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps") {
        const table = processOutput(runtime.processes);
        if (!table.includes(replacement.startedAt)) throw new Error("replacement identity missing");
        return result(table);
      }
      if (command === "playwright-cli" && arguments_.includes("close")) {
        return result(JSON.stringify({ status: "not-open" }));
      }
      return result(JSON.stringify({ ok: true }));
    });

    await state.emit("session_shutdown");

    expect(kill.mock.calls.filter(([pid]) => pid === daemon.pid)).toEqual([]);
    expect(
      runtime.exec.mock.calls.some(
        ([command, arguments_]) => command === "playwright-cli" && arguments_.includes("close"),
      ),
    ).toBe(false);
    expect(runtime.processes.has(daemon.pid)).toBe(true);
    kill.mockRestore();
  });

  it("reports startup process-inspection failure without claiming ownership", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const exec = vi.fn(() => result("", 1));
    const state = harness(exec, leases);

    await state.emit("session_start");

    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("could not inspect processes"),
      "warning",
    );
    await expect(
      state.tool().execute("open", { action: "open" }, undefined, undefined, state.ctx),
    ).rejects.toThrow("process identity was not established");
  });

  it("rejects malformed process output and non-JSON open output without losing the lease", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    let processLists = 0;
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps" && processLists++ < 2) return result("not a process table");
      if (command === "ps") return result(processOutput(runtime.processes));
      if (command === "playwright-cli" && arguments_.includes("open")) {
        return result("not-json");
      }
      return result(JSON.stringify({ status: "closed" }));
    });
    const state = harness(runtime.exec, leases);

    await state.emit("session_start");
    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("could not inspect processes"),
      "warning",
    );
    await state.emit("session_start");
    await expect(
      state.tool().execute("open", { action: "open" }, undefined, undefined, state.ctx),
    ).rejects.toThrow("not-json");
    expect(await readdir(leases)).toHaveLength(1);
  });

  it("uses stderr and a bounded fallback when Playwright returns no stdout", async () => {
    expect.hasAssertions();
    const leases = await mkdtemp(join(tmpdir(), "pi-playwright-test-"));
    const runtime = fakeRuntime();
    const state = harness(runtime.exec, leases);
    await state.emit("session_start");
    await state.tool().execute("open", { action: "open" }, undefined, undefined, state.ctx);
    runtime.exec.mockImplementation((command: string, arguments_: readonly string[]) => {
      if (command === "ps") return result(processOutput(runtime.processes));
      if (command === "playwright-cli" && arguments_.includes("empty")) return result();
      return { ...result("", 1), stderr: "provider failed" };
    });

    const empty = (await state
      .tool()
      .execute(
        "empty",
        { action: "run", arguments: [], command: "empty" },
        undefined,
        undefined,
        state.ctx,
      )) as { content: { text: string }[] };
    expect(empty.content[0]?.text).toBe("Playwright CLI completed without output.");
    await expect(
      state
        .tool()
        .execute(
          "failure",
          { action: "run", arguments: [], command: "click" },
          undefined,
          undefined,
          state.ctx,
        ),
    ).rejects.toThrow("provider failed");
  });
});
