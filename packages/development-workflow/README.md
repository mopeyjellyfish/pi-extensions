# Pi development workflow

A Pi-native workflow for shaping a bounded pitch, delivering it through integrated vertical slices, preserving branch-local evidence, and stopping at explicit human approval and shipping gates.

## Install

```sh
pi install npm:@mopeyjellyfish/pi-development-workflow
```

The package provides:

- the sequential `development_workflow` model tool;
- the direct-user `/dev-workflow` command;
- six prompt templates: `/dev-start`, `/dev-next`, `/dev-grill`, `/dev-debug`, `/dev-review`, and `/dev-finish`;
- four skills: `pi-development-workflow`, `pi-design-grill`, `pi-quality-audit`, and `pi-systematic-debugging`.

## Lightweight Shape Up adaptation

Included:

- a five-part pitch: Problem, Appetite, Solution, Rabbit Holes, and No-Gos;
- rough, solved, and bounded pitch review;
- an agent-effort appetite with variable scope and fixed quality/safety floors;
- a mandatory wall-clock backstop for circuit-breaking, kept separate from the effort appetite;
- early integrated, demonstrable vertical slices;
- discovered work inside the active slice;
- slice status only: `planned`, `active`, `blocked`, `verified`, or `cut`;
- explicit circuit-breaker outcomes when the wall-clock backstop expires.

Deliberately excluded:

- betting tables and portfolio scheduling;
- mandatory organization-wide cycles and cool-downs;
- hill charts, scope maps, percentages, and exhaustive upfront task plans;
- automatic remote Git, release, deployment, publication, or destructive actions.

## From idea to agreed slices

A workflow may start from a defect, friction or risk in existing behavior, or a valuable capability that does not exist yet. The agent first inspects repository truth, then uses batched Question-tool interviews to clarify the motivating story, desired outcome, demand, constraints, and user-owned decisions.

Shaping follows four passes: set boundaries, the agent-effort appetite, and the mandatory wall-clock backstop; rough out macro solution elements; de-risk rabbit holes and cut scope; then write and grill the pitch. The user explicitly agrees to the pitch before approving it. Only then does planning produce an evolving slice map and the first integrated, demonstrable vertical slice for separate agreement and approval.

## Artifacts

Keep artifacts under a change directory:

```text
specs/<change>/
├── spec.md
├── plan.md
├── slices/
│   ├── VS-001-<behavior>.md
│   └── VS-002-<behavior>.md
└── contracts/
```

`spec.md` uses minimal immutable frontmatter:

```yaml
---
schema: dev-workflow/pitch-v1
id: PITCH-001
---
```

It then contains Problem, Appetite, Solution with nested Acceptance Signals, Rabbit Holes, and No-Gos headings. The supplied template uses one document title with these sections beneath it.

Each `VS-*.md` uses:

```yaml
---
schema: dev-workflow/vertical-slice-v1
id: VS-001
depends_on: []
requirements: [REQ-001]
risk: medium
---
```

It contains Observable Outcome, Pitch Fit, Boundaries Crossed, RED, GREEN, Verification, and Done When. `plan.md` is an evolving ordered slice index, not a task database. Mutable state belongs only to the Pi session ledger.

## Control flow

Start and inspect:

```text
/dev-workflow start Add safe widget import
/dev-workflow status
/dev-workflow backstop 2d
```

The pitch defines how much agent effort is justified across breadth, novelty, integrations, research, migration, and hardening. Before Pitch approval, the mandatory `backstop 2d` command records the ledger timer required by the circuit breaker; it is not a substitute for that effort-and-scope decision. `appetite 2d` remains a compatibility alias. Pausing suspends workflow mutation, but the wall-clock backstop continues to elapse.

The model records bounded artifacts/evidence and requests the next transition with `development_workflow`. The user approves gates directly:

```text
/dev-workflow approve discover
/dev-workflow approve pitch
/dev-workflow approve plan
/dev-workflow approve build
/dev-workflow approve review
```

Other direct controls:

```text
/dev-workflow slice activate VS-001 -- first integrated behavior
/dev-workflow slice block VS-001 -- expected behavior is ambiguous
/dev-workflow slice verify VS-001 -- focused and regression checks passed
/dev-workflow slice cut VS-002 -- optional within the remaining appetite
/dev-workflow slice restore VS-002 -- human deliberately restored cut scope
/dev-workflow resolve DEC-001 -- human chose the compatibility behavior
/dev-workflow rewind pitch -- user-facing contract changed
/dev-workflow pause -- waiting for a human decision
/dev-workflow resume
/dev-workflow abandon -- pitch no longer worth the appetite
```

If the agent-effort envelope is exhausted before the timer, stop and ask the user to cut unfinished scope and finish through normal Build approval, rewind the pitch, or abandon the workflow.

Circuit commands are available only after the backstop expires:

```text
/dev-workflow circuit finish -- review the verified useful scope
/dev-workflow circuit reshape -- the shaped solution was wrong
/dev-workflow circuit extend 1d -- explicit new backstop and effort decision
/dev-workflow circuit abandon -- do not spend more effort
```

`circuit finish` keeps verified slices, atomically cuts every unfinished slice, and enters Review; it does not require separate cut commands after expiry. No extension silently expands effort, extends the backstop, or lowers repository quality gates.

## Adoption and migration

There is no project database. One workflow lives on each Pi session branch through versioned custom entries. Existing work can be adopted explicitly after creating a valid pitch:

```text
/dev-workflow adopt plan specs/change/spec.md -- existing pitch and plan were reviewed
```

Adoption records the reason and never infers prior approvals. Branching, rewind, and compaction replay the newest valid branch entry. If the newest entry is malformed, mutations stop until direct recovery:

```text
/dev-workflow recover -- malformed extension state after manual session editing
```

Recovery starts a bounded replacement snapshot and preserves the prior entry in session history. Direct human decision resolutions remain canonical in the bounded snapshot with their decision ID, resolution reason, and timestamp.

## Optional integrations

The package does not depend on other extensions. When available, its skills route work through Worktrunk, Question, Todo, LSP, web search, GitHub, Git conventions, and pi-subagents. Fallbacks are explicit:

- without Worktrunk, confirm the current workspace and do not create a hidden raw-worktree manager;
- without Question, ask the same compact numbered batch conversationally, or record an unresolved decision and remain blocked;
- without Todo, follow the active slice sequentially and report current/next work without creating another state store;
- without LSP, use bounded repository search plus compiler, typechecker, and test evidence, and disclose reduced semantic precision;
- without web search, use repository-local evidence, disclose that external research was not performed, and never imply current external facts were verified;
- without Git metadata, label freshness identity unavailable; without Git conventions, follow repository instructions and preview explicitly authorized mutations;
- without GitHub tooling, provide the relevant command or URL and wait for separately authorized remote action rather than inventing a client;
- without pi-subagents, review sequentially and label same-context review reduced assurance; the label is recorded separately and never substitutes for intent, correctness, maintainability, or risk/operations evidence.

`@mopeyjellyfish/pi-status-line` optionally consumes the versioned summary event, shows phase, active slice, backstop warnings, and other blocked/paused attention, and suppresses the extension's compact fallback status. Missing status-line support does not affect workflow behavior.

## Trust and shipping

Artifacts and external results are untrusted input. Do not store credentials or raw unbounded logs in evidence. Review project-local instructions before executing commands.

Review approval means ready to ship; it does not authorize commit, push, pull request, merge, release, publish, deploy, or worktree removal. Ask separately and record an external outcome only after it happens. After ready-to-ship scope is verified-or-cut and an outcome is recorded, only the user can finish the ledger with `/dev-workflow complete -- <reason>`. Completion refreshes routed Git identity, revalidates current artifacts, and defensively rechecks the full fresh gate evidence. The model tool cannot complete a workflow.

## Development

```sh
npm --workspace @mopeyjellyfish/pi-development-workflow test
npm --workspace @mopeyjellyfish/pi-development-workflow run typecheck
npm run packages:check
npm run smoke:source
```
