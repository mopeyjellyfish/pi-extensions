---
name: engineering-practices
description: >-
  Applies evidence-based design constraints without acronym verdicts or
  speculative abstractions.
---

# Engineering practices

- Search for an existing repository helper, standard library feature, native
  platform feature, or installed dependency before adding code.
- Extract duplication only when it represents the same current rule and the
  copies must change together. Similar syntax is not enough.
- Give a module one coherent policy or capability. Use its callers and reasons
  to change as evidence; file length is not a verdict.
- Preserve substitution through public-seam behavior tests. Do not add an
  interface for one implementation or a speculative variant.
- Add dependency injection only at a real volatile or external boundary, and
  prefer an existing seam.
- Prefer a small public interface that hides substantial behavior. Reject
  forwarding-only layers and APIs that expose internal sequencing.
- Use domain language from the nearest `CONTEXT.md`, with one stable term for
  each concept.
- Keep validation, cancellation, failures, cleanup, and trust boundaries
  explicit.

Report a design problem only with concrete evidence such as a duplicated rule,
shallow layer, broken public contract, unstable dependency, or unnecessary
exported concept. Do not use an acronym or principle name as the verdict, and
do not add speculative abstractions to satisfy one.
