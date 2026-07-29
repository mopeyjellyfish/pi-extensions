---
schema: feature-flow-plan/v2
feature: ai-feature-flow
id: "004"
pitch_sha256: 4b76f3837e934962d15c679deb78f9e66243343c1cc946a616d770980c8a4ae9
depends_on:
  - "003"
---

# Slice 004: Plan mutable vertical slices

## Goal

Resuming an accepted pitch with no slices automatically creates and reviews the
smallest coherent numbered vertical plan set. Pending plans may be refined,
split, merged, or reordered while active and completed plans remain fixed.

## Pitch trace

- [Vertical-slice planning](../pitch.md#vertical-slice-planning)
- [Coordinator ledger](../pitch.md#coordinator-ledger)
- [Evaluation](../pitch.md#evaluation)
- [Planning too much up front](../pitch.md#planning-too-much-up-front)
- **AC-009**, **AC-010**, planning portions of **AC-011**, **AC-015**,
  **AC-016**, and applicable **AC-017**

## Observable outcome

`/shape` derives `planning`, creates `plans/NNN-*.md`, obtains a blocker-free
whole-set review, and atomically registers matching pending records in
`index.json`. Plan Markdown contains no mutable status. Independent slices are
not given fake dependencies merely because execution is serial.

## Dependencies and predecessor postconditions

Depends on slice 003. The current pitch is complete, accepted, hash-pinned,
immutable, independently reviewed, and safely repitchable.

## Scope

- Add concise planning guidance and a v2 plan template requiring only goal,
  exact pitch trace, dependencies/predecessor postconditions, public seam and
  first tracer, applicable checks, integrated user/operator dogfood, and done
  conditions. Optional sections appear only when material.
- Add helper operations to validate/register one complete reviewed plan set and
  to refine, split, merge, or reorder only pending entries.
- Validate IDs, filenames, pitch hash pins, dependency existence and acyclicity,
  canonical paths, one-current invariants, file/ledger agreement, and complete
  pitch-AC coverage.
- Keep semantic verticality, dependency meaning, feasibility, and plan quality
  with the planner/reviewer. Do not add a human plan gate.

## Public seam and first TDD tracer

**Seam:** `/shape` while phase derives as `planning`, numbered plan files, and
atomic ledger registration.

**Independent expectation:** a fixture with two independently observable
outcomes and no predecessor need should retain two empty dependency arrays.

Write one failing test that registers that reviewed pair and proves no direct
chain is invented. Implement only enough DAG validation/registration to pass.
Then add one failing test that refines only the second pending goal/file and
asserts the first plan and record remain byte/deep equal. Add cycle, unknown AC,
active-plan mutation, and rollback cases one tracer at a time.

## Validation

- Focused plan parser/registration/refinement and skill resource tests.
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- Package dry-run inspection.
- `npm run smoke:source`
- `npm run packages:check`
- `npm run check` after final edits.

## Dogfood and QA

Resume an accepted disposable feature, inspect its complete plans for vertical
outcomes and pitch coverage, then refine/reorder two pending independent plans.
Confirm there is no plan approval question or status in plan files; only pending
plan files and their matching ledger records change, while the accepted pitch
and active/completed/cut plans remain byte-identical. Obtain a blocker-free
whole-set review, repeat after an idle reload, then record evidence and bank
slice 004 before Build activates.

## Risks and escalation

- Mechanical AC coverage is not semantic coverage; helper success never replaces
  review.
- Pending mutability must not permit changing an active/completed/cut plan.
- A changed pitch hash invalidates planning and returns to repitch rather than
  silently regenerating around accepted intent.

## Done when

Every plan satisfies the minimal contract, files and ledger agree, valid DAGs
preserve real independence, pending refinements are atomic, fixed plans reject
mutation, complete-set review is blocker-free, checks pass, and complete
evidence plus verified banking precede slice 005.
