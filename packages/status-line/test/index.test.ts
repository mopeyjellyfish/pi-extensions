import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it, vi, type Mock } from "vitest";

import statusLineExtension from "../src/index.ts";

import type {
  ExtensionAPI,
  ExtensionContext,
  ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";
import type { EditorComponent, EditorTheme, TUI } from "@earendil-works/pi-tui";

type EditorFactory = NonNullable<ReturnType<ExtensionContext["ui"]["getEditorComponent"]>>;

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
  readonly commands: Map<string, (args: string, context: ExtensionContext) => Promise<void>>;
  readonly entries: { customType: string; data: unknown }[];
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >;
  editorFactory: EditorFactory | undefined;
  readonly editorValues: unknown[];
  entryRenderer:
    | ((entry: { data: unknown }, options: unknown, theme: typeof testTheme) => Component)
    | undefined;
  readonly exec: ReturnType<typeof vi.fn>;
  footerFactory: FooterFactory | undefined;
  readonly footerValues: unknown[];
  previousEditorFactory: EditorFactory | undefined;
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
          ? "# branch.oid abcdef0123456789\n# branch.head feat/status-line\n# branch.upstream origin/feat/status-line\n# branch.ab +2 -1\n1 .M N... 100644 100644 100644 a a changed.ts\n"
          : "# branch.oid 0123456789abcdef\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +0 -0\n",
      }),
  );
  const commands = new Map<string, (args: string, context: ExtensionContext) => Promise<void>>();
  const editorValues: unknown[] = [];
  const entries: { customType: string; data: unknown }[] = [];
  const footerValues: unknown[] = [];
  const renders = vi.fn<() => void>();
  const harness: Harness = {
    bus,
    commands,
    editorFactory: undefined,
    editorValues,
    entries,
    entryRenderer: undefined,
    events,
    exec,
    footerFactory: undefined,
    footerValues,
    previousEditorFactory: undefined,
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
    appendEntry(customType: string, data: unknown) {
      entries.push({ customType, data });
    },
    registerCommand(
      name: string,
      options: { handler(args: string, context: ExtensionContext): Promise<void> },
    ) {
      commands.set(name, (args, context) => options.handler(args, context));
    },
    registerEntryRenderer(
      _customType: string,
      renderer: (entry: { data: unknown }, options: unknown, theme: typeof testTheme) => Component,
    ) {
      harness.entryRenderer = renderer;
    },
  } as unknown as ExtensionAPI;
  statusLineExtension(pi);
  return harness;
}

function codexToken(accountId: string): string {
  return `x.${Buffer.from(
    JSON.stringify({ "https://api.openai.com/auth": { chatgpt_account_id: accountId } }),
  ).toString("base64url")}.x`;
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
    modelRegistry: {
      getApiKeyAndHeaders: vi.fn().mockResolvedValue({ error: "not configured", ok: false }),
      isUsingOAuth: () => false,
    },
    sessionManager: {
      getBranch: () => [
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
      getEntries: () => [
        {
          message: {
            role: "assistant",
            usage: {
              cacheRead: 0,
              cacheWrite: 0,
              cost: { total: 99 },
              input: 1_000_000,
              output: 1_000_000,
              totalTokens: 2_000_000,
            },
          },
          type: "message",
        },
      ],
      getSessionId: () => "session-1",
      getSessionName: () => "Status integration",
    },
    ui: {
      getEditorComponent() {
        return harness.previousEditorFactory;
      },
      setEditorComponent(value: EditorFactory | undefined) {
        harness.editorValues.push(value);
        harness.editorFactory = value;
      },
      setFooter(value: unknown) {
        harness.footerValues.push(value);
        harness.footerFactory = typeof value === "function" ? (value as FooterFactory) : undefined;
      },
      theme: testTheme,
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

function onBus(harness: Harness, channel: string, handler: (data: unknown) => void): void {
  const handlers = harness.bus.get(channel) ?? new Set<(data: unknown) => void>();
  handlers.add(handler);
  harness.bus.set(channel, handlers);
}

function footerData(statuses: ReadonlyMap<string, string>): ReadonlyFooterDataProvider {
  return {
    getAvailableProviderCount: () => 1,
    getExtensionStatuses: () => statuses,
    getGitBranch: () => "main",
    onBranchChange: () => vi.fn<() => void>(),
  };
}

function editor(harness: Harness): EditorComponent | undefined {
  return harness.editorFactory?.(
    {
      requestRender: harness.renders,
      terminal: { rows: 24 },
    } as unknown as TUI,
    {
      borderColor: (text: string) => text,
      selectList: {},
    } as EditorTheme,
    { matches: () => false } as never,
  );
}

function moveCursorUp(component: EditorComponent | undefined, count: number): void {
  for (let index = 0; index < count; index += 1) component?.handleInput("\u{1B}[A");
}

function expectNoTruncatedScrollBorders(component: EditorComponent | undefined): void {
  expect(component?.render(8)).not.toContain("  ───...");
  expect(component?.render(10)).not.toContain("  ─── ↓...");
  expect(component?.render(12)).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/^ {2}─── ↓ \d\.\.\.$/u)]),
  );
  expect(component?.render(14)).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/^ {2}─── ↓ \d m\.\.\.$/u)]),
  );
}

describe("pi-status-line extension", () => {
  it("renders one integrated prompt and restores the previous editor", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const previousComponent: EditorComponent = {
      getText: () => "",
      handleInput: vi.fn(),
      invalidate: vi.fn(),
      render: (width) => ["─".repeat(width), "  ".padEnd(width), "─".repeat(width)],
      setText: vi.fn(),
    };
    const previous = vi.fn<EditorFactory>(() => previousComponent);
    harness.previousEditorFactory = previous;
    const ctx = context(harness);

    await emitLifecycle(harness, "session_start", ctx);
    expect(harness.editorFactory).toBeDefined();
    const footer = harness.footerFactory?.(
      { requestRender: harness.renders },
      testTheme,
      footerData(new Map([["review", "review ready"]])),
    );
    const prompt = editor(harness);
    expect(prompt).toBeDefined();
    expect(prompt).toBe(previousComponent);
    expect(prompt?.render(120)[0]).toContain(" GPT-5.4");
    expect(prompt?.render(120)[0]).toContain("review ready");
    expect(prompt?.render(120)[0]?.startsWith("╭─ ")).toBe(true);
    expect(prompt?.render(120)[0]?.endsWith("─")).toBe(true);
    expect(prompt?.render(120)[1]?.startsWith("╰─❯ ")).toBe(true);
    expect(footer?.render(120)).toEqual([]);

    previousComponent.borderColor = (text) => `\u{1B}[32m${text}\u{1B}[39m`;
    expect(prompt?.render(120)[0]).toContain("\u{1B}[32m");
    expect(prompt?.render(120)[1]).toContain("\u{1B}[32m╰─\u{1B}[39m");

    await emitLifecycle(harness, "session_shutdown", ctx);
    expect(harness.editorValues.at(-1)).toBe(previous);
    expect(harness.footerValues.at(-1)).toBeUndefined();
    expect(previousComponent.render(8)).toEqual(["────────", " ".repeat(8), "────────"]);
  });

  it("preserves the default editor and bounds prompt chrome at narrow widths", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await emitLifecycle(harness, "session_start", ctx);
    const footer = harness.footerFactory?.(
      { requestRender: harness.renders },
      testTheme,
      footerData(new Map()),
    );
    const prompt = editor(harness);
    if (prompt === undefined || footer === undefined)
      throw new Error("Prompt chrome not installed");
    prompt.setText(Array.from({ length: 8 }, (_, index) => `line ${String(index)}`).join("\n"));
    expect(prompt.getText()).toContain("line 7");
    expect(prompt.render(120)[1]?.startsWith("╰─❯ ")).toBe(true);
    expect(prompt.render(40)[0]).toContain("↑");
    expect(prompt.render(12)[0]).toMatch(/ ↑\d* $/u);

    prompt.setText(Array.from({ length: 20 }, (_, index) => `line ${String(index)}`).join("\n"));
    moveCursorUp(prompt, 10);
    expectNoTruncatedScrollBorders(prompt);
    expect(prompt.render(40)[0]).toMatch(/[↑↓]/u);
    expect(prompt.render(20)[0]).toMatch(/ ↑\d+ ↓\d+ $/u);
    expect(prompt.render(17)[0]).toMatch(/ ↑\d* ↓\d* $/u);
    expect(footer.render(8)).toEqual([]);

    for (const width of [0, 1, 20, 120]) {
      expect(
        [...prompt.render(width), ...footer.render(width)].every(
          (line) => visibleWidth(line) <= width,
        ),
      ).toBe(true);
    }
  });

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
      ["status", "--porcelain=v2", "--branch", "--untracked-files=no"],
      expect.objectContaining({ cwd: "/projects/example-feature" }),
    );

    harness.footerFactory?.(
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
    const component = editor(harness);
    const rendered = component?.render(240).join("\n") ?? "";
    expect(rendered).toContain(" example");
    expect(rendered).not.toContain("example-feature");
    expect(rendered).toContain(" feat/status-line ↑2 ↓1 ~1");
    expect(rendered).toContain(" GPT-5.4");
    expect(rendered).toContain("think:high");
    expect(rendered).toContain(" 18.5%/272k 󰁨");
    expect(rendered).not.toContain(" ");
    expect(rendered).not.toContain("$0.12");
    expect(rendered).toContain(" 2/5 · Implement integration");
    expect(rendered).toContain("review ready");
    expect(rendered).not.toContain("worktree: example-feature");

    harness.exec.mockResolvedValueOnce({
      code: 0,
      killed: false,
      stderr: "",
      stdout: "# branch.oid fedcba9876543210\n# branch.head feat/switched\n",
    });
    await emitLifecycle(harness, "tool_result", ctx, { toolName: "bash" });
    await vi.waitFor(() => {
      expect(component?.render(180).join(" ")).toContain("feat/switched");
    });
    expect(component?.render(240).join(" ")).not.toContain("feat/status-line");
  });

  it("restores and refreshes a compact subagent fleet through the v1 RPC", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    let statusText =
      "Active async runs: 2\n\n- first | running | single | steps 1 | /tmp\n  1. worker | running | needs attention\n- second | queued | single | steps 1 | /tmp";
    const requests: unknown[] = [];
    onBus(harness, "subagents:rpc:v1:request", (data) => {
      requests.push(data);
      const request = data as { requestId?: unknown };
      if (typeof request.requestId !== "string") return;
      emitBus(harness, `subagents:rpc:v1:reply:${request.requestId}`, {
        data: { text: statusText },
        method: "status",
        requestId: request.requestId,
        success: true,
        version: 2,
      });
      emitBus(harness, `subagents:rpc:v1:reply:${request.requestId}`, {
        data: { text: statusText },
        method: "status",
        requestId: request.requestId,
        success: true,
        version: 1,
      });
    });

    const ctx = context(harness);
    await emitLifecycle(harness, "session_start", ctx);
    harness.footerFactory?.(
      { requestRender: harness.renders },
      testTheme,
      footerData(new Map([["subagent-slash", "running..."]])),
    );
    const component = editor(harness);
    expect(requests.at(-1)).toMatchObject({
      method: "status",
      params: {},
      source: { extension: "@mopeyjellyfish/pi-status-line" },
      version: 1,
    });
    expect(component?.render(180).join(" ")).toContain(" 2 !1");
    expect(component?.render(180).join(" ")).not.toContain("running...");

    statusText = "Active async runs: 0";
    emitBus(harness, "subagent:control-event", { type: "needs_attention" });
    expect(component?.render(180).join(" ")).toContain(" 2 !1");

    statusText = "No active async runs.";
    emitBus(harness, "subagent:async-complete", { id: "first", success: true });
    expect(component?.render(180).join(" ")).not.toContain("");

    emitBus(harness, "subagents:rpc:v1:ready", { version: 1 });
    expect(requests).toHaveLength(4);
    await emitLifecycle(harness, "session_shutdown", ctx);
  });

  it("reacts to integration updates, validates payloads, and restores the footer on shutdown", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await emitLifecycle(harness, "session_start", ctx);
    harness.footerFactory?.({ requestRender: harness.renders }, testTheme, footerData(new Map()));
    const component = editor(harness);

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
    expect(component?.render(120).join(" ")).toContain("detached@abc123");
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
        getBranch: () => [
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
        getSessionId: () => "session-1",
        getSessionName: () => "Lifecycle",
      },
    } as unknown as ExtensionContext;
    await emitLifecycle(harness, "session_start", ctx);

    let branchChanged: (() => void) | undefined;
    const unsubscribe = vi.fn<() => void>();
    const footer = harness.footerFactory?.({ requestRender: harness.renders }, testTheme, {
      ...footerData(new Map()),
      onBranchChange(handler) {
        branchChanged = handler;
        return unsubscribe;
      },
    });
    const component = editor(harness);
    const rendered = component?.render(100).join(" ") ?? "";
    expect(rendered).toContain("main");
    expect(rendered).not.toContain("  500");
    expect(rendered).toContain(" ?%/2.0M 󰁨");
    expect(rendered).not.toContain("gpt-5.4");

    footer?.invalidate();
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
    footer?.dispose?.();
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

  it("refreshes Codex usage across lifecycle events and renders full /status details", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          additional_rate_limits: [
            {
              limit_name: "GPT-5.3-Codex-Spark",
              rate_limit: {
                primary_window: {
                  limit_window_seconds: 604_800,
                  reset_at: 1_800_600_000,
                  used_percent: 10,
                },
              },
            },
          ],
          plan_type: "pro",
          rate_limit: {
            primary_window: {
              limit_window_seconds: 18_000,
              reset_at: 1_800_000_000,
              used_percent: 75,
            },
            secondary_window: {
              limit_window_seconds: 604_800,
              reset_at: 1_800_600_000,
              used_percent: 40,
            },
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    try {
      const base = context(harness);
      const ctx = {
        ...base,
        model: {
          ...base.model,
          api: "openai-codex-responses",
          provider: "openai-codex",
        },
        modelRegistry: {
          getApiKeyAndHeaders: vi.fn().mockResolvedValue({
            apiKey: codexToken("account-1"),
            ok: true,
          }),
          isUsingOAuth: () => true,
        },
      } as unknown as ExtensionContext;
      await emitLifecycle(harness, "session_start", ctx);
      harness.footerFactory?.({ requestRender: harness.renders }, testTheme, footerData(new Map()));
      const component = editor(harness);
      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledOnce();
        const rendered = component?.render(180).join(" ") ?? "";
        expect(rendered).toContain("limits 5 hour 25% · Weekly 60%");
        expect(rendered).not.toContain("Spark");
      });

      await harness.commands.get("status")?.("", ctx);
      const text = (harness.entries.at(-1)?.data as { text?: string }).text ?? "";
      expect(text).toContain("Account: openai-codex (pro)");
      expect(text).toContain("5 hour limit: [█████░░░░░░░░░░░░░░░] 25% left");
      expect(text).toContain("resets 2027-01-15T08:00:00.000Z");
      expect(text).toContain("Source: OpenAI Codex internal usage endpoint");

      await emitLifecycle(harness, "model_select", ctx);
      await emitLifecycle(harness, "agent_settled", ctx);
      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(4);
      });
      await emitLifecycle(harness, "session_shutdown", ctx);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses observed provider headers in the status line and /status", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const base = context(harness);
    const ctx = {
      ...base,
      model: { ...base.model, provider: "openai" },
    } as ExtensionContext;
    await emitLifecycle(harness, "session_start", ctx);
    harness.footerFactory?.({ requestRender: harness.renders }, testTheme, footerData(new Map()));
    const component = editor(harness);

    await emitLifecycle(harness, "after_provider_response", ctx, {
      headers: {
        "x-ratelimit-limit-requests": "100",
        "x-ratelimit-limit-tokens": "200",
        "x-ratelimit-remaining-requests": "25",
        "x-ratelimit-remaining-tokens": "50",
        "x-ratelimit-reset-requests": "20s",
        "x-ratelimit-reset-tokens": "30s",
      },
      status: 200,
    });

    expect(component?.render(180).join(" ")).toContain("limits Requests 25% · Tokens 25%");
    await harness.commands.get("status")?.("", ctx);
    const text = (harness.entries.at(-1)?.data as { text?: string }).text ?? "";
    expect(text).toContain("Account: openai");
    expect(text).toContain("Requests: [█████░░░░░░░░░░░░░░░] 25% left");
  });

  it("registers /status and reports Pi and unavailable provider details", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await emitLifecycle(harness, "session_start", ctx);

    await harness.commands.get("status")?.("", ctx);

    expect(harness.entries).toHaveLength(1);
    expect(harness.entries[0]).toMatchObject({ customType: "mopeyjellyfish-pi-status" });
    const text = (harness.entries[0]?.data as { text?: string }).text ?? "";
    expect(text).toContain("Model: GPT-5.4 (test/gpt-5.4)");
    expect(text).toContain("Thinking: high");
    expect(text).toContain("Directory: /projects/example");
    expect(text).toContain("Session: session-1");
    expect(text).toContain("Context: 81.5% left (50,320 used / 272,000)");
    expect(text).toContain(
      "Account usage: unavailable — This provider does not expose reliable account usage",
    );
    expect(harness.entryRenderer?.({ data: null }, {}, testTheme).render(80)[0]?.trim()).toBe(
      "Status unavailable",
    );
    expect(
      harness
        .entryRenderer?.({ data: { text: "Current status" } }, {}, testTheme)
        .render(80)[0]
        ?.trim(),
    ).toBe("Current status");

    await harness.commands.get("status")?.("", {
      ...ctx,
      getContextUsage: () => ({ contextWindow: 272_000, percent: null, tokens: null }),
    });
    expect((harness.entries.at(-1)?.data as { text?: string }).text).toContain(
      "Context: ?% left (? used / 272,000)",
    );
  });

  it("keeps /status useful without a model or context outside TUI mode", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const base = context(harness, "print");
    const notify = vi.fn();
    const ctx = {
      ...base,
      getContextUsage() {
        return;
      },
      model: undefined,
      sessionManager: {
        ...base.sessionManager,
        getSessionName() {
          return;
        },
      },
      hasUI: true,
      ui: { ...base.ui, notify },
    } as unknown as ExtensionContext;
    await emitLifecycle(harness, "session_start", ctx);
    await emitLifecycle(harness, "model_select", ctx);
    await emitLifecycle(harness, "agent_settled", ctx);
    await emitLifecycle(harness, "after_provider_response", ctx, { headers: {}, status: 200 });
    await harness.commands.get("status")?.("", ctx);

    expect(harness.editorValues).toEqual([]);
    expect(harness.footerValues).toEqual([]);
    expect(harness.exec).not.toHaveBeenCalled();
    expect(harness.entries).toEqual([]);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("Model: unavailable"), "info");
  });
});
