---
status: accepted
---

# Shape: Safe bulk Worktrunk cleanup

## Problem and evidence

Completed delivery work leaves many linked Worktrunk worktrees on disk. Manual cleanup does not scale because Pi lists at most 20 worktrees and removes one exact branch per confirmation.

The current repository has 88 worktrees. Excluding the main worktree, 76 are clean. GitHub reports a terminal pull request for 73 clean, inactive worktrees. Worktrunk proves that two more clean, inactive worktrees are integrated without matching pull-request history. The existing tool has no bulk preview or cleanup action.

Worktrunk and GitHub provide different evidence. Worktrunk can prove that branch content is integrated or empty. GitHub can prove that a pull request is merged or closed even when local history makes Worktrunk report a conflict. Cleanup needs both sources.

## Proposed solution

Extend `@mopeyjellyfish/pi-worktrunk`. Do not create a separate production package.

Add one shared cleanup service behind the `worktree` tool and `/worktree cleanup`. The service has two phases:

1. Preview the complete candidate set and skipped worktrees without mutation.
2. Apply the exact reviewed candidate set after explicit approval and host confirmation.

A worktree is a cleanup candidate only when all applicable conditions are true:

- The worktree is not the main, current, or Pi-routed worktree.
- The worktree has no uncommitted changes or in-progress Git operation.
- The worktree is not locked, detached, or path-mismatched.
- No open pull request exists for its branch.
- GitHub reports a merged or closed pull request, or Worktrunk proves that the branch is integrated or empty.

Cleanup removes only the linked worktree directory and Git worktree metadata. Cleanup preserves local and remote branches. A closed, unmerged pull request can qualify because its local branch remains recoverable.

The preview identifies each candidate by branch, path, HEAD, and reason. The preview also reports every skipped worktree and its reason. An apply request carries a fingerprint of the reviewed candidate set. Before each removal, the service revalidates the path, HEAD, clean state, active state, and qualifying evidence. A changed candidate is not removed.

Use Worktrunk's branch-preserving, foreground, no-hook removal. Do not use force flags or `--reap`. Return a bounded final report of removed, changed, skipped, and failed worktrees. A partial failure must not hide earlier removals.

Use Worktrunk evidence for every supported forge. Use authenticated `gh` only for GitHub terminal pull-request history. If GitHub lookup is unavailable or incomplete, report the limitation. In that state, only candidates that Worktrunk independently proves safe can qualify. Existing Worktrunk actions must continue to work without `gh`.

Update the bundled `pi-worktrunk` skill and package README. The skill tells an agent to preview, present the exact candidate set, obtain approval, and then apply the matching fingerprint. The pitch and implementation form one delivery unit. The pitch has no independent merge value.

The smallest vertical slices are:

1. Produce a no-mutation cleanup preview from Worktrunk and GitHub evidence.
2. Apply one exact reviewed candidate set with revalidation and branch-preserving removal.
3. Expose the shared behavior through `/worktree cleanup` and the bundled skill.

## Boundaries and no-gos

- Do not clean worktrees automatically during startup, shutdown, reload, or session changes.
- Do not delete local branches, remote branches, pull requests, or work on the default branch.
- Do not remove dirty, locked, detached, active, or in-progress worktrees.
- Do not use commit age alone as cleanup evidence.
- Do not infer a terminal pull-request state when forge lookup fails.
- Do not add GitLab, Gitea, or Azure DevOps terminal-review lookup in the first delivery unit. Worktrunk integration evidence remains available for those forges.
- Do not kill processes, bypass hooks for creation or activation, or expand the tool into arbitrary Worktrunk execution.
- Stop and reshape if safe bulk removal requires a Worktrunk version newer than the declared package prerequisite or a Pi core change.

## Decision-changing research and risks

- Worktrunk `0.67.0` schema 2 exposes clean state, current state, locks, detached state, integration reason, path mismatch, and open pull requests. Worktrunk does not expose terminal pull-request history.
- `wt remove --no-delete-branch` preserves the branch. This makes closed-unmerged pull-request cleanup recoverable.
- GitHub branch history can contain more than one pull request. Any open pull request must take precedence over older merged or closed pull requests.
- A clean worktree can still contain ignored build output. Cleanup removes that disposable output with the worktree directory.
- Worktrunk cannot prove that another unrelated process still uses a candidate directory. The exact preview and confirmation are the safety boundary. Cleanup does not use process reaping.
- Remote lookup and bulk removal can be slow. All subprocesses need cancellation, bounded output, and clear partial-result reporting.

## Review evidence

- **Applicability:** not applicable
- **Fixed document:** not applicable
- **Status:** not applicable
- **Invalidation:** not applicable

## Authority

The parent owns product scope, candidate policy, safety boundaries, architecture, and acceptance synthesis.

The user selected an accept-all implementation preference. This preference is not implementation authority until the complete plan is approved. Whole-plan approval can authorize the named branch, tests, implementation, documentation, focused repairs, atomic commits, and one pull request. It does not authorize merge, release, deployment, branch deletion, destructive force, automatic cleanup, or unrelated changes.

## Observable acceptance criteria

- **AC-001 — Complete preview:** One cleanup preview lists every candidate and every skipped linked worktree with a reason. Preview does not mutate Git, GitHub, or the filesystem.
- **AC-002 — Terminal review policy:** A clean, inactive worktree qualifies when its branch has no open pull request and has a merged or closed GitHub pull request. Any open pull request takes precedence over older terminal pull requests.
- **AC-003 — Worktrunk policy:** A clean, inactive worktree without terminal GitHub evidence qualifies when Worktrunk proves that the branch is integrated or empty.
- **AC-004 — Protected states:** Main, current, Pi-routed, dirty, locked, detached, path-mismatched, and in-progress worktrees never qualify.
- **AC-005 — Exact approval:** Apply accepts only the fingerprint from the exact reviewed preview. A candidate-set change requires a new preview and approval.
- **AC-006 — Revalidation:** Apply revalidates each candidate immediately before removal. A changed candidate is not removed and appears in the result.
- **AC-007 — Branch preservation:** Cleanup removes approved worktrees through Worktrunk without force, hooks, process reaping, or local or remote branch deletion.
- **AC-008 — Bounded completion:** Cancellation, malformed output, forge failure, candidate overflow, and partial removal produce bounded results without false success claims.
- **AC-009 — Optional GitHub evidence:** Existing status, list, create, activate, deactivate, and exact remove behavior works when `gh` is missing or unauthenticated. Cleanup then uses only independent Worktrunk proof.
- **AC-010 — Public workflow:** The `worktree` tool, `/worktree cleanup`, package README, and bundled skill describe the same preview, approval, apply, and safety contract.
- **AC-011 — Lifecycle safety:** Focused tests cover preview, approval, stale fingerprints, revalidation, cancellation, reload, and shutdown. Source smoke and the repository completion checks pass after the final edit.
