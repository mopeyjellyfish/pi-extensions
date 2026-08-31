---
status: draft
---

# Plan: {{feature}}

Complete this delivery plan before implementation. It covers every accepted
vertical slice, the critical path, dependencies, delivery units, and independent
lanes.

## Review evidence

- **Applicability:** `not applicable` for non-Go work; otherwise state the
  Go-targeted evidence.
- **Fixed document:** State the reviewed plan revision or `not applicable`.
- **Status:** State the Go specification review result or `not applicable`.
- **Invalidation:** State why the review remains valid or was replaced, or
  `not applicable`.

## Execution mode

Repeat the selected execution mode: checkpointed implementation (default) or
accept-all implementation. Only whole-plan approval confirms accept-all
authority for the named accepted plan; it never authorizes merge, release,
deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Topology                 | Stack position      | Branch     | Pull request base   | Dependencies | Checks              | Ownership               | Integration point  | CI fan-out | Cascade cost |
| ------------- | ------------------------ | ------------------- | ---------- | ------------------- | ------------ | ------------------- | ----------------------- | ------------------ | ---------- | ------------ |
| 1             | standalone/sibling/stack | `standalone` or 1/N | `<branch>` | `<common/adjacent>` | none         | `<required checks>` | `<worktree and writer>` | `<target or none>` | `<count>`  | `<forecast>` |

One delivery unit, branch, and pull request is the default. A delivery unit is
one coherent review, validation, and publication boundary and may contain
multiple atomic commits. State whether planning documents share implementation
publication; split only for independent review or merge value.

Select topology from delivery-unit dependencies, not item count. Use sibling
standalone pull requests for independent delivery units and an ordered GitHub
stack for each sequential dependency chain. A mixed plan can contain parallel
sibling pull requests and one or more dependent stacks.
Every delivery unit, sibling or stacked, must retain independent review value and
required-check viability.

For every independent unit, record its accepted common base, branch, ownership,
checks, integration point, and CI fan-out. Parallel lanes need separate isolated
worktrees, sole writers, and non-overlapping ownership. For every stacked unit,
record its branch, adjacent pull-request base, stack position, dependencies,
checks, and cascade cost. If coordination cost does not repay review or merge
value, collapse delivery units before plan approval.

Multiple slices or commits inside one delivery unit do not create branches, pull
requests, or stack positions. Every pull request uses `open-pr`. Only a planned
sequential chain uses `gh stack`. `gh stack link` verifies a Worktrunk-managed
chain but creates no local tracked view; use `gh stack view --json` only for
locally tracked stacks.

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

For an interface slice, trace the accepted image-to-interface contract to native
accessible structure, target components, and semantic tokens. Name representative
states, responsive surfaces, accessibility paths, system reuse, and visual proof,
including representative desktop and mobile browser evidence and a visual mismatch
ledger. Complete the implementation only when material mismatches are resolved or
explicitly accepted. Put a design-evidence slice before UI implementation when
direction remains provisional, and name any separate `DESIGN.md` approval gate.

### Atomic commit and pull request

State the atomic commit unit and its delivery unit. State the pull-request base
and stack position only when this slice starts a different delivery unit.

### Done when

State objective completion conditions. Mark `[x]` only after they hold.
