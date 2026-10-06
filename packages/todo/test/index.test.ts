import { convertToLlm } from "@earendil-works/pi-coding-agent";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import { Compile } from "typebox/compile";
import { describe, expect, it } from "vitest";

import todoExtension, {
  TodoParameters,
  applyTodoAction,
  isTodoSnapshot,
  snapshotFromBranch,
} from "../src/index.ts";

import type {
  ContextEvent,
  ContextEventResult,
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { TSchema } from "typebox";

interface ToolResult {
  readonly structuredContent?: unknown;
  readonly content: readonly { readonly text: string; readonly type: "text" }[];
  readonly details: {
    readonly action: string;
    readonly changedIds: readonly number[];
    readonly snapshot: unknown;
  };
}

interface TestComponent {
  invalidate(): void;
  render(width: number): string[];
}

interface TestTheme {
  bold(text: string): string;
  fg(color: string, text: string): string;
}

interface RegisteredTool {
  readonly outputSchema: TSchema;
  readonly annotations: Record<string, boolean>;
  readonly description: string;
  readonly executionMode?: string;
  readonly name: string;
  readonly parameters: { readonly additionalProperties?: boolean };
  readonly promptGuidelines?: readonly string[];
  readonly promptSnippet?: string;
  renderCall?(
    input: Record<string, unknown>,
    theme: TestTheme,
    context: Record<string, unknown>,
  ): TestComponent;
  renderResult?(
    result: ToolResult,
    options: { readonly expanded: boolean; readonly isPartial: boolean },
    theme: TestTheme,
    context: Record<string, unknown>,
  ): TestComponent;
  execute(
    id: string,
    input: Record<string, unknown>,
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<ToolResult>;
}

interface RegisteredCommand {
  handler(arguments_: string, context: ExtensionContext): Promise<void>;
}

interface Entry {
  readonly customType?: string;
  readonly data?: unknown;
  readonly message?: {
    readonly details?: unknown;
    readonly role: string;
    readonly toolName?: string;
  };
  readonly type: string;
}

interface Harness {
  readonly activeTools: string[];
  readonly commands: Map<string, RegisteredCommand>;
  readonly entries: Entry[];
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >;
  readonly notifications: string[];
  readonly publishedSummaries: unknown[];
  readonly hierarchicalSummaries: unknown[];
  readonly queuedMessages: unknown[];
  readonly statuses: (string | undefined)[];
  readonly tool: RegisteredTool;
  readonly widgets: unknown[];
}

const testTheme: TestTheme = {
  bold: (text) => `<bold>${text}</bold>`,
  fg: (color, text) => `<${color}>${text}</${color}>`,
};

function createHarness(): Harness {
  const commands = new Map<string, RegisteredCommand>();
  const entries: Entry[] = [];
  const events = new Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >();
  const notifications: string[] = [];
  const publishedSummaries: unknown[] = [];
  const hierarchicalSummaries: unknown[] = [];
  const statuses: (string | undefined)[] = [];
  const widgets: unknown[] = [];
  const activeTools = ["todo", "bash", "read", "edit"];
  const queuedMessages: unknown[] = [];
  let tool: RegisteredTool | undefined;
  const pi = {
    getActiveTools: () => activeTools,
    appendEntry(customType: string, data: unknown) {
      entries.push({ type: "custom", customType, data });
    },
    sendMessage: (message: unknown) => queuedMessages.push(message),
    sendUserMessage: (message: unknown) => queuedMessages.push(message),
    events: {
      emit(channel: string, data: unknown) {
        if (channel === "mopeyjellyfish:pi-todo:summary:v1") publishedSummaries.push(data);
        if (channel === "mopeyjellyfish:pi-todo:summary:v2") hierarchicalSummaries.push(data);
      },
      on: () => {
        throw new Error("Unexpected event-bus subscription.");
      },
    },
    on(name: string, handler: (event: Record<string, unknown>, ctx: ExtensionContext) => unknown) {
      events.set(name, [...(events.get(name) ?? []), handler]);
    },
    registerCommand(name: string, definition: RegisteredCommand) {
      commands.set(name, definition);
    },
    registerTool(definition: RegisteredTool) {
      tool = {
        ...definition,
        async execute(...args) {
          const result = await definition.execute(...args);
          expect(Compile(definition.outputSchema).Check(result.structuredContent)).toBe(true);
          return result;
        },
      };
    },
  } as unknown as ExtensionAPI;
  todoExtension(pi);
  if (tool === undefined) throw new Error("todo tool was not registered");
  return {
    activeTools,
    commands,
    entries,
    events,
    notifications,
    publishedSummaries,
    hierarchicalSummaries,
    queuedMessages,
    statuses,
    tool,
    widgets,
  };
}

function context(harness: Harness, mode: "print" | "rpc" | "tui" = "tui"): ExtensionContext {
  return {
    cwd: "/projects/example",
    hasUI: mode === "rpc" || mode === "tui",
    mode,
    sessionManager: { getBranch: () => harness.entries },
    ui: {
      notify: (message: string) => harness.notifications.push(message),
      theme: testTheme,
      setStatus: (_key: string, value: string | undefined) => harness.statuses.push(value),
      setWidget: (_key: string, value: unknown) => harness.widgets.push(value),
    },
  } as unknown as ExtensionContext;
}

async function emit(harness: Harness, name: string, ctx: ExtensionContext): Promise<void> {
  await Promise.all((harness.events.get(name) ?? []).map((handler) => handler({}, ctx)));
}

async function modelContext(
  harness: Harness,
  ctx: ExtensionContext,
  messages: ContextEvent["messages"] = [],
): Promise<ContextEvent["messages"]> {
  const handler = harness.events.get("context")?.[0];
  if (handler === undefined) throw new Error("Missing context hook.");
  const result = (await handler({ type: "context", messages }, ctx)) as
    ContextEventResult | undefined;
  return result?.messages ?? messages;
}

function reminderText(messages: ContextEvent["messages"]): string {
  const message = messages.at(-1);
  if (message?.role !== "custom" || typeof message.content !== "string") {
    throw new Error("Expected a text reminder.");
  }
  return message.content;
}

function widgetComponent(value: unknown, theme: TestTheme = testTheme): TestComponent {
  if (typeof value !== "function") throw new TypeError("Expected a widget factory.");
  return (value as (tui: unknown, theme: TestTheme) => TestComponent)({}, theme);
}

function renderWidget(value: unknown): string[] {
  return widgetComponent(value)
    .render(500)
    .map((line) => line.trimEnd());
}

function renderToolResult(
  harness: Harness,
  result: ToolResult,
  options: { readonly expanded?: boolean; readonly isError?: boolean } = {},
): string {
  if (harness.tool.renderResult === undefined) throw new Error("Missing tool result renderer.");
  return harness.tool
    .renderResult(result, { expanded: options.expanded ?? false, isPartial: false }, testTheme, {
      isError: options.isError ?? false,
    })
    .render(500)
    .map((line) => line.trimEnd())
    .join("\n");
}

function record(harness: Harness, result: ToolResult): void {
  harness.entries.push({
    message: {
      details: result.details,
      role: "toolResult",
      toolName: "todo",
    },
    type: "message",
  });
}

describe("pi-todo extension", () => {
  it("reminds the model of the current path and immediate-child progress without UI", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness, "print");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("reminder", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery"] });
    await run({ action: "add", parentId: 1, items: ["Slice", "Future slice"] });
    await run({ action: "add", parentId: 2, items: ["Implement", "Verified", "Unused"] });
    await run({
      action: "update",
      updates: [
        { id: 4, status: "in_progress" },
        { id: 5, status: "completed" },
        { id: 6, status: "cancelled" },
      ],
    });
    const entries = [...harness.entries];
    const messages = await modelContext(harness, ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "custom", display: false });
    const converted = convertToLlm(messages).at(-1);
    expect(converted?.role).toBe("user");
    expect(converted).toHaveProperty("content.0.type", "text");
    expect(converted).toHaveProperty("content.0.text", reminderText(messages));
    const text = reminderText(messages);
    expect(text).toContain(
      "Active path:\n#1 Delivery — 0/2 closed → #2 Slice — 2/3 closed (1 cancelled) → #4 Implement",
    );
    expect(text).toMatch(/before.*step/u);
    expect(text).toContain("verified evidence");
    expect(text).not.toContain("no explicitly active");
    expect(harness.entries).toEqual(entries);
    expect(harness.queuedMessages).toEqual([]);
    expect(harness.widgets).toEqual([]);
  });

  it("replaces only its reminder while preserving tool exchanges and current mutations", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("refresh", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["First step", "Next step"] });
    await run({ action: "update", updates: [{ id: 1, status: "in_progress" }] });
    const transcript: ContextEvent["messages"] = [
      { role: "user", content: "Pause if necessary", timestamp: 1 },
      {
        role: "custom",
        customType: "other-extension:reminder",
        display: false,
        content: "Keep this reminder",
        timestamp: 2,
      },
      {
        role: "assistant",
        content: [{ type: "toolCall", id: "read-1", name: "read", arguments: { path: "file.ts" } }],
        api: "openai-responses",
        provider: "openai",
        model: "test",
        stopReason: "toolUse",
        usage: {
          input: 1,
          output: 1,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 2,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        timestamp: 3,
      },
      {
        role: "toolResult",
        toolCallId: "read-1",
        toolName: "read",
        content: [{ type: "text", text: "File contents" }],
        details: { path: "file.ts" },
        isError: false,
        timestamp: 4,
      },
    ];
    const first = await modelContext(harness, ctx, transcript);
    expect(first).toHaveLength(5);
    expect(transcript).toHaveLength(4);
    expect(reminderText(first)).toContain("Active path:\n#1 First step");
    await run({
      action: "update",
      updates: [{ id: 2, status: "in_progress", text: "Verify result" }],
    });
    const entries = [...harness.entries];
    const second = await modelContext(harness, ctx, first);
    const third = await modelContext(harness, ctx, second);
    expect(second).toHaveLength(5);
    expect(third).toHaveLength(5);
    expect(first).toHaveLength(5);
    expect(reminderText(third)).toContain("Active path:\n#2 Verify result");
    expect(reminderText(third)).not.toContain("First step");
    expect(third.slice(0, -1)).toEqual(transcript);
    for (const [index, message] of transcript.entries()) expect(third[index]).toBe(message);
    expect(harness.entries).toEqual(entries);
    expect(harness.queuedMessages).toEqual([]);
  });

  it("warns about missing actionable activity but allows ordinary tools and paused open work", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness, "rpc");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("paused", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery"] });
    await run({ action: "add", parentId: 1, items: ["Verify"] });
    let messages = await modelContext(harness, ctx);
    expect(reminderText(messages)).toContain("no explicitly active actionable item");
    expect(reminderText(messages)).toContain("#1 Delivery — 0/1 closed → #2 Verify");
    await run({ action: "update", updates: [{ id: 2, status: "completed" }] });
    messages = await modelContext(harness, ctx, messages);
    expect(reminderText(messages)).toContain("no explicitly active actionable item");
    expect(reminderText(messages)).toContain("#1 Delivery — 1/1 closed");
    expect(reminderText(messages)).not.toContain("#2 Verify");
    const entries = [...harness.entries];
    for (const [name, event] of [
      ["tool_call", { type: "tool_call", toolName: "bash", input: { command: "pwd" } }],
      ["agent_end", { type: "agent_end", messages: [{ role: "assistant", content: "Paused" }] }],
      ["agent_before_settle", { type: "agent_before_settle" }],
    ] as const) {
      for (const handler of harness.events.get(name) ?? []) {
        expect(await handler(event, ctx)).toBeUndefined();
      }
    }
    expect((await run({ action: "list" })).details.snapshot).toMatchObject({
      items: [
        { id: 1, status: "pending" },
        { id: 2, status: "completed" },
      ],
    });
    expect(harness.entries).toEqual(entries);
    expect(harness.queuedMessages).toEqual([]);
    expect(harness.activeTools).toEqual(["todo", "bash", "read", "edit"]);
  });

  it("refreshes reminders from restored branch state after navigation, compaction, and restart", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness, "print");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("branch-reminder", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Original branch"] });
    await run({ action: "update", updates: [{ id: 1, status: "in_progress" }] });
    const original = [...harness.entries];
    let messages = await modelContext(harness, ctx);
    await run({ action: "update", updates: [{ id: 1, text: "New branch" }] });
    const latest = [...harness.entries];
    messages = await modelContext(harness, ctx, messages);
    expect(reminderText(messages)).toContain("#1 New branch");
    harness.entries.splice(0, harness.entries.length, ...original);
    await emit(harness, "session_tree", ctx);
    messages = await modelContext(harness, ctx, messages);
    expect(reminderText(messages)).toContain("#1 Original branch");
    expect(reminderText(messages)).not.toContain("New branch");
    harness.entries.splice(0, harness.entries.length, ...latest);
    await emit(harness, "session_compact", ctx);
    expect(reminderText(await modelContext(harness, ctx, messages))).toContain("#1 New branch");
    const reloaded = createHarness();
    reloaded.entries.push(...original);
    const reloadedCtx = context(reloaded, "print");
    await emit(reloaded, "session_start", reloadedCtx);
    expect(reminderText(await modelContext(reloaded, reloadedCtx, messages))).toContain(
      "#1 Original branch",
    );
    expect(reloaded.entries).toEqual(original);
    expect(reloaded.queuedMessages).toEqual([]);
  });

  it("suppresses and removes stale reminders for empty, closed, or disabled tracking", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness, "print");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("suppress-reminder", input, undefined, undefined, ctx);
    const transcript: ContextEvent["messages"] = [
      { role: "user", content: "Work without tracking when appropriate", timestamp: 1 },
    ];
    expect(await modelContext(harness, ctx, transcript)).toEqual(transcript);
    await run({ action: "add", items: ["Completed work", "Unneeded work"] });
    const tracked = await modelContext(harness, ctx, transcript);
    expect(tracked).toHaveLength(2);
    harness.activeTools.splice(0, 1);
    expect(await modelContext(harness, ctx, tracked)).toEqual(transcript);
    harness.activeTools.push("todo");
    expect(await modelContext(harness, ctx, tracked)).toHaveLength(2);
    await run({
      action: "update",
      updates: [
        { id: 1, status: "completed" },
        { id: 2, status: "cancelled" },
      ],
    });
    expect(await modelContext(harness, ctx, tracked)).toEqual(transcript);
    harness.entries.length = 0;
    await emit(harness, "session_tree", ctx);
    expect(await modelContext(harness, ctx, tracked)).toEqual(transcript);
    expect(harness.entries).toEqual([]);
    expect(harness.queuedMessages).toEqual([]);
  });

  it("bounds reminders to 1024 characters without including the full tree", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness, "print");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("bounded-reminder", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery".padEnd(300, "d")] });
    await run({ action: "add", parentId: 1, items: ["Slice".padEnd(300, "s")] });
    await run({ action: "add", parentId: 2, items: ["Step".padEnd(300, "x")] });
    await run({
      action: "add",
      items: Array.from({ length: 97 }, (_, i) => `Unrelated ${String(i)}`),
    });
    await run({ action: "update", updates: [{ id: 3, status: "in_progress" }] });
    const text = reminderText(await modelContext(harness, ctx));
    expect(text.length).toBeLessThanOrEqual(1024);
    expect(text).toContain("#1 Delivery");
    expect(text).toContain("#2 Slice");
    expect(text).toContain("#3 Step");
    expect(text).not.toContain("Unrelated");
    expect(text).toContain("verified evidence");
    expect(text).toContain("keep paused work open");
    await run({ action: "update", updates: [{ id: 3, status: "pending" }] });
    const missingActive = reminderText(await modelContext(harness, ctx));
    expect(missingActive.length).toBeLessThanOrEqual(1024);
    expect(missingActive).toContain("no explicitly active actionable item");
    expect(missingActive).toContain("#3 Step");
  });

  it("reserves the active ancestor path beyond eight rows without orphaning neighbors", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("visible", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery"] });
    await run({
      action: "add",
      parentId: 1,
      items: Array.from({ length: 9 }, (_, index) => `Slice ${String(index + 1)}`),
    });
    await run({
      action: "add",
      parentId: 10,
      items: ["Implement branch replay", "Verify", "Unused"],
    });
    const result = await run({
      action: "update",
      updates: [
        { id: 11, status: "in_progress" },
        { id: 12, status: "completed" },
        { id: 13, status: "cancelled" },
      ],
    });
    const widget = renderWidget(harness.widgets.at(-1));
    expect(widget.slice(0, 3)).toEqual([
      "<warning>◉</warning> Delivery — 0/9 closed",
      "  <warning>◉</warning> Slice 9 — 2/3 closed (1 cancelled)",
      "    <warning>◉</warning> Implement branch replay",
    ]);
    expect(widget).toHaveLength(9);
    expect(widget.at(-1)).toBe("<dim>… 5 more</dim>");
    expect(renderToolResult(harness, result)).toContain(
      "    <warning>◉</warning> Implement branch replay",
    );
    const expanded = renderToolResult(harness, result, { expanded: true });
    expect(expanded).toContain(
      "    <success>✓</success> Verify\n    <error>×</error> Unused\n  <dim>○</dim> Slice 1",
    );
    expect(expanded).not.toMatch(/#\d+/u);
    await harness.commands.get("todos")?.handler("", ctx);
    expect(harness.notifications.at(-1)).toBe(expanded);
    expect(harness.hierarchicalSummaries.at(-1)).toEqual({
      version: 2,
      rootProgress: { completed: 0, cancelled: 0, total: 1 },
      currentPath: [
        {
          title: "Delivery",
          displayStatus: "in_progress",
          childProgress: { completed: 0, cancelled: 0, total: 9 },
        },
        {
          title: "Slice 9",
          displayStatus: "in_progress",
          childProgress: { completed: 1, cancelled: 1, total: 3 },
        },
        { title: "Implement branch replay", displayStatus: "in_progress" },
      ],
    });
    expect(harness.publishedSummaries.at(-1)).toEqual({
      version: 1,
      closed: 0,
      total: 1,
      current: { status: "in_progress", text: "Implement branch replay · Slice 9 · Delivery" },
    });
    expect(harness.statuses.at(-1)).toBe("todo 0/1 · Implement branch replay · Slice 9 · Delivery");
  });

  it("selects actionable pending work and preserves explicit closure in both summaries", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const rpc = context(harness, "rpc");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("pending", input, undefined, undefined, rpc);
    await run({ action: "add", items: ["Delivery", "Cancelled root"] });
    await run({ action: "add", parentId: 1, items: ["Slice"] });
    await run({ action: "add", parentId: 3, items: ["Implement", "Unused"] });
    await run({
      action: "update",
      updates: [
        { id: 2, status: "cancelled" },
        { id: 5, status: "cancelled" },
      ],
    });
    expect(harness.hierarchicalSummaries.at(-1)).toMatchObject({
      rootProgress: { completed: 0, cancelled: 1, total: 2 },
      currentPath: [
        { title: "Delivery", displayStatus: "pending" },
        {
          title: "Slice",
          displayStatus: "pending",
          childProgress: { completed: 0, cancelled: 1, total: 2 },
        },
        { title: "Implement", displayStatus: "pending" },
      ],
    });
    expect(harness.publishedSummaries.at(-1)).toMatchObject({
      closed: 1,
      total: 2,
      current: { text: "Implement · Slice · Delivery" },
    });
    await harness.commands.get("todos")?.handler("", rpc);
    expect(harness.notifications.at(-1)).toBe(
      "○ Delivery — 0/1 closed\n  ○ Slice — 1/2 closed (1 cancelled)\n    ○ Implement\n    × Unused\n× Cancelled root",
    );
    const listed = await run({ action: "list" });
    expect(listed.content[0]?.text).toContain(
      "  [pending] #3 Slice (parent: #1) — 1/2 closed (1 cancelled)\n    [pending] #4 Implement (parent: #3)",
    );
    expect(listed.structuredContent).toHaveProperty(
      "items",
      expect.arrayContaining([{ id: 4, parentId: 3, status: "pending", text: "Implement" }]),
    );
    await run({ action: "update", updates: [{ id: 4, status: "completed" }] });
    expect(harness.hierarchicalSummaries.at(-1)).toMatchObject({
      currentPath: [
        { title: "Delivery" },
        { title: "Slice", childProgress: { completed: 1, cancelled: 1, total: 2 } },
      ],
    });
    await run({
      action: "update",
      updates: [
        { id: 1, status: "completed" },
        { id: 3, status: "completed" },
      ],
    });
    expect(harness.hierarchicalSummaries.at(-1)).toEqual({
      version: 2,
      rootProgress: { completed: 1, cancelled: 1, total: 2 },
    });
    expect(harness.publishedSummaries.at(-1)).toEqual({ version: 1, closed: 2, total: 2 });
    expect(harness.widgets).toEqual([]);
    harness.entries.length = 0;
    await emit(harness, "session_tree", rpc);
    expect(harness.hierarchicalSummaries.at(-1)).toBeUndefined();
    expect(harness.publishedSummaries.at(-1)).toBeUndefined();
    await run({ action: "add", items: ["Restored work"] });
    await emit(harness, "session_shutdown", rpc);
    expect(harness.hierarchicalSummaries.at(-1)).toBeUndefined();
    expect(harness.publishedSummaries.at(-1)).toBeUndefined();
  });

  it("bounds Unicode and control-text rows without wrapping away the active path", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("width", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery ".repeat(25).trim()] });
    await run({ action: "add", parentId: 1, items: ["Slice 界".repeat(25)] });
    await run({
      action: "add",
      parentId: 2,
      items: ["修复 👨‍👩‍👧‍👦 e\u{301}\n\t\u{1B}[31mcurrent\u{1B}[0m ".repeat(5).trim()],
    });
    const result = await run({ action: "update", updates: [{ id: 3, status: "in_progress" }] });
    const plainTheme: TestTheme = { bold: (text) => text, fg: (_color, text) => text };
    const component = widgetComponent(harness.widgets.at(-1), plainTheme);
    const rows = component.render(24);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatch(/^◉ Delivery/u);
    expect(rows[1]?.startsWith("  ◉ Slice 界")).toBe(true);
    expect(rows[2]?.startsWith("    ◉ 修复 👨‍👩‍👧‍👦 e\u{301} current")).toBe(true);
    for (const row of rows) {
      expect(visibleWidth(row)).toBeLessThanOrEqual(24);
      expect(stripTerminalSequences(row)).not.toMatch(/[\n\t]/u);
      expect(row).not.toContain("\u{1B}[31m");
    }
    const rendered = harness.tool.renderResult?.(
      result,
      { expanded: true, isPartial: false },
      plainTheme,
      { isError: false },
    );
    expect(rendered?.render(24)).toEqual(rows);
    expect(component.render(8)).toHaveLength(3);
    expect(harness.publishedSummaries.at(-1)).toHaveProperty(
      "current.text",
      expect.not.stringContaining("\u{1B}"),
    );
    await run({ action: "update", updates: [{ id: 1, text: "\u{1B}[0m" }] });
    expect(renderWidget(harness.widgets.at(-1))[0]).toContain("(untitled)");
    expect(harness.hierarchicalSummaries.at(-1)).toHaveProperty(
      "currentPath.0.title",
      "(untitled)",
    );
  });

  it("creates a delivery with seven slices and concrete steps through the tool", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness, "print");
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("tree", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Deliver feature"] });
    await run({
      action: "add",
      parentId: 1,
      items: ["Slice 1", "Slice 2", "Slice 3", "Slice 4", "Slice 5", "Slice 6", "Slice 7"],
    });
    const result = await run({
      action: "add",
      parentId: 2,
      items: ["Implement", "Run focused tests"],
    });
    expect(result.structuredContent).toMatchObject({
      changedIds: [9, 10],
      items: [
        { id: 1, text: "Deliver feature" },
        { id: 2, parentId: 1 },
        { id: 3, parentId: 1 },
        { id: 4, parentId: 1 },
        { id: 5, parentId: 1 },
        { id: 6, parentId: 1 },
        { id: 7, parentId: 1 },
        { id: 8, parentId: 1 },
        { id: 9, parentId: 2, text: "Implement" },
        { id: 10, parentId: 2, text: "Run focused tests" },
      ],
    });
    expect((await run({ action: "list" })).content[0]?.text).toContain("#9 Implement (parent: #2)");
    expect(Compile(TodoParameters).Check({ action: "add", parentId: 2, items: ["Check"] })).toBe(
      true,
    );
  });

  it("bounds additions and sibling names without saving invalid mutations", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>, signal?: AbortSignal) =>
      harness.tool.execute("bounded", input, signal, undefined, ctx);
    await run({ action: "add", items: ["Delivery"] });
    await run({ action: "add", parentId: 1, items: ["First slice", "Second slice"] });
    await run({ action: "add", parentId: 2, items: ["Run focused tests"] });
    const before = await run({ action: "add", parentId: 3, items: ["Run focused tests"] });
    const entryCount = harness.entries.length;
    for (const input of [
      { action: "add", parentId: 99, items: ["Missing parent"] },
      { action: "add", parentId: 4, items: ["Too deep"] },
      { action: "add", parentId: 2, items: ["Fresh", " run focused TESTS "] },
      { action: "update", updates: [{ id: 3, text: "First slice" }] },
      { action: "update", updates: [{ id: 4, parentId: 3, text: "Moved" }] },
    ]) {
      await expect(run(input)).rejects.toThrow();
      expect((await run({ action: "list" })).details.snapshot).toEqual(before.details.snapshot);
    }
    const controller = new AbortController();
    controller.abort();
    await expect(
      run({ action: "add", parentId: 2, items: ["Aborted"] }, controller.signal),
    ).rejects.toThrow();
    await run({ action: "clear" });
    await run({ action: "update", updates: [{ id: 4, status: "pending" }] });
    expect(harness.entries).toHaveLength(entryCount);
    await run({ action: "update", updates: [{ id: 5, status: "in_progress" }] });
    await expect(run({ action: "add", parentId: 5, items: ["Hidden work"] })).rejects.toThrow();
    await run({ action: "update", updates: [{ id: 5, status: "completed" }] });
    await expect(run({ action: "add", parentId: 5, items: ["Reopened work"] })).rejects.toThrow();
  });

  it("requires actionable activity and explicit verified group closure", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("activity", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery", "Final review"] });
    await run({ action: "add", parentId: 1, items: ["Slice"] });
    await run({ action: "add", parentId: 3, items: ["Implement", "Verify"] });
    const before = (await run({ action: "list" })).details.snapshot;
    const count = harness.entries.length;
    for (const status of ["in_progress", "completed"]) {
      await expect(run({ action: "update", updates: [{ id: 1, status }] })).rejects.toThrow(/open/);
      expect((await run({ action: "list" })).details.snapshot).toEqual(before);
    }
    expect(harness.entries).toHaveLength(count);
    await run({ action: "update", updates: [{ id: 4, status: "in_progress" }] });
    const switched = await run({ action: "update", updates: [{ id: 5, status: "in_progress" }] });
    expect(switched.details.snapshot).toMatchObject({
      items: [
        { id: 1, status: "pending" },
        { id: 2, status: "pending" },
        { id: 3, status: "pending" },
        { id: 4, status: "pending" },
        { id: 5, status: "in_progress" },
      ],
    });
    await run({
      action: "update",
      updates: [
        { id: 4, status: "completed" },
        { id: 5, status: "completed" },
      ],
    });
    const verified = await run({ action: "update", updates: [{ id: 3, status: "in_progress" }] });
    expect(verified.details.snapshot).toMatchObject({
      items: [
        { status: "pending" },
        { status: "pending" },
        { status: "in_progress" },
        { status: "completed" },
        { status: "completed" },
      ],
    });
    await expect(run({ action: "add", parentId: 3, items: ["Another check"] })).rejects.toThrow(
      /pending/,
    );
    await run({ action: "update", updates: [{ id: 3, status: "completed" }] });
    const final = await run({ action: "list" });
    expect(final.details.snapshot).toMatchObject({
      items: [
        { id: 1, status: "pending" },
        { id: 2, status: "pending" },
        { id: 3, status: "completed" },
        { status: "completed" },
        { status: "completed" },
      ],
    });
    await run({ action: "update", updates: [{ id: 1, status: "completed" }] });
  });

  it("cancels open descendants explicitly and reopens closed ancestors atomically", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("closure", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery"] });
    await run({ action: "add", parentId: 1, items: ["Slice"] });
    await run({ action: "add", parentId: 2, items: ["Done", "Unused", "Open", "Active"] });
    await run({
      action: "update",
      updates: [
        { id: 3, status: "completed" },
        { id: 4, status: "cancelled" },
        { id: 6, status: "in_progress" },
      ],
    });
    const cancelled = await run({ action: "update", updates: [{ id: 1, status: "cancelled" }] });
    expect(cancelled.details.changedIds).toEqual([1, 2, 5, 6]);
    expect(cancelled.details.snapshot).toMatchObject({
      items: [
        { status: "cancelled" },
        { status: "cancelled" },
        { status: "completed" },
        { status: "cancelled" },
        { status: "cancelled" },
        { status: "cancelled" },
      ],
    });
    const count = harness.entries.length;
    await expect(
      run({ action: "update", updates: [{ id: 5, status: "pending" }] }),
    ).rejects.toThrow(/closed/);
    await expect(run({ action: "add", parentId: 2, items: ["New step"] })).rejects.toThrow(
      /pending/,
    );
    expect(harness.entries).toHaveLength(count);
    const reopened = await run({
      action: "update",
      updates: [
        { id: 5, status: "in_progress" },
        { id: 2, status: "pending" },
        { id: 1, status: "pending" },
      ],
    });
    expect(reopened.details.snapshot).toMatchObject({
      items: [
        { status: "pending" },
        { status: "pending" },
        { status: "completed" },
        { status: "cancelled" },
        { status: "in_progress" },
        { status: "cancelled" },
      ],
    });
    const closed = await run({
      action: "update",
      updates: [
        { id: 1, status: "completed" },
        { id: 2, status: "completed" },
        { id: 5, status: "completed" },
      ],
    });
    expect(closed.details.changedIds).toEqual([1, 2, 5]);
  });

  it("keeps cancellation no-ops from demoting unrelated active work", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("cancel-noop", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Cancelled group", "Current work"] });
    await run({ action: "add", parentId: 1, items: ["Cancelled child"] });
    const before = await run({
      action: "update",
      updates: [
        { id: 1, status: "cancelled" },
        { id: 2, status: "in_progress" },
      ],
    });
    const count = harness.entries.length;
    const result = await run({
      action: "update",
      updates: [
        { id: 1, status: "cancelled" },
        { id: 3, status: "in_progress" },
      ],
    });
    expect(result.details.snapshot).toEqual(before.details.snapshot);
    expect(result.details.changedIds).toEqual([]);
    expect(harness.entries).toHaveLength(count);
  });

  it("removes whole named subtrees and clears only closed root subtrees", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("remove", input, undefined, undefined, ctx);
    await run({ action: "add", items: ["Delivery", "Closed root"] });
    await run({ action: "add", parentId: 1, items: ["Slice"] });
    await run({ action: "add", parentId: 3, items: ["Closed step", "Open step"] });
    await run({ action: "add", parentId: 2, items: ["Closed child"] });
    const before = await run({
      action: "update",
      updates: [
        { id: 4, status: "completed" },
        { id: 2, status: "cancelled" },
      ],
    });
    const count = harness.entries.length;
    await expect(run({ action: "remove", ids: [1, 3, 4] })).rejects.toThrow(/subtree/);
    expect((await run({ action: "list" })).details.snapshot).toEqual(before.details.snapshot);
    expect(harness.entries).toHaveLength(count);
    const cleared = await run({ action: "clear" });
    expect(cleared.details.changedIds).toEqual([2, 6]);
    expect(cleared.details.snapshot).toMatchObject({
      items: [{ id: 1 }, { id: 3 }, { id: 4, status: "completed" }, { id: 5 }],
      nextId: 7,
    });
    const savedCount = harness.entries.length;
    await run({ action: "clear" });
    expect(harness.entries).toHaveLength(savedCount);
    const removed = await run({ action: "remove", ids: [3, 4, 5] });
    expect(removed.details.snapshot).toMatchObject({ items: [{ id: 1 }], nextId: 7 });
    await run({ action: "add", parentId: 1, items: ["Replacement slice"] });
    await run({ action: "clear", all: true });
    const added = await run({ action: "add", items: ["Next delivery"] });
    expect(added.details.snapshot).toMatchObject({ items: [{ id: 8 }], nextId: 9 });
  });

  it("replays mixed snapshot versions in branch order and renders historical results", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>) =>
      harness.tool.execute("replay", input, undefined, undefined, ctx);
    const legacy = {
      items: [{ id: 4, text: "Old task", status: "in_progress" }],
      nextId: 7,
      revision: 9,
      version: 1,
    };
    const nested = {
      items: [
        { id: 7, text: "Delivery", status: "pending" },
        { id: 8, parentId: 7, text: "Slice", status: "pending" },
        { id: 9, parentId: 8, text: "Step", status: "in_progress" },
      ],
      nextId: 12,
      revision: 3,
      version: 2,
    };
    const v1 = { type: "custom", customType: "mopeyjellyfish:pi-todo:snapshot:v1", data: legacy };
    const v2 = { type: "custom", customType: "mopeyjellyfish:pi-todo:snapshot:v2", data: nested };
    harness.entries.push(v1, v2);
    await emit(harness, "session_start", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual(nested);
    for (const invalid of [
      { ...nested, items: [{ id: 1, parentId: 99, text: "Orphan", status: "pending" }] },
      {
        ...nested,
        items: [
          { id: 1, parentId: 2, text: "A", status: "pending" },
          { id: 2, parentId: 1, text: "B", status: "pending" },
        ],
      },
      {
        ...nested,
        items: [...nested.items, { id: 10, parentId: 9, text: "Too deep", status: "completed" }],
      },
      { ...nested, items: [{ id: 0, text: "Bad ID", status: "pending" }] },
      { ...nested, items: [{ id: 1, parentId: "7", text: "Bad parent ID", status: "pending" }] },
      {
        ...nested,
        items: [{ id: 7, text: "Closed", status: "completed" }, nested.items[1], nested.items[2]],
      },
      {
        ...nested,
        items: [{ id: 7, text: "Broad active", status: "in_progress" }, nested.items[1]],
      },
    ]) {
      harness.entries.push({ ...v2, data: invalid });
    }
    await emit(harness, "session_compact", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual(nested);
    const added = await run({ action: "add", parentId: 8, items: ["Next step"] });
    expect(added.details.snapshot).toMatchObject({ nextId: 13, revision: 4, version: 2 });
    expect(harness.entries.at(-1)?.customType).toBe("mopeyjellyfish:pi-todo:snapshot:v2");
    harness.entries.push(v1);
    await emit(harness, "session_tree", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual({ ...legacy, version: 2 });
    const historical: ToolResult = {
      content: [{ type: "text", text: "Old tool result" }],
      details: { action: "list", changedIds: [], snapshot: legacy },
    };
    expect(renderToolResult(harness, historical)).toContain("<warning>◉</warning> Old task");
    harness.entries.push(v2);
    record(harness, historical);
    await emit(harness, "session_start", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual({ ...legacy, version: 2 });
    harness.entries.splice(0, harness.entries.length, v1, v2);
    await emit(harness, "session_tree", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual(nested);
    await emit(harness, "session_shutdown", ctx);
    expect(harness.widgets.at(-1)).toBeUndefined();
    expect(harness.statuses.at(-1)).toBeUndefined();
    expect(harness.publishedSummaries.at(-1)).toBeUndefined();
  });

  it("persists nested mutations without direct tool results and replays branch order", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const run = (input: Record<string, unknown>, signal?: AbortSignal) =>
      harness.tool.execute("nested", input, signal, undefined, ctx);
    const added = await run({ action: "add", items: ["Nested work"] });
    expect(harness.entries).toEqual([
      expect.objectContaining({ type: "custom", data: added.details.snapshot }),
    ]);
    const saved = [...harness.entries];
    for (const event of ["session_start", "session_tree", "session_compact"]) {
      await emit(harness, event, ctx);
      expect((await run({ action: "list" })).details.snapshot).toEqual(added.details.snapshot);
    }
    await run({ action: "update", updates: [{ id: 1, status: "pending" }] });
    await run({ action: "clear" });
    await expect(
      run({
        action: "update",
        updates: [
          { id: 1, text: "Partial" },
          { id: 9, text: "Bad" },
        ],
      }),
    ).rejects.toThrow(/not found/);
    const controller = new AbortController();
    controller.abort();
    await expect(run({ action: "add", items: ["Cancelled"] }, controller.signal)).rejects.toThrow();
    expect(harness.entries).toHaveLength(1);
    harness.entries.length = 0;
    await emit(harness, "session_tree", ctx);
    expect((await run({ action: "list" })).details.snapshot).toMatchObject({ items: [] });
    record(harness, added);
    harness.entries.push(...saved);
    await emit(harness, "session_start", ctx);
    const updated = await run({ action: "update", updates: [{ id: 1, text: "Latest custom" }] });
    harness.entries.push({
      type: "custom",
      customType: saved[0]?.customType ?? "",
      data: { version: 99 },
    });
    await emit(harness, "session_compact", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual(updated.details.snapshot);
    record(harness, added);
    await emit(harness, "session_tree", ctx);
    expect((await run({ action: "list" })).details.snapshot).toEqual(added.details.snapshot);
  });

  it("registers a compact sequential todo tool and user command", () => {
    expect.hasAssertions();
    const harness = createHarness();

    expect(harness.tool.name).toBe("todo");
    expect(harness.tool.annotations).toMatchObject({ readOnlyHint: false, openWorldHint: false });
    expect(harness.tool.executionMode).toBe("sequential");
    expect(harness.tool.parameters).toBe(TodoParameters);
    expect(TodoParameters).toHaveProperty("additionalProperties", false);
    expect(harness.tool.promptSnippet).toMatch(/todo/i);
    expect(harness.tool.promptGuidelines).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Use todo /u)]),
    );
    expect(typeof harness.tool.renderCall).toBe("function");
    expect(typeof harness.tool.renderResult).toBe("function");
    expect(harness.commands.has("todos")).toBe(true);
  });

  it("adds batched items and enforces one in-progress item", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const added = await harness.tool.execute(
      "add",
      { action: "add", items: ["Inspect code", "Run tests", "Write docs"] },
      undefined,
      undefined,
      ctx,
    );

    expect(added.content[0]?.text).toContain("Added #1, #2, #3");
    expect(added.details.snapshot).toMatchObject({ nextId: 4, revision: 1, version: 2 });
    expect(harness.publishedSummaries.at(-1)).toEqual({
      closed: 0,
      current: { status: "pending", text: "Inspect code" },
      total: 3,
      version: 1,
    });
    expect(Compile(harness.tool.outputSchema).Check(added.structuredContent)).toBe(true);
    expect(added.structuredContent).toMatchObject({ action: "add" });
    record(harness, added);

    const startedFirst = await harness.tool.execute(
      "start-1",
      { action: "update", updates: [{ id: 1, status: "in_progress" }] },
      undefined,
      undefined,
      ctx,
    );
    expect(startedFirst.content[0]?.text).toContain("#1 in progress");

    const startedSecond = await harness.tool.execute(
      "start-2",
      { action: "update", updates: [{ id: 2, status: "in_progress" }] },
      undefined,
      undefined,
      ctx,
    );
    expect(startedSecond.details.snapshot).toMatchObject({
      items: [
        { id: 1, status: "pending" },
        { id: 2, status: "in_progress" },
        { id: 3, status: "pending" },
      ],
      revision: 3,
    });
    expect(harness.publishedSummaries.at(-1)).toEqual({
      closed: 0,
      current: { status: "in_progress", text: "Run tests" },
      total: 3,
      version: 1,
    });
  });

  it("updates text and status in a batch, lists state, and rejects invalid calls", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await harness.tool.execute(
      "add",
      { action: "add", items: ["Inspect code", "Run tests"] },
      undefined,
      undefined,
      ctx,
    );

    const updated = await harness.tool.execute(
      "update",
      {
        action: "update",
        updates: [
          { id: 1, status: "completed" },
          { id: 2, text: "Run focused tests", status: "in_progress" },
        ],
      },
      undefined,
      undefined,
      ctx,
    );
    expect(updated.content[0]?.text).toContain("Updated #1, #2");

    const listed = await harness.tool.execute(
      "list",
      { action: "list" },
      undefined,
      undefined,
      ctx,
    );
    expect(listed.content[0]?.text).toContain("[completed] #1 Inspect code");
    expect(listed.content[0]?.text).toContain("[in_progress] #2 Run focused tests");

    await expect(
      harness.tool.execute("bad-list", { action: "list", all: true }, undefined, undefined, ctx),
    ).rejects.toThrow(/does not accept/iu);
    await expect(
      harness.tool.execute(
        "bad-update",
        { action: "update", updates: [{ id: 99, status: "completed" }] },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow(/not found/iu);
  });

  it("removes selected items and clears closed items unless all is explicit", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await harness.tool.execute(
      "add",
      { action: "add", items: ["One", "Two", "Three"] },
      undefined,
      undefined,
      ctx,
    );
    await harness.tool.execute(
      "update",
      {
        action: "update",
        updates: [
          { id: 1, status: "completed" },
          { id: 2, status: "cancelled" },
        ],
      },
      undefined,
      undefined,
      ctx,
    );

    const cleared = await harness.tool.execute(
      "clear-closed",
      { action: "clear" },
      undefined,
      undefined,
      ctx,
    );
    expect(cleared.content[0]?.text).toContain("Cleared 2 closed todos");
    expect(cleared.details.snapshot).toMatchObject({
      items: [{ id: 3, text: "Three" }],
      nextId: 4,
    });

    const removed = await harness.tool.execute(
      "remove",
      { action: "remove", ids: [3] },
      undefined,
      undefined,
      ctx,
    );
    expect(removed.content[0]?.text).toContain("Removed #3");

    await harness.tool.execute(
      "add-again",
      { action: "add", items: ["Four"] },
      undefined,
      undefined,
      ctx,
    );
    const clearedAll = await harness.tool.execute(
      "clear-all",
      { action: "clear", all: true },
      undefined,
      undefined,
      ctx,
    );
    expect(clearedAll.details.snapshot).toMatchObject({ items: [], nextId: 5 });
  });

  it("restores only deeply valid snapshots from the active branch", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const invalid = { items: [{ id: 1, status: "wat" }], nextId: 2, revision: 1, version: 1 };
    const valid = {
      items: [{ id: 7, status: "pending", text: "Resume work" }],
      nextId: 8,
      revision: 4,
      version: 1,
    };
    harness.entries.push(
      {
        message: { details: { snapshot: valid }, role: "toolResult", toolName: "todo" },
        type: "message",
      },
      {
        message: { details: { snapshot: invalid }, role: "toolResult", toolName: "todo" },
        type: "message",
      },
    );

    expect(isTodoSnapshot(valid)).toBe(true);
    expect(isTodoSnapshot(invalid)).toBe(false);
    expect(snapshotFromBranch(context(harness))).toEqual({ ...valid, version: 2 });

    const ctx = context(harness);
    await emit(harness, "session_start", ctx);
    const listed = await harness.tool.execute(
      "list",
      { action: "list" },
      undefined,
      undefined,
      ctx,
    );
    expect(listed.content[0]?.text).toContain("#7 Resume work");

    harness.entries.length = 0;
    await emit(harness, "session_tree", ctx);
    const rolledBack = await harness.tool.execute(
      "list-after-tree",
      { action: "list" },
      undefined,
      undefined,
      ctx,
    );
    expect(rolledBack.content[0]?.text).toBe("No todos.");

    harness.entries.push({
      message: { details: { snapshot: valid }, role: "toolResult", toolName: "todo" },
      type: "message",
    });
    await emit(harness, "session_compact", ctx);
    const restored = await harness.tool.execute(
      "list-after-compact",
      { action: "list" },
      undefined,
      undefined,
      ctx,
    );
    expect(restored.content[0]?.text).toContain("#7 Resume work");
    expect(harness.widgets.length).toBeGreaterThan(0);
    await emit(harness, "session_shutdown", ctx);
    expect(harness.widgets.at(-1)).toBeUndefined();
    expect(harness.statuses.at(-1)).toBeUndefined();
    expect(harness.publishedSummaries.at(-1)).toBeUndefined();
  });

  it("shows /todos in TUI mode and stays useful without UI", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const tui = context(harness);
    await harness.tool.execute(
      "add",
      { action: "add", items: ["Visible task"] },
      undefined,
      undefined,
      tui,
    );
    await harness.commands.get("todos")?.handler("", tui);
    expect(harness.notifications.at(-1)).toBe("<dim>○</dim> Visible task");
    expect(harness.notifications.at(-1)).not.toMatch(/#\d+/u);

    const print = context(harness, "print");
    const controller = new AbortController();
    controller.abort();
    await expect(
      harness.tool.execute(
        "cancelled",
        { action: "add", items: ["Must not be added"] },
        controller.signal,
        undefined,
        print,
      ),
    ).rejects.toThrow();
    const listed = await harness.tool.execute(
      "list",
      { action: "list" },
      undefined,
      undefined,
      print,
    );
    expect(listed.content[0]?.text).toContain("Visible task");
    expect(listed.content[0]?.text).not.toContain("Must not be added");
  });

  it("keeps failed pure reducer operations atomic", () => {
    expect.hasAssertions();
    const initial = {
      items: [{ id: 1, status: "pending" as const, text: "Original" }],
      nextId: 2,
      revision: 1,
      version: 1 as const,
    };

    expect(() => applyTodoAction(initial, { action: "add", items: ["  "] })).toThrow(/non-empty/iu);
    expect(initial.items).toEqual([{ id: 1, status: "pending", text: "Original" }]);
    expect(() =>
      applyTodoAction(initial, {
        action: "update",
        updates: [
          { id: 1, text: "Changed" },
          { id: 99, status: "completed" },
        ],
      }),
    ).toThrow(/#99 not found/iu);
    expect(initial.items[0]?.text).toBe("Original");
  });

  it("validates snapshot invariants and ignores unrelated branch entries", () => {
    expect.hasAssertions();
    const valid = {
      items: [{ id: 2, status: "in_progress", text: "Active" }],
      nextId: 3,
      revision: 0,
      version: 1,
    };
    expect(isTodoSnapshot(valid)).toBe(true);
    for (const invalid of [
      null,
      { ...valid, version: 99 },
      { ...valid, nextId: 0 },
      { ...valid, revision: -1 },
      { ...valid, items: "nope" },
      { ...valid, items: [{ id: 0, status: "pending", text: "Bad" }] },
      { ...valid, items: [{ id: 2, status: "pending", text: " padded " }] },
      {
        ...valid,
        items: [
          { id: 1, status: "pending", text: "Same" },
          { id: 1, status: "completed", text: "Other" },
        ],
      },
      {
        ...valid,
        items: [
          { id: 1, status: "pending", text: "Same" },
          { id: 2, status: "completed", text: "same" },
        ],
      },
      {
        ...valid,
        items: [
          { id: 1, status: "in_progress", text: "One" },
          { id: 2, status: "in_progress", text: "Two" },
        ],
      },
      { ...valid, nextId: 2 },
    ]) {
      expect(isTodoSnapshot(invalid)).toBe(false);
    }

    const harness = createHarness();
    harness.entries.push(
      { type: "custom" },
      { message: { role: "user" }, type: "message" },
      { message: { role: "toolResult", toolName: "other" }, type: "message" },
      { message: { details: "bad", role: "toolResult", toolName: "todo" }, type: "message" },
    );
    expect(snapshotFromBranch(context(harness))).toMatchObject({ items: [], revision: 0 });
  });

  it("covers rejected and no-op action boundaries", () => {
    expect.hasAssertions();
    const initial = {
      items: [
        { id: 1, status: "pending" as const, text: "One" },
        { id: 2, status: "pending" as const, text: "Two" },
      ],
      nextId: 3,
      revision: 1,
      version: 1 as const,
    };

    expect(applyTodoAction({ ...initial, items: [] }, { action: "list" }).message).toBe(
      "No todos.",
    );
    expect(() => applyTodoAction(initial, { action: "add" })).toThrow(/requires/iu);
    expect(() => applyTodoAction(initial, { action: "add", items: [42] } as never)).toThrow(
      /string/iu,
    );
    expect(() => applyTodoAction(initial, { action: "add", items: ["x".repeat(301)] })).toThrow(
      /at most 300/iu,
    );
    expect(() => applyTodoAction(initial, { action: "add", items: ["one"] })).toThrow(/unique/iu);
    const full = {
      items: Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        status: "pending" as const,
        text: `Item ${String(index + 1)}`,
      })),
      nextId: 101,
      revision: 1,
      version: 1 as const,
    };
    expect(() => applyTodoAction(full, { action: "add", items: ["Overflow"] })).toThrow(
      /at most 100/iu,
    );

    expect(() => applyTodoAction(initial, { action: "update" })).toThrow(/requires/iu);
    expect(() =>
      applyTodoAction(initial, {
        action: "update",
        updates: [
          { id: 1, status: "in_progress" },
          { id: 1, status: "completed" },
        ],
      }),
    ).toThrow(/unique/iu);
    expect(() =>
      applyTodoAction(initial, {
        action: "update",
        updates: [
          { id: 1, status: "in_progress" },
          { id: 2, status: "in_progress" },
        ],
      }),
    ).toThrow(/only one/iu);
    expect(() => applyTodoAction(initial, { action: "update", updates: [{ id: 1 }] })).toThrow(
      /text or status/iu,
    );
    expect(() =>
      applyTodoAction(initial, {
        action: "update",
        updates: [{ id: 1, status: "invalid" }],
      } as never),
    ).toThrow(/invalid todo status/iu);
    expect(() =>
      applyTodoAction(initial, { action: "update", updates: [{ id: 2, text: "one" }] }),
    ).toThrow(/unique/iu);
    expect(
      applyTodoAction(initial, { action: "update", updates: [{ id: 1, text: "One" }] }),
    ).toMatchObject({ changedIds: [], message: "No todos changed." });

    expect(() => applyTodoAction(initial, { action: "remove" })).toThrow(/requires/iu);
    expect(() => applyTodoAction(initial, { action: "remove", ids: [1, 1] })).toThrow(/unique/iu);
    expect(() => applyTodoAction(initial, { action: "remove", ids: [99] })).toThrow(/not found/iu);
    expect(applyTodoAction(initial, { action: "clear" })).toMatchObject({
      changedIds: [],
      message: "No closed todos to clear.",
    });
    expect(
      applyTodoAction({ ...initial, items: [] }, { action: "clear", all: true }),
    ).toMatchObject({ changedIds: [], message: "Todo list is already empty." });
  });

  it("renders status-coloured, title-only rows for humans while preserving machine IDs", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await harness.tool.execute(
      "add",
      { action: "add", items: ["Pending", "Active", "Done", "Cancelled"] },
      undefined,
      undefined,
      ctx,
    );
    const result = await harness.tool.execute(
      "statuses",
      {
        action: "update",
        updates: [
          { id: 2, status: "in_progress" },
          { id: 3, status: "completed" },
          { id: 4, status: "cancelled" },
        ],
      },
      undefined,
      undefined,
      ctx,
    );
    expect(result.content[0]?.text).toContain("Updated #2, #3, #4");
    expect(result.details.changedIds).toEqual([2, 3, 4]);
    const rendered = renderToolResult(harness, result);
    expect(rendered).toContain("<dim>○</dim> Pending");
    expect(rendered).toContain("<warning>◉</warning> Active");
    expect(rendered).toContain("<success>✓</success> Done");
    expect(rendered).toContain("<error>×</error> Cancelled");
    expect(rendered).not.toMatch(/#\d+/u);

    if (harness.tool.renderCall === undefined) throw new Error("Missing tool call renderer.");
    const call = harness.tool
      .renderCall({ action: "remove", ids: [2, 4] }, testTheme, {})
      .render(500)
      .join("\n");
    expect(call).toContain("remove");
    expect(call).not.toMatch(/#\d+/u);
    const partialCall = harness.tool.renderCall({}, testTheme, {}).render(500).join("\n");
    expect(partialCall).toContain("…");
    expect(partialCall).not.toContain("undefined");
  });

  it("expands bounded tool results to show every todo", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const items = Array.from({ length: 10 }, (_, index) => `Task ${String(index + 1)}`);
    const result = await harness.tool.execute(
      "add",
      { action: "add", items },
      undefined,
      undefined,
      ctx,
    );

    const collapsed = renderToolResult(harness, result);
    expect(collapsed).toContain("<dim>… 2 more</dim>");
    expect(collapsed).not.toContain("Task 10");
    const expanded = renderToolResult(harness, result, { expanded: true });
    expect(expanded).toContain("Task 10");
    expect(expanded).not.toContain("… 2 more");
    expect(expanded).not.toMatch(/#\d+/u);
  });

  it("renders bounded actionable errors without exposing internal IDs", () => {
    expect.hasAssertions();
    const harness = createHarness();
    const failed = {
      content: [{ text: `Todo #99 not found. ${"x".repeat(400)}`, type: "text" as const }],
      details: { action: "update", changedIds: [], snapshot: {} },
    };
    const renderedError = renderToolResult(harness, failed, { isError: true });
    expect(renderedError).toContain("Todo item not found.");
    expect(renderedError).toContain("…");
    expect(renderedError).not.toContain("#99");
    expect(renderedError).toHaveLength(315);

    const malformed = {
      content: [{ text: "Restored #12 snapshot is invalid.", type: "text" as const }],
      details: { action: "list", changedIds: [], snapshot: { version: 99 } },
    };
    expect(renderToolResult(harness, malformed)).toBe(
      "<error>Restored item snapshot is invalid.</error>",
    );

    const empty = {
      content: [],
      details: { action: "list", changedIds: [], snapshot: null },
    };
    expect(renderToolResult(harness, empty)).toBe("<error>Todo operation failed.</error>");
  });

  it("orders and bounds every status in the persistent TUI widget without IDs", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const items = Array.from({ length: 10 }, (_, index) => `Task ${String(index + 1)}`);
    await harness.tool.execute("add", { action: "add", items }, undefined, undefined, ctx);
    await harness.tool.execute(
      "status",
      {
        action: "update",
        updates: [
          { id: 1, status: "in_progress" },
          { id: 4, status: "completed" },
          { id: 5, status: "completed" },
          ...Array.from({ length: 5 }, (_, index) => ({
            id: index + 6,
            status: "cancelled" as const,
          })),
        ],
      },
      undefined,
      undefined,
      ctx,
    );

    const widget = renderWidget(harness.widgets.at(-1));
    expect(widget).toEqual([
      "<warning>◉</warning> Task 1",
      "<dim>○</dim> Task 2",
      "<dim>○</dim> Task 3",
      "<success>✓</success> Task 4",
      "<success>✓</success> Task 5",
      "<error>×</error> Task 6",
      "<error>×</error> Task 7",
      "<error>×</error> Task 8",
      "<dim>… 2 more</dim>",
    ]);
    expect(widget.join("\n")).not.toMatch(/#\d+/u);
    expect(harness.statuses.at(-1)).toBe("todo 7/10");

    let palette = "before";
    const mutableTheme: TestTheme = {
      bold: (text) => testTheme.bold(text),
      fg: (color, text) => `<${palette}-${color}>${text}</${palette}-${color}>`,
    };
    const component = widgetComponent(harness.widgets.at(-1), mutableTheme);
    expect(component.render(500)[0]).toContain("<before-warning>◉</before-warning>");
    palette = "after";
    component.invalidate();
    expect(component.render(500)[0]).toContain("<after-warning>◉</after-warning>");
    expect(component.render(500)[0]).not.toContain("before-warning");
  });

  it("keeps RPC /todos plain, status-distinct, and free of human-facing IDs", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const rpc = context(harness, "rpc");
    await harness.tool.execute(
      "add",
      { action: "add", items: ["Pending", "Done"] },
      undefined,
      undefined,
      rpc,
    );
    await harness.tool.execute(
      "done",
      { action: "update", updates: [{ id: 2, status: "completed" }] },
      undefined,
      undefined,
      rpc,
    );
    await harness.commands.get("todos")?.handler("", rpc);

    expect(harness.notifications.at(-1)).toBe("○ Pending\n✓ Done");
    expect(harness.notifications.at(-1)).not.toMatch(/#\d+|<(?:dim|success)>/u);
    expect(harness.widgets).toEqual([]);
  });

  it("publishes all-closed summaries alongside themed human rows", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    await harness.tool.execute(
      "add",
      { action: "add", items: ["Done", "Cancelled"] },
      undefined,
      undefined,
      ctx,
    );
    await harness.tool.execute(
      "close",
      {
        action: "update",
        updates: [
          { id: 1, status: "completed" },
          { id: 2, status: "cancelled" },
        ],
      },
      undefined,
      undefined,
      ctx,
    );

    expect(harness.statuses.at(-1)).toBe("todo 2/2");
    expect(harness.publishedSummaries.at(-1)).toEqual({
      closed: 2,
      total: 2,
      version: 1,
    });
    expect(renderWidget(harness.widgets.at(-1))).toEqual([
      "<success>✓</success> Done",
      "<error>×</error> Cancelled",
    ]);
  });
});
