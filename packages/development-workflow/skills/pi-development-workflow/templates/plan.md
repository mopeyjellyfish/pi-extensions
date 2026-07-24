# Plan

<!-- Remove {{TEMPLATE_GUIDANCE}} after replacing every instruction and placeholder. -->

Pitch and boundaries: [PITCH-001](spec.md)

## Vertical Slices

The first integrated slice is [VS-001](slices/VS-001-example.md), an early demonstrable walking skeleton.

## Dependencies and Sequencing

VS-001 has no dependencies and is first. For each later slice, name its `VS-NNN` dependencies and explain whether it runs after, before, or independently of the others.

## Simplification Review

Name the existing seams, standard-library/native capabilities, and already-installed dependencies the plan reuses. List slices, abstractions, configuration, files, or generality removed or deliberately not added. Complexity alone is not a blocker; preserve only complexity required by acceptance signals or fixed floors.

Add and reorder later behavior slices as implementation reveals new facts. Keep discovered tasks out of this file.
