---
name: codebase-design
description: >-
  Designs deep modules with stable seams, hidden complexity, and evidence-based
  responsibilities without speculative abstractions.
---

# Codebase design

Use this method when module shape or a test seam is in question. It is design
vocabulary, not an automatic abstraction checklist.

- Prefer a deep module: substantial behavior behind a small stable interface.
  Place a seam where callers need a stable capability, not around every class or
  function.
- Hide internal sequencing, representation, configuration defaults, and
  recoverable complexity. Reject APIs that make callers coordinate internal
  steps.
- Add an adapter or injected dependency only for a real volatile or external
  boundary. Prefer an existing seam.
- Search the repository, standard library, native platform, and installed
  dependencies before adding a capability.
- Extract duplication only when copies encode the same current rule and must
  change together. Similar syntax is not enough.
- Use callers and reasons to change as evidence for one coherent responsibility.
  File length alone is not evidence.
- Reject forwarding-only layers, duplicated policy, and speculative interfaces.
- Test through the public interface; treat testability friction as evidence that
  the interface or seam may be wrong.

Report a design problem only with concrete evidence and its effect on callers,
change locality, or public behavior. Do not use a principle name as the verdict.
