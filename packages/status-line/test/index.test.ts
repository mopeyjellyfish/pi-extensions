import { describe, expect, it, vi, type Mock } from "vitest";

import statusLineExtension from "../src/index.ts";

import type {
  ExtensionAPI,
  ExtensionContext,
  ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";

const testTheme = {
  fg: (_color: string, text: string) => text,
};

interface Component {
  dispose?(): void;
  invalidate(): void;
  render(width: number): string[];
}

type FooterFactory = (
  tui: { requestRender(): void },
  theme: unknown,
  footerData: ReadonlyFooterDataProvider,
) => Component;

interface Harness {
  readonly bus: Map<string, Set<(data: unknown) => void>>;
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >;
  readonly exec: ReturnType<typeof vi.fn>;
  footerFactory: FooterFactory | undefined;
  readonly footerValues: unknown[];
  readonly renders: Mock<() => void>;
}

function createHarness(): Harness {
  const bus = new Map<string, Set<(data: unknown) => void>>();
  const events = new Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >();
  const exec = vi.fn(
    (_command: string, _arguments: readonly string[], options: { readonly cwd?: string }) =>
      Promise.resolve({
        code: 0,
        killed: false,
        stderr: "",
        stdout: options.cwd?.endsWith("example-feature")
          ? "## feat/status-line...origin/feat/status-line\n"
          : "## main...origin/main\n",
      }),
  );
  const footerValues: unknown[] = [];
  const renders = vi.fn<() => void>();
  const harness: Harness = {
    bus,
    events,
    exec,
    footerFactory: undefined,
    footerValues,
    renders,
  };
  const pi = {
    events: {
      emit(channel: string, data: unknown) {
        for (const handler of bus.get(channel) ?? []) handler(data);
      },
      on(channel: string, handler: (data: unknown) => void) {
        const handlers = bus.get(channel) ?? new Set<(data: unknown) => void>();
        handlers.add(handler);
        bus.set(channel, handlers);
        return () => handlers.delete(handler);
      },
    },
    exec,
    getThinkingLevel: () => "high",
    on(name: string, handler: (event: Record<string, unknown>, ctx: ExtensionContext) => unknown) {
      events.set(name, [...(events.get(name) ?? []), handler]);
    },
  } as unknown as ExtensionAPI;
  statusLineExtension(pi);
  return harness;
}

function context(harness: Harness, mode: "print" | "tui" = "tui"): ExtensionContext {
  return {
    cwd: "/projects/example",
    getContextUsage: () => ({ contextWindow: 272_000, percent: 18.5, tokens: 50_320 }),
    hasUI: mode === "tui",
    mode,
    model: {
      api: "openai-responses",
      baseUrl: "https://example.invalid",
      contextWindow: 272_000,
      cost: { cacheRead: 0, cacheWrite: 0, input: 0, output: 0 },
      id: "gpt-5.4",
      input: ["text"],
      maxTokens: 32_000,
      name: "GPT-5.4",
      provider: "test",
      reasoning: true,
    },
    modelRegistry: { isUsingOAuth: () => false },
    sessionManager: {
      getEntries: () => [
        {
          message: {
            role: "assistant",
            usage: {
              cacheRead: 0,
              cacheWrite: 0,
              cost: { total: 0.123 },
              input: 12_000,
              output: 3400,
              totalTokens: 15_400,
            },
          },
          type: "message",
        },
      ],
      getSessionName: () => "Status integration",
    },
    ui: {
      setFooter(value: unknown) {
        harness.footerValues.push(value);
        harness.footerFactory = typeof value === "function" ? (value as FooterFactory) : undefined;
      },
    },
  } as unknown as ExtensionContext;
}

async function emitLifecycle(
  harness: Harness,
  name: string,
  ctx: ExtensionContext,
  event: Record<string, unknown> = {},
): Promise<void> {
  await Promise.all((harness.events.get(name) ?? []).map((handler) => handler(event, ctx)));
}

function emitBus(harness: Harness, channel: string, data: unknown): void {
  for (const handler of harness.bus.get(channel) ?? []) handler(data);
}

function footerData(statuses: ReadonlyMap<string, string>): ReadonlyFooterDataProvider {
  return {
    getAvailableProviderCount: () => 1,
    getExtensionStatuses: () => statuses,
    getGitBranch: () => "main",
    onBranchChange: () => vi.fn<() => void>(),
  };
}

describe("pi-status-line extension", () => {
  it("uses routed worktree state and todo summary without duplicate fallback statuses", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", {
      activePath: "/projects/example-feature",
      branch: "feat/status-line",
      version: 1,
    });
    emitBus(harness, "mopeyjellyfish:pi-todo:summary:v1", {
      closed: 2,
      current: { status: "in_progress", text: "Implement integration" },
      total: 5,
      version: 1,
    });

    const ctx = context(harness);
    await emitLifecycle(harness, "session_start", ctx);
    expect(harness.footerFactory).toBeDefined();
    expect(harness.exec).toHaveBeenCalledWith(
      "git",
      ["status", "--porcelain=v1", "--branch", "--untracked-files=no"],
      expect.objectContaining({ cwd: "/projects/example-feature" }),
    );

    const component = harness.footerFactory?.(
      { requestRender: harness.renders },
      testTheme,
      footerData(
        new Map([
          ["mopeyjellyfish-pi-todo", "todo 2/5"],
          ["mopeyjellyfish-pi-worktrunk", "worktree: example-feature"],
          ["review", "review ready"],
        ]),
      ),
    );
    const rendered = component?.render(180).join("\n") ?? "";
    expect(rendered).toContain(" example");
    expect(rendered).not.toContain("example-feature");
    expect(rendered).toContain(" feat/status-line");
    expect(rendered).toContain(" GPT-5.4");
    expect(rendered).toContain("think:high");
    expect(rendered).toContain(" 18.5%/272k 󰁨");
    expect(rendered).toContain("  15k");
    expect(rendered).toContain(" 2/5 · Implement integration");
    expect(rendered).toContain("review ready");
    expect(rendered).not.toContain("worktree: example-feature");

    harness.exec.mockResolvedValueOnce({
      code: 0,
      killed: false,
      stderr: "",
      stdout: "## feat/switched\n",
    });
    await emitLifecycle(harness, "tool_result", ctx, { toolName: "bash" });
    await vi.waitFor(() => {
      expect(component?.render(180).join(" ")).toContain("feat/switched");
    });
    expect(component?.render(180).join(" ")).not.toContain("feat/status-line");
  });

  it("reacts to integration updates, validates payloads, and restores the footer on shutdown", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await emitLifecycle(harness, "session_start", ctx);
    const component = harness.footerFactory?.(
      { requestRender: harness.renders },
      testTheme,
      footerData(new Map()),
    );

    for (const invalidRoute of [
      null,
      { activePath: "/projects/other", version: 2 },
      { activePath: 1, version: 1 },
      { activePath: " ", version: 1 },
      { activePath: "/projects/other", branch: 1, version: 1 },
      { activePath: "/projects/other", head: 1, version: 1 },
    ]) {
      emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", invalidRoute);
    }
    expect(component?.render(120).join(" ")).not.toContain("projects/other");
    emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", {
      activePath: "/projects/other",
      head: "abc123",
      version: 1,
    });
    expect(component?.render(120).join(" ")).toContain(" example");
    expect(component?.render(120).join(" ")).not.toContain("other");
    harness.exec.mockRejectedValueOnce(new Error("route refresh failed"));
    emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", undefined);
    expect(component?.render(120).join(" ")).toContain("main");
    expect(component?.render(120).join(" ")).not.toContain("other");

    for (const invalidTodo of [
      null,
      { closed: 0, total: 1, version: 2 },
      { closed: "0", total: 1, version: 1 },
      { closed: 0, total: "1", version: 1 },
      { closed: -1, total: 1, version: 1 },
      { closed: 0, total: 0, version: 1 },
      { closed: 2, total: 1, version: 1 },
      { closed: 0, current: "bad", total: 1, version: 1 },
      { closed: 0, current: { status: "done", text: "Bad" }, total: 1, version: 1 },
      { closed: 0, current: { status: "pending", text: 1 }, total: 1, version: 1 },
      { closed: 0, current: { status: "pending", text: " " }, total: 1, version: 1 },
    ]) {
      emitBus(harness, "mopeyjellyfish:pi-todo:summary:v1", invalidTodo);
    }
    expect(component?.render(120).join(" ")).not.toContain("todo");
    emitBus(harness, "mopeyjellyfish:pi-todo:summary:v1", {
      closed: 1,
      total: 1,
      version: 1,
    });
    expect(component?.render(120).join(" ")).toContain("all closed");
    emitBus(harness, "mopeyjellyfish:pi-todo:summary:v1", {
      closed: 0,
      current: { status: "pending", text: "Next task" },
      total: 1,
      version: 1,
    });
    expect(component?.render(120).join(" ")).toContain("Next task");
    expect(harness.renders).toHaveBeenCalled();

    await emitLifecycle(harness, "session_shutdown", ctx);
    expect(harness.footerValues.at(-1)).toBeUndefined();
  });

  it("handles optional Git data and footer lifecycle refreshes", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    harness.exec.mockRejectedValueOnce(new Error("git unavailable"));
    const base = context(harness);
    const ctx = {
      ...base,
      getContextUsage: () => ({ contextWindow: 2_000_000, percent: null, tokens: null }),
      model: undefined,
      sessionManager: {
        getEntries: () => [
          {
            message: {
              role: "assistant",
              usage: {
                cacheRead: 0,
                cacheWrite: 0,
                cost: { total: 0 },
                input: 500,
                output: 0,
                totalTokens: 500,
              },
            },
            type: "message",
          },
          { message: { role: "user" }, type: "message" },
        ],
        getSessionName: () => "Lifecycle",
      },
    } as unknown as ExtensionContext;
    await emitLifecycle(harness, "session_start", ctx);

    let branchChanged: (() => void) | undefined;
    const unsubscribe = vi.fn<() => void>();
    const component = harness.footerFactory?.({ requestRender: harness.renders }, testTheme, {
      ...footerData(new Map()),
      onBranchChange(handler) {
        branchChanged = handler;
        return unsubscribe;
      },
    });
    const rendered = component?.render(100).join(" ") ?? "";
    expect(rendered).toContain("main");
    expect(rendered).toContain("  500");
    expect(rendered).toContain(" ?%/2.0M 󰁨");
    expect(rendered).not.toContain("gpt-5.4");

    component?.invalidate();
    branchChanged?.();
    await vi.waitFor(() => {
      expect(harness.exec).toHaveBeenCalledTimes(2);
    });
    const callsAfterBranch = harness.exec.mock.calls.length;
    await emitLifecycle(harness, "tool_result", ctx, { toolName: "read" });
    expect(harness.exec).toHaveBeenCalledTimes(callsAfterBranch);
    await emitLifecycle(harness, "tool_result", ctx, { toolName: "write" });
    await vi.waitFor(() => {
      expect(harness.exec).toHaveBeenCalledTimes(callsAfterBranch + 1);
    });
    await emitLifecycle(harness, "session_tree", ctx);
    component?.dispose?.();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("refreshes after user Bash and clears pending refresh timers on shutdown", async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    try {
      const harness = createHarness();
      const ctx = context(harness);
      await emitLifecycle(harness, "session_start", ctx);
      expect(harness.exec).toHaveBeenCalledOnce();

      await emitLifecycle(harness, "user_bash", ctx, { command: "git switch feat/other" });
      await vi.advanceTimersByTimeAsync(1000);
      expect(harness.exec).toHaveBeenCalledTimes(4);

      await emitLifecycle(harness, "user_bash", ctx, { command: "touch changed" });
      await emitLifecycle(harness, "session_shutdown", ctx);
      await vi.runAllTimersAsync();
      expect(harness.exec).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not install a terminal footer outside TUI mode", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    await emitLifecycle(harness, "session_start", context(harness, "print"));
    expect(harness.footerValues).toEqual([]);
    expect(harness.exec).not.toHaveBeenCalled();
  });
});
