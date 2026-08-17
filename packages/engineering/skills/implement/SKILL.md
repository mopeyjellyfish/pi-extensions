---
name: implement
description: >-
  Delivers accepted work and continues accepted plans through explicit
  checkpoints, focused proof, fixed review, and bounded publication.
---

# Implement

Accept one approved slice, bounded request, or confirmed bug outcome. Read
repository instructions, Git state, and public contracts, then accepted intent
and nearest tests before editing. Preserve unrelated changes and
identify the required completion checks.

Before any edit, verify that the session is rooted in, or Pi is routed to, an
isolated linked worktree. Reuse the same task worktree that holds the accepted
pitch and plan. For a plan-less request, use safe worktree tooling to create and
activate a short task branch. Never edit the main checkout. If no safe tooling
is available, stop before editing and ask the human to provide an isolated
worktree. Do not create a nested worktree when already in the correct one. In a
fresh worktree, follow the repository-defined runtime and dependency setup
before the first test, build, or generated-file command. Verify the required
tool is available and treat setup failures separately from behavior failures.

## Select execution

Complete accepted plan execution follows dependency order without replanning.
For a complete accepted plan, consume every accepted slice in planned dependency
order without replanning between slices. A `parallel-ready` plan executes
planned parallel lanes in isolated worktrees with sole write ownership only
when their dependencies are complete. Do not add workers merely because work is
large. Keep overlapping work serial. The parent
synthesizes results and verifies evidence before accepting each unit. A serial
delivery unit reuses the same writer and same worktree through its dependent
slices. A plan-less bounded request, an approved slice, or a confirmed bug
outcome may proceed as one unit.

When the configured `worker` capability is available, it is the only configured
implementation child. The `worker` is the only configured implementation child
for standard work, plan-less bounded requests, confirmed bugs, and accepted hard
work. Launch one fresh foreground `worker` for standard work,
plan-less bounded requests, confirmed bugs, and accepted hard work. Give it the
accepted pitch and plan paths, exact slice, worktree, repository-defined setup,
completion conditions, and required checks. A trivial bounded change — one
obvious fix with one obvious focused check — may remain directly as the parent. If Worker is unavailable, the direct parent executes the unit.

Do not silently select a higher-capability role. A high-capability run requires
an explicit approval stating evidence, expected benefit, and bounded task. State
a delegation's critical-path, parent-context, or independent evidence benefit;
do not delegate without one. Use bounded Utility or QA support only when it
usefully shortens the critical path; the parent retains routing, synthesis, and
approval. If observed coordination materially exceeds the accepted forecast,
pause before more delivery steps, report the variance, and seek fresh approval
only when changed delivery boundaries or authority require it. When no accepted
forecast exists, report material coordination growth against the bounded request
instead of creating planning overhead.

## Deliver each unit

For behavioral implementation, the executor must load and follow
`test-driven-development`. If that skill is unavailable, the direct parent
requires intended failing and passing proof at the approved public seam.
Documentation, metadata, and mechanical work use the smallest focused validation
that detects the intended error; do not manufacture a behavioral test.

A confirmed bug outcome consumes the diagnosis evidence and regression seam
from `diagnosing-bugs`. If the cause or outcome is unconfirmed, load and follow
`diagnosing-bugs` before implementation. If that skill is unavailable, the
direct parent first requires a reproducible symptom, identified cause, and
regression seam.

Use focused tests before required completion checks. When an accepted plan
exists, use its invalidation map as the validation ladder; otherwise derive the
smallest ladder from the changed surfaces without creating a forecast. Run
focused slice proof while developing, affected-boundary checks when a boundary
changes, and integration proof when dependent slices join. Unchanged evidence
may be reused at intermediate stages only while its covered surface is unchanged. Run the
complete required-check set once at the stable delivery-unit boundary; no reused
intermediate evidence removes that final gate. After a revision, rerun only its
invalidated evidence plus the required stable-boundary gate.

At the stable delivery-unit boundary, the parent inspects the final diff for
scope, package, release, dependency, and artifact hygiene, plus security,
cancellation, cleanup, and user-visible documentation. Build complete work evidence: changed files, red and
green evidence or an explicit test exception, focused and required check
results, residual risks, and delivery state.

## Fixed review and acceptance

The complete work evidence document supports Review, Revise, Deepen verification,
or Pause before acceptance. One fixed formal review occurs at each stable
completed delivery unit. When a configured `reviewer` capability exists, it
must load and follow `code-review` with fresh read-only context. Give it the
worktree, fixed-point intent (pitch, plan, or request), base ref and fixed diff,
changed files, and verification evidence. Return a material review revision to
the same writer, rerun invalidated evidence, and complete the required final
gate. If the reviewer is unavailable, the direct parent loads and follows
`code-review`.

Present the evidence and an explicit **Accept and publish** action. Acceptance
invokes `commit` and `open-pr` with no second mutation prompt. These focused
delivery skills own publication; lifecycle guidance must not issue ad hoc Git
commands. For a planned stack, `open-pr` must use `gh stack`; if focused
delivery or required stack tooling is unavailable, fail closed, preserve local
work and evidence, and state the recovery action.

Acceptance authorizes only the verified planned unit and named task branch. It
does not authorize merge, deployment, release, plain force push, cleanup,
destructive actions, or unrelated changes.

## Continue an accepted plan

When a complete accepted plan has another delivery unit after the current unit
is accepted and committed, and any authorized publication has completed, the
parent summarizes progress and explains the next planned unit: its observable outcome, dependencies and
readiness, intended proof and checks, and place in remaining plan progress. Then
use the `question` tool with exactly these actions: **Continue**, **Review next
unit**, and **Discuss**. If `question` is unavailable or the human cancels,
present the same three choices in conversation, wait, and do not start the next
unit.

**Continue** launches the next ready delivery unit or planned ready lane set in
accepted dependency order without replanning. **Review next unit** pauses
implementation and reviews that next unit against the accepted pitch and plan;
it does not duplicate the completed unit's fixed formal review. **Discuss**
pauses execution for questions or potential changes. Do not silently alter the
accepted plan. If discussion changes accepted scope, delivery boundaries,
dependencies, or authority, route through the appropriate planning and approval
flow before implementation resumes. After **Review next unit** or **Discuss**
finishes without an accepted plan change, control returns to the same checkpoint.

Repeat this checkpoint until no planned delivery units remain, then report plan
completion rather than prompting for a nonexistent next unit. Plan-less requests
and single-unit plans must not gain a next-unit prompt.
