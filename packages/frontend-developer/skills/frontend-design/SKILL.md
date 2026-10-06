---
name: frontend-design
description: >-
  First owner for material app direction, a new app surface, a major redesign, or
  unclear visual direction. Classify the request before implementation.
---

# Frontend design

Classify the request by surface and impact after reading target repository
instructions, observed product behavior, existing UI, supplied mock-ups, and an
existing `DESIGN.md`. Repository instructions and observed product behavior
take precedence over DESIGN.md. Its absence does not block work.

- For competitor or related-product UX/UI research, load `interface-research`.
  For current-app inspection, research, a visual choice, and an improvement plan,
  follow [`/improve-ui`](../../prompts/improve-ui.md). Classify impact here,
  then return to that workflow without implementation or another routing loop.
  After explicit visual selection, it offers **Shape and plan** or **Plan
  directly**. Preserve the selected evidence through either route.
- For a bounded mechanical visual edit, make the direct repository-conforming
  change and run its relevant check. Do not add a design ceremony.
- For a focused request to evaluate, refine, enhance, fix, extract, or iterate
  on product UI, load `interface-craft` and select one operation. Route design
  documentation to `design-documentation`. Audits and critiques remain
  evaluation-only. When follow-on delivery is requested, use interface-craft's
  explicit **Shape and plan** or **Plan directly** choice.
- For a greenfield web application or materially new application surface, load
  `interface-design` before implementation. When an installed `image-generation`
  capability, explicit consent, and credentials permit it, use one bounded,
  generation-first initial design pass. If any is unavailable, declined, or
  fails, continue normal UI design without claiming generated evidence.
- For another non-trivial app interface, major redesign, or unclear product-UI
  direction, load `interface-design` before implementation. Its material-design
  loop requires image-backed directions on a verified local `design_board` URL
  before requesting a visual choice.
- For marketing sites, campaigns, landing pages, or brand-only work, route to
  `marketing-site-design` only when that capability is available. Otherwise
  state the limitation; do not apply the app-interface method as a substitute.

Keep mock-ups as evidence rather than executable behavior and keep interactive
controls and meaningful content native and accessible. `interface-craft` owns
focused operation contracts; this router does not duplicate them.
