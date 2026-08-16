---
status: draft
---

# Plan: {{feature}}

Complete this delivery plan before implementation. It covers every accepted
slice, the critical path, dependencies, pull-request order, and independent
lanes.

## Delivery topology

| Stack position | Branch     | Pull request base | Dependencies | Lane/worktree owner                      |
| -------------- | ---------- | ----------------- | ------------ | ---------------------------------------- |
| 0              | `<branch>` | `<base>`          | none         | `<lane>; isolated worktree; sole writer` |

State whether the plan is a stack. A planned stack uses `open-pr` and `gh stack`.
`gh stack link` verifies a Worktrunk-managed chain but creates no local tracked
view; use `gh stack view --json` only for locally tracked stacks.

## Critical path and lanes

List dependency order and each genuinely independent lane. Parallel lanes need
separate worktrees, sole writers, and non-overlapping files.

## [ ] 001 — Observable vertical outcome

### Outcome and requirement trace

State the observable result and relevant accepted criteria.

### Seam and files

Name the public seam and likely files.

### Dependencies

List prior slices, contracts, or `none`.

### Execution lane and ownership

Use `serial` or `parallel-ready`. For `parallel-ready`, name the lane, isolated
worktree, sole writer, non-overlapping files, and integration dependency.

### Red proof

State the focused failing test or before-state proof.

### Green proof and checks

State the focused passing proof and required checks.

### Atomic commit and pull request

State the atomic commit unit, PR base, and stack position.

### Done when

State objective completion conditions. Mark `[x]` only after they hold.
