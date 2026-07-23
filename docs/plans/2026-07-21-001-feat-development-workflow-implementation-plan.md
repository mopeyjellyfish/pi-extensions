# Development workflow implementation plan

**Status:** approved for implementation

**Package:** `@mopeyjellyfish/pi-development-workflow`

**Scope:** Shape Up pitch and integrated vertical slices, deterministic Pi session ledger, four skills, six prompts, optional first-party integrations, and status-line visibility.

This plan is authoritative where the earlier options brief contains stale skill, prompt, artifact, or lifecycle counts.

## Product contract

### Included

- Lifecycle: Discover → Specify/Pitch → Plan → Build → Review → Ship.
- Shape Up `spec.md` pitch with Problem, Appetite, Solution, Rabbit Holes, and No-Gos.
- Pitch review for rough, solved, and bounded work.
- Solution-level acceptance signals and breadboard/fat-marker guidance.
- Evolving `plan.md` slice index and independently demonstrable `VS-*.md` integrated slices.
- Tasks discovered inside the active slice rather than an exhaustive upfront backlog.
- RED → GREEN → REFACTOR within each behavior-bearing slice.
- One active workflow and at most one active slice per Pi session branch.
- Fixed-time appetite with explicit scope cuts and circuit-breaker resolution.
- Canonical versioned custom session entries and branch-aware replay.
- Direct human approval for consequential transitions.
- Optional Worktrunk, Question, Todo, LSP, web search, GitHub, Git conventions, and pi-subagents guidance.
- Optional status-line consumer.

### Excluded from version one

- Project database or automatic cross-session workflow discovery.
- Portfolio betting tables, organization-wide cycles, cool-down scheduling, hill charts, scope maps, and percentage progress.
- YAML task ledgers or mutable status in artifact frontmatter.
- Automatic commit, push, pull request, merge, publish, deploy, release, or worktree removal.
- A second worktree manager, question UI, task tracker, subagent runner, GitHub client, or footer.

## Public identities

| Surface              | Identity                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Package              | `@mopeyjellyfish/pi-development-workflow`                                                   |
| Model tool           | `development_workflow`                                                                      |
| Human command        | `/dev-workflow`                                                                             |
| Custom session entry | `mopeyjellyfish-pi-development-workflow-state`                                              |
| Summary event        | `mopeyjellyfish:pi-development-workflow:summary:v1`                                         |
| Fallback status      | `mopeyjellyfish-pi-development-workflow`                                                    |
| Skills               | `pi-development-workflow`, `pi-design-grill`, `pi-quality-audit`, `pi-systematic-debugging` |
| Prompts              | `/dev-start`, `/dev-next`, `/dev-grill`, `/dev-debug`, `/dev-review`, `/dev-finish`         |

All identities must be collision-checked in a deterministic Pi development session before completion.

## Artifact contract

### Pitch: `spec.md`

Minimal immutable frontmatter:

```yaml
---
schema: dev-workflow/pitch-v1
id: PITCH-001
---
```

Required top-level sections:

1. Problem — a concrete story showing why the status quo fails.
2. Appetite — a user-chosen fixed time budget that constrains variable scope.
3. Solution — the shaped elements, flows, affordances, rough diagrams, and nested Acceptance Signals.
4. Rabbit Holes — appetite-threatening risks plus shaped constraints or patches.
5. No-Gos — explicit exclusions needed to preserve the appetite.

Pitch readiness records whether the work is:

- rough: enough detail to communicate, without prescribing final implementation;
- solved: macro elements connect and visible rabbit holes are patched or escalated;
- bounded: appetite and no-gos make the concept finite.

Mutable workflow status is forbidden in frontmatter and body checkboxes.

### Plan: `plan.md`

`plan.md` is an evolving ordered index of integrated slices. It links the pitch, repeats appetite/no-gos, identifies the first demonstrable slice, records dependencies and sequencing, and changes as implementation knowledge improves. It is not a master backlog, role/layer plan, or frozen implementation contract.

### Vertical slice: `slices/VS-*.md`

Minimal immutable frontmatter:

```yaml
---
schema: dev-workflow/vertical-slice-v1
id: VS-001
depends_on: []
requirements: [REQ-001]
risk: medium
---
```

Required sections:

- Observable Outcome
- Pitch Fit
- Boundaries Crossed
- RED
- GREEN
- Verification
- Done When

A slice must deliver demonstrable behavior across every necessary boundary. Horizontal plans such as all models, all APIs, all UI, or all tests are invalid. Native contracts remain in native formats under `contracts/` where needed.

Slice status belongs only to the session ledger: `planned | active | blocked | verified | cut`.

## State contract

A bounded version-one snapshot contains:

- schema version, workflow ID, title, and monotonic revision;
- lifecycle phase and workflow status;
- effective workspace path, branch, and observed HEAD when available;
- pitch/plan/slice artifact references;
- slice records and at most one active slice;
- appetite duration, start/pause accounting, derived state, and explicit decisions;
- gates, transition request, evidence references, attention, and external outcomes.

Workflow statuses are `active | paused | blocked | abandoned | completed`.

Evidence stores bounded claims and references, not raw logs, provider responses, or review transcripts. It records kind, claim, freshness identity, sensitivity, and optional branch/HEAD.

Every mutation passes through one synchronous pure reducer. The model tool uses sequential execution. Successful mutations append one validated custom entry; tool-result details are non-authoritative receipts. If the newest matching custom entry is malformed, mutation blocks until a direct recovery action appends a valid recovery snapshot.

Rewind preserves history while invalidating downstream gates, freshness claims, and affected slice verification.

## Appetite contract

Accepted duration syntax is bounded and explicit, initially `Nh`, `Nd`, or `Nw`.

- Appetite is required before pitch approval.
- The clock starts when Plan is approved and Build begins.
- Derived state: `not_started | active | attention | expired`.
- Attention begins at 80% of elapsed approved time.
- Pause/resume accounting is explicit.
- Expiry blocks forward build mutation except status/evidence and direct circuit resolution.

Direct-user circuit outcomes:

- `finish`: review useful verified scope;
- `reshape`: rewind to Specify/Pitch and invalidate downstream approval/evidence;
- `extend`: record a new explicit appetite decision;
- `abandon`: terminate the workflow.

There is no automatic extension and no reduction of repository, security, test, or quality floors.

## Tool and command authority

### Model tool

`development_workflow` is sequential and may:

- read status;
- record artifacts and evidence;
- register slices;
- set non-consequential slice state such as active, blocked, or verified;
- request a lifecycle transition;
- record an externally performed outcome.

It may not start/adopt, approve gates, rewind, cut scope, change appetite, resolve an expired appetite, pause/resume, abandon, recover corruption, or authorize shipping.

### Direct human command

`/dev-workflow` supports deterministic bounded forms for:

- `status`
- `start <title>`
- `adopt <phase> <relative-spec-path> -- <reason>`
- `appetite <duration>`
- `approve <discover|pitch|plan|build|review>`
- `slice <activate|block|verify|cut> <id> -- <reason>`
- `rewind <phase> -- <reason>`
- `pause -- <reason>`
- `resume`
- `circuit <finish|reshape|extend|abandon> ...`
- `abandon -- <reason>`
- `recover -- <reason>`

Consequential approvals are unavailable through the model tool. Non-interactive modes stop truthfully at approval gates.

## Structural gates

- Discover: problem evidence and research, or explicit research-not-needed reason.
- Pitch: valid pitch artifact, appetite, pitch review, and no unresolved blocker.
- Plan: evolving plan, at least one integrated slice, validation contract, and workspace decision.
- Build: retained slices verified or explicitly cut; RED/GREEN evidence or justified exception; focused/regression evidence.
- Review: intent, correctness, maintainability, and risk/operations review plus fresh final verification. Same-context fallback is labelled reduced assurance.
- Ship: enters `ready_to_ship`; separately authorized external actions are recorded only after they occur.

## Lifecycle and integration contract

- Restore from current branch on `session_start`, `session_tree`, and `session_compact`.
- Start timers only during session lifecycle and clean them idempotently on shutdown.
- Optionally consume Worktrunk route v1 and probe Git identity using fixed arguments, bounded timeout, and abort signal.
- Mark route/HEAD-bound evidence stale after drift; do not watch files.
- Publish summary v1 containing workflow, phase, workflow status, active slice, appetite state, and attention.
- Provide a TUI-only `setStatus()` fallback.
- The status-line consumer defensively parses v1, suppresses fallback only for valid structured state, and clears on undefined/shutdown.

Missing optional integrations degrade truthfully:

- no Worktrunk: confirm current workspace; never implement hidden raw worktree management;
- no Question: ask one conversational question or remain blocked;
- no Todo: follow the approved plan and report current/next work without creating another task store;
- no pi-subagents: run sequentially and label same-context review reduced assurance;
- LSP, web search, GitHub, and Git conventions retain their own trust and mutation boundaries.

## Vertical implementation slices

### Slice 1 — Package resources and prompt support

Write failing repository tooling tests, then add prompt discovery, validation, packed-content checks, root aggregate comparison, smoke discovery, package scaffold, and release metadata.

### Slice 2 — Pure artifacts, state, and appetite

Write tests for pitch/slice structures, reducer transitions, replay, bounds, corruption, rewind, one-active-slice, appetite timing, and circuit outcomes; implement pure modules only after RED.

### Slice 3 — Pi tool, command, lifecycle, and event

Write registration and lifecycle tests, then implement model authority, human command authority, custom-entry persistence, Git/route freshness, timers, fallback status, and summary publication.

### Slice 4 — Skills, prompts, and integration contracts

Write resource and journey contract tests, then author four skills, progressive references/templates, six thin prompts, and optional integration fallbacks.

### Slice 5 — Status-line consumer

Write event/rendering tests, then add bounded stage/slice/appetite rendering and fallback suppression.

### Slice 6 — Documentation, journeys, and acceptance

Complete feature, bug, ambiguity, pitch, first-slice, horizontal-plan rejection, appetite expiry/cut/reshape, rewind, degraded integration, TDD exception, and review-loop journeys; update docs and run live Pi acceptance.

## Required tests

- Repository prompt aggregation, invalid paths, unmanaged resources, and npm-pack omission.
- Artifact schemas, forbidden status/checklists, horizontal plans, and missing verification.
- Reducer actions, bounds, atomic rejection, duplicate IDs, terminal states, rewind, corruption, and replay filtering.
- Appetite exact boundaries, pause/resume, attention, expiry, finish, reshape, explicit extension, and abandonment.
- Tool authority, direct command parsing, gate prerequisites, sequential calls, cancellation, and bounded output.
- Session start/tree/compact/shutdown, route changes, Git drift, missing artifacts, event clear, and fallback cleanup.
- Four skill names, six prompt commands, thin prompts, Shape Up contracts, TDD/debug/review guidance, and negative duplication assertions.
- Status-line malformed/unknown event handling, sanitization, bounds, width pressure, reload, and shutdown.

## Completion validation

After final edits:

```sh
npm test -- --run test/tooling/packages.test.ts
npm --workspace @mopeyjellyfish/pi-development-workflow test
npm --workspace @mopeyjellyfish/pi-status-line test
npm run packages:check
npm run smoke:source
npm run smoke:packed
npm run check
```

Run `npm run security:check` if dependency or installation behavior changes.

Start deterministic Pi inside the feature worktree and verify:

1. four skills, six prompts, one tool, and `/dev-workflow` appear once;
2. an invalid transition is rejected;
3. a pitch and first integrated slice can progress through a happy path;
4. `/reload` preserves branch state without duplicate registration or stale UI;
5. absence of optional integrations produces truthful fallback behavior.

Finish with fresh independent behavior/spec and maintainability/risk reviews, apply accepted fixes through one writer, and rerun focused and full checks.
