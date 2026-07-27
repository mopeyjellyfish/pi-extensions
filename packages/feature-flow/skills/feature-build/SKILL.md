---
name: feature-build
description: Deliver a complete reviewed feature plan serially through TDD, fresh review, and bounded acceptance evidence.
---

# Feature build

Build only a complete helper-validated reviewed plan set. Read repository
instructions, the accepted pitch, reviewed plans, and this package's
`../../references/artifact-contract.md`,
`../../references/orchestration-contract.md`, and
`references/build-contract.md`. The helper owns deterministic facts; parent
reasoning owns implementation and review judgments.

## Fail-closed readiness and routing

Before Worktrunk, todo, implementation reasoning, or delegation:

1. Preflight every required capability: compatible `subagent` and
   `subagent_wait`; builtin `worker` and builtin `reviewer`; `question`,
   Worktrunk `worktree`, and `todo`; and any LSP or web companion required by a
   reviewed plan. Fail closed with named installation or setup guidance.
2. Run
   `node ../../scripts/feature-flow.mjs status <pitch-path> <plans-dir>`.
3. Run
   `node ../../scripts/feature-flow.mjs validate-plans <pitch-path> <plans-dir>`.

Require an accepted pitch and complete blocker-free reviewed direct-serial plan
set. Treat helper output as bounded facts, not semantic readiness. On either
failure, stop exactly as the build contract requires; do not ask a model to
reconstruct a result.

Create or activate the authorized Worktrunk route. Verify `pwd` and the Git
top-level agree with the active target path. From that routed cwd, before todo,
implementation reasoning, or writer work, rerun
`node ../../scripts/feature-flow.mjs status <pitch-path> <plans-dir>` and then
`node ../../scripts/feature-flow.mjs validate-plans <pitch-path> <plans-dir>`
with both processes' cwd set to the target worktree. Stop on divergence or
failure.

Project the reviewed slice order into `todo`; todo is only a session view. Keep
at most one `in_progress` item. Classify current-code assumptions, unrelated Git
changes, capability applicability, and possible pitch-level issues in parent
reasoning. Preserve unrelated work. Do not recalculate helper-owned readiness,
dependencies, or AC coverage.

## Deliver one slice

For each next dependency-ready slice in the helper-returned serial order:

1. Mark only that todo item active. Record its direct readiness from the routed
   helper result and predecessor's blocker-free completion evidence.
2. Launch one fresh implementation worker using the build contract's one-item
   protocol. Give it repository instructions, the accepted pitch, only the
   reviewed slice, predecessor evidence, explicit routed cwd, and no authority
   to decide pitch questions. Require exact Red → smallest Green → bounded
   Refactor: an observable Red before production edits, the focused command
   green, Refactor only while green, semantic discovery and LSP validation when
   applicable, and a final focused test and diff inspection.
3. Cross the same-run terminal barrier. Retain bounded Red, Green, Refactor,
   diagnostics, focused-test, and diff evidence plus changed files. If an
   optional semantic tool is inapplicable, parent records why.
4. Launch one fresh adversarial reviewer after the worker terminates. Give the
   reviewer the current accepted pitch, reviewed slice, routed diff, and bounded
   evidence. It is read-only and judges scope, correctness, tests, repository
   compliance, invalid code assumptions, implementation choices, review
   blockers, and whether findings may be pitch-level.
5. Cross the reviewer's terminal barrier. For routine blockers, launch exactly
   one fresh serial fix worker, cross its terminal barrier, rerun affected
   diagnostics and focused checks, then obtain another fresh adversarial review.
   Repeat one writer and one review at a time until blocker-free.
6. Close the todo item only after a fresh blocker-free result, then advance to
   the next dependency-ready slice. Never overlap writers.

A helper result never substitutes for implementation or review judgment.

## Findings that invalidate plans or pitch

For a plan-semantic finding, stop implementation, run
`node ../../scripts/feature-flow.mjs plans <pitch-path> <plans-dir> draft --revise <changed-plan-path> ...`,
apply the established feature-plan fix path, rerun deterministic validation and
automated whole-set review, and restore reviewed status before rebuilding from
the newly valid serial order.

Stop the build only for a parent-classified new pitch-level decision and ask it
through `question`. If the answer changes content, run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> draft --revise`, repeat
complete pitch review and human acceptance, and regenerate the complete plan
set. If the accepted pitch is unchanged, record bounded parent evidence and
resume the paused same plan order. Children report possible pitch-level
findings; they never answer or classify them finally.

## Final verification and completion

After every slice is blocker-free, validate in this order from the target
worktree:

1. Start deterministic Pi with discovery disabled and explicit feature-flow and
   required companion resources. Confirm all three skills appear exactly once.
2. Run the focused test before an idle `/reload`.
3. Perform the idle `/reload`, then Exercise the changed skill in one bounded
   disposable Git repository whose one `node:test` slice must show Red then
   Green and explicitly forbids commits. Keep the repository for later human
   evidence review; do not destructively remove it.
4. Run `npm run smoke:source`.
5. Run `npm run packages:check`.
6. Run `npm run check` and every repository-required change-specific check.
7. Run `npm run security:check`.
8. Produce bounded AC-by-AC evidence covering changed files, commands and
   results, TDD and diagnostic evidence, review findings, residual risks,
   Worktrunk path, staged files, and final source-control status.
9. Only then perform a pre-authorized source-control action. Without prior
   authorization, leave an unstaged or staged-as-found, uncommitted reviewed
   ready diff and report it; do not stage, commit, push, merge, open a pull
   request, publish, clean, or remove a worktree.

Do not write build evidence into the pitch or reviewed plans, add persistent
workflow state, or ask for final feature acceptance.
