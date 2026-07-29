---
schema: feature-flow-plan/v2
feature: ai-feature-flow
id: "005"
pitch_sha256: 4b76f3837e934962d15c679deb78f9e66243343c1cc946a616d770980c8a4ae9
depends_on:
  - "004"
---

# Slice 005: Deliver, bank, and resume slices

## Goal

`/shape` resumes exactly one active, blocked, unbanked, ready, or locally
complete action; delivers one slice through tracer-bullet TDD, independent
review, integrated dogfood, checks, evidence, and banking; then advances
serially without unauthorized remote or destructive actions.

## Pitch trace

- [Coordinator ledger](../pitch.md#coordinator-ledger)
- [Build loop](../pitch.md#build-loop)
- [Banking and shipping](../pitch.md#banking-and-shipping)
- [Effective use of Pi tools](../pitch.md#effective-use-of-pi-tools)
- [Deterministic helper boundary](../pitch.md#deterministic-helper-boundary)
- **AC-011**, **AC-012**, **AC-013**, **AC-014**, **AC-015**, **AC-016**, and
  **AC-017**, while preserving all earlier accepted behavior

## Observable outcome

A new session can resume an interrupted active slice, a recorded blocker, or the
first unbanked done slice. A slice closes only with all bounded evidence and a
verified commit/checkpoint. After every slice is done/cut and banked, `/shape`
reports local completion and waits for separately authorized shipping.

## Dependencies and predecessor postconditions

Depends on slice 004. The accepted pitch hash matches; a fresh whole-set reviewer
approved numbered plans; files and ledger agree; pending plan refinement rules
are enforced.

## Scope

- Add building guidance for one sole writer, repeated one-public-seam failing
  test → observed Red → minimum Green cycles, bounded refactor while green,
  fresh read-only review/fix/re-review, integrated user/operator dogfood,
  repository checks, evidence, and banking.
- Add helper transitions for `pending → active|cut`, `active ↔ blocked`, and
  `active|blocked → done`, with dependencies, exactly one active-or-blocked
  slice, bounded blocker details, accepted-hash immutability, and atomic writes.
- Require `red_green`, `review`, `dogfood`, `checks`, and `banking` evidence for
  done. `red_green` also records that bounded slice refactoring remained green.
  Derive first-unbanked recovery before blocked/active/pending work, validate
  `Feature-Slice: <id>` commits, accept bounded policy checkpoints, and derive
  local completion.
- Keep Todo a session projection. Do not add a scheduler, event log, provider
  routing, parallel implementation worktrees, automatic push/PR/merge/deploy,
  destructive cleanup, or final human approval.

## Public seam and first TDD tracer

**Seam:** `/shape` resume status, helper slice transitions, `index.json`, and Git
history.

**Independent expectation:** actual Git history and the accepted precedence
table choose the recovery target.

Create one failing fixture with an earlier done slice declaring `banking: commit`
but no matching clean trailer commit, a later blocked slice, and a ready pending
slice. Assert inspection selects only the earlier banking recovery. Implement
the minimum precedence/lookup behavior. Create the matching commit independently
and assert the blocker becomes next. Also assert the banked subject is a valid
Conventional Commit, its `Feature-Slice` trailer matches, and no commit SHA is
stored in the ledger. Add active resume, evidence gates, checkpoint,
multi-unbanked, locally complete, and failure/rollback cases one tracer at a
time.

## Validation

- Focused transition/evidence/Git/helper tests after each tracer.
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- Deterministic Pi source discovery and idle reload.
- Package dry-run and source/packed/RPC smoke through `npm run check`.
- `npm run smoke:source`, `npm run packages:check`, and
  `npm run security:check` for final feature acceptance.
- Final diff and banking-state inspection.

## Dogfood and QA

After reload, use `/shape` on a disposable accepted feature with two small
slices. Interrupt the first while active and resume it in a new session; close
it only after observable Red/Green, a bounded refactor that remains green,
blocker-free review, integrated operator use, checks, ledger evidence, and a
valid Conventional Commit with the trailer. Exercise blocked resume and
unbanked recovery, then complete/cut the second and confirm `locally complete`
performs no remote or destructive action. Run the core rubrics on the bounded
model matrix without storing provider output.

## Risks and escalation

- Evidence summaries must stay bounded and omit credentials/provider output.
- Rewritten Git history can invalidate banking; recover the first unbanked slice
  before any current or pending work.
- Repository policy may forbid commits; record a bounded checkpoint reason
  rather than inventing authorization.
- A pitch-level discovery stops Build and invokes archive/repitch.

## Done when

All transition, evidence, recovery, ordinary failure/rollback, atomic-write,
bounds, and Git-history tests pass; no slice advances before banking;
deterministic Pi
load/reload and full repository checks pass; fresh review is blocker-free; the
current feature ledger evidence is concise; and `/shape` reports local
completion while preserving remote/destructive authorization boundaries.
