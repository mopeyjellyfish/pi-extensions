---
name: writing-for-agents
description: Write lean, navigable instructions and handoffs for humans and agents.
---

# Writing for agents

Use this skill when writing a skill, `AGENTS.md`, plan, handoff, or other
agent-facing document. The document must help its reader make the next correct
decision with little searching or interpretation.

## Establish context first

- Find the nearest `CONTEXT.md` and use its vocabulary. If none exists, use the
  repository's nearest README, package instructions, and established names.
- Start with a precise goal. Link to the authoritative source instead of
  restating context that can drift.
- State scope and constraints, including what is out of scope.
- Point to the exact files, commands, APIs, or prior decisions that matter.
  Prefer a short path map over a tour of the repository.

## Make completion checkable

Describe the evidence that proves the goal: tests, command output, screenshots,
links, or an explicit human decision. Define completion criteria that are
observable and bounded. Separate facts, decisions, proposals, and open
questions. A handoff names the current state, the next action, and its owner.

Use this information order unless the document's contract requires another:

1. goal and current state;
2. constraints and fixed decisions;
3. relevant context pointers;
4. ordered work or proposal;
5. evidence and completion criteria;
6. open decisions and risks.

Keep each instruction actionable: actor, action, condition, and result when
those details matter. Remove duplicated rules, stale claims, environment-
obvious setup, and no-op instructions. Keep one source of truth for changing
facts and link to it from summaries. Do not create a second checklist merely to
repeat a durable plan.

## Protect precision

Do not paraphrase exact technical content when precision matters. Preserve
identifiers, paths, commands, configuration keys, schema, protocols, error
messages, version ranges, and code blocks exactly. Mark untrusted or illustrative
examples as such. Do not invent missing context: ask for it or state the gap.

Use headings that answer the reader's navigation question. Put the decision or
next action near the top when the reader is blocked. Use short paragraphs,
lists, and examples only when they remove ambiguity. Prune every sentence that
cannot change understanding or action.

Before handing off, check that a fresh reader can identify the goal, constraints,
source of truth, current state, next decision, and proof of completion without
following unnecessary links. Update the authoritative document, not a stale
summary.
