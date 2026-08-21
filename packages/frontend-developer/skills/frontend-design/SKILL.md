---
name: frontend-design
description: Establish deliberate, repository-grounded visual direction for a frontend request.
---

# Frontend design

Read target repository instructions, product behavior, existing UI, supplied
mock-ups, and an existing `DESIGN.md`. Repository instructions and observed
product behavior take precedence over DESIGN.md. When present, use DESIGN.md as
canonical durable design context, but reconcile statements that conflict with
live components or UI. Its absence does not block work.

Extract visible evidence and name uncertainty rather than inventing product
behavior. Form a context-specific visual thesis covering hierarchy, typography,
color, spacing, composition, density, motion, and interaction principles.
Choose deliberate anti-patterns for this product; do not impose a framework,
component library, font, palette, or maximal style.

Use native accessible controls for interaction. Do not turn a screenshot into
absolute-positioned image-shaped markup. Load
[`references/design-contract.md`](references/design-contract.md) when extracting
mock-up evidence or reconciling design context. Ask for approval before creating
or materially rewriting `DESIGN.md`; after approval, load and adapt
[`assets/DESIGN.template.md`](assets/DESIGN.template.md).
