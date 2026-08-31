---
status: accepted
---

# Shape: Image-first UI design

## Problem and evidence

The frontend package already provides `image-generation`, `frontend-design`, `interface-design`, and `design_board`. Shape also requires image-backed directions when material visual direction is unresolved.

The current contracts do not make image-model generation the initial design method when that capability is available. They also do not carry the selected image through planning as an explicit image-to-interface contract. An agent can therefore skip generation, record only a visual label, or start implementation without a clear translation from the selected image to native UI.

The desired outcome is a bounded design stage for new application UI. The stage generates several UI directions, presents them to the human, records the selected direction, and gives planning enough evidence to build and verify the interface.

## Proposed solution

For a greenfield web application or a materially new application surface, Shape loads `frontend-design` before pitch approval.

When an installed image-generation skill and tool are available, the design method uses them for the initial visual direction pass. Before provider calls, it obtains explicit consent for privacy exposure, separate billing, credentials, and a bounded generation pass. If consent, credentials, or the capability are unavailable, Shape makes no provider request and continues with the normal UI design method.

The initial pass produces two to eight distinct, coherent UI directions. The agent inspects each artifact and rejects unusable output before presentation. It presents the valid directions through `design_board`, verifies the board URL, and obtains an explicit human selection and notes. A bounded refinement pass can update the selected direction when the human requests it. Additional provider work requires a newly stated bound and consent.

Shape records an image-to-interface contract for the selected direction. The contract separates visible evidence from assumptions and includes:

- the person, task, desired feel, and focal workflow;
- visible regions, hierarchy, layout, density, palette, typography, shape language, and imagery;
- represented states and missing states;
- responsive and accessibility constraints;
- reusable target components and tokens when they are known;
- unresolved product behavior and visual ambiguity;
- the selected evidence path or board direction identifier;
- the `DESIGN.md` disposition.

Generated pixels remain design evidence. They do not define hidden behavior, authorize inaccessible controls, replace meaningful text, or become production assets by default. Artifact retention and publication follow the target repository's rules and an explicit design-evidence decision.

Planning traces the accepted image-to-interface contract into the fewest vertical slices. UI implementation uses `frontend-development` and the accepted design method. It maps the selected direction to native accessible structure, target-owned components, and semantic tokens. React-specific guidance applies only when the accepted target uses React.

After implementation reaches a stable state, browser evidence compares representative desktop and mobile states with the accepted direction. A visual mismatch ledger records differences, likely causes, accepted deviations, and recheck targets. The implementation is complete only when material mismatches are resolved or explicitly accepted.

The pitch and plan remain in the implementation delivery unit. They do not need a separate pull request.

## Boundaries and no-gos

- Apply the generation-first stage to greenfield web applications and materially new application surfaces. Do not add it to bounded mechanical UI corrections.
- Keep marketing, campaign, landing-page, brand-only, native mobile, and non-UI work outside this change.
- Keep `feature-flow` independently installable. It resolves frontend capabilities by name and records an honest fallback when they are absent.
- Do not require an image provider, credentials, or a successful provider response to continue Shape.
- Do not generate images without explicit privacy and billing consent.
- Do not copy generated text, controls, navigation, or behavior directly into production code.
- Do not treat image matching as more important than product behavior, accessibility, responsive behavior, or target repository contracts.
- Do not commit generated images as production assets by default.
- Keep generation and refinement bounded. Do not create an open-ended provider loop.
- Reshape if the work needs a new image tool API, provider transport, persistent board service, or marketing-site design method.

## Decision-changing research and risks

- Existing capability is close to the desired workflow. The smallest change is to strengthen the contracts across Shape, planning, frontend design, frontend development, tests, and package documentation. A new extension or command is not required.
- Provider generation exposes prompts and optional input images and incurs separate cost. A bounded consent contract is required before calls.
- Generated UI can contain illegible text, generic layouts, or impossible interaction cues. Inspection and an explicit ambiguity ledger prevent these pixels from becoming false requirements.
- Binary design artifacts can create repository bloat or become stale. Textual design decisions are durable by default. Image retention needs an explicit target-repository decision.
- A visual checkpoint adds latency to greenfield work. The workflow limits it to material application UI and bypasses it when generation is unavailable or declined.
- Cross-package wording can accidentally make `feature-flow` depend on `frontend-developer`. Tests must keep named capability resolution and direct-parent fallback explicit.

## Review evidence

- **Applicability:** `not applicable`; this change does not propose Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

## Authority

The direct parent owns product scope, workflow boundaries, interface evidence synthesis, and approval.

The selected execution mode is an accept-all preference. This preference is not implementation authority until the human approves the complete plan. Approval does not authorize merge, release, deployment, destructive cleanup, unrelated work, or unbounded provider cost.

Pitch approval authorizes a bounded commit on `feat/ui-image-design-flow` and the handoff to planning. The pitch shares the implementation delivery unit's later publication boundary.

## Observable acceptance criteria

- **AC-001 — Generation-first routing:** For a greenfield web application or materially new application surface, Shape uses an installed image-generation capability for the initial design pass before pitch approval when consent and credentials permit it.
- **AC-002 — Safe fallback:** If the image capability, consent, credentials, or provider result is unavailable, the workflow makes no unauthorized provider request and continues with normal UI design without claiming generated evidence.
- **AC-003 — Human visual choice:** A completed generation pass produces two to eight inspected UI directions, presents them on a verified `design_board`, and records an explicit human selection and notes before pitch approval.
- **AC-004 — Bounded iteration:** The workflow states the generation bound before provider calls. It does not continue an open-ended image refinement loop.
- **AC-005 — Translation contract:** The accepted pitch records the selected evidence and an image-to-interface contract that separates visible decisions, missing states, responsive and accessibility constraints, and unresolved behavior.
- **AC-006 — Native implementation:** Planning requires the selected direction to become native accessible UI through target-owned components and tokens. Generated pixels do not replace controls, meaningful content, or behavior.
- **AC-007 — Traceable visual proof:** The plan requires representative desktop and mobile browser evidence and a resolved or explicitly accepted visual mismatch ledger after implementation.
- **AC-008 — Proportional scope:** Mechanical UI corrections and non-UI work bypass this stage. Provider or frontend capability absence does not block the independently installable Shape workflow.
- **AC-009 — Resource contract proof:** Focused resource tests fail before the workflow guidance changes and pass after Shape, planning, frontend design, frontend development, templates, and package documentation agree on the new lifecycle.
