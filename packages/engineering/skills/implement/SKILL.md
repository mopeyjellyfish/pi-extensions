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
bounded independent lane that can return evidence without sharing write
ownership. Use a host-provided role rather than a repository-specific agent
overlay. Keep one writer. The parent must synthesize the result, inspect every
change, and verify the evidence before accepting it.

## Finish

Update an accepted plan checkbox only after its completion conditions hold.
Report changed files, the red and green evidence or explicit test exception,
focused and required check results, residual risks, and any separately
authorized delivery action. Do not infer authority to commit, push, merge,
publish, deploy, or delete resources.
