---
schema: feature-flow-plan/v1
feature: feature-name
slice: 001-vertical-outcome
pitch_revision: 1
dependencies: []
status: draft
revision: 1
---

# Slice 001: Vertical outcome

## End-to-end observable outcome

Describe one user-observable vertical result.

## Pitch trace to AC IDs

- **AC-001:** Explain the literal acceptance-criterion coverage.

## Preconditions and dependency postconditions

State required prior-slice postconditions and what the next slice can rely on.
For every non-first plan, replace `dependencies: []` with a canonical list
containing only the immediately preceding slice.

## In scope and non-goals

Bound this slice and exclude later behavior.

## TDD Red

Name the first behavior-focused tests, exact command, and expected absent
behavior.

## TDD Green

Describe the smallest vertical implementation that makes Red pass.

## TDD Refactor

Name only bounded cleanup justified after Green.

## Expected files and public seams

List expected files and user-facing or package-facing seams.

## Focused validation

List focused and required repository checks.

## Observable readiness evidence

State the executable or transcript evidence reviewers should inspect.

## Risks and parent decisions

Separate routine implementation risks from any genuinely pitch-level decision.

## Exit criteria

State observable completion conditions for this slice.
