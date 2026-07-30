---
name: shape
description: >-
  Starts or resumes an isolated feature from a brief through a human-approved
  Shape Up pitch, an ordered vertical-slice plan, implementation, review, and
  delivery preparation. Use for end-to-end feature work, not narrow fixes or
  review-only requests.
---

# Shape

Coordinate one feature with Worktrunk, Markdown, and Git. Worktrunk is the only
worktree lifecycle authority. The durable feature artifacts are
`docs/features/<slug>/pitch.md` and `docs/features/<slug>/plan.md`.

## Route before writing

With a brief, derive a short canonical slug and expected `feat/<slug>` branch.
Read repository instructions and bounded Git facts, resolve an ambiguous base or
dirty checkout with the human, then use Worktrunk to create or activate the
route. Verify the routed branch with `git branch --show-current`; write no
feature artifact before that route is active.

Without a brief, call Worktrunk with `action: "status"`, then use its active path
for the same bounded Git branch query. An active `feat/<slug>` branch maps
directly to `docs/features/<slug>/`. If no feature route is active, call
Worktrunk with `action: "list"` and ask the human to choose among existing
`feat/*` worktrees. Activate and verify only that choice. If none exists, ask
for a feature brief. Do not expect Worktrunk status to return a branch, inspect
candidate artifacts, or replace Worktrunk with raw `git worktree` lifecycle
commands.

## Shape and approve the pitch

Create `pitch.md` from `templates/pitch.md`. Learn what the brief, repository,
tests, history, documentation, small experiments, and material primary sources
can answer before asking the human. Ask only unresolved decisions that can
change the pitch, with a recommendation and meaningful tradeoffs.

Keep the complete pitch useful to humans and agents. Retain decision-relevant
research, embed exact normative contracts, use Mermaid when it clarifies a flow,
and include cross-functional boundaries only when material.

Before implementation, send the complete pitch to a separate read-only reviewer
for value, feasibility, simplicity, contradictions, and missing decisions. Fix
material findings, repeat review when the fix warrants it, then show the human
the complete pitch document for one explicit human approval. Never substitute a
summary or link. If the current interface cannot show the complete document,
stop without accepting it. After approval, change only `status: draft` to
`status: accepted` and create `plan.md`.

## Plan vertical slices

Create one `plan.md` from `templates/plan.md`. Order the smallest coherent set of
vertical outcomes. Each slice should cross the boundaries needed for one
observable result and name its relevant public seam, smallest useful test,
implementation route, applicable checks, integrated user or operator path when
one exists, and objective completion conditions.

Use a separate read-only whole-plan review for coverage, verticality,
simplicity, and feasibility. Fix ordinary planning findings without a human
plan-approval gate. Pending slices may be reordered, rewritten, split, merged,
or deleted as implementation teaches more.

## Build or resume

The first unchecked slice is always current or next. If Git is dirty, inspect
its diff and test state and resume that slice; if Git is clean, start it. Read
the accepted pitch, that slice, repository instructions, relevant sources,
tests, and public contracts before editing.

Keep one writer. Add the smallest behavior-focused test that can fail for the
intended reason, implement the minimum behavior, then run focused tests and all
applicable required checks. Exercise a real integrated user or operator path
when the slice exposes one. Request a fresh read-only review of the slice diff;
fix blockers and re-review when necessary.

A blocked slice remains unchecked and records one short
`> Blocked: … Next: …` note. Remove the note when work resumes. Mark the slice
`[x]` only after implementation, appropriate tests, required checks, review, and
applicable integrated QA pass.

When repository instructions and explicit user authority permit a local commit,
include the checkbox update with that slice's delivery changes. Never infer
authority to commit, push, open a pull request, merge, publish, deploy, remove a
worktree, or perform destructive cleanup.

## Material change

If implementation reveals a decision that changes accepted intent, stop. Set
the pitch to `status: draft` before editing it, update the pitch and affected
pending plan, repeat independent review, show the complete revised pitch, and
obtain fresh human approval. After approval, restore `status: accepted` before
planning or Build resumes. Git preserves prior versions; do not create archive
copies.

## Finish

When every slice is checked, report local completion and remaining separately
authorized actions. Do not turn local completion into remote delivery or
cleanup authority.
