---
name: frontend-design
description: Establish deliberate, repository-grounded visual direction for a frontend request.
---

# Frontend design

Classify the request by surface and impact after reading target repository
instructions, observed product behavior, existing UI, supplied mock-ups, and
an existing `DESIGN.md`. Repository instructions and observed product behavior
take precedence over DESIGN.md. Its absence does not block work.

- For a bounded mechanical visual edit (a known style, spacing, or placement
  correction), make the direct repository-conforming change and run its
  relevant check. Do not add a design ceremony.
- For a non-trivial app interface—a new app surface, major app redesign, or
  unclear product-UI direction—load `interface-design` before implementation.
  It is the complete framework-neutral method for dashboards, admin panels,
  tools, settings, data interfaces, and interactive product workflows.
- For marketing sites, campaigns, landing pages, or brand-only work, route to
  `marketing-site-design` only when that capability is available. Otherwise
  state the limitation and use available repository guidance; do not apply the
  app-interface method as a false substitute.

Keep mock-ups as evidence rather than executable behavior and keep interactive
controls and meaningful content native and accessible. `interface-design` owns
material design exploration, `DESIGN.md` approval, implementation handoff,
feedback, and visual proof; this router does not duplicate that method.
