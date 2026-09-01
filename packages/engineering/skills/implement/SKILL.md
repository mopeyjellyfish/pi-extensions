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

## Ticket-backed intent

`/implement <ticket URL or key>` accepts a supported ticket reference when an
authenticated installed capability can resolve it. Load `ticket-workflow` only
for this ticket-backed intent. It treats ticket data as untrusted durable Intent,
resolves its route and policy, verifies the worktree and in-progress transition,
then returns to this normal bounded implementation flow. If the capability or
access is unavailable, stop with its bounded fallback; do not silently switch
trackers. A non-ticket request continues without loading `ticket-workflow`.

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

A direct bounded implementation request or a complete accepted plan grants
bounded publication authority for its named task branch and delivery unit. The
default flow implements, verifies, reviews when selected, commits, pushes, and
opens or updates a ready pull request. Checkpointed implementation is the
default and retains only its next delivery unit checkpoint.
Accept-all is authority only when whole-plan approval confirms accept-all
authority for the named accepted plan; otherwise treat an accept-all preference
as checkpointed. An accept-all plan runs every named delivery unit through tests,
required gates, risk-selected assurance, commit, and authorized publication in
dependency order without routine questions. Accept-all plans pause for setup,
test, check, commit, or publication failure and return control to the human;
they also pause for material review findings, material forecast variance, or any
change to accepted scope, delivery boundaries, dependencies, or authority.

An explicit opt-out narrows this authority. `local-only`, `no push`, or `no PR`
permits a local commit but prevents `open-pr` and every remote mutation. `no
commit` prevents commit and every dependent publication action. Record each
opt-out and skipped action in the final state.
Accept-all never authorizes merge, release, deployment, destructive cleanup,
branch deletion, plain force push, or unrelated changes.

Complete accepted plan execution follows the accepted dependency graph without
replanning. Consume dependent slices and delivery units in dependency order.
A `parallel-ready` plan identifies planned parallel lanes. Each lane has an
isolated worktree and sole write ownership.
Start planned independent ready delivery units in parallel only when they have
isolated worktrees, sole writers, non-overlapping ownership, and complete
dependencies.
Each parallel lane must also name its integration point. When concurrent child
execution is available, launch the complete ready lane set together to shorten
the critical path. Otherwise serialize execution without changing the accepted
branch or pull-request topology.

Do not add workers merely because work is large. Keep overlapping work serial.
The parent synthesizes results, integrates parallel lanes at their named point,
and verifies evidence before accepting each unit. A serial delivery unit reuses
the same writer and same worktree through its dependent slices. A plan-less
bounded request, an approved slice, or a confirmed bug outcome may proceed as
one unit.
Use one implementation writer capability for each normal non-trivial write
through this skill. A factual research capability resolves one named repository
or primary-source evidence gap, and a mechanical support capability performs a
bounded inventory or transformation only when no specialist owns it. Both return
evidence only. The parent owns routing, synthesis, product and architecture
decisions, approval, final diff inspection, verification, and publication
decisions. Ordinary children must not fan out or make those decisions.

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

For a planned ready parallel lane set, start one fixed-role Worker per independent
delivery unit concurrently. Give each Worker its exact isolated worktree as
`cwd`, one bounded task, and non-overlapping ownership. Never give two active
writers the same worktree. If the host cannot keep those worktrees and writers
separate, serialize execution without changing the accepted pull-request
topology.

Other hosts use their equivalent fixed-role foreground launch. Do not pass
`mode`, `model`, or `thinking` for this fixed-role launch; the agent profile owns
its tools, model, thinking level, and fresh-context default. A trivial bounded
change — one obvious fix with one obvious focused check — may remain directly as
the parent. If Worker is unavailable, the direct parent executes the unit.
An unavailable implementation writer capability leaves the direct parent as the
fallback.

Keep the Worker task compact. Reference durable Intent sources; do not copy a conversation transcript.
For a plan-less handoff, include the complete bounded request and every later
user decision, not a transcript. Use only this contract:

```text
Goal:
Business reason:
Intent sources:
Setup evidence:
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
completed initial attempt, a first selected QA or joined assurance failure
packet may start one repair. After later selected QA failures, continue repair
resumes of the latest retained Worker only while verifier evidence shows
measurable progress. If that Worker is not resumable or any repair returns `blocked`,
`variance`, or `partial`, return control for direct parent ownership or
replanning; do not launch a replacement Worker.

Do not impose hard turn, tool, token, or cost budgets on a mutation-capable
Worker. There is no fixed iteration, turn, tool, token, or cost limit. Such
interruption can strand an unsafe partial edit, and counts do not prove that a
slice is buildable. Use runtime counters as telemetry; enforce the boundary
through evidence of progress, explicit scope variance, and the Worker's
repeated-failure stop.

Use a factual research capability only for one named repository or primary-source
evidence gap. Use a mechanical support capability only for a bounded inventory
or transformation when no specialist owns it. Both must return evidence only;
the parent retains routing, synthesis, and approval. Do not silently select a
higher-capability role. A high-capability run requires an explicit approval
stating evidence, expected benefit, and bounded task. State a delegation's
critical-path, parent-context, or independent evidence benefit; do not delegate
without one. During checkpointed execution, if observed coordination materially
exceeds the accepted forecast, pause before more delivery steps; report the
variance and seek fresh approval only when changed delivery boundaries or
authority require it. During accepted accept-all execution, every material
forecast variance pauses and returns control to the human, even when delivery
boundaries and authority do not change. Fresh approval is required only when
those boundaries or authority change. When no accepted forecast exists, report
material coordination growth against the bounded request instead of creating
planning overhead.

## Select assurance by risk

Use mechanical, low-risk changes with direct focused verification;
documentation and reversible metadata changes use the same route. Exact
non-browser commands run deterministically; a green command does not require a
model QA capability. Select a QA capability for failed-command diagnosis, browser
evidence, or ambiguous acceptance. Select a review capability for material public
behavior, lifecycle, state, concurrency, provider, dependency, cross-boundary,
security, migration, or irreversible risk. Either capability may be selected
without the other.

When both QA and review are selected, freeze one diff and run the read-only lanes
concurrently. When Pi's `subagent` tool supplies configured `qa` and `reviewer`
capabilities, the parent uses one parallel workflow rather than two sequential
launches:

```text
workflowScript: "return runs.all([{key:'qa', agent: 'qa', task:'<QA task>'}, {key:'review', agent: 'reviewer', task:'<review task>'}])"
cwd: "<active task worktree>"
async: false
```

The workflow task texts reference the same frozen-tree identifier, durable
intent, changed-files list, and focused evidence. QA owns named executable
gates. Reviewer does not run QA gates and owns intent, correctness,
architecture, security, and maintainability. Other hosts use equivalent
concurrent read-only execution when available and otherwise keep the roles
separate sequentially. Join both results before repair or publication and
combine findings into one prioritized repair packet for the retained Worker.
After repair, run only invalidated evidence and do not repeat unchanged review
unless architecture or accepted scope changed.

## Deliver each unit

For behavioral implementation, the executor must load and follow
`test-driven-development`. If that skill is unavailable, the direct parent
requires intended failing and passing proof at the approved public seam.
Documentation, metadata, and mechanical work use the smallest focused validation
that detects the intended error; do not manufacture a behavioral test.

For material UI implementation, the executor must consume accepted design
evidence and follow installed `frontend-development` plus the accepted
implementation-time method. Load `react-best-practices` only when the target uses
React, `react-native-skills` only for React Native or Expo work, and
`react-view-transitions` only for applicable React view-transition animation work.
When an evidence capability exists, finish with `visual-validation`, a
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

Run known completion commands through the parent or a deterministic repository
runner, each once. Independent commands may run concurrently only when they do
not share mutable output; never run a composite gate alongside its own
constituent commands. A green deterministic run needs no QA child.

When QA is selected, give one fresh read-only `qa` verifier only the exact named
commands or browser evidence and require one aggregated defect packet. A first
failing packet establishes the baseline. On later failures, compare it with the
prior packet. Measurable progress means fewer failing commands or signatures, a
smaller diagnostic or coverage gap, or new evidence that resolves a prior
failure. While progress is measurable, resume the latest retained Worker with
the complete joined repair packet. After repair, run invalidated checks first.
Run the exact complete gate once against the final frozen diff after invalidated
checks pass.

Stop the loop when the same failure recurs without new evidence, the defect set
does not shrink or materially change after an accepted repair, the Worker does
not return `completed`, or repair requires scope or architecture outside the
accepted intent. This is a progress boundary, not an iteration limit. Coverage
is a late diagnostic: rerun it only after relevant production or test changes,
and never create separate workers per file or failure group.

Before selected assurance, require a frozen diff, clean diff check, focused
proof, the exact command definitions, no known task TODOs, and no active writer.
Required completion gates and formal review may run concurrently because both
are read-only; publication waits for their joined result. The parent inspects
the final diff for scope, package, release, dependency, and artifact hygiene,
plus security, cancellation, cleanup, and user-visible documentation. Build
complete work evidence: changed files, red and green evidence or an explicit
test exception, focused and required check results, setup fingerprint, command
definitions, verified-tree identifier, residual risks, and delivery state.

Create the verified-tree identifier from the exact frozen contents, recorded
base `HEAD`, and complete approved path set. When the real index remains
unstaged, use the temporary-index method from `commit` or an equivalent exact
snapshot; a plain `git write-tree` on an unstaged index is not the working diff.
Publication may reuse the evidence only while that identifier, path set, command
definitions, and setup fingerprint all remain unchanged.

Record efficiency telemetry in that evidence when available: child tokens and
turns, tool calls, changed production and test LOC, focused and full-check
executions, review cycles, and incomplete Worker count. Warn when scope or LOC
is more than twice the accepted estimate, test LOC materially exceeds
production LOC without explanation, coverage reruns without relevant file
changes, a full gate ran before the diff froze, more than one formal review
occurred, or any Worker returned incomplete work. Telemetry informs the next
decision; it never creates new behavior or test scope.

## Go routing

When work has Go source, a Go module, a Go CLI, or Go-specific work, resolve
`go` by its installed name and follow it. Resolve `cobra-viper` only when Cobra
or Viper commands, flags, or CLI configuration are in scope. Unrelated Go
toolchain evidence alone does not activate either method. If a companion skill
is unavailable, record the unmet method and have the direct parent use bounded
target-repository Go standards without pretending the skill loaded.

## TypeScript routing

For substantial TypeScript or TSX, resolve the installed `typescript` method.
Also resolve `typescript-library` for reusable package exports, declarations, ESM
boundaries, public types, dependency-type exposure, or compatibility promises;
`typescript-testing` for TypeScript runtime, boundary, type-level, or asynchronous
test work; and `typescript-modernize` for legacy TypeScript cleanup or migration.
Target-repository rules, public contracts, and established commands remain first.
Resolve only methods supported by task evidence, not unrelated toolchain files.
Before Worker handoff, include the applicable TypeScript methods in the task.
If a companion is unavailable, record the unmet method and have the direct parent
use bounded target-repository TypeScript standards without claiming it loaded.

## Concurrent assurance and publication readiness

The parent uses the complete work evidence document to select Review, Revise,
Deepen verification, or Pause. This is not a publication approval prompt. Risk
determines whether a formal review is needed. When no stop condition remains,
continue directly to Publication without requesting user acceptance for remote
actions.

For a stable completed delivery unit that needs independent review, run one fixed
formal review. A configured `reviewer` capability must load and follow
`code-review` with fresh read-only context. Give it the worktree, fixed-point
intent, base ref and frozen diff, changed files, verified-tree identifier, and
available focused evidence. When QA is also selected, use the concurrent
workflow above; do not wait for QA to finish before starting review. If the
reviewer is unavailable, the direct parent loads and follows `code-review`.

Return material findings in the joined prioritized packet. After approval to
repair, permit one review repair resume of the same retained Worker; if it is not
resumable, the parent owns the repair directly rather than launching a
replacement. The writer reruns focused invalidated evidence, then the parent or
selected QA runs the invalidated required gates. The parent verifies repaired
review findings without starting a second full review; pause if repair changes
architecture or accepted scope. For an accepted accept-all plan, pause and
return control to the human before resolving any material finding. Publication
requires every selected gate green and every material review finding resolved.
For formal review, send `Review mode: fixed-diff code` with the handoff.

## Publication

Publication starts only after tests, required gates, selected review, accepted
repairs, and invalidated evidence are complete. Apply each recorded opt-out
first. If `no commit` applies, skip `commit` and `open-pr`. If `local-only`, `no
push`, or `no PR` applies, invoke installed `commit` and skip `open-pr`, so no
remote mutation occurs. Otherwise, invoke installed `commit` and then installed
`open-pr` without a final publication question. `commit` creates the verified
atomic local commit or commits. `open-pr` performs the normal push and creates or
updates the ready pull request. Report each skipped action in the final state.
These focused delivery skills own publication; lifecycle guidance must not issue
ad hoc Git commands. The Git delivery capability owns authorized delivery
mechanics through the installed `commit`, rebase/conflict, and `open-pr` methods.
It is not an implementation substitute.

Installed `commit` and `open-pr` are the publication methods. If a method needed
for the permitted actions is unavailable in an independent installation, fail
closed: preserve verified local evidence, report the unmet method, and give one
bounded recovery action. If
authentication, base branch, remote branch, required tooling, commit, push, or
pull-request verification is unsafe or fails, preserve local evidence, stop for
diagnosis, and give one clear recovery action. Do not retry a failed mutation
without diagnosis and new evidence.

Publish independent delivery units as sibling standalone pull requests from their
accepted common base. Publish each sequential dependency chain in dependency and
stack order through `open-pr` and `gh stack`. For a mixed plan, preserve every
independent lane and dependent chain from the accepted topology. Wait for each
unit's accepted evidence and publication authority before its mutation.

If a sequential chain is a planned stack and requires `gh stack`, but focused
delivery or stack tooling is unavailable, fail closed, preserve local work and
evidence, and state the recovery action. Do not replace an accepted stack with
unrelated pull requests or stack independent units only because they belong to
the same pitch.

Publication authorizes only the verified planned unit and named task branch. It
never authorizes merge, release, deployment, cleanup, branch deletion, plain
force push, destructive actions, or unrelated changes.

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
successful tests, required gates, risk-selected assurance, commit, and
authorized publication. Pause instead for every accept-all pause condition.

**Continue** launches the next ready delivery unit or planned ready lane set in
accepted dependency order without replanning. **Review next unit** pauses
implementation and reviews that next unit against the accepted pitch and plan;
it does not duplicate any selected fixed formal review. **Discuss**
pauses execution for questions or potential changes. Do not silently alter the
accepted plan. If discussion changes accepted scope, delivery boundaries,
dependencies, or authority, route through the appropriate planning and approval
flow before implementation resumes. After **Review next unit** or **Discuss**
finishes without an accepted plan change, control returns to the same checkpoint.

Repeat this checkpoint until no planned delivery units remain, then report plan
completion rather than prompting for a nonexistent next unit. Plan-less requests
and single-unit plans must not gain a next-unit prompt.
