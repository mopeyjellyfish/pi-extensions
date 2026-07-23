import { parseGitStatus, type GitStatusDetails, type ParsedGitStatus } from "./git.ts";
import {
  renderStatusLine,
  type ContextStatusLineView,
  type StatusLineView,
  type SubagentStatusLineView,
  type TodoStatusLineView,
  type WorkflowStatusLineView,
} from "./powerline.ts";

import type {
  ExtensionAPI,
  ExtensionContext,
  ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";

const WORKTREE_ROUTE_EVENT = "mopeyjellyfish:pi-worktrunk:route:v1";
const TODO_SUMMARY_EVENT = "mopeyjellyfish:pi-todo:summary:v1";
const WORKFLOW_SUMMARY_EVENT = "mopeyjellyfish:pi-development-workflow:summary:v1";
const WORKFLOW_STATUS_KEY = "mopeyjellyfish-pi-development-workflow";
const WORKTREE_STATUS_KEY = "mopeyjellyfish-pi-worktrunk";
const TODO_STATUS_KEY = "mopeyjellyfish-pi-todo";
const SUBAGENT_STATUS_KEYS = new Set(["subagent-slash", "subagent-slash-text"]);
const SUBAGENT_RPC_REQUEST_EVENT = "subagents:rpc:v1:request";
const SUBAGENT_RPC_READY_EVENT = "subagents:rpc:v1:ready";
const SUBAGENT_RPC_REPLY_PREFIX = "subagents:rpc:v1:reply:";
const SUBAGENT_ASYNC_STARTED_EVENT = "subagent:async-started";
const SUBAGENT_ASYNC_COMPLETE_EVENT = "subagent:async-complete";
const SUBAGENT_CONTROL_EVENT = "subagent:control-event";
const GIT_ARGUMENTS = ["status", "--porcelain=v2", "--branch", "--untracked-files=no"] as const;
const GIT_REFRESH_TOOLS = new Set(["bash", "edit", "worktree", "write"]);

interface WorktreeRouteEventV1 {
  readonly activePath: string;
  readonly branch?: string;
  readonly head?: string;
  readonly version: 1;
}

interface GitSnapshot extends ParsedGitStatus {
  readonly cwd: string;
}

interface TodoSummaryEventV1 {
  readonly closed: number;
  readonly current?: {
    readonly status: "in_progress" | "pending";
    readonly text: string;
  };
  readonly total: number;
  readonly version: 1;
}

interface WorkflowSummaryEventV1 {
  readonly activeSlice?: string;
  readonly backstop: "not_started" | "active" | "attention" | "expired";
  readonly attention?: string;
  readonly phase: "discover" | "pitch" | "plan" | "build" | "review" | "ship";
  readonly status: "active" | "paused" | "blocked" | "abandoned" | "completed";
  readonly title: string;
  readonly version: 1;
  readonly workflowId: string;
}

interface SessionTotals {
  readonly costUsd?: number;
  readonly tokens?: number;
}

interface SubagentRpcReplyV1 {
  readonly data: { readonly text: string };
  readonly method?: "status";
  readonly requestId: string;
  readonly success: true;
  readonly version: 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function worktreeRoute(value: unknown): WorktreeRouteEventV1 | undefined {
  if (
    !isRecord(value) ||
    value["version"] !== 1 ||
    typeof value["activePath"] !== "string" ||
    value["activePath"].trim() === "" ||
    !optionalString(value["branch"]) ||
    !optionalString(value["head"])
  ) {
    return undefined;
  }
  return {
    activePath: value["activePath"],
    ...(value["branch"] === undefined ? {} : { branch: value["branch"] }),
    ...(value["head"] === undefined ? {} : { head: value["head"] }),
    version: 1,
  };
}

function todoSummary(value: unknown): TodoSummaryEventV1 | undefined {
  if (
    !isRecord(value) ||
    value["version"] !== 1 ||
    !Number.isInteger(value["closed"]) ||
    !Number.isInteger(value["total"])
  ) {
    return undefined;
  }
  const closed = value["closed"] as number;
  const total = value["total"] as number;
  if (closed < 0 || total <= 0 || closed > total) return undefined;
  const currentValue = value["current"];
  if (
    currentValue !== undefined &&
    (!isRecord(currentValue) ||
      (currentValue["status"] !== "in_progress" && currentValue["status"] !== "pending") ||
      typeof currentValue["text"] !== "string" ||
      currentValue["text"].trim() === "")
  ) {
    return undefined;
  }
  return {
    closed,
    ...(isRecord(currentValue)
      ? {
          current: {
            status: currentValue["status"] as "in_progress" | "pending",
            text: currentValue["text"] as string,
          },
        }
      : {}),
    total,
    version: 1,
  };
}

const WORKFLOW_PHASES = new Set(["discover", "pitch", "plan", "build", "review", "ship"]);
const WORKFLOW_STATUSES = new Set(["active", "paused", "blocked", "abandoned", "completed"]);
const BACKSTOP_STATES = new Set(["not_started", "active", "attention", "expired"]);

function optionalNonemptyString(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && value.trim() !== "");
}

function validWorkflowIdentity(value: Record<string, unknown>): boolean {
  return (
    typeof value["title"] === "string" &&
    value["title"].trim() !== "" &&
    typeof value["workflowId"] === "string" &&
    value["workflowId"].trim() !== ""
  );
}

function validWorkflowState(value: Record<string, unknown>): boolean {
  return (
    WORKFLOW_PHASES.has(String(value["phase"])) &&
    WORKFLOW_STATUSES.has(String(value["status"])) &&
    BACKSTOP_STATES.has(String(value["backstop"])) &&
    optionalNonemptyString(value["activeSlice"]) &&
    optionalNonemptyString(value["attention"])
  );
}

function workflowSummary(value: unknown): WorkflowSummaryEventV1 | undefined {
  if (
    !isRecord(value) ||
    value["version"] !== 1 ||
    !validWorkflowIdentity(value) ||
    !validWorkflowState(value)
  )
    return undefined;
  return value as unknown as WorkflowSummaryEventV1;
}

function finiteNonnegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function sessionTotals(ctx: ExtensionContext): SessionTotals {
  let costUsd = 0;
  let tokens = 0;
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message" || entry.message.role !== "assistant") continue;
    tokens +=
      finiteNonnegative(entry.message.usage.input) +
      finiteNonnegative(entry.message.usage.output) +
      finiteNonnegative(entry.message.usage.cacheRead) +
      finiteNonnegative(entry.message.usage.cacheWrite);
    costUsd += finiteNonnegative(entry.message.usage.cost.total);
  }
  return {
    ...(costUsd > 0 ? { costUsd } : {}),
    ...(tokens > 0 ? { tokens } : {}),
  };
}

function subagentRpcReply(value: unknown, requestId: string): SubagentRpcReplyV1 | undefined {
  if (
    !isRecord(value) ||
    value["version"] !== 1 ||
    value["success"] !== true ||
    value["requestId"] !== requestId ||
    (value["method"] !== undefined && value["method"] !== "status") ||
    !isRecord(value["data"]) ||
    typeof value["data"]["text"] !== "string"
  ) {
    return undefined;
  }
  return value as unknown as SubagentRpcReplyV1;
}

function subagentStatus(text: string): SubagentStatusLineView | null | undefined {
  if (/^No active async runs\.$/mu.test(text.trim())) return null;
  const match = /^Active async runs: (\d+)$/mu.exec(text);
  if (match === null) return undefined;
  const active = Number(match[1]);
  if (!Number.isSafeInteger(active) || active <= 0) return undefined;
  const attention = Math.min(
    active,
    text.split("\n").filter((line) => /needs[_ ]attention/iu.test(line)).length,
  );
  return { active, attention };
}

function contextStatus(ctx: ExtensionContext): ContextStatusLineView | undefined {
  const usage = ctx.getContextUsage();
  return usage === undefined
    ? undefined
    : { contextWindow: usage.contextWindow, percent: usage.percent };
}

function modelText(ctx: ExtensionContext): string | undefined {
  return ctx.model?.name ?? ctx.model?.id;
}

function effortText(pi: ExtensionAPI, ctx: ExtensionContext): string | undefined {
  return ctx.model?.reasoning === true ? pi.getThinkingLevel() : undefined;
}

function extensionStatusValues(
  statuses: ReadonlyMap<string, string>,
  routeActive: boolean,
  todoActive: boolean,
  subagentsActive: boolean,
  workflowActive: boolean,
): string[] {
  return [...statuses]
    .filter(([key]) => key !== WORKTREE_STATUS_KEY || !routeActive)
    .filter(([key]) => key !== TODO_STATUS_KEY || !todoActive)
    .filter(([key]) => key !== WORKFLOW_STATUS_KEY || !workflowActive)
    .filter(([key]) => !subagentsActive || !SUBAGENT_STATUS_KEYS.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}

function todoStatusLineView(
  summary: TodoSummaryEventV1 | undefined,
): TodoStatusLineView | undefined {
  if (summary === undefined) return undefined;
  return {
    closed: summary.closed,
    ...(summary.current === undefined ? {} : { current: summary.current.text }),
    total: summary.total,
  };
}

function workflowAttention(summary: WorkflowSummaryEventV1): WorkflowStatusLineView["attention"] {
  if (summary.status === "blocked") return "blocked";
  if (summary.status === "paused") return "paused";
  if (summary.status === "completed") return "completed";
  if (summary.status === "abandoned") return "abandoned";
  if (summary.attention === "ready_to_ship") return "ready";
  return summary.attention === undefined ? undefined : "attention";
}

function workflowStatusLineView(
  summary: WorkflowSummaryEventV1 | undefined,
): WorkflowStatusLineView | undefined {
  if (summary === undefined) return undefined;
  const attention = workflowAttention(summary);
  return {
    ...(summary.activeSlice === undefined ? {} : { activeSlice: summary.activeSlice }),
    backstop: summary.backstop,
    ...(attention === undefined ? {} : { attention }),
    phase: summary.phase,
  };
}

function detachedBranch(head: string | undefined): string {
  return head === undefined || head.trim() === "" ? "detached" : `detached@${head.slice(0, 7)}`;
}

function branchLabel(
  git: GitSnapshot | undefined,
  route: WorktreeRouteEventV1 | undefined,
  fallback: string | null | undefined,
): string | undefined {
  if (git !== undefined) return git.branch ?? detachedBranch(git.head ?? route?.head);
  if (route?.branch !== undefined) return route.branch;
  if (route?.head !== undefined) return detachedBranch(route.head);
  return fallback ?? undefined;
}

function optionalViewDetails(
  branch: string | undefined,
  context: ContextStatusLineView | undefined,
  effort: string | undefined,
  gitDetails: GitStatusDetails | undefined,
  model: string | undefined,
  subagents: SubagentStatusLineView | undefined,
  todo: TodoStatusLineView | undefined,
  totals: SessionTotals,
  workflow: WorkflowStatusLineView | undefined,
): Partial<StatusLineView> {
  return {
    ...(branch === undefined ? {} : { branch }),
    ...(context === undefined ? {} : { context }),
    ...(effort === undefined ? {} : { effort }),
    ...(gitDetails === undefined ? {} : { gitDetails }),
    ...(model === undefined ? {} : { model }),
    ...(subagents === undefined ? {} : { subagents }),
    ...(todo === undefined ? {} : { todo }),
    ...(workflow === undefined ? {} : { workflow }),
    ...totals,
  };
}

export default function statusLineExtension(pi: ExtensionAPI): void {
  let route: WorktreeRouteEventV1 | undefined;
  let subagents: SubagentStatusLineView | undefined;
  let todo: TodoSummaryEventV1 | undefined;
  let workflow: WorkflowSummaryEventV1 | undefined;
  let ctx: ExtensionContext | undefined;
  let footerData: ReadonlyFooterDataProvider | undefined;
  let git: GitSnapshot | undefined;
  let requestRender: (() => void) | undefined;
  let refreshGeneration = 0;
  let sessionGeneration = 0;
  let subagentRequestSequence = 0;
  const refreshTimers = new Set<ReturnType<typeof setTimeout>>();
  const subagentRequestCleanups = new Set<() => void>();

  const effectiveCwd = (): string | undefined => route?.activePath ?? ctx?.cwd;

  const requestSubagentStatus = (): void => {
    const currentContext = ctx;
    if (currentContext?.mode !== "tui") return;
    for (const cleanup of subagentRequestCleanups) cleanup();
    const generation = sessionGeneration;
    const requestId = `pi-status-line-${String(Date.now())}-${String(++subagentRequestSequence)}`;
    const replyEvent = `${SUBAGENT_RPC_REPLY_PREFIX}${requestId}`;
    const unsubscribe = pi.events.on(replyEvent, (value) => {
      const reply = subagentRpcReply(value, requestId);
      if (reply === undefined) return;
      cleanup();
      if (generation !== sessionGeneration) return;
      const next = subagentStatus(reply.data.text);
      if (next === undefined) return;
      subagents = next ?? undefined;
      requestRender?.();
    });
    const timer = setTimeout(cleanup, 1500);
    function cleanup(): void {
      clearTimeout(timer);
      unsubscribe();
      subagentRequestCleanups.delete(cleanup);
    }
    subagentRequestCleanups.add(cleanup);
    timer.unref();
    pi.events.emit(SUBAGENT_RPC_REQUEST_EVENT, {
      method: "status",
      params: {},
      requestId,
      source: { extension: "@mopeyjellyfish/pi-status-line" },
      version: 1,
    });
  };

  const refreshGit = async (): Promise<void> => {
    const currentContext = ctx;
    const cwd = effectiveCwd();
    if (currentContext?.mode !== "tui" || cwd === undefined) return;
    const generation = ++refreshGeneration;
    try {
      const result = await pi.exec("git", [...GIT_ARGUMENTS], { cwd, timeout: 2000 });
      if (generation !== refreshGeneration || result.code !== 0) return;
      git = { ...parseGitStatus(result.stdout), cwd };
      requestRender?.();
    } catch {
      // Git status is optional; retain the last valid snapshot.
    }
  };

  const unsubscribeRoute = pi.events.on(WORKTREE_ROUTE_EVENT, (value) => {
    if (value === undefined) {
      route = undefined;
    } else {
      const next = worktreeRoute(value);
      if (next === undefined) return;
      route = next;
    }
    git = undefined;
    requestRender?.();
    void refreshGit();
  });

  const unsubscribeTodo = pi.events.on(TODO_SUMMARY_EVENT, (value) => {
    if (value === undefined) {
      todo = undefined;
    } else {
      const next = todoSummary(value);
      if (next === undefined) return;
      todo = next;
    }
    requestRender?.();
  });

  const unsubscribeWorkflow = pi.events.on(WORKFLOW_SUMMARY_EVENT, (value) => {
    if (value === undefined) {
      workflow = undefined;
    } else {
      const next = workflowSummary(value);
      if (next === undefined) return;
      workflow = next;
    }
    requestRender?.();
  });

  const unsubscribeSubagentReady = pi.events.on(SUBAGENT_RPC_READY_EVENT, (value) => {
    if (!isRecord(value) || value["version"] !== 1) return;
    requestSubagentStatus();
  });
  const unsubscribeSubagentStarted = pi.events.on(SUBAGENT_ASYNC_STARTED_EVENT, () => {
    requestSubagentStatus();
  });
  const unsubscribeSubagentComplete = pi.events.on(SUBAGENT_ASYNC_COMPLETE_EVENT, () => {
    requestSubagentStatus();
  });
  const unsubscribeSubagentControl = pi.events.on(SUBAGENT_CONTROL_EVENT, () => {
    requestSubagentStatus();
  });

  const buildView = (): StatusLineView | undefined => {
    const currentContext = ctx;
    const gitCwd = effectiveCwd();
    if (currentContext === undefined || gitCwd === undefined) return undefined;
    const statuses = footerData?.getExtensionStatuses() ?? new Map<string, string>();
    const extensionStatuses = extensionStatusValues(
      statuses,
      route !== undefined,
      todo !== undefined,
      subagents !== undefined,
      workflow !== undefined,
    );
    const todoView = todoStatusLineView(todo);
    const workflowView = workflowStatusLineView(workflow);
    const currentGit = git?.cwd === gitCwd ? git : undefined;
    const branch = branchLabel(currentGit, route, footerData?.getGitBranch());
    const context = contextStatus(currentContext);
    const effort = effortText(pi, currentContext);
    const model = modelText(currentContext);
    const totals = sessionTotals(currentContext);
    return {
      ...optionalViewDetails(
        branch,
        context,
        effort,
        currentGit,
        model,
        subagents,
        todoView,
        totals,
        workflowView,
      ),
      cwd: currentContext.cwd,
      extensionStatuses,
      gitState: currentGit?.state ?? "clean",
    };
  };

  pi.on("session_start", async (_event, currentContext) => {
    sessionGeneration += 1;
    for (const cleanup of subagentRequestCleanups) cleanup();
    subagents = undefined;
    ctx = currentContext;
    if (currentContext.mode !== "tui") return;
    currentContext.ui.setFooter((tui, theme, provider) => {
      footerData = provider;
      requestRender = () => {
        tui.requestRender();
      };
      const unsubscribeBranch = provider.onBranchChange(() => {
        git = undefined;
        void refreshGit();
      });
      return {
        dispose() {
          unsubscribeBranch();
          if (footerData === provider) footerData = undefined;
          requestRender = undefined;
        },
        invalidate() {
          requestRender?.();
        },
        render(width: number): string[] {
          const view = buildView();
          return view === undefined ? [] : [renderStatusLine(view, width, theme)];
        },
      };
    });
    requestSubagentStatus();
    await refreshGit();
  });

  pi.on("tool_result", (event, currentContext) => {
    if (!GIT_REFRESH_TOOLS.has(event.toolName)) return;
    ctx = currentContext;
    void refreshGit();
  });

  pi.on("user_bash", (_event, currentContext) => {
    ctx = currentContext;
    if (currentContext.mode !== "tui") return;
    for (const delay of [100, 500, 1000]) {
      const timer = setTimeout(() => {
        refreshTimers.delete(timer);
        void refreshGit();
      }, delay);
      refreshTimers.add(timer);
    }
  });

  pi.on("session_tree", (_event, currentContext) => {
    ctx = currentContext;
    requestRender?.();
    requestSubagentStatus();
  });

  pi.on("session_shutdown", (_event, currentContext) => {
    refreshGeneration += 1;
    sessionGeneration += 1;
    for (const timer of refreshTimers) clearTimeout(timer);
    refreshTimers.clear();
    for (const cleanup of subagentRequestCleanups) cleanup();
    unsubscribeRoute();
    unsubscribeTodo();
    unsubscribeWorkflow();
    unsubscribeSubagentReady();
    unsubscribeSubagentStarted();
    unsubscribeSubagentComplete();
    unsubscribeSubagentControl();
    subagents = undefined;
    workflow = undefined;
    ctx = undefined;
    footerData = undefined;
    requestRender = undefined;
    if (currentContext.mode === "tui") currentContext.ui.setFooter(undefined);
  });
}
