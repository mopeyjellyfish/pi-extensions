---
schema: dev-workflow/vertical-slice-v1
id: VS-001
depends_on: []
requirements: [REQ-001]
risk: medium
---

# VS-001: Example behavior

<!-- Remove {{TEMPLATE_GUIDANCE}} after replacing every instruction and placeholder. -->

## Observable Outcome

Describe independently demonstrable behavior.

## Pitch Fit

Explain how this advances the approved pitch.

## Boundaries Crossed

Name the user-facing entry point, implementation seam, and verification or operational boundary crossed by the outcome.

## Execution Profile

### Worker Model

`openai-codex/gpt-5.6-terra`

### Worker Effort

Medium.

### Rationale

Ordinary vertical-slice implementation with understood boundaries.

### Escalation

Use Terra high only for difficult but bounded implementation.

### Conceptual Replanning

Return conceptual failure to Sol planning, repair the plan, and retry Terra.

### Frontier Fallback

Sol medium only after the Sol planner or Oracle explicitly revalidates a sound plan whose implementation still needs frontier judgment.

### Reviewer

One fresh Sol high reviewer checks intent, correctness, maintainability, risk/operations, and final verification for this slice.

## Simplification Pass

Before verification, run the simplicity ladder against the affected diff: reuse existing seams, standard library, native features, and installed dependencies; delete superseded code; avoid speculative abstractions, configurability, wrappers, and files. A fresh Simplifier returns a concise delete/reuse list; accepted changes preserve fixed floors and rerun focused checks.

## RED

Define the first failing behavior test or observation.

## GREEN

Define the minimum implementation that satisfies RED.

## Verification

List focused and regression checks.

## Done When

State the objective demonstration signal.
