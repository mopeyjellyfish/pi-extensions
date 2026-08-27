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

Create attaches to an existing linked worktree when its exact branch already
exists. Otherwise, it creates the branch and worktree. Activation accepts a
branch name, Worktrunk's previous-worktree shortcut (`-`), or a PR/MR reference
such as `pr:123`, `mr:123`, or a supported forge URL. Removal remains
deliberately exact-branch-only. List output is capped at 20
worktrees; when it is truncated, use agent Bash to run
`wt list --format=json` for the complete Worktrunk result.

Create and activate preserve Worktrunk hooks and approval prompts. This package
never adds `--yes` or retries hook-bearing operations. Review project hooks and
approve them yourself with Worktrunk before retrying Pi's tool.

Treat repository setup as part of activating a fresh worktree. Ignored
dependencies and generated files do not normally carry across worktrees. Read
the repository instructions and identify its declared runtime and dependencies.
Before the first test or build, run the repository-defined setup once and verify
that the required tool or dependency is available. Do not invent setup commands
or assume another worktree's ignored files exist. If setup fails, diagnose the
failure and do not rerun an unchanged command.

Removal is deliberately narrower: it needs interactive confirmation, an exact
HEAD from `worktree list`, a clean inactive worktree, preserves its branch, and
uses `--no-hooks` with Worktrunk's foreground structured removal.

## Bulk cleanup

`worktree` with `action: "cleanup"` returns a complete cleanup preview for up to
100 linked worktrees. This cleanup limit is separate from the ordinary 20-item
`worktree list` limit. The preview lists each candidate and skipped worktree,
its reason, GitHub evidence status, and the exact SHA-256 fingerprint.

Main, current, routed, dirty, locked, detached, in-progress, path-mismatched,
prunable, unborn, and open-review worktrees are protected. An open review always
prevents cleanup. `gh` is optional. GitHub terminal pull-request history can
qualify merged or closed branches. Other forges use only Worktrunk integrated
or empty evidence.

Present the exact cleanup preview and obtain explicit approval for its exact
fingerprint. Then call cleanup with `confirm: true` and the matching
`expectedFingerprint`. Apply recomputes the preview and revalidates each
worktree. Apply reports removed, changed, skipped, and failed worktrees.

Cleanup preserves local and remote branches and does not mutate pull requests.
Cleanup never uses force. Cleanup never uses `--reap` and never kills processes.
Ignored build output inside a removed worktree is disposable.

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
