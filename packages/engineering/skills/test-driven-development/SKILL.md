---
name: test-driven-development
description: >-
  Implements behavioral code through one intended failing test and the minimum
  passing change at an approved public seam.
---

# Test-driven development

A good test describes one observable capability through a public interface and
survives internal refactoring. Use the narrowest stable approved seam that still
proves the behavior. An accepted request, accepted pitch, or accepted plan
counts as seam approval; ask only when the seam is unresolved.

For each vertical behavior:

1. Add the smallest behavior test with an independent expected value from
   accepted intent, a known literal, or a worked example.
2. Run it and confirm the public seam fails for the intended behavioral reason,
   not because of setup or syntax.
3. Add only the minimum production behavior needed to pass.
4. Run the focused test, then refactor while green.
5. Repeat vertically for the next behavior and finally run the integrated path
   and required checks.

Reject mock-call-only tests, tests of a private helper or implementation
structure, tautological expected values, and horizontal batches of imagined
behavior. Preserve substitution with the same public behavior tests. Mock only
real process, filesystem, time, randomness, network, provider, or UI boundaries
when necessary, not owned collaborators.

A pure refactor uses applicable existing tests or the smallest focused
validation before and after. Add a public-seam behavior test only when it gives
material protection. Documentation, metadata, generated-contract, and
mechanical work use the smallest focused validation that can detect the
intended error; do not manufacture a red test.
