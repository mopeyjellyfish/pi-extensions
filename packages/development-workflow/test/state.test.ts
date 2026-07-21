import { describe, expect, it } from "vitest";

import {
  validatePitchDocument,
  validatePlanDocument,
  validateSliceDocument,
} from "../src/artifacts.ts";
import {
  STATE_TYPE,
  appetiteState,
  applyWorkflowAction,
  createWorkflow,
  formatWorkflow,
  isWorkflowSnapshot,
  parseAppetite,
  snapshotFromBranch,
  workflowSummary,
  type WorkflowSnapshot,
} from "../src/state.ts";

const pitch = `---
schema: dev-workflow/pitch-v1
id: PITCH-001
---
# Problem
A developer loses the current decision when a session branches.
# Appetite
Two days; scope is variable and quality is fixed.
# Solution
Use a branch-local ledger and a thin control command.
### Acceptance Signals
The active branch restores exactly one valid state.
# Rabbit Holes
Do not build a project database or background watcher.
# No-Gos
No automatic remote Git actions.
`;

const plan = `# Plan

Pitch: [PITCH-001](./spec.md)
## Appetite
Two days with variable scope.
## No-Gos
No project database.
## Vertical Slices
The first integrated slice is [VS-001](./slices/VS-001.md).
## Dependencies and Sequencing
VS-001 has no dependencies and is first.
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
# RED
A public behavior test fails before implementation.
# GREEN
Implement only the path needed by the failing test.
# Verification
Run the focused package test and source smoke.
# Done When
The behavior is demonstrable and evidence is recorded.
`;

function evidence(kind: string) {
  return {
    evidence: {
      claim: `${kind} exists`,
      kind,
      reference: `test:${kind}`,
      sensitivity: "public" as const,
    },
    kind: "record_evidence" as const,
  };
}

function toBuild(now = 1000): WorkflowSnapshot {
  let state = createWorkflow("Feature", "/repo", 1);
  state = applyWorkflowAction(state, evidence("problem"), now);
  state = applyWorkflowAction(state, evidence("research-not-needed"), now);
  state = applyWorkflowAction(
    state,
    { kind: "request_transition", reason: "problem understood", to: "pitch" },
    now,
  );
  state = applyWorkflowAction(state, { gate: "discover", kind: "approve", now }, now);
  state = applyWorkflowAction(
    state,
    { artifact: "spec", kind: "record_artifact", path: "specs/change/spec.md" },
    now,
  );
  state = applyWorkflowAction(state, { duration: "2d", kind: "set_appetite" }, now);
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
  state = applyWorkflowAction(
    state,
    { kind: "request_transition", reason: "first slice ready", to: "build" },
    now,
  );
  return applyWorkflowAction(state, { gate: "plan", kind: "approve", now }, now);
}

describe("workflow artifact contracts", () => {
  it("accepts complete pitches and integrated slices", () => {
    expect.hasAssertions();
    expect(validatePitchDocument(pitch)).toEqual({ id: "PITCH-001", valid: true });
    expect(validatePlanDocument(plan)).toEqual({ id: "plan", valid: true });
    expect(validateSliceDocument(slice)).toEqual({ id: "VS-001", valid: true });
  });

  it("rejects mutable, incomplete, malformed, and horizontal artifacts", () => {
    expect.hasAssertions();
    for (const invalid of [
      pitch.replace("id: PITCH-001", "id: feature"),
      pitch.replace("schema: dev-workflow/pitch-v1", "schema: wrong"),
      pitch.replace("# Problem", "# Context"),
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
      plan.replace("## Appetite", "## Budget"),
      plan.replace("The first integrated slice", "The first item"),
      plan.replace("The first integrated slice is", "Backend first phase, then"),
      plan.replace("Pitch: [PITCH-001](./spec.md)", "Pitch is nearby."),
      plan.replace("## Dependencies and Sequencing", "## Notes"),
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
    ])
      expect(() => validateSliceDocument(invalid)).toThrow();
  });
});

describe("workflow reducer", () => {
  it("moves through approved gates and preserves integrated slice evidence", () => {
    expect.hasAssertions();
    let state = toBuild();
    expect(state.phase).toBe("build");
    expect(state.appetite?.startedAt).toBe(1000);
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1001);
    state = applyWorkflowAction(state, evidence("red"), 1002);
    state = applyWorkflowAction(state, evidence("green"), 1003);
    state = applyWorkflowAction(state, evidence("focused-verification"), 1003);
    state = applyWorkflowAction(state, evidence("regression-verification"), 1003);
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
    state = applyWorkflowAction(state, { gate: "build", kind: "approve", now: 1006 }, 1006);
    expect(state.phase).toBe("review");
    state = applyWorkflowAction(state, evidence("review-intent"), 1007);
    state = applyWorkflowAction(state, evidence("review-correctness"), 1007);
    state = applyWorkflowAction(state, evidence("review-maintainability"), 1007);
    state = applyWorkflowAction(state, evidence("review-risk-operations"), 1007);
    state = applyWorkflowAction(state, evidence("final-verification"), 1007);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "review evidence accepted", to: "ship" },
      1008,
    );
    state = applyWorkflowAction(state, { gate: "review", kind: "approve", now: 1009 }, 1009);
    state = applyWorkflowAction(
      state,
      { kind: "record_outcome", outcome: "PR created after explicit authorization" },
      1010,
    );

    expect(state).toMatchObject({ phase: "ship", status: "active", attention: "ready_to_ship" });
    expect(state.outcomes).toHaveLength(1);
    expect(formatWorkflow(state, 1010)).toContain("Phase: ship");
    expect(workflowSummary(state, 1010)).toMatchObject({
      appetite: "not_started",
      phase: "ship",
      version: 1,
    });
    expect(isWorkflowSnapshot(state)).toBe(true);
  });

  it("enforces gate prerequisites and linear transition requests", () => {
    expect.hasAssertions();
    const initial = createWorkflow("Feature", "/repo", 1);
    expect(() =>
      applyWorkflowAction(initial, { gate: "discover", kind: "approve", now: 2 }, 2),
    ).toThrow(/request transition/iu);
    expect(() =>
      applyWorkflowAction(initial, { kind: "request_transition", reason: "skip", to: "plan" }, 2),
    ).toThrow(/exactly one/iu);
    const requested = applyWorkflowAction(
      initial,
      { kind: "request_transition", reason: "ready", to: "pitch" },
      2,
    );
    expect(() =>
      applyWorkflowAction(requested, { gate: "discover", kind: "approve", now: 2 }, 2),
    ).toThrow(/problem evidence/iu);
    expect(() =>
      applyWorkflowAction(initial, { gate: "pitch", kind: "approve", now: 2 }, 2),
    ).toThrow(/while in discover/iu);
  });

  it("requires fresh TDD, verification, and review evidence at build and review gates", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(
      state,
      { id: "VS-001", kind: "set_slice", status: "verified" },
      1001,
    );
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "implemented", to: "review" },
      1002,
    );
    expect(() =>
      applyWorkflowAction(state, { gate: "build", kind: "approve", now: 1003 }, 1003),
    ).toThrow(/RED\/GREEN/iu);
    state = applyWorkflowAction(state, evidence("tdd-exception"), 1003);
    state = applyWorkflowAction(state, evidence("focused-verification"), 1003);
    state = applyWorkflowAction(state, evidence("regression-verification"), 1003);
    state = applyWorkflowAction(state, { gate: "build", kind: "approve", now: 1004 }, 1004);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "reviewed", to: "ship" },
      1005,
    );
    expect(() =>
      applyWorkflowAction(state, { gate: "review", kind: "approve", now: 1006 }, 1006),
    ).toThrow(/intent, correctness/iu);
    state = applyWorkflowAction(state, evidence("review-reduced-assurance"), 1006);
    state = applyWorkflowAction(state, evidence("final-verification"), 1006);
    expect(() =>
      applyWorkflowAction(state, { gate: "review", kind: "approve", now: 1007 }, 1007),
    ).toThrow(/intent, correctness/iu);
    for (const kind of [
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
    ]) {
      state = applyWorkflowAction(state, evidence(kind), 1007);
    }
    expect(
      applyWorkflowAction(state, { gate: "review", kind: "approve", now: 1008 }, 1008).phase,
    ).toBe("ship");
  });

  it("keeps one active slice, validates IDs and paths, and supports scope cuts", () => {
    expect.hasAssertions();
    let planState = applyWorkflowAction(
      toBuild(),
      { kind: "rewind", phase: "plan", reason: "add another integrated slice" },
      1001,
    );
    planState = applyWorkflowAction(
      planState,
      { id: "VS-002", kind: "register_slice", path: "slices/VS-002.md" },
      1001,
    );
    expect(() =>
      applyWorkflowAction(planState, { id: "bad", kind: "register_slice", path: "slice.md" }, 1001),
    ).toThrow(/VS-NNN/iu);
    expect(() =>
      applyWorkflowAction(
        planState,
        { id: "VS-001", kind: "register_slice", path: "other.md" },
        1001,
      ),
    ).toThrow(/already/iu);
    expect(() =>
      applyWorkflowAction(
        planState,
        { artifact: "plan", kind: "record_artifact", path: "../escape.md" },
        1001,
      ),
    ).toThrow(/relative/iu);
    planState = applyWorkflowAction(planState, evidence("validation-contract"), 1001);
    planState = applyWorkflowAction(planState, evidence("workspace-decision"), 1001);
    planState = applyWorkflowAction(
      planState,
      { kind: "request_transition", reason: "updated slice map ready", to: "build" },
      1001,
    );
    let state = applyWorkflowAction(planState, { gate: "plan", kind: "approve", now: 1001 }, 1001);
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1002);
    state = applyWorkflowAction(state, { id: "VS-002", kind: "set_slice", status: "active" }, 1003);
    expect(state.slices).toMatchObject([
      { id: "VS-001", status: "planned" },
      { id: "VS-002", status: "active" },
    ]);
    expect(() =>
      applyWorkflowAction(state, { id: "VS-002", kind: "set_slice", status: "cut" }, 1004),
    ).toThrow(/reason/iu);
    state = applyWorkflowAction(
      state,
      { id: "VS-002", kind: "set_slice", reason: "outside appetite", status: "cut" },
      1004,
    );
    expect(state.slices[1]?.status).toBe("cut");
    expect(() =>
      applyWorkflowAction(state, { id: "VS-999", kind: "set_slice", status: "active" }, 1005),
    ).toThrow(/not registered/iu);
  });

  it("derives appetite boundaries, pauses time, and requires explicit circuit decisions", () => {
    expect.hasAssertions();
    expect(parseAppetite("2d")).toEqual({ label: "2d", milliseconds: 172_800_000 });
    for (const value of ["", "two days", "0h", "13w"]) expect(() => parseAppetite(value)).toThrow();
    let state = toBuild(1000);
    const duration = state.appetite?.durationMs ?? 0;
    expect(appetiteState(state, 1000)).toBe("active");
    expect(appetiteState(state, 1000 + duration * 0.8)).toBe("attention");
    expect(appetiteState(state, 1000 + duration)).toBe("expired");

    state = applyWorkflowAction(
      state,
      { kind: "pause", now: 2000, reason: "waiting on user" },
      2000,
    );
    expect(state.status).toBe("paused");
    expect(() =>
      applyWorkflowAction(state, { kind: "pause", now: 2100, reason: "again" }, 2100),
    ).toThrow(/already paused/iu);
    state = applyWorkflowAction(state, { kind: "resume", now: 3000 }, 3000);
    expect(state.appetite?.pausedMs).toBe(1000);
    expect(() => applyWorkflowAction(state, { kind: "resume", now: 3100 }, 3100)).toThrow(
      /only a paused/iu,
    );

    const expiredAt = 1000 + duration + 2000;
    expect(() =>
      applyWorkflowAction(state, { kind: "record_outcome", outcome: "keep building" }, expiredAt),
    ).toThrow(/circuit breaker/iu);
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "circuit", now: 4000, outcome: "abandon", reason: "not expired" },
        4000,
      ),
    ).toThrow(/only after/iu);
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
    expect(extended.appetite?.label).toBe("1d");
    expect(extended.attention).toMatch(/explicitly extended/iu);
  });

  it("finishes verified scope, reshapes, abandons, and rewinds with stale evidence", () => {
    expect.hasAssertions();
    let state = toBuild();
    const expired = 1000 + (state.appetite?.durationMs ?? 0);
    expect(() =>
      applyWorkflowAction(
        state,
        { kind: "circuit", now: expired, outcome: "finish", reason: "time" },
        expired,
      ),
    ).toThrow(/verified/iu);
    state = applyWorkflowAction(
      state,
      { id: "VS-001", kind: "set_slice", status: "verified" },
      1001,
    );
    const withUnfinishedScope = {
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
    ).toThrow(/new appetite/iu);
  });

  it("invalidates gates and blocks affected slices when recorded artifacts disappear", () => {
    expect.hasAssertions();
    let state = toBuild();
    const before = state.revision;
    state = applyWorkflowAction(
      state,
      {
        kind: "observe_missing_artifacts",
        paths: ["specs/change/spec.md", "specs/change/slices/VS-001.md"],
      },
      1001,
    );
    expect(state.revision).toBe(before + 1);
    expect(state.attention).toMatch(/missing workflow artifacts/iu);
    expect(state.slices[0]?.status).toBe("blocked");
    expect(state.gates.pitch).toBeUndefined();
    const unchanged = applyWorkflowAction(
      state,
      {
        kind: "observe_missing_artifacts",
        paths: ["specs/change/spec.md", "specs/change/slices/VS-001.md"],
      },
      1002,
    );
    expect(unchanged.revision).toBe(state.revision);
  });

  it("stales only identity-bound evidence without rewinding Build state after drift", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(state, { id: "VS-001", kind: "set_slice", status: "active" }, 1001);
    state = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/one", head: "abc", path: "/repo" },
      },
      1002,
    );
    state = applyWorkflowAction(state, evidence("unbound-observation"), 1003);
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
        },
        kind: "record_evidence",
      },
      1003,
    );
    const unchanged = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/one", head: "abc", path: "/repo" },
      },
      1004,
    );
    expect(unchanged.revision).toBe(state.revision);
    const drifted = applyWorkflowAction(
      state,
      {
        kind: "observe_workspace",
        workspace: { branch: "feat/two", head: "def", path: "/other" },
      },
      1005,
    );
    expect(drifted).toMatchObject({
      gates: state.gates,
      phase: "build",
      slices: [{ id: "VS-001", status: "active" }],
      status: "active",
    });
    expect(
      drifted.evidence.find((item) => item.kind === "unbound-observation")?.stale,
    ).toBeUndefined();
    expect(drifted.evidence.find((item) => item.kind === "focused-verification")?.stale).toBe(true);
    expect(drifted.attention).toMatch(/identity changed/iu);
  });

  it("preserves paused status and appetite accounting across workspace drift", () => {
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
      appetite: { pausedAt: 2000, startedAt: 1000 },
      phase: "build",
      status: "paused",
    });
    expect(isWorkflowSnapshot(drifted)).toBe(true);
    expect(appetiteState(drifted, 5000)).toBe(appetiteState(state, 5000));
  });

  it("enforces paused, blocked, phase, cut, appetite, and completion invariants", () => {
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
    ).toThrow(/plan phase/iu);

    let build = toBuild();
    expect(() =>
      applyWorkflowAction(build, { duration: "1d", kind: "set_appetite" }, 1001),
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
    ).toThrow(/terminal/iu);
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

    expect(() => applyWorkflowAction(build, { kind: "complete", reason: "done" }, 1001)).toThrow(
      /ready to ship/iu,
    );
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
    state = applyWorkflowAction(
      state,
      {
        id: "VS-001",
        kind: "set_slice",
        status: "verified",
      },
      1001,
    );
    for (const kind of ["red", "green", "focused-verification", "regression-verification"]) {
      state = applyWorkflowAction(state, evidence(kind), 1001);
    }
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

  it("starts appetite only once when a rewound plan is re-approved", () => {
    expect.hasAssertions();
    let state = toBuild(1000);
    state = applyWorkflowAction(state, { kind: "pause", now: 2000, reason: "waiting" }, 2000);
    state = applyWorkflowAction(state, { kind: "resume", now: 3000 }, 3000);
    state = applyWorkflowAction(state, { kind: "rewind", phase: "plan", reason: "replan" }, 4000);
    state = applyWorkflowAction(state, evidence("validation-contract"), 4001);
    state = applyWorkflowAction(state, evidence("workspace-decision"), 4001);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "replanned", to: "build" },
      4001,
    );
    state = applyWorkflowAction(state, { gate: "plan", kind: "approve", now: 5000 }, 5000);
    expect(state.appetite).toMatchObject({ pausedMs: 1000, startedAt: 1000 });
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

  it("completes only after ready-to-ship and a recorded outcome, then becomes terminal", () => {
    expect.hasAssertions();
    let state = toBuild();
    state = applyWorkflowAction(
      state,
      { id: "VS-001", kind: "set_slice", status: "verified" },
      1001,
    );
    for (const kind of ["red", "green", "focused-verification", "regression-verification"]) {
      state = applyWorkflowAction(state, evidence(kind), 1001);
    }
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "ready", to: "review" },
      1001,
    );
    state = applyWorkflowAction(state, { gate: "build", kind: "approve", now: 1002 }, 1002);
    for (const kind of [
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
      "final-verification",
    ])
      state = applyWorkflowAction(state, evidence(kind), 1003);
    state = applyWorkflowAction(
      state,
      { kind: "request_transition", reason: "ready", to: "ship" },
      1003,
    );
    state = applyWorkflowAction(state, { gate: "review", kind: "approve", now: 1004 }, 1004);
    expect(() => applyWorkflowAction(state, { kind: "complete", reason: "shipped" }, 1005)).toThrow(
      /recorded outcome/iu,
    );
    state = applyWorkflowAction(state, { kind: "record_outcome", outcome: "PR merged" }, 1005);
    const staleReview = {
      ...state,
      evidence: state.evidence.map((item) =>
        item.kind === "final-verification" ? { ...item, stale: true as const } : item,
      ),
    };
    expect(() =>
      applyWorkflowAction(
        staleReview,
        { kind: "complete", reason: "Human accepted completion" },
        1006,
      ),
    ).toThrow(/final-verification/iu);
    state = applyWorkflowAction(
      state,
      { kind: "complete", reason: "Human accepted completion" },
      1006,
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
    for (const invalid of [
      null,
      {},
      { ...initial, attention: "" },
      { ...initial, title: "" },
      { ...initial, workflowId: "bad id" },
      { ...initial, outcomes: [" "] },
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
      { ...initial, appetite: { durationMs: Infinity, label: "1d", pausedMs: 0 } },
      { ...initial, appetite: { durationMs: 10, label: "1d", pausedAt: 2, pausedMs: 0 } },
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
      { ...initial, evidence: "bad" },
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
