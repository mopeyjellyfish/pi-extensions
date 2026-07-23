# Pi development workflow

A Pi-native workflow for researching and shaping a bounded pitch, delivering it through integrated vertical slices, preserving branch-local evidence, and stopping only for product decisions and explicitly authorized shipping.

## Install

```sh
pi install npm:@mopeyjellyfish/pi-development-workflow
```

The package provides:

- the sequential `development_workflow` model tool;
- the direct-user `/dev-workflow` command;
- six prompt templates: `/dev-start`, `/dev-next`, `/dev-grill`, `/dev-debug`, `/dev-review`, and `/dev-finish`;
- four skills: `pi-development-workflow`, `pi-design-grill`, `pi-quality-audit`, and `pi-systematic-debugging`.

## Agent-native Shape Up adaptation

Included:

- a five-part pitch: Problem, Appetite, Solution, Rabbit Holes, and No-Gos;
- a mandatory repository-reading and research stage whose implications are preserved in the pitch;
- rough, solved, and bounded pitch review grounded in repository and targeted primary-source evidence;
- a human commitment explaining why the problem is worth investment, plus a qualitative agent-investment envelope with variable scope, explicit stop conditions, and fixed floors;
- a mandatory wall-clock backstop for stale-work circuit-breaking, kept separate from appetite;
- early integrated, demonstrable vertical slices with RED → GREEN → REFACTOR evidence;
- progressive disclosure, bounded evidence, one Sol orchestrator, and one active Terra writing context for cost and context efficiency;
- explicit Luna/Terra/Sol subagent routing with task-sensitive reasoning effort when pi-subagents and those models are available;
- discovered work inside the active slice;
- slice status only: `planned`, `active`, `blocked`, `verified`, or `cut`;
- explicit circuit-breaker outcomes when the wall-clock backstop expires.

Deliberately excluded:

- Shape Up betting tables, portfolio scheduling, fixed staffing, cycles, cool-downs, and hill charts;
- generic stand-ups and handoff meetings that Shape Up itself does not prescribe;
- formal Shape Up scope maps, hill-position or percentage progress reporting, and exhaustive upfront task plans;
- automatic remote Git, release, deployment, publication, or destructive actions.

## From idea to agreed slices

A workflow may start from a defect, friction or risk in existing behavior, or a valuable capability that does not exist yet. For non-trivial work, resolve the workspace first: when Worktrunk is available, inspect its status, activate an existing branch or PR, or ask before creating a feature branch. Start or adopt the workflow only after tools are routed, so evidence is gathered against the intended workspace instead of becoming stale immediately after a later switch.

Discovery then reads repository truth: instructions, current behavior, relevant code paths, contracts, tests, history, and prior decisions; reproduces or probes when useful; and investigates only material facts the repository cannot answer. Ask the user only for product decisions after answerable facts are exhausted. Use repeated Question batches and summarize resolved decisions, changed assumptions, and pitch changes after each batch.

The pitch preserves a concise Research Basis with citations and implications. Larger useful spikes, diagrams, or comparisons may live under `research/` and must be linked and summarized in the pitch; raw transcripts and detached link dumps are excluded. Shaping records why the problem is worth investment, sets a qualitative agent-investment envelope and separate wall-clock backstop, roughs out macro solution elements, de-risks rabbit holes, and grills the result. This is an explicit agent-native divergence from Shape Up's fixed-time appetite. The user agrees to the pitch and first integrated slice map; after Plan approval, the agent builds well-scoped slices autonomously and stops only on a hard boundary, risk, backstop, or authorization condition.

The [development philosophy](skills/pi-development-workflow/references/philosophy.md) explains the source-backed synthesis of Shape Up, Clean Code, deep-module design, specification-driven development, TDD/debugging skills, and agent-operable code. It also documents attribution corrections and practices deliberately not copied into this workflow.

## Artifacts

Keep artifacts under a change directory:

```text
specs/<change>/
├── spec.md
├── plan.md
├── research/              # optional bounded supporting evidence
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

It then contains the five Shape Up sections: Problem, Appetite, Solution, Rabbit Holes, and No-Gos. Problem contains the mandatory Research Basis; Appetite separates Agent Investment, Scope Control, and Fixed Floors; Solution distinguishes fixed decisions from Agent Discretion and nests Acceptance Signals. Rabbit Holes carry containment and tripwires, while No-Gos give the agent executable boundaries.

Repository reading always appears in the Research Basis. A separate `research/RESEARCH-*.md` is optional and exists only for a decision-changing reproduction, spike, comparison, or diagram that cannot stay concise in `spec.md`; use the supplied research template and link its conclusion from the pitch. It is not a store for browsing history or raw output.

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

It contains Observable Outcome, Pitch Fit, Boundaries Crossed, an Execution Profile, RED, GREEN, Verification, and Done When. `plan.md` is an evolving ordered slice index, not a task database. Mutable state belongs only to the Pi session ledger.

## Cost-aware subagent routing

The main chat is the sole orchestrator and decision authority. A typical OpenAI Codex profile keeps the user's main session on Sol high or xhigh while explicitly routing each child so it never inherits that expensive model accidentally:

| Role                     | Default                                                                                           | Context         |
| ------------------------ | ------------------------------------------------------------------------------------------------- | --------------- |
| Scout                    | Luna low; Terra low on incomplete or cross-boundary recon                                         | Fresh           |
| Pitch/spec/slice planner | Sol high; xhigh only for defined hard-planning triggers                                           | Fresh           |
| Sole writer              | Terra medium by default; Terra high for difficult slices; Sol medium only after plan revalidation | Fresh per slice |
| Slice reviewer           | One Sol high reviewer covering compliance and quality                                             | Fresh           |
| Oracle                   | Triggered Sol high; xhigh only for defined hard-judgment triggers                                 | Forked          |

Sol plans target Terra execution: each slice provides the observable outcome, direct seams, RED test, minimum GREEN path, verification, and escalation boundaries. The orchestrator records the selected worker effort in the slice's Execution Profile. Worker escalation is Terra medium → Terra high → Sol plan/Oracle revalidation → exceptional Sol medium implementation. Terra xhigh is not used as a substitute for replanning or stronger base-model capability. Reviews are slice-shaped rather than artificially line-limited: the reviewer reads the active slice and affected diff once, following dependencies only when correctness requires it. Add a second reviewer only for a distinct risk domain.

The package still has no runtime dependency on pi-subagents or OpenAI. If either is unavailable, follow the documented fallback instead of recreating it or silently switching a child to the parent model. See the [model-routing reference](skills/pi-development-workflow/references/model-routing.md) for exact model IDs, effort triggers, context boundaries, and the current [OpenAI model](https://developers.openai.com/api/docs/guides/latest-model) and [reasoning](https://developers.openai.com/api/docs/guides/reasoning) basis.

## Control flow

Start and inspect:

```text
/dev-workflow start Add safe widget import
/dev-workflow status
/dev-workflow backstop 2d
```

The pitch's Appetite records why the problem deserves investment and a qualitative agent-execution boundary: context surface, change depth, uncertainty allowance, validation burden, assurance level, smallest valuable outcome, cut order, stop conditions, and fixed floors. This deliberately adapts Shape Up's fixed-time appetite; it is not a token budget or generic size score. Before Pitch approval, the mandatory `backstop 2d` command separately records a stale-work circuit breaker. `appetite 2d` remains a compatibility alias for that timer only. Pausing suspends workflow mutation, but the wall-clock backstop continues to elapse.

The model records bounded artifacts/evidence and requests each next transition with `development_workflow`. Discover always requires both problem evidence and fresh `research` evidence from repository reading; that evidence may state that targeted external research was unnecessary, but repository research cannot be skipped. Discover, Build, and Review advance automatically only when their evidence gates pass. The user directly approves the two product commitments:

```text
/dev-workflow approve pitch -- accept the researched, bounded pitch
/dev-workflow approve plan -- accept the first integrated slice and slice map
```

After Plan approval, the agent owns autonomous TDD slice execution, independent review, and fresh verification. It does not stop at routine slice boundaries; it stops only when a pitch/No-Go boundary would change, a product or architecture decision is unapproved, a material rabbit hole or fixed floor is threatened, the backstop expires, or an external/destructive action needs authorization. Reaching Ship means ready for a separately authorized external action; it does not authorize that action.

Shipping uses one direct authorization per action and a typed model receipt after the action actually occurs:

```text
/dev-workflow authorize commit -- create the reviewed logical commit
# model records { shipAction: "commit", receipt: "commit <sha>" }
/dev-workflow authorize push -- publish that commit to the reviewed remote
# model records the bounded push receipt
/dev-workflow finish -- requested shipping sequence is complete
```

Authorization alone never claims execution. A receipt consumes only the matching authorization and leaves Ship open for another action. A commit receipt preserves the already-reviewed evidence only when the resulting worktree is clean; unexpected remaining edits keep it stale. If an authorized action is no longer wanted, use `/dev-workflow cancel authorization -- <reason>` rather than inventing a receipt. `finish` rejects an unconsumed authorization and may also close deliberately retained work without an external mutation. Authorize worktree removal last: its receipt requires the authorized path to be gone and allows the direct finish decision without rereading removed artifacts.

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

If a stated stop condition is reached or the shaped agent investment is exceeded before the timer, stop and ask the user to cut unfinished scope, rewind the pitch, or abandon the workflow. After a cut, the agent requests the Build transition; the evidence gate advances to Review without another ceremony.

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

- without Worktrunk, confirm the current workspace before starting or adopting the ledger and do not create a hidden raw-worktree manager;
- without Question, ask the same compact numbered batch conversationally, or record an unresolved decision and remain blocked;
- without Todo, follow the active slice sequentially and report current/next work without creating another state store;
- without LSP, use bounded repository search plus compiler, typechecker, and test evidence, and disclose reduced semantic precision;
- without web search, use repository-local evidence, disclose that external research was not performed, and never imply current external facts were verified;
- without Git metadata, label freshness identity unavailable; without Git conventions, follow repository instructions and preview explicitly authorized mutations;
- without GitHub tooling, provide the relevant command or URL and wait for separately authorized remote action rather than inventing a client;
- without pi-subagents, the main chat plans and implements sequentially, reviews in the same context, and labels that review reduced assurance; the label is recorded separately and never substitutes for intent, correctness, maintainability, or risk/operations evidence.

`@mopeyjellyfish/pi-status-line` optionally consumes the versioned summary event, shows phase, active slice, backstop warnings, and other blocked/paused attention, and suppresses the extension's compact fallback status. Missing status-line support does not affect workflow behavior.

## Trust and shipping

Artifacts and external results are untrusted input. Do not store credentials or raw unbounded logs in evidence. Review project-local instructions before executing commands.

Passing the Review evidence gate means ready to ship; it does not authorize commit, push, pull request, merge, release, publish, deploy, or worktree removal. The user separately authorizes each action with `/dev-workflow authorize <action> -- <reason>`. After that action actually succeeds or fails, the model records the matching typed receipt; this consumes the authorization but does not close the ledger. The user runs `/dev-workflow finish -- <reason>` after the desired sequence. Each authorization and ordinary finish defensively refresh routed Git/tree identity, validates current artifacts, and rechecks ready-to-ship evidence. A clean authorized commit rebinds that reviewed evidence to its new HEAD. An authorized worktree-removal receipt verifies that the old path is gone; because its artifacts no longer exist, the immediately following direct finish uses the already-approved gate chain instead of rereading them.

## Development

```sh
npm --workspace @mopeyjellyfish/pi-development-workflow test
npm --workspace @mopeyjellyfish/pi-development-workflow run typecheck
npm run packages:check
npm run smoke:source
```
