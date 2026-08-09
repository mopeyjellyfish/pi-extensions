---
name: conventional-commit
description: Create, split, validate, and optionally make repository-aware atomic Conventional Commits, and suggest a matching valid branch name. Use when naming a branch, drafting or checking commit format, splitting changes into logical commits, or committing work after the user requests it.
---

# Conventional Commit

Build the message from repository truth and the exact logical unit being
committed. Treat message generation and `git commit` as separate decisions.

## Establish the rules

1. Read the governing `AGENTS.md`, `CONTRIBUTING.md`, commit documentation,
   commitlint configuration, and release rules that apply to the repository.
2. Inspect recent commit subjects to learn local scopes and vocabulary.
3. Let explicit repository rules override the defaults in this skill.

Do not install or download a commit validator. Use repository-provided commit
validation when it exists.

## Name a branch

Branch naming is not part of Conventional Commits. Follow repository or issue
tracker rules first. When no rule exists, suggest `<type>/<kebab-slug>`, using
the same honest change type and concise domain language that would fit the
eventual commit, for example `feat/git-conventions` or `fix/session-restore`.

Keep the name meaningful, lowercase, and free of user-specific prefixes unless
the repository requires them. Validate the candidate with
`git check-ref-format --branch` before presenting or using it.

Never create or rename a branch without an explicit user request. Do not rename
a branch already attached to another worktree.

## Inspect the worktree

Run `git status --short --untracked-files=all`, `git diff --stat`, `git diff`,
`git diff --cached --stat`, and `git diff --cached`. Inspect each untracked file
before assigning it to a unit. Use the complete working tree, not only the first
file or the staged summary.

For one staged logical unit, continue to message drafting. If nothing is staged,
explain what can form one logical unit, but do not stage it without
authorization.

## Plan an atomic split

Use this workflow when the user asks to split mixed changes into several
commits.

1. Require an empty Git index with
   `git diff --cached --quiet --ita-visible-in-index`. This also detects
   intent-to-add entries. If any change is staged or partially staged, preserve
   it and stop. Ask the user to finish that
   unit or change the index explicitly. Never reset or unstage pre-existing work.
2. Inventory every changed path and the relevant hunks. Group changes by one
   observable outcome, package boundary, or inseparable dependency. Keep source,
   its focused tests, and its necessary documentation in the same unit. Let the
   source behavior supply the headline when tests, documentation, or configuration
   support that behavior.
3. Exclude each lockfile from semantic grouping. Attach it to the unit that owns
   its manifest change. If several changed manifests share a shared lockfile,
   keep those dependency metadata changes in one unit. Split them only when the
   user approves sequential lockfile regeneration and validation for every
   intermediate commit. Sequential lockfile regeneration is the narrow
   exception to the rule against changing working-tree content to manufacture a
   split. Inventory and validate every regenerated intermediate state.
4. Order units by dependency. Put shared contracts and prerequisites before
   their consumers. Put documentation-only follow-up after the behavior that it
   describes.
5. Present an ordered plan. For each unit, show its outcome, explicit paths or
   approved hunks, dependencies, proposed Conventional Commit message, and
   required checks.

If units overlap or an unresolved dependency cycle exists, stop before staging.
Revise, combine, or remove units, then obtain approval for the complete plan.
Do not write a partial stack from an invalid plan.

## Stage one approved unit

Immediately before staging, run
`git diff --cached --quiet --ita-visible-in-index` again. If the index is not
empty, preserve it and stop. Stage only explicit paths or approved hunks
from the next unit. Never run `git add -A`. Never run `git add .`. Do not stage a path outside that
unit. Do not change the working-tree content to manufacture a split.

Show `git diff --cached --stat` and `git diff --cached`. Confirm that the staged
diff matches only the approved unit before message drafting. Obtain explicit
commit authority for this unit even when the user approved the split plan.

## Draft the message

Use this structure:

```text
<type>[optional scope]: <imperative description>

[optional body explaining why]

[optional footer]
```

Use the repository's allowed types. Otherwise prefer `feat`, `fix`,
`refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `revert`, or
`style` according to the observable change. Add a short scope only when it
clarifies ownership. Keep the subject specific, imperative, and without a
trailing period.

Do not use `!` or a `BREAKING CHANGE:` footer unless the change is genuinely
incompatible and the user explicitly approves the breaking-change marker.

Present the proposed header and any body or footers before committing. Explain
why the chosen type and scope match the staged diff when the choice is not
obvious.

## Validate and commit

1. Run `git diff --cached --check`. Record the staged tree with
   `git write-tree`.
2. Run the focused tests and checks required by the repository. Run
   repository-provided commit validation against the proposed message.
3. Run `git write-tree` again. If validation changes the staged tree, report the
   mismatch and stop before commit.
4. Run normal `git commit` only when the user explicitly requests the commit
   for this unit. Do not use `git commit-tree`. Do not bypass repository hooks
   or commit signing.
5. Compare `git rev-parse HEAD^{tree}` with the validated staged tree. A hook or
   external process can change the index before `git commit` acquires its lock.
   If the trees differ, report the commit hash and mismatch, then stop.
   Do not amend, reset, revert, or replace the commit without new user authority.
6. Validate the actual `HEAD` message with repository-provided commit
   validation. If it fails, report the commit hash and stop. Do not repair or
   replace the commit without new user authority.
7. Inspect the new subject, changed-file summary, and remaining worktree state.
   Report the commit hash, checks, message validation, and tree attestation.

For an approved split, confirm that the index is empty after each successful
commit, then repeat staging, validation, and explicit authorization for the next
unit. Stop on the first failure. Do not silently skip or reorder a unit.

Never push, force-push, tag, merge, or open a pull request unless the user
separately requests that action.
