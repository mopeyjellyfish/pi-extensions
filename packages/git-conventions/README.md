# pi-git-conventions

`@mopeyjellyfish/pi-git-conventions` is an independent, skill-only Pi package
for repository-aware Git workflows. It does not register an extension or
replace Git, Worktrunk, repository hooks, or project-specific instructions.

## Skills

- `conventional-commit` inspects the complete worktree, plans safe atomic
  Conventional Commit splits, and publishes approved review units through
  `gh stack` when requested.
- `git-rebase-base` fetches `origin` and rebases the current branch onto an
  explicit or safely resolved `origin/<base>` without pushing.

Stacked pull request support uses the optional `github/gh-stack` GitHub CLI
extension. The skill checks for it and does not install it automatically. It
also verifies adjacent branch ancestry and generated pull request metadata
before a stack is ready for review.

Git does not record a branch's original base as authoritative metadata. Supply
the base explicitly when the repository or an open pull request does not make
it unambiguous.
