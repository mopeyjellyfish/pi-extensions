---
status: accepted
---

# Plan: Smooth rendered question documents

Complete this delivery plan before implementation. It covers the accepted pitch in one end-to-end vertical slice and one stable delivery unit.

## Execution mode

**Checkpointed implementation.** Pause at the slice checkpoint and fixed review boundary before publication. Approval of this plan authorizes only the named branch and delivery unit. It does not authorize merge, release, deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Branch                            | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                        |
| ------------- | --------------------------------- | ----------------- | --------------- | ------------ | ---------------------------------------------------------- |
| 1             | `feat/question-rendered-markdown` | `main`            | `001`           | none         | serial parent lane; current isolated worktree; sole writer |

Pitch and plan documents share the implementation unit's review, validation, and publication boundary. The unit produces one pull request because the question viewer behavior and approval-document guidance form one user outcome and have no independent merge value.

## Critical path, dependencies, and lanes

The only active lane is serial: establish failing public rendering and TUI-integration proof, implement the stable Markdown document modal, update approval guidance and user documentation, then validate the integrated package behavior. No parallel writer is justified because the dialog, extension registration, tests, and feature-flow contract converge on one public interaction.

The forecast is one delivery unit, one branch, one pull request, one fixed review, and no stack or cascade cost. Integration points are Pi's pinned `ctx.ui.custom()` overlay contract, the `QuestionDialog` component, and Shape/planning skill calls. The expensive final gate is `npm run check`; interactive acceptance also requires the deterministic Pi source session and `/reload` loop.

Invalidation map:

- Changes to Markdown or raw-format rendering invalidate focused format assertions and the question workspace test.
- Changes to viewport sizing, padding, focus, or repaint logic invalidate scroll-sequence, row-width, row-count, and TUI custom-option assertions.
- Changes to Shape or planning wording invalidate feature-flow resource tests.
- Any final production or documentation edit invalidates the affected focused check, `npm run smoke:source`, and `npm run check` evidence.
- Dependency, package-manifest, or workflow changes would add security or workflow gates; none are planned.

Pause and return for re-shaping if the package-local overlay and component seams cannot prevent the observed artifacts without changing Pi core or `@earendil-works/pi-tui`.

## [x] 001 — Review a rendered document in a stable question modal

### Outcome and requirement trace

A user opening a pitch, plan, or other `format: "md"` question document sees formatted Markdown with highlighted fenced code and can scroll it without dialog geometry changes, stale rows, or content behind the modal showing through. Explicit raw formats retain syntax highlighting or plain-text display. Shape and planning calls reliably declare approval documents as Markdown.

Requirements: AC-001 through AC-008.

### Seam and files

Public seams:

- `question` tool TUI execution through `ctx.ui.custom()` in `packages/question/src/index.ts`.
- `QuestionDialog.render()` and document navigation in `packages/question/src/dialog.ts`.
- Width, clipping, and fixed-row helpers in `packages/question/src/layout.ts` if a small reusable helper is required.
- Shape and planning approval presentation contracts in `packages/feature-flow/skills/shape/SKILL.md` and `packages/feature-flow/skills/planning-changes/SKILL.md`.

Likely proof and documentation files:

- `packages/question/test/question.test.ts`
- `packages/question/test/regressions.test.ts` or `packages/question/test/final-regressions.test.ts`, only where the focused behavior fits the existing suites
- `packages/question/README.md`
- `packages/feature-flow/test/resources.test.ts`
- `packages/feature-flow/README.md` only if its public workflow description needs the new explicit format guarantee
- `docs/features/question-document-rendering/plan.md`

Implementation direction from pinned API evidence:

- Present the TUI question as a capturing overlay rather than replacing the editor with a terminal-height component. Use responsive overlay options and a matching dialog row budget so the overlay never clips sticky controls.
- Keep `Markdown` as the `md` renderer; it already parses Markdown, highlights fenced code, caches by text and width, and pads rendered lines.
- Keep `highlightCode()` for declared structured raw formats.
- Make the document viewport return its full allocated row count and make final dialog rows occupy the full overlay width. This gives Pi's differential overlay compositor an opaque, stable rectangle while it replaces only changed rows.
- Preserve the existing document cache across scroll input. Request a render only when navigation changes focus or offset; do not force `requestRender(true)`.

### Dependencies

No prior slice. Depends only on the accepted pitch, the repository's pinned Pi 0.84.0 TUI contracts, and the existing question document schema.

### Execution lane and ownership

`serial`. The parent is sole writer in the current `feat/question-rendered-markdown` worktree. No other lane may edit the question package, feature-flow approval contracts, or these feature documents during the slice.

### Red proof

Add the smallest failing tests before production changes:

1. A TUI tool execution test captures the second argument to `ctx.ui.custom()` and proves the question is requested as a capturing overlay with a bounded responsive viewport instead of replacing the editor.
2. A representative pitch/plan Markdown document proves rendered headings, lists, emphasis, links, and fenced code do not expose raw Markdown control markers and retain styled code output.
3. A repeated line/page/Home/End scroll sequence proves constant dialog row count, full-width rows, sticky heading/hints/borders, unchanged selection state, one render request per effective navigation change, and no document rerender at unchanged width.
4. Raw `txt`, YAML, JSON, and XML cases prove they remain raw or syntax highlighted rather than entering the Markdown path.
5. Feature-flow resource tests require Shape and planning approval questions to attach the complete document with `format: "md"` when the document field is available.

The intended pre-implementation failure is the overlay contract and stable opaque viewport proof; existing basic content assertions may already pass and must not be misreported as red evidence.

### Green proof and checks

Run in order after the minimum implementation:

1. `npm test -- --run packages/question/test/question.test.ts packages/question/test/regressions.test.ts packages/question/test/final-regressions.test.ts`
2. `npm --workspace @mopeyjellyfish/pi-feature-flow test`
3. `npm --workspace @mopeyjellyfish/pi-question run typecheck`
4. `npm run smoke:source`
5. Deterministic interactive acceptance from this worktree with `npm exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e .`: confirm one question tool and both feature-flow skills load, run the focused automated test, open a large Markdown document containing fenced code, exercise line/page/Home/End scrolling, enter `/reload` while idle, and repeat the changed interaction without duplicate registrations, clipping, flicker, stale content, or focus loss.
6. `npm run check`

Record the terminal and viewport used for the manual flicker check because unit tests can prove stable component output but cannot fully prove a terminal emulator's visual repaint. Any edit after a check invalidates that check according to the invalidation map.

### Atomic commit and pull request

Create one behavior-owned Conventional Commit in delivery unit 1 after the red/green proof and required documentation are coherent. Proposed subject: `fix(pi-question): stabilize rendered document reviews`. The accepted pitch commit remains earlier on the same branch. Publish both through one pull request based on `main` only after fixed review and checkpoint approval.

### Done when

- All AC-001 through AC-008 have direct automated or recorded manual evidence.
- The question viewer uses Pi's declared-format renderers and a stable capturing modal without full-terminal clears or per-scroll reparsing.
- Pitch and plan approval guidance explicitly uses `document.format: "md"`.
- Focused tests, source smoke, manual reload acceptance, and `npm run check` pass against the final worktree.
- A fixed-diff review reports no unresolved blocking findings.
- The slice checkpoint is presented before any publication action.
