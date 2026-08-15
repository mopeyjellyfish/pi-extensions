# Plan: {{feature}}

Resume by inspecting Git, then work the first unchecked sequential slice. The
map covers the complete accepted scope. Reorder, rewrite, split, merge, or delete
pending slices only when new information changes the plan.

When the `todo` tool is available, derive checked/total progress and the first
unchecked slice from this plan. Reconcile one rolling `Shape <slug>:` item. Keep
`plan.md` authoritative and preserve unrelated todos.

## Delivery map

Use `first`, `after NNN`, or `parallel-safe with NNN`. Parallel delivery requires
human request, isolated worktrees, and one writer for each worktree.

| Slice | Outcome                     | Delivery | Unknowns |
| ----- | --------------------------- | -------- | -------- |
| 001   | Observable vertical outcome | first    | None     |

## [ ] 001 — Observable vertical outcome

### Outcome

State one user- or operator-visible result.

### Pitch trace

Link the relevant pitch headings and acceptance criteria.

### Implementation

Name the public seam, relevant files or contracts, and the smallest useful test
and production change. Avoid speculative task inventories.

### Validation

List only applicable focused tests, required checks, any requested independent
review, and a real user or operator path when one exists.

### Done when

State objective completion conditions. Mark this slice `[x]` only after they
hold. Add a short `> Blocked: … Next: …` note only while the slice is blocked.
