# pi-git-conventions

`@mopeyjellyfish/pi-git-conventions` is an independent, skill-only Pi package
for repository-aware Git workflows. It does not register an extension or
replace Git, Worktrunk, repository hooks, or project-specific instructions.

## Skills

- `conventional-commit` inspects the actual change, follows repository rules,
  proposes an honest Conventional Commit, and commits only when requested.
- `git-rebase-base` fetches `origin` and rebases the current branch onto an
  explicit or safely resolved `origin/<base>` without pushing.

Git does not record a branch's original base as authoritative metadata. Supply
the base explicitly when the repository or an open pull request does not make
it unambiguous.
