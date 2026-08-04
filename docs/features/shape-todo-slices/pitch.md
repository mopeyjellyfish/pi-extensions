---
status: accepted
---

# Shape: Todo tracking for vertical slices

## Executive summary

The `shape` skill will mirror each planned vertical slice to Pi's session todo
list when the `todo` tool is available. The mirror will show completed and
pending slices. It will show the current slice as `in_progress` when no unrelated
todo already owns that global status.

The accepted pitch defines intent. The current `plan.md` defines slice
membership, order, and check state. Git provides history and resume evidence.

Shape will manage only todo items with a feature-specific prefix. It will
preserve unrelated todos. Shape will reconcile the mirror after plan changes and
when work resumes in a new or restored session.

## Problem

Shape records vertical slices as Markdown checkboxes in `plan.md`. This durable
format supports Git review and resume, but it does not use Pi's compact progress
list during implementation.

The repository already provides a session-aware `todo` tool. The tool supports
stable IDs and atomic status updates, but its state belongs to one Pi session
branch. A new session can start with an empty list. A restored or forked session
can contain state that does not match a changed plan. See
[`packages/todo/README.md`](../../../packages/todo/README.md).

The integration must make current work visible without creating two competing
plans or deleting unrelated session work.

## Appetite

Make a small skill-only change. Update the Shape instructions, plan template,
focused resource tests, and package README.

Keep these quality floors:

- Keep the accepted pitch authoritative for intent.
- Keep the current `plan.md` authoritative for slice membership, order, and
  check state.
- Use Git only for durable history and resume evidence.
- Preserve all existing approval, review, validation, and delivery gates.
- Preserve unrelated todo items.
- Continue safely when the `todo` tool is unavailable or cannot accept all
  slices.
- Keep the package free of a production extension and new runtime dependencies.

Stop and reshape the work if reliable tracking requires durable todo IDs,
cross-session storage, or executable integration code.

## Research and prior art

The Shape package is a Markdown-only skill package. Its public behavior is in
[`packages/feature-flow/skills/shape/SKILL.md`](../../../packages/feature-flow/skills/shape/SKILL.md).
The first unchecked plan slice is already the current or next slice. A slice is
checked only after its tests, required checks, review, and applicable integrated
QA pass.

The `todo` tool supports `list`, `add`, and atomic `update` actions. Todo items
have `pending`, `in_progress`, `completed`, and `cancelled` states. Only one
item can be `in_progress`. Todo state follows a Pi session branch through
reload, resume, compaction, fork, and tree navigation. It is not shared between
new sessions.

Numeric todo IDs are not suitable for `plan.md`. The IDs are session-specific,
while pending slices can be renamed, reordered, split, merged, or deleted.
Shape must reconcile by a feature-specific text prefix and stable slice number
instead. `plan.md` stores the next unused slice number as a durable high-water
mark. Slice numbers are unique, immutable, and never reused in one feature.
Reordering changes heading order without changing numbers. Splits and
replacements receive the next unused numbers.

The todo tool allows only one global `in_progress` item. Setting a Shape slice
active can demote an unrelated active item. Shape must preserve the unrelated
item and leave its slice pending until the global active status is available.

Pi loads skill instructions on demand from `SKILL.md`. The smallest correct
change is a best-effort instruction contract with focused resource tests and
live acceptance. It does not need a runtime import or a second state store. See
Pi's primary
[Skills documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md)
for the skill loading model.

## Solution

After Shape creates or changes `plan.md`, it will use the `todo` tool when the
tool is available. Each slice will have one concise todo item with this form:

```text
Shape <slug>: <slice number> — <outcome>
```

Shape reserves the exact `Shape <slug>:` namespace for its managed slice items.
The plan stores one line in this form:

```text
Next slice number: <NNN>
```

Shape increments the value when it assigns a slice number. Shape never decreases
the value.

Before any todo mutation, Shape will validate the complete plan and todo list.
The plan must contain one valid high-water mark and unique slice numbers below
that mark. Each item in the reserved namespace must match one unique plan or
stale slice number. No two managed items can use the same slice number. Shape
will also identify any unrelated `in_progress` item.

If listing fails or any preflight validation is ambiguous, Shape will mutate no
todo. It will report the exact gap and continue from `plan.md` and Git. After a
successful preflight, Shape will reconcile only items in the reserved namespace:

- Add missing slice items in plan order.
- Update renamed items that retain the same immutable slice number.
- Mark checked slices `completed`.
- Mark the first unchecked slice `in_progress` when no unrelated todo is already
  `in_progress`.
- Keep the first unchecked slice `pending` and report the conflict when an
  unrelated todo is already `in_progress`.
- Mark later unchecked slices `pending`.
- Mark removed, merged, or replaced slice items `cancelled`.
- Leave unrelated todo items unchanged.

A malformed item, duplicate number, or namespace collision fails preflight.
Shape will leave every todo unchanged for that reconciliation pass.

The first unchecked slice in `plan.md` remains authoritative even when the todo
list is stale or ordered differently. Shape will reconcile the list before it
starts or resumes implementation. A blocked current slice will stay
`in_progress` when the Shape slice owns that status. It will stay `pending` when
an unrelated item owns the status. The `> Blocked: … Next: …` note in `plan.md`
will contain the blocking detail.

Shape will mark a slice todo `completed` only after the existing Shape done
conditions hold and the matching plan checkbox is `[x]`. When every slice is
checked, Shape will reconcile all managed slice todos so none remain `pending`
or `in_progress`.

If the `todo` tool is unavailable, Shape will report the missing mirror and
continue from `plan.md` and Git. If any todo mutation fails, Shape will stop todo
mutations for that reconciliation pass. Shape will report the exact gap,
continue from `plan.md` and Git, and retry during the next reconciliation. A todo
failure will not weaken a test, review, approval, or validation gate.

## Fixed decisions

- Todo is a session progress mirror, not a durable feature artifact.
- The accepted pitch defines intent. The current `plan.md` defines slice
  membership, order, and check state. Git provides history and resume evidence.
- Shape tracks vertical slices only. It does not add pitch, research, review,
  commit, or delivery todos.
- Managed item text starts with the reserved `Shape <slug>:` namespace and
  includes the slice number.
- `plan.md` stores a next-slice-number high-water mark that only increases.
- Slice numbers are unique, immutable, and never reused within one feature.
- Shape lists and validates the complete plan and todo namespace before any todo
  mutation.
- A list failure, malformed or ambiguous managed item, duplicate number, or
  namespace collision aborts the reconciliation pass without todo mutations.
- Shape reconciles managed items after plan creation, plan changes, and resume.
- Shape preserves unrelated todos, including an unrelated `in_progress` item.
- The first unchecked managed slice is `in_progress` only when no unrelated item
  owns that status. Otherwise, the slice remains `pending` and Shape reports the
  conflict.
- A blocked current slice keeps its reconciled `in_progress` or `pending`
  status.
- Removed or replaced managed items become `cancelled`.
- After the first failed todo mutation, Shape stops that reconciliation pass,
  reports the exact gap, continues from the durable plan, and retries later.
- Add no production extension, runtime dependency, durable todo ID, or third
  feature artifact.
- No commit, push, pull request, merge, publication, deployment, destructive
  cleanup, or worktree removal authority is inferred.

## Rabbit holes

- Do not add a Shape-specific todo extension or import the todo package.
- Do not persist todo IDs or snapshots in `plan.md`. Persist only the next
  unused slice number.
- Do not clear or replace the complete session todo list.
- Do not mirror implementation subtasks, tests, reviews, or delivery actions.
- Do not make todo state authoritative when it conflicts with the accepted
  pitch, `plan.md`, or Git evidence.
- Do not promise runtime enforcement from skill instructions.
- Do not build automatic cross-session synchronization.

## No-gos

- No new runtime resource, service, dependency, state file, or database.
- No changes to the todo extension protocol or UI.
- No todo mutation before complete plan and namespace preflight succeeds.
- No deletion or mutation of unrelated todo items.
- No completion of a slice todo before all existing slice done conditions hold.
- No blocked status invented outside the current todo protocol.
- No failure of the durable Shape workflow only because todo mirroring is
  unavailable.
- No weakening of human approval, independent review, validation, Worktrunk, or
  delivery authority boundaries.

## Acceptance criteria

- **AC-001 — Initial mirror:** After plan creation and successful todo
  mutations, Shape has one reserved-prefix item per vertical slice.
- **AC-002 — Stable identity:** `plan.md` stores a next-slice-number high-water
  mark that only increases. Slice numbers remain unique, immutable, and never
  reused. Reordering preserves numbers, while splits and replacements use new
  numbers.
- **AC-003 — Safe preflight:** Before todo mutation, Shape validates the complete
  plan, reserved namespace, number mapping, and unrelated active item. A list or
  validation failure leaves every todo unchanged.
- **AC-004 — One current slice:** After successful reconciliation, Shape marks
  only the first unchecked managed slice `in_progress` when no unrelated item
  already owns that status. Otherwise, the slice remains `pending`.
- **AC-005 — Safe reconciliation:** On resume and after pending-plan changes,
  Shape reconciles managed items by reserved feature namespace and stable slice
  number. The accepted pitch, current plan, and Git retain their distinct
  authority roles.
- **AC-006 — Preserved session work:** Shape leaves every unrelated todo item
  unchanged and cancels only stale managed slice items.
- **AC-007 — Verified completion:** Shape marks a managed item `completed` only
  after the matching plan slice meets its existing done conditions and is
  checked.
- **AC-008 — Visible blocking:** A blocked first unchecked slice keeps its
  reconciled status, and its durable blocked detail remains in `plan.md`.
- **AC-009 — Safe fallback:** If todo mirroring is unavailable or a mutation
  fails, Shape reports the exact gap, stops that reconciliation pass, continues
  from `plan.md` and Git, and retries later without weakening gates.
- **AC-010 — Clean finish:** After a successful final reconciliation, no managed
  slice todo remains `pending` or `in_progress`.
- **AC-011 — Narrow package change:** Focused tests, live acceptance, and the
  README describe best-effort instruction behavior without adding an extension,
  dependency, durable todo ID, or artifact.
