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
Read repository instructions, resolve a material base choice with the human,
then call the `worktree` tool to create or activate the route. Verify its
returned worktree branch; write no feature artifact before that route is active.

Without a brief, call `worktree({ action: "status" })`, then
`worktree({ action: "list" })`. Match the status active path to the worktree list entry and use that
entry's branch. If the matching entry is omitted by truncation, follow the
`pi-worktrunk` skill's complete-list guidance. An active `feat/<slug>` branch
maps directly to `docs/features/<slug>/`. If no feature route is active, ask the
human to choose among listed `feat/*` worktrees, then activate and verify only
that choice. If none exists, ask for a feature brief. Do not inspect candidate
artifacts or replace the `worktree` tool with direct Git worktree commands.

## Shape and approve the pitch

Create `pitch.md` from `templates/pitch.md`. Whether the brief is specific or
broad, research before settling the pitch. Start with repository truth, then
delegate bounded current or external topics to specialist researcher subagents;
parallelize only independent topics. For a named framework, inspect current
primary documentation, compatibility, established patterns, and material risks.
For a broad feature, investigate relevant prior art, product and technical
options, failure boundaries, and unknowns. Scale the work to uncertainty rather
than researching for ceremony.

Synthesize source-backed implications instead of retaining raw research output.
Use them to inform the human, improve recommendations and tradeoffs in questions,
and shape the pitch. Ask only unresolved decisions that can still change the
pitch. Keep the complete pitch useful to humans and agents: cite material primary
sources, embed exact normative contracts, use Mermaid when it clarifies a flow,
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
