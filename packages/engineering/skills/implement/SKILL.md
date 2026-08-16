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

When the root profile's worker agents are available, keep the parent as the
coordinator and run one slice through one worker. Route by the accepted plan's
difficulty: use `terra-worker` for `standard` slices and `sol-worker` for
`hard` slices. Treat plan-less bounded requests and confirmed bug outcomes as
`standard` unless their scope requires a hard classification. Escalate a slice
to `sol-worker` when a Terra attempt misses its completion conditions or a
review finds material defects; never retry a failed
slice at the same tier. When a change is trivial and bounded — one obvious fix
with an obvious focused check — implement it directly as the parent instead of
delegating. Use the `subagent` tool with a fresh context and a foreground
workflow (`async: false`) so progress remains visible. Give the child the
accepted pitch and plan paths, exact slice, current worktree, completion
conditions, and required checks. Do not silently override the agent's
configured model or thinking effort. If the worker agents are unavailable, use
the direct parent as the executor so this skill remains independently
installable.

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
may use another worker at the slice's routed tier only when the human requests
parallel work, the
dependencies are clear, and every worker has an isolated worktree and sole
write ownership there. Keep overlapping slices serial. The parent must
integrate in plan order, synthesize the result, inspect every change, and verify
the evidence before accepting it.

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

1. **Review** — when `fable-reviewer` is available, run it once with fresh
   context as the independent read-only review. Give its task the current
   worktree, base ref and diff scope, accepted pitch and plan paths, the complete
   diff or a read-accessible diff artifact, changed files, and verification
   evidence. Address material findings through `sol-worker`, reverify, and show
   the evidence again. If the profile is unavailable, use one fresh read-only
   reviewer.
2. **Revise** — apply the human's feedback, reverify, and show the evidence
   again.
3. **Deepen verification** — add one requested proof or investigate one named
   uncertainty, then show the evidence again.
4. **Pause** — leave the verified work and durable artifacts unchanged for
   later continuation.

If the tool or document field is unavailable, show the complete evidence in
conversation and ask the same four-way question. Do not infer authority to
commit, push, merge, publish, deploy, or delete resources.
