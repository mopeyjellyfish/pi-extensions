---
status: accepted
---

# Shape: GitHub stacks for multiple delivery units

## Problem and evidence

The current planning guidance treats a stack as optional when one accepted pitch has multiple delivery units. It requires several extra justifications before planning a stack.

This rule can publish dependent delivery units as unrelated pull requests. It also makes the intended review order less clear while one pitch and its complete plan are in progress.

The requested outcome is a clear default. When one accepted pitch has two or more delivery units, the plan creates one ordered GitHub stack. Multiple slices or commits inside one delivery unit still use one branch and one pull request.

## Proposed solution

Update the portable skill contracts so that planning uses this topology:

- One delivery unit uses one branch and one standalone pull request by default.
- Two or more delivery units from one accepted pitch use one ordered GitHub stack.
- Each delivery unit becomes one stack position and keeps independent review, validation, and publication evidence.
- The plan records the branch, adjacent pull-request base, stack position, dependency order, and cascade cost for each delivery unit.
- `implement` publishes accepted delivery units in stack order through `open-pr`.
- `open-pr` continues to require `gh stack` and keeps its existing remote-mutation safeguards.

The change updates the affected skill guidance, plan template, package READMEs, and resource-contract tests. It does not change runtime TypeScript or GitHub CLI implementation code.

## Boundaries and no-gos

- Do not create stack positions only because one delivery unit has multiple vertical slices or atomic commits.
- Do not split a coherent delivery unit to manufacture a stack.
- Do not weaken the requirement that every delivery unit has a useful review boundary and viable checks.
- Do not fall back from a planned stack to `gh pr create` when `gh stack` is unavailable.
- Do not authorize merge, release, deployment, destructive cleanup, or unrelated remote changes.
- Do not add production dependencies or couple independently installable packages.

Reshape if the desired rule is one stack position per slice, commit, or plan document instead of one position per delivery unit.

## Decision-changing research and risks

Current repository terms already map one delivery unit to one branch and one pull request. The smallest consistent change makes a stack automatic only when the accepted pitch has multiple delivery units.

The main risk is unnecessary coordination cost. The boundary above controls this risk by keeping multiple slices and commits in one delivery unit. The plan must still forecast cascade cost and can reduce the number of delivery units before approval.

A second risk is ambiguity for plan-less work. This change applies only to delivery units derived from one accepted pitch and complete plan. Existing standalone behavior remains unchanged for plan-less requests.

## Review evidence

- **Applicability:** not applicable. This change does not target Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns the final wording and consistency across the affected portable skill contracts.

The selected execution mode is accept-all implementation. This is only a preference until whole-plan approval confirms authority for the named accepted plan.

Pitch approval authorizes the bounded pitch commit and the planning handoff. It does not authorize implementation until whole-plan approval. It never authorizes merge, release, deployment, destructive cleanup, or unrelated remote changes.

## Observable acceptance criteria

- **AC-001 — Automatic stack trigger:** Planning states that two or more delivery units from one accepted pitch require one ordered GitHub stack.
- **AC-002 — Single-unit default:** Planning states that one delivery unit uses one branch and one standalone pull request by default.
- **AC-003 — No slice or commit trigger:** Guidance states that multiple slices or commits inside one delivery unit do not create stack positions.
- **AC-004 — Complete stack metadata:** Each planned delivery unit records its branch, adjacent base, stack position, dependencies, checks, and cascade cost.
- **AC-005 — Ordered publication:** Implementation publishes accepted delivery units in dependency and stack order through `open-pr` and `gh stack`.
- **AC-006 — Safe failure:** Missing `open-pr` or `gh stack` fails closed for publication and preserves local evidence.
- **AC-007 — Package consistency:** Affected package READMEs and deterministic resource tests enforce the same rule.
