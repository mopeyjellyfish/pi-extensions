import { parseGitStatus, type ParsedGitStatus } from "./git.ts";
import {
  renderStatusLine,
  type ContextStatusLineView,
  type StatusLineView,
  type TodoStatusLineView,
} from "./powerline.ts";

import type {
  ExtensionAPI,
  ExtensionContext,
  ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";

const WORKTREE_ROUTE_EVENT = "mopeyjellyfish:pi-worktrunk:route:v1";
const TODO_SUMMARY_EVENT = "mopeyjellyfish:pi-todo:summary:v1";
const WORKTREE_STATUS_KEY = "mopeyjellyfish-pi-worktrunk";
const TODO_STATUS_KEY = "mopeyjellyfish-pi-todo";
const GIT_ARGUMENTS = ["status", "--porcelain=v1", "--branch", "--untracked-files=no"] as const;
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

function tokenTotal(ctx: ExtensionContext): number | undefined {
  let total = 0;
  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type !== "message" || entry.message.role !== "assistant") continue;
    total +=
      entry.message.usage.input +
      entry.message.usage.output +
      entry.message.usage.cacheRead +
      entry.message.usage.cacheWrite;
  }
  return total === 0 ? undefined : total;
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
): string[] {
  return [...statuses]
    .filter(([key]) => key !== WORKTREE_STATUS_KEY || !routeActive)
    .filter(([key]) => key !== TODO_STATUS_KEY || !todoActive)
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

function optionalViewDetails(
  branch: string | undefined,
  context: ContextStatusLineView | undefined,
  effort: string | undefined,
  model: string | undefined,
  todo: TodoStatusLineView | undefined,
  tokens: number | undefined,
): Partial<StatusLineView> {
  return {
    ...(branch === undefined ? {} : { branch }),
    ...(context === undefined ? {} : { context }),
    ...(effort === undefined ? {} : { effort }),
    ...(model === undefined ? {} : { model }),
    ...(todo === undefined ? {} : { todo }),
    ...(tokens === undefined ? {} : { tokens }),
  };
}

export default function statusLineExtension(pi: ExtensionAPI): void {
  let route: WorktreeRouteEventV1 | undefined;
  let todo: TodoSummaryEventV1 | undefined;
  let ctx: ExtensionContext | undefined;
  let footerData: ReadonlyFooterDataProvider | undefined;
  let git: GitSnapshot | undefined;
  let requestRender: (() => void) | undefined;
  let refreshGeneration = 0;
  const refreshTimers = new Set<ReturnType<typeof setTimeout>>();

  const effectiveCwd = (): string | undefined => route?.activePath ?? ctx?.cwd;

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

  const buildView = (): StatusLineView | undefined => {
    const currentContext = ctx;
    const gitCwd = effectiveCwd();
    if (currentContext === undefined || gitCwd === undefined) return undefined;
    const statuses = footerData?.getExtensionStatuses() ?? new Map<string, string>();
    const extensionStatuses = extensionStatusValues(
      statuses,
      route !== undefined,
      todo !== undefined,
    );
    const todoView = todoStatusLineView(todo);
    const currentGit = git?.cwd === gitCwd ? git : undefined;
    const branch =
      currentGit === undefined
        ? (route?.branch ?? footerData?.getGitBranch() ?? undefined)
        : (currentGit.branch ?? "detached");
    const context = contextStatus(currentContext);
    const effort = effortText(pi, currentContext);
    const model = modelText(currentContext);
    const tokens = tokenTotal(currentContext);
    return {
      ...optionalViewDetails(branch, context, effort, model, todoView, tokens),
      cwd: currentContext.cwd,
      extensionStatuses,
      gitState: currentGit?.state ?? "clean",
    };
  };

  pi.on("session_start", async (_event, currentContext) => {
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
  });

  pi.on("session_shutdown", (_event, currentContext) => {
    refreshGeneration += 1;
    for (const timer of refreshTimers) clearTimeout(timer);
    refreshTimers.clear();
    unsubscribeRoute();
    unsubscribeTodo();
    ctx = undefined;
    footerData = undefined;
    requestRender = undefined;
    if (currentContext.mode === "tui") currentContext.ui.setFooter(undefined);
  });
}
