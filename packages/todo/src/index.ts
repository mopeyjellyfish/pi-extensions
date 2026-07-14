import { StringEnum } from "@earendil-works/pi-ai";
import { Text, type Component } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";

import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";

const MAX_ITEMS = 100;
const MAX_TEXT_LENGTH = 300;
const SNAPSHOT_VERSION = 1;
const TODO_TOOL_NAME = "todo";
const TODO_UI_KEY = "mopeyjellyfish-pi-todo";

const TodoStatusSchema = StringEnum(["pending", "in_progress", "completed", "cancelled"] as const);

const TodoUpdateSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
    status: Type.Optional(TodoStatusSchema),
    text: Type.Optional(Type.String({ maxLength: MAX_TEXT_LENGTH, minLength: 1 })),
  },
  { additionalProperties: false },
);

export const TodoParameters = Type.Object(
  {
    action: StringEnum(["list", "add", "update", "remove", "clear"] as const, {
      description: "Operation to perform; provide only the fields documented for that action",
    }),
    all: Type.Optional(
      Type.Boolean({ description: "For clear, remove every item instead of only closed items" }),
    ),
    ids: Type.Optional(
      Type.Array(Type.Integer({ minimum: 1 }), {
        description: "Only for action=remove: stable todo IDs to remove",
        maxItems: MAX_ITEMS,
        minItems: 1,
      }),
    ),
    items: Type.Optional(
      Type.Array(Type.String({ maxLength: MAX_TEXT_LENGTH, minLength: 1 }), {
        description: "Only for action=add: todo text to add, in execution order",
        maxItems: MAX_ITEMS,
        minItems: 1,
      }),
    ),
    updates: Type.Optional(
      Type.Array(TodoUpdateSchema, {
        description: "Only for action=update: todo patches to apply atomically",
        maxItems: MAX_ITEMS,
        minItems: 1,
      }),
    ),
  },
  { additionalProperties: false },
);

export type TodoStatus = Static<typeof TodoStatusSchema>;
export type TodoInput = Static<typeof TodoParameters>;

export interface TodoItem {
  readonly id: number;
  readonly status: TodoStatus;
  readonly text: string;
}

type MutableTodoItem = { -readonly [Key in keyof TodoItem]: TodoItem[Key] };

export interface TodoSnapshot {
  readonly items: readonly TodoItem[];
  readonly nextId: number;
  readonly revision: number;
  readonly version: 1;
}

interface TodoResultDetails {
  readonly action: TodoInput["action"];
  readonly changedIds: readonly number[];
  readonly snapshot: TodoSnapshot;
}

interface AppliedAction {
  readonly changedIds: readonly number[];
  readonly message: string;
  readonly snapshot: TodoSnapshot;
}

const EMPTY_SNAPSHOT: TodoSnapshot = {
  items: [],
  nextId: 1,
  revision: 0,
  version: SNAPSHOT_VERSION,
};

const STATUSES = new Set<TodoStatus>(["pending", "in_progress", "completed", "cancelled"]);
const STATUS_ORDER: readonly TodoStatus[] = ["in_progress", "pending", "completed", "cancelled"];
const STATUS_PRESENTATION = {
  cancelled: { color: "error", glyph: "×" },
  completed: { color: "success", glyph: "✓" },
  in_progress: { color: "warning", glyph: "◉" },
  pending: { color: "dim", glyph: "○" },
} as const satisfies Record<
  TodoStatus,
  { readonly color: "dim" | "error" | "success" | "warning"; readonly glyph: string }
>;

type TodoThemeColor = (typeof STATUS_PRESENTATION)[TodoStatus]["color"];
type Colorize = (color: TodoThemeColor, text: string) => string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function isNonnegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function isTodoStatus(value: unknown): value is TodoStatus {
  return (
    value === "pending" || value === "in_progress" || value === "completed" || value === "cancelled"
  );
}

function isTodoItem(value: unknown): value is TodoItem {
  return (
    isRecord(value) &&
    isPositiveInteger(value["id"]) &&
    typeof value["text"] === "string" &&
    value["text"].length > 0 &&
    value["text"].length <= MAX_TEXT_LENGTH &&
    value["text"] === value["text"].trim() &&
    isTodoStatus(value["status"])
  );
}

export function isTodoSnapshot(value: unknown): value is TodoSnapshot {
  if (
    !isRecord(value) ||
    value["version"] !== SNAPSHOT_VERSION ||
    !isPositiveInteger(value["nextId"]) ||
    !isNonnegativeInteger(value["revision"]) ||
    !Array.isArray(value["items"]) ||
    value["items"].length > MAX_ITEMS ||
    !value["items"].every(isTodoItem)
  ) {
    return false;
  }

  const ids = value["items"].map((item) => item.id);
  const normalizedText = value["items"].map((item) => item.text.toLocaleLowerCase());
  const activeCount = value["items"].filter((item) => item.status === "in_progress").length;
  return (
    new Set(ids).size === ids.length &&
    new Set(normalizedText).size === normalizedText.length &&
    activeCount <= 1 &&
    value["nextId"] > Math.max(0, ...ids)
  );
}

function cloneSnapshot(snapshot: TodoSnapshot): TodoSnapshot {
  return {
    items: snapshot.items.map((item) => ({ ...item })),
    nextId: snapshot.nextId,
    revision: snapshot.revision,
    version: SNAPSHOT_VERSION,
  };
}

export function snapshotFromBranch(ctx: ExtensionContext): TodoSnapshot {
  let latest = EMPTY_SNAPSHOT;
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message" || entry.message.role !== "toolResult") continue;
    if (entry.message.toolName !== TODO_TOOL_NAME) continue;
    if (!isRecord(entry.message.details)) continue;
    const candidate = entry.message.details["snapshot"];
    if (isTodoSnapshot(candidate)) latest = candidate;
  }
  return cloneSnapshot(latest);
}

function assertOnlyFields(
  input: object,
  action: TodoInput["action"],
  allowed: readonly string[],
): void {
  const allowedFields = new Set(["action", ...allowed]);
  const unexpected = Object.keys(input).filter((key) => !allowedFields.has(key));
  if (unexpected.length > 0) {
    throw new Error(`todo action=${action} does not accept: ${unexpected.join(", ")}`);
  }
}

function normalizedText(value: unknown): string {
  if (typeof value !== "string") throw new TypeError("Todo text must be a string.");
  const text = value.trim();
  if (text.length === 0) throw new Error("Todo text must be non-empty.");
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Todo text must be at most ${String(MAX_TEXT_LENGTH)} characters.`);
  }
  return text;
}

function assertUniqueNumbers(values: readonly number[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique.`);
}

function assertUniqueText(items: readonly TodoItem[]): void {
  const values = items.map((item) => item.text.toLocaleLowerCase());
  if (new Set(values).size !== values.length) throw new Error("Todo text must be unique.");
}

function progress(snapshot: TodoSnapshot): string {
  const closed = snapshot.items.filter(
    (item) => item.status === "completed" || item.status === "cancelled",
  ).length;
  const active = snapshot.items.find((item) => item.status === "in_progress");
  const pending = snapshot.items.find((item) => item.status === "pending");
  const next = active ?? pending;
  const summary = `Progress: ${String(closed)}/${String(snapshot.items.length)} closed.`;
  return next === undefined ? summary : `${summary} Next: #${String(next.id)} ${next.text}`;
}

function changedSnapshot(
  snapshot: TodoSnapshot,
  items: readonly TodoItem[],
  options: { readonly nextId?: number } = {},
): TodoSnapshot {
  return {
    items,
    nextId: options.nextId ?? snapshot.nextId,
    revision: snapshot.revision + 1,
    version: SNAPSHOT_VERSION,
  };
}

function applyList(snapshot: TodoSnapshot, input: TodoInput): AppliedAction {
  assertOnlyFields(input, input.action, []);
  return { changedIds: [], message: formatTodos(snapshot), snapshot: cloneSnapshot(snapshot) };
}

function applyAdd(snapshot: TodoSnapshot, input: TodoInput): AppliedAction {
  assertOnlyFields(input, input.action, ["items"]);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("todo action=add requires at least one item.");
  }
  if (snapshot.items.length + input.items.length > MAX_ITEMS) {
    throw new Error(`A todo list may contain at most ${String(MAX_ITEMS)} items.`);
  }
  const texts = input.items.map(normalizedText);
  const additions = texts.map((text, index): TodoItem => ({
    id: snapshot.nextId + index,
    status: "pending",
    text,
  }));
  const items = [...snapshot.items.map((item) => ({ ...item })), ...additions];
  assertUniqueText(items);
  const next = changedSnapshot(snapshot, items, {
    nextId: snapshot.nextId + additions.length,
  });
  const ids = additions.map((item) => item.id);
  return {
    changedIds: ids,
    message: `Added ${ids.map((id) => `#${String(id)}`).join(", ")}. ${progress(next)}`,
    snapshot: next,
  };
}

function applyUpdatesToItems(
  items: MutableTodoItem[],
  updates: NonNullable<TodoInput["updates"]>,
): number[] {
  const changedIds: number[] = [];
  for (const update of updates) {
    const item = items.find((candidate) => candidate.id === update.id);
    if (item === undefined) throw new Error(`Todo #${String(update.id)} not found.`);
    if (update.text === undefined && update.status === undefined) {
      throw new Error(`Todo #${String(update.id)} update must set text or status.`);
    }
    const text = update.text === undefined ? item.text : normalizedText(update.text);
    const status = update.status ?? item.status;
    if (!STATUSES.has(status)) throw new Error(`Invalid todo status: ${status}`);
    if (text === item.text && status === item.status) continue;
    item.text = text;
    item.status = status;
    changedIds.push(item.id);
  }
  return changedIds;
}

function demoteOtherActive(
  items: MutableTodoItem[],
  updates: NonNullable<TodoInput["updates"]>,
  changedIds: number[],
): void {
  const requestedActive = updates.find((update) => update.status === "in_progress");
  if (requestedActive === undefined) return;
  for (const item of items) {
    if (item.id === requestedActive.id || item.status !== "in_progress") continue;
    item.status = "pending";
    if (!changedIds.includes(item.id)) changedIds.push(item.id);
  }
}

function applyUpdate(snapshot: TodoSnapshot, input: TodoInput): AppliedAction {
  assertOnlyFields(input, input.action, ["updates"]);
  if (!Array.isArray(input.updates) || input.updates.length === 0) {
    throw new Error("todo action=update requires at least one update.");
  }
  const ids = input.updates.map((update) => update.id);
  assertUniqueNumbers(ids, "Update IDs");
  if (input.updates.filter((update) => update.status === "in_progress").length > 1) {
    throw new Error("Only one todo may be set to in_progress in a single update.");
  }

  const items = snapshot.items.map((item) => ({ ...item }));
  const changedIds = applyUpdatesToItems(items, input.updates);
  demoteOtherActive(items, input.updates, changedIds);
  assertUniqueText(items);
  if (changedIds.length === 0) {
    return { changedIds: [], message: "No todos changed.", snapshot: cloneSnapshot(snapshot) };
  }
  const next = changedSnapshot(snapshot, items);
  const requestedIds = ids.filter((id) => changedIds.includes(id));
  const onlyUpdate = input.updates.length === 1 ? input.updates[0] : undefined;
  const message =
    onlyUpdate?.status === "in_progress" && requestedIds.length === 1
      ? `#${String(onlyUpdate.id)} in progress. ${progress(next)}`
      : `Updated ${requestedIds.map((id) => `#${String(id)}`).join(", ")}. ${progress(next)}`;
  return { changedIds, message, snapshot: next };
}

function applyRemove(snapshot: TodoSnapshot, input: TodoInput): AppliedAction {
  assertOnlyFields(input, input.action, ["ids"]);
  if (!Array.isArray(input.ids) || input.ids.length === 0) {
    throw new Error("todo action=remove requires at least one ID.");
  }
  assertUniqueNumbers(input.ids, "Remove IDs");
  for (const id of input.ids) {
    if (snapshot.items.every((item) => item.id !== id)) {
      throw new Error(`Todo #${String(id)} not found.`);
    }
  }
  const ids = new Set(input.ids);
  const next = changedSnapshot(
    snapshot,
    snapshot.items.filter((item) => !ids.has(item.id)).map((item) => ({ ...item })),
  );
  return {
    changedIds: input.ids,
    message: `Removed ${input.ids.map((id) => `#${String(id)}`).join(", ")}. ${progress(next)}`,
    snapshot: next,
  };
}

function applyClear(snapshot: TodoSnapshot, input: TodoInput): AppliedAction {
  assertOnlyFields(input, input.action, ["all"]);
  const removeAll = input.all === true;
  const removed = snapshot.items.filter(
    (item) => removeAll || item.status === "completed" || item.status === "cancelled",
  );
  if (removed.length === 0) {
    return {
      changedIds: [],
      message: removeAll ? "Todo list is already empty." : "No closed todos to clear.",
      snapshot: cloneSnapshot(snapshot),
    };
  }
  const removedIds = new Set(removed.map((item) => item.id));
  const next = changedSnapshot(
    snapshot,
    snapshot.items.filter((item) => !removedIds.has(item.id)).map((item) => ({ ...item })),
  );
  return {
    changedIds: [...removedIds],
    message: removeAll
      ? `Cleared all ${String(removed.length)} todos.`
      : `Cleared ${String(removed.length)} closed todos. ${progress(next)}`,
    snapshot: next,
  };
}

export function applyTodoAction(snapshot: TodoSnapshot, input: TodoInput): AppliedAction {
  switch (input.action) {
    case "list":
      return applyList(snapshot, input);
    case "add":
      return applyAdd(snapshot, input);
    case "update":
      return applyUpdate(snapshot, input);
    case "remove":
      return applyRemove(snapshot, input);
    case "clear":
      return applyClear(snapshot, input);
  }
}

function formatTodos(snapshot: TodoSnapshot): string {
  if (snapshot.items.length === 0) return "No todos.";
  return snapshot.items
    .map((item) => `[${item.status}] #${String(item.id)} ${item.text}`)
    .join("\n");
}

function orderedItems(snapshot: TodoSnapshot): TodoItem[] {
  return STATUS_ORDER.flatMap((status) => snapshot.items.filter((item) => item.status === status));
}

function formatHumanRows(
  snapshot: TodoSnapshot,
  options: { readonly colorize?: Colorize; readonly limit?: number } = {},
): string[] {
  const ordered = orderedItems(snapshot);
  const visible = options.limit === undefined ? ordered : ordered.slice(0, options.limit);
  const rows = visible.map((item) => {
    const presentation = STATUS_PRESENTATION[item.status];
    const glyph = options.colorize?.(presentation.color, presentation.glyph) ?? presentation.glyph;
    return `${glyph} ${item.text}`;
  });
  if (visible.length < ordered.length) {
    const overflow = `… ${String(ordered.length - visible.length)} more`;
    rows.push(options.colorize?.("dim", overflow) ?? overflow);
  }
  return rows;
}

function themedRows(snapshot: TodoSnapshot, theme: Theme, limit?: number): string[] {
  return formatHumanRows(snapshot, {
    colorize: (color, text) => theme.fg(color, text),
    ...(limit === undefined ? {} : { limit }),
  });
}

function todoRowsComponent(snapshot: TodoSnapshot, theme: Theme, limit?: number): Component {
  return {
    invalidate() {
      // Stateless: render recomputes themed rows after every invalidation.
    },
    render(width) {
      return new Text(themedRows(snapshot, theme, limit).join("\n"), 0, 0).render(width);
    },
  };
}

function humanErrorMessage(
  content: readonly { readonly text?: string; readonly type: string }[],
): string {
  const raw = content.find((item) => item.type === "text")?.text?.trim();
  if (raw === undefined || raw.length === 0) return "Todo operation failed.";
  const sanitized = raw.replaceAll(/#\d+/gu, "item").replaceAll(/\s+/gu, " ");
  return sanitized.length <= MAX_TEXT_LENGTH
    ? sanitized
    : `${sanitized.slice(0, MAX_TEXT_LENGTH - 1)}…`;
}

function updateUi(ctx: ExtensionContext, snapshot: TodoSnapshot): void {
  if (ctx.mode !== "tui") return;
  if (snapshot.items.length === 0) {
    ctx.ui.setStatus(TODO_UI_KEY, undefined);
    ctx.ui.setWidget(TODO_UI_KEY, undefined);
    return;
  }

  const closed = snapshot.items.filter(
    (item) => item.status === "completed" || item.status === "cancelled",
  ).length;
  ctx.ui.setStatus(TODO_UI_KEY, `todo ${String(closed)}/${String(snapshot.items.length)}`);
  ctx.ui.setWidget(TODO_UI_KEY, (_tui, theme) => todoRowsComponent(snapshot, theme, 8));
}

function clearUi(ctx: ExtensionContext): void {
  if (ctx.mode !== "tui") return;
  ctx.ui.setStatus(TODO_UI_KEY, undefined);
  ctx.ui.setWidget(TODO_UI_KEY, undefined);
}

export default function todoExtension(pi: ExtensionAPI): void {
  let snapshot = EMPTY_SNAPSHOT;

  const restore = (ctx: ExtensionContext): void => {
    snapshot = snapshotFromBranch(ctx);
    updateUi(ctx, snapshot);
  };

  pi.on("session_start", (_event, ctx) => {
    restore(ctx);
  });
  pi.on("session_tree", (_event, ctx) => {
    restore(ctx);
  });
  pi.on("session_compact", (_event, ctx) => {
    restore(ctx);
  });
  pi.on("session_shutdown", (_event, ctx) => {
    clearUi(ctx);
  });

  pi.registerTool({
    name: TODO_TOOL_NAME,
    label: "Todo",
    description:
      "Track session-scoped work with stable IDs. Actions: list; add(items); update(updates with id and text/status); remove(ids); clear(closed by default, or all:true). Mutations are atomic, lists are limited to 100 items, and state follows Pi session branches.",
    executionMode: "sequential",
    promptSnippet: "Track progress in a session-aware todo list",
    promptGuidelines: [
      "Use todo for non-trivial work with multiple meaningful steps; skip it for simple one-step requests.",
      "Use todo add to create concise, verifiable items in execution order, then use todo update to set one item in_progress before working on it and completed only after verification.",
      "Use todo status cancelled for work that is no longer needed, keep at most one item in_progress, and do not repeat the full todo list in prose after the tool displays it.",
      "Before finishing work tracked by todo, update every remaining item to completed or cancelled; do not claim completion while pending or in_progress items remain.",
    ],
    parameters: TodoParameters,
    async execute(_id, input, signal, _update, ctx) {
      await Promise.resolve();
      signal?.throwIfAborted();
      const applied = applyTodoAction(snapshot, input);
      snapshot = applied.snapshot;
      updateUi(ctx, snapshot);
      return {
        content: [{ type: "text", text: applied.message }],
        details: {
          action: input.action,
          changedIds: applied.changedIds,
          snapshot: cloneSnapshot(snapshot),
        } satisfies TodoResultDetails,
      };
    },
    renderCall(input, theme) {
      const action = typeof input.action === "string" ? input.action : "…";
      return new Text(theme.fg("toolTitle", theme.bold("todo ")) + theme.fg("muted", action), 0, 0);
    },
    renderResult(result, { expanded, isPartial }, theme, renderContext) {
      if (isPartial) return new Text(theme.fg("warning", "Updating todos…"), 0, 0);
      const details = result.details as TodoResultDetails | undefined;
      if (renderContext.isError || !isTodoSnapshot(details?.snapshot)) {
        return new Text(theme.fg("error", humanErrorMessage(result.content)), 0, 0);
      }
      const rows = themedRows(details.snapshot, theme, expanded ? undefined : 8);
      const text = rows.length === 0 ? theme.fg("dim", "No todos.") : rows.join("\n");
      return new Text(text, 0, 0);
    },
  });

  pi.registerCommand("todos", {
    description: "Show todos on the current session branch",
    handler: (_arguments, ctx) => {
      if (!ctx.hasUI) return Promise.resolve();
      const rows =
        ctx.mode === "tui" ? themedRows(snapshot, ctx.ui.theme) : formatHumanRows(snapshot);
      const text = rows.length === 0 ? "No todos." : rows.join("\n");
      ctx.ui.notify(text, "info");
      return Promise.resolve();
    },
  });
}
