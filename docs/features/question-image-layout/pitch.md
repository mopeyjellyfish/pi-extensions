---
status: accepted
---

# Shape: Keep image-backed questions below visual evidence

## Problem and evidence

When an agent displays PNG, JPEG, WebP, or other terminal image evidence and then opens a full-screen `question` overlay, terminal graphics can remain painted over the question text and options. The user cannot reliably tell which question is active or which choices are available.

Pi 0.84.0 documents overlays as content rendered on top of the existing screen without clearing it. Its pinned TUI preserves terminal image lines during overlay composition, while one image can reserve several terminal rows. The merged `@mopeyjellyfish/pi-question` inline presentation already uses non-overlay `ctx.ui.custom()` at the editor position, so the transcript and its images remain above the compact question. The package guidance currently recommends inline presentation for nearby transcript context, but it does not name displayed terminal images. The frontend interface workflow asks for CLI feedback after image-backed directions without requiring inline presentation.

## Proposed solution

Make the existing inline question path the explicit image-safe contract. When a question follows displayed terminal images or image-backed design evidence, question-tool guidance tells agents to use `presentation: "inline"`. The frontend interface-design workflow requires the same presentation for CLI visual-choice feedback when the active question schema supports it, with a concise conversational question below the evidence as the independent-package fallback.

The question remains below the images and preserves its existing one-to-four-question behavior, options, editing, redirection, cancellation, and review. Full-screen remains the default for existing callers and remains required for attached documents and formal pitch or plan approval. The delivery is one vertical slice, one review and validation boundary, and one pull request from `fix/question-image-layout`; the pitch and plan share that implementation delivery unit.

## Boundaries and no-gos

- Do not modify Pi core, `@earendil-works/pi-tui`, terminal graphics protocols, or dependency versions.
- Do not attempt to arrange core-rendered tool images side by side; that layout belongs to Pi's tool-execution renderer and is outside this extension repository. Keeping the question below the images is the accepted cut from the requested “and/or” outcome.
- Do not change the `question` schema, default full-screen presentation, overlay implementation, compact row budget, result semantics, RPC behavior, or non-interactive behavior.
- Do not make `pi-frontend-developer` depend on `pi-question`; guidance must detect or conditionally use the active tool capability and retain a useful fallback.
- Do not weaken full-screen formal document approval guidance in Shape or planning.
- Reshape if reliable placement requires Pi core changes, automatic transcript-image detection, a package dependency, or a change to existing presentation defaults.

## Decision-changing research and risks

- A full-screen overlay cannot reliably cover terminal graphics from this package because Pi's compositor deliberately preserves image escape-sequence lines. The existing non-overlay inline path avoids that renderer boundary.
- Tool prompt guidance is the enforceable caller contract available to the independently installed question package. The frontend workflow adds a focused domain contract for the common image-backed design case.
- The main risk is guidance drift. Focused resource tests must assert both the general question-tool instruction and the frontend visual-feedback instruction.

## Authority

The parent owns product and architecture synthesis, acceptance-criteria interpretation, package-boundary decisions, final verification, and publication readiness. The human prefers accept-all implementation, but that preference becomes implementation authority only after approving the complete plan.

Pitch approval authorizes a bounded pitch commit and later pull-request publication for `fix/question-image-layout`. Whole-plan approval may authorize the accepted implementation, tests, documentation, focused repairs, atomic commits, and one ready pull request without routine checkpoints. It does not authorize merge, release, deployment, dependency changes, Pi core changes, destructive cleanup, or unrelated work.

## Observable acceptance criteria

- **AC-001 — Image-safe question guidance:** The active `question` tool instructions explicitly require `presentation: "inline"` when a question follows displayed terminal images, explaining that the question stays below the visual evidence.
- **AC-002 — Frontend visual-choice placement:** The interface-design workflow requires inline question presentation for CLI feedback after image-backed directions, terminal captures, or displayed mock-ups when the active schema supports it, and requires a below-evidence conversational fallback otherwise.
- **AC-003 — Compatibility retained:** Existing callers still default to full-screen, documents and formal approvals remain full-screen, and no question schema or runtime result behavior changes.
- **AC-004 — Independent packages:** `pi-frontend-developer` gains no dependency on `pi-question` and its guidance remains useful when the question tool or inline presentation is unavailable.
- **AC-005 — Focused proof:** Question contract tests and frontend resource tests fail before the guidance change, pass after it, and repository completion checks remain green.
