---
name: implement
description: >-
  Delivers one approved slice, bounded request, or confirmed bug outcome with
  focused tests, required checks, and exact evidence.
---

# Implement

Accept one approved slice, bounded request, or confirmed bug outcome. Read
repository instructions, Git state, accepted intent, relevant public contracts,
and the nearest tests. Preserve unrelated changes and identify the required
completion checks before editing.

Before any edit, verify that the session is rooted in, or Pi is routed to, an
isolated linked worktree for this task. Reuse the same task worktree that holds
the accepted pitch and plan. For a plan-less request, use the available
worktree lifecycle tool to create and activate a short task branch. Never edit
the main-branch checkout. If no safe worktree tool is available, stop before
the first edit and ask the human to start or select an isolated worktree. Do
not create a nested worktree when the session is already inside the correct
linked worktree.

When the root profile's fixed agents are available, keep the parent as the
coordinator. **`worker`**, the only configured implementation child, routes
standard work, plan-less bounded requests, confirmed bugs, and accepted hard
work. A trivial bounded change — one obvious fix with one obvious focused
check — may remain direct parent work. Launch `worker` with fresh context in the
foreground (`async: false`), giving it the accepted pitch and plan paths, exact
slice, current worktree, completion conditions, and required checks. Never
silently override its configured model or thinking level. If fixed agents are
unavailable, use the direct parent as executor so this package remains
independently installable.

A Terra failure does not select another model. If `worker` cannot meet completion
conditions, or a concrete constraint needs Sol, use `question` before any Sol
run. State the evidence, expected benefit, and bounded Sol task, then wait for
explicit approval of either a one-off Sol run or continuing in a Sol parent.
A difficulty label alone is insufficient. Do not use Sol for repair unless the
human has given that approval.

## Deliver the change

For behavior changes, use test-driven-development or the repository's equivalent
red-green-refactor loop: make the smallest relevant test fail for the intended
reason, implement only enough to pass, then refactor while green. For
documentation, metadata, or mechanical work, use the smallest focused
before-and-after validation instead of manufacturing a failing test.

For bugs, reproduce the observable failure, trace callers and sibling paths,
fix the shared root cause, and leave the smallest useful regression test.

After each coherent edit, run focused tests. When the slice is complete, run
the required completion checks from repository instructions. Inspect the final
diff for scope, package boundaries, test quality, security, cancellation,
cleanup, and user-visible documentation where applicable.

## Parallel-ready slices

Do not add workers merely because a task is large. A `parallel-ready` plan slice
may use another `worker` only when the human requests parallel work, dependencies
are clear, and every worker has an isolated worktree and sole write ownership.
Keep overlapping slices serial. The parent integrates in plan order,
synthesizes the result, and verifies evidence before accepting it.

## Show main progress

When the `todo` tool is available and the work has multiple material steps, use
one compact parent-owned list and keep one item in progress. Update it at real
milestones and after failures. The accepted plan remains authoritative; do not
turn the todo list into a subagent task graph.

## Finish

Update an accepted plan checkbox only after its completion conditions hold.
Build complete work evidence containing changed files, the red and green
evidence or explicit test exception, focused and required check results,
residual risks, and any separately authorized delivery action. Show that
complete work evidence in the `question` tool's document field with these
actions:

1. **Review** — run **`reviewer`** once with fresh context as the formal
   read-only review. Give it the worktree, fixed-point intent (pitch, plan, or
   request), base ref and fixed diff, changed files, and verification evidence.
   Return material findings to `worker`, reverify, and repeat the review
   boundary as needed. Do not route fixes to Sol without the separate approved
   Sol question. If `reviewer` is unavailable, the direct parent performs the
   review.
2. **Revise** — apply the human's feedback, reverify, and show the evidence
   again.
3. **Deepen verification** — add one requested proof or investigate one named
   uncertainty, then show the evidence again.
4. **Pause** — leave verified work and durable artifacts unchanged for later
   continuation.

If the tool or document field is unavailable, show the complete evidence in
conversation and ask the same four-way question. Do not infer authority to
commit, push, merge, publish, deploy, or delete resources.
