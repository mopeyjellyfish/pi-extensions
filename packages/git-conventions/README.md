# pi-git-conventions

`@mopeyjellyfish/pi-git-conventions` is an independent, skill-only Pi package
for repository-aware Git workflows. It does not register an extension or
replace Git, Worktrunk, repository hooks, or project-specific instructions.

## Skills

- `commit` inspects the complete worktree, plans safe atomic Conventional Commit
  splits and local branch topology, stages explicit paths or hunks, and validates
  each committed unit. A later delivery workflow owns remote publication.
- `git-rebase-base` fetches `origin` and rebases the current branch onto an
  explicit or safely resolved `origin/<base>` without publishing it.
- `resolving-merge-conflicts` recovers both intents in an in-progress merge or
  rebase, repairs each hunk deliberately, runs required checks, and continues
  only after verification. It permits a human-selected abort and an
  intent-preserving bounded push only for the current safe task branch.

The conflict method may publish only the current non-default, non-protected
branch to `origin`. After a rebase, it first verifies the expected remote state
and uses `--force-with-lease`; it never uses plain force, pushes tags, or pushes
to another remote, a default branch, or a protected branch.

Git does not record a branch's original base as authoritative metadata. Supply
the base explicitly when the repository or an open pull request does not make
it unambiguous. This independent package does not automatically install a Git
agent, Worktrunk, GitHub CLI, or companion extensions; use the direct parent
and install documented external requirements when they are needed.
