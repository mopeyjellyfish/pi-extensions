---
status: accepted
---

# Shape: Smooth rendered question documents

## Problem and evidence

Large pitch and plan documents shown by the `question` tool are harder to review than they should be. Markdown may appear raw or insufficiently distinguished from raw text, and scrolling can flicker both the document and the content behind the dialog. This interrupts reading at the approval gate where users need the clearest view.

The question package already accepts a typed document format, uses Pi's Markdown renderer for `md`, and uses Pi's syntax highlighter for structured text. It also caches rendered document rows. The missing product guarantee is a tested, stable presentation contract: review documents must visibly render according to their declared format, Markdown code fences must retain syntax highlighting, and scrolling must repaint a fixed viewport without exposing stale or underlying content.

## Proposed solution

Strengthen the question document viewer as one vertical behavior slice:

- Treat `document.format` as the authoritative display mode. Render `md` as formatted Markdown by default, including headings, lists, emphasis, links, and fenced code. Keep raw display only for explicitly raw formats.
- Preserve syntax highlighting for fenced code inside rendered Markdown and for supported non-Markdown structured formats.
- Keep the dialog and document viewport geometry stable while line, page, Home, and End scrolling changes only the visible document window.
- Reuse parsed/rendered document rows while scrolling and issue only the repaint needed for each state change.
- Paint every viewport row consistently so shorter or changed lines cannot reveal stale dialog content or flickering content from behind the dialog.
- Add focused rendering and scroll regression proof, then document the visible behavior and controls.

This pitch and its plan share the implementation delivery unit. They do not need independent review or merge value before implementation. The default topology is one branch and one pull request for the question package change plus its feature documents.

## Boundaries and no-gos

- Scope is the `@mopeyjellyfish/pi-question` TUI document viewer and the feature-flow guidance needed to ensure pitch and plan approvals attach documents as `format: "md"`.
- Preserve the existing `question` tool schema, continuation behavior, option selection, responsive layout, bounds, RPC fallback, and non-interactive results.
- Do not infer Markdown from filenames or content; callers must declare `format: "md"`.
- Do not add a second Markdown parser, syntax-highlighting dependency, terminal animation framework, or repository-specific pitch/plan behavior to the production extension.
- Do not convert explicitly raw `txt`, YAML, JSON, or XML documents into rendered Markdown.
- Do not solve flicker by truncating large documents, disabling line scrolling, clearing the full terminal on every keypress, or rebuilding the full parsed document on every scroll event.
- Re-shape if stable rendering requires a Pi core or `pi-tui` API change rather than a package-local correction.

## Decision-changing research and risks

- Pi's pinned TUI `Markdown` component already renders Markdown with syntax-highlighted code fences, so the extension should deepen that existing seam rather than replace it.
- The current viewer caches rendered rows by document and width, which is the correct base for smooth scrolling. Regression proof must distinguish content rendering from viewport repaint behavior so tests do not merely assert that plain heading text exists.
- Terminal flicker can be caused by unstable row counts, incomplete row painting, or unnecessary full redraws. The implementation plan must identify the observed package-local cause before selecting an overlay or repaint strategy.
- Overlay behavior is not assumed. Moving the dialog into an overlay would change layout and focus semantics and is only justified if focused evidence shows that it is required for stable painting.

## Authority

The parent owns the package-local rendering design, test seams, and the choice of the smallest Pi TUI mechanism that satisfies the accepted criteria. Approval authorizes bounded work on branch `feat/question-rendered-markdown`, its atomic commits, and later publication as one pull request after the complete plan is approved.

Execution mode is **checkpointed implementation**. Approval does not authorize merge, release, deployment, destructive cleanup, unrelated remote changes, or a Pi core dependency change.

## Observable acceptance criteria

- **AC-001 — Render review Markdown:** A question document declared with `format: "md"` presents Markdown structure as formatted terminal output rather than literal Markdown markers, including representative pitch and plan headings, lists, emphasis, and links.
- **AC-002 — Highlight code correctly:** Fenced code inside a Markdown document uses Pi's syntax-highlighted Markdown rendering, while supported raw structured formats continue to use Pi's syntax highlighter.
- **AC-003 — Scroll a stable viewport:** Line, page, Home, and End navigation update the visible document window while dialog dimensions, sticky controls, option state, and document focus remain stable.
- **AC-004 — Prevent scroll flicker artifacts:** Repeated scrolling keeps every dialog viewport row painted consistently, with no stale row fragments or visible content from behind the dialog where the document previously occupied space.
- **AC-005 — Avoid unnecessary document work:** Scrolling a document at an unchanged width reuses its rendered rows and triggers one bounded render request per accepted navigation input rather than reparsing the full document or forcing a full-terminal clear.
- **AC-006 — Preserve explicit raw formats:** `txt`, YAML, JSON, and XML documents retain their declared raw or syntax-highlighted presentation and are never interpreted as Markdown.
- **AC-007 — Use Markdown for approval documents:** Shape and planning guidance explicitly presents complete pitch and plan files through the question document field with `format: "md"` when that field is available.
- **AC-008 — Preserve package behavior:** Focused tests and the repository's required checks pass without regressions to responsive layout, selections, continuation drafts, document bounds, RPC, JSON, or print modes.
