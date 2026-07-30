---
schema: feature-flow-plan/v2
feature: "{{feature}}"
id: "{{id}}"
pitch_sha256: "{{pitch_sha256}}"
depends_on: []
---

# Slice {{id}}: Vertical outcome

## Goal

State one observable user or operator outcome.

## Pitch trace

- [Exact pitch section](../pitch.md#exact-heading-anchor)
- **AC-NNN**

## Dependencies and predecessor postconditions

Name only real predecessors and the observable postconditions this slice needs.
Keep `depends_on: []` when the outcome is genuinely independent.

## Public seam and first TDD tracer

Name the public seam, the independently derived expected result, the first
failing test, and the minimum production behavior that should make it pass.

## Validation

List only focused and repository-required checks that apply to this slice.

## Dogfood and QA

Describe one integrated user or operator path that exercises the outcome.

## Done when

State objective completion conditions.

<!--
Add scope cuts, boundaries crossed, implementation route, later-cycle guidance,
risks, or escalation conditions only when material. Do not add plan status,
delivery estimates, speculative task inventories, or a dependency solely to
serialize otherwise independent work.
-->
