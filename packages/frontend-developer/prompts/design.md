---
description: Classify a frontend interface request as UI design or implementation work.
---

Classify this frontend interface request before proceeding:

- For a bounded mechanical style, spacing, or placement correction, make the
  direct target-repository change without a design ceremony.
- For material design direction, a new app surface, or a major redesign, use
  the `frontend-design` skill. It must load `interface-design`, create
  image-backed directions, and use `design_board` with CLI feedback by default to
  verify and give a local board URL before asking for a visual choice.
- For implementation or a frontend change, use `frontend-development`. It may
  use `frontend-design` when needed.

$ARGUMENTS
