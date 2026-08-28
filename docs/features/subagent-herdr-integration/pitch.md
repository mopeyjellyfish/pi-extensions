---
status: accepted
---

# Shape: Herdr live subagent panes

## Executive summary

Upgrade the personal Pi profile from `pi-subagents` 0.50.0 to 0.58.0 and add an
independently installable `@mopeyjellyfish/pi-herdr-subagents` package. The new
package will compose the upstream subagent runtime with a narrow Herdr supervisor.
It will not copy or replace the subagent executor.

When Pi runs in Herdr, each current-session leaf subagent will get a live transcript
pane. The main Pi pane will stay wide and focused on the left. Child panes will
stack in a supervisor rail on the right. Each pane will show full scrollback,
current state, current activity, and terminal outcomes. Failed, blocked, and
partial work will remain visible.

Mutation-capable workers will launch without hard tool, turn, or reported-token
budgets by default. Explicit cancellation and wall-clock bounds remain available.
If a caller deliberately supplies a hard execution budget, the runtime must return
an honest partial or failed terminal handoff and wake the parent.

## Problem and evidence

The current profile pins `pi-subagents` 0.50.0. A real mutation worker was launched
with `toolBudget: { soft: 50, hard: 80 }`, reached the hard limit, and returned
before validation. The worker left partial edits. The parent did not receive a
clear enough terminal presentation and appeared to keep waiting.

The child transcript and output artifacts existed on disk. The problem was not
missing execution evidence. The problem was that the evidence was difficult to
find and did not appear beside the parent at the time it was useful.

Upstream `pi-subagents` 0.51.0 fixed trusted workflow transcript visibility in
FleetView and Herdr inspectors. Releases through 0.58.0 add deterministic terminal
handoffs, clearer partial outcomes, recovery actions, detached-run recovery,
workflow-child inspection, and stronger Herdr status behavior. The latest package
also exposes versioned event-bus RPC, documented lifecycle artifacts, control
channels, and Herdr project-pane APIs for cooperating extensions.

Herdr is already installed and the active Pi process runs inside it. Herdr can
split, focus, read, label, and close panes. A separate interactive Pi process is
not required to show a child transcript and would create a second coordination
owner.

## Appetite

This is a medium feature with an appetite of three to five working days. It can add
one production package, focused tests, package documentation, release metadata,
root-profile integration, and narrow orchestration guidance.

Stop and reshape the work if it requires copying the upstream executor, importing
unversioned private runtime internals, changing Herdr itself, or creating a second
subagent lifecycle authority.

## Proposed solution

### Compose the upstream runtime

Create `@mopeyjellyfish/pi-herdr-subagents` as a small composition package. It will
depend on the published, tested `pi-subagents` 0.58.0 package and register its
unchanged upstream factory plus the Herdr supervisor in one Pi package. The root
profile will load the composition package instead of registering the upstream
factory separately.

The composition package will register the upstream extension factory but will not
re-export the upstream bundled orchestration skill or prompt directories. The
private root profile will continue to select its existing prompt and agent catalog
explicitly. The dependency pin, lockfile, root-profile validator in
`scripts/lib/packages.ts`, root `README.md`, and `docs/architecture.md` will be
updated together.

`pi-subagents` remains the authority for launch, persistence, status, transcript
artifacts, steering, stopping, resume, completion delivery, and process-terminal
proof. The companion code will use versioned public APIs and documented artifacts.
It will fail with an actionable compatibility message instead of silently scraping
unknown formats.

### Open a supervisor rail

Use the accepted **Supervisor Rail** direction:

- Keep the current main Pi pane on the left and preserve its focus.
- Open one raw Herdr pane for each current-session leaf child, including each direct
  workflow child and each nested child for which the authoritative status snapshot
  exposes an exact identity and artifact path.
- Create the first child pane by splitting to the right of the main pane.
- Stack later child panes below the first child pane.
- Show the complete live child output with normal terminal scrollback.
- Show the agent, run state, elapsed time, context or budget evidence when available,
  current tool or activity, attention state, and final outcome.
- Route steer, stop, and supported resume requests through the existing
  `pi-subagents` control surface. Closing a pane must never stop its child.
- Keep terminal panes open until the user closes them or the parent session shuts
  down. Never auto-close failed, blocked, needs-attention, or partial panes.

The package will track only panes that it creates. Reload, resume, and fork handling
will reconcile active current-session children, stale pane bindings, and panes that
the user closed. Session shutdown will close only package-owned raw inspector panes.

The accepted visual evidence is:

- [`design/direction-a-supervisor-rail.png`](design/direction-a-supervisor-rail.png)

### Prevent budget-caused partial mutation by default

Extend the target-repository-neutral worker-launch contract in
`packages/engineering/skills/implement/SKILL.md` and its focused tests.
Mutation-capable workers will not receive hard `toolBudget`, `turnBudget`, or
reported-usage token limits by default. Read-only bounded support can still use
explicit limits when the assignment can return useful partial evidence.

Mutation work can still use cancellation, a justified wall-clock timeout, a narrow
task, explicit checkpoints, and one-writer worktree ownership. The companion will
not remove or rewrite a hard limit that a caller supplies explicitly. If that limit
terminates the run, the child pane and parent result must identify the partial or
failed state, changed-file evidence when available, validation not run, and the
supported recovery action.

### Wake the parent clearly

Use the upgraded runtime's ordinary completion notifications and exact non-blocking
wait subscriptions. Terminal success, failure, stop, partial completion, and
needs-attention events must unblock or wake the originating parent. The parent must
not poll, sleep, or remain blocked after the run has reached a terminal state.

### Preserve non-Herdr behavior

Herdr remains optional. Automatic panes require Herdr 0.7.5 or later; the verified
local version is 0.8.2. Outside Herdr, upstream FleetView, inspector commands,
artifacts, and completion behavior continue to work. Missing or incompatible Herdr
must produce a bounded diagnostic and must not prevent subagent execution.

## Boundaries and no-gos

- Do not build separate interactive Pi worker processes for ordinary subagent runs.
- Do not move an existing headless child into a peer project pane.
- Do not fork, vendor, or copy the upstream subagent executor.
- Do not create a second status, persistence, resume, or completion authority.
- Do not parse rendered terminal text when a versioned RPC or documented artifact is
  available.
- Do not let pane closure stop, interrupt, dismiss, or delete a run.
- Do not close panes that the package did not create.
- Do not steal focus from the main Pi pane during automatic child launch.
- Do not hide failure, partial work, needs-attention state, or missing validation.
- Do not silently remove, rewrite, or reject a caller's explicit execution budget.
  Preserve it and report the consequence if it terminates the run.
- Do not assume this repository's agents, skills, package paths, or worktrees exist
  in unrelated target repositories.
- Do not add hosted monitoring, remote transcript upload, browser UI, or a general
  terminal multiplexer.

## Decision-changing risks

- The current public RPC controls runs but does not expose automatic Herdr inspector
  opening as a direct RPC method. The package will own a bounded raw-pane viewer
  over documented status and transcript artifacts. It will not change upstream or
  import the upstream private inspector runner.
- Pane ownership and reload reconciliation can accidentally close user panes. Every
  close action needs an exact package-owned binding and a current Herdr identity.
- A live transcript can contain untrusted model or tool output. It must be rendered
  as terminal data and never interpolated into shell commands.
- Many concurrent children can make a vertical rail short. Full scrollback must
  remain available, and the package must report layout limits honestly rather than
  hide children.
- The package composes another extension factory. Tests must prove one registration,
  one lifecycle owner, clean reload, and no duplicate tools, commands, agents, or
  notifications.
- The composition package deliberately omits upstream bundled skills and prompts.
  Packed-package tests must prove that this does not duplicate or unexpectedly add
  root-profile resources.

## Authority

The parent owns product scope, package boundaries, dependency selection, pane
lifecycle, tests, and final synthesis. The selected execution mode is
**accept-all implementation**. The approved plan can proceed through all accepted
slices without intermediate human approval prompts.

Approval authorizes the pitch, delivery plan, focused tests, package code, package
documentation, release metadata, root-profile integration, orchestration guidance,
and required repository checks on `feat/subagent-herdr-integration`.

Approval does not authorize merge, npm publication, release, deployment, changes to
Herdr or the upstream repository, creation of an external fork, destructive cleanup,
worktree removal, or unrelated remote changes.

## Observable acceptance criteria

- **AC-001 — Current runtime:** The root profile composes the tested
  `pi-subagents` 0.58.0 runtime exactly once and starts without duplicate
  registrations or lifecycle diagnostics. `package.json`, the lockfile,
  `scripts/lib/packages.ts`, root `README.md`, and `docs/architecture.md` agree on
  the extension path, selected resources, and exact dependency pin.
- **AC-002 — Automatic live panes:** In Herdr, each directly observed
  current-session leaf child opens one package-owned live pane without a model turn
  or manual inspector action. This includes each workflow child and each nested
  child whose authoritative status exposes exact identity and artifacts.
- **AC-003 — Accepted layout:** The main Pi pane stays focused and wide on the left;
  child panes stack in the right-side Supervisor Rail.
- **AC-004 — Complete readable evidence:** Each child pane has terminal scrollback
  for the complete available transcript and shows agent identity, state, current
  activity, attention, and terminal outcome without requiring artifact-path hunting.
- **AC-005 — Safe control:** Steer, stop, and supported resume actions use the
  upstream control authority. Closing an inspector pane never changes run state.
- **AC-006 — Honest mutation limits:** Generated mutation-worker launches through
  the Implement contract omit hard tool, turn, and reported-token budgets by
  default. An explicitly supplied limit remains unchanged. If that limit terminates
  work, the pane and parent show a partial or failed handoff at terminal result
  delivery, with missing validation, available changed-file evidence, and a recovery
  action.
- **AC-007 — Parent completion:** Success, failure, stop, partial completion, and
  needs-attention states wake or unblock the exact originating parent without
  polling or sleep.
- **AC-008 — Lifecycle ownership:** Reload, resume, fork, manual pane closure, child
  completion, and session shutdown reconcile state idempotently and close only exact
  package-owned panes.
- **AC-009 — Optional Herdr:** Missing Herdr or Herdr older than 0.7.5 disables only
  automatic panes, reports a bounded diagnostic, and preserves upstream subagent
  execution and FleetView behavior.
- **AC-010 — Independent package:** The new package has its own manifest, tests,
  README, changelog, license, dependency contract, and synchronized release metadata.
- **AC-011 — Verified delivery:** Focused package and orchestration tests, manual
  Herdr launch and `/reload` acceptance, `npm run smoke:source`,
  `npm run smoke:packed`, and `npm run check` pass on the final worktree. Dependency
  and installation changes also pass `npm run security:check`.
