# Plan: Shape todo tracking for vertical slices

Next slice number: 002

Resume by inspecting Git, then work the first unchecked slice. Keep slice
numbers unique and unchanged. Reorder headings without renumbering them. Assign
the current `Next slice number` to each new or replacement slice, then increase
the value. Never decrease the value. Never reuse a retired number.

When the `todo` tool is available, validate the complete plan and managed todo
namespace before mutation. Reconcile one `Shape shape-todo-slices:` item per
slice. Keep `plan.md` authoritative and preserve unrelated todos.

## [x] 001 — Shape mirrors vertical slices to todo

### Outcome

A Shape run mirrors its vertical slices to clearly prefixed session todos. The
mirror shows safe progress across planning, implementation, resume, plan
changes, blocking, completion, and todo failures without replacing the durable
plan.

### Pitch trace

Implement the accepted pitch sections [Solution](pitch.md#solution),
[Fixed decisions](pitch.md#fixed-decisions), and
[Acceptance criteria](pitch.md#acceptance-criteria), especially AC-001 through
AC-011.

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
