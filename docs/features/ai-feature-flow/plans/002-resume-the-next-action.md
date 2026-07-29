---
schema: feature-flow-plan/v2
feature: ai-feature-flow
id: "002"
pitch_sha256: 4b76f3837e934962d15c679deb78f9e66243343c1cc946a616d770980c8a4ae9
depends_on:
  - "001"
---

# Slice 002: Resume the next action

## Goal

`/shape` without a brief deterministically resumes the current routed feature or
discovers valid feature ledgers across linked worktrees without mutating them.
It activates one valid candidate, asks one structured choice for several, and
asks for a new brief when none exist.

## Pitch trace

- [User experience](../pitch.md#user-experience)
- [Workspace first](../pitch.md#workspace-first)
- [Coordinator ledger](../pitch.md#coordinator-ledger)
- [Human edits to machine state](../pitch.md#human-edits-to-machine-state)
- **AC-001**, **AC-002**, **AC-011**, **AC-016**, and applicable **AC-017**

## Observable outcome

From either a routed feature worktree or the shared checkout, `/shape` produces
one bounded status with a derived phase, current slice, and next action. Candidate
discovery writes nothing, stale branch/base facts are reported rather than
adopted, and candidate ambiguity is resolved by one human choice.

## Dependencies and predecessor postconditions

Depends on slice 001. The package exposes one skill/prompt, `init` creates a
closed-schema v3 ledger only after route verification, and draft artifacts are
canonical and packable.

## Scope

- The `shape` skill enumerates linked candidate paths through Worktrunk, then
  passes those paths to read-only helper inspection. The helper validates each
  candidate against bounded Git branch/base facts; only the skill uses Worktrunk
  to activate the selected branch. Neither layer invents a second worktree
  manager.
- Validate canonical feature-relative paths, branch/base identity, accepted hash
  when present, known fields, bounds, dependency/status invariants, and absence
  of local absolute paths.
- Derive phase/current/next from pitch and slice facts; do not persist those
  projections.
- Define exact zero/one/many/stale/malformed behavior in `shape`, artifact
  guidance, tests, eval rubrics, and README.
- Do not add pitch acceptance or Build transitions.

## Public seam and first TDD tracer

**Seam:** `/shape` with no arguments and the helper’s bounded JSON inspection
result.

**Independent expectation:** actual temporary Git worktree branch/base facts and
the accepted pitch’s resume table determine the valid candidate.

Create one failing integration fixture from candidate paths equivalent to a
Worktrunk list result, with one valid linked-worktree ledger and one stale
ledger. Assert that helper inspection returns the valid candidate, reports the
stale one, and leaves both files byte-identical. Implement only enough
validation to pass. Add a focused resource-contract test that the skill obtains
paths from Worktrunk before validation/activation. Add no-candidate,
several-candidate, malformed, unknown-field, and hand-edited cases one red/green
tracer at a time.

## Validation

- Focused helper and skill contract tests.
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- Package dry-run inspection.
- `npm run smoke:source`
- `npm run packages:check`
- `npm run check` after the final edit.

## Dogfood and QA

From a disposable shared checkout, use the real Worktrunk list/activation path
to exercise no candidate, one valid candidate, several valid candidates, and a
stale branch/base candidate. Confirm helper validation is read-only, one
candidate activates then resumes through Worktrunk, several candidates create
one structured choice, and none asks for a brief. Repeat after an idle
`/reload`, then record and bank slice 002 before slice 003 activates.

## Risks and escalation

- Read-only Git plumbing must not become a second worktree manager.
- A dirty shared checkout may be inspected but never mutated.
- If a linked path cannot be validated safely, report it as stale/invalid and do
  not guess.

## Done when

Every routed/shared resume case yields one safe next action or one bounded user
choice, candidate enumeration and activation use Worktrunk, invalid candidates
remain untouched, exact errors are useful, checks pass, independent review is
blocker-free, and complete evidence plus verified banking precede slice 003.
