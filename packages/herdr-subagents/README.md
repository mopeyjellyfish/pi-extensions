# pi-herdr-subagents

`@mopeyjellyfish/pi-herdr-subagents` composes the published
`pi-subagents@0.58.0` runtime with automatic Herdr transcript panes. It does not
fork or patch upstream code. `pi-subagents` remains the only authority for
execution, status, persistence, controls, resume, completion delivery, and
process-terminal proof.

## Behavior

When a parent Pi session runs in Herdr 0.7.5 or later, the extension opens one
raw pane for each current-session child whose public lifecycle evidence contains
an exact run identity and transcript artifact.

The Supervisor Rail:

- keeps the main Pi pane focused and at 60% width on the left;
- opens the first child pane on the right and stacks later children below it;
- supports direct async, workflow, publicly identified nested, and structured
  foreground children;
- keeps every exact child visible without a hidden-child cap;
- uses native Herdr zoom and terminal scrollback when many children make panes
  compact;
- shows state, agent, run identity, and the complete available human-readable
  output artifact;
- keeps successful, failed, stopped, partial, blocked, and needs-attention panes
  open until the user closes them or the parent session ends.

Closing a transcript pane never stops, interrupts, dismisses, resumes, or
otherwise changes its child. A manually closed pane stays dismissed for that
run.

## Pane controls

Type a command in an owned transcript pane:

```text
:stop
:steer Continue with the focused test.
:resume Apply the parent decision and continue.
```

Steer, stop, and resume use the public `pi-subagents` event-bus RPC when it
supports the exact target. Stop can use the exported public control-channel seam
for an exact async directory when RPC declines it. Unsupported foreground or
child-level controls remain display-only.

The keyboard bridge binds to a random loopback port and gives each pane a
separate capability token in its mode-0600 descriptor. The server binds that
token to one exact run, index, and async directory, and rejects foreign target
fields. Tokens never appear in command text, process arguments, pane output, or
shell history. Model, tool, path, and transcript text
are data. Herdr receives variable paths through structured `split --env` values,
and `pane run` receives one fixed non-secret command.

## Lifecycle

The package starts watchers and its loopback endpoint during `session_start`.
An idle `/reload` retains exact owned pane bindings and descriptors in the same
Pi process. The reloaded extension adopts them, binds a fresh loopback endpoint,
and updates each private descriptor with the new control capability.
Normal session shutdown closes only exact package-owned panes and removes private
temporary descriptors. A missing pane is treated as a user dismissal and never
as permission to stop the child.
If the parent process disappears without shutdown, the viewer prints one bounded
message, closes its watchers and input, and exits without changing the child.

The viewer removes active terminal control sequences from untrusted transcript
text while preserving normal text and package-owned ANSI state labels. It
follows append and replacement updates without deleting host scrollback.

For session JSONL, the viewer renders transcript evidence as structured role,
tool-call, and tool-result sections. Package-owned ANSI labels distinguish
read, write, edit, bash, and other tools, and failed results use an error label.
Multiline code, diffs, arguments, and results remain readable. Visible custom
messages retain their transcript type, while messages marked as hidden stay
hidden. The viewer shows diagnostics only when an assistant message or tool
result contains them; it does not generate diagnostics or run Pi in the pane.

## Compatibility and fallback

Automatic panes require all of these conditions:

- a parent Pi TUI process, not a child runtime;
- `HERDR_ENV=1` with an exact parent pane identity;
- Herdr 0.7.5 or later;
- `pi-subagents` event-bus RPC v1;
- an exact current-session child identity and documented artifact path.

If a condition is absent or incompatible, automatic panes stay inactive. The
upstream subagent tool, FleetView, on-demand inspector commands, artifacts,
completion notifications, and non-Herdr behavior continue unchanged.

The package deliberately does not load upstream bundled skills or prompts. A
profile can select those resources explicitly without duplicate registration.

## Installation

Install the composition package instead of separately loading the upstream
extension:

```sh
pi install npm:@mopeyjellyfish/pi-herdr-subagents
```

The package declares its own exact `pi-subagents` runtime dependency. A profile
that loads upstream prompt paths directly must also retain its direct exact
`pi-subagents` dependency so those root paths remain stable.

## Failure recovery

If a child stops because of an explicit execution limit, use the visible
terminal handoff before continuing. Confirm changed files, validation that did
not run, and the supported recovery target. Do not infer that a partial writer
is still running, launch a blind replacement writer, or treat a missing pane as
missing run evidence.
