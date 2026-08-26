---
status: accepted
---

# Plan: GitHub stacks for multiple delivery units

This plan implements the accepted pitch in one coherent delivery unit. It covers the planning trigger, implementation publication order, package documentation, and deterministic contract tests.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Execution mode

Use accept-all implementation. Whole-plan approval confirms accept-all authority only for this named plan. It does not authorize merge, release, deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Branch                               | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                   |
| ------------- | ------------------------------------ | ----------------- | --------------- | ------------ | ----------------------------------------------------- |
| 1             | `docs/github-stack-multi-item-plans` | `main`            | `001`, `002`    | none         | serial; current isolated worktree; direct parent only |

This plan uses one delivery unit because the changed contracts form one reviewable policy update. It uses one branch and one standalone pull request. The unit can contain separate atomic commits only if test-first evidence makes that useful.

The implemented planning rule is different from this plan's topology. For future accepted pitches, one delivery unit uses one standalone pull request. Two or more delivery units from the same accepted pitch require one ordered GitHub stack. Multiple slices or commits inside one delivery unit do not create stack positions.

## Critical path, dependencies, and lanes

The serial critical path is:

1. Add deterministic contract assertions for the new stack trigger.
2. Update the portable planning and implementation guidance.
3. Update the affected package READMEs.
4. Run focused package tests, then the repository completion check.

There is one active lane, one delivery unit, one pull request, no integration branch, and no parallel writer. The expensive gate is `npm run check`. The likely cascade cost is low because this delivery unit is standalone.

Invalidation map:

- A test-only edit invalidates the focused package test that owns the assertion.
- A skill or README edit invalidates its package test and formatting checks.
- Any final edit invalidates the frozen-tree identifier and `npm run check` evidence.

## [ ] 001 — Planning records an automatic stack for multiple delivery units

### Outcome and requirement trace

Planning states that two or more delivery units from one accepted pitch require one ordered GitHub stack. One delivery unit remains standalone. Multiple slices or commits inside one delivery unit do not create stack positions. This slice satisfies AC-001 through AC-004.

### Seam and files

Public seam:

- `planning-changes` skill guidance;
- the plan template;
- the `pi-feature-flow` README.

Likely files:

- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/skills/shape/templates/plan.md`
- `packages/feature-flow/README.md`
- `packages/feature-flow/test/resources.test.ts`

### Dependencies

Accepted pitch at `docs/features/github-stack-for-multiple-delivery-units/pitch.md`.

### Execution lane and ownership

Use the serial lane in the current isolated worktree. The direct parent is the sole writer.

### Red proof

Add or revise deterministic resource assertions so that the current optional-stack wording fails. The assertions must require:

- one standalone pull request for one delivery unit;
- one ordered GitHub stack for two or more delivery units from one accepted pitch;
- no stack position only because one delivery unit has multiple slices or commits;
- branch, adjacent base, stack position, dependencies, checks, and cascade cost for each stacked delivery unit.

Run `npm --workspace @mopeyjellyfish/pi-feature-flow test` and record the intended failure.

### Green proof and checks

Update the skill, template, and README with the minimum consistent guidance. Run `npm --workspace @mopeyjellyfish/pi-feature-flow test` and record the passing result.

A revision to any listed resource invalidates this focused proof.

### Atomic commit and pull request

Keep this slice in delivery unit 1 on `docs/github-stack-multi-item-plans`. Its pull request base is `main`. It is standalone because this plan has one delivery unit.

### Done when

- The feature-flow tests enforce all four topology conditions.
- The planning skill, plan template, and README use one consistent trigger.
- No wording implies one stack position per slice, commit, or plan document.

## [ ] 002 — Implementation publishes accepted units in stack order

### Outcome and requirement trace

Implementation consumes the planned topology. For a multi-unit pitch, it commits and publishes each accepted delivery unit in dependency and stack order through `open-pr` and `gh stack`. Missing stack tooling fails closed. This slice satisfies AC-005 through AC-007.

### Seam and files

Public seam:

- `implement` skill guidance;
- the `pi-engineering` README.

Likely files:

- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`

The existing `open-pr` skill already owns safe `gh stack` publication. Change it only if focused evidence finds a contradictory trigger or ordering rule.

### Dependencies

Slice 001 defines the planned stack trigger and topology metadata.

### Execution lane and ownership

Use the same serial lane, writer, branch, and worktree after slice 001 passes.

### Red proof

Add or revise deterministic resource assertions so that current generic planned-stack wording fails unless implementation explicitly preserves dependency and stack order for every multi-unit accepted pitch.

Run `npm --workspace @mopeyjellyfish/pi-engineering test` and record the intended failure.

### Green proof and checks

Update the implementation skill and README with the minimum ordered-publication guidance. Run:

- `npm --workspace @mopeyjellyfish/pi-engineering test`
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- `npm run check`

A revision to an affected package resource invalidates that package's focused test. Any revision after `npm run check` invalidates the final repository gate.

### Atomic commit and pull request

Keep this slice in delivery unit 1. Use one final package-owned Conventional Commit if the feature-flow and engineering contract changes are inseparable. Otherwise use ordered package-local commits on the same branch without creating another pull request.

### Done when

- Implementation guidance names dependency and stack order for multi-unit accepted pitches.
- `open-pr` and `gh stack` remain mandatory for the planned stack.
- Missing delivery tooling fails closed and preserves evidence.
- Both focused package tests and `npm run check` pass on the final tree.
