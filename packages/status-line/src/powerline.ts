import { basename } from "node:path";

import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import type { GitState, GitStatusDetails } from "./git.ts";
import type { Theme, ThemeColor } from "@earendil-works/pi-coding-agent";

const ESCAPE_CHARACTER = "\u{1B}";
const RESET = `${ESCAPE_CHARACTER}[0m`;
const THIN_SEPARATOR = "\u{E0B1}";
const PLAIN_THEME: StatusLineTheme = { fg: (_color, text) => text };

export type StatusLineTheme = Pick<Theme, "fg">;

export interface ContextStatusLineView {
  readonly contextWindow: number;
  readonly percent: number | null;
}

export interface TodoStatusLineView {
  readonly closed: number;
  readonly current?: string;
  readonly total: number;
}

export interface SubagentStatusLineView {
  readonly active: number;
  readonly attention: number;
}

export interface StatusLineView {
  readonly accountLimits?: readonly {
    readonly label: string;
    readonly remainingPercent: number;
  }[];
  readonly branch?: string;
  readonly context?: ContextStatusLineView;
  readonly cwd: string;
  readonly effort?: string;
  readonly extensionStatuses: readonly string[];
  readonly gitDetails?: GitStatusDetails;
  readonly gitState: GitState;
  readonly model?: string;
  readonly subagents?: SubagentStatusLineView;
  readonly todo?: TodoStatusLineView;
}

interface Segment {
  readonly text: string;
  readonly tone:
    | "accountLimit"
    | "branch"
    | "context"
    | "effort"
    | "extension"
    | "model"
    | "path"
    | "subagents"
    | "todo";
}

interface RenderOptions {
  readonly accountLimitLimit: number;
  readonly branchLimit: number;
  readonly cwdLimit: number;
  readonly extensionLimit: number;
  readonly includeAccountLimit: boolean;
  readonly includeBranch: boolean;
  readonly includeContext: boolean;
  readonly includeEffort: boolean;
  readonly includeExtensions: boolean;
  readonly includeModel: boolean;
  readonly includeSubagents: boolean;
  readonly includeTodo: boolean;
  readonly modelLimit: number;
  readonly todoLimit: number;
}

export function stripAnsi(value: string): string {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== ESCAPE_CHARACTER || value[index + 1] !== "[") {
      result += value[index] ?? "";
      continue;
    }
    index += 2;
    while (index < value.length) {
      const codePoint = value.codePointAt(index) ?? 0;
      if (codePoint >= 64 && codePoint <= 126) break;
      index += 1;
    }
  }
  return result;
}

function sanitize(value: string): string {
  let result = "";
  for (const character of stripAnsi(value)) {
    const codePoint = character.codePointAt(0) ?? 0;
    result += codePoint < 32 || (codePoint >= 127 && codePoint <= 159) ? " " : character;
  }
  return result.replaceAll(/\s+/gu, " ").trim();
}

function compact(value: string, maximum: number): string {
  const clean = sanitize(value);
  return visibleWidth(clean) <= maximum ? clean : truncateToWidth(clean, maximum, "…");
}

function formatTokens(count: number): string {
  if (count < 1000) return String(count);
  if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${String(Math.round(count / 1000))}k`;
  if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${String(Math.round(count / 1_000_000))}M`;
}

function rgb(hex: string, text: string): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `${ESCAPE_CHARACTER}[38;2;${String(red)};${String(green)};${String(blue)}m${text}${RESET}`;
}

function effortColor(effort: string): ThemeColor {
  const colors: Partial<Record<string, ThemeColor>> = {
    high: "thinkingHigh",
    low: "thinkingLow",
    max: "thinkingMax",
    medium: "thinkingMedium",
    minimal: "thinkingMinimal",
    off: "thinkingOff",
    xhigh: "thinkingXhigh",
  };
  return colors[effort] ?? "muted";
}

function contextColor(context: ContextStatusLineView): ThemeColor {
  if (context.percent !== null && context.percent > 90) return "error";
  if (context.percent !== null && context.percent > 70) return "warning";
  return "dim";
}

function branchColor(state: GitState): ThemeColor {
  if (state === "conflicted") return "error";
  return state === "clean" ? "success" : "warning";
}

function accountLimitColor(remaining: number): ThemeColor {
  if (remaining <= 10) return "error";
  return remaining <= 30 ? "warning" : "dim";
}

function colorSegment(segment: Segment, view: StatusLineView, theme: StatusLineTheme): string {
  switch (segment.tone) {
    case "model":
      return rgb("#d787af", segment.text);
    case "effort":
      return theme.fg(effortColor(view.effort ?? "off"), segment.text);
    case "path":
      return rgb("#00afaf", segment.text);
    case "branch":
      return theme.fg(branchColor(view.gitState), segment.text);
    case "context":
      return theme.fg(
        contextColor(view.context ?? { contextWindow: 0, percent: null }),
        segment.text,
      );
    case "accountLimit":
      return theme.fg(
        accountLimitColor(
          Math.min(...(view.accountLimits?.map((limit) => limit.remainingPercent) ?? [100])),
        ),
        segment.text,
      );
    case "extension":
      return theme.fg("muted", segment.text);
    case "subagents":
      return theme.fg(subagentColor(view.subagents), segment.text);
    case "todo":
      return theme.fg(todoColor(view.todo), segment.text);
  }
}

function subagentColor(subagents: SubagentStatusLineView | undefined): ThemeColor {
  return (subagents?.attention ?? 0) > 0 ? "error" : "accent";
}

function todoColor(todo: TodoStatusLineView | undefined): ThemeColor {
  return todo?.current === undefined ? "success" : "warning";
}

function contextText(context: ContextStatusLineView): string {
  const percent = context.percent === null ? "?" : context.percent.toFixed(1);
  return ` ${percent}%/${formatTokens(context.contextWindow)} 󰁨`;
}

function todoText(todo: TodoStatusLineView, maximum: number): string {
  const current = todo.current === undefined ? "all closed" : sanitize(todo.current);
  return compact(` ${String(todo.closed)}/${String(todo.total)} · ${current}`, maximum);
}

function countSuffix(symbol: string, count: number | undefined): string | undefined {
  return count === undefined || count <= 0 ? undefined : `${symbol}${String(count)}`;
}

function present(value: string | undefined): value is string {
  return value !== undefined;
}

function branchText(view: StatusLineView): string | undefined {
  if (view.branch === undefined) return undefined;
  const details = view.gitDetails;
  const suffixes = [
    countSuffix("↑", details?.ahead),
    countSuffix("↓", details?.behind),
    countSuffix("+", details?.staged),
    countSuffix("~", details?.changed),
    countSuffix("!", details?.conflicts),
  ].filter(present);
  return [view.branch, ...suffixes].join(" ");
}

function identitySegments(view: StatusLineView, options: RenderOptions): Segment[] {
  const result: Segment[] = [];
  if (options.includeModel && view.model !== undefined) {
    result.push({ text: ` ${compact(view.model, options.modelLimit)}`, tone: "model" });
  }
  if (options.includeEffort && view.effort !== undefined) {
    result.push({ text: `think:${compact(view.effort, 12)}`, tone: "effort" });
  }
  result.push({
    text: ` ${compact(basename(view.cwd) || view.cwd, options.cwdLimit)}`,
    tone: "path",
  });
  const branch = branchText(view);
  if (options.includeBranch && branch !== undefined) {
    result.push({ text: ` ${compact(branch, options.branchLimit)}`, tone: "branch" });
  }
  return result;
}

function contextSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  return options.includeContext && view.context !== undefined
    ? { text: contextText(view.context), tone: "context" }
    : undefined;
}

function accountLimitSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  if (!options.includeAccountLimit || view.accountLimits === undefined) return undefined;
  const values = view.accountLimits.map((limit) => {
    const label = sanitize(limit.label).replace(/\s+limit$/iu, "");
    return `${label} ${String(Math.round(limit.remainingPercent))}%`;
  });
  const visible: string[] = [];
  for (const value of values) {
    const candidate = `limits ${[...visible, value].join(" · ")}`;
    if (visibleWidth(candidate) > options.accountLimitLimit) break;
    visible.push(value);
  }
  if (visible.length > 0) {
    return { text: `limits ${visible.join(" · ")}`, tone: "accountLimit" };
  }
  const first = view.accountLimits[0];
  return first === undefined
    ? undefined
    : { text: `limit ${String(Math.round(first.remainingPercent))}%`, tone: "accountLimit" };
}

function subagentSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  const fleet = view.subagents;
  if (!options.includeSubagents || fleet === undefined || fleet.active <= 0) return undefined;
  const attention = fleet.attention > 0 ? ` !${String(fleet.attention)}` : "";
  return { text: ` ${String(fleet.active)}${attention}`, tone: "subagents" };
}

function todoSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  const todo = view.todo;
  return options.includeTodo && todo !== undefined && todo.total > 0
    ? { text: todoText(todo, options.todoLimit), tone: "todo" }
    : undefined;
}

function extensionSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  if (!options.includeExtensions) return undefined;
  const text = view.extensionStatuses.map(sanitize).filter(Boolean).join(" · ");
  return text === ""
    ? undefined
    : { text: compact(text, options.extensionLimit), tone: "extension" };
}

function definedSegment(segment: Segment | undefined): segment is Segment {
  return segment !== undefined;
}

function stateSegments(view: StatusLineView, options: RenderOptions): Segment[] {
  return [
    contextSegment(view, options),
    accountLimitSegment(view, options),
    subagentSegment(view, options),
    todoSegment(view, options),
    extensionSegment(view, options),
  ].filter(definedSegment);
}

function segments(view: StatusLineView, options: RenderOptions): Segment[] {
  return [...identitySegments(view, options), ...stateSegments(view, options)];
}

function buildLine(view: StatusLineView, options: RenderOptions, theme: StatusLineTheme): string {
  const parts = segments(view, options).map((segment) => colorSegment(segment, view, theme));
  if (parts.length === 0) return "";
  const separator = theme.fg("dim", THIN_SEPARATOR);
  return ` ${parts.join(` ${separator}${RESET} `)}${RESET} `;
}

export function renderStatusLine(
  view: StatusLineView,
  width: number,
  theme: StatusLineTheme = PLAIN_THEME,
): string {
  if (width <= 0) return "";
  const variants = [
    {
      accountLimitLimit: 120,
      branchLimit: 60,
      cwdLimit: 40,
      extensionLimit: 36,
      includeAccountLimit: true,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: true,
      includeModel: true,
      includeSubagents: true,
      includeTodo: true,
      modelLimit: 28,
      todoLimit: 52,
    },
    {
      accountLimitLimit: 80,
      branchLimit: 36,
      cwdLimit: 28,
      extensionLimit: 0,
      includeAccountLimit: true,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeSubagents: true,
      includeTodo: true,
      modelLimit: 22,
      todoLimit: 30,
    },
    {
      accountLimitLimit: 60,
      branchLimit: 28,
      cwdLimit: 20,
      extensionLimit: 0,
      includeAccountLimit: true,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeSubagents: true,
      includeTodo: true,
      modelLimit: 18,
      todoLimit: 18,
    },
    {
      accountLimitLimit: 48,
      branchLimit: 18,
      cwdLimit: 16,
      extensionLimit: 0,
      includeAccountLimit: true,
      includeBranch: true,
      includeContext: false,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeSubagents: true,
      includeTodo: false,
      modelLimit: 16,
      todoLimit: 0,
    },
    {
      accountLimitLimit: 40,
      branchLimit: 14,
      cwdLimit: 8,
      extensionLimit: 0,
      includeAccountLimit: true,
      includeBranch: false,
      includeContext: false,
      includeEffort: false,
      includeExtensions: false,
      includeModel: false,
      includeSubagents: false,
      includeTodo: false,
      modelLimit: 0,
      todoLimit: 0,
    },
    {
      accountLimitLimit: 24,
      branchLimit: 14,
      cwdLimit: 8,
      extensionLimit: 0,
      includeAccountLimit: true,
      includeBranch: false,
      includeContext: false,
      includeEffort: false,
      includeExtensions: false,
      includeModel: false,
      includeSubagents: false,
      includeTodo: false,
      modelLimit: 0,
      todoLimit: 0,
    },
  ] as const satisfies readonly RenderOptions[];

  for (const variant of variants) {
    const line = buildLine(view, variant, theme);
    if (visibleWidth(line) <= width) return line;
  }

  return `${truncateToWidth(buildLine(view, variants.at(-1) ?? variants[0], theme), width, "")}${RESET}`;
}
