import { access, open } from "node:fs/promises";
import { relative, resolve } from "node:path";

import { StringEnum } from "@earendil-works/pi-ai";
import { Type, type Static } from "typebox";

import { validatePitchDocument, validatePlanDocument, validateSliceDocument } from "./artifacts.ts";
import {
  PHASES,
  STATE_TYPE,
  STATUS_KEY,
  SUMMARY_EVENT,
  applyWorkflowAction,
  createWorkflow,
  derivedAttention,
  formatWorkflow,
  isWorkflowSnapshot,
  snapshotFromBranch,
  workflowSummary,
  type SliceStatus,
  type WorkflowAction,
  type WorkflowEvidence,
  type WorkflowPhase,
  type WorkflowSnapshot,
  type WorkflowSummaryEventV1,
} from "./state.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const MODEL_ACTIONS = [
  "status",
  "record_artifact",
  "record_evidence",
  "register_slice",
  "set_slice",
  "request_transition",
  "record_outcome",
  "record_issue",
] as const;

export const DevelopmentWorkflowParameters = Type.Object(
  {
    action: StringEnum(MODEL_ACTIONS),
    artifact: Type.Optional(StringEnum(["plan", "spec"] as const)),
    claim: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    evidenceKind: Type.Optional(Type.String({ maxLength: 80, minLength: 1 })),
    id: Type.Optional(Type.String({ maxLength: 30, minLength: 1 })),
    issueType: Type.Optional(StringEnum(["blocker", "decision"] as const)),
    outcome: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    path: Type.Optional(Type.String({ maxLength: 300, minLength: 1 })),
    reason: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    reference: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    sensitivity: Type.Optional(StringEnum(["public", "private"] as const)),
    sliceStatus: Type.Optional(StringEnum(["planned", "active", "blocked", "verified"] as const)),
    to: Type.Optional(StringEnum(PHASES)),
  },
  { additionalProperties: false },
);

export type DevelopmentWorkflowInput = Static<typeof DevelopmentWorkflowParameters>;

interface ToolDetails {
  readonly action: DevelopmentWorkflowInput["action"];
  readonly snapshot?: WorkflowSnapshot;
}

function required(value: string | undefined, label: string): string {
  if (value === undefined || value.trim() === "") throw new Error(`${label} is required.`);
  return value;
}

function ensureOnly(input: DevelopmentWorkflowInput, fields: readonly string[]): void {
  const allowed = new Set(["action", ...fields]);
  const extra = Object.keys(input).filter((key) => !allowed.has(key));
  if (extra.length > 0)
    throw new Error(`action=${input.action} does not accept: ${extra.join(", ")}`);
}

function modelAction(input: DevelopmentWorkflowInput): WorkflowAction | undefined {
  switch (input.action) {
    case "status":
      ensureOnly(input, []);
      return undefined;
    case "record_artifact":
      ensureOnly(input, ["artifact", "path"]);
      return {
        artifact:
          input.artifact ??
          (() => {
            throw new Error("artifact is required.");
          })(),
        kind: "record_artifact",
        path: required(input.path, "path"),
      };
    case "register_slice":
      ensureOnly(input, ["id", "path"]);
      return {
        id: required(input.id, "id"),
        kind: "register_slice",
        path: required(input.path, "path"),
      };
    case "set_slice":
      ensureOnly(input, ["id", "reason", "sliceStatus"]);
      return {
        id: required(input.id, "id"),
        kind: "set_slice",
        ...(input.reason === undefined ? {} : { reason: input.reason }),
        status:
          input.sliceStatus ??
          (() => {
            throw new Error("sliceStatus is required.");
          })(),
      };
    case "record_evidence": {
      ensureOnly(input, ["claim", "evidenceKind", "reference", "sensitivity"]);
      const evidence: WorkflowEvidence = {
        claim: required(input.claim, "claim"),
        kind: required(input.evidenceKind, "evidenceKind"),
        reference: required(input.reference, "reference"),
        sensitivity: input.sensitivity ?? "private",
      };
      return { evidence, kind: "record_evidence" };
    }
    case "request_transition":
      ensureOnly(input, ["reason", "to"]);
      return {
        kind: "request_transition",
        reason: required(input.reason, "reason"),
        to:
          input.to ??
          (() => {
            throw new Error("to is required.");
          })(),
      };
    case "record_outcome":
      ensureOnly(input, ["outcome"]);
      return { kind: "record_outcome", outcome: required(input.outcome, "outcome") };
    case "record_issue":
      ensureOnly(input, ["id", "issueType", "reason"]);
      return {
        id: required(input.id, "id"),
        issueType:
          input.issueType ??
          (() => {
            throw new Error("issueType is required.");
          })(),
        kind: "record_issue",
        reason: required(input.reason, "reason"),
      };
  }
}

function notify(ctx: ExtensionContext, message: string, level: "error" | "info" = "info"): void {
  if (ctx.hasUI) ctx.ui.notify(message, level);
}

const MAX_ARTIFACT_BYTES = 100_000;

async function validateArtifact(
  cwd: string,
  path: string,
  artifact: "plan" | "spec" | "slice",
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();
  const absolute = resolve(cwd, path);
  if (relative(cwd, absolute).startsWith(".."))
    throw new Error("Artifact path escapes the workspace.");
  const file = await open(absolute, "r");
  try {
    const buffer = Buffer.alloc(MAX_ARTIFACT_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    signal?.throwIfAborted();
    if (bytesRead > MAX_ARTIFACT_BYTES) {
      throw new Error(`Artifact exceeds ${String(MAX_ARTIFACT_BYTES)} bytes.`);
    }
    const source = buffer.toString("utf8", 0, bytesRead);
    if (artifact === "spec") validatePitchDocument(source);
    if (artifact === "slice") validateSliceDocument(source);
    if (artifact === "plan") validatePlanDocument(source);
  } finally {
    await file.close();
  }
}

function splitReason(arguments_: string): { readonly command: string; readonly reason?: string } {
  const separator = arguments_.indexOf("--");
  if (separator === -1) return { command: arguments_.trim() };
  return {
    command: arguments_.slice(0, separator).trim(),
    reason: arguments_.slice(separator + 2).trim(),
  };
}

function phase(value: string | undefined): WorkflowPhase {
  if (value === undefined || !PHASES.includes(value as WorkflowPhase)) {
    throw new Error(`Phase must be one of: ${PHASES.join(", ")}.`);
  }
  return value as WorkflowPhase;
}

function sliceAction(parts: readonly string[], reason: string | undefined): WorkflowAction {
  const statuses: Readonly<Record<string, SliceStatus>> = {
    activate: "active",
    block: "blocked",
    cut: "cut",
    restore: "planned",
    verify: "verified",
  };
  const operation = parts[1];
  const status = operation === undefined ? undefined : statuses[operation];
  if (status === undefined) {
    throw new Error("slice action must be activate, block, verify, cut, or restore.");
  }
  const id = required(parts[2], "slice id");
  if (operation === "restore") {
    return {
      id,
      kind: "restore_slice",
      reason: required(reason, "restoration reason"),
      status: "planned",
    };
  }
  return { id, kind: "set_slice", ...(reason === undefined ? {} : { reason }), status };
}

function circuitAction(
  parts: readonly string[],
  reason: string | undefined,
  now: number,
): WorkflowAction {
  const outcome = parts[1];
  if (
    outcome !== "finish" &&
    outcome !== "reshape" &&
    outcome !== "extend" &&
    outcome !== "abandon"
  ) {
    throw new Error("circuit outcome must be finish, reshape, extend, or abandon.");
  }
  return {
    ...(outcome === "extend" ? { duration: required(parts[2], "new backstop duration") } : {}),
    kind: "circuit",
    now,
    outcome,
    reason: required(reason, "reason"),
  };
}

function approvalAction(value: string | undefined, now: number): WorkflowAction {
  const gate = phase(value);
  if (gate === "ship") throw new Error("Ship is an outcome phase, not an approval gate.");
  return { gate, kind: "approve", now };
}

function showBackstopWarning(summary: WorkflowSummaryEventV1): boolean {
  return (
    summary.phase === "build" &&
    (summary.backstop === "attention" || summary.backstop === "expired")
  );
}

function directAction(command: string, reason: string | undefined, now: number): WorkflowAction {
  const parts = command.split(/\s+/u).filter(Boolean);
  switch (parts[0]) {
    case "appetite":
    case "backstop":
      return { duration: required(parts[1], "duration"), kind: "set_backstop" };
    case "approve":
      return approvalAction(parts[1], now);
    case "slice":
      return sliceAction(parts, reason);
    case "rewind":
      return { kind: "rewind", phase: phase(parts[1]), reason: required(reason, "reason") };
    case "pause":
      return { kind: "pause", now, reason: required(reason, "reason") };
    case "resume":
      return { kind: "resume", now };
    case "circuit":
      return circuitAction(parts, reason, now);
    case "resolve":
      return {
        id: required(parts[1], "issue id"),
        kind: "resolve_issue",
        reason: required(reason, "resolution reason"),
      };
    case "complete":
      return { kind: "complete", reason: required(reason, "completion reason") };
    case "abandon":
      return { kind: "abandon", reason: required(reason, "reason") };
    case undefined:
    default:
      throw new Error("Unknown /dev-workflow action.");
  }
}

export default function developmentWorkflowExtension(pi: ExtensionAPI): void {
  let snapshot: WorkflowSnapshot | undefined;
  let corrupt = false;
  let ctx: ExtensionContext | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let routedPath: string | undefined;
  let stopped = false;
  let generation = 0;
  let refreshController = new AbortController();
  let queue: Promise<void> = Promise.resolve();

  const runQueued = async <T>(
    prior: Promise<void>,
    operation: () => Promise<T> | T,
  ): Promise<T> => {
    await prior;
    return await operation();
  };
  const ignoreRejection = async (operation: Promise<unknown>): Promise<void> => {
    try {
      await operation;
    } catch {
      // Fire-and-forget route refreshes are invalidated by lifecycle generation changes.
    }
  };
  const serialize = <T>(operation: () => Promise<T> | T): Promise<T> => {
    const result = runQueued(queue, operation);
    queue = ignoreRejection(result);
    return result;
  };

  const invalidateGeneration = (): {
    readonly generation: number;
    readonly signal: AbortSignal;
  } => {
    generation += 1;
    refreshController.abort();
    refreshController = new AbortController();
    return { generation, signal: refreshController.signal };
  };

  const effectivePath = (current: ExtensionContext): string => routedPath ?? current.cwd;

  const combinedSignal = (signal?: AbortSignal): AbortSignal =>
    signal === undefined
      ? refreshController.signal
      : AbortSignal.any([signal, refreshController.signal]);

  const workspaceIdentity = async (
    current: ExtensionContext,
    signal = refreshController.signal,
  ): Promise<{ readonly branch?: string; readonly head?: string; readonly path: string }> => {
    const path = effectivePath(current);
    signal.throwIfAborted();
    try {
      const [branchResult, headResult] = await Promise.all([
        pi.exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
          cwd: path,
          signal,
          timeout: 2000,
        }),
        pi.exec("git", ["rev-parse", "HEAD"], { cwd: path, signal, timeout: 2000 }),
      ]);
      signal.throwIfAborted();
      const branch = branchResult.code === 0 ? branchResult.stdout.trim() : "";
      const head = headResult.code === 0 ? headResult.stdout.trim() : "";
      return {
        ...(branch === "" || branch === "HEAD" ? {} : { branch }),
        ...(head === "" ? {} : { head }),
        path,
      };
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof Error && error.name === "AbortError") throw error;
      return { path };
    }
  };

  const publish = (current: ExtensionContext): void => {
    if (snapshot === undefined) {
      pi.events.emit(SUMMARY_EVENT, undefined);
      if (current.mode === "tui") current.ui.setStatus(STATUS_KEY, undefined);
      return;
    }
    const summary = workflowSummary(snapshot);
    pi.events.emit(SUMMARY_EVENT, summary);
    if (current.mode === "tui") {
      const slice = summary.activeSlice === undefined ? "" : ` · ${summary.activeSlice}`;
      const backstopWarning = showBackstopWarning(summary) ? " · backstop!" : "";
      const statusLabel =
        summary.status === "blocked" ||
        summary.status === "paused" ||
        summary.status === "completed" ||
        summary.status === "abandoned"
          ? summary.status
          : summary.attention === "ready_to_ship"
            ? "ready"
            : summary.attention === undefined || backstopWarning !== ""
              ? undefined
              : "attention";
      const attention = statusLabel === undefined ? "" : ` · ${statusLabel}`;
      current.ui.setStatus(
        STATUS_KEY,
        `flow ${summary.phase}${slice}${backstopWarning}${attention}`,
      );
    }
  };

  const persist = (next: WorkflowSnapshot, current: ExtensionContext): void => {
    if (stopped) throw new Error("Workflow extension is shutting down.");
    snapshot = next;
    corrupt = false;
    pi.appendEntry(STATE_TYPE, next);
    publish(current);
  };

  const restore = (current: ExtensionContext): void => {
    const restored = snapshotFromBranch(current.sessionManager.getBranch());
    snapshot = restored.snapshot;
    corrupt = restored.corrupt;
    publish(current);
  };

  const requireSnapshot = (): WorkflowSnapshot => {
    if (corrupt)
      throw new Error(
        "Latest workflow ledger entry is malformed; use /dev-workflow recover -- <reason>.",
      );
    if (snapshot === undefined)
      throw new Error("No active workflow. Use /dev-workflow start <title>.");
    return snapshot;
  };

  const refreshWorkspace = async (
    current: ExtensionContext,
    token = generation,
    signal = refreshController.signal,
  ): Promise<void> => {
    if (
      snapshot === undefined ||
      snapshot.status === "abandoned" ||
      snapshot.status === "completed"
    )
      return;
    const identity = await workspaceIdentity(current, signal);
    if (stopped || token !== generation)
      throw new DOMException("Stale workflow refresh", "AbortError");
    const currentSnapshot = requireSnapshot();
    const next = applyWorkflowAction(currentSnapshot, {
      kind: "observe_workspace",
      workspace: identity,
    });
    if (next.revision !== currentSnapshot.revision) persist(next, current);
  };

  const refreshArtifacts = async (
    current: ExtensionContext,
    token = generation,
    signal = refreshController.signal,
  ): Promise<void> => {
    const currentSnapshot = snapshot;
    if (
      currentSnapshot === undefined ||
      currentSnapshot.status === "abandoned" ||
      currentSnapshot.status === "completed"
    )
      return;
    const workspacePath = effectivePath(current);
    const paths = [
      currentSnapshot.artifacts.spec,
      currentSnapshot.artifacts.plan,
      ...currentSnapshot.slices.map((slice) => slice.path),
    ].filter((path): path is string => path !== undefined);
    const missing: string[] = [];
    for (const path of paths) {
      signal.throwIfAborted();
      const absolute = resolve(workspacePath, path);
      if (relative(workspacePath, absolute).startsWith("..")) {
        missing.push(path);
        continue;
      }
      try {
        await access(absolute);
      } catch {
        missing.push(path);
      }
    }
    if (stopped || token !== generation)
      throw new DOMException("Stale workflow refresh", "AbortError");
    if (missing.length === 0) return;
    const latest = requireSnapshot();
    const next = applyWorkflowAction(latest, { kind: "observe_missing_artifacts", paths: missing });
    if (next.revision !== latest.revision) persist(next, current);
  };

  const validateCurrentArtifacts = async (
    current: ExtensionContext,
    signal?: AbortSignal,
    retainSlice: (slice: WorkflowSnapshot["slices"][number]) => boolean = (slice) =>
      slice.status !== "cut",
  ): Promise<void> => {
    const currentSnapshot = requireSnapshot();
    const cwd = effectivePath(current);
    if (currentSnapshot.artifacts.spec !== undefined)
      await validateArtifact(cwd, currentSnapshot.artifacts.spec, "spec", signal);
    if (currentSnapshot.artifacts.plan !== undefined)
      await validateArtifact(cwd, currentSnapshot.artifacts.plan, "plan", signal);
    for (const slice of currentSnapshot.slices) {
      if (retainSlice(slice)) await validateArtifact(cwd, slice.path, "slice", signal);
    }
  };

  const prepareFreshMutation = async (
    current: ExtensionContext,
    signal?: AbortSignal,
    revalidate = false,
  ): Promise<void> => {
    const token = generation;
    const effectiveSignal = combinedSignal(signal);
    await refreshWorkspace(current, token, effectiveSignal);
    await refreshArtifacts(current, token, effectiveSignal);
    if (revalidate) await validateCurrentArtifacts(current, effectiveSignal);
  };

  const prepareCircuitFinish = async (
    current: ExtensionContext,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token = generation;
    const effectiveSignal = combinedSignal(signal);
    await refreshWorkspace(current, token, effectiveSignal);
    await validateCurrentArtifacts(
      current,
      effectiveSignal,
      (slice) => slice.status === "verified",
    );
  };

  const routeHandler = (value: unknown): void => {
    if (value === undefined) {
      routedPath = undefined;
    } else if (
      typeof value === "object" &&
      value !== null &&
      "version" in value &&
      "activePath" in value
    ) {
      const route = value as { activePath?: unknown; version?: unknown };
      if (
        route.version !== 1 ||
        typeof route.activePath !== "string" ||
        route.activePath.trim() === ""
      )
        return;
      routedPath = route.activePath;
    } else {
      return;
    }
    const token = invalidateGeneration();
    const current = ctx;
    if (current !== undefined && !stopped) {
      void ignoreRejection(
        serialize(async () => {
          await refreshWorkspace(current, token.generation, token.signal);
          await refreshArtifacts(current, token.generation, token.signal);
        }),
      );
    }
  };
  const unsubscribeRoute = pi.events.on("mopeyjellyfish:pi-worktrunk:route:v1", routeHandler);

  const lifecycleRefresh = async (current: ExtensionContext): Promise<void> => {
    stopped = false;
    ctx = current;
    const token = invalidateGeneration();
    await serialize(async () => {
      if (token.generation !== generation) return;
      restore(current);
      try {
        await refreshWorkspace(current, token.generation, token.signal);
        await refreshArtifacts(current, token.generation, token.signal);
      } catch (error) {
        if (token.generation !== generation || stopped) return;
        throw error;
      }
    });
  };

  pi.on("session_start", async (_event, current) => {
    await lifecycleRefresh(current);
    if (timer !== undefined) clearInterval(timer);
    timer = setInterval(() => {
      publish(current);
    }, 60_000);
    timer.unref();
  });
  pi.on("session_tree", async (_event, current) => lifecycleRefresh(current));
  pi.on("session_compact", async (_event, current) => lifecycleRefresh(current));
  pi.on("session_shutdown", async (_event, current) => {
    stopped = true;
    invalidateGeneration();
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    unsubscribeRoute();
    await serialize(() => {
      pi.events.emit(SUMMARY_EVENT, undefined);
      if (current.mode === "tui") current.ui.setStatus(STATUS_KEY, undefined);
      ctx = undefined;
    });
  });

  pi.registerTool({
    name: "development_workflow",
    label: "Development Workflow",
    description:
      "Read or update the current pitch-and-slices workflow. The model may record artifacts/evidence, blockers or decision requests, register or update non-cut slice state, request the next transition, and record external outcomes. Human approvals, resolutions, completion, and circuit decisions require /dev-workflow.",
    executionMode: "sequential",
    promptSnippet: "Track pitch, integrated slices, evidence, and human approval gates",
    promptGuidelines: [
      "Use development_workflow status before workflow mutations and request, rather than approve, consequential transitions.",
      "Use development_workflow to register integrated demonstrable slices and record bounded evidence references; use todo only for discovered work inside the active slice.",
      "Never use development_workflow to claim a commit, push, pull request, merge, release, deployment, or other external outcome before it actually occurs.",
    ],
    parameters: DevelopmentWorkflowParameters,
    async execute(_id, input, signal, _update, current) {
      return serialize(async () => {
        signal?.throwIfAborted();
        const action = modelAction(input);
        if (action === undefined) {
          const currentSnapshot = requireSnapshot();
          return {
            content: [{ type: "text", text: formatWorkflow(currentSnapshot) }],
            details: { action: input.action, snapshot: currentSnapshot } satisfies ToolDetails,
          };
        }
        if (
          action.kind === "record_evidence" ||
          action.kind === "record_artifact" ||
          action.kind === "register_slice"
        ) {
          await prepareFreshMutation(current, signal);
        }
        if (action.kind === "record_artifact")
          await validateArtifact(effectivePath(current), action.path, action.artifact, signal);
        if (action.kind === "register_slice")
          await validateArtifact(effectivePath(current), action.path, "slice", signal);
        signal?.throwIfAborted();
        const currentSnapshot = requireSnapshot();
        const boundAction: WorkflowAction =
          action.kind === "record_evidence"
            ? {
                ...action,
                evidence: {
                  ...action.evidence,
                  ...(currentSnapshot.workspace.branch === undefined
                    ? {}
                    : { branch: currentSnapshot.workspace.branch }),
                  ...(currentSnapshot.workspace.head === undefined
                    ? {}
                    : { head: currentSnapshot.workspace.head }),
                },
              }
            : action;
        const next = applyWorkflowAction(currentSnapshot, boundAction);
        persist(next, current);
        return {
          content: [{ type: "text", text: `${input.action} recorded.\n${formatWorkflow(next)}` }],
          details: { action: input.action, snapshot: next } satisfies ToolDetails,
        };
      });
    },
  });

  const statusText = (): string => {
    if (corrupt) return "Workflow ledger is malformed; recovery is required.";
    return snapshot === undefined ? "No active workflow." : formatWorkflow(snapshot);
  };

  const startCommand = async (title: string, current: ExtensionContext): Promise<void> => {
    const running =
      snapshot !== undefined && snapshot.status !== "abandoned" && snapshot.status !== "completed";
    if (running) throw new Error("A workflow is already active in this session.");
    if (corrupt) throw new Error("Recover the malformed ledger before starting another workflow.");
    const initial = createWorkflow(title, effectivePath(current), Date.now());
    const observed = applyWorkflowAction(initial, {
      kind: "observe_workspace",
      workspace: await workspaceIdentity(current, refreshController.signal),
    });
    persist(observed, current);
    notify(current, "Workflow started.");
  };

  const adoptCommand = async (
    command: string,
    reason: string | undefined,
    current: ExtensionContext,
  ): Promise<void> => {
    if (snapshot !== undefined || corrupt)
      throw new Error("Adopt requires an empty, valid workflow ledger.");
    const parts = command.split(/\s+/u);
    const adoptedPhase = phase(parts[1]);
    if (PHASES.indexOf(adoptedPhase) >= PHASES.indexOf("build")) {
      throw new Error(
        "Adoption into build or later requires active wall-clock backstop accounting and is not supported by this command.",
      );
    }
    const spec = required(parts[2], "spec path");
    const adoptionReason = required(reason, "adoption reason");
    const identity = await workspaceIdentity(current, refreshController.signal);
    await validateArtifact(identity.path, spec, "spec", refreshController.signal);
    const initial = createWorkflow(`Adopted ${spec}`, identity.path, Date.now());
    const relativeSpec = relative(identity.path, resolve(identity.path, spec));
    const priorGates = Object.fromEntries(
      PHASES.slice(0, PHASES.indexOf(adoptedPhase)).map((gate) => [gate, true]),
    ) as Partial<Record<WorkflowPhase, true>>;
    const adopted = {
      ...initial,
      artifacts: { spec: relativeSpec },
      attention: derivedAttention(`adopted at ${adoptedPhase}: `, adoptionReason),
      gates: priorGates,
      phase: adoptedPhase,
      revision: 1,
      workspace: identity,
    } satisfies WorkflowSnapshot;
    if (!isWorkflowSnapshot(adopted)) throw new Error("Adopted workflow is invalid.");
    persist(adopted, current);
    notify(current, `Workflow adopted at ${adoptedPhase}.`);
  };

  const recoverCommand = (reason: string | undefined, current: ExtensionContext): void => {
    if (!corrupt) throw new Error("Recovery is available only for a malformed latest entry.");
    const recoveryReason = required(reason, "recovery reason");
    const recovered = {
      ...createWorkflow("Recovered workflow", effectivePath(current), Date.now()),
      attention: derivedAttention("recovered: ", recoveryReason),
    };
    if (!isWorkflowSnapshot(recovered)) throw new Error("Recovered workflow is invalid.");
    persist(recovered, current);
    notify(current, "Workflow ledger recovered with a new bounded snapshot.");
  };

  const handleCommand = async (arguments_: string, current: ExtensionContext): Promise<void> => {
    const { command, reason } = splitReason(arguments_);
    if (command === "" || command === "status") {
      notify(current, statusText());
      return;
    }
    if (command.startsWith("start ")) {
      await startCommand(command.slice(6), current);
      return;
    }
    if (command.startsWith("adopt ")) {
      await adoptCommand(command, reason, current);
      return;
    }
    if (command === "recover") {
      recoverCommand(reason, current);
      return;
    }
    const action = directAction(command, reason, Date.now());
    if (action.kind === "approve" || action.kind === "complete")
      await prepareFreshMutation(current, undefined, true);
    if (action.kind === "circuit" && action.outcome === "finish")
      await prepareCircuitFinish(current);
    persist(applyWorkflowAction(requireSnapshot(), action), current);
    notify(current, "Workflow updated.");
  };

  pi.registerCommand("dev-workflow", {
    description: "Approve and control the current pitch-and-slices workflow",
    handler: async (arguments_, current) => {
      try {
        await serialize(() => handleCommand(arguments_, current));
      } catch (error) {
        notify(current, error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}

export { validatePitchDocument, validatePlanDocument, validateSliceDocument } from "./artifacts.ts";
export * from "./state.ts";
