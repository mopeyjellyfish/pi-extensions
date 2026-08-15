# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` is a Markdown-resource Pi package for shaping
one feature in an isolated Worktrunk worktree and turning accepted intent into a
plan. It ships `shape` and `planning-changes`, the `/shape` and `/plan` prompts,
and Shape templates. It registers no extension, service, agent, or runtime
dependency.

The workflow relies on the `question`, `worktree`, and `todo` tools and the
`simple-english` skill supplied by this repository's aggregate package. The
default shaping-and-planning path does not launch a subagent. Implementation,
optional specialist research, and independent review use `pi-subagents`. This
package is not a standalone feature-flow install.

## Use

Start naturally with an end-to-end feature brief or run:

```text
/shape let users resume interrupted uploads
```

Run `/shape` without arguments to be asked for the feature brief. The skill does
not call the `worktree` tool until that answer is specific enough to derive the
`feat/<slug>` branch. To resume existing work, identify it in the request, for
example `/shape resume resumable uploads`.

Run `/plan <accepted intent>` to create or update the smallest ordered vertical
slices from explicit accepted intent or an accepted Shape pitch. Planning uses
the existing plan template, inspects repository truth, and names each slice's
observable outcome, public seam, focused validation, integrated path, checks,
and objective done conditions. An accepted slice is handed to the aggregate's
`implement` skill; feature-flow does not copy its execution policy.

Shaping keeps the routine path short:

1. The `question` tool groups up to four material brief questions before
   worktree routing.
2. Direct repository inspection informs one grouped follow-up for unresolved
   decisions.
3. Shape writes and checks the complete pitch.
4. One whole-document question seeks feedback and offers **Approve and plan**,
   **Revise**, **Deepen**, or **Independent review**.
5. Approval accepts the pitch and starts planning immediately.

Deepening and independent review are optional. Shape discovers and launches one
fresh read-only specialist only after the human selects an option that needs
one. An unavailable reviewer blocks only that optional branch. It does not
block revision, direct deepening, approval, or planning. The controlling Shape
parent remains the sole decision-maker and owns the exclusive writer lease.

Each feature keeps two durable files:

```text
docs/features/<slug>/
├── pitch.md
└── plan.md
```

`pitch.md` is the complete human- and agent-readable Shape Up contract. Shape
checks the draft against the brief, evidence, and acceptance criteria. The human
then gives feedback and explicit whole-document approval. A material intent
change stops the writer, returns the lease to the parent, changes the pitch to
draft, updates the full pitch and affected plan, and repeats whole-document
human approval. Optional deepening and independent review remain available. The
changed contract invalidates the old implementation context, so Shape replans
and invokes `implement` with fresh context. Git preserves history.

`plan.md` contains the complete delivery map for the accepted pitch. It lists
every vertical slice, sequential order, parallel-safe relationships, and
material unknowns with the earliest slice that resolves them. Delivery is serial
by default. Parallel-safe slices run in parallel only when the human requests it
and each writer has an isolated worktree.

Shape checks the plan once for traceability, verticality, simplicity,
feasibility, validation, and done conditions. It does not require independent
review or separate human approval. Each Shape slice goes to one fresh Sol
`medium` worker. Sol `high` is reserved for the risk cases named by `implement`.
The worker checks its own result against the complete slice, tests, lint or
static checks, integrated path, and done conditions. Shape checks a slice only
after that evidence and its own verification pass.

Workers use the 30-minute runtime default without hard turn or tool-count
budgets. Interactive Shape sessions use asynchronous completion notifications
instead of holding a blocking wait. If a worker needs an unapproved decision,
Shape answers routine engineering questions. It asks the human about product,
scope, architecture, safety, privacy, cost, or authority, then replies to the
waiting worker.

Shape does not review individual slices. After all slices pass, it runs the
plan-wide integrated path and required checks. The human reviews the pull
request and can request one final Sol `high` review of the complete feature diff.

Shape uses one rolling session todo item as a best-effort display of `plan.md`
progress. It updates the item after plan creation and each slice completion and
preserves unrelated todos. A todo failure reports once, does not retry during the
same milestone, and does not block work from `plan.md`.

Worktrunk alone owns worktree lifecycle. Local commits and every push, pull
request, merge, publication, deployment, cleanup, or worktree removal remain
separately authorized by repository instructions and the user.

## Install

Install the repository aggregate for the default flow:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

Install `pi-subagents` for implementation workers, optional specialist
research, or independent review:

```sh
pi install npm:pi-subagents
```
