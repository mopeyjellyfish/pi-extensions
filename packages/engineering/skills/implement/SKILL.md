---
name: implement
description: >-
  Delivers one approved slice, explicit bounded request, or confirmed bug
  outcome through implementation, verification, optional review, and authorized delivery.
---

# Implement

Accept one approved slice, explicit bounded request, or confirmed bug outcome.
Record the fixed point. Inspect repository instructions, Git state, accepted
intent, public contracts, tests, checks, and delivery authority. Preserve
unrelated changes and confirm one exclusive active writer lease.

## Check prerequisites

Confirm `test-driven-development` and `codebase-design` are available. Direct
parent execution needs no agent package. Before retained execution or requested
review, confirm the required Git aggregate agent and `pi-subagents` are
available. If one is missing, stop only that route and report:

```text
Blocked prerequisite: this /implement route requires the Git aggregate and pi-subagents.
Install both, then retry the retained execution or review:
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

## Implement and check

For every approved Shape slice, launch one retained `worker` with
`context: "fresh"` and transfer the exclusive active writer lease. Use Sol
`medium` for normal implementation. Use Sol `high` only for security, data loss,
concurrency, lifecycle, migration, public API, protocol, provider transport,
cross-package architecture, nondeterministic behavior, and expensive or unclear
validation. An `invalidated contract` state always gets a new fresh worker.

Use direct parent execution only for an explicit bounded non-Shape request that
is sequential, low-risk, locally understandable, and cheap to validate. Select
the executor before it applies `diagnosing-bugs`.

Give a Shape worker the accepted pitch, the complete current slice, its delivery
order, relevant unknowns, integrated path, required checks, and objective done
conditions. The worker verifies its work against the accepted slice before it
returns. Its handoff covers all done conditions and includes focused tests, lint
or static checks, the integrated path, changed files, and residual risks.

Launch the worker asynchronously. Do not set `turnBudget` or `toolBudget` on a
worker. Use the default 30-minute runtime deadline. Increase the runtime deadline
only when a known build or integration command needs more time.

For an interactive parent, rely on the completion wake and do not block merely
with `subagent_wait`. Return control after useful parent work. A headless or
explicit run-to-completion parent can wait once when the result blocks progress.
Use the returned result directly.

A wait that is aborted does not mean that the child failed. Inspect the child
lifecycle once before stopping, resuming, or replacing it. If it is active, arm
a completion wake and return control. If it completed, consume its existing
output. Do not call status after successful completion unless the result is
missing. Do not poll or repeat completed work.

For behavioral work, apply `test-driven-development` one vertical behavior at a
time. For a bug, the selected executor applies `diagnosing-bugs`; reproduction,
caller and sibling tracing, root-cause repair, and the minimized regression test
produce the first red result. For refactors and non-behavioral work, use the
smallest relevant before-and-after validation.

After each coherent change, run focused tests and applicable lint, type, or
static checks. Signal progress when focused tests and lint or static checks pass
or fail. These signals are status updates, not approval checkpoints. When the
change is stable, run the integrated path and required suite, then signal their
results. Check security, validation, cancellation, failures, cleanup, and trust
boundaries. A passing signal is evidence, not permission to skip a
repository-required check.

## Review only when requested or required

Do not launch code review by default. For Shape work, do not review individual
slices. The human reviews the pull request and can request one final formal code
review after all slices pass. Run one fresh Sol `high` reviewer only when the
user requests it or repository instructions require it. Apply
`reviewing-changes` from the recorded fixed point on separate Spec and Standards
axes.

Return material routine findings to the same retained writer with:

```text
runs.run(key, { resume: "<run-id>", task: "follow-up" })
```

Resume the latest returned `runId` once for repair, then rerun affected tests,
lint, static checks, and required suites. Do not repeat review unless the user
asks or repository instructions require it. Return decision-level findings or
changed intent to the parent or Shape before more edits. QA evidence does not
replace requested or repository-required formal review.

## Close and deliver

After required verification and any requested or required review pass, retained
execution ends when the worker reports evidence and residual risks, returns the
exclusive writer lease, and stops. The worker
never edits `plan.md`, commits, or pushes. Direct parent execution has no worker
lease to return.

The controlling parent verifies the evidence. For an approved Shape plan slice,
the parent then applies Shape's slice-closure gate and updates the plan checkbox.
A direct bounded request proceeds from verification without a plan edit. Only
with explicit authority, the parent applies `conventional-commit`, pushes the
current feature branch, then applies `github-cli` to verify the existing pull
request and checks. A plan-slice commit includes its checkbox; a bounded-change
commit contains only that change. Do not create one pull request per slice.

If authority or a companion skill is absent, stop at the verified uncommitted
state and report the blocked prerequisite. Repair post-push defects with a
separate commit or slice. Never amend pushed history or force-push. Report the
contract, red and green evidence, test and lint signals, review state, delivery
state, and risks. Mark review as not requested, required but blocked, or
completed. The parent keeps final product, architecture, security, scope, and
verification authority.
