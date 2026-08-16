---
name: resolving-merge-conflicts
description: Resolve an in-progress Git merge or rebase conflict by recovering both intents, verifying the result, continuing safely, and publishing only a bounded current task branch.
---

# Resolve Merge Conflicts

Use the resolution sections only for an in-progress merge or rebase. The final
publication section may also be used after a conflict-free merge or rebase has
already completed. Compose `conventional-commit` for commit rules and
`git-rebase-base` for choosing and starting a rebase; do not repeat or bypass
their methods.

## Guard the operation

Read the governing `AGENTS.md`, contribution guidance, and repository checks.
Inspect `git status`, the operation state (`git rev-parse -q --verify
MERGE_HEAD` for a merge or the rebase metadata for a rebase), conflicted paths,
and the recorded operation messages. Require an in-progress merge or rebase and
its recorded state. If neither operation is in progress, stop: do not start a
merge or rebase just to use this skill.

Preserve unrelated worktree and index changes. Do not reset, clean, stash,
checkout another branch, or run an automatic conflict resolver.

## Recover both intents

For every conflict, identify the two changes being combined before editing.
Gather evidence from both commit messages and diffs, pull requests, issues,
tests, accepted local intent (such as an accepted pitch or plan), and the
merge or rebase goal. Read the relevant callers and repository instructions
when they explain behavior.

State the evidence and the intended behavior on both sides. If required
evidence is unavailable, or the intents are incompatible, ask the human which
intent or trade-off to choose. Do not guess from marker order, branch names, or
an assumed target branch.

## Repair deliberately

Resolve each hunk deliberately. Preserve both intents where compatible, keep
the behavior that the confirmed merge or rebase goal requires where they are
not, and remove every conflict marker. Do not invent new behavior, silently
drop a side, or use a whole-file "ours" or "theirs" choice as a substitute for
understanding the hunk.

Inspect the repaired diff and surrounding code. Stage only the deliberate
repair paths or approved hunks; do not use `git add -A`. Confirm that Git no
longer reports unmerged paths.

## Verify before continuation

Discover and run the repository-required focused checks and completion checks.
Include checks that exercise every repaired behavior, then inspect their
results and the staged diff. Fix only conflict-caused failures. If a required
check fails or the result remains ambiguous, stop and report the evidence; do
not continue.

Abort is a human-selected recovery option, not an automatic fallback. Only if
the user chooses it, run the applicable `git merge --abort` or `git rebase
--abort` and report the restored state.

After all required checks pass, continue the existing operation only:

- for a merge, create the recorded merge commit with `git merge --continue`;
- for a rebase, use `git rebase --continue`, then repeat this method for every
  later conflict until the rebase completes.

Do not create a replacement commit, start another operation, amend history, or
continue after a failed check.

## Publish only the completed task branch

After a successful task, the Git role may push only its current non-default,
non-protected task branch to `origin`. First verify that HEAD is attached, the
current branch is not the repository default branch or a protected branch, and
the destination is exactly `origin` plus that current branch. Do not infer a
destination from an upstream setting. Never push tags, to another remote, to
a default branch, or to a protected branch.

For a completed merge without rewritten history, use a normal push only after
those checks. After a rebase, first determine whether the task branch already
exists on `origin`:

```bash
set -euo pipefail
current_branch=$(git branch --show-current)
test -n "$current_branch"
if git ls-remote --exit-code origin "refs/heads/$current_branch" >/dev/null
then
  git fetch origin "$current_branch"
  # Record the expected remote state, fetch again, and check it before pushing.
  expected_remote=$(git rev-parse "refs/remotes/origin/$current_branch")
  git fetch origin "$current_branch"
  test "$(git rev-parse "refs/remotes/origin/$current_branch")" = "$expected_remote"
  git push --force-with-lease="refs/heads/$current_branch:$expected_remote" \
    origin "HEAD:refs/heads/$current_branch"
else
  # A concurrent branch creation makes this normal push fail closed.
  git push origin "HEAD:refs/heads/$current_branch"
fi
```

Use the normal push when the remote branch is absent; it cannot overwrite a
concurrent branch creation. Use `--force-with-lease` only after a rebase, only
when the remote branch exists, and only with the explicit
`refs/heads/$current_branch:$expected_remote` lease. Never use plain `--force`,
a default lease, a guessed destination, or a lease for a different branch.

If any destination, protection status, expected remote state, or push authority
is not explicit and verified, stop and ask the human. Report the branch,
remote ref, operation, checks, and resulting remote state after a successful
push.
