# Plan: Shape todo tracking for vertical slices

Resume by inspecting Git, then work the first unchecked slice. Reorder, rewrite,
split, merge, or delete pending slices when implementation teaches something
new.

When the `todo` tool is available, derive checked/total progress and the first
unchecked slice from this plan. Reconcile one rolling
`Shape shape-todo-slices:` item. Keep `plan.md` authoritative and preserve
unrelated todos.

## [x] 001 — Shape mirrors vertical slices to todo

> Historical: this slice implemented the original per-slice mirror in commit
> `e9eb32a`. Slice 002 supersedes that design with one rolling item.

### Outcome

A Shape run mirrors its vertical slices to clearly prefixed session todos. The
mirror shows safe progress across planning, implementation, resume, plan
changes, blocking, completion, and todo failures without replacing the durable
plan.

### Pitch trace

This historical slice implemented the first accepted per-slice pitch. The
current pitch and slice 002 supersede its contract. Git preserves the accepted
version in commit `e9eb32a`.

### Implementation

Use `packages/feature-flow/skills/shape/SKILL.md` as the public behavior seam.
First, add focused failing assertions to
`packages/feature-flow/test/resources.test.ts` for:

- the monotonic next-slice-number high-water mark;
- immutable, unique, never-reused slice numbers;
- one reserved todo namespace per feature;
- complete preflight before todo mutation;
- preservation of unrelated todos and the global `in_progress` item;
- plan creation, plan-change, resume, blocked, verified-completion, and finish
  reconciliation;
- stop-on-first-failure fallback and later retry;
- the accepted pitch, current plan, and Git authority boundaries;
- best-effort skill behavior with no runtime enforcement.

Then make the smallest skill change that satisfies the assertions. Update
`packages/feature-flow/skills/shape/templates/plan.md` with the high-water mark
and concise todo reconciliation guidance. Update
`packages/feature-flow/README.md` with the user-visible behavior and fallback.
Do not add an extension, dependency, todo protocol change, durable todo ID, or
third feature artifact.

### Validation

- Run `npm --workspace @mopeyjellyfish/pi-feature-flow test` after the failing
  test and after implementation.
- Run `npm run smoke:source`.
- Run `npm run check`.
- Start the deterministic Pi aggregate from this worktree. Confirm that `shape`
  and the `todo` tool load without conflicts.
- Run the focused test before `/reload`.
- Run `/reload` while Pi is idle.
- Resume this feature and confirm that Shape lists todos, validates the complete
  plan and reserved namespace, and reconciles the `001` slice item.
- Keep an unrelated todo `in_progress`. Confirm that the Shape slice remains
  `pending` and the unrelated todo remains unchanged.
- Exercise one safe preflight failure. Confirm that no todo changes.
- Treat rename, stale-item cancellation, and mutation-failure retry as focused
  instruction-contract checks unless a safe live scenario is available. If a
  live mutation fails, run the next reconciliation and confirm convergence.
- Request a fresh read-only specialist review of the completed slice diff for
  correctness, test quality, simplicity, and preserved authority gates.
- After tests, checks, live QA, and review pass, mark slice `001` `[x]`.
- Reconcile again. Confirm that its managed todo is `completed`, no managed todo
  is `pending` or `in_progress`, and unrelated todos are unchanged. If the todo
  update fails, keep the durable slice checked, report the gap, and retry at the
  next reconciliation.

### Done when

The focused test fails for the missing todo integration and passes after the
implementation. Source smoke and `npm run check` pass. Live reload acceptance
shows the new best-effort reconciliation behavior without duplicate resources,
stale state, or unrelated todo mutation. Independent review has no blockers. No
unrequested dependency, runtime resource, durable artifact, staged file, or
remote action exists.

## [x] 002 — Shape reports rolling progress in one todo

### Outcome

A Shape run shows one compact todo row with checked/total slice progress and the
current slice number and outcome. The row gives feedback about the agent's
position without duplicating the complete plan.

### Pitch trace

Implement the revised accepted pitch sections [Solution](pitch.md#solution),
[Fixed decisions](pitch.md#fixed-decisions), and
[Acceptance criteria](pitch.md#acceptance-criteria), especially AC-001 through
AC-011.

### Implementation

Use `packages/feature-flow/skills/shape/SKILL.md` as the public behavior seam.
First, replace the per-slice assertions in
`packages/feature-flow/test/resources.test.ts` with focused failing assertions
for:

- one rolling `Shape <slug>:` item;
- checked/total progress derived from `plan.md`;
- the first unchecked slice number and outcome;
- a concise blocked suffix;
- preservation of the fixed progress/current-slice prefix with deterministic
  truncation of trailing detail to 300 characters;
- zero-match add, one-match update, and multiple-match no-mutation behavior;
- `in_progress` with no unrelated active item and `pending` when one exists;
- accurate todo state, tool output, and `/todos` text with opportunistic widget
  and status-line visibility;
- plan creation, plan changes, resume, slice completion, and finish updates;
- add-then-update and other stop-on-failure fallback;
- accepted-pitch, current-plan, and Git authority boundaries;
- best-effort skill behavior with no runtime enforcement.

Then make the smallest skill change that satisfies those assertions. Remove the
per-slice identity, high-water, stale-item, and migration instructions. Restore
`packages/feature-flow/skills/shape/templates/plan.md` to a plan-only slice list
with concise rolling-item guidance. Update `packages/feature-flow/README.md`
with the user-visible behavior and status-line limitation. Do not add an
extension, dependency, todo grouping, durable todo ID, or third feature
artifact.

### Validation

- Run `npm --workspace @mopeyjellyfish/pi-feature-flow test` after the failing
  test and after implementation.
- Run `npm run smoke:source`.
- Run `npm run check`.
- Start the deterministic Pi aggregate from this worktree. Confirm that `shape`
  and the `todo` tool load without conflicts.
- Run the focused test before `/reload`.
- Run `/reload` while Pi is idle.
- Use a safe acceptance plan with two slices and one checked slice. With no
  unrelated active todo, confirm that zero prefix matches add
  `Shape <slug>: 1/2 — 002 <outcome>` and then set it `in_progress`.
- Confirm accurate text in todo state, tool output, and `/todos`. Treat widget
  and status-line visibility as opportunistic.
- Reconcile after a plan-state change. Confirm that one prefix match updates the
  same item instead of adding another.
- Keep an unrelated todo `in_progress`. Confirm that the rolling item remains
  `pending` and the unrelated item remains unchanged.
- Confirm that long outcome and blocked detail is truncated while the fixed
  progress/current-slice prefix remains intact.
- In a disposable acceptance session, add a second prefix match as deliberate
  test contamination. Confirm that reconciliation makes no todo mutation, then
  exit that session.
- Cover add-then-update failure and later retry in the focused instruction
  contract unless a safe live failure is available.
- Request a fresh read-only specialist review of the completed slice diff for
  correctness, test quality, simplicity, and preserved authority gates.
- After tests, checks, live QA, and review pass, mark slice `002` `[x]`.
- Reconcile again. Confirm that the rolling item shows `2/2 — complete` and is
  `completed`. If the todo update fails, keep the durable slice checked, report
  the gap, and retry later.

### Done when

The focused test fails for the per-slice contract and passes for the rolling
item contract. Source smoke and `npm run check` pass. Live reload acceptance
shows scoped progress, current-slice feedback, bounded text, safe collision
handling, and no unrelated todo mutation. Independent review has no blockers. The package diff
is smaller than the original per-slice implementation. No unrequested
dependency, runtime resource, durable artifact, staged file, or remote action
exists.
