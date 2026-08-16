---
name: codebase-design
description: >-
  Shared vocabulary for evidence-based deep modules, seams, and test surfaces
  without speculative abstractions.
---

# Codebase design

Use this method when module shape or a test seam is in question. It is design
vocabulary, not an automatic abstraction checklist. Aim for leverage for
callers, locality for maintainers, and testability for everyone.

## Vocabulary

Use these terms consistently.

- **Module:** anything with an interface and implementation: a function, class,
  package, or tier-spanning slice.
- **Interface:** everything a caller must know, including the type signature,
  invariants, ordering constraints, error modes, configuration, and performance
  characteristics.
- **Implementation:** the code inside a module. This differs from an
  **adapter**, which describes the role that satisfies an interface at a seam.
- **Depth:** leverage at the interface: behavior callers or tests can exercise
  per unit of interface they must learn. A deep module hides substantial
  behavior behind a small interface; a shallow module exposes nearly as much
  complexity as it hides.
- **Seam:** the location where a module interface lets behavior vary without
  editing callers.
- **Adapter:** a concrete implementation that satisfies an interface at a seam.
- **Leverage:** capability returned to callers by a deep module.
- **Locality:** concentration of change, bugs, knowledge, and verification in
  one place instead of across callers.

## Evidence-based design checks

- Prefer a deep module with a small, stable interface. Place a seam where
  callers need a stable capability, not around every class or function.
- Hide internal sequencing, representation, configuration defaults, and
  recoverable complexity. Reject APIs that make callers coordinate internal
  steps.
- Depth is a property of the interface, not implementation size. A module may
  have private internal seams while presenting one external seam.
- Apply the **deletion test**: if deleting a module only removes a pass-through,
  delete it; if its complexity reappears across callers, it earns its keep.
- The interface is the **test surface**. Test through it; testability friction
  is evidence that the interface or seam may be wrong.
- One adapter means a hypothetical seam; two adapters means a real one. Add an
  adapter or injected dependency only for a real volatile or external boundary,
  and prefer an existing seam.
- Search the repository, standard library, native platform, and installed
  dependencies before adding a capability.
- Extract duplication only when copies encode the same current rule and must
  change together. Similar syntax is not enough.
- Use callers and reasons to change as evidence for one coherent responsibility.
  File length alone is not evidence.

Reject speculative seams, forwarding-only layers, and syntax-only
deduplication. Report a design problem only with concrete evidence and its
effect on callers, change locality, public behavior, or tests. Do not use a
principle name as the verdict.
