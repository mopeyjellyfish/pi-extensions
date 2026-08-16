---
name: shape
description: >-
  Turns a fuzzy feature request into an explicitly accepted pitch, then hands
  the accepted intent to planning-changes.
---

# Shape

Use the direct parent as the default executor. After receiving a feature brief,
make worktree setup the first action. Inspect only the Git and worktree state
needed to route the task. Do not read repository files, start discovery or
research, or ask shaping questions before the task has an isolated linked
worktree.

Continue when the session is already rooted in, or Pi is already routed to, the
task's linked worktree. Otherwise, derive a short task branch from the brief and
use the available worktree lifecycle tool to create and activate it. If no safe
worktree tool is available, stop before any other Shape work and ask the human
to start or select an isolated worktree. Never work in the main-branch checkout.
Keep the same task worktree through Shape, planning, and serial implementation;
separate worktrees are only for explicitly parallel writers.

Do not add orchestration or subagent requirements.

## Understand the request

Read repository instructions and the nearest relevant source, tests, and docs.
Use the `question` tool for decisions only the human can make. If the tool is
unavailable, ask the same focused question in conversation. Group related
questions, recommend one option, and explain the material tradeoff. Inspect the
repository instead of asking the human for facts that are already present.

Resolve enough detail to state:

- the problem and desired outcome;
- the appetite and quality floor;
- solution boundaries and no-gos;
- material risks and unknowns;
- observable acceptance criteria.

## Write and approve the pitch

Create `docs/features/<slug>/pitch.md` from `templates/pitch.md` with
`status: draft`. Keep research only when it changes a decision. Prefer the
smallest solution that meets the acceptance criteria.

Show the complete pitch in the `question` tool's document field with these
actions:

1. **Approve and plan** — accept the pitch and create the plan.
2. **Revise** — apply the human's feedback and show the complete pitch again.
3. **Deepen** — investigate one named uncertainty, update the pitch, and show it
   again.
4. **Independent review** — use one fresh read-only reviewer, resolve material
   findings, and show the complete pitch again.

If the tool or its document field is unavailable, show the complete pitch in
conversation and ask the same four-way question. Never use a summary or link in
place of the full document. Do not infer approval from silence or from approval
of a summary.

Only **Approve and plan** is explicit human approval. After approval, change the
pitch to `status: accepted` and invoke
`planning-changes` with the accepted pitch. If implementation later changes
accepted intent, return here, mark the pitch draft, revise it, and obtain fresh
approval before replanning.

## Optional depth

Do not delegate by default. If the human explicitly asks for independent
research or review, use one host-provided role for one bounded read-only lane.
The parent keeps the decision, synthesis, and verification responsibility.
