import { StringEnum } from "@earendil-works/pi-ai";
import {
  createLocalBashOperations,
  isToolCallEventType,
  truncateLine,
  type BashOperations,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

import {
  cleanupPreview,
  formatCleanupPreview,
  revalidationReason,
  type CleanupCandidate,
  type CleanupPreview,
} from "./cleanup.ts";
import { GithubClient } from "./github.ts";
import { routeBashCommand, routeOptionalPath } from "./routing.ts";
import {
  WorktrunkClient,
  type WorktrunkList,
  type WorktrunkSelection,
  type WorktrunkWorktree,
} from "./worktrunk.ts";

const STATE_TYPE = "mopeyjellyfish-pi-worktrunk-state";
const STATUS_KEY = "mopeyjellyfish-pi-worktrunk";
export const WORKTREE_ROUTE_EVENT = "mopeyjellyfish:pi-worktrunk:route:v1";
const OUTPUT_WORKTREE_LIMIT = 20;
const OUTPUT_IDENTIFIER_LIMIT = 200;
const OUTPUT_HEAD_LIMIT = 128;
const OUTPUT_PATH_LIMIT = 400;
const CLEANUP_APPLY_TIMEOUT_MS = 30 * 60_000;

const ACTIONS = [
  "status",
  "list",
  "create",
  "activate",
  "deactivate",
  "remove",
  "cleanup",
] as const;

export const WorktreeParameters = Type.Object(
  {
    action: StringEnum(ACTIONS),
    base: Type.Optional(
      Type.String({
        description: "Base ref for action=create; Worktrunk chooses its default when omitted",
        maxLength: 256,
      }),
    ),
    branch: Type.Optional(
      Type.String({
        description: "Branch name to create, or to attach when it already has a linked worktree",
        maxLength: 4096,
      }),
    ),
    confirm: Type.Optional(
      Type.Boolean({ description: "Set true only after the user approves a worktree removal" }),
    ),
    expectedHead: Type.Optional(
      Type.String({
        description: "Exact HEAD from worktree list for action=remove",
        maxLength: 128,
      }),
    ),
    expectedFingerprint: Type.Optional(
      Type.String({
        description: "Exact cleanup preview fingerprint for action=cleanup apply",
        maxLength: 128,
      }),
    ),
    identifier: Type.Optional(
      Type.String({
        description:
          "Branch name, previous-worktree shortcut (-), or PR/MR reference for activate; exact branch for remove",
        maxLength: 4096,
      }),
    ),
  },
  { additionalProperties: false },
);

export type WorktreeInput = Static<typeof WorktreeParameters>;
type WorktreeAction = (typeof ACTIONS)[number];

export interface PersistedWorktrunkState {
  readonly activePath?: string;
  readonly mainPath: string;
  readonly version: 1;
}

interface CleanupApplyResult {
  readonly changed: readonly string[];
  readonly failed: readonly string[];
  readonly fingerprint: string;
  readonly removed: readonly string[];
  readonly skipped: readonly string[];
}

export interface WorktreeToolDetails {
  readonly action: WorktreeAction;
  readonly activePath?: string;
  readonly cleanup?: CleanupApplyResult | CleanupPreview;
  readonly truncated?: boolean;
  readonly worktrees?: readonly WorktrunkWorktree[];
}

interface WorktreeToolResult {
  readonly content: { text: string; type: "text" }[];
  readonly details: WorktreeToolDetails;
}

type WorktreeActionHandler = (
  input: WorktreeInput,
  signal: AbortSignal | undefined,
  ctx: ExtensionContext,
) => Promise<WorktreeToolResult>;

export interface WorktreeRouteEventV1 {
  readonly activePath: string;
  readonly branch: string | undefined;
  readonly head: string | undefined;
  readonly version: 1;
}

interface ActiveRoute {
  readonly activePath: string;
  readonly branch: string | undefined;
  readonly head: string | undefined;
  readonly mainPath: string;
}

const ALLOWED_FIELDS: Readonly<Record<WorktreeAction, ReadonlySet<keyof WorktreeInput>>> = {
  activate: new Set(["action", "identifier"]),
  cleanup: new Set(["action", "confirm", "expectedFingerprint"]),
  create: new Set(["action", "base", "branch"]),
  deactivate: new Set(["action"]),
  list: new Set(["action"]),
  remove: new Set(["action", "confirm", "expectedHead", "identifier"]),
  status: new Set(["action"]),
};

export function assertActionFields(input: WorktreeInput): void {
  const unexpected = Object.keys(input).filter(
    (key) => !ALLOWED_FIELDS[input.action].has(key as keyof WorktreeInput),
  );
  if (unexpected.length > 0) {
    throw new Error(`action=${input.action} does not accept: ${unexpected.join(", ")}.`);
  }
  if (input.action === "cleanup") {
    const hasConfirm = input.confirm !== undefined;
    const hasFingerprint = input.expectedFingerprint !== undefined;
    if (hasConfirm !== hasFingerprint || (hasConfirm && input.confirm !== true)) {
      throw new Error(
        "action=cleanup accepts confirm:true and expectedFingerprint only together after preview approval.",
      );
    }
  }
}

export function isPersistedState(value: unknown): value is PersistedWorktrunkState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const state = value as Record<string, unknown>;
  return (
    state["version"] === 1 &&
    typeof state["mainPath"] === "string" &&
    (state["activePath"] === undefined || typeof state["activePath"] === "string")
  );
}

export function stateFromBranch(ctx: ExtensionContext): PersistedWorktrunkState | undefined {
  let state: PersistedWorktrunkState | undefined;
  for (const entry of ctx.sessionManager.getBranch()) {
    if (
      entry.type === "custom" &&
      entry.customType === STATE_TYPE &&
      isPersistedState(entry.data)
    ) {
      state = entry.data;
    }
  }
  return state;
}

function outputText(
  value: string,
  maximumLength: number,
): { readonly text: string; readonly truncated: boolean } {
  const truncated = truncateLine(value, maximumLength);
  let singleLine = "";
  for (const character of truncated.text) {
    const codePoint = character.codePointAt(0) ?? 0;
    singleLine += codePoint < 32 || codePoint === 127 ? "�" : character;
  }
  return {
    text: singleLine,
    truncated: truncated.wasTruncated || singleLine !== truncated.text,
  };
}

function display(value: string): string {
  return outputText(value, OUTPUT_PATH_LIMIT).text;
}

function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index) ?? 0;
    if (codePoint < 32 || codePoint === 127) {
      return true;
    }
    if (codePoint > 65_535) {
      index += 1;
    }
  }
  return false;
}

function requiredText(value: string | undefined, field: string): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  if (value.startsWith("-")) {
    throw new Error(`${field} cannot begin with an option prefix.`);
  }
  if (containsControlCharacter(value)) {
    throw new Error(`${field} cannot contain control characters.`);
  }
  return value;
}

function activationTarget(value: string | undefined): string {
  return value === "-" ? value : requiredText(value, "identifier");
}

function optionalBase(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value.trim() === "") {
    throw new Error("base cannot be empty.");
  }
  if (value.startsWith("-") && value !== "-") {
    throw new Error("base cannot begin with an option prefix.");
  }
  if (containsControlCharacter(value)) {
    throw new Error("base cannot contain control characters.");
  }
  return value;
}

function isSignalAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function summarizeWorktree(worktree: WorktrunkWorktree): {
  readonly truncated: boolean;
  readonly worktree: WorktrunkWorktree;
} {
  const branch =
    worktree.branch === undefined
      ? undefined
      : outputText(worktree.branch, OUTPUT_IDENTIFIER_LIMIT);
  const head =
    worktree.head === undefined ? undefined : outputText(worktree.head, OUTPUT_HEAD_LIMIT);
  const path = outputText(worktree.path, OUTPUT_PATH_LIMIT);
  return {
    truncated: path.truncated || branch?.truncated === true || head?.truncated === true,
    worktree: {
      ...(branch === undefined ? {} : { branch: branch.text }),
      clean: worktree.clean,
      current: worktree.current,
      ...(head === undefined ? {} : { head: head.text }),
      main: worktree.main,
      path: path.text,
    },
  };
}

function listText(list: WorktrunkList): {
  readonly text: string;
  readonly truncated: boolean;
  readonly visible: readonly WorktrunkWorktree[];
} {
  const visible = list.worktrees
    .slice(0, OUTPUT_WORKTREE_LIMIT)
    .map((worktree) => summarizeWorktree(worktree));
  const lines = visible.map(({ truncated, worktree }) => {
    const flags = [worktree.main ? "main" : undefined, worktree.current ? "current" : undefined]
      .filter((flag): flag is string => flag !== undefined)
      .join(",");
    return {
      text: `${worktree.branch ?? "[detached]"} ${worktree.head ?? "[unborn]"}${
        flags === "" ? "" : ` [${flags}]`
      } — ${worktree.path}`,
      truncated,
    };
  });
  const truncated = list.worktrees.length > visible.length || lines.some((line) => line.truncated);
  return {
    text: `${lines.map((line) => line.text).join("\n") || "No Worktrunk worktrees found."}${
      truncated
        ? "\n[Worktree list truncated; use agent Bash to run `wt list --format=json` for the complete result.]"
        : ""
    }`,
    truncated,
    visible: visible.map(({ worktree }) => worktree),
  };
}

function publishRoute(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  active: ActiveRoute | undefined,
): void {
  pi.events.emit(
    WORKTREE_ROUTE_EVENT,
    active === undefined
      ? undefined
      : ({
          activePath: active.activePath,
          branch: active.branch,
          head: active.head,
          version: 1,
        } satisfies WorktreeRouteEventV1),
  );
  if (!ctx.hasUI) {
    return;
  }
  const label =
    active?.branch ??
    (active === undefined
      ? undefined
      : (active.activePath.split(/[\\/]/u).at(-1) ?? active.activePath));
  ctx.ui.setStatus(
    STATUS_KEY,
    label === undefined
      ? undefined
      : `worktree: ${outputText(label, OUTPUT_IDENTIFIER_LIMIT).text}`,
  );
}

function routeFromSelection(selection: WorktrunkSelection): ActiveRoute {
  return {
    activePath: selection.worktree.path,
    branch: selection.worktree.branch,
    head: selection.worktree.head,
    mainPath: selection.mainPath,
  };
}

function matchedWorktree(list: WorktrunkList, identifier: string): WorktrunkWorktree | undefined {
  const matches = list.worktrees.filter((worktree) => worktree.branch === identifier);
  return matches.length === 1 ? matches[0] : undefined;
}

function removableWorktree(
  list: WorktrunkList,
  identifier: string,
  expectedHead: string,
  activePath: string | undefined,
): WorktrunkWorktree {
  const target = matchedWorktree(list, identifier);
  if (target === undefined || target.main || target.current || !target.clean) {
    throw new Error(
      "Only a clean, inactive linked Worktrunk worktree with an exact branch identifier can be removed.",
    );
  }
  if (activePath === target.path) {
    throw new Error("Deactivate the routed worktree before removing it.");
  }
  if (target.head !== expectedHead) {
    throw new Error("expectedHead must match the exact current HEAD from worktree list.");
  }
  return target;
}

export default function piWorktrunkExtension(pi: ExtensionAPI): void {
  const client = new WorktrunkClient((arguments_, options) =>
    pi.exec("wt", [...arguments_], {
      cwd: options.cwd,
      timeout: options.timeout,
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    }),
  );
  const github = new GithubClient((arguments_, options) =>
    pi.exec("gh", [...arguments_], {
      cwd: options.cwd,
      timeout: options.timeout,
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    }),
  );
  const localBash = createLocalBashOperations();
  let active: ActiveRoute | undefined;
  let lastMainPath: string | undefined;

  const persist = (ctx: ExtensionContext): void => {
    pi.appendEntry(STATE_TYPE, {
      ...(active === undefined ? {} : { activePath: active.activePath }),
      mainPath: lastMainPath ?? ctx.cwd,
      version: 1,
    } satisfies PersistedWorktrunkState);
  };

  const activate = (ctx: ExtensionContext, selection: WorktrunkSelection): void => {
    active = routeFromSelection(selection);
    lastMainPath = active.mainPath;
    persist(ctx);
    publishRoute(pi, ctx, active);
  };

  const deactivate = (ctx: ExtensionContext): void => {
    active = undefined;
    persist(ctx);
    publishRoute(pi, ctx, active);
  };

  const toolResult = (text: string, details: WorktreeToolDetails): WorktreeToolResult => ({
    content: [{ type: "text", text }],
    details,
  });

  const previewCleanup = async (
    ctx: ExtensionContext,
    signal: AbortSignal | undefined,
  ): Promise<CleanupPreview> => {
    const list = await client.listFull(ctx.cwd, signal);
    const branches = list.worktrees.flatMap((worktree) =>
      worktree.branch === undefined || worktree.main ? [] : [worktree.branch],
    );
    const evidence = await github.history(ctx.cwd, list.forge, branches, signal);
    return cleanupPreview(list, evidence.pullRequests, evidence.state, active?.activePath);
  };

  const cleanupResultText = (result: CleanupApplyResult): string =>
    `Cleanup finished. Removed: ${String(result.removed.length)}; changed: ${String(
      result.changed.length,
    )}; skipped: ${String(result.skipped.length)}; failed: ${String(
      result.failed.length,
    )}. Branches were preserved.`;

  type CleanupCandidateResult =
    | { readonly kind: "changed" | "removed"; readonly value: string }
    | { readonly kind: "discovery_failed" | "failed"; readonly value: string };

  const cleanupFailure = (candidate: CleanupCandidate, error: unknown): string =>
    `${candidate.path}: ${
      outputText(error instanceof Error ? error.message : String(error), 1000).text
    }`;

  const processCleanupCandidate = async (
    candidate: CleanupCandidate,
    signal: AbortSignal | undefined,
    ctx: ExtensionContext,
  ): Promise<CleanupCandidateResult> => {
    let local: WorktrunkList;
    try {
      local = await client.listLocal(ctx.cwd, signal);
    } catch (error) {
      return { kind: "discovery_failed", value: cleanupFailure(candidate, error) };
    }
    if (revalidationReason(candidate, local, active?.activePath) !== undefined) {
      return { kind: "changed", value: candidate.path };
    }
    try {
      await client.remove(candidate.branch, candidate.path, ctx.cwd, signal);
      return { kind: "removed", value: candidate.path };
    } catch (error) {
      return { kind: "failed", value: cleanupFailure(candidate, error) };
    }
  };

  const applyCleanup = async (
    expectedFingerprint: string,
    signal: AbortSignal | undefined,
    ctx: ExtensionContext,
  ): Promise<CleanupApplyResult> => {
    if (!ctx.hasUI) {
      throw new Error("worktree cleanup requires interactive TUI or RPC confirmation.");
    }
    const preview = await previewCleanup(ctx, signal);
    if (
      preview.fingerprint === undefined ||
      preview.fingerprint !== expectedFingerprint ||
      preview.overflow === true
    ) {
      throw new Error(
        "Cleanup preview changed; inspect a new preview and approve its fingerprint.",
      );
    }
    const approved = await ctx.ui.confirm(
      "Remove approved Worktrunk worktrees?",
      `Remove ${String(preview.candidates.length)} reviewed worktrees from fingerprint ${preview.fingerprint}? Branches are preserved. Ignored output is removed. No processes are reaped.`,
      signal === undefined ? undefined : { signal },
    );
    if (!approved) throw new Error("Worktree cleanup was cancelled by the user.");

    const changed: string[] = [];
    const failed: string[] = [];
    const removed: string[] = [];
    const skipped: string[] = [];
    const deadline = Date.now() + CLEANUP_APPLY_TIMEOUT_MS;

    for (const [index, candidate] of preview.candidates.entries()) {
      if (isSignalAborted(signal) || Date.now() >= deadline) {
        skipped.push(...preview.candidates.slice(index).map((item) => item.path));
        break;
      }
      const result = await processCleanupCandidate(candidate, signal, ctx);
      if (result.kind === "changed") changed.push(result.value);
      else if (result.kind === "removed") removed.push(result.value);
      else failed.push(result.value);

      if (result.kind === "discovery_failed" || isSignalAborted(signal)) {
        skipped.push(...preview.candidates.slice(index + 1).map((item) => item.path));
        break;
      }
    }

    return { changed, failed, fingerprint: preview.fingerprint, removed, skipped };
  };

  const actionHandlers: Readonly<Record<WorktreeAction, WorktreeActionHandler>> = {
    status: async (_input, signal, ctx) => {
      const list = await client.list(ctx.cwd, signal);
      const route = active;
      let current: ActiveRoute | undefined;
      if (route === undefined) {
        current = undefined;
      } else {
        const found = list.worktrees.find(
          (worktree) => !worktree.main && worktree.path === route.activePath,
        );
        if (list.mainPath === route.mainPath && found !== undefined) {
          current = {
            activePath: found.path,
            branch: found.branch,
            head: found.head,
            mainPath: list.mainPath,
          };
          active = current;
          publishRoute(pi, ctx, current);
        }
      }
      if (route !== undefined && current === undefined) {
        deactivate(ctx);
      }
      const activePath =
        current === undefined ? undefined : outputText(current.activePath, OUTPUT_PATH_LIMIT);
      const details: WorktreeToolDetails = {
        action: "status",
        ...(activePath === undefined ? {} : { activePath: activePath.text }),
        ...(activePath?.truncated === true ? { truncated: true } : {}),
      };
      const text =
        current === undefined
          ? `No active routed worktree.\nMain: ${display(list.mainPath)}\nLinked worktrees: ${String(
              list.worktrees.filter((worktree) => !worktree.main).length,
            )}`
          : `Active worktree: ${activePath?.text ?? display(current.activePath)}\nMain: ${display(current.mainPath)}`;
      return toolResult(text, details);
    },
    list: async (_input, signal, ctx) => {
      const formatted = listText(await client.list(ctx.cwd, signal));
      return toolResult(formatted.text, {
        action: "list",
        truncated: formatted.truncated,
        worktrees: formatted.visible,
      });
    },
    create: async (input, signal, ctx) => {
      try {
        const selection = await client.create(
          requiredText(input.branch, "branch"),
          optionalBase(input.base),
          ctx.cwd,
          signal,
        );
        activate(ctx, selection);
        const summary = summarizeWorktree(selection.worktree);
        const label = summary.worktree.branch ?? summary.worktree.path;
        const head = summary.worktree.head ?? "[unborn]";
        return toolResult(
          `${selection.existing === true ? "Attached to existing" : "Created and activated"} ${label}.\nPath: ${summary.worktree.path}\nHEAD: ${head}`,
          {
            action: "create",
            activePath: summary.worktree.path,
            ...(summary.truncated ? { truncated: true } : {}),
            worktrees: [summary.worktree],
          },
        );
      } catch (error) {
        deactivate(ctx);
        ctx.abort();
        throw error;
      }
    },
    activate: async (input, signal, ctx) => {
      try {
        const selection = await client.activate(
          activationTarget(input.identifier),
          ctx.cwd,
          signal,
        );
        activate(ctx, selection);
        const summary = summarizeWorktree(selection.worktree);
        const label = summary.worktree.branch ?? summary.worktree.path;
        const head = summary.worktree.head ?? "[unborn]";
        return toolResult(`Activated ${label}.\nPath: ${summary.worktree.path}\nHEAD: ${head}`, {
          action: "activate",
          activePath: summary.worktree.path,
          ...(summary.truncated ? { truncated: true } : {}),
          worktrees: [summary.worktree],
        });
      } catch (error) {
        deactivate(ctx);
        ctx.abort();
        throw error;
      }
    },
    deactivate: (_input, _signal, ctx) => {
      deactivate(ctx);
      return Promise.resolve(
        toolResult("Deactivated worktree routing. Pi tools use the session working directory.", {
          action: "deactivate",
        }),
      );
    },
    cleanup: async (input, signal, ctx) => {
      if (input.confirm === undefined) {
        const preview = await previewCleanup(ctx, signal);
        return toolResult(formatCleanupPreview(preview), {
          action: "cleanup",
          cleanup: preview,
        });
      }
      const fingerprint = requiredText(input.expectedFingerprint, "expectedFingerprint");
      const result = await applyCleanup(fingerprint, signal, ctx);
      return toolResult(cleanupResultText(result), { action: "cleanup", cleanup: result });
    },
    remove: async (input, signal, ctx) => {
      if (!ctx.hasUI) {
        throw new Error("worktree remove requires interactive TUI or RPC confirmation.");
      }
      if (input.confirm !== true) {
        throw new Error("worktree remove requires confirm:true after explicit user approval.");
      }
      const identifier = requiredText(input.identifier, "identifier");
      const expectedHead = requiredText(input.expectedHead, "expectedHead");
      const list = await client.list(ctx.cwd, signal);
      const target = removableWorktree(list, identifier, expectedHead, active?.activePath);
      const summary = summarizeWorktree(target);
      const approved = await ctx.ui.confirm(
        "Remove Worktrunk worktree?",
        `Remove clean worktree ${summary.worktree.branch ?? summary.worktree.path} at ${summary.worktree.path}? Its branch will be preserved and Worktrunk hooks will not run.`,
        signal === undefined ? undefined : { signal },
      );
      if (!approved) {
        throw new Error("Worktree removal was cancelled by the user.");
      }
      const refreshedTarget = removableWorktree(
        await client.list(ctx.cwd, signal),
        identifier,
        expectedHead,
        active?.activePath,
      );
      if (refreshedTarget.path !== target.path) {
        throw new Error("Worktree changed before removal; inspect list and confirm again.");
      }
      await client.remove(identifier, refreshedTarget.path, ctx.cwd, signal);
      return toolResult(
        `Removed ${summary.worktree.branch ?? summary.worktree.path}. The branch was preserved.`,
        {
          action: "remove",
          ...(summary.truncated ? { truncated: true } : {}),
          worktrees: [summary.worktree],
        },
      );
    },
  };

  pi.registerTool({
    name: "worktree",
    label: "Worktrunk worktree",
    description:
      "Inspect, create, activate, deactivate, safely remove, or preview and apply safe bulk Worktrunk cleanup. The worktree cleanup preview reports the complete bounded set. Apply requires its exact approved fingerprint and interactive confirmation, preserves branches, and never uses force or process reaping.",
    executionMode: "sequential",
    promptSnippet: "Manage a safely routed Worktrunk worktree",
    promptGuidelines: [
      "Call worktree with action=cleanup and no confirmation fields to preview cleanup first. Present every candidate, skipped reason, and evidence limitation.",
      "Call worktree cleanup apply only after explicit approval, with confirm:true and the exact matching expectedFingerprint from that preview.",
      "worktree cleanup preserves branches and never uses force or process reaping.",
      "worktree is sequential: a successful create or activate can be followed by normal file or Bash tools in the same assistant tool batch.",
      "Never ask worktree to bypass Worktrunk hook approval with --yes; a human must review and approve hooks directly.",
      "Only request worktree remove with confirm:true after explicit user approval and the exact HEAD reported by worktree list.",
    ],
    parameters: WorktreeParameters,
    execute(_toolCallId, input, signal, _onUpdate, ctx) {
      assertActionFields(input);
      return actionHandlers[input.action](input, signal, ctx);
    },
  });

  pi.registerCommand("worktree", {
    description:
      "Show Worktrunk status/list, deactivate routing, or safely clean approved worktrees",
    handler: async (arguments_, ctx) => {
      const action = arguments_.trim() || "status";
      try {
        switch (action) {
          case "status": {
            const list = await client.list(ctx.cwd, ctx.signal);
            ctx.ui.notify(`Main: ${display(list.mainPath)}\n${listText(list).text}`, "info");
            break;
          }
          case "list": {
            ctx.ui.notify(listText(await client.list(ctx.cwd, ctx.signal)).text, "info");
            break;
          }
          case "deactivate": {
            deactivate(ctx);
            ctx.ui.notify("Worktree routing deactivated.", "info");
            break;
          }
          case "cleanup": {
            if (!ctx.hasUI) {
              ctx.ui.notify("Cleanup apply is unavailable in non-interactive mode.", "warning");
              break;
            }
            const preview = await previewCleanup(ctx, ctx.signal);
            ctx.ui.notify(formatCleanupPreview(preview), "info");
            if (preview.fingerprint === undefined) break;
            const result = await applyCleanup(preview.fingerprint, ctx.signal, ctx);
            ctx.ui.notify(cleanupResultText(result), "info");
            break;
          }
          default: {
            ctx.ui.notify("Usage: /worktree [status|list|deactivate|cleanup]", "warning");
          }
        }
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  const restore = async (ctx: ExtensionContext): Promise<void> => {
    const state = stateFromBranch(ctx);
    active = undefined;
    lastMainPath = state?.mainPath;
    if (state?.activePath === undefined) {
      publishRoute(pi, ctx, active);
      return;
    }
    try {
      const list = await client.list(ctx.cwd, ctx.signal);
      const found = list.worktrees.find(
        (worktree) => !worktree.main && worktree.path === state.activePath,
      );
      if (list.mainPath === state.mainPath && found !== undefined) {
        active = {
          activePath: found.path,
          branch: found.branch,
          head: found.head,
          mainPath: list.mainPath,
        };
        lastMainPath = list.mainPath;
      }
    } catch {
      // Worktrunk is optional until a user invokes the extension tool.
    }
    publishRoute(pi, ctx, active);
  };

  pi.on("session_start", async (_event, ctx) => restore(ctx));
  pi.on("session_tree", async (_event, ctx) => restore(ctx));
  pi.on("session_shutdown", (_event, ctx) => {
    publishRoute(pi, ctx, undefined);
  });

  pi.on("tool_call", (event) => {
    if (active === undefined) {
      return;
    }
    if (isToolCallEventType("bash", event)) {
      event.input.command = routeBashCommand(event.input.command, active.activePath);
    } else if (
      isToolCallEventType("read", event) ||
      isToolCallEventType("write", event) ||
      isToolCallEventType("edit", event) ||
      isToolCallEventType("grep", event) ||
      isToolCallEventType("find", event) ||
      isToolCallEventType("ls", event)
    ) {
      routeOptionalPath(event.input, active.mainPath, active.activePath);
    }
  });

  pi.on("user_bash", () => {
    if (active === undefined) {
      return;
    }
    const activePath = active.activePath;
    const operations: BashOperations = {
      exec(command, _cwd, options) {
        return localBash.exec(command, activePath, options);
      },
    };
    return { operations };
  });
}
