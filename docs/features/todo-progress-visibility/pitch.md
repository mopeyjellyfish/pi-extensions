---
status: accepted
---

# Shape: Visible nested Todo progress

## Problem and evidence

A large delivery can stay on one active item, such as “Deliver seven slices”.
The user cannot see the active slice or step without asking the model.

The current Todo extension stores only `id`, `status`, and `text`.
Its widget shows eight flat rows, ordered by status.
The optional Status Line receives a flat progress count and current title.
The tool guidance asks for meaningful steps, but does not require slice-level
tracking or provide runtime reminders.
See `packages/todo/src/index.ts` and `packages/todo/README.md`.

The current Engineering implementation method can give a Worker one delivery
unit containing several slices. It has no explicit parent-visible Todo contract.
See `packages/engineering/skills/implement/SKILL.md`.

The user selected three levels: delivery → slice → step. The user also selected
guidance and runtime reminders, without hard workflow gates. For delegated work,
the user selected named slice handoffs before automatic child progress integration.

## Proposed solution

### One session-owned tree

Extend the existing `todo` tool with optional parent relationships and stable
numeric IDs for every node. Support at most three levels and retain the existing
flat-list calls. A standalone task remains valid without children.

Keep the existing statuses: `pending`, `in_progress`, `completed`, and `cancelled`.
Allow one explicitly active work item across the session tree. Show its ancestors
as the active path, not as competing work items. A group with open children must
point to an actionable child rather than hide work behind its broad title.

Do not infer completion from tool activity or from the last child closing.
Require explicit group completion after its descendants close and its outcome is
verified. Track final checks, review, and publication as named work too. Do not
mark a delivery complete merely because its implementation slices are finished.
A paused task remains open. Cancellation means work is no longer needed.

Keep mutations atomic. Reject missing parents, cycles, excess depth, and invalid
closure. Allow repeated step names under different parents, but reject duplicate
names among siblings. Define removal, clearing, and group cancellation so they
cannot leave orphaned or silently discarded open work.

Retain the 100-node and 300-character text limits for this first version.
Read existing version-1 snapshots and legacy tool-result snapshots as flat roots.
Version the new persisted format and restore the active branch without state files.

### Persistent, useful Pi visibility

Use the existing Pi theme, status glyphs, widget placement, and ID-free human rows.
This is a terminal progress extension, not a new web interface. No generated
visual direction or `DESIGN.md` is needed.

The persistent widget reserves space for the active path before allocating space
to other work. Overflow must never hide the active slice or step. Show local
closed/total child counts, with cancelled work distinguishable from completed
work. Do not count a parent and its children as separate completed outcomes.

For example, during a delivery containing seven slices:

```text
◉ Deliver feature — 3/7 slices closed
  ◉ Slice 4: Restore nested session state — 1/3 steps closed
    ◉ Implement branch replay
    ○ Run focused verification
```

The example explains hierarchy and priority, not exact terminal spacing. Counts
use the actual child list. If final gates are children of the delivery, include
those children and use a neutral label rather than mislabel the count as slices.
At narrow widths, preserve status, hierarchy, and recognizable active titles.
Use bounded truncation or wrapping without losing the active path.

`/todos` and expanded tool results show the complete tree. Agent-facing text and
structured output retain IDs and parent relationships. RPC output stays plain.
Print and JSON modes remain useful without terminal UI.

Extend the optional Status Line integration with a versioned hierarchical summary.
Show the current actionable step with its slice context at usable widths.
Keep compatible flat-summary and standalone-status behavior. Todo must not require
Status Line or any delegated-run package to work.

### Models maintain the tree

Put the general tracking contract in Todo's tool guidance so independent installs
receive it. Require models to decompose large work before execution, name every
accepted slice, and add concrete steps for the active slice. Avoid one vague
“deliver all slices” leaf. Expand future slice steps when those steps are known.

Update Engineering implementation guidance and the private Worker handoff guidance
to apply the same contract. Planning supplies named slices. The accepted plan
remains authoritative for intent, dependencies, and delivery boundaries. Todo is
a session progress view, not a second plan or a repository artifact.

Update tracking before a step or delegated slice starts. Close steps only after
the named evidence is available. Reconcile after results, repairs, scope changes,
and resume. Preserve unrelated tasks. Do not close future delivery units merely
to end a checkpointed turn.

Add a bounded model-visible reminder at supported model-call or run boundaries.
Include the active path, local progress, and a compact warning for open tracking
with no active actionable item. Keep the reminder current after Todo mutations
and branch navigation. Do not accumulate duplicate history entries, replace the
user's system prompt, trigger extra model runs, or guess whether an empty list
means a task needs tracking.

Reminders cannot prove that a model is tracking honestly. Structural checks,
explicit guidance, and observable acceptance scenarios provide the available
controls. Do not block Bash, reads, edits, or normal paused responses for workflow
compliance. Do not automatically complete or cancel open items.

### Delegated slice handoffs

The parent owns its visible delivery tree. Before launching a Worker, mark the
named slice and delegated step active. A delegated step can be “Implement and
verify this slice”. Do not present that label as live knowledge of internal edits
or test phases.

Return to the parent between slices, inspect the focused evidence, and update
progress. Resume the same retained Worker for the next accepted slice in the
same serial delivery unit. Do not create a new Worker, branch, review boundary,
or pull request for each slice. Distinguish planned slice continuation from a
repair resume and preserve existing authority and pause conditions.

Use the host's supported retained-run continuation. If unavailable, report the
visibility limit and pause rather than silently hand off all remaining slices or
start a replacement writer. Independent installs must not assume private agent
names or this repository's tools.

### Delivery shape

Plan the smallest end-to-end behaviors:

1. Create, mutate, and restore a bounded nested tree through the public Todo tool.
2. Show the active path and local counts in the widget, full view, and Status Line.
3. Supply bounded current-state reminders without unwanted continuation or blocking.
4. Track named slices through parent-owned delegated handoffs and evidence-based closure.

These slices form one coherent delivery unit and one pull request. Atomic commits
do not change that boundary. The pitch and plan have no independent publication
value and accompany implementation.

## Boundaries and no-gos

- Own production changes in Todo, its optional Status Line consumer, and the
  directly affected Engineering guidance. Update planning guidance only where
  needed to carry named slices into execution.
- Keep independent package installation. Do not add a workspace-only runtime link
  or a required `pi-subagents` dependency to Todo.
- Do not add arbitrary-depth trees, dependencies, ownership scheduling,
  cross-session sharing, a task database, or repository Todo files.
- Do not build automatic child-to-parent Todo synchronization in this version.
- Do not infer semantic progress from elapsed time, tool names, filenames,
  child output text, or subagent success alone.
- Do not add hard workflow gates, automatic continuation loops, or automatic
  completion. Do not cancel unfinished work to create a completed-looking list.
- Do not rewrite earlier accepted feature documents or add tests for Markdown
  wording. Review guidance as text and test executable behavior.
- Reshape if live internal Worker steps become mandatory, three levels or 100
  nodes are insufficient, or package independence requires a new integration service.

## Decision-changing research and risks

Pi 1.0.3 supports active-tool `promptGuidelines`, model-call `context` transforms,
and persistent `setWidget` components. Reminders and widget rendering do not
require a new service. `agent_end` is not a settled completion boundary. Automatic
continuation can loop, so this proposal does not request continuation.
A read-only Researcher compared the installed Pi 1.0.3 declarations, runtime,
and complete extension and TUI documentation.

Pi's extension event bus is in-process only. The pinned `pi-subagents` 0.50.0
integration documentation confirms that separate child processes do not share
that bus. Parent-visible Todo therefore uses explicit slice handoffs, not a
fictional automatic event bridge. Dependency setup made the pinned integration
documentation available after the initial research pass.

Key risks are replay migration, ambiguous group status, misleading counts,
active-path overflow, reminder token overhead, and unavailable retained Workers.
Focused tests cover state and rendering. A real Pi acceptance loop covers reload
and the representative multi-slice workflow. Guidance is not a semantic guarantee
that every model complies.

## Review evidence

- **Applicability:** `not applicable`. No Go source, module, CLI, or Go-specific
  guidance is proposed.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

Material state, persistence, lifecycle, and package-consumer changes require a
fresh fixed-diff Reviewer during implementation. Deterministic checks remain
parent-owned. Select QA only for diagnosis or ambiguous interactive proof.

## Authority

The parent owns product decisions, architecture, synthesis, approval, and final
verification. The user approved this pitch for complete planning, not implementation.

The user selected an **accept-all implementation preference**. Whole-plan approval
must grant that authority before implementation starts. Approval does not authorize
merge, release, deployment, destructive cleanup, or unrelated changes.

Use the same isolated task worktree through planning and serial implementation.
After pitch approval, record acceptance and create the bounded pitch commit.
Defer pull-request publication to the completed implementation delivery unit.

## Observable acceptance criteria

- **AC-001 — Nested tracking:** A delivery can contain seven named slices. Each
  slice can contain concrete steps with stable IDs and parent relationships.
  Existing flat calls remain valid.
- **AC-002 — Safe state:** Invalid parent, depth, duplicate, closure, removal,
  or clearing operations fail atomically. Open descendants cannot disappear
  through accidental group completion or clearing. Repeated step names under
  different slices are valid.
- **AC-003 — Honest activity:** Only one actionable item is explicitly active.
  Its ancestors show the active path. Child completion does not silently finish
  a group. Final delivery gates remain visible as unfinished work until verified.
- **AC-004 — Visible current work:** With more rows than the widget can display,
  the active delivery, slice, and step remain visible. Counts are local and do
  not double-count descendants. Complete and cancelled outcomes remain distinct.
- **AC-005 — All surfaces:** `/todos`, expanded tool output, structured output,
  RPC, and non-interactive output preserve hierarchy. Optional Status Line shows
  the current step and slice context without duplicate standalone status.
- **AC-006 — Branch-safe replay:** Existing snapshots restore as flat roots.
  Nested state follows reload, resume, compaction, fork, and tree navigation.
  Shutdown clears owned UI and any runtime registrations.
- **AC-007 — Bounded reminders:** A model receives current active-path guidance
  during tracked work. Missing active work gets a reminder. Empty or closed
  tracking adds no unnecessary reminder. No hook triggers automatic extra runs,
  blocks unrelated tools, or accumulates duplicate reminder entries.
- **AC-008 — Seven-slice scenario:** In a representative Pi session, the model
  creates seven slice children, activates a concrete step before work, and
  advances tracking with verified evidence. The user can identify the current
  slice and step without asking. Pause and resume leave unfinished work honest.
- **AC-009 — Delegated visibility:** The parent shows a named slice and delegated
  step before each handoff. Progress advances between slices using the same
  retained Worker. Unsupported continuation is reported and pauses execution.
  The display does not claim automatic knowledge of internal child steps.
- **AC-010 — Delivery proof:** Focused executable tests, real Pi reload acceptance,
  source smoke, and `npm run check` pass against the final implementation tree.
  Documentation changes use formatting, lint, and human review, not prose tests.
