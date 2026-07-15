import { basename } from "node:path";

import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import type { GitState } from "./git.ts";
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

export interface StatusLineView {
  readonly branch?: string;
  readonly context?: ContextStatusLineView;
  readonly cwd: string;
  readonly effort?: string;
  readonly extensionStatuses: readonly string[];
  readonly gitState: GitState;
  readonly model?: string;
  readonly todo?: TodoStatusLineView;
  readonly tokens?: number;
}

interface Segment {
  readonly text: string;
  readonly tone:
    "branch" | "context" | "effort" | "extension" | "model" | "path" | "todo" | "tokens";
}

interface RenderOptions {
  readonly branchLimit: number;
  readonly cwdLimit: number;
  readonly extensionLimit: number;
  readonly includeBranch: boolean;
  readonly includeContext: boolean;
  readonly includeEffort: boolean;
  readonly includeExtensions: boolean;
  readonly includeModel: boolean;
  readonly includeTodo: boolean;
  readonly includeTokens: boolean;
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

function colorSegment(segment: Segment, view: StatusLineView, theme: StatusLineTheme): string {
  switch (segment.tone) {
    case "model":
      return rgb("#d787af", segment.text);
    case "effort":
      return theme.fg(effortColor(view.effort ?? "off"), segment.text);
    case "path":
      return rgb("#00afaf", segment.text);
    case "branch":
      return theme.fg(
        view.gitState === "conflicted"
          ? "error"
          : view.gitState === "clean"
            ? "success"
            : "warning",
        segment.text,
      );
    case "context":
      return theme.fg(
        contextColor(view.context ?? { contextWindow: 0, percent: null }),
        segment.text,
      );
    case "tokens":
      return theme.fg("muted", segment.text);
    case "todo":
      return theme.fg(view.todo?.current === undefined ? "success" : "warning", segment.text);
    case "extension":
      return theme.fg("muted", segment.text);
  }
}

function contextText(context: ContextStatusLineView): string {
  const percent = context.percent === null ? "?" : context.percent.toFixed(1);
  return ` ${percent}%/${formatTokens(context.contextWindow)} 󰁨`;
}

function todoText(todo: TodoStatusLineView, maximum: number): string {
  const current = todo.current === undefined ? "all closed" : sanitize(todo.current);
  return compact(` ${String(todo.closed)}/${String(todo.total)} · ${current}`, maximum);
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
  if (options.includeBranch && view.branch !== undefined) {
    result.push({ text: ` ${compact(view.branch, options.branchLimit)}`, tone: "branch" });
  }
  return result;
}

function stateSegments(view: StatusLineView, options: RenderOptions): Segment[] {
  const result: Segment[] = [];
  if (options.includeContext && view.context !== undefined) {
    result.push({ text: contextText(view.context), tone: "context" });
  }
  if (options.includeTokens && view.tokens !== undefined && view.tokens > 0) {
    result.push({ text: `  ${formatTokens(view.tokens)}`, tone: "tokens" });
  }
  if (options.includeTodo && view.todo !== undefined && view.todo.total > 0) {
    result.push({ text: todoText(view.todo, options.todoLimit), tone: "todo" });
  }
  const extensionText = view.extensionStatuses.map(sanitize).filter(Boolean).join(" · ");
  if (options.includeExtensions && extensionText !== "") {
    result.push({ text: compact(extensionText, options.extensionLimit), tone: "extension" });
  }
  return result;
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
      branchLimit: 32,
      cwdLimit: 40,
      extensionLimit: 36,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: true,
      includeModel: true,
      includeTodo: true,
      includeTokens: true,
      modelLimit: 28,
      todoLimit: 52,
    },
    {
      branchLimit: 28,
      cwdLimit: 28,
      extensionLimit: 0,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeTodo: true,
      includeTokens: true,
      modelLimit: 22,
      todoLimit: 30,
    },
    {
      branchLimit: 22,
      cwdLimit: 20,
      extensionLimit: 0,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeTodo: true,
      includeTokens: false,
      modelLimit: 18,
      todoLimit: 18,
    },
    {
      branchLimit: 18,
      cwdLimit: 16,
      extensionLimit: 0,
      includeBranch: true,
      includeContext: false,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeTodo: false,
      includeTokens: false,
      modelLimit: 16,
      todoLimit: 0,
    },
    {
      branchLimit: 14,
      cwdLimit: 12,
      extensionLimit: 0,
      includeBranch: true,
      includeContext: false,
      includeEffort: false,
      includeExtensions: false,
      includeModel: false,
      includeTodo: false,
      includeTokens: false,
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
