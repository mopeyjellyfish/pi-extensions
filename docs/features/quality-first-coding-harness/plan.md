# Plan: Quality-first coding harness

Resume by inspecting Git, then work the first unchecked slice. Reorder, rewrite,
split, merge, or delete pending slices when implementation teaches something
new.

When the `todo` tool is available, derive checked/total progress and the first
unchecked slice from this plan. Reconcile one rolling
`Shape quality-first-coding-harness:` item. Keep `plan.md` authoritative and
preserve unrelated todos.

## [x] 001 — Establish retained execution and efficient evidence boundaries

### Outcome

The aggregate has one exclusive writer lease, retained routine repair, fresh
review, selective durable QA records, and material-delta handoffs.

### Pitch trace

- [Preserve efficiency and bug fixes](pitch.md#preserve-efficiency-and-bug-fixes)
- AC-012 through AC-017

### Implementation

Add the first `developing-changes` route and `/develop` prompt. Transfer a
non-tiny Shape slice to one fresh retained writer. Resume the latest returned
`runId` for routine repair. Invalidate retained context after a material intent
change.

Make one-shot QA ephemeral by default. Keep durable records for requested,
recurring, or comparative QA. Require material-delta worker and QA handoffs.
Exclude `.pi/subagents/` artifacts from repository tooling.

### Validation

Focused package and aggregate contract tests passed. Standalone prerequisite,
deterministic startup, idle reload, five route probes, source smoke, full
checks, and fresh review passed before the first PR update. The branch was
rebased onto current `origin/main`. Current main's Playwright cleanup safeguards
were preserved.

### Done when

The preserved contracts remain covered after all corrective slices. The final
diff contains no delegated-agent artifacts, QA cleanup regression, or weakened
review gate.

## [x] 002 — Execute one small behavior through public-seam TDD

### Outcome

`/work` can execute one accepted, sequential, low-risk change in the parent. It
proves one intended red result and the minimum green result at a public seam.

### Pitch trace

- [Canonical work contract](pitch.md#canonical-work-contract)
- [Test-driven development](pitch.md#test-driven-development)
- [Engineering practices](pitch.md#engineering-practices)
- AC-002, AC-004, and AC-007 through AC-010

### Implementation

In `packages/engineering/`, first add one failing resource-contract test for the
public `/work` route and its required method skills. Confirm that it fails
because the resources and composition are missing.

Add the focused work skill, `/work` prompt, `test-driven-development` skill, and
`engineering-practices` skill. Work owns the canonical implementation method.
For a direct small change, it applies the same TDD and design evidence as a
writer without delegation overhead.

Keep TDD, design, and orchestration as separate skills. TDD defines public-seam
red and green only. Engineering practices define evidence-based reuse, DRY,
cohesion, substitution, dependency, interface depth, naming, failure, and
cleanup rules. Work composes them.

### Validation

- Record the focused test's intended red failure before adding production
  resources.
- Run
  `npm test -- --run packages/engineering/test/resources.test.ts`
  and confirm green.
- Probe the engineering package and confirm `/work` discovers its method skills
  or reports the actionable companion prerequisite.
- Send the stable slice diff to one fresh Sol `high` reviewer.
- Run focused Markdown, formatting, and diff checks.

### Done when

The direct `/work` seam is packaged and documented. Its contract requires
intended red and minimum green evidence for behavioral code. Pure refactors and
non-behavioral changes use applicable tests or focused validation without
manufactured failures.

## [x] 003 — Keep bug diagnosis and routine repair with one retained writer

### Outcome

`/work` selects a retained writer before non-trivial bug diagnosis. A fresh
review sends routine defects to the latest writer `runId` without a second
implementation context.

### Pitch trace

- [Canonical work contract](pitch.md#canonical-work-contract)
- [Preserve efficiency and bug fixes](pitch.md#preserve-efficiency-and-bug-fixes)
- AC-006 and AC-010 through AC-014

### Implementation

Add one failing engineering contract test for bug route order. Confirm its
intended failure. Extend work only enough to select direct or retained execution
before applying `diagnosing-bugs`, then confirm that test is green. The selected
executor owns reproduction, caller and sibling tracing, root-cause repair, and
the regression test as the first red result.

Next, add one failing aggregate-agent contract test for TDD and
engineering-practices loading. Confirm its intended failure. Load TDD and
engineering practices for the worker and engineering practices for the
reviewer, then confirm that test is green.

For non-trivial work, launch one fresh writer with the worktree lease. Apply Sol
`medium` normally and Sol `high` for the repository-defined risk classes.

Keep fresh Sol `high` review, latest-`runId` routine repair, material-decision
escalation, material-delta handoffs, and final parent verification in the work
contract. Do not copy these rules into develop, diagnosis, or TDD.

### Validation

- Record the intended red failures for route order and agent skill loading.
- Run
  `npm test -- --run packages/engineering/test/resources.test.ts test/tooling/subagents.test.ts`
  and confirm green.
- Probe retained bug work. Confirm writer selection occurs before diagnosis,
  the regression check is red before green, and a routine repair resumes the
  latest writer run.
- Send the stable slice diff to one fresh Sol `high` reviewer.
- Run focused Markdown, formatting, and diff checks.

### Done when

The parent does not complete a non-trivial bug repair before delegation. The
retained writer owns diagnosis, TDD, repair, and focused checks. Fresh review
and routine same-writer repair remain mandatory.

## [x] 004 — Turn accepted Shape intent into plan and work

### Outcome

Shape hands an accepted pitch to first-party plan. Plan creates vertical slices
and hands each accepted slice to the canonical work contract without copying
execution policy.

### Pitch trace

- [First-party skill system](pitch.md#first-party-skill-system)
- [Package boundary](pitch.md#package-boundary)
- AC-001 through AC-005 and AC-017

### Implementation

In `packages/feature-flow/`, first add a failing contract test for the plan
resource, `/plan` prompt, and Shape-to-plan-to-work composition. Confirm that it
fails because these resources and handoffs are missing.

Add one focused plan skill and `/plan` prompt. Plan creates the smallest ordered
vertical slices with public seams, observable behavior, applicable validation,
and objective done conditions. It does not implement or copy work policy.

Reduce Shape's build section to feature-specific behavior. Shape owns
Worktrunk, pitch approval, durable plan state, integrated feature paths, the
worktree-wide lease invariant, and material-change reapproval. Work selects the
implementation executor and transfers the lease. A material decision returns
the lease to Shape before pitch revision.

At activation, Shape and plan check the aggregate tools, skills, and agents that
the next gate needs. Missing companions block with actionable install guidance.
The package remains independently publishable and installable but does not
claim standalone execution.

### Validation

- Record the focused test's intended red failure before adding production
  resources.
- Run
  `npm test -- --run packages/feature-flow/test/resources.test.ts packages/engineering/test/resources.test.ts`
  and confirm green.
- Run the standalone feature-flow source probe. Confirm resource discovery and
  actionable blocked behavior when companions are absent.
- In the aggregate, probe Shape to plan to work. Confirm that work is the only
  implementation policy owner.
- Send the stable slice diff to one fresh Sol `high` reviewer.
- Run focused Markdown, formatting, and diff checks.

### Done when

Shape, plan, and work have distinct responsibilities. Shape and plan contain no
copy of direct-versus-retained selection, model risk, formal review, or routine
repair policy.

## [x] 005 — Route the complete first-party harness and update PR #52

### Outcome

`/develop` routes features, plans, small work, bugs, and QA through the complete
first-party skill set. The aggregate reloads cleanly and PR #52 contains final
evidence.

### Pitch trace

- [First-party skill system](pitch.md#first-party-skill-system)
- [Preserve efficiency and bug fixes](pitch.md#preserve-efficiency-and-bug-fixes)
- AC-001 through AC-020

### Implementation

Exercise each develop route as one red and green cycle. Add one assertion for
one route, confirm its intended failure, make the minimum router change, and
confirm green before adding the next route assertion. Cover Shape, plan, work,
diagnosis inside work, and QA without copying their methods.

After every route is green, update `/develop`, package READMEs, and the root README.
Keep the aggregate and `pi-subagents` prerequisite. Preserve selective QA
records, Playwright workspace-scoped targeted cleanup, material-delta handoffs,
artifact exclusions, and QA's separation from formal review.

Update tests to prove composition and preserved behavior. Do not assert repeated
workflow prose. Production resources, manifests, prompts, agent contracts,
tests, and imports must not copy, package, load, or integrate Flywheel,
Superpowers, or BigPowers. Feature records can name those systems only to record
the exclusion.

### Validation

- Record the route contract's intended red failure, then run
  `npm test -- --run packages/engineering/test/resources.test.ts packages/feature-flow/test/resources.test.ts test/tooling/subagents.test.ts`
  and confirm green.
- Run one fresh Sol `high` fixed-point review against the accepted pitch and
  full diff. Send routine findings to the latest retained writer. Re-review
  material repairs.
- Run standalone engineering and feature-flow probes for discovery and blocked
  prerequisites.
- Start the deterministic aggregate session with validated
  `pi-subagents@0.43.0`. Run focused tests before an idle `/reload`.
- After reload, exercise and record these routes in
  `/tmp/quality-first-coding-harness-acceptance.md`:

  | Route                 | Expected result                                                                         |
  | --------------------- | --------------------------------------------------------------------------------------- |
  | Shape to plan to work | Shape owns intent, plan creates slices, and work owns execution policy.                 |
  | Accepted small work   | Parent-direct work applies public-seam red/green without delegation overhead.           |
  | Retained bug work     | Work selects the writer before diagnosis. The regression check is the first red result. |
  | Routine repair        | Fresh review returns a routine defect to the latest retained writer `runId`.            |
  | One-shot QA           | Fresh Luna `medium` QA returns evidence without `docs/qa/` and does not replace review. |

- Record route, model and effort, lease ownership and transfer, red and green
  evidence, reviewer or QA behavior, checks, token data when available,
  failures, and residual risks.
- Run `npm run smoke:source`, then `VITEST_MAX_WORKERS=1 npm run check` if high
  host load still causes unrelated parallel LSP timing failures. State the
  bounded worker override in evidence.
- Run `git diff --check` and inspect package, release, dependency, credential,
  and artifact hygiene.
- Validate package-scoped Conventional Commits. Update the authorized branch and
  PR #52. Verify title, body, base, head, mergeability, and checks.

### Done when

The accepted pitch criteria hold. All first-slice fixes remain covered. Focused,
live, smoke, full, and independent review gates pass. Valid Conventional
Commits update the branch and PR #52 with final checks and residual risks.
