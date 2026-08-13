---
name: work
description: >-
  Executes one approved slice, explicit bounded request, or confirmed bug
  outcome through the smallest safe implementation route.
---

# Work

Accept an approved slice, explicit bounded request, or confirmed bug outcome.
Before editing, inspect repository instructions, Git state, public contracts,
and authority. Preserve unrelated changes and confirm one exclusive
active writer.

## Check prerequisites

Confirm the `test-driven-development` and `engineering-practices` skills are
available. Before a route needs delegation or independent review, also confirm
the Git aggregate agents and the `pi-subagents` companion are available. If a
required companion is missing, stop and report:

```text
Blocked prerequisite: /work requires the Git aggregate and pi-subagents for this route.
Install both, then retry:
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

The package remains useful for discovering `/work` and its method skills; it
does not claim that standalone installation supplies companion tools or agents.

## Execute the smallest safe route

First select direct parent execution or one retained writer. Do this before the
selected executor applies `diagnosing-bugs`. Keep work in the parent only when
it is sequential, low-risk, locally understandable, and cheap to validate. The
parent keeps the writer lease and applies `test-driven-development` and
`engineering-practices` directly. Stop and use retained execution when
discovery is noisy, risk is material, implementation is multi-step, or
validation is expensive or unclear. The parent must not perform a non-trivial
repair before delegation.

For retained execution, launch one retained `worker` with `context: "fresh"`
and transfer the exclusive active writer lease. An `invalidated contract` state
is ineligible for direct execution: launch one new retained `worker` with
`context: "fresh"`. Use Sol `medium` normally. Use Sol `high`
for security, data loss, concurrency, lifecycle, migration, public API,
protocol, provider transport, cross-package architecture, nondeterministic
behavior, and expensive or unclear validation. The retained worker applies the
same method skills as direct execution.

For a bug, the selected executor owns reproduction, caller and sibling tracing,
root-cause repair, and the regression test as the first red result. For other
behavioral code, name one public seam, record the intended red result, add the
minimum production change, and record green before repeating vertically. For a
pure refactor or non-behavioral change, use the focused evidence required by
`test-driven-development`; do not manufacture a failing test.

## Review and repair

Send every non-trivial implementation to one fresh Sol `high` reviewer. A
routine implementation defect returns to the retained worker with:

```text
runs.run(key, { resume: "<run-id>", task: "follow-up" })
```

Always resume the latest returned `runId` for further routine repair. Start a
fresh worker only when retained context is unavailable, contradictory,
repeatedly failing, or invalidated by a changed contract. A decision-level
finding returns the writer lease and decision to the parent before more edits.
QA evidence does not replace formal review.

Finish by running the focused test or validation and applicable checks,
inspecting the scoped diff, and reporting changed facts, exact evidence,
invalidated assumptions, and residual risks without raw logs. The parent
retains product, architecture, security, scope, final verification, and
delivery authority.
