# pi-todo

`@mopeyjellyfish/pi-todo` gives Pi agents a compact, session-aware todo list for
tracking multi-step work. It is a self-contained extension with no runtime
services or project files.

## Why a Pi extension

Pi's extension API supports stateful tools, session-branch replay, commands,
and TUI widgets directly. Todo state is stored as versioned snapshots in the
`todo` tool's result details, so it follows the active conversation branch
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

| Action   | Fields           | Behavior                                                         |
| -------- | ---------------- | ---------------------------------------------------------------- |
| `list`   | none             | Show every item and its stable numeric ID to the agent.          |
| `add`    | `items`          | Append one or more pending items in execution order.             |
| `update` | `updates`        | Atomically change text and/or status by ID.                      |
| `remove` | `ids`            | Remove selected items.                                           |
| `clear`  | `all` (optional) | Clear completed/cancelled items, or everything with `all: true`. |

Statuses are `pending`, `in_progress`, `completed`, and `cancelled`. Starting an
item automatically returns any other in-progress item to pending, so a
single-agent list has at most one active item. IDs remain monotonic after clear
and are not reused in the same session branch. Tool content and snapshot details
retain those IDs for reliable agent updates even though human-facing rows omit
them.

The schema limits a list to 100 items and item text to 300 characters. Calls
reject duplicate text, duplicate IDs, unknown IDs, action-specific extra
fields, and invalid restored snapshots. Batched mutations are atomic: a bad
patch does not partially update the list.

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
Pi theme. The widget shows up to eight items ordered by in-progress, pending,
completed, then cancelled, followed by an overflow count when needed. The
footer shows closed/total progress.

The `/todos` command shows the complete ID-free list in TUI and RPC UI clients.
RPC uses the same distinct glyphs without terminal colour codes. The
agent-facing `list` action remains useful in print, JSON, and other
non-interactive modes where commands or TUI widgets are unavailable, and its
machine-facing output continues to include stable IDs.

## Persistence and scope

Todo state belongs to the current Pi session branch:

- reload and resume restore the latest valid snapshot;
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
