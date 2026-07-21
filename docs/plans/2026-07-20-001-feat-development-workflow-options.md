# Development workflow package options

**Status:** recommendation for discussion

**Branch:** `feat/development-workflow`

**Scope:** ideation and research → specification → plan → TDD build → review → ship

## Recommendation

Add **one new mixed Pi package**, tentatively
`@mopeyjellyfish/pi-development-workflow`, and extend the existing status-line
package as an optional consumer.

The new package should contain:

- one collision-resistant workflow router plus focused design-grill and
  quality-audit skills, all using progressive references;
- five thin `dev-*` prompt entry points that inspect ledger state instead of
  duplicating skill bodies;
- one narrow TypeScript extension for typed workflow state, structural gates,
  session-branch replay, a command/tool entry point, and a versioned status
  event;
- no worktree manager, task tracker, subagent runner, GitHub client, Git policy,
  or custom footer;
- no automatic commit, push, pull request, merge, publish, deploy, or worktree
  removal.

Keep the methodology and runtime together for the final integrated product. The
methodology is useful by itself as a prototype or advisory mode, but a separate
ledger runtime has little meaning without exactly matching stage semantics. One
package lets the skills define each state, question protocol, and quality gate
while the extension makes the sequence inspectable and mechanically valid. Keep
the engineering-practice
references inside this package for now. Extract them only if another independently
useful package later needs the same public guidance.

Do **not** import all of Flywheel or BigPowers. Re-author the compact workflow
from primary sources and selected patterns. Flywheel currently has no identified
open-source license, so it is reference material only unless that changes.

## Why this boundary

A Markdown skill can make a process explicit, but it cannot guarantee state
transitions, replay state after session navigation, publish structured UI state,
or distinguish a valid transition from a skipped gate. A TypeScript extension
can do those things, but it should not encode a book-sized methodology or
reimplement orchestration already owned elsewhere.

This repository already has the mechanical building blocks:

- [Worktrunk](../../packages/worktrunk/README.md) owns the main feature
  worktree and routed tool path.
- [Todo](../../packages/todo/README.md) owns within-stage execution items.
- `pi-subagents` owns research, planning, worker, review, validation, async,
  isolation, and review-loop orchestration.
- [Question](../../packages/question/README.md) owns structured human
  clarification.
- [GitHub](../../packages/github/skills/github-cli/SKILL.md) owns safe issue,
  pull request, review, checks, and release CLI guidance.
- [Git conventions](../../packages/git-conventions/skills/conventional-commit/SKILL.md)
  owns branch and commit conventions; its rebase skill owns base updates.
- [Status line](../../packages/status-line/README.md) is the repository's one
  custom-footer integration surface.

The missing capability is therefore a **development lifecycle contract and
state ledger**, not another general agent framework.

## What the prior art actually provides

### Flywheel

[Flywheel](https://github.com/mopeyjellyfish/flywheel/tree/b888b98f92ba723b215aaf620b6ea540bdc5821a)
was reviewed at commit
[`b888b98`](https://github.com/mopeyjellyfish/flywheel/commit/b888b98f92ba723b215aaf620b6ea540bdc5821a)
(2026-05-27). It is primarily a Markdown-skill system with host-specific hooks
and validation scripts. Its core loop is compact: route to the earliest useful
stage, shape, work, review, optionally retain a reusable lesson, and commit. Its
strongest patterns are:

- an earliest-useful-stage router that stops at a handoff;
- explicit handoff fields for stage, artifact, readiness, open decisions,
  evidence, and next action;
- vertical RED → GREEN → REFACTOR slices with documented exceptions;
- fresh-evidence completion claims;
- risk-first review and optional durable lesson capture.

Its complete inventory is much broader—32 skills spanning architecture,
incidents, browser testing, logging, optimization, docs, Git delivery, and
worktrees. Its Bash worktree manager and commit/PR stages overlap packages in
this repository. Its hooks target Claude/Codex-style host contracts, not Pi.
Most importantly, no root license grant was found. Patterns may inform an
independent design; text and code should not be copied.

Primary paths at the reviewed commit:

- [README](https://github.com/mopeyjellyfish/flywheel/blob/b888b98f92ba723b215aaf620b6ea540bdc5821a/README.md)
- [workflow gates](https://github.com/mopeyjellyfish/flywheel/blob/b888b98f92ba723b215aaf620b6ea540bdc5821a/skills/references/workflow-gates.md)
- [TDD skill](https://github.com/mopeyjellyfish/flywheel/blob/b888b98f92ba723b215aaf620b6ea540bdc5821a/skills/tdd/SKILL.md)
- [verification skill](https://github.com/mopeyjellyfish/flywheel/blob/b888b98f92ba723b215aaf620b6ea540bdc5821a/skills/verify/SKILL.md)
- [worktree skill](https://github.com/mopeyjellyfish/flywheel/blob/b888b98f92ba723b215aaf620b6ea540bdc5821a/skills/worktree/SKILL.md)

### BigPowers

[BigPowers](https://github.com/danielvm-git/bigpowers) is an MIT-licensed,
Superpowers-inspired methodology distribution. At reviewed commit
[`84e9658`](https://github.com/danielvm-git/bigpowers/commit/84e9658a982989901f7d80d405153842d2e9bbf6),
it expands the core loop into a stateful Discover → Elaborate → Plan → Build →
Verify → Release lifecycle with many skills, generated host adapters, YAML
cockpit files, shell gates, dashboards, and two MCP implementations.

BigPowers is not currently a Pi extension in the runtime sense. Its
[`.pi/package.json`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/.pi/package.json)
declares generated skills and prompt templates. The deterministic behavior
comes from scripts, hooks, state files, and MCP services whose assumptions do
not automatically hold in Pi.

Useful patterns are typed handoffs, explicit prerequisites, durable artifact
identity, independent review, capability-aware fallbacks, and evidence tied to
worktree/commit identity. Observed drift at this snapshot includes generated Pi
resource issues and internally inconsistent review/workflow counts; see the
[Pi packaging issue](https://github.com/danielvm-git/bigpowers/issues/78),
[review skill](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/request-review/SKILL.md),
and [sync pipeline](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/scripts/sync-skills.sh).
High ceremony, repository pollution, possible state races, overlapping skills,
and aggregate assurance stronger than individual behavioral controls are design
risks to evaluate, not all proven runtime failures; issue
[#71](https://github.com/danielvm-git/bigpowers/issues/71) is one concrete
assurance-gap example.

Primary paths:

- [workflow SOP](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/docs/WORKFLOW-SOP-v2.md)
- [state cockpit](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/specs/state.yaml)
- [TDD skill](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/develop-tdd/SKILL.md)
- [review skill](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/request-review/SKILL.md)
- [release skill](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/release-branch/SKILL.md)

#### Focused clean-code and agentic-quality analysis

BigPowers contains a useful second layer beyond lifecycle mechanics: it treats
code shape, repository operability, context selection, and user questioning as
inputs to agent reliability. That layer should influence the workflow package,
but its strongest ideas must be separated from rigid or unvalidated thresholds.

The most transferable sources are:

- [`grill-me`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/grill-me/SKILL.md)
  and [`grill-with-docs`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/grill-with-docs/SKILL.md)
  for dependent decision interviews and documentation-grounded challenges;
- [`elaborate-spec`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/elaborate-spec/SKILL.md)
  and the current [`plan-work`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/plan-work/SKILL.md)
  flow for ambiguity gates and observable outcomes; the pinned
  [`define-success`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/define-success/SKILL.md)
  skill is archived and absorbed into `plan-work`;
- [`audit-code`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/audit-code/SKILL.md),
  its [Clean Code heuristics](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/audit-code/HEURISTICS.md),
  and the TDD [deep-module](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/develop-tdd/deep-modules.md)
  and [interface-design](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/develop-tdd/interface-design.md)
  references for maintainability questions;
- [`survey-context`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/survey-context/SKILL.md),
  [`research-first`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/research-first/SKILL.md),
  and [context engineering](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/docs/references/context-engineering.md)
  for targeted context acquisition and progressive disclosure;
- [`plan-work`](https://github.com/danielvm-git/bigpowers/blob/84e9658a982989901f7d80d405153842d2e9bbf6/skills/plan-work/SKILL.md)
  for executable vertical plans with verification and risk metadata.

##### Durable quality rules to adopt

1. **Repository operability is part of code quality.** A high-quality project
   has documented, headless setup and validation commands; actionable bounded
   errors; deterministic checks; and no hidden interactive prerequisite for
   routine verification.
2. **Optimize interfaces, not line counts.** Prefer cohesive deep modules, simple
   caller-facing interfaces, explicit invariants, hidden implementation choices,
   and errors defined out of common paths where practical.
3. **Make code searchable and predictable.** Names should reveal intent and side
   effects, public contracts should be explicit, important concepts should use
   stable domain language, and navigation should not depend on gratuitous aliases
   or generated indirection.
4. **Minimize change amplification and cognitive load.** Review how many files,
   modules, states, and facts a change requires the implementer or caller to
   understand. Duplication is a signal, but an abstraction is justified only
   when it hides a stable concept rather than coupling accidental similarity.
5. **Design for behavior-facing tests.** Keep I/O boundaries replaceable, avoid
   mocking internal collaborators, make temporal dependencies explicit, and
   prefer contracts that can be verified without reconstructing implementation
   details.
6. **Treat observability as an agent interface.** Structured, bounded logs and
   remediation-oriented errors help humans and agents diagnose failures without
   flooding context or exposing secrets.
7. **Keep changes surgical.** Improve touched code when the cleanup is small,
   behavior-preserving, and verified. Do not turn the Boy Scout Rule into an
   excuse for unrelated refactoring.
8. **Tie every task to an observable check.** A plan step states the expected
   outcome, exact verification path, and what a failure means; a successful
   command alone does not prove every requirement.

##### Agentic optimization model

Adapt BigPowers' `Write → Select → Compress → Isolate` model as follows:

- **Write:** externalize approved decisions, plans, gate state, and reusable
  findings instead of relying on conversation memory.
- **Select:** read repository instructions and the smallest relevant code/docs;
  answer discoverable facts from the repository instead of asking the user.
- **Compress:** use progressive references, bounded summaries, stable artifact
  links, and filtered command evidence rather than copying raw logs or entire
  files into prompts.
- **Isolate:** keep one writer in the active Worktrunk workspace; use fresh
  contexts for independent research/review and separate worktrees only for
  genuinely parallel writers.

Do not adopt claimed token-reduction percentages as product requirements. Terse
communication is an emergency fallback, not the main optimization. Clear safety
warnings, irreversible-action confirmations, decision options, and ordered
procedures must remain explicit even under context pressure.

##### Rules to adapt or reject

Some BigPowers rules are useful review signals but poor universal gates:

- `4–20`-line functions, fewer than five search hits, maximum nesting depth two,
  and explicit return types everywhere are context-dependent signals, not pass/
  fail criteria.
- the heuristic labels duplication “The root of all evil.” Taken literally,
  this can produce premature abstraction; prefer duplication over the wrong
  shared concept.
- SOLID labels are prompts for examining responsibility and dependencies, not a
  reason to add interfaces or injection layers pre-emptively.
- mandatory failing RED commits can break shared CI and distort history; record
  observed RED/GREEN evidence without requiring a failing commit.
- a synthetic `94%` reviewer score does not measure correctness. Preserve fresh
  independent review and must-fix gates, but use evidence-backed findings rather
  than numeric theatre.
- an unrelated baseline failure should be recorded and escalated according to
  risk; it should not silently expand every task into fixing the whole project.
- BCP and effort labels may help local planning after calibration, but they are
  not code-quality or acceptance evidence.

#### Structured design grilling

The workflow should make disciplined questioning a first-class capability, not
an unbounded conversational ritual.

Use this protocol:

1. Inspect repository instructions, code, current artifacts, and authoritative
   documentation before asking. If the answer is discoverable, find it rather
   than delegating repository archaeology to the user.
2. Build a decision graph: desired outcome, users, boundaries, invariants,
   alternatives, failure behavior, compatibility, rollout, and verification.
3. Ask dependent or consequential decisions **one at a time**. Batch up to four
   only when they are genuinely independent and low-risk.
4. Present two to four concrete options with trade-offs and a recommendation.
   Preserve a free-form answer path; never force a false choice.
5. If two valid interpretations remain, list them and stop. Guessing through
   material ambiguity is not progress.
6. Probe hidden assumptions and unhappy paths: who uses it, what fails, what is
   irreversible, what must remain compatible, and what is explicitly out of
   scope.
7. When an external library or API controls the answer, switch to docs-grounded
   mode and cite authoritative documentation for every challenged capability.
8. Synthesize the resolved decisions, open questions, and proposed acceptance
   evidence. Ask for direct confirmation before a consequential spec or plan
   gate.
9. Stop when material decisions are resolved or explicitly deferred with an
   owner and consequence. Do not keep asking stylistic questions the agent can
   decide safely within approved scope.

This keeps the strongest part of BigPowers' grilling—relentless assumption
surfacing—while limiting fatigue and preserving agent responsibility.

#### Pi tool integration for grilling and quality

Use [`question`](../../packages/question/README.md) as the preferred interactive
surface:

- stable question/option IDs preserve compatible draft answers after a
  `Chat about this…` redirect;
- option descriptions and previews show trade-offs, diagrams, or API shapes;
- one question suits dependent design decisions, while one-to-four questions can
  batch independent choices;
- the built-in free-text answer must remain available;
- after a redirect, address the clarification and reopen the revised
  questionnaire with the branch-scoped, one-use continuation ID; retain
  individual question and option IDs only where their meaning is unchanged so
  compatible drafts can survive, and use the new ID returned by any later
  redirect;
- JSON/print-mode `unavailable` is a real stop/fallback signal, never permission
  to invent an answer.

If the question package is absent, ask one plain conversational question at a
time and keep the ledger blocked until the user answers. Do not recreate its UI,
continuation state, or option store inside the workflow extension. In a mode that
cannot receive an answer, stop with the unresolved decision rather than choosing
for the user.

Use [`todo`](../../packages/todo/README.md) for executable work created by the
interview, not as a transcript or second workflow ledger:

- create concise todos for repository research, prototypes, spec updates,
  implementation slices, and validation actions;
- keep at most one item in progress and use atomic updates after a decision
  changes the plan;
- add an investigation item when a question should be answered by code/docs;
- cancel superseded items explicitly after a rewind or changed decision;
- do not create a todo for every question, copy the six lifecycle phases into
  todo, or rely on todo for cross-session workflow state.

The workflow ledger records unresolved decisions as blocking reasons and stores
references to resulting question/spec evidence. The direct user command remains
the authority for approval-gated transitions. Optional `pi-subagents` may gather
repo/docs evidence or run fresh quality reviews, but it does not ask product
questions on the user's behalf or become a second decision-maker.

### Superpowers

[Superpowers](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99)
was reviewed at commit
[`d884ae0`](https://github.com/obra/superpowers/commit/d884ae04edebef577e82ff7c4e143debd0bbec99)
(2026-07-02). It provides the clearest small baseline: brainstorm and approve a
design, isolate work, write a detailed plan, use TDD, review, verify freshly,
then choose how to finish the branch. Its current Pi adapter is a thin bootstrap
extension rather than a workflow state engine. That supports the proposed
boundary: keep portable doctrine in skills and add Pi runtime only where Pi can
make behavior mechanically safer.

Useful paths at the reviewed commit:

- [Pi extension](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/.pi/extensions/superpowers.ts)
- [writing plans](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/writing-plans/SKILL.md)
- [TDD](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/test-driven-development/SKILL.md)
- [worktrees](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/using-git-worktrees/SKILL.md)
- [subagent-driven development](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/subagent-driven-development/SKILL.md)

## Options

### Option A: install an external methodology unchanged

Install BigPowers or Superpowers and make no package changes here.

#### Advantages

- almost no implementation cost;
- broad skill coverage immediately;
- upstream owns methodology evolution.

#### Disadvantages

- does not provide first-party typed state or status-line integration;
- BigPowers' Pi package is skills/prompts, not equivalent enforcement;
- overlaps local worktree, GitHub, Git, todo, and subagent guidance;
- imports a much larger command and skill vocabulary than needed;
- Flywheel is not a viable copy/install source for Pi today and has no located
  license grant.

**Verdict:** useful for comparison and a manual trial, not the final integrated
feature.

### Option B: one skill-and-prompt-only package

Add `@mopeyjellyfish/pi-development-workflow` as a Markdown-only package with a
router, progressive references, and an explicit kickoff prompt.

#### Advantages

- smallest secure surface;
- independently installable and easy to evaluate;
- no lifecycle or persistence implementation;
- can reuse every existing tool through guidance.

#### Disadvantages

- stage order and evidence gates remain advisory;
- no structured workflow status for the footer;
- no machine-validated transition or branch-aware replay;
- a prompt is text expansion, not a workflow engine;
- adding package prompts requires extending the root aggregate, which currently
  covers only package extensions and skills.

**Verdict:** best prototype if we are uncertain about the UX. It does not fully
satisfy the requested deterministic/status-integrated outcome.

### Option C: one mixed workflow package

Add one package containing the workflow, design-grill, and quality-audit skills,
thin prompts, shared references, and a narrow Pi extension.

#### Advantages

- cohesive versioning of stage semantics and runtime state;
- typed transitions and structural gates;
- branch-aware Pi session replay using established repository patterns;
- first-party status event and standalone fallback;
- remains independently useful without status-line or pi-subagents;
- keeps producer state and methodology under one version; only the optional,
  existing status-line consumer uses a small versioned event protocol.

#### Disadvantages

- larger test and lifecycle burden than a skill-only package;
- structural evidence cannot prove semantic quality or historical test-first
  ordering by itself;
- must avoid becoming another orchestration engine or project-management tool.

**Verdict:** **recommended**, because determinism and status integration are
explicit product requirements. Keep the extension intentionally narrow.

### Option D: split methodology and runtime packages

Create a skill-only practices/workflow package and a separate state/UI extension
package.

#### Advantages

- users could install methodology without runtime;
- extension implementation can evolve independently;
- a practices package might later serve other workflows.

#### Disadvantages

- two installs and two release streams for one feature;
- protocol compatibility and dependency questions appear immediately;
- runtime without its stage semantics is not independently useful;
- increases package and global-skill discovery noise;
- encourages accidental package-to-package coupling.

**Verdict:** do not split initially. Revisit only after a second real consumer
proves that the engineering-practice guidance is independently reusable.

### Option E: external skills plus a local ledger adapter

Install BigPowers or Superpowers for methodology and add only a local state/status
extension.

#### Advantages

- upstream continues to own the skill text;
- local code stays focused on Pi state and status integration;
- lower initial documentation-authoring cost.

#### Disadvantages

- the adapter must map and version someone else's changing stage vocabulary;
- external skills can overlap local worktree, Git, GitHub, todo, and subagent
  guidance;
- a local ledger cannot make external prose-enforced gates deterministic;
- package independence, degraded operation, collision handling, and compatibility
  become harder to explain and test;
- Flywheel remains unavailable for literal reuse without a license grant.

**Verdict:** credible for a pinned experiment with MIT-licensed BigPowers or
Superpowers, but not the preferred first-party product boundary.

The options are compared against the requested outcomes: deterministic stage
order, structured specs/plans, effective TDD, first-party Worktrunk and
status-line integration, and explicit review/ship gates.

## Recommended package shape

```text
packages/development-workflow/
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
├── skills/
│   ├── pi-development-workflow/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── workflow.md
│   │       ├── discovery.md
│   │       ├── specification.md
│   │       ├── planning.md
│   │       ├── tdd-build.md
│   │       ├── review-and-verification.md
│   │       ├── shipping.md
│   │       ├── questioning-and-decisions.md
│   │       ├── engineering-principles.md
│   │       ├── agentic-project-quality.md
│   │       └── evidence.md
│   ├── pi-design-grill/
│   │   └── SKILL.md
│   └── pi-quality-audit/
│       └── SKILL.md
├── prompts/
│   ├── dev-start.md
│   ├── dev-next.md
│   ├── dev-grill.md
│   ├── dev-review.md
│   └── dev-finish.md
└── test/
```

Keep the public surface to three skills:

- `pi-development-workflow` routes and resumes the lifecycle without crossing
  gates;
- `pi-design-grill` offers context-only and documentation-grounded modes for
  direct assumption testing through the question tool;
- `pi-quality-audit` applies the maintainability, testability, operability, and
  agent-readability rubric to a plan, diff, module, or project without numeric
  scores or automatic edits.

Phase and methodology details remain progressive references. Do not expose a
separate skill for every author, quality slogan, or lifecycle state.

Prompt templates are thin entry points rather than duplicated skill bodies:

- `/dev-start <idea-or-issue>` starts/adopts, surveys context, and reaches the
  first decision gate;
- `/dev-next` executes only the ledger's current phase and stops at its exit
  gate;
- `/dev-grill [artifact]` loads `pi-design-grill` and records resolved/open
  decisions;
- `/dev-review [target]` requests independent review when available; otherwise
  it records a same-context self-review with reduced assurance and never labels
  it fresh or independent;
- `/dev-finish` performs fresh readiness checks and presents separately
  authorized ship outcomes.

The package manifest must declare prompts, and the private root aggregate and
package validation must add `packages/*/prompts`; the current aggregate covers
only extensions and skills.

The extension should tentatively expose:

- a collision-resistant `development_workflow` model tool limited to status,
  evidence recording, transition requests, and externally observed outcomes,
  registered with `executionMode: "sequential"`;
- a `/dev-workflow` direct user command for start, adopt, status, approval-gated
  transitions, rewind, pause, and abandon;
- typed action schemas rather than generic command strings;
- versioned custom session entries as canonical state, with tool-result details
  used only as non-authoritative receipts;
- a versioned summary event such as
  `mopeyjellyfish:pi-development-workflow:summary:v1`;
- `setStatus()` fallback when the first-party status line is absent;
- no artifact authoring, arbitrary command/validation execution, subagent
  dispatch, Git/GitHub mutation, long-lived service, watcher, or second footer;
- one permitted subprocess exception: a bounded, read-only, fixed-argument Git
  identity probe using `pi.exec`, timeout, cancellation, and the effective routed
  path, with a truthful non-Git fallback.

Names are provisional. Before implementation, check installed tool, command,
skill, event, and status-key collisions.

## Compact lifecycle

Use six required phases and one optional learning action.

| Phase            | Required output                                                                                                                                  | Exit gate                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Discover         | problem, users, constraints, non-goals, unknowns, alternatives, sourced research or an explicit research-not-needed reason                       | material unknowns resolved or escalated; consequential approach approved                     |
| Specify          | observable behavior, edge cases, domain vocabulary/invariants, exclusions, acceptance evidence                                                   | specification review finds no unresolved blocking decision; authority mode declared          |
| Plan             | vertical slices, exact likely files, dependencies, test seams, commands, expected evidence, risks and rollback                                   | plan reviewed; validation contract approved; worktree decision recorded                      |
| Build            | small behavior-bearing slices, RED/GREEN evidence or a documented exception, refactoring while green, synchronized artifacts                     | focused checks and relevant regressions pass on the current tree; no unapproved scope change |
| Review           | separate spec/intent, correctness/regression, maintainability/complexity, and risk/operations findings; accepted fixes; fresh final verification | no blocker or fix worth doing now remains; optional/deferred findings are explicit           |
| Ship             | reviewed logical units, current verification, and an explicit human choice for commit/push/PR/merge/keep                                         | only the separately authorized mutations run; resulting identifiers are recorded             |
| Learn (optional) | one verified, reusable lesson in the repository's existing documentation convention                                                              | lesson is genuinely reusable and contains no sensitive/local-only evidence                   |

### Fast path

Small changes should not require fake artifacts or empty ceremonies. The router
may collapse Discover, Specify, and Plan into one bounded readiness card when:

- behavior and scope are already explicit;
- no consequential architecture or dependency choice exists;
- verification is straightforward;
- the diff is expected to stay small and reversible.

The same gates still apply. A skipped research, prototype, independent reviewer,
or TDD step needs a reason and an alternative verification path where relevant.

## State and artifact model

### Operational state

Make versioned custom session entries the **only workflow-state authority in
version one**, following Worktrunk's `pi.appendEntry()` and branch replay model.
Every mutation—whether initiated by a tool or direct user command—passes through
one synchronous reducer and appends the same validated snapshot entry. The model
tool uses sequential execution so parallel calls cannot race on stale state.
Tool-result details are non-authoritative receipts only. Specs and plans own
their content, but do not independently own the current phase. Support one active
workflow per Pi session; multiple concurrent ledgers and automatic cross-session
discovery are out of scope initially.

A snapshot should be compact and versioned, for example:

```text
version
workflow id and title
phase and status
active worktree path, branch, and observed HEAD when available
artifact references by kind and path
gate results with evidence references
attention/open-decision summary
last completed transition
```

The extension must replay the latest valid custom entry from the current branch
on start, reload, resume, fork, tree navigation, and compaction, and clean UI
state idempotently on shutdown. A malformed newer workflow entry is surfaced as
corruption and blocks mutation rather than silently falling back to older state.
A backward transition invalidates all downstream gates and evidence references.
The bounded Git identity probe plus optional Worktrunk route identifies branch
or HEAD drift when Git is available; route changes or missing artifacts mark
affected evidence stale and raise attention. The extension never silently
rewrites history or infers a new phase.

### Durable artifacts

Human-readable specs, plans, decisions, and review notes remain the durable
source of product intent. The workflow should follow each repository's existing
conventions rather than automatically impose `specs/`, `docs/solutions/`, or a
large YAML cockpit.

For the first version, do not add a hidden project database. Record artifact
paths in session state. A new session uses an explicit `adopt` operation with a
chosen spec or plan, declared starting phase, and reviewed skip/adoption reasons;
the extension must not infer completion from prose. Add one atomic, branch-local
manifest only if real use proves that workflows must resume automatically across
unrelated Pi sessions. That would be a separate, materially larger feature and
would need explicit Worktrunk-route semantics.

### Evidence limits

Store references and bounded summaries in version one, not raw command output,
provider responses, logs, or review transcripts. Every reference needs a kind,
claim, freshness identity such as branch/HEAD when available, and sensitivity
classification. Local-only or sensitive evidence must never be copied into a
committed artifact by default.

The extension can validate sequence, schema, referenced paths, current branch or
HEAD, and recorded gate completeness. It cannot infer that prose is correct or
prove historical test-first behavior from the final tree. Do not market
structural receipts as semantic proof.

TDD confidence should combine:

- a strict skill contract;
- observed focused failure and pass evidence when available;
- behavior-facing tests and regression coverage;
- a fresh independent reviewer audit when available, or an explicitly labeled
  same-context self-review with reduced assurance;
- fresh final checks against the current tree.

## Skill, prompt, and extension responsibilities

| Concern                                  | Skill/reference                 | Prompt/chain                               | Extension                                                    |
| ---------------------------------------- | ------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Explain phase goals and quality doctrine | owns                            | can route                                  | does not own prose                                           |
| Ask discovery/spec questions             | `pi-design-grill` owns protocol | `/dev-grill` routes to `question`          | ledger records blockers; no duplicate UI                     |
| Audit project/code quality               | `pi-quality-audit` owns rubric  | `/dev-review` can apply it                 | no numeric score or automatic edit                           |
| Research/context/planning fan-out        | defines acceptance              | delegates to `pi-subagents` when available | no new runner                                                |
| Typed phase transition                   | describes meaning               | requests or asks for approval              | owns validation and canonical custom-entry state             |
| Main feature worktree                    | requires a decision             | calls existing tool                        | observes optional route event only                           |
| Within-phase task progress               | guides `todo`                   | calls existing tool                        | no second task graph                                         |
| TDD/review rules                         | owns                            | orchestrates optional agents               | records structural evidence only                             |
| Current phase UI                         | supplies labels                 | none                                       | event + fallback status                                      |
| GitHub/Git operations                    | refers to existing skills       | requests after approval                    | does not implement                                           |
| Shipping authorization                   | explicit safety contract        | must stop and ask                          | direct command approves gates; tool records external outcome |

The five package prompts remain thin instructions to load the appropriate skill,
inspect canonical ledger state, and stop at the next gate. They must not copy the
full skill bodies. The private root aggregate and package validation must include
`packages/*/prompts`, which the current root manifest does not yet discover.

## First-party integrations

### Worktrunk

- Use `worktree create` or `activate` for the user's main feature workspace.
- Never run raw `git worktree` as a hidden fallback when the Worktrunk tool is
  available.
- Preserve hook approval and exact safe-removal semantics.
- Do not conflate this with `pi-subagents` temporary per-child worktree
  isolation.
- Account for the current limitation that routed tools move but Pi's resource
  loader and `@` picker do not become native to the linked worktree.

The workflow extension may listen to Worktrunk's existing versioned route event
to label state with the effective branch/path. If the Worktrunk package is
absent, inspect the current Git identity and ask the user to approve the current
workspace or prepare isolation themselves; do not implement a raw Git-worktree
fallback. If only route state is absent, continue against the confirmed session
workspace and record that limitation.

### Todo

Use todo items for the concrete work inside the current phase. The workflow
ledger tracks lifecycle phases, gates, and artifacts only. This keeps one active
stage and one active execution item without inventing dependencies or ownership
semantics in either package. If the todo package is absent, follow the approved
plan artifact and report current/next work conversationally; do not create a
replacement task store inside the workflow extension.

### Pi subagents

When `pi-subagents` is installed, use the existing parent-controlled patterns:

- researcher plus local context-builder for discovery;
- planner or a handoff-plan chain after specification approval;
- one writer in the active worktree;
- fresh-context reviewers on distinct axes;
- one fix worker for accepted findings;
- another focused review when fixes are substantial.

Without `pi-subagents`, the parent performs research, planning, and
implementation sequentially. Any same-context review is recorded truthfully as
self-review with reduced assurance; the independent-review gate is skipped with
a reason and alternative evidence rather than falsely marked satisfied. If
programmatic integration is later needed, use the stable versioned RPC with
bounded timeouts and truthful fallback. Do not import internals or duplicate the
fleet UI.

### Status line

Extend `pi-status-line` to consume the new versioned workflow summary event.
Render one compact segment, for example:

```text
flow plan · ready
flow build · attention
```

Place it near subagent/todo progress, validate unknown payloads, bound labels,
and suppress the producer's fallback status only while a valid structured
summary is present. Preserve every unrelated extension status. Do not add a
second footer.

### Question, Git, and GitHub

Use the existing question tool for material decisions. Use the GitHub and Git
convention skills at their current trust boundaries. Commit, push, PR creation,
merge, deploy, release, publish, and worktree removal remain separate explicit
authorizations even when every workflow gate is green.

## Engineering rules to bake in

These rules are the durable overlap of the requested prior art. They should be
written as operational checks, not author-name slogans.

1. Start from repository truth and record unexplained baseline failures.
2. Clarify observable behavior, constraints, non-goals, edge cases, unknowns,
   and acceptance evidence before production implementation.
3. Permit bounded disposable prototypes for genuine uncertainty; do not let a
   prototype silently become production code.
4. Compare alternatives for consequential interfaces using dependency spread,
   cognitive load, reversibility, security, and verification cost.
5. Prefer deep, cohesive modules and simple interfaces that hide decisions.
6. Plan vertical slices that each produce demonstrable behavior.
7. Default behavior changes to RED → GREEN → REFACTOR; verify the red failure is
   the intended one, make the minimum passing change, then improve while green.
8. Keep tests behavior-facing and maintainable; avoid mirroring every internal
   implementation unit.
9. Debug from reproduction and one tested hypothesis rather than stacked guesses.
10. Optimize for human and agent readability: searchable names, explicit
    invariants, actionable bounded errors, structured diagnostics, and one-command
    headless checks.
11. Review intent/spec compliance separately from correctness, maintainability,
    and security/operations.
12. Verify after the final edit and tie evidence to the current tree or commit.
13. Keep authoritative specs, tests, implementation, and documentation in sync;
    explicitly archive or demote stale artifacts.
14. Treat complexity points as estimates, not quality gates or promises.

### Specification authority modes

- **Spec-first:** an approved specification must exist before production
  implementation, but bounded discovery prototypes may precede it.
- **Spec-anchored:** the approved specification is the behavioral baseline. A
  material behavior change discovered during build rewinds to Specify, updates
  or supersedes the spec, and invalidates affected plan/build/review gates before
  work resumes. This is the recommended default.
- **Spec-as-source:** executable contracts or generated artifacts derive from the
  specification. Any unreviewed divergence blocks the gate; the source spec must
  change first and derived outputs must be regenerated.

Superseded specifications remain discoverable with an explicit replacement link
or are archived according to repository convention. Silent divergence is never
accepted as a new authority.

### Explicit conflict resolutions

- **Martin/Akita small functions vs Ousterhout deep modules:** no function/file
  line-count gate. Extract when cohesion or information hiding improves, not to
  satisfy a threshold.
- **Universal TDD vs discovery:** test-first is the default for stable behavior
  seams. A documented disposable spike is allowed; production acceptance still
  needs objective regression protection.
- **Spec before code vs prototyping:** require approved acceptance before
  production implementation, not before every experiment.
- **Comments:** reject narration, not rationale. Preserve non-obvious invariants,
  units, ownership, boundary behavior, and design reasons.
- **Agent autonomy:** scale autonomy with risk, reversibility, coverage, and
  reviewability. Preserve human gates for consequential choices.
- **BCP:** in this source cluster BCP means CI&T Business Complexity Points.
  Make it optional planning metadata, locally calibrated and separate from
  effort/risk. Do not use BCP/hour or a score threshold as an acceptance gate.
- **Specification authority:** declare whether a project is spec-first,
  spec-anchored, or spec-as-source. Never assume stale prose remains canonical.

Primary methodology sources:

- Robert C. Martin: [TDD cycles](https://blog.cleancoder.com/uncle-bob/2014/12/17/TheCyclesOfTDD.html),
  [architectural qualification](https://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html)
- John Ousterhout: [official book page](https://web.stanford.edu/~ouster/cgi-bin/aposd.php),
  [complexity notes](https://web.stanford.edu/~ouster/cgi-bin/cs190-winter18/lecture.php?topic=complexity),
  [Martin/Ousterhout discussion](https://github.com/johnousterhout/aposd-vs-clean-code)
- Andrej Karpathy: [professional AI-assisted workflow](https://x.com/karpathy/status/1915581920022585597),
  [Software Is Changing (Again)](https://www.youtube.com/watch?v=LCEmiRjPEtQ)
- Matt Pocock: [skills](https://github.com/mattpocock/skills),
  [seven development phases](https://www.aihero.dev/my-7-phases-of-ai-development)
- Jarosław Wasowski: [BDD as the SDD bridge](https://medium.com/@wasowski.jarek/sdd-writing-specifications-for-ai-bdd-as-the-missing-link-spec-driven-development-ad1b540b7f75),
  with [2004 SDD prior art](https://pure.york.ac.uk/portal/en/publications/agile-specification-driven-development/)
- CI&T: [Business Complexity Points](https://ciandt.com/us/en-us/complexitypoints),
  [BCP agent](https://github.com/flow-ciandt/bcp-agent)
- Fabio Akita: [Clean Code for AI Agents](https://akitaonrails.com/en/2026/04/20/clean-code-for-ai-agents/)

## Delivery slices

### Slice 1: package contract and end-to-end happy path

- add the independently installable mixed package and release metadata;
- add the workflow router, design-grill, and quality-audit skills with shared
  progressive references;
- add the five thin `dev-*` prompts and extend root prompt aggregation and
  package validation;
- register start/adopt/status/record/request-transition/rewind actions, with
  approval-gated mutations restricted to the direct user command;
- append and replay one versioned, single-active-workflow custom session entry;
- enforce the six-phase order, explicit transition prerequisites, skip reasons,
  and downstream invalidation after rewind;
- publish fallback status and a versioned summary event;
- cover invalid transitions, concurrent mutation serialization, snapshot
  corruption, stale route/HEAD/artifact evidence, reload, branch navigation,
  compaction, non-TUI approval-stop behavior, cancellation where applicable,
  and shutdown cleanup.

### Slice 2: existing-tool integration

- capture optional Worktrunk route identity without a hard dependency;
- implement the question protocol: dependent questions one at a time,
  independent batching, recommended options, redirects/continuations, and
  non-interactive stop behavior;
- define todo handoffs for research/prototype/build/validation tasks without
  copying lifecycle state or question history;
- record unresolved decisions as ledger blockers and resolved decisions as
  references, while keeping direct user commands authoritative for approval;
- add optional subagent evidence/review recipes with sequential fallback;
- add explicit question/todo/Git/GitHub trust-boundary tests in the skill
  contracts.

### Slice 3: status-line consumer

- add defensive parsing and a compact workflow segment;
- suppress the producer fallback only for valid structured state;
- test event update, clear, malformed payload, width pressure, reload, and
  shutdown behavior.

### Slice 4: behavioral evaluation and refinement

- run journey evaluations for small change, feature, bug, research-heavy change,
  ambiguous request, documentation-grounded grill, changed decision, quality
  audit, documented TDD exception, review-fix loop, and abandoned/paused work;
- measure skill selection, question usefulness/fatigue, stage overreach,
  evidence truthfulness, quality-finding precision, context cost, and user
  interruption points;
- add a project-local durable manifest only if explicit-resume friction is
  demonstrated.

## Validation contract for implementation

The implementation is not complete until it has:

- focused package tests and status-line integration tests;
- package manifest, aggregate resource, release, and packed-artifact checks;
- source and packed Pi smoke tests;
- deterministic load with no tool, command, skill, event, or status collision;
- a manual `/reload` cycle from a Pi process started inside the target worktree;
- manual happy-path and invalid-transition exercises;
- verification that operation remains useful without status-line,
  `pi-subagents`, the question tool, the todo tool, the Worktrunk package or
  route state, and TUI mode, with every degraded assurance labeled truthfully;
- `npm run smoke:source` followed by `npm run check` after final edits;
- `npm run security:check` if dependencies or installation behavior change.

Do not claim that TDD, review independence, or semantic specification quality is
mechanically guaranteed unless the observed evidence supports that exact claim.

## Decisions needed before implementation

The recommendation assumes the following defaults. Confirm them before a worker
handoff:

1. **Determinism level:** typed phase order and structural evidence only. The
   extension does not execute validation or user-supplied commands; its only
   subprocess is the fixed read-only Git identity probe. Normal tools and review
   provide semantic evidence.
2. **State authority and durability:** one active, session-canonical workflow in
   version one. A new session explicitly adopts a spec/plan; there is no automatic
   project database or cross-session discovery.
3. **Backward movement:** rewinding invalidates every downstream gate and
   evidence reference. Route, branch, HEAD, or artifact drift marks evidence
   stale and requires review.
4. **Evidence retention:** references plus bounded summaries only, with
   freshness and sensitivity metadata; no raw logs or transcripts.
5. **Approval authority:** the model-callable tool may prepare evidence and
   request a transition, but cannot approve a consequential design/spec, plan,
   rewind, or ship gate. Those mutations require a direct `/dev-workflow`
   command from the user. In modes without direct command/UI input, the workflow
   stops at the gate and reports the required approval.
6. **Fast path:** a small change may collapse Discover/Specify/Plan into one
   readiness card with the same required fields and explicit skip reasons.
7. **Ship completion:** entering Ship means `ready_to_ship`, not shipped. A
   separate record action captures the explicitly chosen external outcome—for
   example committed locally, pull request opened, merged, kept, or abandoned—
   plus its identifier when one exists.
8. **Naming:** `development_workflow` and `/dev-workflow` are preferred over
   generic `workflow`; confirm every package, skill, command, tool, event, and
   status key against installed resources.
9. **External runtime:** `pi-subagents` remains optional; use normal agent
   behavior or stable RPC with sequential fallback, never an internal import.
10. **Spec authority:** default to the spec-anchored behavior defined above,
    with project override and explicit rewind/invalidation when behavior diverges.
11. **Question policy:** dependent material decisions are asked one at a time;
    up to four independent low-risk questions may be batched. Every constrained
    choice includes trade-offs and a recommendation, and discoverable repository
    facts are researched rather than asked.
12. **Quality policy:** agent-readability metrics and Clean Code/SOLID rules are
    review signals, not universal numeric gates. Findings must explain concrete
    change amplification, cognitive load, test fragility, operability, or risk.
13. **BCP:** keep it in an optional reference until locally calibrated; never
    make it a default quality or acceptance gate.

## Final package-count decision

**Add one package now.** Modify status-line for optional integration, but do not
create a second new package.

Reconsider a separate engineering-practices package only after another workflow
or tool needs those practices independently. Reconsider a separate runtime
package only if users demonstrably want the skill without state and the state
engine develops an independently useful public protocol. Until then, splitting
would add installation, release, compatibility, and discovery cost without a
cohesive benefit.
