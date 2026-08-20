---
status: accepted
---

# Plan: Give question content two-thirds of wide layouts

This delivery plan covers the accepted intent: at terminal widths of 100 columns or more, the question overlay keeps options or review answers in a persistent left rail that uses one-third of the available column area. The right content area uses the remaining two-thirds for an attached document, the focused option preview, or blank space. Narrower layouts keep the existing stacked behavior.

## Execution mode

**Checkpointed implementation.** Pause after the slice proof and at the fixed review boundary before publication. Approval of this plan authorizes only branch `feat/question-content-layout` and the bounded delivery unit below. It does not authorize merge, release, deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Branch                         | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                        |
| ------------- | ------------------------------ | ----------------- | --------------- | ------------ | ---------------------------------------------------------- |
| 1             | `feat/question-content-layout` | `main`            | `001`           | none         | serial parent lane; current isolated worktree; sole writer |

The plan and implementation share one review, validation, and publication boundary because the geometry helper, dialog behavior, tests, and user documentation form one small observable outcome. One branch and one pull request are sufficient; no stack is planned.

The sibling worktree `feat/question-mermaid-documents` has uncommitted changes in overlapping question-package files. It is not a dependency and must not be combined with this worktree. If that branch merges first, rebase this branch and rerun all invalidated question-layout and repository checks before publication.

## Critical path, dependencies, and lanes

The only active lane is serial: establish exact geometry and public TUI failures, change the shared column boundary, apply it consistently to document, preview, empty-content, and review views, update user documentation, then validate the package and repository. Parallel writing is not justified because `layout.ts`, `dialog.ts`, and the same question tests are shared integration points.

Critical-path forecast:

- Active lanes: one serial implementation lane in the current linked worktree.
- Delivery units and pull requests: one delivery unit and one pull request based on `main`.
- Integration points: `columnWidths()` in `packages/question/src/layout.ts`, wide-body composition in `QuestionDialog`, and the 100-column responsive breakpoint.
- Expensive gates: deterministic interactive Pi acceptance and `npm run check`.
- Likely cascade cost: low within this branch; medium if the overlapping Mermaid branch lands first because a rebase may touch `dialog.ts`, question tests, and the README.

Invalidation map:

- A change to ratio arithmetic invalidates exact `columnWidths()` proofs, joined-column bounds, and every wide-layout assertion.
- A change to wide question composition invalidates document, focused-preview, no-preview, editor-mode, and focus-row proofs.
- A change to review composition invalidates multi-question final-review and submit-focus proofs.
- A change to the 100-column breakpoint invalidates both 99-column stacked and 100-column side-by-side proofs.
- Any final production or documentation edit invalidates the focused question tests, question typecheck, source smoke, manual `/reload` acceptance, and `npm run check` evidence as applicable.
- A rebase across the Mermaid branch invalidates all question-package proof because the branches overlap in production, tests, and documentation.

Pause and report a forecast variance if the persistent rail requires a schema or Pi TUI API change, if readable controls cannot fit in one-third at the current breakpoint, or if the work must be split into another delivery unit.

## [ ] 001 — Keep controls in one-third and content in two-thirds

### Outcome and requirement trace

At 100 terminal columns or more:

- options and their answer controls occupy the left one-third of the width available after the two-column gap;
- attached documents occupy the right two-thirds;
- without a document, a focused option preview occupies the right two-thirds;
- without a document or focused preview, the right content area remains blank instead of expanding the options;
- the final review keeps answer and submit controls in the left rail with a blank right content area;
- the right column receives any remainder so content is never narrower because of integer rounding.

At 99 columns or fewer, previews and documents keep the existing stacked layout. Selection, editing, scrolling, focus, clipping, and fixed full-overlay painting remain unchanged.

This traces the accepted request for a consistent one-third options/answers and two-thirds content split, including the clarified **Preview or blank** behavior when no document is attached.

### Seam and files

Current module boundaries:

- `packages/question/src/layout.ts` owns the side-by-side breakpoint, column geometry, and bounded column joining.
- `packages/question/src/dialog.ts` decides whether a question shows a document, focused preview, blank content area, or final review.
- `packages/question/test/question.test.ts` and `packages/question/test/regressions.test.ts` exercise exported geometry and public `QuestionDialog.render()` behavior.

Proposed deepening:

- Keep ratio arithmetic in the existing `columnWidths(width)` seam. For wide layouts, divide `width - gap` with `left = floor(available / 3)` and give the remainder to `right`.
- Keep `joinColumns()` as the single bounded composition seam.
- Make `QuestionDialog` use the wide two-column composition whenever the 100-column breakpoint is active, not only when a document or focused preview exists. Supply document rows, preview rows, or an empty right column without adding a new schema option or layout mode.
- Apply the same left-rail composition to the final review body.

Likely files:

- `packages/question/src/layout.ts`
- `packages/question/src/dialog.ts`
- `packages/question/test/question.test.ts`
- `packages/question/test/regressions.test.ts`
- `packages/question/README.md`
- `docs/features/question-content-layout/plan.md`

No dependency, manifest, tool-schema, continuation, RPC, or non-interactive result changes are planned.

### Dependencies

No prior slice. The behavior depends on the existing `PREVIEW_MIN_WIDTH = 100`, `columnWidths()`, `joinColumns()`, and `QuestionDialog.render()` contracts. It has no behavioral dependency on the Mermaid branch.

### Execution lane and ownership

`serial`. The parent is the sole writer in the current linked worktree. No other lane may edit the listed question-package files or this plan during the slice. The sibling Mermaid worktree remains isolated and is not an implementation lane for this plan.

### Red proof

Add the smallest deterministic failing tests before production changes:

1. Extend the exported geometry proof so `columnWidths(100)` equals `{ left: 32, right: 66, gap: 2 }` and another non-divisible wide width proves the right column receives the remainder. The current 42/58 calculation must fail this test.
2. Render a wide question with an attached document and prove option text is constrained to the left width while document content starts after the gap and can use the larger right width.
3. Render a wide question without a document twice: with a focused preview, prove the preview uses the right content area; without a preview, prove long option text still wraps inside the left third and the right area stays blank.
4. Render a multi-question final review at a wide width and prove answers and submit controls remain in the left third with a blank right area.
5. Preserve a 99-column regression proving the same cases remain stacked and use the available width rather than reserving a horizontal rail.

Tests must use visible terminal width and public render output rather than private state or implementation-specific call counts.

### Green proof and checks

After the minimum implementation, run in order:

1. `npm test -- --run packages/question/test/question.test.ts packages/question/test/regressions.test.ts`
2. `npm --workspace @mopeyjellyfish/pi-question run typecheck`
3. `npm run smoke:source`
4. Start deterministic Pi from this worktree with `npm exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e packages/question`. At widths below and above 100 columns, exercise a question with a document, a focused option preview, no content, and a multi-question review. Confirm the 1/3–2/3 split, stacked fallback, readable controls, focus, selection, editing, and document scrolling. Enter `/reload` while Pi is idle and repeat the changed interaction without duplicate registration or stale layout.
5. `npm run check`
6. `git diff --check` and final status inspection for package boundaries, staged files, and runtime artifacts.

Evidence reuse follows the invalidation map. The manual acceptance records terminal dimensions because automated output can prove column placement but not the terminal emulator's visual readability.

### Atomic commit and pull request

Create one behavior-owned Conventional Commit after the complete red/green proof, documentation, manual checkpoint, and fixed review are coherent. Proposed subject: `feat(pi-question): widen question content pane`.

This commit belongs to delivery unit 1. Publish one pull request from `feat/question-content-layout` to `main` only after checkpoint approval. If the Mermaid branch merges first, rebase rather than merge and rerun the invalidated checks before publication.

### Done when

- Exact geometry gives one-third of post-gap width to the left rail and the remainder to the right content area.
- Document, focused-preview, blank-content, and final-review views use the same wide left rail.
- Widths below 100 columns retain the current stacked behavior.
- Options, answer controls, editors, focus, selection, clipping, document navigation, and fixed-width painting have no regression.
- The README describes the persistent wide layout and stacked fallback.
- Focused tests, question typecheck, source smoke, manual `/reload` acceptance, `npm run check`, and `git diff --check` pass against the final worktree.
- A fixed-diff review reports no unresolved blocking findings.
- The slice checkpoint is presented before commit or publication.
