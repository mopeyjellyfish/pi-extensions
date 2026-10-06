---
status: accepted
---

# Shape: Explicit review-to-Shape handoff

## Problem and evidence

Improvement reviews can identify useful delivery work, but their next-step controls do not consistently expose Shape as a deliberate choice.

- `/improve` can route an **Action** to Shape, planning, or implementation, but the user cannot explicitly choose Shape after reviewing a candidate or group.
- `/improve-ui` sends an accepted visual direction directly to `planning-changes`.
- Focused interface critique and audit operations are read-only and can propose follow-on work, but they do not define a consistent explicit Shape handoff.

This makes it easy to move from review evidence into a narrower delivery route without first capturing the problem, boundaries, risks, authority, and acceptance criteria in an approved pitch.

## Proposed solution

Add a consistent, explicit **Shape** choice to improvement-producing review workflows while preserving their existing read-only review behavior and other next steps.

1. In `/improve`, add **Shape all**, **Shape selected**, and per-candidate **Shape** choices alongside the existing Action, Track, Won't do, Deepen, and selection controls. A Shape choice creates one self-contained handoff from the reviewed candidate set. It preserves stable candidate IDs, evidence, dependencies, overlap, uncertainty, recommended routes, applicable methods, and proof needs.
2. In `/improve-ui`, after the user explicitly selects a visual direction, offer **Shape and plan** or **Plan directly**. **Shape and plan** passes the complete accepted design evidence to `shape`; after pitch approval, Shape invokes `planning-changes`. **Plan directly** preserves the current route for already-settled intent.
3. In focused interface critique or audit flows, remain read-only. When the user requests follow-on delivery from proposed improvements, offer the same explicit **Shape and plan** or **Plan directly** choice instead of silently starting implementation.
4. A Shape handoff does not itself authorize implementation. Shape creates and seeks approval for a pitch, then hands accepted intent to planning. Planning separately seeks approval for the delivery plan.

The feature is documentation and workflow-contract work across the Engineering, Frontend Developer, and Feature Flow packages. It does not require executable extension code or document-content tests.

## Boundaries and no-gos

- Keep fixed-diff `/code-review` focused on introduced defects, optional comments, and bounded repairs. Do not turn defect findings into general improvement discovery.
- Do not force every improvement through Shape. Preserve direct planning and the existing appetite-aware Action route where the user chooses them.
- Do not let browser or design-board controls authorize Shape, planning, implementation, tracker mutation, or publication. The terminal decision remains authoritative.
- Do not duplicate review discovery inside Shape. Pass the reviewed evidence as intent; Shape owns synthesis, pitch boundaries, approval, and the planning handoff.
- Do not assume that `shape` or `planning-changes` is installed. Return a self-contained handoff and name the unmet capability when either is unavailable.
- Do not add extension scaffolding or tests that assert Markdown wording.
- If implementation shows that a generic cross-package handoff contract would require a new runtime dependency or shared production package, stop and reshape rather than coupling the packages.

## Decision-changing research and risks

- The current `/improve` Action route already selects `implement`, `planning-changes`, or Shape based on evidence. The new explicit Shape choice must remain distinct: it records the user's decision to run the pitch lifecycle even when a faster route is available.
- `/improve-ui` already requires visual review and explicit selection. Adding an optional Shape stage must preserve accepted image evidence and avoid asking the user to repeat the visual decision.
- Too many terminal choices can reduce clarity. Group and individual controls must use concise labels and keep the existing selection fallback when the Question tool is unavailable.

## Review evidence

- **Applicability:** `not applicable`; this feature changes Markdown workflow guidance and no Go source, module, CLI, or Go-specific routing.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

## Authority

The direct parent owns product and architecture decisions, pitch synthesis, approval, final verification, and handoff quality. Approved delivery may update the Engineering, Frontend Developer, and Feature Flow workflow documentation needed to keep the public contracts consistent.

Execution mode: checkpointed implementation.

Approval does not authorize merge, release, deployment, destructive cleanup, or unrelated remote changes.

## Observable acceptance criteria

- **AC-001 — Explicit architecture-review handoff:** After reviewing one or more `/improve` candidates, the user can explicitly choose Shape for one candidate, a selected subset, or all awaiting candidates without relying on automatic route inference.
- **AC-002 — Complete improvement evidence:** The `/improve` Shape handoff carries stable candidate IDs, reviewed evidence, constraints, dependencies, overlap, uncertainty, recommended routes, and proof needs into the pitch lifecycle.
- **AC-003 — Explicit UI-review handoff:** After `/improve-ui` visual selection, the user can choose **Shape and plan** or **Plan directly**. Shape receives the accepted direction, evidence, feedback, constraints, and unmet proof without repeating visual selection.
- **AC-004 — Focused audit handoff:** A read-only interface critique or audit that produces follow-on improvements offers the same explicit Shape-or-plan decision when the user asks to deliver the work.
- **AC-005 — Approval boundaries:** Choosing Shape starts the pitch lifecycle only. Implementation remains blocked until pitch and plan approvals grant their documented authority.
- **AC-006 — Independent installation fallback:** If Shape or planning is unavailable, each owning package returns a self-contained handoff and reports the missing capability without pretending that the transition ran.
- **AC-007 — Fixed-diff review remains bounded:** `/code-review` behavior and authority remain unchanged except for documentation needed to clarify that it is outside this improvement-review handoff.
- **AC-008 — Package contract consistency:** The Engineering, Frontend Developer, Feature Flow, architecture, and user-facing README text describe the same handoff semantics, and repository Markdown, package, smoke, and full checks pass.
