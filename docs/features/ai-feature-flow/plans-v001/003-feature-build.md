---
schema: feature-flow-plan/v1
feature: ai-feature-flow
slice: 003-feature-build
pitch_revision: 13
dependencies:
  - 002-feature-plan
status: reviewed
revision: 14
---

# Slice 003: Feature build

## End-to-end observable outcome

Given a complete blocker-free reviewed serial plan set, a user can invoke
`feature-build` and have the parent deliver one dependency-ready slice at a
time. Before build reasoning, Worktrunk/todo mutation, or writer work, the skill
runs the shipped helper's bounded status and readiness checks. After Worktrunk
routing, it reruns those checks in the active target cwd before the first writer.
Models do not reparse artifacts or recalculate dependencies/AC coverage.

Each slice uses one fresh implementation worker for Red, smallest Green, and
bounded Refactor, then one fresh adversarial reviewer. Routine blockers use one
fresh serial fix worker and re-review. The parent retains bounded evidence,
performs deterministic Pi dogfood and repository checks, then performs only
pre-authorized source-control actions or stops at a reviewed ready diff.

## Pitch trace to AC IDs

- **AC-001:** complete exactly-three-skill package discovery while preserving the
  one-helper/no-extension/no-runtime-dependency package shape.
- **AC-002:** consume only the fixed helper interface and bounded deterministic
  output before build side effects.
- **AC-003:** rely on executable helper tests for artifact/path/Git facts rather
  than static model assertions.
- **AC-004:** enforce accepted pitch, current revision pins, reviewed plan
  status, and invalidation before build.
- **AC-005:** preserve the reasoning/helper boundary when code assumptions and
  review findings are classified.
- **AC-006:** preserve complete-pitch-only human acceptance as the prerequisite.
- **AC-007:** consume the complete direct-serial, literal-AC-covered plan set.
- **AC-008:** preserve automatic plan readiness without a plan question.
- **AC-009:** close deterministic pre-side-effect readiness plus Worktrunk,
  todo, serial worker TDD, and fresh adversarial review.
- **AC-010:** close capability preflight, fresh one-item serial child runs, and
  verified completion barriers across all three skills.
- **AC-011:** close exact pitch-level interruption behavior during build.
- **AC-012:** close bounded slice/final evidence, Pi dogfood, checks, and
  authorization-aware source-control state.

## Preconditions and dependency postconditions

### Preconditions

- Slices `001-feature-pitch` and `002-feature-plan` satisfy their exit criteria
  with no unresolved reviewer blockers.
- The helper validates the pitch as accepted and the complete plan set as
  reviewed, pinned to the current pitch revision, canonical, direct-serial, and
  literal-AC complete.
- This plan is regenerated with the accepted `pitch_revision` and becomes
  `reviewed` only with the complete plan set after a fresh blocker-free review.
- Before any build side effect, require compatible `subagent` and
  `subagent_wait` plus compatible named `worker` and `reviewer` roles. The
  worker is the sole writer and the reviewer operates read-only. Accept Pi
  builtins or existing project/user overrides without rejecting a compatible
  role merely for its discovery scope. The package ships no agent definitions
  or custom agents. Preflight question, Worktrunk, todo, and plan-required
  LSP/web capabilities; fail closed with named setup guidance.
- The parent uses helper Git facts to preserve unrelated changes and reason
  about assumption validity. The helper does not decide whether code changes
  are related, safe, or pitch-level.

### Postconditions

- Every reviewed slice passes focused validation and fresh review in exact
  dependency order with no overlapping writers.
- Final validation starts deterministic Pi inside the target worktree, confirms
  the three skills once, runs the focused test, reloads while idle, exercises
  changed behavior, then runs source smoke and required completion checks.
- Bounded evidence maps implementation/review results to every pitch AC and
  records changed files, commands, risks, and final staged/source-control state.
- Without prior authorization the worktree remains an uncommitted reviewed ready
  diff; authorized commit/PR action occurs only after final checks.

## In scope and non-goals

### In scope

- Parent-facing `feature-build` and one build execution/evidence reference.
- Helper `status` and `validate-plans` as fail-closed gates before Worktrunk,
  todo, reasoning/writer work, and again in the routed target cwd before the
  first writer.
- Parent reasoning about Git relevance, current-code assumptions, capability
  applicability, implementation choices, review findings, and pitch-level
  classification.
- Worktrunk route verification and session-local todo projection.
- One fresh serial worker per slice, fresh reviewer, routine fresh fix worker,
  TDD evidence, semantic/LSP checks where applicable, focused tests, and
  bounded final evidence.
- Small skill-contract test additions, package README updates, deterministic Pi
  load/reload dogfood, source smoke, and repository checks.

### Non-goals

- Do not add build behavior to the helper, another command, a Git abstraction,
  a code-diff classifier, a scheduler, a progress file, or persistent workflow
  state.
- Do not make a model revalidate canonical frontmatter, statuses, filenames,
  pins, direct dependencies, completeness, or literal AC coverage.
- Do not edit reviewed plans with implementation progress/evidence or add a
  final human feature gate.
- Do not parallelize writers/slices, automatically resume failed runs, let
  children own pitch decisions, or select provider/model IDs.
- Do not commit, push, merge, create a PR, publish, remove worktrees, or clean
  unrelated files without explicit authorization.

## TDD Red

1. Extend `packages/feature-flow/test/skills.test.ts` before adding
   `feature-build`.
2. Assert build ordering begins with capability preflight plus helper `status`
   and `validate-plans` before Worktrunk, todo, or subagent mutation. After route
   activation, assert cwd verification and the same helper gates run in that cwd
   before build reasoning/writer launch.
3. Assert exact helper path/reason failures stop without a model substitute,
   worktree/todo/writer side effect, or artifact mutation. Keep deterministic
   invalid fixtures in `feature-flow.test.ts`; do not duplicate exact
   frontmatter/dependency/coverage rules as static skill assertions.
4. Assert the parent, not the helper or child, classifies unrelated Git changes,
   invalid code assumptions, LSP applicability, implementation choices, review
   blockers, and pitch-level findings.
5. Assert per-slice order: direct readiness result; routed cwd proof; one todo
   active; fresh worker; verified same-run terminal barrier; retained Red,
   Green, Refactor, diagnostics, focused test, and diff evidence; fresh reviewer;
   routine fresh fix/revalidation/re-review; todo closure; next slice.
6. Assert compatible named worker/reviewer roles may be Pi builtins or existing
   project/user overrides and are not rejected merely for discovery scope. Their
   sole-writer/read-only semantics and every worker/reviewer/fix launch use a
   fresh async top-level `tasks` group with exactly one item, explicit routed
   cwd, item-level `progress: false`, effective concurrency one, recorded run ID,
   same-run wait, and one status check proving complete lifecycle plus observed
   process termination. Assert the package ships no agent definitions or custom
   agents.
7. Assert timeout, abort, missing, active, unknown, unobserved, and unresolved
   attention states do not permit polling, inferred completion, overlap, or
   automatic resume. A real pending parent-owned request is answered and the
   same run re-waited; advisory inactivity permits at most one indexed steer;
   blocked/drifting work is soft-interrupted and left paused for explicit
   resume/stop/replace choice.
8. Assert a semantic plan finding returns the set to explicit draft/revise and
   automated whole-set review before build. A pitch-level finding stops for the
   user's answer; changed content restarts pitch review/acceptance and complete
   plan regeneration, while unchanged confirmation records bounded evidence and
   resumes.
9. Assert final ordering: all slice gates; deterministic Pi in target worktree;
   skill discovery; focused test; idle reload; changed-skill exercise; source
   smoke; repository/change-specific checks; `npm run security:check`; bounded
   AC evidence; then only pre-authorized source-control action or an uncommitted
   ready diff.
10. Reject plan mutation for progress, human plan/final-feature acceptance,
    unbounded transcripts, credentials/provider output, destructive cleanup,
    unauthorized source control, or a new helper command/state artifact.

**Exact Red command from the repository root:**

```bash
npm exec -- vitest run packages/feature-flow/test/skills.test.ts
```

**Red signal:** the slice-002 suite runs and fails because `feature-build` and
its deterministic-readiness-before-reasoning/writer ordering do not yet exist.

## TDD Green

1. Add one concise `feature-build` skill that loads the shared artifact,
   orchestration, and build contracts and invokes the existing helper at its
   package-relative path.
2. Preflight capabilities, including compatible named worker/reviewer Pi
   builtins or existing project/user overrides with sole-writer/read-only
   semantics regardless of discovery scope. The package ships no agent
   definitions or custom agents. Then run `status` and `validate-plans` before
   any build mutation. Treat successful helper output as deterministic readiness
   only; parent reasoning separately inspects Git relevance, current-code
   assumptions, and possible pitch-level issues.
3. Create or activate the authorized Worktrunk path, verify `pwd` and Git
   top-level, and rerun helper `status` and `validate-plans` with the process cwd
   set to that routed worktree before any implementation reasoning/writer work.
4. Project the fixed reviewed slice order into session `todo`, with at most one
   active item. Todo is a view, not artifact authority.
5. For each dependency-ready slice, launch the compatible named `worker` fresh
   with the accepted pitch, one reviewed plan, dependency evidence, repository
   instructions, explicit routed cwd, and no pitch-decision authority.
6. Require observable Red before production edits, smallest Green, Refactor only
   while green, semantic discovery/LSP validation when applicable, and focused
   commands. Parent reasoning records an applicability reason when an optional
   tool is not used.
7. After verified worker completion, retain bounded TDD/test/diff evidence and
   launch one fresh reviewer with current pitch, plan, diff, and evidence.
8. For routine blockers, launch exactly one fresh serial fix worker, apply the
   same completion barrier, rerun affected checks, and obtain another fresh
   review. Never overlap writers or use helper success as review judgment.
9. For a plan-semantic problem, use explicit plan draft/revise and return to
   automated whole-set review. For a parent-classified pitch-level problem, stop
   for the user and follow changed-versus-unchanged resolution.
10. Update todo and bounded conversation evidence only after a clean review; do
    not write delivery results into plans or a progress artifact.
11. After all slices, follow repository-required deterministic Pi load,
    discovery, focused test, idle reload, changed-skill exercise, source smoke,
    full checks, change-specific checks, and `npm run security:check` in order.
12. Produce bounded AC-by-AC evidence and final staged/source-control state.
    Perform source-control actions only when already authorized.

**Green signal:** focused tests prove readiness gates precede mutations and
writer reasoning, and bounded temporary-repository dogfood demonstrates serial
Red/Green/review delivery without invalid execution or unauthorized source
control.

## TDD Refactor

- Remove duplicated deterministic readiness prose from the build skill; call the
  helper and link the shared contract.
- Keep execution ordering linear and explicit. Do not extract a scheduler,
  runner framework, generalized evidence store, or Git classifier.
- Keep evidence to acceptance-relevant facts; omit full transcripts,
  credentials, provider responses, and generated project records.
- Rerun both skill and helper suites after the final edit.

## Expected files and public seams

### Create

- `packages/feature-flow/skills/feature-build/SKILL.md`
- `packages/feature-flow/skills/feature-build/references/build-contract.md`

### Modify

- `packages/feature-flow/test/skills.test.ts`
- `packages/feature-flow/README.md`

### Verify unchanged

- `packages/feature-flow/scripts/feature-flow.mjs`
- `packages/feature-flow/test/feature-flow.test.ts`
- `packages/feature-flow/references/artifact-contract.md`
- canonical pitch and reviewed plans during build

A needed helper command, field, database, or runtime dependency is a pitch-level
scope change, not a slice-003 convenience edit.

### Public seams

- Agent Skill `feature-build`
- helper status/readiness gate before side effects and in routed cwd before
  writer reasoning
- Worktrunk active-cwd handoff and todo projection
- serial worker/reviewer/fix ordering with verified terminal barriers
- bounded slice/final AC evidence and authorization-aware completion

## Focused validation

Run after final slice edits:

1. `npm exec -- vitest run packages/feature-flow/test/skills.test.ts`
2. `npm exec -- vitest run packages/feature-flow/test/feature-flow.test.ts`
3. `npm --workspace @mopeyjellyfish/pi-feature-flow test`
4. Start deterministic Pi inside the target worktree with explicit feature-flow
   and companion resources; confirm all three skills appear once.
5. Run the focused test before idle `/reload`, then exercise the complete flow in
   one disposable bounded Git repository whose request requires one `node:test`
   Red/Green slice and explicitly forbids commits. Remove it only by later human
   action after evidence review.
6. Run `npm run smoke:source`, `npm run packages:check`, `npm run check`, and
   `npm run security:check`, in that order.
7. Inspect final diff, packed contents, staged files, and source-control state.

## Observable readiness evidence

- Helper status/readiness success is recorded before Worktrunk/todo mutation and
  again in the routed cwd before implementation reasoning/writer launch.
  Injected deterministic failures name exact paths/reasons and produce no side
  effects.
- Parent evidence separately records Git relevance/current-code/pitch-level
  judgments, showing that helper success did not make semantic decisions.
- Worktrunk path, worker `pwd`, and Git top-level agree. Todo shows one active
  slice; each slice records Red then Green, focused/LSP results or applicability
  reason, changed files, and blocker-free fresh review before advancement.
- Deterministic Pi discovers three skills once, survives idle reload, and
  exhibits changed behavior; source smoke and repository checks pass.
- Final bounded evidence maps all pitch ACs, changed files, commands, reviewer
  findings, residual risks, no-staged-files state, and authorized or withheld
  source-control actions. Reviewed plans remain unchanged.

## Risks and parent decisions

- **Risk:** the initial checkout and routed worktree can diverge between the two
  readiness checks. **Containment:** rerun helper status/readiness in the exact
  routed cwd and reason about any changed Git assumptions before the writer.
- **Risk:** helper readiness is mistaken for implementation readiness.
  **Containment:** skill tests require separate parent reasoning about code
  assumptions, capabilities, and pitch-level issues before writer launch.
- **Risk:** LSP is unavailable for a touched file type. **Containment:** fail
  closed when the reviewed plan requires it; otherwise use its documented
  repository-native validation and retain an applicability reason.
- **Risk:** manual dogfood loads global resources or the original checkout.
  **Containment:** use deterministic flags and start Pi inside the routed
  worktree per [`AGENTS.md`](../../../../AGENTS.md).
- **Parent decisions:** none expected. Only a new pitch-level product, scope,
  architecture, risk, or non-negotiable finding interrupts automation. Routine
  branch/path details, implementation choices, review fixes, and final evidence
  remain automated within prior authorization.

## Exit criteria

- Red was observed before `feature-build` and retained in bounded evidence.
- Focused skill/helper suites, deterministic Pi discovery/reload/dogfood, source
  smoke, package checks, full repository checks, and security checks pass on the
  final diff.
- Slice 003 closes AC-001–004 integration, AC-009–012, and preserves AC-005–008
  without widening the helper or artifact contracts.
- Every slice has Red/Green/focused-check evidence and a fresh blocker-free
  review after any one-at-a-time fix round; all child runs pass exact terminal
  barriers and writers never overlap.
- The parent returns bounded AC evidence and performs only pre-authorized
  source-control actions. No reviewed-plan mutation, persistent/scratch state,
  destructive cleanup, publish, or mandatory final question occurs.
