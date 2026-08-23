---
status: accepted
---

# Shape: Ask structured questions inline

## Problem and evidence

Agents sometimes finish an explanation or ask the user to run a command, then need a structured answer. The current `question` tool always opens a terminal-sized overlay. That overlay hides the nearby assistant output while the user chooses an answer, so the user cannot review the command, context, or instructions that the question refers to.

The question package already supports one to four questions, single- and multi-select answers, custom answers, notes, redirection, final review, continuation drafts, RPC fallback, and bounded results. Pi's pinned `ctx.ui.custom()` contract can either replace the editor at the bottom of the transcript or open an overlay. The missing behavior is a caller-selected presentation mode.

## Proposed solution

Add one optional model-facing presentation field to the `question` tool:

- `presentation: "inline"` opens the structured questionnaire in Pi's editor position, below the visible transcript, without padding to terminal height. The assistant output and relevant command remain visible above it.
- `presentation: "fullscreen"` opens the existing capturing terminal-sized overlay.
- Omitting `presentation` preserves the current full-screen behavior for backward compatibility.

Inline presentation reuses the existing questionnaire state and answer semantics. It supports one to four questions, single- and multi-select options, tab navigation, custom answers, notes, conversational redirection, and the multi-question final review. Its compact viewport keeps the focused choice and sticky controls visible without taking over the transcript.

Full documents and formal approval gates remain full-screen. Existing pitch, plan, and document-review skills continue to omit the field or explicitly request `fullscreen`; guidance will state that attached documents and formal review gates use full-screen presentation. The new inline mode is intended for contextual clarifications where seeing the preceding assistant output is more important than maximizing document space.

This is one vertical behavior slice and one delivery unit: extend the public tool contract, route TUI presentation, provide a compact inline rendering contract, preserve all existing execution modes, and document agent guidance. The pitch and plan share the implementation delivery unit and do not need independent publication.

## Boundaries and no-gos

- Scope is `@mopeyjellyfish/pi-question`, its focused tests and README, plus the existing Shape/planning guidance needed to keep formal document reviews full-screen.
- Preserve full-screen as the default. Existing calls must not change presentation or behavior.
- Preserve question/option schemas, answer details, continuation compatibility, cancellation, output bounds, and tool execution ordering except for the new optional presentation field.
- Preserve RPC's sequential dialog fallback and JSON/print unavailable results; presentation affects only TUI rendering.
- Inline mode must support multiple questions and multi-select rather than degrading to one yes/no prompt.
- Do not copy assistant output into question arguments or result details, add a second question tool, modify Pi core, or keep a persistent widget after the question settles.
- Do not make large attached documents compact merely to claim inline support. If a caller combines `presentation: "inline"` with an attached document, reject the input with actionable guidance to use `fullscreen` rather than silently changing the requested presentation.
- Re-shape if a compact, editor-position custom component cannot retain focus, cancellation, and IME behavior through Pi's public TUI API.

## Decision-changing research and risks

- Pi documents `ctx.ui.custom()` without overlay options as a temporary editor replacement. This provides the requested bottom-of-transcript placement without new host APIs. Passing `{ overlay: true }` is the current full-screen path.
- The existing `QuestionDialog` assumes a terminal-row budget and paints a full-width, full-height opaque rectangle for overlay stability. Inline presentation therefore needs an explicit compact layout policy; simply removing overlay options would still consume terminal height.
- A single shared state machine should remain authoritative. Forking selection or continuation logic for inline mode would create avoidable semantic drift.
- Attached documents are deliberately incompatible with inline presentation because formal document review needs the current stable, scrollable full-screen viewport. This makes misuse visible instead of silently hiding the transcript again or rendering an unreadable document pane.
- Short terminals and long wrapped labels can still overflow a compact component. Focus-aware clipping and width bounds must remain observable in tests.

## Authority

The parent owns the package-local TUI layout, the exact compact row cap, schema naming, validation text, and test seams within this accepted behavior. Approval authorizes bounded work on branch `feat/question-inline-mode`, its feature documents, focused package changes, one fixed review, and later pull-request publication after complete-plan approval.

Execution mode preference is **accept-all implementation**. This preference is not implementation authority until the complete plan is approved. Approval does not authorize merge, release, deployment, destructive cleanup, unrelated remote changes, or a Pi core dependency change.

## Observable acceptance criteria

- **AC-001 — Select presentation:** A TUI caller can request `presentation: "inline"` or `presentation: "fullscreen"`; omission behaves exactly like `fullscreen`.
- **AC-002 — Keep context visible inline:** Inline presentation uses Pi's editor-position custom component without overlay options and does not pad itself to terminal height, leaving preceding assistant output visible above it.
- **AC-003 — Preserve structured behavior:** Inline presentation supports one to four questions, single- and multi-select answers, tabs, custom answers, notes, redirection, cancellation, and multi-question final review with the same result details as full-screen presentation.
- **AC-004 — Bound compact rendering:** Inline rendering keeps the focused row and controls visible within a documented compact row budget, remains within the supplied width, and preserves focus and IME cursor behavior during text entry.
- **AC-005 — Keep formal reviews full-screen:** Omitted presentation remains full-screen, and Shape/planning/document-review guidance continues to present attached approval documents in the full-screen mode.
- **AC-006 — Reject incompatible inline documents:** TUI input that combines inline presentation with an attached document fails with guidance to use full-screen presentation; document content is never silently dropped or presentation silently changed.
- **AC-007 — Preserve other modes:** RPC behavior remains sequential and independent of presentation, while JSON/print modes remain explicitly unavailable; cancellation and continuation behavior do not regress.
- **AC-008 — Explain agent choice:** The tool description, prompt guidance, schema descriptions, and package README explain when to choose inline versus full-screen presentation.
- **AC-009 — Pass repository proof:** Focused question and feature-flow tests, question typecheck, source smoke, manual deterministic TUI and `/reload` acceptance, and `npm run check` pass against the final worktree.
