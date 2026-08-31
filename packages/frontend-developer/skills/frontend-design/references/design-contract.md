# Design context contract

## Evidence extraction

For each selected mock-up or board direction, record the evidence path or
direction identifier, person and task, desired feel, and focal workflow. Record
visible regions, hierarchy, grid and alignment, typographic roles, color roles,
spacing rhythm, shape language, imagery, interaction cues, and represented
states. Separate visible decisions from assumptions. List missing mobile,
overflow, loading, empty, error, focus, hover, and disabled behavior as
ambiguity; pixels do not authorize invented product behavior. Record responsive
and accessibility constraints, reusable target components and semantic tokens
when known, unresolved behavior or visual ambiguity, and the `DESIGN.md`
disposition. Generated pixels are not production assets by default.

## Precedence and reconciliation

Repository instructions and verified product behavior outrank `DESIGN.md`.
Existing components and tokens are implementation evidence. When these sources
conflict, identify the conflict and ask which intent should persist instead of
silently rewriting code or documentation.

## Durable direction

State one product-specific visual thesis and explain how typography, color,
spacing, composition, density, motion, and interaction support it. Name
anti-patterns that would weaken this product's direction. Ask for approval before
creating or materially rewriting DESIGN.md, then record rationale, tokens as
helpful evidence, responsive rules, component guidance, and unresolved decisions.

`design-documentation` owns DESIGN.md proposals and the canonical template.
It preserves unknown existing content where possible, never invents values, and
requires explicit approval before creation, replacement, or material rewrite.
