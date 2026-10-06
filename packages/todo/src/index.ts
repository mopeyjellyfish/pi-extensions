import { StringEnum } from "@earendil-works/pi-ai";
import {
  Text,
  stripTerminalSequences,
  truncateToWidth,
  type Component,
} from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";

import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";

const MAX_ITEMS = 100;
const MAX_TEXT_LENGTH = 300;
const SNAPSHOT_VERSION = 2;
const TODO_TOOL_NAME = "todo";
const TODO_SNAPSHOT_ENTRY = "mopeyjellyfish:pi-todo:snapshot:v2";
const LEGACY_SNAPSHOT_ENTRY = "mopeyjellyfish:pi-todo:snapshot:v1";
const TODO_UI_KEY = "mopeyjellyfish-pi-todo";
const TODO_REMINDER_TYPE = "mopeyjellyfish:pi-todo:reminder:ephemeral:v1";
const MAX_REMINDER_LENGTH = 1024;
export const TODO_SUMMARY_EVENT = "mopeyjellyfish:pi-todo:summary:v1";
export const TODO_SUMMARY_EVENT_V2 = "mopeyjellyfish:pi-todo:summary:v2";

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
    parentId: Type.Optional(
      Type.Integer({ minimum: 1, description: "Only for action=add: parent for every added item" }),
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
  readonly parentId?: number;
  readonly status: TodoStatus;
  readonly text: string;
}

type MutableTodoItem = { -readonly [Key in keyof TodoItem]: TodoItem[Key] };

export interface TodoSnapshot {
  readonly items: readonly TodoItem[];
  readonly nextId: number;
  readonly revision: number;
  readonly version: 2;
}

type LegacyTodoSnapshot = Omit<TodoSnapshot, "version"> & { readonly version: 1 };

export interface TodoSummaryEventV1 {
  readonly closed: number;
  readonly current?: {
    readonly status: "in_progress" | "pending";
    readonly text: string;
  };
  readonly total: number;
  readonly version: 1;
}

export interface TodoProgress {
  readonly completed: number;
  readonly cancelled: number;
  readonly total: number;
}

export interface TodoSummaryEventV2 {
  readonly version: 2;
  readonly rootProgress: TodoProgress;
  readonly currentPath?: readonly {
    readonly title: string;
    readonly displayStatus: TodoStatus;
    readonly childProgress?: TodoProgress;
  }[];
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
    (value["parentId"] === undefined || isPositiveInteger(value["parentId"])) &&
    typeof value["text"] === "string" &&
    value["text"].length > 0 &&
    value["text"].length <= MAX_TEXT_LENGTH &&
    value["text"] === value["text"].trim() &&
    isTodoStatus(value["status"])
  );
}

export function isTodoSnapshot(value: unknown): value is TodoSnapshot | LegacyTodoSnapshot {
  if (
    !isRecord(value) ||
    (value["version"] !== SNAPSHOT_VERSION && value["version"] !== 1) ||
    !isPositiveInteger(value["nextId"]) ||
    !isNonnegativeInteger(value["revision"]) ||
    !Array.isArray(value["items"]) ||
    value["items"].length > MAX_ITEMS ||
    !value["items"].every(isTodoItem)
  ) {
    return false;
  }

  const ids = value["items"].map((item) => item.id);
  if (value["version"] === 1 && value["items"].some((item) => item.parentId !== undefined))
    return false;
  try {
    assertTree(value["items"]);
  } catch {
    return false;
  }
  const activeCount = value["items"].filter((item) => item.status === "in_progress").length;
  return (
    new Set(ids).size === ids.length && activeCount <= 1 && value["nextId"] > Math.max(0, ...ids)
  );
}

function cloneSnapshot(snapshot: TodoSnapshot | LegacyTodoSnapshot): TodoSnapshot {
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
    if (
      entry.type === "custom" &&
      (entry.customType === TODO_SNAPSHOT_ENTRY || entry.customType === LEGACY_SNAPSHOT_ENTRY)
    ) {
      if (isTodoSnapshot(entry.data)) latest = cloneSnapshot(entry.data);
      continue;
    }
    if (entry.type !== "message" || entry.message.role !== "toolResult") continue;
    if (entry.message.toolName !== TODO_TOOL_NAME) continue;
    if (!isRecord(entry.message.details)) continue;
    const candidate = entry.message.details["snapshot"];
    if (isTodoSnapshot(candidate)) latest = cloneSnapshot(candidate);
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
  const values = items.map(
    (item) => `${String(item.parentId ?? 0)}:${item.text.toLocaleLowerCase()}`,
  );
  if (new Set(values).size !== values.length) throw new Error("Todo sibling text must be unique.");
}

function ancestors(items: readonly TodoItem[], item: TodoItem): TodoItem[] {
  const path: TodoItem[] = [];
  let parentId = item.parentId;
  while (parentId !== undefined) {
    const parent = items.find((candidate) => candidate.id === parentId);
    if (parent === undefined) throw new Error(`Todo parent #${String(parentId)} not found.`);
    if (parent.id === item.id || path.some((ancestor) => ancestor.id === parent.id)) {
      throw new Error("Todo parent links must not contain cycles.");
    }
    path.push(parent);
    if (path.length >= 3) throw new Error("Todo trees may have at most three levels.");
    parentId = parent.parentId;
  }
  return path;
}

function assertTree(items: readonly TodoItem[]): void {
  assertUniqueText(items);
  for (const item of items) {
    const path = ancestors(items, item);
    if (isClosed(item)) continue;
    if (path.some(isClosed))
      throw new Error("Open descendants require reopening closed ancestors in the same update.");
    if (path.some((parent) => parent.status === "in_progress")) {
      throw new Error("A todo with open descendants cannot be in_progress.");
    }
  }
}

function isClosed(item: TodoItem): boolean {
  return item.status === "completed" || item.status === "cancelled";
}

function cancelDescendants(
  items: MutableTodoItem[],
  updates: NonNullable<TodoInput["updates"]>,
  changedIds: number[],
): void {
  const cancelled = new Set(
    updates.filter((update) => update.status === "cancelled").map((update) => update.id),
  );
  for (const item of items) {
    if (isClosed(item) || ancestors(items, item).every((parent) => !cancelled.has(parent.id)))
      continue;
    item.status = "cancelled";
    if (!changedIds.includes(item.id)) changedIds.push(item.id);
  }
}

function countProgress(items: readonly TodoItem[]): TodoProgress {
  return {
    completed: items.filter((item) => item.status === "completed").length,
    cancelled: items.filter((item) => item.status === "cancelled").length,
    total: items.length,
  };
}

function progressText(counts: TodoProgress): string {
  const cancelled = counts.cancelled === 0 ? "" : ` (${String(counts.cancelled)} cancelled)`;
  return `${String(counts.completed + counts.cancelled)}/${String(counts.total)} closed${cancelled}`;
}

function currentPath(snapshot: TodoSnapshot): TodoItem[] {
  const current =
    snapshot.items.find((item) => item.status === "in_progress") ??
    orderedItems(snapshot).find(
      (item) =>
        item.status === "pending" &&
        snapshot.items.every(
          (candidate) =>
            isClosed(candidate) ||
            ancestors(snapshot.items, candidate).every((parent) => parent.id !== item.id),
        ),
    );
  if (current === undefined) return [];
  const path = [current];
  for (const parent of ancestors(snapshot.items, current)) path.unshift(parent);
  return path;
}

function progress(snapshot: TodoSnapshot): string {
  const counts = countProgress(snapshot.items.filter((item) => item.parentId === undefined));
  const path = currentPath(snapshot);
  const summary = `Progress: ${progressText(counts)}.`;
  return path.length === 0
    ? summary
    : `${summary} Next: ${path
        .map((item) => {
          const children = snapshot.items.filter((child) => child.parentId === item.id);
          return `#${String(item.id)} ${item.text}${children.length === 0 ? "" : ` — ${progressText(countProgress(children))}`}`;
        })
        .join(" → ")}`;
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
  assertOnlyFields(input, input.action, ["items", "parentId"]);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("todo action=add requires at least one item.");
  }
  if (snapshot.items.length + input.items.length > MAX_ITEMS) {
    throw new Error(`A todo list may contain at most ${String(MAX_ITEMS)} items.`);
  }
  if (input.parentId !== undefined) {
    const parent = snapshot.items.find((item) => item.id === input.parentId);
    if (parent === undefined) throw new Error(`Todo parent #${String(input.parentId)} not found.`);
    if (parent.status !== "pending") {
      throw new Error("Return the parent to pending before adding children.");
    }
  }
  const texts = input.items.map(normalizedText);
  const additions = texts.map((text, index): TodoItem => ({
    id: snapshot.nextId + index,
    ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
    status: "pending",
    text,
  }));
  const items = [...snapshot.items.map((item) => ({ ...item })), ...additions];
  assertTree(items);
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
    assertOnlyFields(update, "update", ["id", "text", "status"]);
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
  if (
    requestedActive === undefined ||
    items.every((item) => !(item.id === requestedActive.id && item.status === "in_progress"))
  )
    return;
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
  const patchedIds = applyUpdatesToItems(items, input.updates);
  cancelDescendants(items, input.updates, patchedIds);
  demoteOtherActive(items, input.updates, patchedIds);
  assertTree(items);
  const changedIds = patchedIds.filter((id) => {
    const before = snapshot.items.find((item) => item.id === id);
    const after = items.find((item) => item.id === id);
    return before?.status !== after?.status || before?.text !== after?.text;
  });
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
  if (
    snapshot.items.some(
      (item) => !ids.has(item.id) && item.parentId !== undefined && ids.has(item.parentId),
    )
  ) {
    throw new Error("Removing a parent requires naming its complete subtree.");
  }
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
    (item) => removeAll || (isClosed(item) && ancestors(snapshot.items, item).every(isClosed)),
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

export function applyTodoAction(
  saved: TodoSnapshot | LegacyTodoSnapshot,
  input: TodoInput,
): AppliedAction {
  const snapshot = cloneSnapshot(saved);
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
  return orderedItems(snapshot)
    .map((item) => {
      const children = snapshot.items.filter((child) => child.parentId === item.id);
      const counts = children.length === 0 ? "" : ` — ${progressText(countProgress(children))}`;
      return `${"  ".repeat(ancestors(snapshot.items, item).length)}[${item.status}] #${String(item.id)} ${item.text}${item.parentId === undefined ? "" : ` (parent: #${String(item.parentId)})`}${counts}`;
    })
    .join("\n");
}

function orderedItems(snapshot: TodoSnapshot): TodoItem[] {
  const active = snapshot.items.find((item) => item.status === "in_progress");
  const activeIds = new Set(
    active === undefined
      ? []
      : [active.id, ...ancestors(snapshot.items, active).map((item) => item.id)],
  );
  const visit = (parentId?: number): TodoItem[] => {
    const siblings = snapshot.items.filter((item) => item.parentId === parentId);
    return STATUS_ORDER.flatMap((status) =>
      siblings.filter((item) => (activeIds.has(item.id) ? "in_progress" : item.status) === status),
    ).flatMap((item) => [item, ...visit(item.id)]);
  };
  return visit();
}

function displayTitle(text: string): string {
  let clean = "";
  for (const character of stripTerminalSequences(text)) {
    const point = character.codePointAt(0) ?? 0;
    clean += point < 32 || (point >= 127 && point <= 159) ? " " : character;
  }
  return clean.replaceAll(/\s+/gu, " ").trim() || "(untitled)";
}

function currentContextText(path: readonly TodoItem[]): string {
  return path
    .reduce<string[]>((titles, item) => [displayTitle(item.text), ...titles], [])
    .join(" · ");
}

function trackingReminder(snapshot: TodoSnapshot): string | undefined {
  if (snapshot.items.every(isClosed)) return undefined;
  const path = currentPath(snapshot);
  const active = path.at(-1)?.status === "in_progress";
  const roots = countProgress(snapshot.items.filter((item) => item.parentId === undefined));
  const rows = path.map((item) => {
    const children = snapshot.items.filter((child) => child.parentId === item.id);
    const title = displayTitle(item.text);
    const boundedTitle = title.length <= 120 ? title : `${title.slice(0, 119)}…`;
    return `#${String(item.id)} ${boundedTitle}${children.length === 0 ? "" : ` — ${progressText(countProgress(children))}`}`;
  });
  return [
    "Todo tracking reminder: update todo before starting a step or changing work, and reconcile after results or scope changes. Mark completed only with verified evidence; keep paused work open.",
    `Root progress: ${progressText(roots)}.`,
    active
      ? "Active path:"
      : "Open work has no explicitly active actionable item. Set one in_progress before work. Next actionable path:",
    rows.join(" → "),
  ]
    .join("\n")
    .slice(0, MAX_REMINDER_LENGTH);
}

function formatHumanRows(
  snapshot: TodoSnapshot,
  options: { readonly colorize?: Colorize; readonly limit?: number } = {},
): string[] {
  const ordered = orderedItems(snapshot);
  const path = currentPath(snapshot);
  const selected = new Set(
    options.limit === undefined ? ordered.map((item) => item.id) : path.map((item) => item.id),
  );
  for (const item of ordered) {
    if (options.limit === undefined || selected.size >= options.limit) break;
    const context = [...ancestors(snapshot.items, item), item];
    const missing = context.filter((node) => !selected.has(node.id));
    if (selected.size + missing.length <= options.limit) {
      for (const node of missing) selected.add(node.id);
    }
  }
  const visible = ordered.filter((item) => selected.has(item.id));
  const activeIds = new Set(
    path.at(-1)?.status === "in_progress" ? path.map((item) => item.id) : [],
  );
  const rows = visible.map((item) => {
    const presentation = STATUS_PRESENTATION[activeIds.has(item.id) ? "in_progress" : item.status];
    const glyph = options.colorize?.(presentation.color, presentation.glyph) ?? presentation.glyph;
    const children = snapshot.items.filter((child) => child.parentId === item.id);
    const counts = children.length === 0 ? "" : ` — ${progressText(countProgress(children))}`;
    return `${"  ".repeat(ancestors(snapshot.items, item).length)}${glyph} ${displayTitle(item.text)}${counts}`;
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
      return themedRows(snapshot, theme, limit).map((row) =>
        truncateToWidth(row, Math.max(0, width), "…"),
      );
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

function publishSummary(pi: ExtensionAPI, snapshot: TodoSnapshot): void {
  if (snapshot.items.length === 0) {
    pi.events.emit(TODO_SUMMARY_EVENT, undefined);
    pi.events.emit(TODO_SUMMARY_EVENT_V2, undefined);
    return;
  }
  const path = currentPath(snapshot);
  const current = path.at(-1);
  const roots = countProgress(snapshot.items.filter((item) => item.parentId === undefined));
  pi.events.emit(TODO_SUMMARY_EVENT, {
    closed: roots.completed + roots.cancelled,
    ...(current?.status === "in_progress" || current?.status === "pending"
      ? {
          current: {
            status: current.status,
            text: stripTerminalSequences(
              truncateToWidth(currentContextText(path), MAX_TEXT_LENGTH, "…"),
            ),
          },
        }
      : {}),
    total: roots.total,
    version: 1,
  } satisfies TodoSummaryEventV1);
  pi.events.emit(TODO_SUMMARY_EVENT_V2, {
    version: 2,
    rootProgress: roots,
    ...(current === undefined
      ? {}
      : {
          currentPath: path.map((item) => {
            const children = snapshot.items.filter((child) => child.parentId === item.id);
            return {
              title: displayTitle(item.text),
              displayStatus: current.status === "in_progress" ? "in_progress" : item.status,
              ...(children.length === 0 ? {} : { childProgress: countProgress(children) }),
            };
          }),
        }),
  } satisfies TodoSummaryEventV2);
}

function updateUi(pi: ExtensionAPI, ctx: ExtensionContext, snapshot: TodoSnapshot): void {
  publishSummary(pi, snapshot);
  if (ctx.mode !== "tui") return;
  if (snapshot.items.length === 0) {
    ctx.ui.setStatus(TODO_UI_KEY, undefined);
    ctx.ui.setWidget(TODO_UI_KEY, undefined);
    return;
  }

  const roots = countProgress(snapshot.items.filter((item) => item.parentId === undefined));
  const path = currentPath(snapshot);
  const context = path.length <= 1 ? "" : ` · ${currentContextText(path)}`;
  ctx.ui.setStatus(
    TODO_UI_KEY,
    `todo ${String(roots.completed + roots.cancelled)}/${String(roots.total)}${context}`,
  );
  ctx.ui.setWidget(TODO_UI_KEY, (_tui, theme) => todoRowsComponent(snapshot, theme, 8));
}

function clearUi(pi: ExtensionAPI, ctx: ExtensionContext): void {
  pi.events.emit(TODO_SUMMARY_EVENT, undefined);
  pi.events.emit(TODO_SUMMARY_EVENT_V2, undefined);
  if (ctx.mode !== "tui") return;
  ctx.ui.setStatus(TODO_UI_KEY, undefined);
  ctx.ui.setWidget(TODO_UI_KEY, undefined);
}

export default function todoExtension(pi: ExtensionAPI): void {
  let snapshot = EMPTY_SNAPSHOT;

  const restore = (ctx: ExtensionContext): void => {
    snapshot = snapshotFromBranch(ctx);
    updateUi(pi, ctx, snapshot);
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
    clearUi(pi, ctx);
  });

  pi.on("context", (event) => {
    const messages = event.messages.filter(
      (message) => !(message.role === "custom" && message.customType === TODO_REMINDER_TYPE),
    );
    const reminder = pi.getActiveTools().includes(TODO_TOOL_NAME)
      ? trackingReminder(snapshot)
      : undefined;
    if (reminder !== undefined) {
      messages.push({
        role: "custom",
        customType: TODO_REMINDER_TYPE,
        content: reminder,
        display: false,
        timestamp: Date.now(),
      });
    }
    return { messages };
  });

  pi.registerTool({
    name: TODO_TOOL_NAME,
    label: "Todo",
    description:
      "Track session-scoped work with stable IDs in at most three levels. Actions: list; add(items, optional parentId for the whole batch); update(updates with id and text/status); remove(ids naming complete subtrees); clear(closed root subtrees by default, or all:true). Only one actionable item may be in_progress. Complete groups explicitly after descendants close; cancellation cascades to open descendants. Reopen closed ancestors in the same update. Mutations are atomic, trees are limited to 100 items, and state follows Pi session branches.",
    executionMode: "sequential",
    promptSnippet: "Track progress in a session-aware todo list",
    promptGuidelines: [
      "Use todo for non-trivial work with meaningful steps. For multi-slice delivery, create delivery → slice → step with parentId before execution, name every accepted slice, and add concrete steps for the active slice. Do not hide multiple slices in one vague leaf. Standalone tasks remain valid. Skip todo for simple one-step requests.",
      "Use todo as session progress, not a replacement for accepted intent. Expand future slice steps when known, preserve unrelated trees, and name final verification, review, and authorized publication as separate work.",
      "Use todo update to set one actionable step in_progress before work or a delegated handoff. Ancestors show its active path. Reconcile todo after results, repairs, scope changes, and resume. Complete steps only with verified evidence and complete groups explicitly after descendants close and the group outcome is verified.",
      "Use todo in the parent session for delegated tracking. Activate the named slice's delegated step before launch, receive and verify that slice's evidence, then update todo before continuing the same retained writer within the delivery unit. A delegated label is not live knowledge of child edits or tests. If supported retained continuation is unavailable, report the limit and pause for explicit recovery authority, not an automatic replacement writer.",
      "Use todo status cancelled only for work no longer needed. Keep paused and future work open. Before claiming completion, reconcile only finished work within current authority. Never close future checkpointed delivery units or unrelated tasks to end a turn, and do not repeat the full todo tree in prose after the tool displays it.",
    ],
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    outputSchema: Type.Object({
      action: TodoParameters.properties.action,
      items: Type.Array(
        Type.Object({
          id: Type.Integer({ minimum: 1 }),
          parentId: Type.Optional(Type.Integer({ minimum: 1 })),
          status: TodoStatusSchema,
          text: Type.String(),
        }),
      ),
      changedIds: Type.Array(Type.Integer({ minimum: 1 })),
    }),
    parameters: TodoParameters,
    async execute(_id, input, signal, _update, ctx) {
      await Promise.resolve();
      signal?.throwIfAborted();
      const applied = applyTodoAction(snapshot, input);
      if (applied.changedIds.length > 0) {
        pi.appendEntry(TODO_SNAPSHOT_ENTRY, cloneSnapshot(applied.snapshot));
      }
      snapshot = applied.snapshot;
      updateUi(pi, ctx, snapshot);
      return {
        content: [{ type: "text", text: applied.message }],
        structuredContent: {
          action: input.action,
          items: snapshot.items.map((item) => ({ ...item })),
          changedIds: [...applied.changedIds],
        },
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
      const candidate = isRecord(result.details) ? result.details["snapshot"] : undefined;
      if (renderContext.isError || !isTodoSnapshot(candidate)) {
        return new Text(theme.fg("error", humanErrorMessage(result.content)), 0, 0);
      }
      const restored = cloneSnapshot(candidate);
      return restored.items.length === 0
        ? new Text(theme.fg("dim", "No todos."), 0, 0)
        : todoRowsComponent(restored, theme, expanded ? undefined : 8);
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
