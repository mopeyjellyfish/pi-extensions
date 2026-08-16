---
status: accepted
---

# Shape: Herdr worker panes

## Executive summary

Add `@mopeyjellyfish/pi-herdr-workers`, a Pi extension that turns one visible
Pi session into an orchestrator. When that session delegates implementation, it
creates real interactive Pi workers in Herdr split panes. Each worker visibly
runs Pi in the worktree assigned by the orchestrator, receives a bounded task, reports progress,
questions, and a final handoff to the orchestrator, then its pane closes after
the handoff.

This package owns its worker protocol. It does not depend on, patch, import
private paths from, or duplicate an upstream `pi-subagents` runtime. The
current `pi-subagents` package may continue to serve other delegation paths.

## Problem

Shape and Plan happen in the main Pi pane, but implementation delegation today
runs out of sight. Its detailed output requires inspecting an in-Pi fleet view
or explicitly opening a dashboard. The user wants the work to be visible in
Herdr as it happens: one central orchestrator pane beside real worker panes.

The requested workers cannot be only dashboards. A dashboard mirrors a hidden
headless child; it does not own an interactive Pi process, a separate working
directory, or a direct terminal for inspecting and intervening in the work.

The repository cannot change the upstream `pi-subagents` project. A local
package therefore needs a small explicit cross-process worker protocol, rather
than relying on the upstream package's private inspector and control code.

## Appetite

Deliver one independent production extension package plus the smallest
Implement-skill and root-profile integration necessary for a main Pi session to
launch and supervise real worker panes in Herdr.

V1 supports a bounded fan-out of visible workers. Each assignment names its
existing worktree and declares whether it is read-only or writes files. The
orchestrator uses the existing Worktrunk extension to create, select, and later
clean up worktrees when that is needed.

Read-only workers may share a worktree—for example, parallel QA across several
games. The orchestrator assigns every writer a suitable worktree and prevents
conflicting writers. A writer may intentionally share the orchestrator's
worktree when it is the sole active writer there.

This package never creates a worktree or branch, creates a pull request,
merges, pushes, deletes a branch/worktree, or removes a pane it did not create.

Stop and reshape if Herdr cannot provide the required worker-pane, worktree,
or agent-control contract without scraping terminal text or bypassing its
safety controls.

## Research and prior art

Herdr can split a pane with an explicit cwd, start a supported interactive Pi
agent in the resulting shell pane, submit a prompt to that named agent, read
its terminal output, wait for its lifecycle state, and send logical interrupt
keys. It can also create Git worktree-backed workspaces.

Pi extensions can register model-visible tools and commands, subscribe to
session and agent lifecycle events, persist branch-aware session entries, and
run only TUI-specific behavior when `ctx.mode === "tui"`. A child Pi process
can load the same root profile and its extension can identify an inherited,
capability-scoped worker environment.

The installed `pi-subagents` 0.50.0 already demonstrates useful constraints:
background work needs durable status, bounded output, cancellation, and parent
supervision. Its public API does not provide the visible interactive-worker
lifecycle required here, so this package must have a separate public contract.

## Solution

### Orchestrator and worker roles

The package has two runtime roles selected by inherited worker environment:

- **Orchestrator role:** loaded in the user-facing main Pi pane. It validates
  Herdr/TUI availability, owns the worker registry and local coordinator, and
  exposes the model-visible worker-management tool.
- **Worker role:** loaded only in a Pi process launched by the orchestrator.
  It receives one assignment, has no authority to create sibling workers, and
  reports lifecycle, progress, questions, and its bounded final handoff to the
  exact originating orchestrator.

The primary public tool will support `capabilities`, `spawn`, `list`, `steer`,
`answer`, `stop`, and `handoff`-inspection actions. Worker assignments specify
a role, objective, assigned cwd, access mode, expected evidence, and result
contract. The tool must reject use outside a Herdr TUI and return an actionable
non-interactive explanation rather than silently creating processes.

### Main-agent operating contract

The package ships an independently installable `visible-workers` skill, and the
curated root profile loads it for the user-started main Pi session. The skill
makes the worker tool an explicit part of implementation work rather than an
undiscoverable optional capability.

Before delegating, the main agent checks `capabilities` and uses visible workers
when Herdr is available and the work is bounded, independently reviewable, long
running, or benefits from visible human supervision. It supplies every worker's
existing cwd and `read-only` or `write` mode, complete task, expected evidence,
and handoff contract. It uses Worktrunk first when it decides parallel writers
need separate worktrees.

The skill says not to spawn a worker for a trivial direct edit, strictly
sequential work, a conflicting shared-writer task, an untrusted project, or a
non-Herdr/non-TUI session. In those cases the main agent explains the direct
execution choice and continues safely. It requires the main agent to inspect
handoffs and diffs, run the parent-owned checks, and never infer authority to
merge, commit, push, or clean up a worktree.

The Implement skill references this contract and requires the capability check
at its delegation decision point. A skill directs reliable use but cannot force
a model to invoke a tool; the extension's strict capability and assignment
validation remains the enforcement boundary.

### Visible worker launch

For every accepted `spawn`, the orchestrator:

1. validates the requested role, bounded fan-out, target cwd, and authority;
2. validates the explicitly assigned existing worktree against the task;
3. creates a non-focused Herdr split pane with that worktree as its cwd;
4. starts a named interactive Pi agent in that pane;
5. submits the exact bounded assignment; and
6. records the opaque worker, pane, worktree, branch, and coordinator identities
   in parent-session state.

The worker visibly performs its own Pi tool calls and messages in that pane.
The main orchestrator keeps focus and may continue planning, supervising other
workers, or awaiting results.

The worker Pi process uses the normal root/profile resources, but receives only
capability-scoped coordinator environment values. It must not inherit raw
parent prompts, session files, credentials, or arbitrary environment data
through the protocol.

### Worktree assignment and writer rules

The orchestrator supplies the existing absolute worktree path and the access
mode on every assignment. The worker uses that exact cwd; it does not create,
switch, select, or remove worktrees.

**Read-only** workers may share any worktree. This enables independent QA,
research, verification, or review fan-out without unnecessary worktree
creation. Their assignment explicitly prohibits project and source edits.

**Writing** workers use the worktree chosen by the orchestrator. For one
bounded implementation task, it may be the orchestrator's worktree. For
parallel implementation tasks, the orchestrator creates and assigns distinct
Worktrunk worktrees before spawning workers. The extension records the claimed
access mode and assigned cwd but does not replace the orchestrator's
worktree-conflict decision.

Every final handoff identifies the assigned worktree, branch when available,
changed files/diff state, commands run, result, and residual risks. Worktree
creation, review, merge, and cleanup remain separate Worktrunk- and
human-authorized workflows.

### Coordinator and supervision protocol

On session start, the orchestrator creates a private, authenticated local
coordinator endpoint in user/session-scoped storage. Each spawn gets a unique
short-lived capability token, worker id, and endpoint—not parent credentials or
unbounded session data.

The protocol has versioned, size-limited messages for:

- worker registration and heartbeat;
- state (`starting`, `working`, `blocked`, `handoff`, `failed`, `stopped`);
- bounded progress and final evidence;
- a worker question plus an orchestrator answer; and
- explicit cancellation/cleanup acknowledgement.

A worker uses a dedicated `contact_orchestrator` tool when it needs a decision.
The request appears in the main orchestrator context. The orchestrator answers
through the worker-management tool, which delivers the response to the exact
worker. The extension must bound waiting, support cancellation, and surface a
clear timeout or disconnected-parent state rather than leaving either Pi
session stuck.

The worker final handoff is appended to the parent session as a bounded,
identifiable message. It is a report to the main agent, not a replacement for
main-agent review of the branch/worktree diff.

### Lifecycle, recovery, and cleanup

The worker registry is reconstructed from parent session state after startup,
reload, resume, and fork. It reconciles recorded worker identities with Herdr's
live agent/pane state and reconnects the coordinator without duplicating
workers or panes. A child with no live trusted coordinator enters a visible
failed/blocked state; it is never silently adopted by another parent session.

After a successful or failed terminal handoff is delivered, the orchestrator
closes only the pane it created, after a short bounded configured delay. Closing
the pane does not delete its worktree, branch, handoff, or worker session. The
same rule applies during shutdown only after bounded best-effort result
collection; the extension must not kill unrelated panes or mutate a live
worker's worktree.

## Fixed decisions

- Workers are real interactive Pi sessions in Herdr panes, not headless-child
  dashboards.
- One main Pi session is the visible orchestrator and sole coordination owner.
- The package is an independent local production extension; no upstream
  `pi-subagents` change is required.
- Each assignment receives an explicit existing worktree and `read-only` or
  `write` access mode from the orchestrator.
- Read-only workers may share a worktree. The orchestrator uses Worktrunk and
  task scope to prevent conflicting writers; this package neither creates nor
  manages worktrees.
- GitHub stack, push, PR, merge, branch creation/deletion, and worktree removal
  remain explicit later actions outside V1.
- The user-started main Pi receives a root-loaded operating skill that defines
  when visible delegation is required, when direct work is safer, and the exact
  assignment/handoff checklist.
- The orchestrator keeps focus when workers spawn.
- Worker communication uses a local authenticated, versioned, bounded protocol
  and named coordinator tool; never terminal scraping as control transport.
- Final reports go to the parent session; the parent remains responsible for
  review, synthesis, and delivery decisions.
- Only created worker panes close automatically; created worktrees and branches
  remain intact.
- TUI/Herdr absence is an explicit unsupported-mode result, not a fallback to
  invisible execution.

## Rabbit holes

- Do not reproduce all of `pi-subagents`: no generic chains, schedules,
  missions, model fallback engine, artifact format, or recursive subagents.
- Do not implement GitHub stacks, pull requests, merges, or cleanup automation.
- Do not add a second worktree manager or duplicate Worktrunk's lifecycle.
- Do not communicate by parsing worker terminal output or sharing session files.
- Do not allow a worker to launch workers, take ownership of another worker, or
  connect without its exact capability token.
- Do not auto-load a project `.pi/settings.json` merely to make workers work.

## No-gos

- No upstream `pi-subagents` modification or private import.
- No raw credential, parent-session, prompt-history, or arbitrary environment
  forwarding to workers.
- No standard-output diagnostics from the extension.
- No worker launch in RPC, JSON, print, non-Herdr, or untrusted project mode.
- No automatic push, PR, merge, worktree selection/creation/deletion, or
  branch creation/deletion.
- No pane focus theft, duplicate worker, orphan adoption, or unbounded
  reconnect/wait loop.

## Acceptance criteria

- **AC-001 — Visible primary worker:** From a Herdr TUI orchestrator, a
  `spawn` action starts a named interactive Pi worker in a non-focused split
  pane using the primary worktree and displays its actual work.
- **AC-002 — Shared read-only work:** Multiple read-only workers can visibly
  run in the same assigned worktree, each with an explicit no-edit assignment.
- **AC-003 — Orchestrator-selected writer worktrees:** A writing worker uses
  the exact existing worktree supplied by the orchestrator. The extension does
  not create, switch, or delete a worktree; separate parallel writer worktrees
  are supplied through Worktrunk.
- **AC-004 — Parent coordination:** Workers report bounded progress, question,
  blocked, terminal, and final-evidence messages to their exact parent. The
  parent can answer, steer, list, and stop a named worker through the public
  tool.
- **AC-005 — Safe result handoff:** A completed worker reports its worktree,
  branch, changed files/diff state, commands, result, and residual risks into
  the parent session. The parent remains free to review or reject the work.
- **AC-006 — Lifecycle recovery:** Reload, resume, and fork restore only the
  originating parent registry, reconcile live created panes, and never duplicate
  or adopt workers.
- **AC-007 — Bounded cleanup:** After terminal handoff, only the created pane
  closes after its configured bounded delay; the worktree, branch, session, and
  handoff remain available.
- **AC-008 — Failure and mode safety:** Invalid tokens, disconnected parents,
  protocol errors, Herdr/process/worktree failures, cancellation, untrusted
  projects, and non-TUI modes fail visibly with bounded diagnostics and leave
  unrelated panes/worktrees untouched.
- **AC-009 — Main-agent guidance:** The package installs a visible-workers skill
  and the curated root profile loads it. The Implement skill requires the main
  agent to check worker capability and apply the explicit eligibility,
  worktree/access, handoff, review, and direct-execution rules.
- **AC-010 — Package quality:** The package is independently installable with
  manifest/release metadata, focused protocol/process/lifecycle/skill tests,
  source and packed smoke coverage, and a documented deterministic Herdr reload
  acceptance path.
