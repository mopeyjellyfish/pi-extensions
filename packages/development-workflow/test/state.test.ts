import { describe, expect, it } from "vitest";

import {
  validatePitchDocument,
  validatePlanDocument,
  validateResearchDocument,
  validateSliceDocument,
} from "../src/artifacts.ts";
import {
  STATE_TYPE,
  backstopState,
  applyWorkflowAction,
  createWorkflow,
  formatWorkflow,
  isWorkflowSnapshot,
  parseBackstop,
  resolveCheckpoint,
  snapshotFromBranch,
  workflowNextAction,
  workflowSummary,
  type WorkflowSnapshot,
} from "../src/state.ts";

const pitch = `---
schema: dev-workflow/pitch-v1
id: PITCH-001
---
# Problem
A developer loses the current decision when a session branches.
### Research Basis
[RESEARCH-001](./research.md) records repository and prior-art evidence.
### Prior Art
Branch-local ledgers preserve replayable state without a project database.
### Alternatives
Retaining implicit chat state and building a project database were considered.
### Shared Understanding
Agreed fixed decisions require bounded branch-local restoration without remote mutation; reducer structure remains agent discretion.
# Appetite
### Why This Is Worth the Investment
Reliable branch-local decisions justify a bounded extension change.
### Agent Investment
Change the bounded reducer and session restoration seam.
### Scope Control
Deliver branch-local restoration first and reshape if cross-project state is required.
### Fixed Floors
Preserve type safety, branch isolation, and focused verification.
# Solution
Use a branch-local ledger and a thin control command.
### Simplicity Case
Reuse the existing session-entry and reducer seams; add no dependency, watcher, project database, speculative abstraction, or configuration.
### Agent Discretion
Choose local reducer structure without changing the branch-local contract.
### Acceptance Signals
The active branch restores exactly one valid state.
# Rabbit Holes
Do not build a project database or background watcher.
# No-Gos
No automatic remote Git actions.
`;

const plan = `# Plan

Pitch boundaries: [PITCH-001](./spec.md)
## Vertical Slices
The first integrated slice is [VS-001](./slices/VS-001.md).
## Dependencies and Sequencing
VS-001 has no dependencies and is first.
## Simplification Review
Reuse the existing reducer and session-entry seams; do not add a project database, watcher, dependency, or generalized abstraction.
`;

const slice = `---
schema: dev-workflow/vertical-slice-v1
id: VS-001
depends_on: []
requirements: [REQ-001]
risk: medium
---
# Observable Outcome
A user starts a workflow and reads its state after restoration.
# Pitch Fit
This proves the canonical branch-local ledger.
# Boundaries Crossed
Pi command, reducer, custom session entry, and restored output.
# Execution Profile
### Worker Model
Terra is the bounded implementation model.
### Worker Effort
Medium effort is sufficient.
### Rationale
The seams and behavior are understood.
### Escalation
Use Terra high for difficult bounded implementation.
### Conceptual Replanning
Return conceptual failure to Sol planning.
### Frontier Fallback
Use Sol medium only after explicit plan revalidation.
### Reviewer
Use one fresh Sol high reviewer.
# Simplification Pass
Reuse the existing reducer and session-entry seams, delete superseded code, and add no speculative abstraction or configuration.
# RED
A public behavior test fails before implementation.
# GREEN
Implement only the path needed by the failing test.
# Verification
Run the focused package test and source smoke.
# Done When
The behavior is demonstrable and evidence is recorded.
`;

const research = `---
schema: dev-workflow/research-v1
id: RESEARCH-001
---
# Repository Evidence
Reducer tests and session contracts govern restoration.
# External Prior Art
Disposition: not-applicable. Rationale: repository-local lifecycle semantics control this change.
# Options Considered
Retain implicit state or build the bounded ledger.
# Recommendation
Build the bounded ledger.
# Pitch Implications
Keep the pitch branch-local and avoid a project database.
# Simplicity Check
The behavior is necessary; reuse the existing reducer and session-entry seams; standard library primitives are sufficient; no new dependency, configurability, or speculative abstraction is justified.
# Unknowns
No consequential unknowns remain.
`;

function evidence(kind: string, sliceId?: string) {
  return {
    evidence: {
      claim: `${kind} exists`,
      kind,
      reference: `test:${kind}`,
      sensitivity: "public" as const,
      ...(sliceId === undefined ? {} : { sliceId }),
    },
    kind: "record_evidence" as const,
  };
}

function toBuild(now = 1000): WorkflowSnapshot {
  let state = createWorkflow("Feature", "/repo", 1);
  state = applyWorkflowAction(
    state,
    { artifact: "research", kind: "record_artifact", path: "specs/change/research.md" },
    now,
  );
  state = applyWorkflowAction(state, evidence("problem"), now);
  state = applyWorkflowAction(state, evidence("research"), now);
  state = applyWorkflowAction(
    state,
    {
      kind: "request_transition",
      reason: "repository research established the problem",
      to: "pitch",
    },
    now,
  );
  state = applyWorkflowAction(state, { gate: "discover", kind: "approve", now }, now);
  state = applyWorkflowAction(
    state,
    { artifact: "spec", kind: "record_artifact", path: "specs/change/spec.md" },
    now,
  );
  state = applyWorkflowAction(state, { duration: "2d", kind: "set_backstop" }, now);
  state = applyWorkflowAction(state, evidence("pitch-simplification"), now);
  state = applyWorkflowAction(state, evidence("pitch-review"), now);
  state = applyWorkflowAction(
    state,
    { kind: "request_transition", reason: "pitch shaped", to: "plan" },
    now,
  );
  state = applyWorkflowAction(state, { gate: "pitch", kind: "approve", now }, now);
  state = applyWorkflowAction(
    state,
    { artifact: "plan", kind: "record_artifact", path: "specs/change/plan.md" },
    now,
  );
  state = applyWorkflowAction(
    state,
    { id: "VS-001", kind: "register_slice", path: "specs/change/slices/VS-001.md" },
    now,
  );
  state = applyWorkflowAction(state, evidence("validation-contract"), now);
  state = applyWorkflowAction(state, evidence("workspace-decision"), now);
  state = applyWorkflowAction(state, evidence("plan-simplification"), now);
  state = applyWorkflowAction(
    state,
    { kind: "request_transition", reason: "first slice ready", to: "build" },
    now,
  );
  return applyWorkflowAction(state, { gate: "plan", kind: "approve", now }, now);
}

function completeSlice(state: WorkflowSnapshot, now = 1001): WorkflowSnapshot {
  let next = state;
  const slice = next.slices.find((item) => item.id === "VS-001");
  if (slice?.status === "planned" || slice?.status === "blocked")
    next = applyWorkflowAction(next, { id: "VS-001", kind: "set_slice", status: "active" }, now);
  for (const kind of [
    "red",
    "green",
    "focused-verification",
    "regression-verification",
    "worker-handoff",
    "build-simplification",
  ])
    next = applyWorkflowAction(next, evidence(kind, "VS-001"), now);
  return applyWorkflowAction(next, { id: "VS-001", kind: "set_slice", status: "verified" }, now);
}

describe("workflow artifact contracts", () => {
  it("accepts complete pitches and integrated slices", () => {
    expect.hasAssertions();
    expect(validatePitchDocument(pitch)).toEqual({ id: "PITCH-001", valid: true });
    expect(validateResearchDocument(research)).toEqual({ id: "RESEARCH-001", valid: true });
    expect(validatePlanDocument(plan)).toEqual({ id: "plan", valid: true });
    expect(validateSliceDocument(slice)).toEqual({ dependsOn: [], id: "VS-001", valid: true });
  });

  it("rejects mutable, incomplete, malformed, and horizontal artifacts", () => {
    expect.hasAssertions();
    for (const invalid of [
      pitch.replace("id: PITCH-001", "id: feature"),
      pitch.replace("schema: dev-workflow/pitch-v1", "schema: wrong"),
      pitch.replace("### Research Basis", "### Prior Work"),
      pitch.replace("### Agent Investment", "### Effort"),
      pitch.replace("### Scope Control", "### Scope"),
      pitch.replace("### Fixed Floors", "### Quality"),
      pitch.replace("# Problem", "# Context"),
      pitch.replace("### Why This Is Worth the Investment", "### Value"),
      pitch.replace("### Simplicity Case", "### Complexity Budget"),
      pitch.replace("### Agent Discretion", "### Fixed Implementation"),
      pitch.replace("### Acceptance Signals", "### Signals"),
      pitch.replace("id: PITCH-001", "id: PITCH-001\nstatus: active"),
      pitch.replace("A developer loses", "- [ ] A developer loses"),
      "not frontmatter",
      `---\nschema nope\n---\n# Problem\ntext`,
      `---\nschema: dev-workflow/pitch-v1\nschema: duplicate\nid: PITCH-001\n---\n${pitch}`,
      "x".repeat(100_001),
    ])
      expect(() => validatePitchDocument(invalid)).toThrow();

    for (const invalid of [
      `${plan}\n## Appetite\nTwo days.`,
      `${plan}\n## No-Gos\nNo remote actions.`,
      plan.replace("The first integrated slice", "The first item"),
      plan.replace("The first integrated slice is", "Backend first phase, then"),
      plan.replace("Pitch boundaries: [PITCH-001](./spec.md)", "Pitch is nearby."),
      plan.replace("## Dependencies and Sequencing", "## Notes"),
      plan.replace("## Simplification Review", "## Complexity Review"),
      plan.replace(
        "Reuse the existing reducer and session-entry seams; do not add a project database, watcher, dependency, or generalized abstraction.",
        "Implement the selected design.",
      ),
      plan.replace("[PITCH-001](./spec.md)", "the nearby pitch"),
      plan.replaceAll("VS-001", "slice-one"),
      `${plan}\n## Backend\nBuild models first.`,
      `${plan}\nstatus: active`,
      `${plan}\n- [ ] exhaustive task breakdown`,
      "",
      "x".repeat(100_001),
    ])
      expect(() => validatePlanDocument(invalid)).toThrow();

    for (const invalid of [
      slice.replace("id: VS-001", "id: one"),
      slice.replace("depends_on: []", "depends_on: nope"),
      slice.replace("requirements: [REQ-001]", "requirements: []"),
      slice.replace("requirements: [REQ-001]", "requirements: [bad]"),
      slice.replace("risk: medium", "risk: extreme"),
      slice.replace("schema: dev-workflow/vertical-slice-v1", "schema: wrong"),
      slice.replace("# Execution Profile", "# Worker Notes"),
      slice.replace("# Simplification Pass", "# Complexity Pass"),
      slice.replace("# Verification", "# Checks"),
      slice.replace(
        "Pi command, reducer, custom session entry, and restored output.",
        "Reducer only.",
      ),
      slice.replace(
        "A user starts a workflow and reads its state after restoration.",
        "All APIs are implemented.",
      ),
      slice.replace("risk: medium", "risk: medium\nstatus: planned"),
      slice.replace("depends_on: []", "depends_on: [VS-002, VS-002]"),
      slice.replace("depends_on: []", "depends_on: [VS-001]"),
      slice.replace("Terra is the bounded implementation model.", "Nova executes it."),
      slice.replace("Medium effort is sufficient.", "Choose an effort later."),
      slice.replace("Use Terra high for difficult bounded implementation.", "Escalate later."),
      slice.replace("Return conceptual failure to Sol planning.", "Keep implementing."),
      slice.replace("Use Sol medium only after explicit plan revalidation.", "Use Terra high."),
      slice.replace("Use one fresh Sol high reviewer.", "Use a general reviewer."),
      slice.replace(
        "Use one fresh Sol high reviewer.",
        "Use one fresh Sol high reviewer. Terra xhigh is also available.",
      ),
      slice.replace(
        "Reuse the existing reducer and session-entry seams, delete superseded code, and add no speculative abstraction or configuration.",
        "Implement the required behavior.",
      ),
    ])
      expect(() => validateSliceDocument(invalid)).toThrow();
  });

  it("requires evidence-backed prior-art dispositions, alternatives, and simplicity decisions", () => {
    expect.hasAssertions();
    for (const invalid of [
      research.replace("schema: dev-workflow/research-v1", "schema: wrong"),
      research.replace("id: RESEARCH-001", "id: research"),
      research.replace("# Simplicity Check", "# Complexity Check"),
      research.replace(
        "Retain implicit state or build the bounded ledger.",
        "Build the bounded ledger.",
      ),
      research.replace(
        "Rationale: repository-local lifecycle semantics control this change.",
        "No reason supplied.",
      ),
      research.replace(
        "Disposition: not-applicable. Rationale: repository-local lifecycle semantics control this change.",
        "Disposition: completed. Rationale: online research was done without citing a source or implication.",
      ),
      research.replace(
        "Disposition: not-applicable. Rationale: repository-local lifecycle semantics control this change.",
        "Disposition: unavailable. Rationale: search failed.",
      ),
      research.replace(
        "Disposition: not-applicable. Rationale: repository-local lifecycle semantics control this change.",
        "Disposition: completed. Source: https://example.invalid/source. The implication confirms the route.",
      ),
      research.replace(
        "Disposition: not-applicable. Rationale: repository-local lifecycle semantics control this change.",
        "Disposition: completed. Source: https://example.com/source.",
      ),
      research.replace(
        "The behavior is necessary; reuse the existing reducer and session-entry seams; standard library primitives are sufficient; no new dependency, configurability, or speculative abstraction is justified.",
        "The selected route is straightforward.",
      ),
      research.replace("Build the bounded ledger.", "Build or retain the bounded ledger."),
      pitch.replace("### Simplicity Case", "### Complexity Case"),
      pitch.replace(
        "Retaining implicit chat state and building a project database were considered.",
        "Only the selected route was considered.",
      ),
      pitch.replace("[RESEARCH-001](./research.md)", "the research artifact"),
      pitch.replace(
        "Agreed fixed decisions require bounded branch-local restoration without remote mutation; reducer structure remains agent discretion.",
        "The reducer design is understood.",
      ),
      pitch.replace(
        "Reuse the existing session-entry and reducer seams; add no dependency, watcher, project database, speculative abstraction, or configuration.",
        "Implement the selected architecture.",
      ),
    ])
      expect(() =>
        invalid.includes("schema: dev-workflow/research-v1")
          ? validateResearchDocument(invalid)
          : validatePitchDocument(invalid),
      ).toThrow();
  });
});

describe("workflow reducer", () => {
  it("moves through approved gates and preserves integrated slice evidence", () => {
    expect.hasAssertions();
    let state = toBuild();
    expect(state.phase).toBe("build");
    expect(state.backstop?.startedAt).toBe(1000);
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1001);
    state = applyWorkflowAction(state, evidence("red", "VS-001"), 1002);
    state = applyWorkflowAction(state, evidence("green", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("focused-verification", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("regression-verification", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("worker-handoff", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("build-simplification", "VS-001"), 1003);
    state = applyWorkflowAction(
      state,
      { id: "VS-001", kind: "set_slice", status: "verified" },
      1004,
    );
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "slice verified", to: "review" },
      1005,
    );
    expect(state.phase).toBe("review");
    state = applyWorkflowAction(state, evidence("review-intent", "VS-001"), 1007);
    state = applyWorkflowAction(state, evidence("review-correctness", "VS-001"), 1007);
    state = applyWorkflowAction(state, evidence("review-maintainability", "VS-001"), 1007);
    state = applyWorkflowAction(state, evidence("review-risk-operations", "VS-001"), 1007);
    state = applyWorkflowAction(state, evidence("final-verification", "VS-001"), 1007);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "review evidence accepted", to: "ship" },
      1008,
    );
    state = applyWorkflowAction(
      state,
      {
        action: "pull-request",
        kind: "authorize_ship",
        now: 1009,
        reason: "open the reviewed pull request",
      },
      1009,
    );
    state = applyWorkflowAction(
      state,
      {
        kind: "record_outcome",
        receipt: "PR created after explicit authorization",
        shipAction: "pull-request",
      },
      1010,
    );

    expect(state).toMatchObject({
      phase: "ship",
      status: "active",
      attention: "pull-request receipt recorded; authorize the next action or finish",
    });
    expect(state.outcomes).toHaveLength(1);
    expect(formatWorkflow(state, 1010)).toContain("Phase: ship");
    expect(formatWorkflow(state, 1010)).toContain("Backstop: not_started");
    expect(workflowSummary(state, 1010)).toMatchObject({
      backstop: "not_started",
      phase: "ship",
      version: 1,
    });
    expect(isWorkflowSnapshot(state)).toBe(true);
  });

  it("enforces gate prerequisites and linear transition requests", () => {
    expect.hasAssertions();
    let initial = createWorkflow("Feature", "/repo", 1);
    expect(() =>
      applyWorkflowAction(initial, { gate: "discover", kind: "approve", now: 2 }, 2),
    ).toThrow(/request transition/iu);
    expect(() =>
      applyWorkflowAction(initial, { kind: "request_transition", reason: "skip", to: "plan" }, 2),
    ).toThrow(/exactly one/iu);
    initial = applyWorkflowAction(
      initial,
      { artifact: "research", kind: "record_artifact", path: "research.md" },
      2,
    );
    const problemOnly = applyWorkflowAction(initial, evidence("problem"), 2);
    expect(() =>
      applyWorkflowAction(
        problemOnly,
        { kind: "request_transition", reason: "ready", to: "pitch" },
        2,
      ),
    ).toThrow(/research evidence/iu);
    const researched = applyWorkflowAction(problemOnly, evidence("research"), 2);
    const pending = applyWorkflowAction(
      researched,
      { kind: "request_transition", reason: "ready", to: "pitch" },
      2,
    );
    expect(pending).toMatchObject({ phase: "discover", pendingCheckpoint: { phase: "discover" } });
    expect(
      applyWorkflowAction(pending, { gate: "discover", kind: "approve", now: 2 }, 2).phase,
    ).toBe("pitch");
    expect(() =>
      applyWorkflowAction(initial, { gate: "pitch", kind: "approve", now: 2 }, 2),
    ).toThrow(/while in discover/iu);
  });

  it("requires fresh TDD, verification, and review evidence at build and review gates", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1001);
    expect(() =>
      applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "verified" }, 1002),
    ).toThrow(/RED\/GREEN/iu);
    state = applyWorkflowAction(state, evidence("tdd-exception", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("focused-verification", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("regression-verification", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("worker-handoff", "VS-001"), 1003);
    state = applyWorkflowAction(state, evidence("build-simplification", "VS-001"), 1003);
    state = applyWorkflowAction(
      state,
      { id: "VS-001", kind: "set_slice", status: "verified" },
      1003,
    );
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "implemented", to: "review" },
      1004,
    );
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "request_transition", reason: "reviewed", to: "ship" },
        1006,
      ),
    ).toThrow(/review-intent/iu);
    state = applyWorkflowAction(state, evidence("review-reduced-assurance", "VS-001"), 1006);
    state = applyWorkflowAction(state, evidence("final-verification", "VS-001"), 1006);
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "request_transition", reason: "reviewed", to: "ship" },
        1007,
      ),
    ).toThrow(/review-intent/iu);
    for (const kind of [
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
    ]) {
      state = applyWorkflowAction(state, evidence(kind, "VS-001"), 1007);
    }
    expect(
      applyWorkflowAction(
        state,
        { kind: "request_transition", reason: "reviewed", to: "ship" },
        1008,
      ).phase,
    ).toBe("ship");
  });

  it("keeps one active slice, validates IDs and paths, and supports scope cuts", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(
      state,
      { id: "VS-002", kind: "register_slice", path: "slices/VS-002.md" },
      1001,
    );
    expect(state).toMatchObject({ gates: { plan: true }, phase: "build" });
    expect(() =>
      applyWorkflowAction(state, { id: "bad", kind: "register_slice", path: "slice.md" }, 1001),
    ).toThrow(/VS-NNN/iu);
    expect(() =>
      applyWorkflowAction(state, { id: "VS-001", kind: "register_slice", path: "other.md" }, 1001),
    ).toThrow(/already/iu);
    const planState = applyWorkflowAction(
      state,
      { kind: "rewind", phase: "plan", reason: "check a replacement path" },
      1001,
    );
    expect(() =>
      applyWorkflowAction(
        planState,
        { artifact: "plan", kind: "record_artifact", path: "../escape.md" },
        1001,
      ),
    ).toThrow(/relative/iu);
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1002);
    expect(() =>
      applyWorkflowAction(state, { id: "VS-002", kind: "set_slice", status: "active" }, 1003),
    ).toThrow(/second active/iu);
    state = applyWorkflowAction(
      state,
      { id: "VS-001", kind: "set_slice", status: "blocked" },
      1003,
    );
    state = applyWorkflowAction(state, { id: "VS-002", kind: "set_slice", status: "active" }, 1003);
    expect(state.slices).toMatchObject([
      { id: "VS-001", status: "blocked" },
      { id: "VS-002", status: "active" },
    ]);
    expect(() =>
      applyWorkflowAction(state, { id: "VS-002", kind: "set_slice", status: "cut" }, 1004),
    ).toThrow(/reason/iu);
    state = applyWorkflowAction(
      state,
      { id: "VS-002", kind: "set_slice", reason: "outside backstop", status: "cut" },
      1004,
    );
    expect(state.slices[1]?.status).toBe("cut");
    expect(() =>
      applyWorkflowAction(state, { id: "VS-999", kind: "set_slice", status: "active" }, 1005),
    ).toThrow(/not registered/iu);
  });

  it("derives backstop boundaries, keeps wall-clock time running while paused, and requires explicit circuit decisions", () => {
    expect.hasAssertions();
    expect(parseBackstop("2d")).toEqual({ label: "2d", milliseconds: 172_800_000 });
    for (const value of ["", "two days", "0h", "13w"]) expect(() => parseBackstop(value)).toThrow();
    let state = toBuild(1000);
    const duration = state.backstop?.durationMs ?? 0;
    expect(backstopState(state, 1000)).toBe("active");
    expect(backstopState(state, 1000 + duration * 0.8)).toBe("attention");
    expect(backstopState(state, 1000 + duration)).toBe("expired");

    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "circuit", now: 4000, outcome: "abandon", reason: "not expired" },
        4000,
      ),
    ).toThrow(/only after/iu);
    state = applyWorkflowAction(
      state,
      { kind: "pause", now: 2000, reason: "waiting on user" },
      2000,
    );
    expect(state.status).toBe("paused");
    expect(() =>
      applyWorkflowAction(state, { kind: "pause", now: 2100, reason: "again" }, 2100),
    ).toThrow(/already paused/iu);
    const expiredAt = 1000 + duration;
    expect(backstopState(state, expiredAt)).toBe("expired");
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "circuit", now: expiredAt, outcome: "abandon", reason: "resume first" },
        expiredAt,
      ),
    ).toThrow(/paused/iu);
    state = applyWorkflowAction(state, { kind: "resume", now: expiredAt }, expiredAt);
    expect(state).toMatchObject({ backstop: { startedAt: 1000 }, status: "active" });
    expect(() =>
      applyWorkflowAction(state, { kind: "resume", now: expiredAt + 1 }, expiredAt + 1),
    ).toThrow(/only a paused/iu);

    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "record_outcome", receipt: "keep building", shipAction: "commit" },
        expiredAt,
      ),
    ).toThrow(/circuit breaker/iu);
    const withEvidence = applyWorkflowAction(state, evidence("expiry-observation"), expiredAt);
    expect(withEvidence.evidence.at(-1)?.kind).toBe("expiry-observation");
    const extended = applyWorkflowAction(
      withEvidence,
      {
        duration: "1d",
        kind: "circuit",
        now: expiredAt,
        outcome: "extend",
        reason: "explicitly re-bet",
      },
      expiredAt,
    );
    expect(extended.backstop?.label).toBe("1d");
    expect(extended.attention).toMatch(/explicitly extended/iu);
  });

  it("finishes verified scope, reshapes, abandons, and rewinds with stale evidence", () => {
    expect.hasAssertions();
    let state = toBuild();
    const expired = 1000 + (state.backstop?.durationMs ?? 0);
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "circuit", now: expired, outcome: "finish", reason: "time" },
        expired,
      ),
    ).toThrow(/verified/iu);
    state = completeSlice(state, 1001);
    const withUnfinishedScope: WorkflowSnapshot = {
      ...state,
      slices: [
        ...state.slices,
        { id: "VS-002", path: "slices/VS-002.md", status: "planned" as const },
        { id: "VS-003", path: "slices/VS-003.md", status: "active" as const },
        { id: "VS-004", path: "slices/VS-004.md", status: "blocked" as const },
      ],
    };
    const finished = applyWorkflowAction(
      withUnfinishedScope,
      { kind: "circuit", now: expired, outcome: "finish", reason: "ship useful scope" },
      expired,
    );
    expect(finished).toMatchObject({
      phase: "review",
      slices: [
        { id: "VS-001", status: "verified" },
        { id: "VS-002", status: "cut" },
        { id: "VS-003", status: "cut" },
        { id: "VS-004", status: "cut" },
      ],
    });
    const reshaped = applyWorkflowAction(
      state,
      { kind: "circuit", now: expired, outcome: "reshape", reason: "solution wrong" },
      expired,
    );
    expect(reshaped).toMatchObject({ phase: "pitch", status: "active" });
    expect(reshaped.evidence.every((item) => item.stale === true)).toBe(true);
    const abandoned = applyWorkflowAction(
      state,
      { kind: "circuit", now: expired, outcome: "abandon", reason: "not worth more" },
      expired,
    );
    expect(abandoned.status).toBe("abandoned");
    expect(() => applyWorkflowAction(abandoned, evidence("late"), expired)).toThrow(
      /cannot be mutated/iu,
    );
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "circuit", now: expired, outcome: "extend", reason: "missing duration" },
        expired,
      ),
    ).toThrow(/new backstop duration/iu);
  });

  it("invalidates downstream gates and evidence when recorded artifacts disappear", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1001);
    for (const kind of ["red", "green", "focused-verification", "regression-verification"])
      state = applyWorkflowAction(state, evidence(kind, "VS-001"), 1001);
    const before = state.revision;
    state = applyWorkflowAction(
      state,
      {
        kind: "observe_missing_artifacts",
        paths: ["specs/change/slices/VS-001.md"],
      },
      1002,
    );
    expect(state.revision).toBe(before + 1);
    expect(state.attention).toMatch(/missing workflow artifacts/iu);
    expect(state.phase).toBe("plan");
    expect(state.slices[0]?.status).toBe("blocked");
    expect(state.gates.pitch).toBe(true);
    expect(state.gates.plan).toBeUndefined();
    expect(state.evidence.find((item) => item.kind === "problem")?.stale).toBeUndefined();
    expect(state.evidence.find((item) => item.kind === "pitch-review")?.stale).toBeUndefined();
    expect(state.evidence.find((item) => item.kind === "validation-contract")?.stale).toBe(true);
    expect(state.evidence.find((item) => item.kind === "red")?.stale).toBe(true);
    const unchanged = applyWorkflowAction(
      state,
      {
        kind: "observe_missing_artifacts",
        paths: ["specs/change/slices/VS-001.md"],
      },
      1003,
    );
    expect(unchanged.revision).toBe(state.revision);

    let recovered = applyWorkflowAction(unchanged, evidence("validation-contract"), 1004);
    recovered = applyWorkflowAction(recovered, evidence("workspace-decision"), 1004);
    recovered = applyWorkflowAction(recovered, evidence("plan-simplification"), 1004);
    recovered = applyWorkflowAction(
      recovered,
      { kind: "request_transition", reason: "artifact restored", to: "build" },
      1004,
    );
    recovered = applyWorkflowAction(recovered, { gate: "plan", kind: "approve", now: 1004 }, 1004);
    recovered = applyWorkflowAction(
      recovered,
      { id: "VS-001", kind: "set_slice", status: "active" },
      1005,
    );
    expect(() =>
      applyWorkflowAction(recovered, { id: "VS-001", kind: "set_slice", status: "verified" }, 1005),
    ).toThrow(/RED\/GREEN/iu);
  });

  it("stales only identity-bound evidence without rewinding Build state after drift", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1001);
    state = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/one", head: "abc", path: "/repo", tree: "sha256:one" },
      },
      1002,
    );
    expect(() => applyWorkflowAction(state, evidence("unbound-observation"), 1003)).toThrow(
      /not registered/iu,
    );
    state = applyWorkflowAction(
      state,
      {
        evidence: {
          branch: "feat/one",
          claim: "Fresh test",
          head: "abc",
          kind: "focused-verification",
          reference: "test",
          sensitivity: "private",
          sliceId: "VS-001",
          tree: "sha256:one",
        },
        kind: "record_evidence",
      },
      1003,
    );
    const unchanged = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/one", head: "abc", path: "/repo", tree: "sha256:one" },
      },
      1004,
    );
    expect(unchanged.revision).toBe(state.revision);
    expect(unchanged.evidence.find((item) => item.kind === "focused-verification")?.tree).toBe(
      "sha256:one",
    );
    const drifted = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/one", head: "abc", path: "/repo", tree: "sha256:two" },
      },
      1005,
    );
    expect(drifted).toMatchObject({
      gates: state.gates,
      phase: "build",
      slices: [{ id: "VS-001", status: "active" }],
      status: "active",
    });
    expect(drifted.evidence.find((item) => item.kind === "focused-verification")?.stale).toBe(true);
    expect(drifted.attention).toMatch(/identity changed/iu);
  });

  it("preserves paused status and wall-clock backstop accounting across workspace drift", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(state, { kind: "pause", now: 2000, reason: "waiting" }, 2000);
    const drifted = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/two", head: "def", path: "/repo" },
      },
      3000,
    );
    expect(drifted).toMatchObject({
      backstop: { startedAt: 1000 },
      phase: "build",
      status: "paused",
    });
    expect(isWorkflowSnapshot(drifted)).toBe(true);
    expect(backstopState(drifted, 5000)).toBe(backstopState(state, 5000));
  });

  it("enforces paused, blocked, phase, cut, backstop, and completion invariants", () => {
    expect.hasAssertions();
    let state = createWorkflow("Invariant", "/repo", 1);
    state = applyWorkflowAction(state, {
      id: "DEC-001",
      kind: "record_issue",
      issueType: "decision",
      reason: "Choose the public contract",
    });
    expect(state).toMatchObject({ status: "blocked", unresolved: [{ id: "DEC-001" }] });
    expect(() => applyWorkflowAction(state, evidence("problem"))).toThrow(/blocked/iu);
    state = applyWorkflowAction(
      state,
      {
        id: "DEC-001",
        kind: "resolve_issue",
        reason: "Human chose the bounded contract",
      },
      2,
    );
    expect(state).toMatchObject({
      resolvedDecisions: [
        { id: "DEC-001", reason: "Human chose the bounded contract", timestamp: 2 },
      ],
      status: "active",
    });

    state = applyWorkflowAction(state, { kind: "pause", now: 2, reason: "wait" });
    expect(() => applyWorkflowAction(state, evidence("problem"))).toThrow(/paused/iu);
    state = applyWorkflowAction(state, { kind: "resume", now: 3 });
    expect(() =>
      applyWorkflowAction(state, { id: "VS-001", kind: "register_slice", path: "slice.md" }),
    ).toThrow(/plan or build phase/iu);

    let build = toBuild();
    expect(() =>
      applyWorkflowAction(build, { duration: "1d", kind: "set_backstop" }, 1001),
    ).toThrow(/before build/iu);
    expect(() =>
      applyWorkflowAction(
        build,
        {
          artifact: "spec",
          kind: "record_artifact",
          path: "replacement.md",
        },
        1001,
      ),
    ).toThrow(/pitch phase/iu);
    build = applyWorkflowAction(
      build,
      {
        id: "VS-001",
        kind: "set_slice",
        reason: "out of scope",
        status: "cut",
      },
      1001,
    );
    expect(() =>
      applyWorkflowAction(build, { id: "VS-001", kind: "set_slice", status: "active" }, 1001),
    ).toThrow(/terminal|illegal slice transition/iu);
    build = applyWorkflowAction(
      build,
      {
        id: "VS-001",
        kind: "restore_slice",
        reason: "Human deliberately restored scope",
        status: "planned",
      },
      1001,
    );
    expect(build.slices[0]?.status).toBe("planned");

    expect(() =>
      applyWorkflowAction(build, { kind: "finish", now: 1001, reason: "done" }, 1001),
    ).toThrow(/ready to ship/iu);
  });

  it("requires complete gate chains, unresolved-item resolution, and verified-or-cut ship scope", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(
      state,
      {
        id: "BLK-001",
        issueType: "blocker",
        kind: "record_issue",
        reason: "Verification environment unavailable",
      },
      1001,
    );
    expect(() =>
      applyWorkflowAction(state, { gate: "build", kind: "approve", now: 1001 }, 1001),
    ).toThrow(/blocked|unresolved/iu);
    state = applyWorkflowAction(
      state,
      {
        id: "BLK-001",
        kind: "resolve_issue",
        reason: "Human restored the environment",
      },
      1001,
    );
    expect(state.resolvedDecisions).toEqual([]);
    state = completeSlice(state, 1001);
    state = applyWorkflowAction(
      state,
      {
        kind: "request_transition",
        reason: "ready",
        to: "review",
      },
      1001,
    );
    const brokenChain = { ...state, gates: { plan: true } } satisfies WorkflowSnapshot;
    expect(isWorkflowSnapshot(brokenChain)).toBe(false);
    expect(() =>
      applyWorkflowAction(brokenChain, { gate: "build", kind: "approve", now: 3 }),
    ).toThrow();
  });

  it("starts backstop only once when a rewound plan is re-approved", () => {
    expect.hasAssertions();
    let state = toBuild(1000);
    state = applyWorkflowAction(state, { kind: "pause", now: 2000, reason: "waiting" }, 2000);
    state = applyWorkflowAction(state, { kind: "resume", now: 3000 }, 3000);
    state = applyWorkflowAction(state, { kind: "rewind", phase: "plan", reason: "replan" }, 4000);
    state = applyWorkflowAction(state, evidence("validation-contract"), 4001);
    state = applyWorkflowAction(state, evidence("workspace-decision"), 4001);
    state = applyWorkflowAction(state, evidence("plan-simplification"), 4001);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "replanned", to: "build" },
      4001,
    );
    state = applyWorkflowAction(state, { gate: "plan", kind: "approve", now: 5000 }, 5000);
    expect(state.backstop).toMatchObject({ startedAt: 1000 });
  });

  it("bounds every derived attention value at maximum accepted inputs", () => {
    expect.hasAssertions();
    const maximum = "x".repeat(500);
    let state = createWorkflow("Attention", "/repo", 1);
    state = applyWorkflowAction(state, {
      id: "DEC-001",
      issueType: "decision",
      kind: "record_issue",
      reason: maximum,
    });
    expect(state.attention?.length).toBeLessThanOrEqual(500);
    state = applyWorkflowAction(
      state,
      { id: "DEC-001", kind: "resolve_issue", reason: maximum },
      2,
    );
    state = applyWorkflowAction(state, { kind: "abandon", reason: maximum }, 3);
    expect(state.attention).toHaveLength(500);

    let build = toBuild();
    build = applyWorkflowAction(
      build,
      {
        kind: "observe_missing_artifacts",
        paths: Array.from(
          { length: 50 },
          (_, index) => `specs/${String(index).padStart(2, "0")}-${"p".repeat(280)}.md`,
        ),
      },
      1001,
    );
    expect(build.attention?.length).toBeLessThanOrEqual(500);
    expect(isWorkflowSnapshot(build)).toBe(true);
  });

  it("requires matching typed receipts, supports multiple actions, and finishes explicitly", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = completeSlice(state, 1001);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "ready", to: "review" },
      1002,
    );
    for (const kind of [
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
      "final-verification",
    ])
      state = applyWorkflowAction(state, evidence(kind, "VS-001"), 1003);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "ready", to: "ship" },
      1004,
    );

    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "record_outcome", receipt: "PR merged", shipAction: "merge" },
        1005,
      ),
    ).toThrow(/direct human/iu);
    state = applyWorkflowAction(
      state,
      { action: "merge", kind: "authorize_ship", now: 1005, reason: "merge reviewed PR" },
      1005,
    );
    expect(state.pendingShipAction).toMatchObject({
      action: "merge",
      path: "/repo",
      timestamp: 1005,
    });
    expect(() =>
      applyWorkflowAction(
        state,
        { action: "push", kind: "authorize_ship", now: 1005, reason: "also push" },
        1005,
      ),
    ).toThrow(/already authorized/iu);
    expect(() =>
      applyWorkflowAction(state, { kind: "finish", now: 1005, reason: "too early" }, 1005),
    ).toThrow(/pending merge/iu);
    const cancelled = applyWorkflowAction(
      state,
      { kind: "cancel_ship", now: 1005, reason: "merge no longer requested" },
      1005,
    );
    expect(cancelled.pendingShipAction).toBeUndefined();
    expect(() =>
      applyWorkflowAction(
        cancelled,
        { kind: "cancel_ship", now: 1005, reason: "nothing pending" },
        1005,
      ),
    ).toThrow(/no ship authorization/iu);
    state = applyWorkflowAction(
      cancelled,
      { action: "merge", kind: "authorize_ship", now: 1005, reason: "merge reviewed PR" },
      1005,
    );
    const rerouted = applyWorkflowAction(
      state,
      { kind: "observe_workspace", workspace: { path: "/other-worktree" } },
      1005,
    );
    expect(() =>
      applyWorkflowAction(
        rerouted,
        { kind: "record_outcome", receipt: "PR merged", shipAction: "merge" },
        1005,
      ),
    ).toThrow(/workspace changed/iu);
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "record_outcome", receipt: "origin updated", shipAction: "push" },
        1005,
      ),
    ).toThrow(/does not match/iu);
    state = applyWorkflowAction(
      state,
      { kind: "record_outcome", receipt: "PR merged", shipAction: "merge" },
      1006,
    );
    expect(state).toMatchObject({
      outcomes: [{ action: "merge", receipt: "PR merged", timestamp: 1006 }],
      phase: "ship",
      status: "active",
    });
    expect(state.pendingShipAction).toBeUndefined();

    state = applyWorkflowAction(
      state,
      { action: "push", kind: "authorize_ship", now: 1007, reason: "publish merged branch" },
      1007,
    );
    const editedAfterPushAuthorization = applyWorkflowAction(
      state,
      { kind: "observe_workspace", workspace: { path: "/repo", tree: "sha256:changed" } },
      1007,
    );
    expect(() =>
      applyWorkflowAction(
        editedAfterPushAuthorization,
        { kind: "record_outcome", receipt: "origin updated", shipAction: "push" },
        1008,
      ),
    ).toThrow(/workspace changed/iu);
    state = applyWorkflowAction(
      state,
      { kind: "record_outcome", receipt: "origin updated", shipAction: "push" },
      1008,
    );
    expect(state.outcomes.map((item) => (typeof item === "string" ? item : item.action))).toEqual([
      "merge",
      "push",
    ]);
    const staleReview = {
      ...state,
      evidence: state.evidence.map((item) =>
        item.kind === "final-verification" ? { ...item, stale: true as const } : item,
      ),
    };
    expect(() =>
      applyWorkflowAction(
        staleReview,
        { kind: "finish", now: 1009, reason: "Human accepted completion" },
        1009,
      ),
    ).toThrow(/final-verification/iu);
    state = applyWorkflowAction(
      state,
      { kind: "finish", now: 1009, reason: "Human accepted completion" },
      1009,
    );
    expect(state.status).toBe("completed");
    expect(() => applyWorkflowAction(state, evidence("late"))).toThrow(/cannot be mutated/iu);
  });

  it("replays only the newest matching custom entry and blocks malformed state", () => {
    expect.hasAssertions();
    const valid = createWorkflow("Replay", "/repo", 1);
    expect(snapshotFromBranch([])).toEqual({ corrupt: false });
    expect(
      snapshotFromBranch([
        { type: "message" },
        { customType: "other", data: valid, type: "custom" },
      ]),
    ).toEqual({ corrupt: false });
    const resolved = {
      ...valid,
      resolvedDecisions: [{ id: "DEC-001", reason: "Human chose", timestamp: 2 }],
    };
    expect(
      snapshotFromBranch([{ customType: STATE_TYPE, data: resolved, type: "custom" }]),
    ).toEqual({
      corrupt: false,
      snapshot: resolved,
    });
    const legacyOutcome = { ...resolved, outcomes: ["PR created before typed receipts"] };
    expect(
      snapshotFromBranch([{ customType: STATE_TYPE, data: legacyOutcome, type: "custom" }]),
    ).toEqual({ corrupt: false, snapshot: legacyOutcome });
    expect(
      snapshotFromBranch([
        { customType: STATE_TYPE, data: valid, type: "custom" },
        { customType: STATE_TYPE, data: { version: 99 }, type: "custom" },
      ]),
    ).toEqual({ corrupt: true });
  });

  it("rejects malformed snapshots and bounded collections atomically", () => {
    expect.hasAssertions();
    const initial = createWorkflow("Atomic", "/repo", 1);
    expect(isWorkflowSnapshot(initial)).toBe(true);
    expect(
      isWorkflowSnapshot({
        ...initial,
        evidence: [
          {
            claim: "bound",
            kind: "problem",
            reference: "test",
            sensitivity: "private",
            tree: "sha256:one",
          },
        ],
        workspace: { path: "/repo", tree: "sha256:one" },
      }),
    ).toBe(true);
    for (const invalid of [
      null,
      {},
      { ...initial, attention: "" },
      { ...initial, title: "" },
      { ...initial, workflowId: "bad id" },
      { ...initial, outcomes: [" "] },
      {
        ...initial,
        outcomes: [{ action: "unknown", receipt: "done", timestamp: 1 }],
      },
      {
        ...initial,
        outcomes: [{ action: "merge", receipt: " ", timestamp: 1 }],
      },
      {
        ...initial,
        outcomes: [{ action: "merge", receipt: "done", timestamp: -1 }],
      },
      {
        ...initial,
        pendingShipAction: { action: "merge", reason: "approved", timestamp: 1 },
      },
      {
        ...initial,
        pendingShipAction: { action: "unknown", reason: "approved", timestamp: 1 },
      },
      {
        ...initial,
        resolvedDecisions: [{ id: "DEC-001", reason: "chosen", timestamp: -1 }],
      },
      {
        ...initial,
        resolvedDecisions: [{ id: "DEC-001", reason: "chosen", timestamp: 1 }],
        status: "blocked",
        unresolved: [{ id: "DEC-001", issueType: "decision", reason: "again" }],
      },
      {
        ...initial,
        resolvedDecisions: Array.from({ length: 51 }, (_, index) => ({
          id: `DEC-${String(index).padStart(3, "0")}`,
          reason: "chosen",
          timestamp: index,
        })),
      },
      { ...initial, evidence: [{ claim: "", kind: "x", reference: "x", sensitivity: "public" }] },
      { ...initial, backstop: { durationMs: Infinity, label: "1d" } },
      { ...initial, backstop: { durationMs: 10, label: "1d", pausedAt: 2, pausedMs: 0 } },
      { ...initial, gates: { pitch: true } },
      { ...initial, phase: "discover", status: "completed" },
      { ...initial, transitionRequest: { reason: "", to: "pitch" } },
      {
        ...initial,
        unresolved: Array.from({ length: 21 }, (_, index) => ({
          id: `BLK-${String(index).padStart(3, "0")}`,
          issueType: "blocker",
          reason: "x",
        })),
      },
      { ...initial, unexpected: true },
      { ...initial, version: 2 },
      { ...initial, revision: -1 },
      { ...initial, phase: "wat" },
      { ...initial, status: "wat" },
      { ...initial, workspace: {} },
      { ...initial, workspace: { path: "/repo", tree: "" } },
      { ...initial, evidence: "bad" },
      {
        ...initial,
        evidence: [
          {
            claim: "bound",
            kind: "problem",
            reference: "test",
            sensitivity: "private",
            tree: "",
          },
        ],
      },
      {
        ...initial,
        slices: [
          { id: "VS-001", path: "a", status: "active" },
          { id: "VS-001", path: "b", status: "planned" },
        ],
      },
      {
        ...initial,
        slices: [
          { id: "VS-001", path: "a", status: "active" },
          { id: "VS-002", path: "b", status: "active" },
        ],
      },
    ]) {
      expect(isWorkflowSnapshot(invalid)).toBe(false);
    }
    expect(() => createWorkflow(" ", "/repo", 1)).toThrow();
    expect(() =>
      applyWorkflowAction(initial, { kind: "abandon", reason: "done" }, 2),
    ).not.toThrow();
    expect(initial.status).toBe("active");
  });
});

describe("approved workflow hardening", () => {
  it("requires a validated research artifact before a Discover checkpoint", () => {
    expect.hasAssertions();
    const initial = createWorkflow("Research", "/repo", 1);
    const recorded = applyWorkflowAction(
      initial,
      { artifact: "research", kind: "record_artifact", path: "specs/change/research.md" },
      2,
    );
    expect(recorded.artifacts).toMatchObject({ research: "specs/change/research.md" });
    expect(workflowNextAction(recorded, 2)).toBe("record problem evidence");
  });

  it("creates one shaping checkpoint and records Refine or Advance without a second command", () => {
    expect.hasAssertions();
    let state = createWorkflow("Checkpoint", "/repo", 1);
    state = applyWorkflowAction(
      state,
      { artifact: "research", kind: "record_artifact", path: "research.md" },
      2,
    );
    state = applyWorkflowAction(state, evidence("problem"), 2);
    state = applyWorkflowAction(state, evidence("research"), 2);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "discovery is ready", to: "pitch" },
      2,
    );
    expect(workflowNextAction(state, 2)).toMatch(/Refine again or Approve and continue/u);
    expect(formatWorkflow(state, 2)).toContain("Question input:");
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "request_transition", reason: "duplicate", to: "pitch" },
        2,
      ),
    ).toThrow(/unique/iu);
    const firstQuestion = JSON.stringify(state.pendingCheckpoint?.question);
    let refining = resolveCheckpoint(state, "refine", 3);
    refining = applyWorkflowAction(
      refining,
      { kind: "request_transition", reason: "refined discovery is ready", to: "pitch" },
      4,
    );
    expect(JSON.stringify(refining.pendingCheckpoint?.question)).not.toBe(firstQuestion);
    const advanced = resolveCheckpoint(state, "advance", 3);
    expect(advanced).toMatchObject({
      checkpointDecisions: [{ phase: "discover", selection: "advance", timestamp: 3 }],
      phase: "pitch",
    });
  });

  it("rejects unregistered, wrong-phase, and pre-recorded per-slice evidence", () => {
    expect.hasAssertions();
    const discover = createWorkflow("Evidence", "/repo", 1);
    expect(() => applyWorkflowAction(discover, evidence("unknown"), 2)).toThrow(/registered/iu);
    expect(() => applyWorkflowAction(discover, evidence("red", "VS-001"), 2)).toThrow(
      /only during build/iu,
    );
    const build = toBuild();
    expect(() => applyWorkflowAction(build, evidence("red", "VS-001"), 2)).toThrow(/active/iu);
  });

  it("requires useful verified scope and returns an actionable blocked-slice next step", () => {
    expect.hasAssertions();
    let build = toBuild();
    build = applyWorkflowAction(build, { id: "VS-001", kind: "set_slice", status: "active" }, 2);
    build = applyWorkflowAction(
      build,
      { id: "VS-001", kind: "set_slice", reason: "waiting for a decision", status: "blocked" },
      2,
    );
    expect(workflowNextAction(build, 2)).toBe("reactivate or cut blocked slice VS-001");
    build = applyWorkflowAction(
      build,
      { id: "VS-001", kind: "set_slice", reason: "no valuable scope remains", status: "cut" },
      3,
    );
    expect(() =>
      applyWorkflowAction(
        build,
        { kind: "request_transition", reason: "nothing retained", to: "review" },
        4,
      ),
    ).toThrow(/at least one verified slice/iu);
  });

  it("rejects self, duplicate, and unregistered slice dependencies", () => {
    expect.hasAssertions();
    const build = toBuild();
    for (const dependsOn of [["VS-002"], ["VS-001", "VS-001"], ["VS-999"]])
      expect(() =>
        applyWorkflowAction(
          build,
          {
            dependsOn,
            id: "VS-002",
            kind: "register_slice",
            path: "specs/change/slices/VS-002.md",
          },
          2,
        ),
      ).toThrow(/itself|duplicate|unregistered/iu);
    const [first] = build.slices;
    expect(first).toBeDefined();
    if (first === undefined) throw new Error("Expected the first registered slice.");
    expect(
      isWorkflowSnapshot({
        ...build,
        slices: [
          { ...first, dependsOn: ["VS-002"] },
          {
            dependsOn: ["VS-001"],
            id: "VS-002",
            path: "specs/change/slices/VS-002.md",
            status: "planned",
          },
        ],
      }),
    ).toBe(false);
  });

  it("rewinds to Discover and clears a checkpoint when research.md disappears", () => {
    expect.hasAssertions();
    const build = toBuild();
    const rewound = applyWorkflowAction(
      build,
      { kind: "observe_missing_artifacts", paths: ["specs/change/research.md"] },
      2,
    );
    expect(rewound).toMatchObject({ gates: {}, phase: "discover" });
    expect(rewound.pendingCheckpoint).toBeUndefined();
    expect(rewound.evidence.find((item) => item.kind === "research")?.stale).toBe(true);
  });
});
