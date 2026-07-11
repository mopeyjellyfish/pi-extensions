---
name: pi-worktrunk
description: Safely creates, activates, uses, deactivates, and removes Worktrunk worktrees through Pi's worktree tool. Use when work needs an isolated branch workspace in Pi.
license: MIT
compatibility: Requires @mopeyjellyfish/pi-worktrunk, Pi 0.80.1 or newer, and Worktrunk wt 0.67.0 or newer on PATH.
---

# Pi Worktrunk

Use Pi's `worktree` tool for Worktrunk lifecycle actions. It is an independent
Pi extension, not an official Worktrunk integration.

## Start or resume work

1. Call `worktree` with `action: "status"` or `action: "list"`.
2. Call `worktree` with `action: "create"`, a branch, and an optional `base`,
   or with `action: "activate"` and a branch name, Worktrunk's `-` shortcut,
   or a PR/MR reference such as `pr:123`, `mr:123`, or a supported forge URL.
3. `worktree` is sequential. A successful create or activate can be followed
   by normal Pi file or agent-Bash tools in the same assistant tool batch.
4. Use `action: "status"` if you need to verify the active route explicitly.

The extension keeps Worktrunk as the lifecycle authority. Do not replace its
configuration, worktree paths, hooks, or approvals with direct Git commands.
If the bounded `worktree list` result is truncated, use agent Bash to run
`wt list --format=json` for the complete Worktrunk result.

## Hooks and configuration

Worktrunk user configuration and a repository's `.config/wt.toml` are separate
scopes. Project hooks are executable configuration. If Worktrunk reports that
a hook needs approval, stop and have the user review and approve it directly
with `wt`; never add `--yes`, disable hooks, or retry automatically for create
or activate.

## Working in the active path

After activation, Pi routes normal `read`, `write`, `edit`, search, and agent
`bash` calls to the active linked worktree. Pi's session itself remains rooted
at its original cwd, so an `@` picker may not discover files that exist only in
the active worktree; use typed relative paths instead.

Agent Bash keeps Pi's configured shell path and command prefix. Routed `!` and
`!!` user Bash retains Pi's command prefix but uses Pi's default local backend
at the active worktree because the extension API does not expose the configured
shell path.

## Finish safely

1. Run tests and inspect the active worktree.
2. Commit or publish only when separately requested; this extension never does
   either.
3. Call `worktree` with `action: "deactivate"`.
4. Use `action: "list"` to obtain the exact current HEAD.
5. Only after explicit user approval, request `action: "remove"` with the
   branch identifier, `expectedHead`, and `confirm: true`.

Removal preserves the branch, refuses dirty or active worktrees, and skips
hooks only after Pi's confirmation. For a native Pi session already rooted in a
new worktree, the user can run `wt switch --create -x pi <branch>` directly;
the extension must not launch nested Pi processes.
