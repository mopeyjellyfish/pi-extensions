---
name: implement
description: >-
  Delivers checkpointed and accept-all accepted plans through focused proof,
  fixed review, and bounded publication.
---

# Implement

Accept one approved slice, bounded request, or confirmed bug outcome. Load the
inherited target-project context and every named pitch, plan, request, and later
user decision from durable Intent sources before editing.
Read repository instructions, Git state, and public contracts, then nearest tests.
Preserve unrelated changes and identify the required completion checks. The
Business reason must be inferable from this evidence; if unclear, the parent must
ask the human to confirm it and, once confirmed with the user, record it in the
implementation spec and Worker task.

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

A complete accepted plan records its execution mode. Checkpointed implementation
is the default: checkpointed plans retain all routine prompts. Accept-all is
authority only when whole-plan approval confirms accept-all authority for the
named accepted plan; otherwise treat an accept-all preference as checkpointed.
An accept-all plan runs every named delivery unit through tests, required gates,
fixed formal review, commit, and authorized publication in dependency order
without routine Accept and publish or Continue questions. Accept-all plans pause
for setup, test, check, commit, or publication failure and return control to the
human; they also pause for material review findings, material forecast variance,
or any change to accepted scope, delivery boundaries, dependencies, or
authority. Accept-all never authorizes merge, release, deployment, destructive
cleanup, or unrelated work.

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
implementation child. Launch one fresh foreground `worker` for one worker
attempt on standard work, plan-less bounded requests, confirmed bugs, and
accepted hard work. When Pi's `subagent` tool supplies the capability, send this
argument object directly rather than putting it in `workflowScript`:

```text
agent: "worker"
task: "<rendered Worker task contract>"
cwd: "<active task worktree>"
async: false
```

Other hosts use their equivalent fixed-role foreground launch. Do not pass
`mode`, `model`, or `thinking` for this fixed-role launch; the agent profile owns
its tools, model, thinking level, and fresh-context default. A trivial bounded
change — one obvious fix with one obvious focused check — may remain directly as
the parent. If Worker is unavailable, the direct parent executes the unit.

Keep the Worker task compact. Reference durable Intent sources; do not copy a conversation transcript.
For a plan-less handoff, include the complete bounded request and every later
user decision, not a transcript. Use only this contract:

```text
Goal:
Business reason:
Intent sources:
Public seam:
Allowed files:
Explicit non-goals:
Focused failing test:
Focused validation:
Success criteria:
Stop conditions:
Output:
```

Give exact pitch and plan paths, complete bounded request, later user decisions,
slice, worktree, setup, and focused checks in those fields. Calibrate business
fit to business impact, plausible failure cost, expected lifetime and scale,
reversibility, and repository conventions. Balance delivery speed, reliability,
maintainability, and operational risk. Choose the smallest solution robust for
actual need and credible risk with a focused, bounded blast radius. Respect module
boundaries, layering, and conventions; reuse existing logic, components, and
helpers before adding an abstraction. Prevent underengineering that misses
requirements, contracts, important invariants, credible failure modes, or
changed-surface verification. Avoid overengineering: speculative abstractions,
configuration, layers, generality, safeguards, process, or verification depth
without proportionate concrete need or risk reduction. Do not append every
possible edge case or final repository gates.
Treat Worker results as `completed`, `blocked`, `variance`, or `partial`. A
blocked or variance result pauses for the parent. A partial result must not
trigger an automatic retry or a larger "finish everything" task. After a
completed initial attempt, use the first QA
failure packet for the initial repair. After later QA passes, repeat QA repair
resumes of the latest retained Worker while verifier evidence shows measurable
progress. If that Worker is not resumable or any repair returns `blocked`,
`variance`, or `partial`, return control for direct parent ownership or
replanning; do not launch a replacement Worker.

Do not impose hard turn, tool, token, or cost budgets on a mutation-capable
Worker. There is no fixed iteration, turn, tool, token, or cost limit. Such
interruption can strand an unsafe partial edit, and counts do not prove that a
slice is buildable. Use runtime counters as telemetry; enforce the boundary
through evidence of progress, explicit scope variance, and the Worker's
repeated-failure stop.

Do not silently select a higher-capability role. A high-capability run requires
an explicit approval stating evidence, expected benefit, and bounded task. State
a delegation's critical-path, parent-context, or independent evidence benefit;
do not delegate without one. Use bounded Utility support only when it usefully
shortens the critical path; the parent retains routing, synthesis, and
approval. During checkpointed execution, if observed coordination materially
exceeds the accepted forecast, pause before more delivery steps; report the
variance and seek fresh approval only when changed delivery boundaries or
authority require it. During accepted accept-all execution, every material
forecast variance pauses and returns control to the human, even when delivery
boundaries and authority do not change. Fresh approval is required only when
those boundaries or authority change. When no accepted forecast exists, report
material coordination growth against the bounded request instead of creating
planning overhead.

## Deliver each unit

For behavioral implementation, the executor must load and follow
`test-driven-development`. If that skill is unavailable, the direct parent
requires intended failing and passing proof at the approved public seam.
Documentation, metadata, and mechanical work use the smallest focused validation
that detects the intended error; do not manufacture a behavioral test.

For material UI implementation, the executor must consume accepted design
evidence and follow installed `frontend-development` plus the accepted
implementation-time method. Load `react-interface` only when the target uses
React. When an evidence capability exists, finish with `visual-validation`, a
visual mismatch ledger, and recheck targets; otherwise return honest unmet-proof
evidence. This routing does not take design approval ownership: the parent keeps
that gate and unresolved direction decisions. If frontend methods are
unavailable, the direct-parent fallback preserves the route and records the
unmet method or proof.

A confirmed bug outcome consumes the diagnosis evidence and regression seam
from `diagnosing-bugs`. If the cause or outcome is unconfirmed, load and follow
`diagnosing-bugs` before implementation. If that skill is unavailable, the
direct parent first requires a reproducible symptom, identified cause, and
regression seam.

Use focused tests before required completion checks. When an accepted plan
exists, use its invalidation map as the validation ladder; otherwise derive the
smallest ladder from the changed surfaces without creating a forecast. Reuse
unchanged evidence at intermediate stages only while its covered surface stays
unchanged. The Worker runs focused slice proof while developing and
affected-boundary checks needed for a useful handoff. The parent owns
finalization: integration proof, coverage, root or repository-wide checks,
security or packing checks, and required completion gates.

After every completed Worker handoff, run one fresh read-only `qa` verifier in
the same worktree when that capability exists. Give it the exact named
completion commands; it must run each once and return all failures as one
aggregated defect packet. If QA is unavailable, the parent runs the same
commands directly.

The first failing QA packet establishes the baseline and starts the initial
repair. On later failures, compare the new packet with the prior pass.
Measurable progress means fewer failing commands or failure signatures, a
smaller diagnostic or coverage gap, or new evidence that resolves a prior
failure. While progress is measurable, resume the latest retained Worker with
the complete packet. The Worker repairs with focused checks and returns control
to QA. QA runs invalidated checks first, then the exact complete gate once after
they pass. Repeat Worker and QA while evidence shows measurable progress;
proceed to formal review only when QA returns `verified`.

Stop the loop when the same failure recurs without new evidence, the defect set
does not shrink or materially change after an accepted repair, the Worker does
not return `completed`, or repair requires scope or architecture outside the
accepted intent. This is a progress boundary, not an iteration limit. Coverage
is a late diagnostic: rerun it only after relevant production or test changes,
and never create separate workers per file or failure group.

Before formal review, require a frozen diff, clean diff check, focused proof,
required completion gates passing, no known task TODOs, and no active writer.
At that boundary, the parent inspects the final diff for scope, package,
release, dependency, and artifact hygiene, plus security, cancellation, cleanup,
and user-visible documentation. Build complete work evidence: changed files,
red and green evidence or an explicit test exception, focused and required
check results, residual risks, and delivery state.

Record efficiency telemetry in that evidence when available: child tokens and
turns, tool calls, changed production and test LOC, focused and full-check
executions, review cycles, and incomplete Worker count. Warn when scope or LOC
is more than twice the accepted estimate, test LOC materially exceeds
production LOC without explanation, coverage reruns without relevant file
changes, a full gate ran before the diff froze, more than one formal review
occurred, or any Worker returned incomplete work. Telemetry informs the next
decision; it never creates new behavior or test scope.

## Fixed review and acceptance

The complete work evidence document supports Review, Revise, Deepen verification,
or Pause before acceptance. One fixed formal review occurs at each stable
completed delivery unit. When a configured `reviewer` capability exists, it
must load and follow `code-review` with fresh read-only context. Give it the
worktree, fixed-point intent (pitch, plan, or request), base ref and fixed diff,
changed files, and verification evidence. Return material findings as one
prioritized batch. After approval to repair, permit one review repair resume of
the same retained Worker; if it is not resumable, the parent owns the repair
directly rather than launching a replacement. The writer reruns focused
invalidated evidence, then re-enters the progress-bounded QA loop until the
required final gate passes. The parent verifies the repaired findings without
starting a second full review; pause if a repair changes architecture or
accepted scope. For an accepted accept-all plan, pause and return control to the
human before resolving any material finding. If the reviewer is unavailable,
the direct parent loads and follows `code-review`.

For checkpointed plans, present the evidence and an explicit **Accept and
publish** action. Acceptance invokes `commit` and `open-pr` with no second
mutation prompt. For accepted accept-all plans, perform the same commit and
authorized publication after successful evidence and fixed review without that
routine question. These focused delivery skills own publication; lifecycle
guidance must not issue ad hoc Git commands. For a planned stack, `open-pr` must
use `gh stack`; if focused delivery or required stack tooling is unavailable,
fail closed, preserve local work and evidence, and state the recovery action.

Acceptance authorizes only the verified planned unit and named task branch. It
does not authorize merge, deployment, release, plain force push, cleanup,
destructive actions, or unrelated changes.

## Continue an accepted plan

When a checkpointed complete accepted plan has another delivery unit after the
current unit is accepted and committed, and any authorized publication has
completed, the parent summarizes progress and explains the next planned unit:
its observable outcome, dependencies and readiness, intended proof and checks,
and place in remaining plan progress. Then use the `question` tool with exactly
these actions: **Continue**, **Review next unit**, and **Discuss**. If `question`
is unavailable or the human cancels, present the same three choices in
conversation, wait, and do not start the next unit.

For an accepted accept-all plan with another ready delivery unit, continue in
accepted dependency order without a routine question after the prior unit's
successful tests, required gates, fixed review, commit, and authorized
publication. Pause instead for every accept-all pause condition.

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
