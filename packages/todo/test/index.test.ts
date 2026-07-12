import { describe, expect, it } from "vitest";

import todoExtension, {
  TodoParameters,
  applyTodoAction,
  isTodoSnapshot,
  snapshotFromBranch,
} from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface ToolResult {
  readonly content: readonly { readonly text: string; readonly type: "text" }[];
  readonly details: { readonly snapshot: unknown };
}

interface RegisteredTool {
  readonly description: string;
  readonly executionMode?: string;
  readonly name: string;
  readonly parameters: { readonly additionalProperties?: boolean };
  readonly promptGuidelines?: readonly string[];
  readonly promptSnippet?: string;
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
  readonly message?: {
    readonly details?: unknown;
    readonly role: string;
    readonly toolName?: string;
  };
  readonly type: string;
}

interface Harness {
  readonly commands: Map<string, RegisteredCommand>;
  readonly entries: Entry[];
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >;
  readonly notifications: string[];
  readonly statuses: (string | undefined)[];
  readonly tool: RegisteredTool;
  readonly widgets: unknown[];
}

function createHarness(): Harness {
  const commands = new Map<string, RegisteredCommand>();
  const entries: Entry[] = [];
  const events = new Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >();
  const notifications: string[] = [];
  const statuses: (string | undefined)[] = [];
  const widgets: unknown[] = [];
  let tool: RegisteredTool | undefined;
  const pi = {
    on(name: string, handler: (event: Record<string, unknown>, ctx: ExtensionContext) => unknown) {
      events.set(name, [...(events.get(name) ?? []), handler]);
    },
    registerCommand(name: string, definition: RegisteredCommand) {
      commands.set(name, definition);
    },
    registerTool(definition: RegisteredTool) {
      tool = definition;
    },
  } as unknown as ExtensionAPI;
  todoExtension(pi);
  if (tool === undefined) throw new Error("todo tool was not registered");
  return { commands, entries, events, notifications, statuses, tool, widgets };
}

function context(harness: Harness, mode: "print" | "tui" = "tui"): ExtensionContext {
  return {
    cwd: "/projects/example",
    hasUI: mode === "tui",
    mode,
    sessionManager: { getBranch: () => harness.entries },
    ui: {
      notify: (message: string) => harness.notifications.push(message),
      setStatus: (_key: string, value: string | undefined) => harness.statuses.push(value),
      setWidget: (_key: string, value: unknown) => harness.widgets.push(value),
    },
  } as unknown as ExtensionContext;
}

async function emit(harness: Harness, name: string, ctx: ExtensionContext): Promise<void> {
  await Promise.all((harness.events.get(name) ?? []).map((handler) => handler({}, ctx)));
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
  it("registers a compact sequential todo tool and user command", () => {
    expect.hasAssertions();
    const harness = createHarness();

    expect(harness.tool.name).toBe("todo");
    expect(harness.tool.executionMode).toBe("sequential");
    expect(harness.tool.parameters).toBe(TodoParameters);
    expect(TodoParameters).toHaveProperty("additionalProperties", false);
    expect(harness.tool.promptSnippet).toMatch(/todo/i);
    expect(harness.tool.promptGuidelines).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Use todo /u)]),
    );
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
    expect(added.details.snapshot).toMatchObject({ nextId: 4, revision: 1, version: 1 });
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
    expect(snapshotFromBranch(context(harness))).toEqual(valid);

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
    expect(harness.notifications.at(-1)).toContain("#1 Visible task");

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
      { ...valid, version: 2 },
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

  it("bounds the TUI widget and shows the all-closed state", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const ctx = context(harness);
    const items = Array.from({ length: 10 }, (_, index) => `Task ${String(index + 1)}`);
    await harness.tool.execute("add", { action: "add", items }, undefined, undefined, ctx);
    expect(harness.widgets.at(-1)).toEqual(expect.arrayContaining(["… 2 more"]));

    await harness.tool.execute(
      "close",
      {
        action: "update",
        updates: items.map((_item, index) => ({
          id: index + 1,
          status: index === items.length - 1 ? "cancelled" : "completed",
        })),
      },
      undefined,
      undefined,
      ctx,
    );
    expect(harness.widgets.at(-1)).toEqual(["✓ All todos closed"]);
    expect(harness.statuses.at(-1)).toBe("todo 10/10");
  });
});
