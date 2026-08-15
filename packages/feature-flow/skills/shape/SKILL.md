---
name: shape
description: >-
  Turns a fuzzy feature request into an explicitly accepted pitch, then hands
  the accepted intent to planning-changes.
---

# Shape

Use the direct parent as the default executor. Shape the request in the current
workspace; do not create orchestration, worktrees, or subagent requirements.

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

Show the complete pitch to the human. Ask for explicit human approval or
revision. Do not infer approval from silence or from approval of a summary.

After approval, change the pitch to `status: accepted` and invoke
`planning-changes` with the accepted pitch. If implementation later changes
accepted intent, return here, mark the pitch draft, revise it, and obtain fresh
approval before replanning.

## Optional depth

Do not delegate by default. If the human explicitly asks for independent
research or review, use one host-provided role for one bounded read-only lane.
The parent keeps the decision, synthesis, and verification responsibility.
