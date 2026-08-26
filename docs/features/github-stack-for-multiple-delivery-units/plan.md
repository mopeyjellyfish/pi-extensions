---
status: accepted
---

# Plan: Dependency-aware pull request topology

This plan revises the existing skill-contract change in one coherent delivery
unit. It replaces the automatic multi-unit stack trigger with dependency-aware
parallel and sequential publication rules.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Execution mode

Use accept-all implementation. Whole-plan approval confirms accept-all authority
only for this revised named plan and its existing branch and pull request. It does
not authorize merge, release, deployment, destructive cleanup, or unrelated
work.

## Delivery topology

| Delivery unit | Topology   | Branch                               | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                   |
| ------------- | ---------- | ------------------------------------ | ----------------- | --------------- | ------------ | ----------------------------------------------------- |
| 1             | standalone | `docs/github-stack-multi-item-plans` | `main`            | `001`, `002`    | none         | serial; current isolated worktree; direct parent only |

This revision remains one delivery unit because the planning, execution, and
publication contracts form one reviewable policy update. The existing pull
request stays standalone.

The implemented rule for future plans is dependency-aware:

- one delivery unit uses one standalone pull request;
- independent delivery units use sibling branches and sibling pull requests from
  their accepted common base;
- sequentially dependent delivery units use an ordered GitHub stack;
- a mixed dependency graph can use parallel sibling pull requests plus one or
  more dependent stacks;
- multiple atomic commits can stay within a coherent standalone delivery unit;
  and
- item, slice, branch, or commit count alone does not select topology.

## Critical path, dependencies, and lanes

The serial critical path for this revision is:

1. Add deterministic assertions for independent, sequential, and mixed
   topologies.
2. Update planning and plan-template guidance.
3. Update implementation and publication guidance.
4. Update the affected package READMEs.
5. Run focused package tests, fixed-diff review, and `npm run check`.
6. Commit, push, and update pull request 101.

There is one active lane for this repository change. The future guidance can
create several lanes only when delivery units have complete dependencies,
separate worktrees, sole writers, non-overlapping ownership, and a named
integration point.

The expensive gate is `npm run check`. This change adds no CI fan-out to the
current pull request. The future planning contract must forecast CI fan-out for
parallel sibling pull requests and cascade cost for sequential stacks.

Invalidation map:

- A test-only edit invalidates the focused package test that owns the assertion.
- A skill, template, or README edit invalidates its package test and formatting
  checks.
- A topology-contract edit invalidates all three focused package tests.
- Any final edit invalidates the frozen-tree identifier and `npm run check`
  evidence.

## [ ] 001 — Planning selects topology from dependencies

### Outcome and requirement trace

Planning uses sibling pull requests for independent delivery units, GitHub stacks
for sequential dependency chains, and a mixed topology when both relationships
exist. One delivery unit remains standalone. Commit count does not select
topology. This slice satisfies AC-001 through AC-006.

### Seam and files

Public seam:

- `planning-changes` skill guidance;
- the plan template; and
- the `pi-feature-flow` README.

Likely files:

- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/skills/shape/templates/plan.md`
- `packages/feature-flow/README.md`
- `packages/feature-flow/test/resources.test.ts`

### Dependencies

Accepted revised pitch at
`docs/features/github-stack-for-multiple-delivery-units/pitch.md`.

### Execution lane and ownership

Use the serial lane in the current isolated worktree. The direct parent is the
sole writer.

### Red proof

Revise deterministic resource assertions so the current automatic stack wording
fails. The assertions must require:

- sibling branches and sibling standalone pull requests for independent delivery
  units from an accepted common base;
- an ordered GitHub stack only for a sequential dependency chain;
- a mixed topology for independent lanes that contain dependent chains;
- isolated worktrees, sole writers, non-overlapping ownership, and named
  integration points for parallel work;
- topology, branch, pull-request base, stack position when applicable,
  dependencies, checks, ownership, integration point, CI fan-out, and cascade
  cost in the plan template; and
- no topology change only because one unit has multiple slices or commits.

Run `npm --workspace @mopeyjellyfish/pi-feature-flow test` and record the intended
failure.

### Green proof and checks

Update the skill, template, and README with the minimum consistent guidance. Run
`npm --workspace @mopeyjellyfish/pi-feature-flow test` and record the passing
result.

A revision to any listed resource invalidates this focused proof.

### Atomic commit and pull request

Keep this slice in delivery unit 1 on `docs/github-stack-multi-item-plans`. Its
pull request base is `main`. It remains standalone because this revision has one
delivery unit.

### Done when

- The feature-flow tests enforce independent, sequential, and mixed topology.
- The plan template records all topology and coordination fields.
- No wording selects a stack by delivery-unit, slice, branch, or commit count.
- Planning preserves the smallest safe topology that shortens the critical path.

## [ ] 002 — Execution preserves parallel and sequential topology

### Outcome and requirement trace

Implementation starts safe independent ready units in parallel, keeps dependent
units in order, and publishes each unit through the accepted topology. `open-pr`
uses standalone publication for independent units and `gh stack` only for planned
sequential chains. This slice satisfies AC-007 through AC-009.

### Seam and files

Public seams:

- `implement` skill guidance;
- `open-pr` skill guidance; and
- the `pi-engineering` and `pi-github` READMEs.

Likely files:

- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`
- `packages/github/skills/open-pr/SKILL.md`
- `packages/github/README.md`
- `packages/github/test/skills.test.ts`

### Dependencies

Slice 001 defines the planned topology, metadata, and safe parallel lanes.

### Execution lane and ownership

Use the same serial lane, writer, branch, and worktree after slice 001 passes.

### Red proof

Revise deterministic resource assertions so the current automatic stack wording
fails unless:

- implementation starts only safe independent ready units in parallel;
- independent units publish as sibling standalone pull requests from their
  accepted common base;
- sequential chains publish in dependency and stack order through `gh stack`;
- mixed plans preserve each independent lane and dependent chain; and
- unavailable required publication tooling fails closed without changing the
  accepted topology.

Run the Engineering and GitHub focused package tests and record the intended
failures.

### Green proof and checks

Update the implementation, publication, and README guidance with the minimum
consistent behavior. Run:

- `npm --workspace @mopeyjellyfish/pi-engineering test`
- `npm --workspace @mopeyjellyfish/pi-github test`
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- `npm run check`

A revision to an affected package resource invalidates that package's focused
test. Any revision after `npm run check` invalidates the final repository gate.

### Atomic commit and pull request

Keep this slice in delivery unit 1. Use one follow-up Conventional Commit for the
inseparable cross-package contract revision. Push it to the existing branch and
update pull request 101 without changing its base.

### Done when

- Implementation guidance supports safe parallel independent delivery units.
- Sequential chains use `open-pr` and `gh stack` in dependency order.
- Independent units use sibling standalone pull requests and do not require
  `gh stack`.
- Mixed plans preserve their accepted dependency graph.
- Missing required delivery tooling fails closed and preserves evidence.
- All focused package tests and `npm run check` pass on the final tree.
