# pi-todo

`@mopeyjellyfish/pi-todo` gives Pi agents a compact, session-aware todo tree for
tracking multi-step work. It supports delivery → slice → step and standalone
tasks. It is a self-contained extension with no runtime
services or project files.

## Why a Pi extension

Pi's extension API supports stateful tools, session-branch replay, commands,
and TUI widgets directly. Successful mutations append versioned custom session
entries, including when called inside codemode. Legacy `todo` tool-result
snapshots remain readable. The latest valid snapshot in branch order follows the active conversation branch
through reload, resume, compaction, fork, and tree navigation without creating
a separate database.

This design combines the useful parts of Codex's concise execution plans,
Claude Code's stable task identity and patch updates, Pi's official stateful
todo example, and the bounded UI/replay approach used by
[`rpiv-todo`](https://github.com/juicesharp/rpiv-mono/tree/main/packages/rpiv-todo).
It deliberately stays smaller than a multi-agent task graph.

## Install

Install the package after it is published:

```sh
pi install npm:@mopeyjellyfish/pi-todo
```

For development from this repository, load only this package:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/todo
```

## Agent tool

The extension registers one `todo` tool. A single call can batch additions or
updates to reduce tool and token overhead.

| Action   | Fields                         | Behavior                                                      |
| -------- | ------------------------------ | ------------------------------------------------------------- |
| `list`   | none                           | Show every item, stable ID, and optional parent ID.           |
| `add`    | `items`, `parentId` (optional) | Append pending roots or children of one parent.               |
| `update` | `updates`                      | Atomically change text and/or status by ID.                   |
| `remove` | `ids`                          | Remove selected items; name the complete subtree of a parent. |
| `clear`  | `all` (optional)               | Clear closed root subtrees, or everything with `all: true`.   |

Omitting `parentId` keeps existing flat calls valid. A supplied parent applies
to every string in the addition batch. Parent links are fixed; reparenting is
not supported. For example, add a delivery root, add seven named slices with
the delivery's ID as `parentId`, then add concrete steps under the active slice.

Statuses are `pending`, `in_progress`, `completed`, and `cancelled`. Only one
item can be explicitly in progress. Starting another actionable item returns
the previous active item to pending. A group with open descendants cannot be
active or completed. When every descendant is completed or cancelled, the group
can become active for final verification and must be completed explicitly.
Closing the last child does not close its parent.

Return an active parent to pending before adding children. Closed parents must
also be reopened first. Reopening a descendant requires reopening all closed
ancestors in the same atomic update; ancestors do not reopen implicitly.
Explicit group cancellation cancels its open descendants and reports every
changed ID, while preserving already completed or cancelled descendants.
Cancellation means work is no longer needed, not paused.

Default `clear` preserves closed descendants under open parents, so local
progress is not discarded. Removing a parent requires naming all remaining
descendants in `ids`. `clear(all: true)` is the explicit whole-tree clear.
IDs remain monotonic after removal and clearing and are not reused on the same
session branch. Agent text, structured output, and snapshot details retain IDs
and parent relationships; human-facing rows omit IDs.

The tree is limited to three levels and 100 total nodes, with 300 characters
per title. Names are unique among siblings after trimming and case normalization;
different parents can reuse a step name such as “Run focused tests”. Calls reject
unknown IDs, duplicate IDs, action-specific extra fields, and invalid restored
snapshots. Batched mutations are atomic: a bad patch does not partially update
the tree or append a state entry.

## Model tracking contract

Active-tool guidance asks the model to decompose non-trivial work before execution.
For multi-slice delivery, name every accepted slice under one delivery root.
Add concrete steps for
the active slice. Do not use one vague “deliver all slices” leaf. Expand future
steps when known. Keep final verification, review, and authorized publication
as named work. The accepted plan owns intent and delivery boundaries. Todo is
only session progress, and unrelated trees stay unchanged.

Activate an actionable step before work or a handoff. Reconcile tracking after
results, repairs, scope changes, and resume. Close steps only with verified
evidence. Close groups explicitly after descendants close and the group outcome
is verified. Paused and future work stays open. A checkpointed turn does not
complete future delivery units.

For delegated work, the parent owns the visible tree. Delegate one coherent
serial delivery unit to one writer with named internal slices, boundaries,
dependencies, and focused proof needs. Activate an actionable step before launch.
The label does not claim live knowledge of child edits or tests. The writer
reports progress and focused evidence by slice without a mandatory per-slice
return/resume handshake. The parent verifies evidence before updating the tree.

Accepted delivery intent authorizes routine in-scope repair and safe writer
recovery. Prefer the retained writer. If continuation is unavailable, inspect
child state and preserve the current diff, evidence, and next action. A replacement
requires confirmed shutdown and transfer of diff/evidence ownership. Never run
concurrent writers in one worktree. If shutdown cannot be confirmed, report that
blocker rather than guess. A timeout alone does not require new permission.
Todo does not require a delegated-run package or share trees between sessions.

## User interface

Human-facing rows show a status pip and the todo title without exposing the
agent's numeric ID:

| Status        | Pip | Theme colour  |
| ------------- | --- | ------------- |
| `pending`     | ○   | grey/dim      |
| `in_progress` | ◉   | amber/warning |
| `completed`   | ✓   | green/success |
| `cancelled`   | ×   | red/error     |

In interactive mode, the tool transcript and persistent widget use the active
Pi theme. Rows follow the tree, with in-progress, pending, completed, then
cancelled ordering among siblings only. Active ancestors use the active pip
without changing their stored status. Each group shows immediate-child
closed/total counts, with cancelled children reported separately. Overall
progress counts roots only, never both a parent and its descendants.

The widget and collapsed tool result reserve the current ancestor path within
the eight-item budget, then add neighboring work with its ancestor context.
An overflow row reports omitted nodes. Long titles use terminal display-width
truncation rather than wrapping the active path out of view.

Expanded tool results and `/todos` show the complete ID-free tree in TUI and RPC UI clients.
RPC uses the same distinct glyphs without terminal colour codes. The
agent-facing `list` action remains useful in print, JSON, and other
non-interactive modes where commands or TUI widgets are unavailable, and its
machine-facing output continues to include stable IDs and parent relationships.

The extension publishes optional structured summaries on two Pi event-bus channels:

- `mopeyjellyfish:pi-todo:summary:v2` carries version 2, `rootProgress`, and
  optional `currentPath`. Progress contains `completed`, `cancelled`, and `total`.
  The path contains at most three nodes with `title`, `displayStatus`, and
  optional `childProgress` counting immediate children. It selects explicit
  active work first, otherwise an actionable pending node, not a group hiding
  open descendants.
- `mopeyjellyfish:pi-todo:summary:v1` remains available for older consumers.
  Its closed/total counts use roots, and its bounded current text puts the
  actionable title before ancestor context.

The optional [`@mopeyjellyfish/pi-status-line`](../status-line/README.md)
prefers version 2 and shows local counts, the current title, and nearest slice
context when space permits. The compact `setStatus()` value remains a standalone
fallback, including nested current context. Empty restoration and shutdown clear
both summaries and owned terminal UI. Todo does not require a consumer package.

## Model reminders

Before each model request, Todo adds one hidden, model-visible reminder to the
request transcript while tracked work is open and the `todo` tool is active.
It includes the current ancestor path with IDs, immediate-child closed/total
counts, and separate cancellation counts. Open work without an explicitly
active actionable item gets a warning and a suggested actionable path.
Titles are shortened and the whole reminder is limited to 1024 characters;
it does not repeat the full tree. Empty, fully closed, or disabled tracking
adds no reminder.

The reminder uses current state after mutations and branch restoration, replaces
only Todo's prior ephemeral reminder, and leaves other messages and tool exchanges
unchanged. It is not saved as a session entry or shown in the UI. It also works
without terminal UI. It asks the model to update tracking before starting or
changing steps, close work only with verified evidence, and keep paused work open.
It cannot prove model compliance, block ordinary tools or paused responses, or
trigger extra model requests. There are no timers or automatic continuation.

## Persistence and scope

Todo state belongs to the current Pi session branch.

New mutations append version-2 snapshots on
`mopeyjellyfish:pi-todo:snapshot:v2`. Valid version-1 custom entries and historical
tool-result snapshots restore as flat roots, preserving next IDs and revisions.
Mixed formats follow branch order, not revision order. Invalid snapshots,
including missing parents, cycles, excess depth, and invalid closure, never
replace the latest valid state. Historical version-1 tool results still render.

- reload and resume restore the latest valid custom-entry or legacy tool-result snapshot;
- list, no-op, cancelled, and rejected mutations append no state entries;
- fork and `/tree` restore the state visible at that branch point;
- compaction does not require a separate state file;
- a new session starts with an empty list;
- different sessions do not share or race on a project-global list.

This first version intentionally omits cross-session sharing, dependencies,
ownership, automatic continuation, and heuristic subagent completion. Those
features add coordination and conflict semantics that are unnecessary for a
small, reliable single-agent progress tool.

## Development

```sh
npm --workspace @mopeyjellyfish/pi-todo test
npm --workspace @mopeyjellyfish/pi-todo run typecheck
npm run smoke:source
npm run check
```

Successful Pi 1 tool results also include schema-described `structuredContent`:
`action`, resulting `items` (ID, optional parent ID, status, text), and `changedIds`. Readable text and
versioned persistence details remain available.
