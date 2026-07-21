---
name: pi-design-grill
description: Pressure-test a feature or bug pitch for problem clarity, agent-effort appetite, shaped solution, rabbit holes, no-gos, ambiguity, and observable acceptance signals.
---

# Pi Design Grill

Read [references/questions.md](references/questions.md), the current pitch, workflow state, and relevant repository truth. Do not ask the user for facts that code, docs, history, or existing evidence can answer.

## Interview loop

1. Map the decision tree: what must be understood, which decisions depend on others, and which branches can be resolved independently.
2. Choose the smallest high-value batch. Prefer the Question tool with **2–4 related questions** when the user can answer them in parallel.
3. Give each question concrete choices and a recommended answer with a short rationale when evidence supports one. Allow a custom answer. Do not manufacture a recommendation when facts are insufficient.
4. Do not batch a question whose meaning depends on an unanswered earlier decision. Ask a single question only when it is the sole dependency blocking every useful branch.
5. After each batch, summarize resolved decisions, changed assumptions, and remaining blockers. Re-map the decision tree and continue from prior answers rather than restarting.

Without the Question tool, ask the same compact numbered batch conversationally and wait for the batch response.

## What to challenge

- **Problem:** identify the person and concrete situation, whether an existing behavior fails or a needed capability does not exist yet, why the status quo matters, and what evidence demonstrates demand.
- **Appetite:** define the agent-effort envelope—breadth, novelty, integrations, research, migration, and acceptable unknowns—plus what scope can be cut. Keep safety, quality, and compatibility floors fixed.
- **Solution:** connect rough macro elements and flows without collapsing into either vagueness or implementation prescription.
- **Acceptance Signals:** state what a user or operator can observe when the problem is solved.
- **Rabbit Holes:** expose technical unknowns, policy decisions, edge cases, and scope traps; patch, constrain, spike, or explicitly escalate each.
- **No-Gos:** exclude tempting adjacent work and use cases that would exceed the appetite.
- **Readiness:** verify that the pitch is rough, solved, bounded, internally consistent, and understandable by an implementing agent.

Label facts, inferences, assumptions, and unresolved decisions. Interview relentlessly enough to reach shared understanding, but do not manufacture approval. Record blockers as evidence and request the pitch transition only when consequential ambiguity is resolved or explicitly accepted by the user.
