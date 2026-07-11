---
name: conventional-commit
description: Create, validate, and optionally make one repository-aware Conventional Commit, and suggest a matching valid branch name. Use when naming a branch, drafting or checking commit format, splitting changes into logical commits, or committing work after the user requests it.
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

## Inspect the logical unit

Run `git status --short`, `git diff --cached --stat`, and `git diff --cached`.
If nothing is staged, inspect the unstaged diff and explain what could form a
logical unit, but do not stage it without authorization.

Keep unrelated changes separate. Never run `git add -A`, `git add .`, or stage
files outside the named unit. If the user requests staging, add only explicit
paths and show the resulting staged summary.

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

1. Run `git diff --cached --check` and the focused tests or checks required by
   the repository.
2. Run repository-provided commit validation against the proposed message when
   a pre-commit path exists. Otherwise validate the created commit through the
   repository's documented range or commit-file command.
3. Run `git commit` only when the user explicitly requests the commit. Never
   amend or replace an existing commit without equally explicit permission.
4. After committing, inspect the new subject, changed-file summary, and clean
   or remaining worktree state. Report the commit hash and validation result.

Never push, force-push, tag, merge, or open a pull request unless the user
separately requests that action.
