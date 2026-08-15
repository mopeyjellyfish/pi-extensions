---
status: draft
---

# Plan: {{feature}}

Work the first unchecked slice. Keep slices serial unless the accepted plan
explicitly proves that an independent lane is worth its extra coordination.

## [ ] 001 — Observable vertical outcome

### Outcome

State one user- or operator-visible result.

### Requirement trace

Link the relevant pitch headings and acceptance criteria.

### Implementation

Name the public seam, likely files, and smallest production change.

### Execution mode

Use `serial` or `parallel-ready`. List dependencies. Use `parallel-ready` only
when the slice can run in an isolated worktree without shared writes.

### Test posture

Use `tdd`, `characterization`, or `no-new-tests` with a reason.

### Red signal

State the focused failing test or before-state proof.

### Green signal

State the focused passing test or after-state proof.

### Verification

List the integrated path and applicable repository-required checks.

### Done when

State objective completion conditions. Mark the slice `[x]` only after they
hold.
