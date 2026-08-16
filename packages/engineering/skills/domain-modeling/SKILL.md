---
name: domain-modeling
description: >-
  Model domain language from repository context, concrete scenarios, and
  cross-referenced code without inventing unnecessary architecture.
---

# Domain modeling

Before any repository write, verify that the session is rooted in, or Pi is
routed to, an isolated linked worktree for this task. Never create or update
`CONTEXT.md` or an ADR in the main-branch checkout. Use the available worktree
lifecycle tool to create or activate the task worktree when needed. If safe
worktree tooling is unavailable, stop before writing and ask the human to
provide an isolated worktree.

Use the nearest `CONTEXT.md` as the source of ubiquitous language: the shared
terms used by users, docs, and code. Read it before naming concepts. If the
target project has none, create a concise file only when the work needs shared
terms.

1. List the concepts needed for the requested change. Give each concept one
   term and a short meaning.
2. Challenge conflicts with existing names, code identifiers, and user words.
   Prefer the nearest established term, or record why a new term is necessary.
3. Test each term with concrete scenarios, including boundaries and failure
   cases. A term that cannot describe behavior clearly is not ready.
4. Cross-reference the terms against code, tests, schemas, and docs. Point out
   mismatches instead of silently renaming unrelated code.
5. Update the glossary inline in the nearest `CONTEXT.md` when a term is
   accepted. Keep it concise and preserve the repository's language.

Offer an architecture decision record (ADR) only for a durable rejected choice
or a decision that is difficult to reverse. Do not create an ADR for ordinary naming, transient exploration,
or a decision already captured by the code and context. Return accepted terms,
scenario evidence, code references, conflicts, and any ADR recommendation.
