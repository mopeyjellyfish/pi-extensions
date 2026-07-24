---
name: pi-design-grill
description: Pressure-test a feature or bug pitch for research grounding, problem clarity, agent-investment appetite, shaped solution, rabbit holes, no-gos, ambiguity, and observable acceptance signals.
---

# Pi Design Grill

Read [references/questions.md](references/questions.md), the current pitch, workflow state, its Research Basis, mandatory research.md, and relevant repository truth. Complete repository research and the bounded external prior-art disposition before interviewing. Do not ask the user for facts that code, docs, history, experiments, or existing evidence can answer.

## Interview loop

1. Map the decision tree: what must be understood, which decisions depend on others, and which branches can be resolved independently.
2. Choose the smallest high-value batch. Prefer the Question tool with **2–4 related questions** when the user can answer them in parallel.
3. Give each question concrete choices and a recommended answer with a short rationale when evidence supports one. Allow a custom answer. Do not manufacture a recommendation when facts are insufficient.
4. Do not batch a question whose meaning depends on an unanswered earlier decision. Ask a single question only when it is the sole dependency blocking every useful branch.
5. After each batch, summarize resolved decisions, changed assumptions, and remaining blockers. Re-map the decision tree and continue from prior answers rather than restarting.
6. If the Question tool returns a redirect, address the clarification and reopen the revised questions with its continuation ID. Retain stable question and option IDs only when their meaning is unchanged.

Without the Question tool, ask the same compact numbered batch conversationally and wait for the batch response.

## What to challenge

- **Problem:** connect one motivating story and desired change to current repository behavior, demand evidence, constraints, and invariants.
- **Research Basis:** require cited code, tests, contracts, experiments, and targeted primary sources with explicit implications; reject detached link lists and raw transcripts.
- **Appetite:** define the qualitative agent investment through context surface, change depth, uncertainty allowance, validation burden, assurance, scope cuts, stop conditions, and fixed floors. Reject calendar estimates, token budgets, and vague size labels as substitutes.
- **Solution:** connect fixed decisions, agent discretion, reused seams, rough macro elements, and flows without collapsing into either vagueness or implementation prescription.
- **Simplicity:** challenge whether the behavior needs to exist, whether repository/stdlib/native/already-installed capability covers it, and which abstraction, configurability, wrapper, file, or speculative error path should be removed. Preserve fixed floors and explicitly accepted behavior.
- **Acceptance Signals:** state decisive observable examples for users, operators, and dependent systems.
- **Rabbit Holes:** pair each material risk with evidence, likely failure mode, containment, and an escalation or reshaping tripwire.
- **No-Gos:** give the agent executable exclusions against adjacent work, opportunistic cleanup, and premature generalization, with the investment dimension each exclusion protects.
- **Readiness:** verify that the pitch is rough, solved, bounded, internally consistent, and understandable by an implementing agent.

Label facts, inferences, assumptions, and unresolved decisions. Interview relentlessly enough to reach shared understanding, but do not manufacture approval. Do not exaggerate a risk, uncertainty, implementation difficulty, or recoverable tool failure into a blocker. Record a blocker only when safe progress requires a user-owned decision or changed boundary; state the evidence, consequence, and smallest decision needed. Once the artifact is coherent and simplified, request the transition and present the ledger's exact Refine-again/Approve-and-continue Question so the user's choice acts immediately.
