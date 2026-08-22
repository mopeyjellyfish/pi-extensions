---
status: accepted
---

# Plan: Herdr worker panes

The existing uncommitted `packages/herdr-workers/` code is a discarded first
spike. It assumed extension-managed worktrees and an ephemeral coordinator;
do not treat it as a completed slice. Work serially.

## [ ] 001 — Spawn one assigned visible worker

### Outcome

An orchestrator supplies an existing cwd, access mode, bounded task, and
expected evidence. The extension starts exactly one named Pi worker in a
non-focused Herdr split at that cwd and records the worker identity.

### Requirement trace

[Visible worker launch](pitch.md#visible-worker-launch),
[Worktree assignment and writer rules](pitch.md#worktree-assignment-and-writer-rules),
and AC-001 and AC-003.

### Implementation

Create the independent `packages/herdr-workers` extension package and tests.
Its strict `spawn` schema takes `cwd`, `access: read-only|write`, role, task,
and evidence. Validate the supplied existing directory but never invoke a
worktree/branch command. Use Herdr's documented `pane split --cwd --no-focus`,
`agent start --kind pi --pane`, and `agent prompt` commands through a typed CLI
adapter. Pass only worker-scoped coordinator capability values to the child Pi
process.

### Execution mode

serial. This is the smallest end-to-end visible worker path.

### Test posture

tdd with fake Herdr command responses; a focused manual Herdr run proves the
actual Pi pane and no-focus behavior.

### Red signal

A valid supplied cwd cannot create one worker pane, or invalid/missing cwd,
access mode, non-Herdr mode, or untrusted project launches a process.

### Green signal

Tests prove one exact visible launch at the assigned cwd, no focus theft, no
worktree command, and bounded failure diagnostics.

### Verification

Run focused tests/typecheck and a deterministic manual Herdr acceptance run.

### Done when

One real worker visibly runs in the orchestrator-selected existing worktree.

## [ ] 002 — Support shared read-only fan-out and explicit writer assignment

### Outcome

Several read-only workers may use one assigned cwd for QA/review, while writer
assignments retain their explicit orchestrator-selected cwd without the package
attempting worktree conflict management.

### Requirement trace

[Appetite](pitch.md#appetite),
[Worktree assignment and writer rules](pitch.md#worktree-assignment-and-writer-rules),
and AC-002 and AC-003.

### Implementation

Add bounded multi-worker launch and registry records with per-worker access
mode/cwd. Read-only assignments include a no-edit contract. Writing assignments
include a sole-writer/task-boundary contract, but the extension records rather
than infers or creates isolation. Integrate the existing Worktrunk route/event
only as optional orchestration context; do not call Worktrunk or Git lifecycle
commands.

### Execution mode

serial; depends on 001's launch/identity contract.

### Test posture

tdd with shared-cwd read-only and distinct supplied-cwd writer scenarios.

### Red signal

The extension rejects independent shared read-only QA, mutates a worktree, or
silently changes a supplied writer cwd.

### Green signal

Tests prove bounded shared read-only fan-out, exact cwd propagation, and no
worktree/branch command from the package.

### Verification

Run focused tests and manually launch two read-only workers in one disposable
checkout plus writers in pre-created Worktrunk worktrees.

### Done when

The orchestrator—not the package—controls worktree allocation while all worker
panes remain visible.

## [ ] 003 — Durable parent/worker coordination and supervision

### Outcome

Workers send bounded progress, questions, and handoffs to only their parent;
the parent can list, answer, steer, and stop exact named workers across reload
and resume.

### Requirement trace

[Coordinator and supervision protocol](pitch.md#coordinator-and-supervision-protocol),
[Lifecycle, recovery, and cleanup](pitch.md#lifecycle-recovery-and-cleanup),
and AC-004 through AC-006.

### Implementation

Replace the spike's temporary socket with a versioned, authenticated durable
session-owned mailbox/binding. Persist worker identity, pane, cwd, access,
parent session, and terminal status in branch-aware tool details. Use Herdr's
named agent control interface for steer/stop and reconcile with `agent get` /
`pane get`; do not scrape output for control. Add the worker
`contact_orchestrator` and final handoff tools with bounded request/answer
semantics.

### Execution mode

serial; depends on stable worker identities.

### Test posture

tdd with fake time/socket/Herdr adapters and reload/resume reconstruction.

### Red signal

A worker can contact another parent, reload loses/duplicates a worker, or
steer/stop reaches a non-owned pane.

### Green signal

Tests prove exact authenticated routing, bounded waits, branch-aware recovery,
and parent session delivery of final evidence.

### Verification

Run focused tests and manual Herdr reload/resume with an active questioning
worker.

### Done when

The orchestrator can safely supervise workers without terminal-scraping or
orphan adoption.

## [ ] 004 — Terminal cleanup and main-agent operating contract

### Outcome

Created panes close after terminal handoff while supplied worktrees remain. The
user-started main Pi receives reliable, root-loaded instructions for when to
use visible workers, how to assign them, and when direct execution is safer.

### Requirement trace

[Lifecycle, recovery, and cleanup](pitch.md#lifecycle-recovery-and-cleanup),
[Main-agent operating contract](pitch.md#main-agent-operating-contract),
[Fixed decisions](pitch.md#fixed-decisions), and AC-007 through AC-010.

### Implementation

Add idempotent bounded delayed closure for only package-created panes. Ship a
package-owned `visible-workers` skill and load it from the curated root profile.
The skill mandates a `capabilities` preflight before eligible delegation;
defines positive eligibility, direct-execution exclusions, explicit cwd/access
assignment, Worktrunk-before-parallel-writers, handoff review, and parent-owned
checks. Update Implement to reference this contract at its delegation decision
point. Test both standalone package installation and the root profile resource
path. Preserve all Worktrunk, review, delivery, merge, and cleanup authority
outside this package.

### Execution mode

serial; depends on 001-003.

### Test posture

tdd for cleanup/skill contract; source/packed/manual Herdr reload acceptance.

### Red signal

Cleanup closes unrelated panes or changes worktrees, or the root-loaded
main-agent skill omits eligibility, capabilities, cwd/access, handoff, or
direct-execution requirements.

### Green signal

Tests prove only created terminal panes close, the user-started root profile
loads the visible-workers skill, and Implement/that skill provide the exact
assignment and direct-execution contract.

### Verification

Focused tests, `npm run smoke:source`, `npm run smoke:packed`, `npm run check`,
and manual primary/shared-QA/separate-writer Herdr acceptance.

### Done when

The independently installable package and curated workflow meet every accepted
criterion without owning worktree lifecycle.
