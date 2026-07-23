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

export interface WorkflowStatusLineView {
  readonly activeSlice?: string;
  readonly backstop: "not_started" | "active" | "attention" | "expired";
  readonly attention?: "abandoned" | "attention" | "blocked" | "completed" | "paused" | "ready";
  readonly phase: "discover" | "pitch" | "plan" | "build" | "review" | "ship";
}

export interface StatusLineView {
  readonly branch?: string;
  readonly context?: ContextStatusLineView;
  readonly costUsd?: number;
  readonly cwd: string;
  readonly effort?: string;
  readonly extensionStatuses: readonly string[];
  readonly gitDetails?: GitStatusDetails;
  readonly gitState: GitState;
  readonly model?: string;
  readonly subagents?: SubagentStatusLineView;
  readonly todo?: TodoStatusLineView;
  readonly tokens?: number;
  readonly workflow?: WorkflowStatusLineView;
}

interface Segment {
  readonly text: string;
  readonly tone:
    | "branch"
    | "context"
    | "effort"
    | "extension"
    | "model"
    | "path"
    | "subagents"
    | "todo"
    | "tokens"
    | "workflow";
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
  readonly includeSubagents: boolean;
  readonly includeTodo: boolean;
  readonly includeTokens: boolean;
  readonly includeWorkflow: boolean;
  readonly modelLimit: number;
  readonly todoLimit: number;
  readonly workflowLimit: number;
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

function formatCost(costUsd: number): string {
  if (costUsd < 0.01) return `$${costUsd.toFixed(3)}`;
  if (costUsd < 10) return `$${costUsd.toFixed(2)}`;
  if (costUsd < 100) return `$${costUsd.toFixed(1)}`;
  return `$${String(Math.round(costUsd))}`;
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
    case "tokens":
    case "extension":
      return theme.fg("muted", segment.text);
    case "subagents":
      return theme.fg(subagentColor(view.subagents), segment.text);
    case "todo":
      return theme.fg(todoColor(view.todo), segment.text);
    case "workflow":
      return theme.fg(workflowColor(view.workflow), segment.text);
  }
}

function subagentColor(subagents: SubagentStatusLineView | undefined): ThemeColor {
  return (subagents?.attention ?? 0) > 0 ? "error" : "accent";
}

function todoColor(todo: TodoStatusLineView | undefined): ThemeColor {
  return todo?.current === undefined ? "success" : "warning";
}

function backstopWarning(workflow: WorkflowStatusLineView | undefined): boolean {
  return (
    workflow?.phase === "build" &&
    (workflow.backstop === "attention" || workflow.backstop === "expired")
  );
}

function workflowAttentionColor(
  attention: WorkflowStatusLineView["attention"],
): ThemeColor | undefined {
  if (attention === "completed" || attention === "ready") return "success";
  if (attention === "abandoned") return "muted";
  if (attention === "blocked" || attention === "attention") return "warning";
  return undefined;
}

function workflowColor(workflow: WorkflowStatusLineView | undefined): ThemeColor {
  const attentionColor = workflowAttentionColor(workflow?.attention);
  if (attentionColor !== undefined) return attentionColor;
  if (workflow?.backstop === "expired" && backstopWarning(workflow)) return "error";
  if (workflow?.backstop === "attention" && backstopWarning(workflow)) return "warning";
  return "accent";
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

function usageText(view: StatusLineView): string | undefined {
  const values: string[] = [];
  if (view.tokens !== undefined && view.tokens > 0) values.push(`  ${formatTokens(view.tokens)}`);
  if (view.costUsd !== undefined && view.costUsd > 0) values.push(formatCost(view.costUsd));
  return values.length === 0 ? undefined : values.join(" · ");
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

function usageSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  const text = usageText(view);
  return options.includeTokens && text !== undefined ? { text, tone: "tokens" } : undefined;
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

function workflowSegment(view: StatusLineView, options: RenderOptions): Segment | undefined {
  const workflow = view.workflow;
  if (!options.includeWorkflow || workflow === undefined) return undefined;
  const slice = workflow.activeSlice === undefined ? "" : ` · ${sanitize(workflow.activeSlice)}`;
  const backstop = backstopWarning(workflow) ? " · backstop!" : "";
  const attention =
    workflow.attention === undefined || (workflow.attention === "attention" && backstop !== "")
      ? ""
      : ` · ${workflow.attention}`;
  return {
    text: compact(`flow ${workflow.phase}${slice}${backstop}${attention}`, options.workflowLimit),
    tone: "workflow",
  };
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
    usageSegment(view, options),
    subagentSegment(view, options),
    workflowSegment(view, options),
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
      branchLimit: 60,
      cwdLimit: 40,
      extensionLimit: 36,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: true,
      includeModel: true,
      includeSubagents: true,
      includeTodo: true,
      includeTokens: true,
      includeWorkflow: true,
      modelLimit: 28,
      todoLimit: 52,
      workflowLimit: 44,
    },
    {
      branchLimit: 36,
      cwdLimit: 28,
      extensionLimit: 0,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeSubagents: true,
      includeTodo: true,
      includeTokens: true,
      includeWorkflow: true,
      modelLimit: 22,
      todoLimit: 30,
      workflowLimit: 30,
    },
    {
      branchLimit: 28,
      cwdLimit: 20,
      extensionLimit: 0,
      includeBranch: true,
      includeContext: true,
      includeEffort: true,
      includeExtensions: false,
      includeModel: true,
      includeSubagents: true,
      includeTodo: true,
      includeTokens: false,
      includeWorkflow: true,
      modelLimit: 18,
      todoLimit: 18,
      workflowLimit: 22,
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
      includeSubagents: true,
      includeTodo: false,
      includeTokens: false,
      includeWorkflow: false,
      modelLimit: 16,
      todoLimit: 0,
      workflowLimit: 0,
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
      includeSubagents: false,
      includeTodo: false,
      includeTokens: false,
      includeWorkflow: false,
      modelLimit: 0,
      todoLimit: 0,
      workflowLimit: 0,
    },
  ] as const satisfies readonly RenderOptions[];

  for (const variant of variants) {
    const line = buildLine(view, variant, theme);
    if (visibleWidth(line) <= width) return line;
  }

  return `${truncateToWidth(buildLine(view, variants.at(-1) ?? variants[0], theme), width, "")}${RESET}`;
}
