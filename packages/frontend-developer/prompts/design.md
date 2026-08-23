---
description: Route a frontend interface request to focused design, craft, documentation, or implementation work.
---

Classify this frontend interface request before proceeding:

- For a bounded mechanical style, spacing, or placement correction, make the
  direct target-repository change without a design ceremony.
- For `/design document`, “document the design system”, or “teach me this design
  system”, use `design-documentation`.
- Route focused craft requests through `interface-craft`: “polish this”, “audit
  the settings flow”, “fix the mobile layout”, “make this calmer”, “improve
  onboarding”, and “clarify the errors” select their matching operation.
  “Normalize” means `polish` for local drift or `extract` for reusable
  convergence. Ask once if intent materially overlaps.
- For material design direction, a new app surface, or a major redesign, use
  `frontend-design`. It loads `interface-design`, creates image-backed
  directions, and uses `design_board` with CLI feedback by default to verify and
  give a local board URL before asking for a visual choice.
- For implementation or a frontend change, use `frontend-development`. It may
  use `frontend-design` or `interface-craft` when needed.

`/shape` remains the feature pitch lifecycle. Do not add `init`, `craft`, or an
Impeccable command surface.

$ARGUMENTS
