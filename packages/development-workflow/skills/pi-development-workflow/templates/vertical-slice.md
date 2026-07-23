---
schema: dev-workflow/vertical-slice-v1
id: VS-001
depends_on: []
requirements: [REQ-001]
risk: medium
---

# VS-001: Example behavior

## Observable Outcome

Describe independently demonstrable behavior.

## Pitch Fit

Explain how this advances the approved pitch.

## Boundaries Crossed

Name every necessary boundary crossed by the outcome.

## Execution Profile

- Worker model: `openai-codex/gpt-5.6-terra`
- Worker effort: medium
- Selection reason: Ordinary vertical-slice implementation with understood boundaries.
- Escalate when: State, lifecycle, security, concurrency, migration, debugging, or ambiguity exceeds the medium-effort contract.
- Next tier: Terra high for difficult but bounded implementation.
- Conceptual failure: Return to Sol planning, repair the plan, and retry Terra.
- Frontier fallback: Sol medium only after the Sol planner or Oracle explicitly revalidates a sound plan whose implementation still needs frontier judgment.
- Prohibited fallback: Never use Terra xhigh instead of replanning or Sol capability.
- Context: Fresh child with this slice, the approved pitch, direct contracts, relevant repository neighborhood, and validation contract.

## RED

Define the first failing behavior test or observation.

## GREEN

Define the minimum implementation that satisfies RED.

## Verification

List focused and regression checks.

## Done When

State the objective demonstration signal.
