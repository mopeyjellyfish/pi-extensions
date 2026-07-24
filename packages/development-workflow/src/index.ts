import { createHash } from "node:crypto";
import { access, lstat, open, readlink, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { StringEnum } from "@earendil-works/pi-ai";
import { Type, type Static } from "typebox";

import {
  validatePitchDocument,
  validatePlanDocument,
  validateResearchDocument,
  validateSliceDocument,
  type ArtifactValidation,
} from "./artifacts.ts";
import { checkpointSelection } from "./question.ts";
import {
  CLEAN_TREE_FINGERPRINT,
  PHASES,
  SHIP_ACTIONS,
  STATE_TYPE,
  STATUS_KEY,
  SUMMARY_EVENT,
  applyWorkflowAction,
  canFinishAfterWorktreeRemoval,
  createWorkflow,
  derivedAttention,
  formatWorkflow,
  isWorkflowSnapshot,
  snapshotFromBranch,
  resolveCheckpoint,
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
    artifact: Type.Optional(StringEnum(["plan", "research", "spec"] as const)),
    sliceId: Type.Optional(Type.String({ maxLength: 30, minLength: 1 })),
    claim: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    evidenceKind: Type.Optional(Type.String({ maxLength: 80, minLength: 1 })),
    id: Type.Optional(Type.String({ maxLength: 30, minLength: 1 })),
    issueType: Type.Optional(StringEnum(["blocker", "decision"] as const)),
    path: Type.Optional(Type.String({ maxLength: 300, minLength: 1 })),
    receipt: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    reason: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    reference: Type.Optional(Type.String({ maxLength: 500, minLength: 1 })),
    sensitivity: Type.Optional(StringEnum(["public", "private"] as const)),
    shipAction: Type.Optional(StringEnum(SHIP_ACTIONS)),
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

function recordOutcomeAction(input: DevelopmentWorkflowInput): WorkflowAction {
  ensureOnly(input, ["receipt", "shipAction"]);
  return {
    kind: "record_outcome",
    receipt: required(input.receipt, "receipt"),
    shipAction:
      input.shipAction ??
      (() => {
        throw new Error("shipAction is required.");
      })(),
  };
}

function recordEvidenceAction(input: DevelopmentWorkflowInput): WorkflowAction {
  ensureOnly(input, ["claim", "evidenceKind", "reference", "sensitivity", "sliceId"]);
  const evidence: WorkflowEvidence = {
    claim: required(input.claim, "claim"),
    kind: required(input.evidenceKind, "evidenceKind"),
    ...(input.sliceId === undefined ? {} : { sliceId: input.sliceId }),
    reference: required(input.reference, "reference"),
    sensitivity: input.sensitivity ?? "private",
  };
  return { evidence, kind: "record_evidence" };
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
    case "record_evidence":
      return recordEvidenceAction(input);
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
      return recordOutcomeAction(input);
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
const MAX_TREE_PATHS = 1000;
const MAX_TREE_PATH_BYTES = 100_000;
const HASH_BATCH_SIZE = 100;

function pathEscapesWorkspace(root: string, absolute: string): boolean {
  const fromRoot = relative(root, absolute);
  return isAbsolute(fromRoot) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`);
}

function authorizedWorkspaceIsClean(
  authorization: { readonly branch?: string; readonly path: string },
  workspace: WorkflowSnapshot["workspace"],
): boolean {
  return (
    authorization.path === workspace.path &&
    authorization.branch === workspace.branch &&
    workspace.tree === CLEAN_TREE_FINGERPRINT
  );
}

function sameCleanWorkspace(
  left: WorkflowSnapshot["workspace"],
  right: WorkflowSnapshot["workspace"],
): boolean {
  return (
    left.path === right.path &&
    left.branch === right.branch &&
    left.head === right.head &&
    left.tree === CLEAN_TREE_FINGERPRINT
  );
}

function dirtyPaths(tracked: string, untracked: string): string[] {
  const names = `${tracked}${untracked}`;
  if (Buffer.byteLength(names, "utf8") > MAX_TREE_PATH_BYTES)
    throw new Error("Git worktree fingerprint exceeds the path-byte limit.");
  const paths = [...new Set(names.split("\0").filter((item) => item !== ""))].sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)),
  );
  if (paths.length > MAX_TREE_PATHS)
    throw new Error("Git worktree fingerprint exceeds the changed-path limit.");
  return paths;
}

interface GitTreeEntry {
  readonly mode: "100644" | "100755" | "120000";
  readonly object: string;
}

function gitBlobObject(content: string, format: "sha1" | "sha256"): string {
  const bytes = Buffer.from(content);
  return createHash(format)
    .update(`blob ${String(bytes.length)}\0`)
    .update(bytes)
    .digest("hex");
}

async function inspectPresentFingerprintPath(
  absolute: string,
  path: string,
  treeEntries: ReadonlyMap<string, GitTreeEntry> | undefined,
): Promise<{ readonly hashable?: true; readonly record: string; readonly symlink?: string }> {
  const treeEntry = treeEntries?.get(path);
  if (treeEntry !== undefined) return { record: `${treeEntry.mode}:${treeEntry.object}` };
  const stats = await lstat(absolute);
  if (treeEntries !== undefined)
    throw new Error(`Committed Git tree is missing changed path: ${path}`);
  if (stats.isSymbolicLink()) return { record: "120000:", symlink: await readlink(absolute) };
  if (stats.isDirectory())
    throw new Error(`Cannot fingerprint changed directory or submodule: ${path}`);
  return {
    hashable: true,
    record: (stats.mode & 0o111) === 0 ? "100644:" : "100755:",
  };
}

async function inspectFingerprintPaths(
  root: string,
  paths: readonly string[],
  signal: AbortSignal,
  treeEntries?: ReadonlyMap<string, GitTreeEntry>,
): Promise<{
  readonly hashable: string[];
  readonly records: Map<string, string>;
  readonly symlinks: ReadonlyMap<string, string>;
}> {
  const hashable: string[] = [];
  const records = new Map<string, string>();
  const symlinks = new Map<string, string>();
  for (const path of paths) {
    signal.throwIfAborted();
    const absolute = resolve(root, path);
    if (pathEscapesWorkspace(root, absolute))
      throw new Error("Git returned a worktree path outside the workspace.");
    try {
      const inspected = await inspectPresentFingerprintPath(absolute, path, treeEntries);
      records.set(path, inspected.record);
      if (inspected.hashable === true) hashable.push(path);
      if (inspected.symlink !== undefined) symlinks.set(path, inspected.symlink);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      records.set(path, "deleted");
    }
  }
  return { hashable, records, symlinks };
}

function skipArtifactRefresh(snapshot: WorkflowSnapshot): boolean {
  return (
    snapshot.status === "abandoned" ||
    snapshot.status === "completed" ||
    snapshot.pendingShipAction?.action === "worktree-removal" ||
    canFinishAfterWorktreeRemoval(snapshot)
  );
}

async function validateArtifact(
  cwd: string,
  path: string,
  artifact: "plan" | "research" | "spec" | "slice",
  signal?: AbortSignal,
): Promise<ArtifactValidation> {
  signal?.throwIfAborted();
  const absolute = resolve(cwd, path);
  if (pathEscapesWorkspace(cwd, absolute)) throw new Error("Artifact path escapes the workspace.");
  const [canonicalCwd, canonical] = await Promise.all([realpath(cwd), realpath(absolute)]);
  if (pathEscapesWorkspace(canonicalCwd, canonical))
    throw new Error("Artifact symlink target escapes the workspace.");
  const file = await open(canonical, "r");
  try {
    const buffer = Buffer.alloc(MAX_ARTIFACT_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    signal?.throwIfAborted();
    if (bytesRead > MAX_ARTIFACT_BYTES) {
      throw new Error(`Artifact exceeds ${String(MAX_ARTIFACT_BYTES)} bytes.`);
    }
    const source = buffer.toString("utf8", 0, bytesRead);
    if (artifact === "research") return validateResearchDocument(source);
    if (artifact === "spec") return validatePitchDocument(source);
    if (artifact === "slice") return validateSliceDocument(source);
    return validatePlanDocument(source);
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

function shipAction(value: string | undefined): (typeof SHIP_ACTIONS)[number] {
  if (value === undefined || !SHIP_ACTIONS.includes(value as (typeof SHIP_ACTIONS)[number])) {
    throw new Error(`Ship action must be one of: ${SHIP_ACTIONS.join(", ")}.`);
  }
  return value as (typeof SHIP_ACTIONS)[number];
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

function shipControlAction(
  parts: readonly string[],
  reason: string | undefined,
  now: number,
): WorkflowAction {
  switch (parts[0]) {
    case "authorize":
      return {
        action: shipAction(parts[1]),
        kind: "authorize_ship",
        now,
        reason: required(reason, "ship authorization reason"),
      };
    case "cancel":
      if (parts[1] !== "authorization")
        throw new Error("Cancel action must be: cancel authorization -- <reason>.");
      return {
        kind: "cancel_ship",
        now,
        reason: required(reason, "ship authorization cancellation reason"),
      };
    case "finish":
      return { kind: "finish", now, reason: required(reason, "completion reason") };
    case undefined:
    default:
      throw new Error("Unknown ship control action.");
  }
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
    case "authorize":
    case "cancel":
    case "finish":
      return shipControlAction(parts, reason, now);
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

  const fingerprintPaths = async (
    path: string,
    paths: readonly string[],
    signal: AbortSignal,
    treeEntries?: ReadonlyMap<string, GitTreeEntry>,
  ): Promise<string> => {
    const { hashable, records, symlinks } = await inspectFingerprintPaths(
      path,
      paths,
      signal,
      treeEntries,
    );
    if (symlinks.size > 0) {
      const formatResult = await pi.exec("git", ["rev-parse", "--show-object-format"], {
        cwd: path,
        signal,
        timeout: 2000,
      });
      const format = formatResult.stdout.trim();
      if (formatResult.code !== 0 || (format !== "sha1" && format !== "sha256"))
        throw new Error("Unable to determine the Git object format for symlink fingerprinting.");
      for (const [relativePath, target] of symlinks)
        records.set(relativePath, `120000:${gitBlobObject(target, format)}`);
    }
    for (let start = 0; start < hashable.length; start += HASH_BATCH_SIZE) {
      signal.throwIfAborted();
      const batch = hashable.slice(start, start + HASH_BATCH_SIZE);
      const result = await pi.exec("git", ["hash-object", "--no-filters", "--", ...batch], {
        cwd: path,
        signal,
        timeout: 2000,
      });
      signal.throwIfAborted();
      const hashes = result.stdout.trim() === "" ? [] : result.stdout.trim().split("\n");
      if (result.code !== 0 || hashes.length !== batch.length)
        throw new Error("Unable to hash changed files within the fingerprint bounds.");
      for (const [index, item] of batch.entries())
        records.set(item, `${records.get(item) ?? ""}${hashes[index] ?? ""}`);
    }
    const digest = createHash("sha256");
    for (const relativePath of paths) {
      digest.update(relativePath);
      digest.update("\0");
      digest.update(records.get(relativePath) ?? "");
      digest.update("\0");
    }
    return `sha256:${digest.digest("hex")}`;
  };

  const dirtyTreeFingerprint = async (
    path: string,
    head: string,
    signal: AbortSignal,
  ): Promise<string> => {
    const [trackedResult, untrackedResult] = await Promise.all([
      pi.exec("git", ["--no-replace-objects", "diff", "--name-only", "-z", head, "--"], {
        cwd: path,
        signal,
        timeout: 2000,
      }),
      pi.exec("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
        cwd: path,
        signal,
        timeout: 2000,
      }),
    ]);
    signal.throwIfAborted();
    if (trackedResult.code !== 0 || untrackedResult.code !== 0)
      throw new Error("Unable to fingerprint the current Git worktree.");

    return fingerprintPaths(path, dirtyPaths(trackedResult.stdout, untrackedResult.stdout), signal);
  };

  const workspaceIdentity = async (
    current: ExtensionContext,
    signal = refreshController.signal,
  ): Promise<{
    readonly branch?: string;
    readonly head?: string;
    readonly path: string;
    readonly tree?: string;
  }> => {
    const path = effectivePath(current);
    signal.throwIfAborted();
    let branchResult;
    let headResult;
    try {
      [branchResult, headResult] = await Promise.all([
        pi.exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
          cwd: path,
          signal,
          timeout: 2000,
        }),
        pi.exec("git", ["rev-parse", "HEAD"], { cwd: path, signal, timeout: 2000 }),
      ]);
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof Error && error.name === "AbortError") throw error;
      return { path };
    }
    signal.throwIfAborted();
    const branch = branchResult.code === 0 ? branchResult.stdout.trim() : "";
    const head = headResult.code === 0 ? headResult.stdout.trim() : "";
    if (head === "") return { path };
    const tree = await dirtyTreeFingerprint(path, head, signal);
    return {
      ...(branch === "" || branch === "HEAD" ? {} : { branch }),
      head,
      path,
      tree,
    };
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
    if (currentSnapshot === undefined || skipArtifactRefresh(currentSnapshot)) return;
    const workspacePath = effectivePath(current);
    const paths = [
      currentSnapshot.artifacts.research,
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
    if (currentSnapshot.artifacts.research !== undefined)
      await validateArtifact(cwd, currentSnapshot.artifacts.research, "research", signal);
    if (currentSnapshot.artifacts.spec !== undefined)
      await validateArtifact(cwd, currentSnapshot.artifacts.spec, "spec", signal);
    if (currentSnapshot.artifacts.plan !== undefined)
      await validateArtifact(cwd, currentSnapshot.artifacts.plan, "plan", signal);
    for (const slice of currentSnapshot.slices) {
      if (!retainSlice(slice)) continue;
      const validation = await validateArtifact(cwd, slice.path, "slice", signal);
      const registeredDependencies = slice.dependsOn ?? [];
      const artifactDependencies = validation.dependsOn ?? [];
      if (
        validation.id !== slice.id ||
        artifactDependencies.length !== registeredDependencies.length ||
        artifactDependencies.some(
          (dependency, index) => dependency !== registeredDependencies[index],
        )
      )
        throw new Error(
          `Slice ${slice.id} identity or dependency graph changed after registration.`,
        );
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

  // Question is optional. This listener is inert unless its exact, documented payload matches.
  pi.on("tool_result", async (event, current) => {
    const pending = snapshot?.pendingCheckpoint;
    if (pending === undefined || stopped) return;
    const selection = checkpointSelection(event, pending.phase, pending.question);
    if (selection === undefined) return;
    await serialize(async () => {
      const latest = requireSnapshot();
      const checkpoint = latest.pendingCheckpoint;
      if (checkpoint === undefined) return;
      const exact = checkpointSelection(event, checkpoint.phase, checkpoint.question);
      if (exact === undefined) return;
      await prepareFreshMutation(current, undefined, true);
      persist(resolveCheckpoint(requireSnapshot(), exact, Date.now()), current);
      notify(
        current,
        exact === "advance"
          ? `Advanced from ${checkpoint.phase}.`
          : `Refine ${checkpoint.phase} evidence.`,
      );
    });
  });

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

  const committedTreeEntries = async (
    path: string,
    commit: string,
    paths: readonly string[],
    signal: AbortSignal,
  ): Promise<ReadonlyMap<string, GitTreeEntry>> => {
    const result = await pi.exec(
      "git",
      ["--no-replace-objects", "ls-tree", "-z", commit, "--", ...paths],
      {
        cwd: path,
        signal,
        timeout: 2000,
      },
    );
    if (result.code !== 0) throw new Error("Unable to inspect committed Git tree entries.");
    const entries = new Map<string, GitTreeEntry>();
    for (const raw of result.stdout.split("\0").filter((item) => item !== "")) {
      const separator = raw.indexOf("\t");
      const metadata = separator === -1 ? [] : raw.slice(0, separator).split(" ");
      const relativePath = separator === -1 ? "" : raw.slice(separator + 1);
      const [mode, type, object] = metadata;
      if (
        (mode !== "100644" && mode !== "100755" && mode !== "120000") ||
        type !== "blob" ||
        object === undefined ||
        !/^[0-9a-f]{40,64}$/u.test(object) ||
        !paths.includes(relativePath) ||
        entries.has(relativePath)
      )
        throw new Error("Committed Git tree returned an invalid changed-path entry.");
      entries.set(relativePath, { mode, object });
    }
    return entries;
  };

  const validateCommitBinding = async (
    current: ExtensionContext,
    signal?: AbortSignal,
  ): Promise<void> => {
    const before = requireSnapshot().pendingShipAction;
    if (before?.action !== "commit") return;
    const effectiveSignal = combinedSignal(signal);
    await refreshWorkspace(current, generation, effectiveSignal);
    const after = requireSnapshot().workspace;
    if (!authorizedWorkspaceIsClean(before, after))
      throw new Error(
        "Commit receipt requires the authorized branch/path and a clean resulting tree.",
      );
    if (before.head === undefined || after.head === undefined || before.tree === undefined)
      throw new Error("Commit receipt requires authorized HEAD and dirty fingerprint provenance.");
    const parents = await pi.exec(
      "git",
      ["--no-replace-objects", "rev-list", "--parents", "-n", "1", after.head],
      {
        cwd: after.path,
        signal: effectiveSignal,
        timeout: 2000,
      },
    );
    const fields = parents.stdout.trim().split(/\s+/u);
    if (
      parents.code !== 0 ||
      fields.length !== 2 ||
      fields[0] !== after.head ||
      fields[1] !== before.head
    )
      throw new Error(
        "Commit receipt requires exactly one direct-child commit from the authorized HEAD.",
      );
    const changed = await pi.exec(
      "git",
      ["--no-replace-objects", "diff", "--name-only", "-z", before.head, after.head, "--"],
      {
        cwd: after.path,
        signal: effectiveSignal,
        timeout: 2000,
      },
    );
    if (changed.code !== 0) throw new Error("Unable to fingerprint the authorized commit delta.");
    const paths = dirtyPaths(changed.stdout, "");
    const treeEntries = await committedTreeEntries(after.path, after.head, paths, effectiveSignal);
    const digest = await fingerprintPaths(after.path, paths, effectiveSignal, treeEntries);
    if (digest !== before.tree)
      throw new Error("Commit delta does not exactly match the authorized dirty fingerprint.");
    await refreshWorkspace(current, generation, effectiveSignal);
    const finalWorkspace = requireSnapshot().workspace;
    if (!sameCleanWorkspace(finalWorkspace, after))
      throw new Error("Workspace changed during commit receipt validation; retry from review.");
  };

  const prepareModelMutation = async (
    action: WorkflowAction,
    current: ExtensionContext,
    signal?: AbortSignal,
  ): Promise<void> => {
    if (action.kind === "request_transition") {
      await prepareFreshMutation(current, signal, true);
      return;
    }
    if (action.kind === "record_outcome" && action.shipAction === "commit") {
      await validateCommitBinding(current, signal);
      return;
    }
    if (action.kind === "record_outcome" && action.shipAction === "worktree-removal") {
      const authorization = requireSnapshot().pendingShipAction;
      await refreshWorkspace(current, generation, combinedSignal(signal));
      if (authorization?.action !== "worktree-removal") return;
      try {
        await lstat(authorization.path);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
        throw error;
      }
      throw new Error("Authorized worktree path still exists; removal receipt cannot be recorded.");
    }
    const refreshKinds: readonly WorkflowAction["kind"][] = [
      "record_artifact",
      "record_evidence",
      "record_outcome",
      "register_slice",
    ];
    if (refreshKinds.includes(action.kind)) await prepareFreshMutation(current, signal);
  };

  const validateActionArtifact = async (
    action: WorkflowAction,
    current: ExtensionContext,
    signal?: AbortSignal,
  ): Promise<ArtifactValidation | undefined> => {
    if (action.kind === "record_artifact") {
      await validateArtifact(effectivePath(current), action.path, action.artifact, signal);
      return undefined;
    }
    return action.kind === "register_slice"
      ? validateArtifact(effectivePath(current), action.path, "slice", signal)
      : undefined;
  };

  const evidenceSliceId = (
    action: Extract<WorkflowAction, { kind: "record_evidence" }>,
    currentSnapshot: WorkflowSnapshot,
  ): string | undefined => {
    const active = currentSnapshot.slices.find((slice) => slice.status === "active")?.id;
    if (active !== undefined || currentSnapshot.phase !== "review") return active;
    return currentSnapshot.slices.find(
      (slice) =>
        slice.status === "verified" &&
        currentSnapshot.evidence.every(
          (item) =>
            item.phase !== "review" ||
            item.sliceId !== slice.id ||
            item.kind !== action.evidence.kind ||
            item.stale === true,
        ),
    )?.id;
  };

  const bindModelAction = (
    action: WorkflowAction,
    currentSnapshot: WorkflowSnapshot,
    sliceValidation: ArtifactValidation | undefined,
  ): WorkflowAction => {
    if (action.kind === "register_slice") {
      if (sliceValidation?.id !== action.id)
        throw new Error(
          `Slice document id ${sliceValidation?.id ?? "unknown"} does not match requested id ${action.id}.`,
        );
      return sliceValidation.dependsOn === undefined
        ? action
        : { ...action, dependsOn: sliceValidation.dependsOn };
    }
    if (action.kind !== "record_evidence") return action;
    const sliceId = action.evidence.sliceId ?? evidenceSliceId(action, currentSnapshot);
    return {
      ...action,
      evidence: {
        ...action.evidence,
        ...(sliceId === undefined ? {} : { sliceId }),
        ...(currentSnapshot.workspace.branch === undefined
          ? {}
          : { branch: currentSnapshot.workspace.branch }),
        ...(currentSnapshot.workspace.head === undefined
          ? {}
          : { head: currentSnapshot.workspace.head }),
        ...(currentSnapshot.workspace.tree === undefined
          ? {}
          : { tree: currentSnapshot.workspace.tree }),
      },
    };
  };

  pi.registerTool({
    name: "development_workflow",
    label: "Development Workflow",
    description:
      "Read or update the deterministic research, pitch, slices, build, review, and ship workflow. The model records phase/slice-bound artifacts and evidence, follows the computed next action, and requests shaping checkpoints. Exact Question results approve Discover/Pitch/Plan in the same interaction; shipping authorization/completion, resolutions, and circuit decisions remain direct.",
    executionMode: "sequential",
    promptSnippet:
      "Track the researched pitch, integrated slices, evidence gates, and human product decisions",
    promptGuidelines: [
      "Use development_workflow status before workflow mutations and request, rather than approve, consequential transitions.",
      "Resolve the effective workspace before starting the ledger, then create validated research.md from repository truth plus the bounded external prior-art pass before requesting Pitch.",
      "Run and record the required Pitch, Plan, and per-slice simplification passes; prefer existing seams, standard library, native capability, installed dependencies, and the minimum surgical change without weakening fixed floors.",
      "Use development_workflow to register integrated demonstrable slices and record bounded evidence references with the computed slice ID; use todo only for discovered work inside the active slice.",
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
        await prepareModelMutation(action, current, signal);
        const sliceValidation = await validateActionArtifact(action, current, signal);
        signal?.throwIfAborted();
        const currentSnapshot = requireSnapshot();
        const next = applyWorkflowAction(
          currentSnapshot,
          bindModelAction(action, currentSnapshot, sliceValidation),
        );
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
    if (parts[1] === "pitch" || parts[1] === "plan")
      throw new Error(
        "Adoption never infers approved Pitch or Plan semantics; it always starts at Discover.",
      );
    const spec = required(parts[1], "spec path");
    const adoptionReason = required(reason, "adoption reason");
    const identity = await workspaceIdentity(current, refreshController.signal);
    await validateArtifact(identity.path, spec, "spec", refreshController.signal);
    const initial = createWorkflow(`Adopted ${spec}`, identity.path, Date.now());
    const adopted = {
      ...initial,
      artifacts: { spec: relative(identity.path, resolve(identity.path, spec)) },
      attention: derivedAttention("adopted artifacts; begin discovery: ", adoptionReason),
      revision: 1,
      workspace: identity,
    } satisfies WorkflowSnapshot;
    if (!isWorkflowSnapshot(adopted)) throw new Error("Adopted workflow is invalid.");
    persist(adopted, current);
    notify(current, "Artifacts adopted; discovery starts without inferred gates or evidence.");
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
    const finishAfterRemoval =
      action.kind === "finish" && canFinishAfterWorktreeRemoval(requireSnapshot());
    if (
      action.kind === "approve" ||
      action.kind === "authorize_ship" ||
      (action.kind === "finish" && !finishAfterRemoval)
    )
      await prepareFreshMutation(current, undefined, true);
    if (action.kind === "circuit" && action.outcome === "finish")
      await prepareCircuitFinish(current);
    persist(applyWorkflowAction(requireSnapshot(), action), current);
    notify(current, "Workflow updated.");
  };

  pi.registerCommand("dev-workflow", {
    description: "Approve Pitch/Plan decisions and control the current pitch-and-slices workflow",
    handler: async (arguments_, current) => {
      try {
        await serialize(() => handleCommand(arguments_, current));
      } catch (error) {
        notify(current, error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}

export {
  validatePitchDocument,
  validatePlanDocument,
  validateResearchDocument,
  validateSliceDocument,
} from "./artifacts.ts";
export { checkpointQuestion, checkpointSelection } from "./question.ts";
export * from "./state.ts";
