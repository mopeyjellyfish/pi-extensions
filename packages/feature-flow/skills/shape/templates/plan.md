---
status: draft
---

# Plan: {{feature}}

Complete this delivery plan before implementation. It covers every accepted
vertical slice, the critical path, dependencies, delivery units, and independent
lanes.

## Delivery topology

| Delivery unit | Branch     | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                      |
| ------------- | ---------- | ----------------- | --------------- | ------------ | ---------------------------------------- |
| 1             | `<branch>` | `<base>`          | `001...`        | none         | `<lane>; isolated worktree; sole writer` |

One delivery unit, branch, and pull request is the default. A delivery unit is
one coherent review, validation, and publication boundary and may contain
multiple atomic commits. State whether planning documents share implementation
publication; split only for independent review or merge value.

A stack is exceptional. For every stack position, state independent value,
required-check viability, integration dependency, CI fan-out, and justified
cascade cost. A planned stack uses `open-pr` and `gh stack`. `gh stack link`
verifies a Worktrunk-managed chain but creates no local tracked view; use
`gh stack view --json` only for locally tracked stacks.

## Critical path, dependencies, and lanes

List dependency order and each genuinely independent lane. Record a
critical-path forecast: active lanes, delivery-unit and pull-request count,
integration points, expensive gates, and likely cascade cost. Parallel lanes
need separate worktrees, sole writers, and non-overlapping files. Predeclare an
invalidation map for focused proof, affected-boundary checks, integration proof,
and final required gates. Pause and report variance when observed coordination
materially exceeds the forecast.

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

State the narrow deterministic focused failing test or before-state proof.

### Green proof and checks

State the focused passing proof, affected-boundary and integration checks when
needed, and final required gates. State which evidence a revision invalidates.

### Atomic commit and pull request

State the atomic commit unit and its delivery unit. State the pull-request base
and stack position only when this slice starts a different delivery unit.

### Done when

State objective completion conditions. Mark `[x]` only after they hold.
