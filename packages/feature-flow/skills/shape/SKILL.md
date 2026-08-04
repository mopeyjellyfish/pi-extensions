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
`docs/features/<slug>/pitch.md` and `docs/features/<slug>/plan.md`. The accepted
pitch defines intent, the current `plan.md` defines slice membership, order, and
check state, and Git provides durable history and resume evidence.

## Orchestrate read-only specialists

The controlling Shape agent is the sole writer for the active worktree. Keep
all specialist subagents advisory.

Before the first delegation, call `subagent({ action: "list" })` once to discover
the live agent inventory when the `subagent` tool is available. Use only roles
from that inventory. Prefer `scout` for local context, `researcher` for material
external evidence, `context-builder` for a broad handoff, and `reviewer` for
independent review. Use an equivalent discovered role when a preferred role is
absent. Never invent a role.

For each research stage, use zero to three specialists. Add a specialist only
for a distinct angle that uncertainty, scope, or risk makes useful. Stop when
the evidence is sufficient. For each required review, use one to three
specialists. Start with one reviewer. Add another only for a separate material
risk. Parallelize only independent topics.

Run every advisory assignment with fresh context and asynchronous execution.
Give the child the exact brief, artifact, diff, or question. Require evidence,
source links or file references, gaps, and decision implications. Every task
must say: `Do not modify project or source files.` Require the child to escalate
human-owned product, scope, architecture, and safety decisions.

Continue useful local inspection or preparation while children run. Wait on the
returned run identifier only when the results block synthesis. Do not poll or
sleep. Synthesize specialist evidence before any decision or edit. Keep raw
child output ephemeral unless its size or a real handoff need justifies a saved
artifact.

If the `subagent` tool or a suitable research role is unavailable, do the
research in the controlling agent and record the gap. If the `subagent` tool or
a suitable independent reviewer is unavailable, stop at the affected pitch,
plan, or slice gate. Never replace required independent review with self-review.

If a child fails, inspect its status and available output. Retry once with a
narrower task when the missing evidence is material. Continue without that
angle only when the remaining evidence is sufficient and the failed angle is
not a required independent review.

## Establish the brief, then route

For new shaping, run an initial questioning pass before any worktree call. Use
the `question` tool to grill the brief constructively. If no usable brief was
supplied, ask the human for one and stop before calling the `worktree` tool. Ask
one to four material questions in one call. Group them when their answers can be
considered together. Give a recommended option and meaningful tradeoffs. Ask only what the
human can decide; do not ask for facts that repository inspection or research
can answer.

Confirm the affected people, problem, desired outcome, appetite, hard
constraints, and no-gos at the level needed to understand and name the feature.
Challenge vague or solution-first answers without forcing a fixed questionnaire.
If a question redirects to conversation, address it and continue with the
returned continuation ID. For new work, do not call the `worktree` tool until
the answers provide enough information to derive the canonical slug and
`feat/<slug>` branch. Never create or choose a worktree from an invented name.
For an explicit resume request that identifies an accepted feature, use that
identifier to route without reopening settled decisions unless the human asks to
reshape them.

Once the brief exists, read repository instructions and resolve a material base
choice with the human. For new work, call the `worktree` tool to create or
activate the derived branch and verify its returned worktree branch. For an
explicit resume request, call `worktree({ action: "status" })`, then
`worktree({ action: "list" })`. Match the status active path to the worktree list
entry and use that entry's branch. If the matching entry is omitted by
truncation, follow the `pi-worktrunk` skill's complete-list guidance. Activate
and verify only the matching `feat/<slug>` route. Write no feature artifact
before that route is active. Do not inspect candidate artifacts or replace the
`worktree` tool with direct Git worktree commands.

## Shape and approve the pitch

Research the confirmed brief and initial answers before creating `pitch.md`.
Whether the brief is specific or broad, start with direct inspection of
load-bearing repository sources. Use a local-context specialist when a separate
code-path, test, history, or risk angle can reduce uncertainty. Use an external
research specialist when current primary documentation, standards,
compatibility, or prior art is material. Use a broad context builder only when
it prevents substantial rediscovery. For a broad feature, investigate relevant
product and technical options, failure boundaries, and unknowns. Scale the work
to uncertainty rather than researching for ceremony.

Synthesize source-backed implications instead of retaining raw research output.
Use them to inform the human, then run a second questioning pass with the
`question` tool. Present findings, a recommendation, and meaningful tradeoffs.
Ask one to four unresolved questions in one call when possible. Resolve the
solution, fixed decisions, rabbit holes, no-gos, and measurable acceptance
criteria. If an answer exposes a material unknown, do targeted research and ask
one more grouped follow-up only when needed.

After these answers give the full picture, create `pitch.md` from
`templates/pitch.md`. Keep the complete pitch useful to humans and agents: cite
material primary sources, embed exact normative contracts, use Mermaid when it
clarifies a flow, and include cross-functional boundaries only when material.
After the content is correct, use the `simple-english` skill in pragmatic mode
to revise the pitch narrative as descriptive text.

Before implementation, send the complete pitch to one fresh read-only reviewer
subagent for value, feasibility, simplicity, contradictions, and missing
decisions. Add up to two more reviewers only for separate material risks. Fix
material findings and repeat review when the fix warrants it. Then call the
`question` tool and use its document field to attach the complete pitch with
concise approve or revise options. This is the human's full-document review.
Never use a summary or link in place of the document. Require explicit human
approval. If the human requests changes, update and re-review material changes,
then present the complete revised pitch again. If the interface cannot show the complete document, stop without
accepting it. After approval, change only `status: draft` to `status: accepted`
and create `plan.md`.

## Plan vertical slices

Create one `plan.md` from `templates/plan.md`. Order the smallest coherent set of
vertical outcomes. Each slice should cross the boundaries needed for one
observable result and name its relevant public seam, smallest useful test,
implementation route, applicable checks, integrated user or operator path when
one exists, and objective completion conditions. Use the `simple-english` skill
in pragmatic mode to revise plan instructions as procedural text and supporting
context as descriptive text. Across the pitch and plan, preserve required
headings, YAML frontmatter, Markdown checkbox syntax, code, identifiers,
commands, paths, links, and quoted text.

Send the whole plan to one fresh read-only reviewer subagent for coverage,
verticality, simplicity, and feasibility. Add up to two more reviewers only for
separate material risks. Fix ordinary planning findings without a human
plan-approval gate.

Keep one `Next slice number: <NNN>` high-water mark in `plan.md`. Assign its
current value to each new or replacement slice, then increase it. Slice numbers
are unique and immutable. Never decrease the high-water mark. Never reuse a
retired number. Pending slices may be reordered without renumbering, rewritten, split,
merged, or deleted as implementation teaches more.

## Mirror vertical slices to todo

Treat the `todo` tool as a best-effort session progress mirror when it is
available. `plan.md` remains authoritative. Track only vertical slices, not
pitch, research, review, commit, or delivery tasks. Use one concise managed item
per slice:

```text
Shape <slug>: <slice number> — <outcome>
```

Reserve the exact `Shape <slug>:` namespace for that feature. Reconcile after
plan creation, after plan changes, before build or resume, after a slice is
checked, and before finish.

Before any todo mutation, list all todos and validate the complete plan and
reserved namespace. Require one valid high-water mark, unique plan numbers below
that mark, well-formed managed items, all managed item numbers below that mark,
and at most one managed item for each slice number. Treat a managed number at or
above the mark as a namespace collision, not a stale slice. Identify stale
managed numbers and any unrelated `in_progress` item. If listing or preflight
fails because an item is malformed, ambiguous, duplicated, or collides with the
namespace, make no todo mutation. Report the exact gap and continue from
`plan.md` and Git.

If a plan predates the high-water mark format, do not automatically migrate it.
Report the missing mark and continue from `plan.md`. Add the mark only through an
explicit reviewed plan change.

After successful preflight, add missing managed items in plan order. Update a
renamed item that keeps its slice number. Mark checked items `completed`, stale
or replaced items `cancelled`, and later unchecked items `pending`. Mark the
first unchecked item `in_progress` only when no unrelated item already has that
status. If an unrelated todo is `in_progress`, keep the first unchecked Shape item
`pending`, leave the unrelated item unchanged, and report the conflict. A blocked slice
keeps its reconciled status while its `> Blocked: … Next: …` note remains in
`plan.md`.

After the first failed todo mutation, stop that reconciliation pass, report the
exact gap, continue from `plan.md` and Git, and retry at the next reconciliation.
Never weaken an approval, test, review, validation, or delivery gate because the
`todo` tool is unavailable or the best-effort instruction fails.

## Build or resume

The first unchecked slice is always current or next. If Git is dirty, inspect
its diff and test state and resume that slice; if Git is clean, start it. Read
the accepted pitch, that slice, repository instructions, relevant sources,
tests, and public contracts before editing.

The controlling Shape agent remains the sole writer. Add the smallest
behavior-focused test that can fail for the intended reason, implement the
minimum behavior, then run focused tests and all applicable required checks.
Exercise a real integrated user or operator path when the slice exposes one.
Send the completed slice diff to one fresh read-only reviewer subagent. Add up
to two more reviewers only for separate material risks. Synthesize findings,
fix blockers, and re-review material fixes.

A blocked slice remains unchecked and records one short
`> Blocked: … Next: …` note. Remove the note when work resumes. Mark the slice
checkbox `[x]` only after implementation, appropriate tests, required checks,
review, and applicable integrated QA pass. Then reconcile its todo to
`completed`. If that update fails, keep the durable checkbox checked, report the
gap, and retry later.

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

When every slice is checked, run a final todo reconciliation. After a successful
reconciliation, no managed slice todo can remain `pending` or `in_progress`.
Report local completion and remaining separately authorized actions. Do not turn
local completion into remote delivery or cleanup authority.
