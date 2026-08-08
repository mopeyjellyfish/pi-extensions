---
status: accepted
---

# Shape: Todo tracking for vertical slices

## Executive summary

The `shape` skill will keep one rolling todo item for each active Shape feature
when the `todo` tool is available. The item will show scoped slice progress and
the current slice:

```text
Shape <slug>: <checked>/<total> — <slice number> <outcome>
```

When all slices are checked, the item will show `<total>/<total> — complete` and
become `completed`. `plan.md` remains the detailed and durable source of truth.
The todo item is a compact session display only.

## Problem

Shape records vertical slices as Markdown checkboxes in `plan.md`. The plan is
accurate and durable, but it does not give compact in-session feedback about the
agent's current position.

One todo per slice looks like a direct mirror, but Pi's todo list is global and
ungrouped. Its displayed closed/total ratio includes unrelated and cancelled
items. Its widget shows at most eight rows, and only one item can be
`in_progress`. A per-slice mirror therefore adds clutter and identity rules
without producing reliable Shape-scoped progress. See
[`packages/todo/README.md`](../../../packages/todo/README.md).

The integration must show where the agent is and how much Shape work remains. It
must not create a second authoritative plan or change unrelated todos.

## Appetite

Keep this a small skill-only change. Update Shape instructions, the plan
template, focused resource tests, and the package README.

Keep these quality floors:

- Keep the accepted pitch authoritative for intent.
- Keep the current `plan.md` authoritative for slice membership, order, and
  check state.
- Use Git only for durable history and resume evidence.
- Show Shape-scoped progress in the rolling item text.
- Preserve unrelated todo items and the global active item.
- Continue safely when the `todo` tool is unavailable or a mutation fails.
- Keep the package free of a production extension and new runtime dependencies.

Stop and reshape the work if the required display needs todo grouping,
cross-session ownership, or executable synchronization.

## Research and prior art

The Shape package is a Markdown-only skill package. Its public behavior is in
[`packages/feature-flow/skills/shape/SKILL.md`](../../../packages/feature-flow/skills/shape/SKILL.md).
The first unchecked plan slice is already the current or next slice. A slice is
checked only after its tests, required checks, review, and applicable integrated
QA pass.

The todo extension already provides a persistent widget, `/todos`, tool
transcript rows, and a compact status-line summary. Todo state follows the Pi
session branch through reload, resume, compaction, fork, and tree navigation. A
new session starts with an empty list.

The todo extension intentionally has no grouping or ownership metadata. Its
closed/total summary covers the complete session list. The status line shows the
global active item before the next pending item. Shape must therefore put its
own checked/total count in the managed item text instead of treating the global
ratio as Shape progress.

A plan-only design is simpler but does not meet the requested in-session display.
Adding todo groups would provide stronger ownership and scoped rendering, but it
would require a broader todo and status-line product change. One rolling item is
the smallest design that keeps current-slice feedback and accurate scoped
progress.

Pi loads skill instructions on demand from `SKILL.md`. This feature needs a
best-effort instruction contract with focused tests and live acceptance. It does
not need runtime code or another state store. See Pi's primary
[Skills documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md).

## Solution

After plan creation, plan changes, resume, slice completion, and before finish,
Shape will derive these values from the current `plan.md`:

- `checked`: the number of checked slice headings.
- `total`: the number of slice headings.
- `current`: the first unchecked slice number and outcome.

The managed item uses one of these forms:

```text
Shape <slug>: <checked>/<total> — <slice number> <outcome>
Shape <slug>: <checked>/<total> — <slice number> <outcome> · blocked: <reason>
Shape <slug>: <total>/<total> — complete
```

Todo text is limited to 300 characters. Shape will always preserve
`Shape <slug>: <checked>/<total> — <slice number>` and will truncate only the
trailing outcome and blocked detail with an ellipsis. If the fixed prefix cannot
fit, Shape will report the gap and continue from `plan.md` without a todo
mutation.

Shape reserves the exact `Shape <slug>:` prefix for the rolling item. Before any
mutation, Shape will list all todos and count exact prefix matches:

- If no item matches, add the rolling item as `pending`, then update it to the
  required status.
- If one item matches, update its text and status atomically when possible.
- If more than one item matches, mutate no todo and report the collision.

When slices remain, Shape will set the rolling item `in_progress` only when no
unrelated todo is already `in_progress`. If an unrelated item is active, Shape
will leave it unchanged and keep the rolling item `pending`. If the post-add
status update fails, Shape will leave the new item `pending`, report the gap, and
retry later.

Shape guarantees accurate rolling text in todo state, tool output, and the
complete `/todos` view. The bounded widget and compact status line are
opportunistic displays. The widget can omit the Shape row after eight
higher-priority items. The status line can prefer an unrelated active item,
truncate the title, or omit its todo segment at narrow widths.

A blocked current slice keeps its reconciled `in_progress` or `pending` status.
Shape will append a concise blocked reason from the durable
`> Blocked: … Next: …` note. Shape will remove the suffix when work resumes.

When all slices are checked, Shape will update the text to
`Shape <slug>: <total>/<total> — complete` and mark the item `completed`.

If listing or mutation fails, Shape will stop that reconciliation pass, report
the exact gap, continue from `plan.md` and Git, and retry later. A todo failure
will not weaken an approval, test, review, validation, or delivery gate.

## Fixed decisions

- Todo is a compact session progress display, not a durable feature artifact.
- The accepted pitch defines intent. The current `plan.md` defines slice
  membership, order, check state, and blocked details. Git provides history and
  resume evidence.
- Shape manages one rolling todo item per feature, not one item per slice.
- The item text includes Shape-scoped checked/total progress and the current
  slice number and outcome.
- Shape preserves the fixed progress/current-slice prefix and truncates only
  trailing outcome and blocked detail to fit the 300-character todo limit.
- Accurate text is guaranteed in todo state, tool output, and `/todos`. Widget
  and status-line visibility is opportunistic.
- The first unchecked plan slice determines the current item text.
- A blocked slice adds a concise reason to the rolling item.
- With open slices and no unrelated active todo, the rolling item is
  `in_progress`. Otherwise, it remains `pending`.
- Shape lists todos before mutation and requires zero or one exact prefix match.
- Multiple prefix matches abort reconciliation without todo mutations.
- Shape preserves unrelated todos, including an unrelated `in_progress` item.
- A missing or failed todo mirror does not block the durable Shape workflow.
- Add no production extension, runtime dependency, grouping protocol, durable
  todo ID, or third feature artifact.
- No commit, push, pull request, merge, publication, deployment, destructive
  cleanup, or worktree removal authority is inferred.

## Rabbit holes

- Do not mirror every slice into the global todo list.
- Do not add immutable slice IDs, high-water marks, stale-item cancellation, or
  per-slice ownership rules for display synchronization.
- Do not persist todo IDs or snapshots in `plan.md`.
- Do not clear or replace the complete session todo list.
- Do not mirror pitch, research, review, commit, or delivery tasks.
- Do not interpret todo's global closed/total ratio as Shape progress.
- Do not promise that the bounded widget or compact status line always shows the
  rolling item.
- Do not add todo grouping, a Shape extension, or automatic cross-session
  synchronization without a broader approved use case.

## No-gos

- No new runtime resource, service, dependency, state file, or database.
- No changes to the todo extension protocol, widget, or status line.
- No guarantee that the bounded widget or compact status line always shows
  Shape.
- No deletion, demotion, or mutation of unrelated todo items.
- No more than one managed rolling item for a Shape feature.
- No completion of the rolling item before every plan slice is checked.
- No failure of the durable Shape workflow only because todo display is
  unavailable.
- No weakening of human approval, independent review, validation, Worktrunk, or
  delivery authority boundaries.

## Acceptance criteria

- **AC-001 — One rolling item:** After successful reconciliation, Shape has at
  most one `Shape <slug>:` todo item for the feature.
- **AC-002 — Scoped progress:** The item text contains the checked and total
  slice counts derived from the current `plan.md`.
- **AC-003 — Current position:** While slices remain, the item text contains the
  first unchecked slice number and outcome. Accurate text is available in todo
  state, tool output, and `/todos`. Widget and status-line visibility is
  opportunistic.
- **AC-004 — Bounded text:** Shape preserves the fixed progress/current-slice
  prefix and truncates only trailing detail to fit 300 characters. If the fixed
  prefix cannot fit, Shape reports the gap without mutation.
- **AC-005 — Active feedback:** With open slices and no unrelated active todo,
  the rolling item becomes `in_progress`. If an unrelated item is active, Shape
  leaves it unchanged and keeps the rolling item `pending`.
- **AC-006 — Safe reconciliation:** Zero prefix matches add the item, one match
  updates it, and multiple matches cause no todo mutation.
- **AC-007 — Resume and plan changes:** Shape recomputes text and status from
  `plan.md` after plan creation, plan changes, resume, and slice completion.
- **AC-008 — Visible blocking:** A blocked current slice adds its concise blocked
  reason to the rolling item without changing durable plan authority.
- **AC-009 — Verified completion:** After every slice is checked, the rolling
  item shows `<total>/<total> — complete` and becomes `completed`.
- **AC-010 — Safe fallback:** If todo display is unavailable or a mutation fails,
  Shape reports the gap and continues from `plan.md` and Git without weakening
  gates.
- **AC-011 — Narrow package change:** Focused tests, live acceptance, and the
  README describe best-effort instruction behavior without adding runtime code,
  dependencies, grouping, durable todo IDs, or artifacts.
