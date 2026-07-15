# pi-worktrunk

`@mopeyjellyfish/pi-worktrunk` is an independent Pi extension that delegates
worktree lifecycle operations to [Worktrunk](https://worktrunk.dev). It is not
an official Worktrunk Pi integration.

## Prerequisites

- Pi `0.80.1` or newer
- Worktrunk `wt` `0.67.0` or newer on `PATH`

The extension does not install Worktrunk, create Worktrunk configuration, or
need shell integration. It uses `wt --no-cd` and routes Pi tools after a
confirmed Worktrunk switch.

## Workflow

Use the `worktree` tool to inspect, create, activate, deactivate, and safely
remove linked worktrees. The tool is sequential: after a successful create or
activate, later normal file or agent-Bash calls in the same tool batch route to
the selected worktree.

Activation accepts a branch name, Worktrunk's previous-worktree shortcut (`-`),
or a PR/MR reference such as `pr:123`, `mr:123`, or a supported forge URL.
Removal remains deliberately exact-branch-only. List output is capped at 20
worktrees; when it is truncated, use agent Bash to run
`wt list --format=json` for the complete Worktrunk result.

Create and activate preserve Worktrunk hooks and approval prompts. This package
never adds `--yes` or retries hook-bearing operations. Review project hooks and
approve them yourself with Worktrunk before retrying Pi's tool.

Removal is deliberately narrower: it needs interactive confirmation, an exact
HEAD from `worktree list`, a clean inactive worktree, preserves its branch, and
uses `--no-hooks` with Worktrunk's foreground structured removal.

Pi keeps its original session root in this first version. Typed relative file
paths route correctly, but files created only in the active worktree may not
appear in the session's `@` picker. Agent Bash retains Pi's configured shell
and command prefix; routed `!`/`!!` user Bash uses Pi's default local backend at
the active worktree while retaining the configured command prefix.

For a fully native Pi session rooted in a new worktree, run the user-owned
command `wt switch --create -x pi <branch>` directly. This extension never
spawns nested Pi processes.

## Status-line integration

The extension publishes its active route on the versioned Pi event-bus channel
`mopeyjellyfish:pi-worktrunk:route:v1`. The optional
[`@mopeyjellyfish/pi-status-line`](../status-line/README.md) package uses the
routed path and branch as its effective directory and Git branch, replacing the
session checkout's branch instead of appending a second Worktrunk label.

The existing `setStatus()` label remains as a standalone fallback when the
first-party status line is not installed. Deactivation, stale-route cleanup,
and session shutdown clear both representations.

See the bundled `pi-worktrunk` skill and the upstream
[Worktrunk documentation](https://worktrunk.dev/docs) for configuration and
hook details.
