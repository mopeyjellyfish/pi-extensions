---
name: test-driven-development
description: >-
  Implements behavioral code through one intended failing test and the minimum
  passing change at an approved public seam.
---

# Test-driven development

Use this method for each behavioral code change:

1. Name one observable behavior and its public seam. An explicit accepted
   request, accepted pitch, or accepted plan counts as seam approval; ask only
   when the seam is unresolved.
2. Add the smallest behavior test at that public seam. Use an independent
   expected value from the specification, a known literal, or a worked example.
3. Run that focused test and confirm it fails for the intended behavioral
   reason, not because of setup or syntax.
4. Add only the minimum production behavior needed to pass.
5. Run the focused test and confirm it passes.
6. Repeat vertically for the next behavior. Do not batch tests horizontally
   before making the current behavior green.
7. Run the applicable integrated path and required checks.

Mock only real process, filesystem, time, randomness, network, provider, or UI
boundaries when necessary. Do not mock owned modules or test private helpers.

A pure refactor uses applicable existing tests or the smallest focused
validation before and after. Add a public-seam behavior test only when it gives
material protection. Documentation, metadata, generated-contract, and
mechanical work use the smallest focused validation that can detect the
intended error; do not manufacture a red test.
