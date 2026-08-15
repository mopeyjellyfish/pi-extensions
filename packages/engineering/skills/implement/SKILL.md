---
name: implement
description: >-
  Delivers one approved slice, bounded request, or confirmed bug outcome with
  focused tests, required checks, and exact evidence.
---

# Implement

Use the direct parent as the default executor. Accept one approved slice,
bounded request, or confirmed bug outcome. Read repository instructions, Git
state, accepted intent, relevant public contracts, and the nearest tests.
Preserve unrelated changes and identify the required completion checks before
editing.

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

## Optional delegation

Do not delegate merely because a task is large. Optional delegation is for one
bounded independent lane. A `parallel-ready` plan slice may use a host-provided
role as its worker only when the human requests parallel work, the dependencies
are clear, and that worker has an isolated worktree and sole write ownership
there. Keep overlapping slices serial. The parent must integrate in plan order,
synthesize the result, inspect every change, and verify the evidence before
accepting it.

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

1. **Review** — run one fresh independent read-only review of the completed
   diff, address material findings, reverify, and show the evidence again.
2. **Revise** — apply the human's feedback, reverify, and show the evidence
   again.
3. **Deepen verification** — add one requested proof or investigate one named
   uncertainty, then show the evidence again.
4. **Pause** — leave the verified work and durable artifacts unchanged for
   later continuation.

If the tool or document field is unavailable, show the complete evidence in
conversation and ask the same four-way question. Do not infer authority to
commit, push, merge, publish, deploy, or delete resources.
