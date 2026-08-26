---
status: accepted
---

# Shape: Dependency-aware pull request topology

## Problem and evidence

The current planning guidance creates one ordered GitHub stack whenever one
accepted pitch has two or more delivery units. This rule incorrectly treats
independent delivery units as sequential work.

Independent units can often run at the same time on separate branches and in
separate worktrees. Requiring a stack adds ancestry, cascade, and publication
coordination that the work does not need. Dependent units still need an explicit
order, and a GitHub stack makes that review sequence clear.

The requested outcome is dependency-aware topology. Use parallel sibling pull
requests for independent delivery units. Use a GitHub stack only for a sequential
dependency chain. A mixed plan can contain multiple independent branches and one
or more dependent stacks when that topology shortens the critical path safely.

## Proposed solution

Update the portable skill contracts so that planning derives pull-request
topology from the delivery-unit dependency graph:

- One delivery unit uses one branch and one standalone pull request by default.
- Independent delivery units use sibling branches and independent pull requests
  from their accepted common base. They can run in parallel with separate
  worktrees, sole writers, and non-overlapping ownership.
- Sequentially dependent delivery units use one ordered GitHub stack. Each unit
  becomes one stack position whose base is the adjacent lower branch.
- A mixed plan uses the fewest independent pull requests and dependent stacks
  that preserve review value and shorten the critical path safely.
- Multiple atomic commits can stay within a coherent standalone delivery unit.
  Commit count alone never selects a stack or an additional branch.
- The plan records topology, branch, pull-request base, stack position when
  applicable, dependencies, checks, ownership, integration points, CI fan-out,
  and cascade cost for every delivery unit.
- `implement` starts independent ready units in parallel only when worktrees,
  writers, files, and dependencies are safe. It publishes sequential units in
  stack order and independent units as sibling pull requests through `open-pr`.
- `open-pr` keeps existing remote-mutation safeguards and requires `gh stack`
  only for a planned sequential chain.

The change updates the affected skill guidance, plan template, package READMEs,
and resource-contract tests. It does not change runtime TypeScript or GitHub CLI
implementation code.

## Boundaries and no-gos

- Do not create stack positions only because a pitch has multiple delivery
  units, vertical slices, branches, or atomic commits.
- Do not publish a sequential dependency chain as unrelated pull requests.
- Do not stack independent units only to give them an order they do not need.
- Do not parallelize overlapping writers, shared mutable boundaries, or unresolved
  dependencies.
- Do not split a coherent delivery unit only to manufacture parallel work or a
  stack.
- Do not weaken the requirement that every delivery unit has a useful review
  boundary and viable checks.
- Do not fall back from a planned stack to `gh pr create` when `gh stack` is
  unavailable.
- Do not authorize merge, release, deployment, destructive cleanup, or unrelated
  remote changes.
- Do not add production dependencies or couple independently installable
  packages.

Reshape if execution evidence changes delivery-unit dependencies, ownership, or
publication boundaries.

## Decision-changing research and risks

Current repository terms already map one delivery unit to one branch and one pull
request by default. Dependency relationships, not item count, determine whether
those pull requests are siblings or stack positions.

Parallel sibling pull requests can shorten the critical path, but they increase
CI fan-out and integration work. Planning must reject overlapping writers and
record the integration point before approval.

Sequential stacks preserve review order, but lower-branch changes cascade into
upper positions. Planning must forecast that cost and collapse dependent units
when the stack does not repay its coordination cost.

A mixed dependency graph can require more than one independent lane or stack.
The plan must use the smallest safe topology and must not add branches only
because the feature is large.

Plan-less work remains one standalone delivery unit unless the human approves a
new delivery topology through planning.

## Review evidence

- **Applicability:** not applicable. This change does not target Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns the final wording and consistency across the affected portable skill contracts.

The selected execution mode remains accept-all implementation. This is only a
preference until approval of the revised whole plan confirms authority for its
named delivery unit.

Pitch approval authorizes the bounded pitch commit and the planning handoff. It does not authorize implementation until whole-plan approval. It never authorizes merge, release, deployment, destructive cleanup, or unrelated remote changes.

## Observable acceptance criteria

- **AC-001 — Dependency-aware topology:** Planning selects sibling pull requests
  for independent delivery units and GitHub stacks for sequential dependency
  chains.
- **AC-002 — Single-unit default:** One delivery unit uses one branch and one
  standalone pull request by default.
- **AC-003 — Safe parallel work:** Independent ready units can run in parallel
  only with isolated worktrees, sole writers, non-overlapping ownership, and a
  named integration point.
- **AC-004 — Sequential stack metadata:** Each stacked unit records its branch,
  adjacent base, stack position, dependencies, checks, and cascade cost.
- **AC-005 — Parallel PR metadata:** Each independent unit records its common
  base, branch, ownership, checks, integration point, and CI fan-out.
- **AC-006 — Commit-count neutrality:** Multiple slices or atomic commits inside
  one coherent delivery unit do not create stack positions or extra pull
  requests.
- **AC-007 — Topology-aware execution:** Implementation runs safe independent
  units in parallel and publishes sequential units in stack order.
- **AC-008 — Safe publication:** `open-pr` uses standalone publication for
  independent units, requires `gh stack` for sequential chains, and fails closed
  when required tooling is unavailable.
- **AC-009 — Package consistency:** Affected package READMEs and deterministic
  resource tests enforce the same dependency-aware rule.
