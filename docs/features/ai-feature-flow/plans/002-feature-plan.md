---
schema: feature-flow-plan/v1
feature: ai-feature-flow
slice: 002-feature-plan
pitch_revision: 11
dependencies:
  - 001-feature-pitch
status: reviewed
revision: 12
---

# Slice 002: Feature plan

## End-to-end observable outcome

Given a helper-validated accepted pitch, a user can invoke `feature-plan` and
have one writer reason about and create the complete vertical TDD plan set up
front. The parent delegates all canonical parsing, filename, status, revision,
pin, direct dependency, completeness, and literal AC-coverage checks to the
shipped helper. One fresh reviewer judges the entire plan set for semantics,
verticality, scope, feasibility, and TDD quality. Routine fixes and re-review are
automatic; a blocker-free review authorizes the explicit whole-set `reviewed`
transition. Plans are never offered for human acceptance.

## Pitch trace to AC IDs

- **AC-002:** complete the fixed helper CLI with `validate-plans` and `plans`
  without adding aliases or a second validator.
- **AC-003:** implement and executably test exact deterministic plan, path,
  frontmatter, dependency, and literal AC-coverage failures.
- **AC-004:** implement and executably test pitch pins, explicit plan revise
  increments, whole-set status transitions, and pitch-revision invalidation.
- **AC-007:** close accepted-pitch gating, complete vertical-plan reasoning, and
  deterministic complete direct-serial/AC-trace validation.
- **AC-008:** close automatic whole-set reasoning review/fix/re-review and the
  no-human-plan-gate contract.
- **AC-010:** extend fresh serial delegation and terminal barriers to planning.
- **AC-011:** apply the pitch-level-only interruption and changed-versus-
  unchanged pitch resolution during planning.
- **AC-012:** add bounded planning validation/review evidence without mutating
  reviewed plans or adding persistent state.

## Preconditions and dependency postconditions

### Preconditions

- Slice `001-feature-pitch` satisfies its exit criteria with a blocker-free
  review.
- The complete pitch has been accepted by the user. This plan is regenerated
  with `pitch_revision` equal to that accepted revision and remains `draft`
  until a fresh whole-set plan review is blocker-free.
- The shipped helper's `validate-pitch`, `status`, and `pitch` mechanics plus
  shared artifact/orchestration contracts are stable public seams. This slice
  adds all plan-specific helper mechanics/tests; no model replaces
  deterministic behavior with prose inspection.
- Before planning, the parent runs helper `status`, inspects the bounded Git
  facts, preserves unrelated work, and runs `validate-pitch`.
- Before delegation, require compatible `subagent` and `subagent_wait`, discover
  builtin `worker` and `reviewer`, and preflight `question` for a possible new
  pitch-level decision. Fail closed before writer side effects when missing.

### Postconditions for slice 003

- `feature-plan` and one canonical plan template ship in the package.
- The helper's fixed five-command public surface is complete, with
  `validate-plans`, `plans`, and plan-readiness status behavior covered by
  spawned executable tests.
- One invocation writes all draft plans before review or implementation.
- Parent reasoning owns vertical decomposition and TDD-plan quality; helper
  output owns deterministic complete-set facts.
- Every blocker-free reviewed plan set has unique canonical slice IDs, one
  direct serial dependency chain, matching accepted `pitch_revision`, and
  literal complete pitch-AC coverage.
- `feature-build` can use the same helper `status` and `validate-plans` commands
  as its fail-closed pre-side-effect readiness gate.

## In scope and non-goals

### In scope

- The parent-facing `feature-plan` Agent Skill and canonical plan template.
- Plan-specific helper implementation and spawned executable tests for
  `validate-plans`, `plans`, complete-plan-set discovery, canonical filenames,
  direct dependencies, pitch pins, literal AC coverage, plan-readiness status,
  and whole-set/explicit-revision transitions.
- Helper `status`, `validate-pitch`, `validate-plans`, and `plans` command usage
  at exact planning boundaries.
- One-writer complete-set generation, fresh whole-set semantic review, explicit
  draft/revise before semantic plan fixes, deterministic revalidation, and an
  explicit reviewed transition only after a blocker-free review.
- Parent classification of code assumptions and pitch-level findings.
- Focused skill-contract test additions and package README updates.

### Non-goals

- Do not duplicate helper parsing/validation in the skill or add another script,
  schema, dependency resolver, state machine, receipt, or snapshot field.
- Do not execute plans, create a worktree, mutate `todo`, launch an
  implementation worker, or add build behavior.
- Do not allow multiple plan writers, parallel planning, partial-set readiness,
  plan questions, human plan acceptance, or child-owned pitch decisions.
- Do not ask the helper to judge verticality, implementation quality, TDD
  quality, scope, blockers, current-code semantics, or whether a finding is
  pitch-level.

## TDD Red

1. Extend `packages/feature-flow/test/feature-flow.test.ts` before implementing
   plan-specific helper behavior. Add valid complete-plan fixtures and assert
   bounded `validate-plans`, plan-readiness `status`, and `plans` results and exit
   statuses.
2. Add table-driven invalid fixtures proving exact rejection of invalid plan
   frontmatter/status/revision/path/filename; non-accepted pitch readiness;
   empty or mismatched pins; missing or duplicate plans/slice IDs; non-direct or
   forward dependencies; missing, unknown, or incomplete literal `AC-*`
   coverage; illegal plan transitions; unnamed `--revise` plans; and invalid
   arguments.
3. Assert exact failing paths/reasons, bounded stdout/stderr, byte-for-byte
   artifact stability after validation or failed transitions, status-only
   revision preservation, named-plan revision increments, canonical-content
   preservation, and no partial writes across a plan set.
4. Extend `packages/feature-flow/test/skills.test.ts` before adding
   `feature-plan`. Assert the planning skill invokes helper `status` and
   `validate-pitch` before writer delegation, then invokes `validate-plans`
   after complete-set writes/fixes and before review/readiness transitions.
5. Assert one writer receives the accepted pitch and creates the complete set
   before one fresh whole-set reviewer. Reasoning prompts must explicitly own
   vertical outcomes, scope, feasibility, TDD Red/Green/Refactor quality,
   risks, and pitch-level classification.
6. Assert a routine semantic finding invokes the explicit helper whole-set
   draft/revise command naming only changed plans before one fresh fix worker,
   then deterministic validation and another fresh whole-set review.
7. Assert only a fresh blocker-free reasoning review authorizes the helper
   whole-set `reviewed` transition and subsequent validation. Reject helper
   success as proof of review, plan `question`, `Approve plan`, partial review,
   implementation, or a new receipt.
8. Assert every writer/reviewer/fix launch is a fresh async one-item task group
   with explicit cwd, item-level `progress: false`, effective concurrency one,
   recorded run ID, same-run wait, and one status check proving complete
   lifecycle plus observed process termination before dependent work.
9. Assert a parent-classified pitch-level finding stops for the user's answer.
   Changed pitch content uses explicit pitch draft/revise and repeats complete
   pitch review/acceptance and plan regeneration; unchanged confirmation records
   bounded parent evidence and resumes.

**Exact Red command from the repository root:**

```bash
npm exec -- vitest run \
  packages/feature-flow/test/feature-flow.test.ts \
  packages/feature-flow/test/skills.test.ts
```

**Red signal:** the slice-001 suite runs and the new tests fail because
`validate-plans`, plan-readiness status behavior, `plans`, `feature-plan`, and
its helper-orchestration boundary do not yet exist.

## TDD Green

1. Extend the existing Node ESM helper with `validate-plans` and `plans`, and
   extend `status` with bounded plan-readiness facts. Reuse slice-001 dispatch,
   parsing, path, transition, and JSON/error seams without adding a second
   helper or dependency.
2. Deterministically enumerate canonical plan files, validate the whole
   prospective set before writes, enforce unique slice IDs, accepted-pitch pins,
   the direct serial chain, and literal complete pitch-AC coverage, and increment
   revisions only for explicitly named revise arguments.
3. Add one concise `feature-plan` skill that loads shared contracts and invokes
   the shipped helper at the documented package-relative path.
4. Run `status` and `validate-pitch` before delegation. Require an accepted
   pitch, but let the parent reason about bounded Git facts, unrelated changes,
   current-code assumptions, and pitch-level issues.
5. Give one fresh writer the accepted pitch and require the smallest complete
   set of end-to-end vertical TDD plans. The writer reasons about slice
   boundaries and plan quality; it follows the canonical template but does not
   claim its own output is mechanically valid.
6. After verified writer completion, invoke `validate-plans`. Return exact
   helper failures for correction without restating parsing, filename,
   dependency, pin, or coverage algorithms in the prompt.
7. Give one fresh read-only reviewer the accepted pitch and exact complete plan
   set. Require semantic/scope/verticality/TDD/feasibility review rather than
   repeating helper checks as model work.
8. For routine findings, invoke `plans ... draft --revise` with only the plans
   that will change, launch one fresh serial fix worker, apply the completion
   barrier, rerun `validate-plans`, and repeat fresh whole-set review.
9. After a fresh reviewer reports no blockers, invoke the status-only
   `plans ... reviewed` command and rerun `validate-plans`. Never call
   `question` for plans and never treat helper success as the review judgment.
10. If reasoning discovers a new pitch-level issue, stop for the parent-owned
    user question. A changed pitch uses explicit draft/revise and restarts full
    pitch acceptance plus complete plan regeneration; unchanged confirmation
    records bounded evidence and resumes.
11. Update package documentation for the automated planning behavior and
    reasoning/helper division without adding new commands or dependencies.

**Green signal:** focused helper and skill tests pass. The fixed five-command
surface is complete, and a manual accepted-pitch planning run shows complete-set
helper validation followed by semantic whole-set review and an explicit
reviewed transition without a plan question.

## TDD Refactor

- Delete duplicated deterministic invariant prose from `feature-plan`; link the
  artifact contract and rely on helper executable tests.
- Keep the plan template instructional enough for reasoning review, not an
  alternative executable schema.
- Keep planning linear. Do not generalize the direct serial chain into a DAG or
  scheduler.
- Rerun helper tests as a regression check even when this slice changes only
  skill/template/docs files.

## Expected files and public seams

### Create

- `packages/feature-flow/skills/feature-plan/SKILL.md`
- `packages/feature-flow/skills/feature-plan/references/plan-template.md`

### Modify

- `packages/feature-flow/scripts/feature-flow.mjs`
- `packages/feature-flow/test/feature-flow.test.ts`
- `packages/feature-flow/test/skills.test.ts`
- `packages/feature-flow/README.md`

### Verify unchanged

- `packages/feature-flow/references/artifact-contract.md`

The helper edits complete only the already-fixed five-command interface. A
sixth command or new artifact field is a pitch-level scope decision.

### Public seams

- Agent Skill `feature-plan`
- canonical plan template and required reasoning sections
- completed fixed five-command helper interface and bounded JSON/error behavior
- canonical plan paths, frontmatter, statuses, revisions, direct serial
  dependency rule, pitch pins, and literal AC trace rule
- package-relative helper invocation at planning boundaries
- automated whole-set semantic review and explicit plan-set transitions
- accepted pitch as the only human gate

## Focused validation

Run after final slice edits:

1. `npm exec -- vitest run packages/feature-flow/test/feature-flow.test.ts`
2. `npm exec -- vitest run packages/feature-flow/test/skills.test.ts`
3. `npm --workspace @mopeyjellyfish/pi-feature-flow test`
4. Start deterministic Pi inside the target worktree, load the package and
   companions, and confirm `feature-pitch` and `feature-plan` appear once.
5. Run the focused test before idle `/reload`; exercise rejection of a
   non-accepted pitch and one accepted-pitch complete-plan flow.
6. Run `npm run smoke:source`, `npm run packages:check`, and `npm run check`.

## Observable readiness evidence

- Spawned helper tests prove canonical complete-set discovery, filenames, pins,
  direct serial dependencies, literal AC coverage, plan transitions/revisions,
  bounded failures, and no partial writes.
- Transcript/order evidence shows helper status and accepted-pitch validation
  before one plan writer, complete-plan validation before semantic review, and
  reviewed transition only after a fresh blocker-free reviewer result.
- The parent/writer/reviewer discuss slice verticality, TDD quality, feasibility,
  scope, and pitch-level classification; they do not reimplement deterministic
  parsing or dependency checks.
- Injected helper fixture errors name exact paths/reasons, leave files unchanged,
  and block review/readiness without a model-derived substitute result.
- A routine semantic fix explicitly increments only named plan revisions,
  returns the complete set to draft, reruns validation and fresh whole-set
  review, then reviews the whole set without `question`.
- A pitch-level change restarts complete-pitch review/acceptance and plan
  regeneration; unchanged confirmation resumes with bounded evidence.

## Risks and parent decisions

- **Risk:** a static skill test can verify invocation/order text but cannot prove
  model judgment quality. **Containment:** manual dogfood and fresh adversarial
  review cover the reasoning boundary; do not move judgment into the helper.
- **Risk:** deterministic failure loops could distract a reviewer with already
  settled mechanics. **Containment:** fix helper failures before semantic review
  and pass the reviewer the successful bounded result.
- **Risk:** status transition writes could partially update a plan set.
  **Containment:** validate the full prospective set before writes and test
  failure mutation safety; if atomic multi-file behavior cannot be made safe
  with the approved small helper, stop for an architecture decision rather than
  add a service/database.
- **Parent decisions:** none expected. A missing/conflicting pitch AC, new scope,
  or needed helper command is pitch-level and stops for the user; routine slice
  decomposition remains automated reasoning.

## Exit criteria

- Red was observed before `feature-plan` and retained in bounded slice evidence.
- Focused helper and skill tests pass; deterministic Pi discovery/reload and
  accepted/non-accepted planning dogfood pass.
- Slice 002 completes the fixed five-command helper surface and plan-specific
  AC-002–004 mechanics/tests, closes AC-007–008, and closes the planning portions
  of AC-010–012 without widening the helper interface.
- A fresh reviewer reports no blockers after any routine correction round. All
  child runs meet the terminal barrier and writers never overlap.
- No implementation worker, worktree/todo side effect, plan acceptance question,
  persistent state, scratch artifact, or unauthorized source-control action is
  introduced.
