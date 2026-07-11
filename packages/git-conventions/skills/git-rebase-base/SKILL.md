---
name: git-rebase-base
description: Safely fetch origin and rebase the current local branch onto a verified origin base branch without pushing. Use when updating a feature branch from its explicit base, rebasing onto an open pull request's target branch, or continuing or aborting conflicts from that rebase.
---

# Git Rebase Base

Rebase only after identifying the intended base from reliable repository or
user context. A successful rebase rewrites the current branch's commits; it
does not merge, push, or change the remote branch.

## Resolve the base

Git does not record the branch from which a branch was originally created as
authoritative metadata. Resolve `base` in this order:

1. Use an explicit base supplied by the user. Normalize `origin/<name>` to
   `<name>` and reject a different remote.
2. If no base was supplied, use the target branch of the current open pull
   request when an already-authenticated repository tool can report it.
3. Otherwise stop and ask for the base. Never guess it from a merge base,
   upstream tracking branch, branch name, or repository default alone.

Validate the base as a branch name and require an `origin` remote. Refuse a
detached HEAD, the base branch itself, or an option-like value.

## Check rebase readiness

Read the governing `AGENTS.md`, contribution guidance, and rebase policy. Then
inspect the current branch with `git status --short` and the normal detailed
status.

Require a clean worktree and index. Refuse to start while a merge, rebase,
cherry-pick, or revert is already in progress. Never use `--autostash`, discard
changes, or create a stash automatically. Ask the user to finish or preserve
their work first.

State the current branch, resolved base, and planned mutation before running
it. Do not rebase unless the user explicitly requested the operation and the
base is unambiguous.

## Fetch and rebase

Run the network update first:

```sh
git fetch origin
```

Verify `refs/remotes/origin/$base` exists. Record the original `HEAD`, show the
commits that will be replayed with `git log --oneline origin/$base..HEAD`, and
then run the equivalent of `git rebase origin/$base` using the resolved,
properly quoted remote ref.

Do not substitute `pull --rebase`, merge the base, rebase other worktrees, or
add unrelated mutation flags.

## Handle the result

On success, run `git merge-base --is-ancestor origin/$base HEAD`, inspect the
new concise log and `git status --short`, and report the old and new `HEAD`
values.

On a conflict, stop and report the conflicted paths plus the current rebase
status. Never stage a guessed resolution or continue automatically. If the
user asks for help, resolve each conflict deliberately, run relevant tests,
and use `git rebase --continue`; use `git rebase --abort` only when the user
chooses to restore the recorded pre-rebase state.

Never push or force-push the rewritten branch, delete branches, or modify the
base branch unless the user separately requests that action.
