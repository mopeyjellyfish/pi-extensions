import { CustomEditor } from "@earendil-works/pi-coding-agent";
import { Text, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

import {
  fetchAccountUsage,
  parseProviderLimitHeaders,
  type AccountUsageContext,
  type AccountUsageSnapshot,
} from "./account-usage.ts";
import { parseGitStatus, type GitStatusDetails, type ParsedGitStatus } from "./git.ts";
import {
  renderStatusLine,
  stripAnsi,
  type ContextStatusLineView,
  type StatusLineTheme,
  type StatusLineView,
  type SubagentStatusLineView,
  type TodoStatusLineView,
} from "./powerline.ts";

import type {
  ExtensionAPI,
  ExtensionContext,
  ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";
import type { EditorComponent, EditorTheme } from "@earendil-works/pi-tui";

type EditorFactory = NonNullable<ReturnType<ExtensionContext["ui"]["getEditorComponent"]>>;

const WORKTREE_ROUTE_EVENT = "mopeyjellyfish:pi-worktrunk:route:v1";
const TODO_SUMMARY_EVENT = "mopeyjellyfish:pi-todo:summary:v1";
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
const STATUS_ENTRY_TYPE = "mopeyjellyfish-pi-status";

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
): string[] {
  return [...statuses]
    .filter(([key]) => key !== WORKTREE_STATUS_KEY || !routeActive)
    .filter(([key]) => key !== TODO_STATUS_KEY || !todoActive)
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
  accountUsage: AccountUsageSnapshot | undefined,
  branch: string | undefined,
  context: ContextStatusLineView | undefined,
  effort: string | undefined,
  gitDetails: GitStatusDetails | undefined,
  model: string | undefined,
  subagents: SubagentStatusLineView | undefined,
  todo: TodoStatusLineView | undefined,
): Partial<StatusLineView> {
  const accountLimits =
    accountUsage?.status === "available"
      ? accountUsage.source === "codex-usage"
        ? accountUsage.limits.filter((limit) => limit.scope === "account")
        : accountUsage.limits
      : undefined;
  return {
    ...(accountLimits === undefined || accountLimits.length === 0
      ? {}
      : {
          accountLimits: accountLimits.map(({ label, remainingPercent }) => ({
            label,
            remainingPercent,
          })),
        }),
    ...(branch === undefined ? {} : { branch }),
    ...(context === undefined ? {} : { context }),
    ...(effort === undefined ? {} : { effort }),
    ...(gitDetails === undefined ? {} : { gitDetails }),
    ...(model === undefined ? {} : { model }),
    ...(subagents === undefined ? {} : { subagents }),
    ...(todo === undefined ? {} : { todo }),
  };
}

function displayValue(value: string): string {
  let clean = "";
  for (const character of stripAnsi(value)) {
    const codePoint = character.codePointAt(0) ?? 0;
    clean += codePoint < 32 || (codePoint >= 127 && codePoint <= 159) ? " " : character;
    if (clean.length >= 200) break;
  }
  return clean.replaceAll(/\s+/gu, " ").trim();
}

function integer(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function limitBar(percent: number): string {
  const filled = Math.round(Math.max(0, Math.min(100, percent)) / 5);
  return `[${"█".repeat(filled)}${"░".repeat(20 - filled)}]`;
}

function contextStatusText(ctx: ExtensionContext): string {
  const context = ctx.getContextUsage();
  if (context === undefined) return "Context: unavailable";
  const percent = context.percent === null ? "?" : (100 - context.percent).toFixed(1);
  const tokens = context.tokens === null ? "?" : integer(context.tokens);
  return `Context: ${percent}% left (${tokens} used / ${integer(context.contextWindow)})`;
}

function accountStatusLines(usage: AccountUsageSnapshot): string[] {
  if (usage.status === "unavailable") {
    return [`Account usage: unavailable — ${usage.reason}`];
  }
  const lines = [
    `Account: ${displayValue(usage.provider)}${usage.plan === undefined ? "" : ` (${usage.plan})`}`,
    `Observed: ${new Date(usage.observedAt).toISOString()}`,
  ];
  for (const limit of usage.limits) {
    const reset =
      limit.resetsAt === undefined ? "" : ` · resets ${new Date(limit.resetsAt).toISOString()}`;
    lines.push(
      `${limit.label}: ${limitBar(limit.remainingPercent)} ${String(Math.round(limit.remainingPercent))}% left${reset}`,
    );
  }
  lines.push(
    usage.source === "codex-usage"
      ? "Source: OpenAI Codex internal usage endpoint; values can be stale or unavailable."
      : "Source: provider response headers; values are from the last observed model response.",
  );
  return lines;
}

function statusText(pi: ExtensionAPI, ctx: ExtensionContext, usage: AccountUsageSnapshot): string {
  const model = ctx.model;
  const name = ctx.sessionManager.getSessionName();
  return [
    `Model: ${model === undefined ? "unavailable" : `${displayValue(model.name)} (${displayValue(model.provider)}/${displayValue(model.id)})`}`,
    `Thinking: ${model?.reasoning === true ? pi.getThinkingLevel() : "off"}`,
    `Directory: ${displayValue(ctx.cwd)}`,
    `Session: ${displayValue(ctx.sessionManager.getSessionId())}`,
    ...(name === undefined ? [] : [`Name: ${displayValue(name)}`]),
    contextStatusText(ctx),
    ...accountStatusLines(usage),
  ].join("\n");
}

function scrollIndicator(border: string, direction: "↑" | "↓"): string | undefined {
  const plain = stripAnsi(border);
  const full = new RegExp(`${direction} \\d+ more`, "u").exec(plain)?.[0];
  if (full !== undefined) return full;
  const partial = new RegExp(`${direction}(?: (\\d+))?`, "u").exec(plain);
  return partial === null ? undefined : `${direction}${partial[1] ?? ""}`;
}

function truncatedScrollBorder(line: string, width: number): boolean {
  const ellipsis = ".".repeat(Math.min(3, width));
  if (ellipsis === "" || !line.endsWith(ellipsis)) return false;
  const prefix = line.slice(0, -ellipsis.length);
  return "─── ".startsWith(prefix) || /^─── [↑↓](?: | \d+(?: | m(?:o(?:re?)?)?)?)?$/u.test(prefix);
}

function editorBorder(line: string, width: number): boolean {
  const plain = stripAnsi(line);
  const border = plain.replace(/ [↑↓] \d+ more /u, "");
  return (
    visibleWidth(plain) === width &&
    ((border.length > 0 && border.replaceAll("─", "") === "") ||
      truncatedScrollBorder(plain, width))
  );
}

function renderTopDivider(
  view: StatusLineView | undefined,
  nativeTop: string,
  nativeBottom: string | undefined,
  width: number,
  theme: StatusLineTheme,
  borderColor: (text: string) => string,
): string {
  if (width <= 0) return "";
  if (width === 1) return borderColor("╭");
  const indicators = [
    scrollIndicator(nativeTop, "↑"),
    nativeBottom === undefined ? undefined : scrollIndicator(nativeBottom, "↓"),
  ].filter((indicator): indicator is string => indicator !== undefined);
  const prefix = "╭─";
  const fullSuffix = indicators.length === 0 ? "" : ` ${indicators.join(" · ")} `;
  const compactSuffix = ` ${indicators
    .map((indicator) => indicator.replace(/^([↑↓]) (\d+) more$/u, "$1$2"))
    .join(" ")} `;
  const suffix =
    visibleWidth(prefix) + visibleWidth(fullSuffix) <= width
      ? fullSuffix
      : visibleWidth(prefix) + visibleWidth(compactSuffix) <= width
        ? compactSuffix
        : "";
  const contentWidth = Math.max(0, width - visibleWidth(prefix) - visibleWidth(suffix));
  const status = view === undefined ? "" : renderStatusLine(view, contentWidth, theme);
  const content = truncateToWidth(status, contentWidth, "");
  const fill = "─".repeat(Math.max(0, contentWidth - visibleWidth(content)));
  const line = `${borderColor(prefix)}${content}${borderColor(fill)}${theme.fg("dim", suffix)}`;
  return truncateToWidth(line, width, "");
}

function decorateEditor(
  editor: EditorComponent,
  buildView: () => StatusLineView | undefined,
  theme: StatusLineTheme,
  editorTheme: EditorTheme,
  setRestore: (restore: () => void) => void,
): EditorComponent {
  const render = editor.render.bind(editor);
  setRestore(() => {
    editor.render = render;
  });
  editor.render = (width: number): string[] => {
    const borderColor = editor.borderColor ?? editorTheme.borderColor;
    const promptWidth = visibleWidth("╰─❯ ");
    const contentWidth = Math.max(0, width - promptWidth);
    const lines = render(contentWidth);
    if (lines.length === 0) return lines;
    const nativeTop = lines[0] ?? "";
    const bottomIndex = lines.findIndex(
      (line, index) => index > 0 && editorBorder(line, contentWidth),
    );
    const nativeBottom = bottomIndex === -1 ? undefined : lines.splice(bottomIndex, 1)[0];
    lines[0] = renderTopDivider(buildView(), nativeTop, nativeBottom, width, theme, borderColor);
    for (let index = 1; index < lines.length; index += 1) {
      lines[index] =
        index === 1
          ? `${borderColor("╰─")}${theme.fg("accent", "❯")} ${lines[index] ?? ""}`
          : `${" ".repeat(promptWidth)}${lines[index] ?? ""}`;
    }
    return lines.map((line) =>
      visibleWidth(line) <= width ? line : truncateToWidth(line, width, ""),
    );
  };
  return editor;
}

export default function statusLineExtension(pi: ExtensionAPI): void {
  let accountUsage: AccountUsageSnapshot | undefined;
  let accountUsageController: AbortController | undefined;
  let accountUsageGeneration = 0;
  let route: WorktreeRouteEventV1 | undefined;
  let subagents: SubagentStatusLineView | undefined;
  let todo: TodoSummaryEventV1 | undefined;
  let ctx: ExtensionContext | undefined;
  let footerData: ReadonlyFooterDataProvider | undefined;
  let git: GitSnapshot | undefined;
  let previousEditorFactory: EditorFactory | undefined;
  let requestRender: (() => void) | undefined;
  let restoreEditor: (() => void) | undefined;
  let refreshGeneration = 0;
  let sessionGeneration = 0;
  let subagentRequestSequence = 0;
  const refreshTimers = new Set<ReturnType<typeof setTimeout>>();
  const subagentRequestCleanups = new Set<() => void>();

  const effectiveCwd = (): string | undefined => route?.activePath ?? ctx?.cwd;

  const refreshAccountUsage = async (
    currentContext: ExtensionContext,
  ): Promise<AccountUsageSnapshot> => {
    accountUsageController?.abort();
    const controller = new AbortController();
    accountUsageController = controller;
    const generation = ++accountUsageGeneration;
    try {
      const fetched = await fetchAccountUsage(
        currentContext as unknown as AccountUsageContext,
        controller.signal,
      );
      const next =
        fetched.status === "unavailable" &&
        accountUsage?.status === "available" &&
        accountUsage.source === "response-headers" &&
        accountUsage.provider === currentContext.model?.provider
          ? accountUsage
          : fetched;
      if (generation === accountUsageGeneration) {
        accountUsage = next;
        requestRender?.();
      }
      return next;
    } catch {
      const provider = currentContext.model?.provider;
      const unavailable: AccountUsageSnapshot = {
        ...(provider === undefined ? {} : { provider }),
        reason: "Usage request was cancelled",
        status: "unavailable",
      };
      if (generation === accountUsageGeneration) accountUsage = unavailable;
      return unavailable;
    }
  };

  pi.registerEntryRenderer(STATUS_ENTRY_TYPE, (entry, _options, theme) => {
    const data = isRecord(entry.data) ? entry.data : undefined;
    const text = typeof data?.["text"] === "string" ? data["text"] : "Status unavailable";
    return new Text(theme.fg("text", text), 1, 0);
  });

  pi.registerCommand("status", {
    description: "Show model, session, context, and provider account usage",
    handler: async (_args, currentContext) => {
      const usage = await refreshAccountUsage(currentContext);
      const text = statusText(pi, currentContext, usage);
      if (currentContext.mode === "tui") pi.appendEntry(STATUS_ENTRY_TYPE, { text });
      else if (currentContext.hasUI) currentContext.ui.notify(text, "info");
    },
  });

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
    );
    const todoView = todoStatusLineView(todo);
    const currentGit = git?.cwd === gitCwd ? git : undefined;
    const branch = branchLabel(currentGit, route, footerData?.getGitBranch());
    const context = contextStatus(currentContext);
    const effort = effortText(pi, currentContext);
    const model = modelText(currentContext);
    return {
      ...optionalViewDetails(
        accountUsage,
        branch,
        context,
        effort,
        currentGit,
        model,
        subagents,
        todoView,
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
    previousEditorFactory = currentContext.ui.getEditorComponent();
    currentContext.ui.setEditorComponent((tui, theme, keybindings) => {
      requestRender = () => {
        tui.requestRender();
      };
      const editor =
        previousEditorFactory?.(tui, theme, keybindings) ??
        new CustomEditor(tui, theme, keybindings);
      restoreEditor?.();
      return decorateEditor(editor, buildView, currentContext.ui.theme, theme, (restore) => {
        restoreEditor = restore;
      });
    });
    currentContext.ui.setFooter((tui, _theme, provider) => {
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
        render(): string[] {
          return [];
        },
      };
    });
    requestSubagentStatus();
    void refreshAccountUsage(currentContext);
    await refreshGit();
  });

  pi.on("model_select", (_event, currentContext) => {
    ctx = currentContext;
    accountUsage = undefined;
    requestRender?.();
    if (currentContext.mode === "tui") void refreshAccountUsage(currentContext);
  });

  pi.on("agent_settled", (_event, currentContext) => {
    ctx = currentContext;
    if (currentContext.mode === "tui") void refreshAccountUsage(currentContext);
  });

  pi.on("after_provider_response", (event, currentContext) => {
    const provider = currentContext.model?.provider;
    if (provider === undefined) return;
    const observed = parseProviderLimitHeaders(provider, event.headers);
    if (
      observed === undefined ||
      (accountUsage?.status === "available" && accountUsage.source === "codex-usage")
    ) {
      return;
    }
    accountUsage = observed;
    requestRender?.();
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
    accountUsageGeneration += 1;
    accountUsageController?.abort();
    accountUsageController = undefined;
    accountUsage = undefined;
    for (const timer of refreshTimers) clearTimeout(timer);
    refreshTimers.clear();
    for (const cleanup of subagentRequestCleanups) cleanup();
    unsubscribeRoute();
    unsubscribeTodo();
    unsubscribeSubagentReady();
    unsubscribeSubagentStarted();
    unsubscribeSubagentComplete();
    unsubscribeSubagentControl();
    subagents = undefined;
    ctx = undefined;
    footerData = undefined;
    requestRender = undefined;
    restoreEditor?.();
    restoreEditor = undefined;
    if (currentContext.mode === "tui") {
      currentContext.ui.setEditorComponent(previousEditorFactory);
      currentContext.ui.setFooter(undefined);
    }
    previousEditorFactory = undefined;
  });
}
