export const STATE_TYPE = "mopeyjellyfish-pi-development-workflow-state";
export const SUMMARY_EVENT = "mopeyjellyfish:pi-development-workflow:summary:v1";
export const STATUS_KEY = "mopeyjellyfish-pi-development-workflow";

export const PHASES = ["discover", "pitch", "plan", "build", "review", "ship"] as const;
export type WorkflowPhase = (typeof PHASES)[number];
export type WorkflowStatus = "active" | "paused" | "blocked" | "abandoned" | "completed";
export type SliceStatus = "planned" | "active" | "blocked" | "verified" | "cut";
export type BackstopState = "not_started" | "active" | "attention" | "expired";
export type WorkflowIssueType = "blocker" | "decision";

export interface WorkflowSlice {
  readonly id: string;
  readonly path: string;
  readonly status: SliceStatus;
}

export interface WorkflowEvidence {
  readonly branch?: string;
  readonly claim: string;
  readonly head?: string;
  readonly kind: string;
  readonly reference: string;
  readonly sensitivity: "public" | "private";
  readonly stale?: true;
}

export interface WorkflowIssue {
  readonly id: string;
  readonly issueType: WorkflowIssueType;
  readonly reason: string;
}

export interface WorkflowDecisionResolution {
  readonly id: string;
  readonly reason: string;
  readonly timestamp: number;
}

export interface WorkflowSnapshot {
  readonly backstop?: {
    readonly durationMs: number;
    readonly label: string;
    readonly startedAt?: number;
  };
  readonly artifacts: { readonly plan?: string; readonly spec?: string };
  readonly attention?: string;
  readonly evidence: readonly WorkflowEvidence[];
  readonly gates: Readonly<Partial<Record<WorkflowPhase, true>>>;
  readonly outcomes: readonly string[];
  readonly phase: WorkflowPhase;
  readonly resolvedDecisions: readonly WorkflowDecisionResolution[];
  readonly revision: number;
  readonly slices: readonly WorkflowSlice[];
  readonly status: WorkflowStatus;
  readonly title: string;
  readonly transitionRequest?: { readonly reason: string; readonly to: WorkflowPhase };
  readonly unresolved: readonly WorkflowIssue[];
  readonly version: 1;
  readonly workflowId: string;
  readonly workspace: { readonly branch?: string; readonly head?: string; readonly path: string };
}

export interface WorkflowSummaryEventV1 {
  readonly activeSlice?: string;
  readonly backstop: BackstopState;
  readonly attention?: string;
  readonly phase: WorkflowPhase;
  readonly status: WorkflowStatus;
  readonly title: string;
  readonly version: 1;
  readonly workflowId: string;
}

export type WorkflowAction =
  | { readonly kind: "set_backstop"; readonly duration: string }
  | { readonly kind: "record_artifact"; readonly artifact: "plan" | "spec"; readonly path: string }
  | { readonly kind: "register_slice"; readonly id: string; readonly path: string }
  | {
      readonly kind: "set_slice";
      readonly id: string;
      readonly reason?: string;
      readonly status: SliceStatus;
    }
  | {
      readonly kind: "restore_slice";
      readonly id: string;
      readonly reason: string;
      readonly status: Exclude<SliceStatus, "cut">;
    }
  | { readonly kind: "record_evidence"; readonly evidence: WorkflowEvidence }
  | {
      readonly kind: "record_issue";
      readonly id: string;
      readonly issueType: WorkflowIssueType;
      readonly reason: string;
    }
  | { readonly kind: "resolve_issue"; readonly id: string; readonly reason: string }
  | { readonly kind: "request_transition"; readonly reason: string; readonly to: WorkflowPhase }
  | {
      readonly kind: "approve";
      readonly gate: Exclude<WorkflowPhase, "ship">;
      readonly now: number;
    }
  | { readonly kind: "rewind"; readonly phase: WorkflowPhase; readonly reason: string }
  | { readonly kind: "pause"; readonly now: number; readonly reason: string }
  | { readonly kind: "resume"; readonly now: number }
  | {
      readonly duration?: string;
      readonly kind: "circuit";
      readonly now: number;
      readonly outcome: "finish" | "reshape" | "extend" | "abandon";
      readonly reason: string;
    }
  | { readonly kind: "abandon"; readonly reason: string }
  | { readonly kind: "record_outcome"; readonly outcome: string }
  | { readonly kind: "complete"; readonly reason: string }
  | {
      readonly kind: "observe_workspace";
      readonly workspace: {
        readonly branch?: string;
        readonly head?: string;
        readonly path: string;
      };
    }
  | { readonly kind: "observe_missing_artifacts"; readonly paths: readonly string[] };

const MAX_SLICES = 50;
const MAX_EVIDENCE = 100;
const MAX_OUTCOMES = 50;
const MAX_ISSUES = 20;
const MAX_RESOLVED_DECISIONS = 50;
const MAX_TEXT = 500;
const MAX_BACKSTOP_MS = 12 * 7 * 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
}

function boundedText(value: unknown, label: string, maximum = MAX_TEXT): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a string.`);
  const text = value.trim();
  if (text.length === 0 || text.length > maximum)
    throw new Error(`${label} must contain 1-${String(maximum)} characters.`);
  return text;
}

function validText(value: unknown, maximum = MAX_TEXT): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maximum;
}

export function derivedAttention(prefix: string, detail = ""): string {
  const text = `${prefix}${detail}`.trim().slice(0, MAX_TEXT).trim();
  if (text.length === 0) throw new Error("Derived attention must not be empty.");
  return text;
}

function relativePath(value: unknown, label: string): string {
  const path = boundedText(value, label, 300).replaceAll("\\", "/");
  if (path.startsWith("/") || path.split("/").includes(".."))
    throw new Error(`${label} must be a project-relative path without .. segments.`);
  return path.replace(/^\.\//u, "");
}

function validRelativePath(value: unknown): value is string {
  if (!validText(value, 300)) return false;
  const path = value.replaceAll("\\", "/");
  return !path.startsWith("/") && !path.split("/").includes("..");
}

function finiteTimestamp(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Number.isSafeInteger(value) && value >= 0
  );
}

export function parseBackstop(value: string): {
  readonly label: string;
  readonly milliseconds: number;
} {
  const match = /^(\d+)([hdw])$/u.exec(value.trim());
  if (match?.[1] === undefined || match[2] === undefined)
    throw new Error("The wall-clock backstop must use Nh, Nd, or Nw syntax.");
  const amount = Number(match[1]);
  const units: Readonly<Record<string, number>> = { d: 86_400_000, h: 3_600_000, w: 604_800_000 };
  const milliseconds = amount * (units[match[2]] ?? 0);
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0 || milliseconds > MAX_BACKSTOP_MS)
    throw new Error("The wall-clock backstop must be positive and no longer than 12 weeks.");
  return { label: `${String(amount)}${match[2]}`, milliseconds };
}

export function backstopState(snapshot: WorkflowSnapshot, now: number): BackstopState {
  const backstop = snapshot.backstop;
  if (backstop?.startedAt === undefined) return "not_started";
  const elapsed = Math.max(0, now - backstop.startedAt);
  if (elapsed >= backstop.durationMs) return "expired";
  return elapsed >= backstop.durationMs * 0.8 ? "attention" : "active";
}

function clone(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return structuredClone(snapshot);
}

export function createWorkflow(
  title: string,
  workspacePath: string,
  now: number,
): WorkflowSnapshot {
  if (!finiteTimestamp(now))
    throw new Error("Workflow start time must be a finite non-negative integer.");
  const safeTitle = boundedText(title, "Workflow title", 120);
  const path = boundedText(workspacePath, "Workspace path", 500);
  const result: WorkflowSnapshot = {
    artifacts: {},
    evidence: [],
    gates: {},
    outcomes: [],
    phase: "discover",
    resolvedDecisions: [],
    revision: 0,
    slices: [],
    status: "active",
    title: safeTitle,
    unresolved: [],
    version: 1,
    workflowId: `workflow-${now.toString(36)}`,
    workspace: { path },
  };
  if (!isWorkflowSnapshot(result)) throw new Error("New workflow violated snapshot invariants.");
  return result;
}

function isPhase(value: unknown): value is WorkflowPhase {
  return PHASES.includes(value as WorkflowPhase);
}
function isStatus(value: unknown): value is WorkflowStatus {
  return ["active", "paused", "blocked", "abandoned", "completed"].includes(String(value));
}
function isSliceStatus(value: unknown): value is SliceStatus {
  return ["planned", "active", "blocked", "verified", "cut"].includes(String(value));
}

function isWorkspace(value: unknown): value is WorkflowSnapshot["workspace"] {
  if (
    !isRecord(value) ||
    !exactKeys(value, ["path"], ["branch", "head"]) ||
    !validText(value["path"], 500)
  )
    return false;
  return (
    (value["branch"] === undefined || validText(value["branch"], 200)) &&
    (value["head"] === undefined || validText(value["head"], 100))
  );
}

function isBackstop(value: unknown): value is NonNullable<WorkflowSnapshot["backstop"]> {
  if (!isRecord(value) || !exactKeys(value, ["durationMs", "label"], ["startedAt"])) return false;
  const duration = value["durationMs"];
  return (
    validText(value["label"], 20) &&
    finiteTimestamp(duration) &&
    duration > 0 &&
    duration <= MAX_BACKSTOP_MS &&
    (value["startedAt"] === undefined || finiteTimestamp(value["startedAt"]))
  );
}

function isEvidence(value: unknown): value is WorkflowEvidence {
  if (
    !isRecord(value) ||
    !exactKeys(value, ["claim", "kind", "reference", "sensitivity"], ["branch", "head", "stale"])
  )
    return false;
  return (
    validText(value["claim"]) &&
    validText(value["kind"], 80) &&
    validText(value["reference"]) &&
    (value["sensitivity"] === "public" || value["sensitivity"] === "private") &&
    (value["branch"] === undefined || validText(value["branch"], 200)) &&
    (value["head"] === undefined || validText(value["head"], 100)) &&
    (value["stale"] === undefined || value["stale"] === true)
  );
}

function isSlice(value: unknown): value is WorkflowSlice {
  return (
    isRecord(value) &&
    exactKeys(value, ["id", "path", "status"]) &&
    typeof value["id"] === "string" &&
    /^VS-\d{3,}$/u.test(value["id"]) &&
    validRelativePath(value["path"]) &&
    isSliceStatus(value["status"])
  );
}

function isIssue(value: unknown): value is WorkflowIssue {
  return (
    isRecord(value) &&
    exactKeys(value, ["id", "issueType", "reason"]) &&
    typeof value["id"] === "string" &&
    /^(?:BLK|DEC)-\d{3,}$/u.test(value["id"]) &&
    (value["issueType"] === "blocker" || value["issueType"] === "decision") &&
    validText(value["reason"])
  );
}

function isDecisionResolution(value: unknown): value is WorkflowDecisionResolution {
  return (
    isRecord(value) &&
    exactKeys(value, ["id", "reason", "timestamp"]) &&
    typeof value["id"] === "string" &&
    /^DEC-\d{3,}$/u.test(value["id"]) &&
    validText(value["reason"]) &&
    finiteTimestamp(value["timestamp"])
  );
}

function validGates(value: unknown, phase: WorkflowPhase): value is WorkflowSnapshot["gates"] {
  if (
    !isRecord(value) ||
    Object.entries(value).some(
      ([gate, approved]) => !(isPhase(gate) && gate !== "ship" && approved === true),
    )
  )
    return false;
  const gateCount = Object.keys(value).length;
  for (let index = 0; index < gateCount; index += 1)
    if (value[PHASES[index] as string] !== true) return false;
  return gateCount === PHASES.indexOf(phase);
}

function validUnresolvedStatus(status: WorkflowStatus, count: number): boolean {
  if (status === "blocked") return count > 0;
  return status === "abandoned" || status === "completed" || count === 0;
}

function validPhaseStatus(value: Record<string, unknown>): boolean {
  const phase = value["phase"] as WorkflowPhase;
  const status = value["status"] as WorkflowStatus;
  if (status === "completed" && phase !== "ship") return false;
  const unresolved = value["unresolved"] as readonly WorkflowIssue[];
  if (!validUnresolvedStatus(status, unresolved.length)) return false;
  const backstop = value["backstop"] as WorkflowSnapshot["backstop"];
  const laterPhase = PHASES.indexOf(phase) >= PHASES.indexOf("build");
  return !laterPhase || status === "abandoned" || backstop?.startedAt !== undefined;
}

function validIdentity(value: Record<string, unknown>): boolean {
  return (
    value["version"] === 1 &&
    typeof value["workflowId"] === "string" &&
    /^workflow-[a-z0-9-]+$/u.test(value["workflowId"]) &&
    validText(value["title"], 120) &&
    finiteTimestamp(value["revision"]) &&
    isPhase(value["phase"]) &&
    isStatus(value["status"]) &&
    isWorkspace(value["workspace"])
  );
}

function validArtifacts(value: unknown): boolean {
  if (!isRecord(value) || !exactKeys(value, [], ["plan", "spec"])) return false;
  const planValid = value["plan"] === undefined || validRelativePath(value["plan"]);
  const specValid = value["spec"] === undefined || validRelativePath(value["spec"]);
  return planValid && specValid;
}

function validSlices(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > MAX_SLICES || !value.every(isSlice)) return false;
  const slices = value as readonly WorkflowSlice[];
  const unique = new Set(slices.map((item) => item.id)).size === slices.length;
  return unique && slices.filter((item) => item.status === "active").length <= 1;
}

function validCollections(value: Record<string, unknown>): boolean {
  const evidence = value["evidence"];
  if (!Array.isArray(evidence) || evidence.length > MAX_EVIDENCE || !evidence.every(isEvidence))
    return false;
  const outcomes = value["outcomes"];
  if (
    !Array.isArray(outcomes) ||
    outcomes.length > MAX_OUTCOMES ||
    outcomes.some((item) => !validText(item))
  )
    return false;
  const unresolved = value["unresolved"];
  if (!Array.isArray(unresolved) || unresolved.length > MAX_ISSUES || !unresolved.every(isIssue))
    return false;
  if (new Set(unresolved.map((item: WorkflowIssue) => item.id)).size !== unresolved.length)
    return false;
  const resolved = value["resolvedDecisions"];
  if (
    !Array.isArray(resolved) ||
    resolved.length > MAX_RESOLVED_DECISIONS ||
    !resolved.every(isDecisionResolution)
  )
    return false;
  const resolvedIds = new Set(resolved.map((item: WorkflowDecisionResolution) => item.id));
  return (
    resolvedIds.size === resolved.length &&
    unresolved.every((item: WorkflowIssue) => !resolvedIds.has(item.id))
  );
}

function validTransition(value: unknown, phase: WorkflowPhase): boolean {
  if (value === undefined) return true;
  return (
    isRecord(value) &&
    exactKeys(value, ["reason", "to"]) &&
    validText(value["reason"]) &&
    isPhase(value["to"]) &&
    PHASES.indexOf(value["to"]) === PHASES.indexOf(phase) + 1
  );
}

export function isWorkflowSnapshot(value: unknown): value is WorkflowSnapshot {
  if (!isRecord(value)) return false;
  const keysValid = exactKeys(
    value,
    [
      "artifacts",
      "evidence",
      "gates",
      "outcomes",
      "phase",
      "resolvedDecisions",
      "revision",
      "slices",
      "status",
      "title",
      "unresolved",
      "version",
      "workflowId",
      "workspace",
    ],
    ["backstop", "attention", "transitionRequest"],
  );
  if (!keysValid || !validIdentity(value)) return false;
  if (
    !validArtifacts(value["artifacts"]) ||
    !validSlices(value["slices"]) ||
    !validCollections(value)
  )
    return false;
  const phase = value["phase"] as WorkflowPhase;
  if (!validGates(value["gates"], phase) || !validTransition(value["transitionRequest"], phase))
    return false;
  const attentionValid = value["attention"] === undefined || validText(value["attention"]);
  const backstopValid = value["backstop"] === undefined || isBackstop(value["backstop"]);
  return attentionValid && backstopValid && validPhaseStatus(value);
}

export function snapshotFromBranch(entries: readonly unknown[]): {
  readonly corrupt: boolean;
  readonly snapshot?: WorkflowSnapshot;
} {
  let found = false;
  let data: unknown;
  for (const entry of entries) {
    if (!isRecord(entry) || entry["type"] !== "custom" || entry["customType"] !== STATE_TYPE)
      continue;
    found = true;
    data = entry["data"];
  }
  if (!found) return { corrupt: false };
  return isWorkflowSnapshot(data) ? { corrupt: false, snapshot: clone(data) } : { corrupt: true };
}

type SnapshotPatch = { [Key in keyof WorkflowSnapshot]?: WorkflowSnapshot[Key] | undefined };

function next(snapshot: WorkflowSnapshot, patch: SnapshotPatch): WorkflowSnapshot {
  const result = {
    ...clone(snapshot),
    ...patch,
    revision: snapshot.revision + 1,
  } as WorkflowSnapshot;
  if (!isWorkflowSnapshot(result))
    throw new Error("Workflow mutation violated snapshot invariants.");
  return result;
}

function fresh(snapshot: WorkflowSnapshot, ...kinds: readonly string[]): boolean {
  return kinds.some((kind) =>
    snapshot.evidence.some((item) => item.kind === kind && item.stale !== true),
  );
}

function requireScopeComplete(snapshot: WorkflowSnapshot, label: string): void {
  if (
    snapshot.slices.length === 0 ||
    snapshot.slices.some((slice) => slice.status !== "verified" && slice.status !== "cut")
  )
    throw new Error(`${label} requires every retained slice to be verified or cut.`);
}

function requireDiscoverGate(snapshot: WorkflowSnapshot): void {
  if (!fresh(snapshot, "problem") || !fresh(snapshot, "research", "research-not-needed"))
    throw new Error(
      "Discover approval requires problem evidence and research or a research-not-needed reason.",
    );
}

function requirePitchGate(snapshot: WorkflowSnapshot): void {
  if (
    snapshot.artifacts.spec === undefined ||
    snapshot.backstop === undefined ||
    !fresh(snapshot, "pitch-review")
  )
    throw new Error(
      "Pitch approval requires a valid spec artifact, mandatory wall-clock backstop, and rough/solved/bounded pitch-review evidence.",
    );
}

function requirePlanGate(snapshot: WorkflowSnapshot): void {
  if (
    snapshot.artifacts.plan === undefined ||
    snapshot.slices.length === 0 ||
    !fresh(snapshot, "validation-contract") ||
    !fresh(snapshot, "workspace-decision")
  )
    throw new Error(
      "Plan approval requires plan.md, an integrated slice, validation-contract evidence, and a workspace-decision.",
    );
}

function requireBuildGate(snapshot: WorkflowSnapshot): void {
  requireScopeComplete(snapshot, "Build approval");
  const cycle =
    fresh(snapshot, "tdd-exception") || (fresh(snapshot, "red") && fresh(snapshot, "green"));
  if (
    !cycle ||
    !fresh(snapshot, "focused-verification") ||
    !fresh(snapshot, "regression-verification")
  )
    throw new Error(
      "Build approval requires RED/GREEN (or justified TDD exception), focused verification, and regression verification evidence.",
    );
}

function requireReviewGate(snapshot: WorkflowSnapshot): void {
  requireScopeComplete(snapshot, "Review approval");
  if (
    !fresh(snapshot, "review-intent") ||
    !fresh(snapshot, "review-correctness") ||
    !fresh(snapshot, "review-maintainability") ||
    !fresh(snapshot, "review-risk-operations") ||
    !fresh(snapshot, "final-verification")
  )
    throw new Error(
      "Review approval requires intent, correctness, maintainability, risk/operations, and final-verification evidence.",
    );
}

function gatePrerequisites(snapshot: WorkflowSnapshot, gate: Exclude<WorkflowPhase, "ship">): void {
  const gateIndex = PHASES.indexOf(gate);
  const priorGates = PHASES.slice(0, gateIndex);
  if (priorGates.some((prior) => snapshot.gates[prior] !== true))
    throw new Error("Approval requires the complete prerequisite gate chain.");
  if (snapshot.unresolved.length > 0)
    throw new Error("Approval is blocked by unresolved decisions or blockers.");
  const target = PHASES[gateIndex + 1];
  if (snapshot.transitionRequest?.to !== target)
    throw new Error(`Request transition to ${String(target)} before approval.`);
  const validators: Record<Exclude<WorkflowPhase, "ship">, (value: WorkflowSnapshot) => void> = {
    build: requireBuildGate,
    discover: requireDiscoverGate,
    pitch: requirePitchGate,
    plan: requirePlanGate,
    review: requireReviewGate,
  };
  validators[gate](snapshot);
}

function rewind(
  snapshot: WorkflowSnapshot,
  phase: WorkflowPhase,
  reason: string,
): WorkflowSnapshot {
  boundedText(reason, "Rewind reason");
  const index = PHASES.indexOf(phase);
  const gates = Object.fromEntries(
    Object.entries(snapshot.gates).filter(
      ([gate]) => PHASES.indexOf(gate as WorkflowPhase) < index,
    ),
  ) as Partial<Record<WorkflowPhase, true>>;
  return next(snapshot, {
    attention: derivedAttention("rewound: ", reason.trim()),
    evidence: snapshot.evidence.map((item) => ({ ...item, stale: true as const })),
    gates,
    phase,
    slices: snapshot.slices.map((slice) =>
      slice.status === "cut" ? slice : { ...slice, status: "planned" as const },
    ),
    status: "active",
    transitionRequest: undefined,
    unresolved: [],
  });
}

function setSlice(
  snapshot: WorkflowSnapshot,
  id: string,
  status: SliceStatus,
  reason?: string,
  restore = false,
): WorkflowSnapshot {
  if (snapshot.phase !== "build") throw new Error("Slice status changes require the build phase.");
  const existing = snapshot.slices.find((slice) => slice.id === id);
  if (existing === undefined) throw new Error(`Slice ${id} is not registered.`);
  if (existing.status === "cut" && !restore)
    throw new Error("Cut scope is terminal unless a direct human deliberately restores it.");
  if (status === "cut") boundedText(reason, "Scope-cut reason");
  if (restore) boundedText(reason, "Scope restoration reason");
  const slices = snapshot.slices.map((slice) =>
    slice.id === id
      ? { ...slice, status }
      : status === "active" && slice.status === "active"
        ? { ...slice, status: "planned" as const }
        : slice,
  );
  return next(snapshot, { slices });
}

function observeWorkspace(
  snapshot: WorkflowSnapshot,
  workspaceInput: WorkflowSnapshot["workspace"],
): WorkflowSnapshot {
  const workspace = {
    path: boundedText(workspaceInput.path, "Workspace path", 500),
    ...(workspaceInput.branch === undefined
      ? {}
      : { branch: boundedText(workspaceInput.branch, "Workspace branch", 200) }),
    ...(workspaceInput.head === undefined
      ? {}
      : { head: boundedText(workspaceInput.head, "Workspace HEAD", 100) }),
  };
  if (
    workspace.path === snapshot.workspace.path &&
    workspace.branch === snapshot.workspace.branch &&
    workspace.head === snapshot.workspace.head
  )
    return clone(snapshot);
  const firstIdentity =
    snapshot.revision === 0 &&
    snapshot.evidence.length === 0 &&
    Object.keys(snapshot.gates).length === 0;
  if (firstIdentity) return next(snapshot, { workspace });
  const pathChanged = workspace.path !== snapshot.workspace.path;
  const evidence = snapshot.evidence.map((item) =>
    (item.branch !== undefined || item.head !== undefined) &&
    (pathChanged || item.branch !== workspace.branch || item.head !== workspace.head)
      ? { ...item, stale: true as const }
      : item,
  );
  return next(snapshot, {
    attention: "workspace identity changed; bound evidence requires refresh",
    evidence,
    workspace,
  });
}

const EVIDENCE_PHASE: Readonly<Record<string, WorkflowPhase>> = {
  "expiry-observation": "build",
  "final-verification": "review",
  "focused-verification": "build",
  green: "build",
  "pitch-review": "pitch",
  problem: "discover",
  red: "build",
  "regression-verification": "build",
  research: "discover",
  "research-not-needed": "discover",
  "review-correctness": "review",
  "review-intent": "review",
  "review-maintainability": "review",
  "review-reduced-assurance": "review",
  "review-risk-operations": "review",
  "tdd-exception": "build",
  "validation-contract": "plan",
  "workspace-decision": "plan",
};

function evidenceIsDownstream(item: WorkflowEvidence, target: WorkflowPhase): boolean {
  const evidencePhase = EVIDENCE_PHASE[item.kind];
  return evidencePhase === undefined || PHASES.indexOf(evidencePhase) >= PHASES.indexOf(target);
}

function observeMissing(snapshot: WorkflowSnapshot, paths: readonly string[]): WorkflowSnapshot {
  const missing = [...new Set(paths.map((path) => relativePath(path, "Missing artifact path")))];
  if (missing.length === 0) return clone(snapshot);
  const attention = derivedAttention("missing workflow artifacts: ", missing.join(", "));
  const slices = snapshot.slices.map((slice) =>
    missing.includes(slice.path) && slice.status !== "cut"
      ? { ...slice, status: "blocked" as const }
      : slice,
  );
  const specMissing =
    snapshot.artifacts.spec !== undefined && missing.includes(snapshot.artifacts.spec);
  const planMissing =
    snapshot.artifacts.plan !== undefined && missing.includes(snapshot.artifacts.plan);
  const sliceMissing = slices.some(
    (slice, index) => slice.status !== snapshot.slices[index]?.status,
  );
  const target: WorkflowPhase | undefined = specMissing
    ? "pitch"
    : planMissing || sliceMissing
      ? "plan"
      : undefined;
  const rewindNeeded =
    target !== undefined && PHASES.indexOf(snapshot.phase) > PHASES.indexOf(target);
  if (!rewindNeeded && snapshot.attention === attention && !sliceMissing) return clone(snapshot);
  const targetIndex =
    target === undefined ? PHASES.indexOf(snapshot.phase) : PHASES.indexOf(target);
  const gates = Object.fromEntries(
    Object.entries(snapshot.gates).filter(
      ([gate]) => PHASES.indexOf(gate as WorkflowPhase) < targetIndex,
    ),
  ) as Partial<Record<WorkflowPhase, true>>;
  return next(snapshot, {
    attention,
    evidence: snapshot.evidence.map((item) =>
      missing.includes(item.reference) ||
      (target !== undefined && evidenceIsDownstream(item, target))
        ? { ...item, stale: true as const }
        : item,
    ),
    gates,
    phase: rewindNeeded ? target : snapshot.phase,
    slices,
    transitionRequest: rewindNeeded ? undefined : snapshot.transitionRequest,
  });
}

function activeOnly(snapshot: WorkflowSnapshot, action: WorkflowAction): void {
  if (snapshot.status === "abandoned" || snapshot.status === "completed")
    throw new Error(`Workflow is ${snapshot.status} and cannot be mutated.`);
  if (snapshot.status === "paused" && action.kind === "pause")
    throw new Error("Workflow is already paused.");
  const observations =
    action.kind === "observe_workspace" || action.kind === "observe_missing_artifacts";
  if (
    snapshot.status === "paused" &&
    action.kind !== "resume" &&
    action.kind !== "abandon" &&
    !observations
  )
    throw new Error("Workflow is paused; resume before ordinary mutations.");
  if (
    snapshot.status === "blocked" &&
    action.kind !== "resolve_issue" &&
    action.kind !== "abandon" &&
    action.kind !== "rewind" &&
    !observations
  )
    throw new Error("Workflow is blocked; a direct human must resolve its unresolved item.");
}

type ContentAction = Extract<
  WorkflowAction,
  { kind: "set_backstop" | "record_artifact" | "register_slice" }
>;
type ProgressAction = Extract<
  WorkflowAction,
  {
    kind: "set_slice" | "restore_slice" | "record_evidence" | "record_issue" | "request_transition";
  }
>;
type FlowControlAction = Extract<
  WorkflowAction,
  { kind: "approve" | "rewind" | "pause" | "resume" }
>;
type ResolutionAction = Extract<
  WorkflowAction,
  { kind: "resolve_issue" | "circuit" | "abandon" | "complete" }
>;
type ObservationAction = Extract<
  WorkflowAction,
  { kind: "record_outcome" | "observe_workspace" | "observe_missing_artifacts" }
>;

const CONTENT_ACTIONS = new Set<WorkflowAction["kind"]>([
  "set_backstop",
  "record_artifact",
  "register_slice",
]);
const PROGRESS_ACTIONS = new Set<WorkflowAction["kind"]>([
  "set_slice",
  "restore_slice",
  "record_evidence",
  "record_issue",
  "request_transition",
]);
const FLOW_CONTROL_ACTIONS = new Set<WorkflowAction["kind"]>([
  "approve",
  "rewind",
  "pause",
  "resume",
]);
const RESOLUTION_ACTIONS = new Set<WorkflowAction["kind"]>([
  "resolve_issue",
  "circuit",
  "abandon",
  "complete",
]);

function isContentAction(action: WorkflowAction): action is ContentAction {
  return CONTENT_ACTIONS.has(action.kind);
}
function isProgressAction(action: WorkflowAction): action is ProgressAction {
  return PROGRESS_ACTIONS.has(action.kind);
}
function isFlowControlAction(action: WorkflowAction): action is FlowControlAction {
  return FLOW_CONTROL_ACTIONS.has(action.kind);
}
function isResolutionAction(action: WorkflowAction): action is ResolutionAction {
  return RESOLUTION_ACTIONS.has(action.kind);
}

function applyContentAction(snapshot: WorkflowSnapshot, action: ContentAction): WorkflowSnapshot {
  switch (action.kind) {
    case "set_backstop": {
      if (snapshot.backstop?.startedAt !== undefined)
        throw new Error("A started backstop can change only through a direct circuit extension.");
      const parsed = parseBackstop(action.duration);
      return next(snapshot, {
        backstop: { durationMs: parsed.milliseconds, label: parsed.label },
      });
    }
    case "record_artifact": {
      const requiredPhase = action.artifact === "spec" ? "pitch" : "plan";
      if (snapshot.phase !== requiredPhase)
        throw new Error(`${action.artifact} replacement requires the ${requiredPhase} phase.`);
      return next(snapshot, {
        artifacts: {
          ...snapshot.artifacts,
          [action.artifact]: relativePath(action.path, "Artifact path"),
        },
        gates: Object.fromEntries(
          Object.entries(snapshot.gates).filter(
            ([gate]) => PHASES.indexOf(gate as WorkflowPhase) < PHASES.indexOf(requiredPhase),
          ),
        ),
      });
    }
    case "register_slice": {
      if (snapshot.phase !== "plan") throw new Error("Slice registration requires the plan phase.");
      const id = boundedText(action.id, "Slice id", 30);
      if (!/^VS-\d{3,}$/u.test(id)) throw new Error("Slice id must match VS-NNN.");
      if (snapshot.slices.some((slice) => slice.id === id))
        throw new Error(`Slice ${id} is already registered.`);
      if (snapshot.slices.length >= MAX_SLICES)
        throw new Error(`A workflow may contain at most ${String(MAX_SLICES)} slices.`);
      return next(snapshot, {
        slices: [
          ...snapshot.slices,
          { id, path: relativePath(action.path, "Slice path"), status: "planned" },
        ],
      });
    }
  }
}

function recordEvidence(
  snapshot: WorkflowSnapshot,
  action: Extract<WorkflowAction, { kind: "record_evidence" }>,
): WorkflowSnapshot {
  if (snapshot.evidence.length >= MAX_EVIDENCE)
    throw new Error(`A workflow may contain at most ${String(MAX_EVIDENCE)} evidence records.`);
  const item: WorkflowEvidence = {
    claim: boundedText(action.evidence.claim, "Evidence claim"),
    kind: boundedText(action.evidence.kind, "Evidence kind", 80),
    reference: boundedText(action.evidence.reference, "Evidence reference"),
    sensitivity: action.evidence.sensitivity,
    ...(action.evidence.branch === undefined
      ? {}
      : { branch: boundedText(action.evidence.branch, "Evidence branch", 200) }),
    ...(action.evidence.head === undefined
      ? {}
      : { head: boundedText(action.evidence.head, "Evidence HEAD", 100) }),
  };
  return next(snapshot, { evidence: [...snapshot.evidence, item] });
}

function recordIssue(
  snapshot: WorkflowSnapshot,
  action: Extract<WorkflowAction, { kind: "record_issue" }>,
): WorkflowSnapshot {
  if (snapshot.unresolved.length >= MAX_ISSUES)
    throw new Error(`A workflow may contain at most ${String(MAX_ISSUES)} unresolved items.`);
  if (
    action.issueType === "decision" &&
    snapshot.resolvedDecisions.length >= MAX_RESOLVED_DECISIONS
  )
    throw new Error(
      `A workflow may contain at most ${String(MAX_RESOLVED_DECISIONS)} resolved decisions.`,
    );
  const id = boundedText(action.id, "Issue id", 30);
  const prefix = action.issueType === "blocker" ? "BLK" : "DEC";
  if (!new RegExp(`^${prefix}-\\d{3,}$`, "u").test(id))
    throw new Error(`${action.issueType} id must match ${prefix}-NNN.`);
  if (
    snapshot.unresolved.some((item) => item.id === id) ||
    (action.issueType === "decision" && snapshot.resolvedDecisions.some((item) => item.id === id))
  )
    throw new Error(`Issue ${id} is already recorded.`);
  const reason = boundedText(action.reason, "Issue reason");
  return next(snapshot, {
    attention: derivedAttention(`${action.issueType}: `, reason),
    status: "blocked",
    unresolved: [...snapshot.unresolved, { id, issueType: action.issueType, reason }],
  });
}

function applyProgressAction(snapshot: WorkflowSnapshot, action: ProgressAction): WorkflowSnapshot {
  switch (action.kind) {
    case "set_slice":
      return setSlice(snapshot, action.id, action.status, action.reason);
    case "restore_slice":
      return setSlice(snapshot, action.id, action.status, action.reason, true);
    case "record_evidence":
      return recordEvidence(snapshot, action);
    case "record_issue":
      return recordIssue(snapshot, action);
    case "request_transition":
      if (PHASES.indexOf(action.to) !== PHASES.indexOf(snapshot.phase) + 1)
        throw new Error("Transition requests must advance exactly one phase.");
      return next(snapshot, {
        transitionRequest: {
          reason: boundedText(action.reason, "Transition reason"),
          to: action.to,
        },
      });
  }
}

function approve(
  snapshot: WorkflowSnapshot,
  action: Extract<WorkflowAction, { kind: "approve" }>,
): WorkflowSnapshot {
  if (snapshot.phase !== action.gate)
    throw new Error(`Cannot approve ${action.gate} while in ${snapshot.phase}.`);
  gatePrerequisites(snapshot, action.gate);
  const target = PHASES[PHASES.indexOf(action.gate) + 1];
  if (target === undefined) throw new Error("Ship has no automatic approval transition.");
  let backstop = snapshot.backstop;
  if (action.gate === "plan" && backstop !== undefined && backstop.startedAt === undefined) {
    backstop = { ...backstop, startedAt: action.now };
  }
  return next(snapshot, {
    ...(backstop === undefined ? {} : { backstop }),
    attention: action.gate === "review" ? "ready_to_ship" : undefined,
    gates: { ...snapshot.gates, [action.gate]: true },
    phase: target,
    status: "active",
    transitionRequest: undefined,
  });
}

function resume(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  if (snapshot.status !== "paused") throw new Error("Only a paused workflow can resume.");
  return next(snapshot, { attention: undefined, status: "active" });
}

function applyFlowControlAction(
  snapshot: WorkflowSnapshot,
  action: FlowControlAction,
): WorkflowSnapshot {
  switch (action.kind) {
    case "approve":
      return approve(snapshot, action);
    case "rewind":
      if (PHASES.indexOf(action.phase) >= PHASES.indexOf(snapshot.phase))
        throw new Error("Rewind target must be an earlier phase.");
      return rewind(snapshot, action.phase, action.reason);
    case "pause":
      return next(snapshot, {
        attention: boundedText(action.reason, "Pause reason"),
        status: "paused",
      });
    case "resume":
      return resume(snapshot);
  }
}

function resolveCircuit(
  snapshot: WorkflowSnapshot,
  action: Extract<WorkflowAction, { kind: "circuit" }>,
): WorkflowSnapshot {
  if (snapshot.phase !== "build" || backstopState(snapshot, action.now) !== "expired")
    throw new Error(
      "Circuit-breaker resolution is available only after wall-clock backstop expiry during build.",
    );
  boundedText(action.reason, "Circuit-breaker reason");
  if (action.outcome === "abandon")
    return next(snapshot, { attention: action.reason.trim(), status: "abandoned" });
  if (action.outcome === "reshape") return rewind(snapshot, "pitch", action.reason);
  if (action.outcome === "finish") {
    if (snapshot.slices.every((slice) => slice.status !== "verified"))
      throw new Error("Circuit finish requires at least one verified slice.");
    const slices = snapshot.slices.map((slice) =>
      slice.status === "verified" || slice.status === "cut"
        ? slice
        : { ...slice, status: "cut" as const },
    );
    requireBuildGate({ ...snapshot, slices });
    return next(snapshot, {
      attention: "circuit: finish verified scope",
      gates: { ...snapshot.gates, build: true },
      phase: "review",
      slices,
      status: "active",
      transitionRequest: undefined,
    });
  }
  if (action.duration === undefined)
    throw new Error("Circuit extend requires a new backstop duration.");
  const parsed = parseBackstop(action.duration);
  return next(snapshot, {
    backstop: {
      durationMs: parsed.milliseconds,
      label: parsed.label,
      startedAt: action.now,
    },
    attention: derivedAttention("backstop explicitly extended: ", action.reason.trim()),
    status: "active",
  });
}

function resolveIssue(
  snapshot: WorkflowSnapshot,
  action: Extract<ResolutionAction, { kind: "resolve_issue" }>,
  now: number,
): WorkflowSnapshot {
  const reason = boundedText(action.reason, "Resolution reason");
  const issue = snapshot.unresolved.find((item) => item.id === action.id);
  if (issue === undefined) throw new Error(`Issue ${action.id} is not unresolved.`);
  if (!finiteTimestamp(now)) throw new Error("Resolution timestamp must be valid.");
  if (issue.issueType === "decision" && snapshot.resolvedDecisions.length >= MAX_RESOLVED_DECISIONS)
    throw new Error(
      `A workflow may contain at most ${String(MAX_RESOLVED_DECISIONS)} resolved decisions.`,
    );
  const unresolved = snapshot.unresolved.filter((item) => item.id !== action.id);
  const first = unresolved[0];
  return next(snapshot, {
    attention:
      first === undefined ? undefined : derivedAttention(`${first.issueType}: `, first.reason),
    resolvedDecisions:
      issue.issueType === "decision"
        ? [...snapshot.resolvedDecisions, { id: issue.id, reason, timestamp: now }]
        : snapshot.resolvedDecisions,
    status: unresolved.length === 0 ? "active" : "blocked",
    unresolved,
  });
}

function complete(snapshot: WorkflowSnapshot, reason: string): WorkflowSnapshot {
  if (snapshot.phase !== "ship" || snapshot.gates.review !== true)
    throw new Error("Completion requires ready to ship state.");
  if (PHASES.slice(0, -1).some((gate) => snapshot.gates[gate] !== true))
    throw new Error("Completion requires the full approved gate chain.");
  if (snapshot.unresolved.length > 0)
    throw new Error("Completion is blocked by unresolved decisions or blockers.");
  requireDiscoverGate(snapshot);
  requirePitchGate(snapshot);
  requirePlanGate(snapshot);
  requireBuildGate(snapshot);
  requireReviewGate(snapshot);
  if (snapshot.outcomes.length === 0) throw new Error("Completion requires a recorded outcome.");
  return next(snapshot, {
    attention: derivedAttention("completed: ", boundedText(reason, "Completion reason")),
    status: "completed",
  });
}

function applyResolutionAction(
  snapshot: WorkflowSnapshot,
  action: ResolutionAction,
  now: number,
): WorkflowSnapshot {
  switch (action.kind) {
    case "resolve_issue":
      return resolveIssue(snapshot, action, now);
    case "circuit":
      return resolveCircuit(snapshot, action);
    case "abandon":
      return next(snapshot, {
        attention: boundedText(action.reason, "Abandon reason"),
        status: "abandoned",
      });
    case "complete":
      return complete(snapshot, action.reason);
  }
}

function applyObservationAction(
  snapshot: WorkflowSnapshot,
  action: ObservationAction,
): WorkflowSnapshot {
  switch (action.kind) {
    case "record_outcome":
      if (snapshot.phase !== "ship")
        throw new Error("Outcomes may be recorded only during the ship phase.");
      if (snapshot.outcomes.length >= MAX_OUTCOMES)
        throw new Error(`A workflow may contain at most ${String(MAX_OUTCOMES)} outcomes.`);
      return next(snapshot, {
        outcomes: [...snapshot.outcomes, boundedText(action.outcome, "Outcome")],
      });
    case "observe_workspace":
      return observeWorkspace(snapshot, action.workspace);
    case "observe_missing_artifacts":
      return observeMissing(snapshot, action.paths);
  }
}

function allowedAfterExpiry(action: WorkflowAction): boolean {
  return [
    "record_evidence",
    "observe_workspace",
    "observe_missing_artifacts",
    "record_issue",
    "resolve_issue",
    "resume",
    "circuit",
  ].includes(action.kind);
}

export function applyWorkflowAction(
  snapshot: WorkflowSnapshot,
  action: WorkflowAction,
  now = Date.now(),
): WorkflowSnapshot {
  if (!isWorkflowSnapshot(snapshot))
    throw new Error("Cannot mutate a malformed workflow snapshot.");
  activeOnly(snapshot, action);
  if (action.kind === "set_backstop" && PHASES.indexOf(snapshot.phase) >= PHASES.indexOf("build"))
    throw new Error("The wall-clock backstop may be set only before build begins.");
  const expired = snapshot.phase === "build" && backstopState(snapshot, now) === "expired";
  if (expired && !allowedAfterExpiry(action))
    throw new Error(
      "The wall-clock backstop expired; resolve the circuit breaker before continuing.",
    );
  if (isContentAction(action)) return applyContentAction(snapshot, action);
  if (isProgressAction(action)) return applyProgressAction(snapshot, action);
  if (isFlowControlAction(action)) return applyFlowControlAction(snapshot, action);
  if (isResolutionAction(action)) return applyResolutionAction(snapshot, action, now);
  return applyObservationAction(snapshot, action);
}

export function workflowSummary(
  snapshot: WorkflowSnapshot,
  now = Date.now(),
): WorkflowSummaryEventV1 {
  const activeSlice = snapshot.slices.find((slice) => slice.status === "active")?.id;
  const backstop =
    snapshot.phase === "build" && snapshot.status !== "abandoned" && snapshot.status !== "completed"
      ? backstopState(snapshot, now)
      : "not_started";
  return {
    ...(activeSlice === undefined ? {} : { activeSlice }),
    backstop,
    ...(snapshot.attention === undefined ? {} : { attention: snapshot.attention }),
    phase: snapshot.phase,
    status: snapshot.status,
    title: snapshot.title,
    version: 1,
    workflowId: snapshot.workflowId,
  };
}

export function formatWorkflow(snapshot: WorkflowSnapshot, now = Date.now()): string {
  const summary = workflowSummary(snapshot, now);
  const slice = summary.activeSlice ?? "no active slice";
  const unresolved =
    snapshot.unresolved.length === 0
      ? "none"
      : snapshot.unresolved.map((item) => `${item.id} (${item.issueType})`).join(", ");
  return `${summary.title}\nPhase: ${summary.phase}\nStatus: ${summary.status}\nSlice: ${slice}\nBackstop: ${summary.backstop}\nUnresolved: ${unresolved}\nRevision: ${String(snapshot.revision)}`;
}
