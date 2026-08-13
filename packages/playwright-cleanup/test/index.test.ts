import { tmpdir } from "node:os";

import { describe, expect, it, vi } from "vitest";

import playwrightCleanupExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type Handler = (event: Record<string, unknown>, ctx: ExtensionContext) => unknown;

function harness(exec: ReturnType<typeof vi.fn>) {
  const handlers = new Map<string, Handler[]>();
  const notify = vi.fn();
  const pi = {
    exec,
    on(name: string, handler: Handler) {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    },
  } as unknown as ExtensionAPI;
  const ctx = {
    cwd: "/repo/main",
    hasUI: true,
    ui: { notify },
  } as unknown as ExtensionContext;
  playwrightCleanupExtension(pi);
  return {
    ctx,
    notify,
    async emit(name: string, event: Record<string, unknown>) {
      for (const handler of handlers.get(name) ?? []) await handler(event, ctx);
    },
  };
}

function result(stdout = "", code = 0) {
  return { code, killed: false, stderr: "", stdout };
}

describe("playwright cleanup", () => {
  it("owns the default session and closes it in every original workspace", async () => {
    expect.hasAssertions();
    const open = new Set(["/repo/worktree", "workspace-hash"]);
    let session = "";
    const exec = vi.fn(
      (_command: string, arguments_: readonly string[], options: { readonly cwd?: string }) => {
        if (arguments_.includes("list")) {
          return result(
            JSON.stringify({
              browsers: [...open].map((workspace) => ({
                name: session,
                status: "open",
                workspace,
              })),
            }),
          );
        }
        if (arguments_.includes("close")) {
          open.delete(options.cwd === tmpdir() ? "workspace-hash" : (options.cwd ?? ""));
        }
        return result();
      },
    );
    const state = harness(exec);
    const event = {
      input: { command: "playwright-cli open https://example.com" },
      toolCallId: "browser-open",
      toolName: "bash",
    };

    await state.emit("tool_call", event);
    const command = event.input.command;
    session = /PLAYWRIGHT_CLI_SESSION=([^;]+)/u.exec(command)?.[1] ?? "";
    expect(session).toMatch(/^pi-\d+-[0-9a-f]{8}$/u);
    expect(command).toContain("; playwright-cli open https://example.com");

    await state.emit("agent_settled", {});

    expect(open).toEqual(new Set());
    expect(exec).toHaveBeenCalledWith(
      "playwright-cli",
      [`-s=${session}`, "close"],
      expect.objectContaining({ cwd: "/repo/worktree" }),
    );
    expect(exec).toHaveBeenCalledWith(
      "playwright-cli",
      [`-s=${session}`, "close"],
      expect.objectContaining({ cwd: tmpdir() }),
    );
    expect(state.notify).not.toHaveBeenCalled();
    const callCount = exec.mock.calls.length;
    await state.emit("agent_settled", {});
    await state.emit("session_shutdown", {});
    expect(exec).toHaveBeenCalledTimes(callCount);
  });

  it("uses the local npx launcher for its generated session", async () => {
    expect.hasAssertions();
    let listed = 0;
    let session = "";
    const exec = vi.fn((_command: string, arguments_: readonly string[]) => {
      if (arguments_.includes("list")) {
        listed += 1;
        return result(
          JSON.stringify({
            browsers:
              listed === 1 ? [{ name: session, status: "open", workspace: "/repo/worktree" }] : [],
          }),
        );
      }
      return result();
    });
    const state = harness(exec);
    const event = {
      input: { command: "npx --no-install playwright-cli open /cart" },
      toolCallId: "browser-open",
      toolName: "bash",
    };

    await state.emit("tool_call", event);
    session = /PLAYWRIGHT_CLI_SESSION=([^;]+)/u.exec(event.input.command)?.[1] ?? "";
    await state.emit("session_shutdown", {});

    expect(exec).toHaveBeenCalledWith(
      "npx",
      ["--no-install", "playwright-cli", `-s=${session}`, "close"],
      expect.objectContaining({ cwd: "/repo/worktree" }),
    );
    expect(state.notify).not.toHaveBeenCalled();
  });

  it("leaves explicit sessions caller-owned", async () => {
    expect.hasAssertions();
    const exec = vi.fn((_command: string, arguments_: readonly string[]) =>
      result(
        JSON.stringify({
          browsers: arguments_.includes("list")
            ? [{ name: "checkout", status: "open", workspace: "/repo/worktree" }]
            : [],
        }),
      ),
    );
    const state = harness(exec);

    await state.emit("tool_call", {
      input: { command: "playwright-cli -s=checkout open /cart" },
      toolCallId: "browser-open",
      toolName: "bash",
    });
    await state.emit("session_shutdown", {});

    expect(exec.mock.calls.some(([, arguments_]) => arguments_.includes("close"))).toBe(false);
    expect(state.notify).not.toHaveBeenCalled();
  });

  it("tracks every supported launcher in a compound command", async () => {
    expect.hasAssertions();
    const exec = vi.fn((command: string) => {
      void command;
      return result(JSON.stringify({ browsers: [] }));
    });
    const state = harness(exec);
    const event = {
      input: {
        command: "playwright-cli open || npx --no-install playwright-cli open",
      },
      toolCallId: "browser-open",
      toolName: "bash",
    };

    await state.emit("tool_call", event);
    await state.emit("session_shutdown", {});

    expect(new Set(exec.mock.calls.map(([command]) => command))).toEqual(
      new Set(["npx", "playwright-cli"]),
    );
  });

  it("does nothing when the session did not use playwright-cli", async () => {
    expect.hasAssertions();
    const exec = vi.fn();
    const state = harness(exec);

    await state.emit("tool_call", {
      input: { path: "playwright-cli" },
      toolCallId: "read",
      toolName: "read",
    });
    await state.emit("tool_call", {
      input: { command: "npm test" },
      toolCallId: "test",
      toolName: "bash",
    });
    await state.emit("session_shutdown", {});

    expect(exec).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
  });

  it("ignores unsupported launchers", async () => {
    expect.hasAssertions();
    const exec = vi.fn();
    const state = harness(exec);

    for (const command of ["npx playwright-cli open", "npm exec -- playwright-cli open"]) {
      const event = {
        input: { command },
        toolCallId: command,
        toolName: "bash",
      };
      await state.emit("tool_call", event);
      expect(event.input.command).toBe(command);
    }
    await state.emit("session_shutdown", {});

    expect(exec).not.toHaveBeenCalled();
  });

  it("rejects malformed registry entries instead of claiming verified cleanup", async () => {
    expect.hasAssertions();
    const exec = vi.fn(() => result(JSON.stringify({ browsers: [null, {}] })));
    const state = harness(exec);

    await state.emit("tool_call", {
      input: { command: "playwright-cli open" },
      toolCallId: "browser-open",
      toolName: "bash",
    });
    await state.emit("session_shutdown", {});

    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("could not close or verify 1 Pi-owned browser session"),
      "warning",
    );
    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("No global cleanup was attempted"),
      "warning",
    );
  });

  it("retries failed settled cleanup during shutdown", async () => {
    expect.hasAssertions();
    let session = "";
    const exec = vi.fn((_command: string, arguments_: readonly string[]) =>
      result(
        JSON.stringify({
          browsers: arguments_.includes("list")
            ? [{ name: session, status: "open", workspace: "/repo/worktree" }]
            : [],
        }),
      ),
    );
    const state = harness(exec);
    const event = {
      input: { command: "playwright-cli open" },
      toolCallId: "browser-open",
      toolName: "bash",
    };

    await state.emit("tool_call", event);
    session = /PLAYWRIGHT_CLI_SESSION=([^;]+)/u.exec(event.input.command)?.[1] ?? "";
    await state.emit("agent_settled", {});
    await state.emit("session_shutdown", {});

    expect(exec.mock.calls.filter(([, arguments_]) => arguments_.includes("close"))).toHaveLength(
      2,
    );
    expect(state.notify).toHaveBeenCalledTimes(2);
  });

  it("warns when cleanup cannot verify that an owned session closed", async () => {
    expect.hasAssertions();
    let session = "";
    const exec = vi.fn((_command: string, arguments_: readonly string[]) => {
      if (!arguments_.includes("list")) return result("", 1);
      return result(
        JSON.stringify({
          browsers: [{ name: session, status: "open", workspace: "/repo/worktree" }],
        }),
      );
    });
    const state = harness(exec);
    const event = {
      input: { command: "playwright-cli open" },
      toolCallId: "browser-open",
      toolName: "bash",
    };

    await state.emit("tool_call", event);
    session = /PLAYWRIGHT_CLI_SESSION=([^;]+)/u.exec(event.input.command)?.[1] ?? "";
    await state.emit("session_shutdown", {});

    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("could not close or verify 1 Pi-owned browser session"),
      "warning",
    );
    expect(state.notify).toHaveBeenCalledWith(
      expect.stringContaining("No global cleanup was attempted"),
      "warning",
    );
  });
});
