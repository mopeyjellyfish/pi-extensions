---
status: accepted
---

# Plan: Ask structured questions inline

Complete this delivery plan before implementation. It covers the accepted caller-selected question presentation, compact TUI behavior, compatibility, formal review guidance, and final verification.

## Execution mode

**Accept-all implementation.** Whole-plan approval confirms accept-all authority only for this named plan on branch `feat/question-inline-mode`. A material forecast variance returns control to the human. Fresh approval is required when delivery boundaries or authority change. This authority never includes merge, release, deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Branch                      | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                        |
| ------------- | --------------------------- | ----------------- | --------------- | ------------ | ---------------------------------------------------------- |
| 1             | `feat/question-inline-mode` | `main`            | `001`           | none         | serial parent lane; current isolated worktree; sole writer |

One delivery unit, branch, and pull request are sufficient. The question interface, TUI adapter selection, shared dialog implementation, formal review guidance, tests, and documentation produce one user outcome and cannot be validated independently. The accepted pitch and this plan share the implementation delivery unit's publication; they have no independent pull-request value.

## Critical path, dependencies, and lanes

The only implementation lane is serial: add model-facing presentation and validation proof, establish the compact TUI failure, route the two TUI adapters through the existing dialog module, preserve non-TUI behavior, update agent guidance and package documentation, then validate the stable delivery unit. Parallel writers would overlap `index.ts`, `dialog.ts`, question tests, and feature-flow guidance, so they are not justified.

Critical-path forecast:

- Active lanes: one serial implementation lane in the current linked worktree.
- Delivery units and pull requests: one delivery unit and one pull request based on `main`; no stack and no CI fan-out.
- Integration points: `QuestionParameters` and `QuestionInput`, `question` tool execution, Pi's editor-position and overlay `ctx.ui.custom()` adapters, the shared `QuestionDialog` module, and Shape/planning approval guidance.
- Expensive gates: deterministic interactive Pi acceptance with `/reload`, `npm run smoke:source`, and `npm run check`.
- Likely cascade cost: low. The new optional field defaults to the current adapter, and inline presentation changes only TUI layout policy.

Invalidation map:

- A schema, validation, or tool-description change invalidates contract compilation tests, model guidance assertions, RPC compatibility proof, JSON/print proof, and question typecheck.
- A TUI adapter-routing change invalidates custom-options assertions, default full-screen proof, inline editor-position proof, abort behavior, and manual TUI acceptance.
- A dialog row-policy or rendering change invalidates inline row-count, clipping, focus, width, editor/IME, multi-question review, and full-screen regression proof.
- A Shape or planning guidance change invalidates feature-flow resource tests and manual approval-gate inspection.
- Any final production or documentation edit invalidates the focused package tests, source smoke, manual `/reload` acceptance, `npm run check`, and final diff inspection as applicable.

Return control to the human for a material forecast variance, including a required Pi core change, an inability to preserve shared dialog semantics, a need to accept inline documents, or a new delivery unit. Fresh approval is required if those findings change accepted boundaries or authority.

## [x] 001 — Choose a contextual inline or formal full-screen question

### Outcome and requirement trace

A caller can set `presentation: "inline"` to ask one to four structured questions below the visible transcript or use `presentation: "fullscreen"` for the existing capturing overlay. Omitting the field remains full-screen. Both presentations use the same questionnaire state and result behavior. Inline questions stay compact while preserving focused controls, selection, text editing, redirection, cancellation, and final review. Attached documents and formal pitch/plan approvals remain full-screen.

Requirements: AC-001 through AC-009.

### Seam and files

Current module interfaces and seams:

- `packages/question/src/schema.ts` and `packages/question/src/types.ts` own the small model-facing question interface.
- `packages/question/src/index.ts` owns the public `question` tool and currently selects one full-screen TUI adapter, the RPC adapter, or unavailable non-interactive behavior.
- `packages/question/src/dialog.ts` is the deep questionnaire module: one `QuestionDialog` interface hides navigation, state transitions, editing, document rendering, focus, clipping, and submission behavior. Its injected row-budget seam already lets callers vary viewport geometry without forking behavior.
- `packages/question/src/state.ts`, `results.ts`, and `rpc.ts` remain authoritative for state, results, continuation, and RPC behavior and should not gain presentation branches.

Proposed deepening:

- Add `QuestionPresentation = "fullscreen" | "inline"` and an optional `presentation` field at the existing public interface. Use provider-compatible `StringEnum` in the schema. Treat omission as `fullscreen` at the TUI adapter seam.
- Keep one `QuestionDialog` implementation. Extend its layout configuration only enough to distinguish fixed full-screen painting from compact inline painting. Full-screen keeps terminal-row padding; inline uses a focus-aware row budget capped at 14 rows and approximately 60% of available terminal rows, never exceeding the terminal.
- In `index.ts`, retain the full-screen `ctx.ui.custom(..., { overlay: true, ... })` adapter and add an editor-position `ctx.ui.custom(...)` adapter with no overlay options. Both construct the same dialog module with different row and padding policies.
- Reject `presentation: "inline"` plus any attached document during semantic validation with guidance to use `fullscreen`. Do not silently drop content or rewrite presentation.
- Ignore presentation in RPC because RPC already has its own sequential adapter. JSON and print remain unavailable before continuation lookup.

Likely implementation and proof files:

- `packages/question/src/types.ts`
- `packages/question/src/schema.ts`
- `packages/question/src/index.ts`
- `packages/question/src/dialog.ts`
- `packages/question/test/question.test.ts`
- `packages/question/test/regressions.test.ts` or `packages/question/test/final-regressions.test.ts` only where focused regression proof fits
- `packages/question/README.md`
- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/test/resources.test.ts`
- `docs/features/question-inline-mode/plan.md`

No dependency, manifest, release metadata, continuation snapshot, state-machine, result-details, or RPC protocol changes are planned.

### Dependencies

No prior implementation slice. This slice depends on the accepted pitch, Pi 0.84.0's documented `ctx.ui.custom()` editor-replacement and overlay contracts, the existing row-budget injection seam, and the current package tests.

### Execution lane and ownership

`serial`. The parent is the sole writer in the current `feat/question-inline-mode` linked worktree. No other lane may edit the listed question package, feature-flow guidance, tests, or feature documents during implementation.

### Red proof

Add the smallest deterministic failing tests before production changes:

1. Compile `QuestionParameters` with `presentation: "inline"` and `"fullscreen"`, reject unknown values, and prove omission remains valid. Add semantic failure proof for inline questions with an attached document and require actionable `fullscreen` guidance.
2. Execute a default and explicit full-screen TUI question and prove both pass the existing full-screen overlay options and render to the terminal row count.
3. Execute an inline TUI question and prove `ctx.ui.custom()` receives no overlay options, the rendered component uses fewer than the terminal's rows within the compact policy, and every line stays within the supplied width.
4. Drive the public inline dialog through multiple questions including one single-select answer, one multi-select answer, tab/review navigation, custom or note editing, redirection/cancellation as focused cases, and submission. Prove result details match the existing full-screen semantics rather than a second state implementation.
5. Exercise long wrapped content and editor input in the compact viewport. Prove focus-aware clipping retains the focused row, sticky hints, and IME cursor while full-screen row padding and document scrolling remain unchanged.
6. Execute inline presentation in RPC and prove it retains the existing sequential adapter. Preserve JSON/print unavailable and continuation-before-UI regressions.
7. Add feature-flow resource assertions that complete pitch and plan document approvals use full-screen presentation when supported and fall back by omission when the field is unavailable.

The intended pre-implementation failures are schema rejection of the new field, lack of editor-position adapter selection, terminal-height rendering for a non-overlay component, absent inline-document validation, and absent full-screen approval guidance.

### Green proof and checks

After the minimum implementation, run in order:

1. `npm test -- --run packages/question/test/question.test.ts packages/question/test/regressions.test.ts packages/question/test/final-regressions.test.ts`
2. `npm --workspace @mopeyjellyfish/pi-feature-flow test`
3. `npm --workspace @mopeyjellyfish/pi-question run typecheck`
4. `npm run smoke:source`
5. Start deterministic Pi from this worktree with `npm exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e .`. Confirm one question tool and both feature-flow skills load without conflicts. Ask an inline multi-question questionnaire after visible contextual instructions and verify that the instructions remain visible, choices and multi-select work, review submits, editing retains focus, and cancellation returns normally. Ask an omitted-presentation document question and verify the existing full-screen viewer and scrolling. Enter `/reload` while Pi is idle and repeat both presentations without duplicate registration, stale state, focus loss, or layout regression.
6. `npm run check`
7. `git diff --check`, package-boundary inspection, staged-file inspection, and runtime-artifact inspection.

Evidence may be reused only while its covered surface remains unchanged according to the invalidation map. Manual acceptance records terminal dimensions because automated output can prove adapter options and rendered rows but not transcript visibility and terminal focus behavior end to end.

### Atomic commit and pull request

The slice remains in delivery unit 1 and one pull request based on `main`. Use coherent commits inside that delivery unit:

1. `feat(pi-question): add inline question presentation` for the public interface, TUI adapters, shared dialog behavior, package tests, and README.
2. `docs(pi-feature-flow): keep approval questions fullscreen` for portable Shape/planning guidance and its resource tests.

The already accepted pitch and the approved plan remain earlier documentation commits on the same branch. Do not publish until implementation, fixed review, and final required checks are complete.

### Done when

- `inline`, `fullscreen`, and omitted presentation satisfy AC-001 and AC-002 through public tool execution proof.
- Inline one-to-four-question, single-select, multi-select, review, editing, redirection, cancellation, result, and compact rendering behavior satisfies AC-003 and AC-004 without duplicating state logic.
- Default full-screen documents and formal pitch/plan approval guidance satisfy AC-005; inline documents fail explicitly as required by AC-006.
- RPC, JSON, print, continuation, cancellation, output bounds, and existing full-screen rendering satisfy AC-007.
- Schema descriptions, tool guidance, Shape/planning guidance, and the README satisfy AC-008.
- Focused tests, feature-flow tests, question typecheck, source smoke, deterministic manual TUI and `/reload` acceptance, `npm run check`, and final diff hygiene satisfy AC-009 against the final worktree.
- A fixed-diff review reports no unresolved blocking findings, and no material forecast variance remains undisclosed.
