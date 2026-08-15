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

## Check prerequisites at activation

At activation, before brief questions, worktree actions, or research, confirm the
flow has the aggregate `question`, `worktree`, and `todo` tools as applicable and
the `simple-english`, `planning-changes`, and `implement` skills. The default
path does not require `pi-subagents` or any specialist role. If a required
companion is absent, stop and report:

```text
Blocked prerequisite: /shape requires the Git aggregate for this flow.
Install it, then retry:
pi install git:github.com/mopeyjellyfish/pi-extensions
```

This package remains independently installable for resource discovery. It does
not claim that standalone installation supplies these operational companions.

## Keep one writer and delegate only for depth

Keep one exclusive active writer lease for the worktree. During shaping, the
controlling Shape agent owns the lease and remains the sole decision-maker.
Shape holds the lease through planning and while it invokes `implement`.
Implement retains a fresh worker for each approved Shape slice and transfers the
lease to that worker. Never permit concurrent writers in one worktree or
ambiguous ownership.

Do not delegate research or review by default. If the human selects a deepening
or independent-review option, call `subagent({ action: "list" })` once and use
only a suitable role from the live inventory. Use Luna `low` for an optional
local scout, Sol `medium` for material external research, and Sol `high` only for
an explicitly requested independent review. Start one fresh, asynchronous,
read-only specialist. Add another only when the human requests a separate
material angle. Every task must include the exact brief or artifact, request
evidence and decision implications, and say: `Do not modify project or source
files.`

Continue direct inspection while an optional specialist runs. Wait only when
its result blocks the selected option. Do not poll or sleep. Synthesize its
evidence before changing the pitch. If optional review is unavailable, report
that the option is unavailable. It does not block the default path, revision,
deepening by direct inspection, approval, or planning.

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

The default path is grouped questions, direct inspection, a complete draft,
human feedback and approval, then the plan. Do not add a routine specialist or
review wait.

After worktree routing, inspect the load-bearing repository sources directly.
Research only unknowns that can change the product decision, solution boundary,
or acceptance criteria. Use current primary sources when an external contract
is material. Synthesize decision implications instead of retaining a research
diary.

Run one evidence-led grouped follow-up with the `question` tool. Present the
repository findings, recommendation, and tradeoffs. Ask only unresolved
questions that can change scope, solution, fixed decisions, rabbit holes,
no-gos, or measurable acceptance criteria. Ask one more grouped follow-up only
when a new material unknown blocks an effective pitch.

Create `pitch.md` from `templates/pitch.md`. Make the complete pitch useful to
humans and agents. Cite material primary sources, preserve exact normative
contracts, and include flows or cross-functional boundaries only when they
clarify a decision. Use the `simple-english` skill in pragmatic mode to revise
the narrative as descriptive text.

Before showing the pitch, check it against the brief, human answers, and
repository evidence for value, feasibility, simplicity, contradictions,
unresolved decisions, and measurable acceptance criteria. Then call the
`question` tool with the complete pitch in its document field and these four
actions:

1. **Approve and plan** — accept the pitch and create the plan now.
2. **Revise** — apply the human's feedback and show the complete pitch again.
3. **Deepen** — investigate one named uncertainty, update the pitch, and show it again.
4. **Independent review** — ask one fresh read-only reviewer to assess the pitch.

This call seeks human feedback before approval. Never use a summary or link in
place of the complete document. If the human selects **Deepen**, prefer targeted
direct inspection and ask a grouped follow-up only when needed. If the human
selects **Independent review**, resolve material findings once and return the
complete revised pitch to the human. Do not repeat review unless the human asks.
Recommend an optional step when a concrete high-impact uncertainty remains, but
do not start it without the human's choice.

Require explicit human approval. If the interface cannot show the complete
document, stop without accepting it. After approval, change only `status: draft`
to `status: accepted`. Invoke `planning-changes` immediately with the accepted
pitch, worktree path, and current lease state.

## Plan vertical slices

Use `planning-changes` and the existing template. Shape owns `plan.md`. Require a
complete delivery map before implementation. The map lists every accepted
vertical slice, its sequential or parallel-safe delivery relation, and material
unknowns with the slice that resolves them.

Check the complete plan once against the accepted pitch for coverage,
verticality, simplicity, feasibility, validation, and objective done conditions.
The plan does not require independent review or additional human approval. If
the human requests plan review, use one fresh read-only reviewer after the plan
exists. Otherwise, accept the plan and current slice when the check passes.

Pending slices may change as implementation teaches more. Apply
`simple-english` in pragmatic mode to plan instructions as procedural text and
supporting context as descriptive text. Preserve required headings, YAML
frontmatter, Markdown checkbox syntax, code, identifiers, commands, paths,
links, and quotes exactly.

## Show progress without blocking work

Use the `todo` tool only as a best-effort progress signal. `plan.md` remains
authoritative. Keep one rolling item:

```text
Shape <slug>: <checked>/<total> — <slice number> <outcome>
```

After plan creation and each slice completion, list todos once. Add the rolling
item when absent or update the single matching item. Preserve unrelated todos.
If another todo is active, keep the Shape item pending. When all slices are
checked, use `Shape <slug>: <total>/<total> — complete` and set it to
`completed`.

If a prefix collision or todo call fails, report it once and continue from
`plan.md`. Do not retry during the same milestone. Never let progress display
work delay implementation or weaken an approval, test, validation, or delivery
check.

## Build or resume

The first unchecked sequential slice is current or next. Inspect Git and the
accepted pitch and slice before continuing. Parallel-safe labels are planning
information and do not start parallel work. If the human requests parallel-safe
slices, use one isolated worktree and one exclusive writer lease for each slice.
State the integration order before launch. Never parallelize overlapping slices
or slices with an unresolved ordering unknown.

After Shape accepts the plan and current slice, Shape invokes `implement` with
the accepted pitch and slice, worktree path, current lease state, integrated path
for the user or operator, required Shape checks, and the material-change rule
that intent changes return to Shape. `implement` owns the fresh worker,
implementation lease transfer, and its implementation method.

When a worker sends a supervisor request, Shape classifies the decision. The
parent answers a routine engineering choice from the accepted pitch, plan, and
repository evidence. Do not interrupt the human for repository facts or a
reversible implementation detail.

Escalate a human-owned product, scope, architecture, safety, privacy, cost, or
authority decision. Use the `question` tool to show the worker's recommendation,
meaningful options, and tradeoffs. After the human answers, reply to the waiting
child through `subagent_supervisor`:

```text
subagent_supervisor({ action: "reply", replyTo: "<request-id>", message: "<decision>" })
```

Use this path for `need_decision` and structured `interview_request` messages.
Never guess while the child waits. If the answer changes accepted intent, use
the material-change flow before implementation continues.

A decision-level finding returns the lease and decision to Shape. After a retained
worker returns its evidence and lease, Shape verifies the implementation evidence
and runs the slice's Shape-specific integrated path and gates. A blocked slice
remains unchecked and records one short
`> Blocked: … Next: …` note. Remove the note when work resumes. Mark the slice
checkbox `[x]` only after the returned evidence and Shape-specific gates pass,
then attempt one rolling todo update. If that update fails, keep the durable
checkbox checked and continue without retrying at this milestone.

When repository instructions and explicit user authority permit delivery, the
Shape parent updates the checkbox, returns to `implement`, and applies
`conventional-commit` and `github-cli` for the authorized commit, branch push,
and existing pull request checks. A worker never edits `plan.md`, commits, or
pushes. Never infer authority to commit, push, open a pull request, merge,
publish, deploy, remove a worktree, or perform destructive cleanup.

## Material change

If implementation reveals a decision that changes accepted intent, stop the
writer and return the exclusive writer lease to the controlling parent. Before
any other implementation, set the pitch to `status: draft`, update the full
pitch and every affected plan slice, show the complete revised pitch, and obtain
fresh human approval. Offer the same optional deepening and independent-review
actions. After approval, restore `status: accepted` before planning or Build
resumes. The changed contract invalidates the old implementation context. After
reapproval and replanning, pass the `invalidated contract` state and the
parent-held lease to `implement`. Git preserves prior versions; do not create archive copies.

## Finish

Do not review individual slices. When every slice is checked, run the plan-wide
integrated path and required test, lint, type, and static checks. Report the
feature as ready for human pull request review. Run one final review of the
complete feature diff only when the human requests it or repository instructions
require it. Use one fresh Sol `high` reviewer and one repair pass. Do not review
the repair again unless the human asks.

Run a final todo reconciliation. After a successful reconciliation, the rolling
item reads `Shape <slug>: <total>/<total> — complete` and is `completed`. Report
local completion and remaining separately authorized actions. Do not turn local
completion into remote delivery or cleanup authority.
