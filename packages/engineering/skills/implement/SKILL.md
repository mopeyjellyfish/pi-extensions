---
name: implement
description: >-
  Delivers one approved slice, explicit bounded request, or confirmed bug
  outcome through implementation, checks, review, repair, and authorized delivery.
---

# Implement

Accept one approved slice, explicit bounded request, or confirmed bug outcome.
Record the fixed point. Inspect repository instructions, Git state, accepted
intent, public contracts, tests, checks, and delivery authority. Preserve
unrelated changes and confirm one exclusive active writer lease.

## Check prerequisites

Confirm `test-driven-development` and `codebase-design` are available.
Before delegation or review, also confirm the Git aggregate agents and
`pi-subagents`. If one is missing, stop and report:

```text
Blocked prerequisite: /implement requires the Git aggregate and pi-subagents for this route.
Install both, then retry:
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

## Implement and check

First select direct parent execution or one retained writer, before the selected
executor applies `diagnosing-bugs`. Keep work in the parent only when it is
sequential, low-risk, locally understandable, and cheap to validate. Otherwise
launch one retained `worker` with `context: "fresh"` and transfer the exclusive
active writer lease. An `invalidated contract` state is ineligible for direct
execution: launch one new retained `worker` with `context: "fresh"`.

Use Sol `medium` normally. Use Sol `high` for security, data loss, concurrency,
lifecycle, migration, public API, protocol, provider transport, cross-package
architecture, nondeterministic behavior, and expensive or unclear validation.

For behavioral work, apply `test-driven-development` one vertical behavior at a
time. For a bug, the selected executor applies `diagnosing-bugs`; reproduction,
caller and sibling tracing, root-cause repair, and the minimized regression test
produce the first red result. For refactors and non-behavioral work, use the
smallest relevant before-and-after validation.

After each coherent change, run focused tests and applicable type or static
checks. When stable, run the integrated path and complete required suite. Check
security, validation, cancellation, failures, cleanup, and trust boundaries.

## Review and repair

Send every non-trivial diff to one fresh Sol `high` reviewer. Apply
`reviewing-changes` from the recorded fixed point on separate Spec and Standards
axes. Return routine findings to the same retained writer with:

```text
runs.run(key, { resume: "<run-id>", task: "follow-up" })
```

Resume the latest returned `runId` for routine repair. Rerun affected checks and
review material repairs. Return decision-level findings or changed intent to the
parent or Shape before more edits. QA never replaces formal review.

## Close and deliver

After the gates pass, retained execution ends when the worker reports evidence
and residual risks, returns the exclusive writer lease, and stops. The worker
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
separate commit or slice; never amend pushed history or force-push. Report the
contract, red and green evidence, checks, review, delivery state, and risks. The
parent keeps final product, architecture, security, scope, and verification
authority.
