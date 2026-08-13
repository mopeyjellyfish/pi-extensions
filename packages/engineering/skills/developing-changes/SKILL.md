---
name: developing-changes
description: >-
  Implements, fixes, debugs, validates, or QA-tests code through the smallest
  safe quality-first route, with retained implementation and independent review
  for non-trivial work.
---

# Developing changes

Coordinate ordinary coding work with the Git aggregate agent set and
`pi-subagents`. Before promising delegation or an independent quality gate,
confirm that the aggregate `worker`, `qa`, and `reviewer` agents, the `shape`
skill, and the `subagent` tool are available. If either companion is missing,
stop and report:

```text
Blocked prerequisite: /develop requires the Git aggregate and pi-subagents.
Install both, then retry:
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

The parent agent owns the user conversation, scope, acceptance criteria,
product and architecture decisions, security and risk decisions, task synthesis,
review and QA synthesis, final diff inspection, final verification, and all Git
or delivery authority.

## Select the smallest safe route

1. If the request needs a feature pitch or unresolved product choices, use the
   `shape` skill before implementation. Preserve its pitch approval, Worktrunk
   isolation, vertical slices, delivery gates, and exclusive writer lease.
2. For a bug or unexplained regression, apply `diagnosing-bugs` first. Establish
   an observable reproduction, trace the shared root cause through callers and
   sibling paths, and leave one durable regression check. Then select the direct
   or retained-writer route below.
3. For QA-only work, launch one fresh read-only `qa` agent, the configured Luna
   `medium` role, to run bounded QA through the public surface. QA is additional
   evidence and never replaces formal review of non-trivial implementation.
4. Keep implementation in the parent only when it is sequential, low-risk,
   locally understandable, and cheap to validate. File count alone is not
   enough. The parent implements the tiny change, runs its focused check, and
   verifies the diff.
5. For noisy discovery, broad context, long checks, repeated repair, material
   risk, or multi-step implementation, create a self-contained task capsule and
   launch one retained `worker` with `context: "fresh"`. Use the configured Sol
   `medium` worker for normal implementation. Use Luna only for bounded, low-risk work with a
   deterministic check; promote risk or complexity to Sol rather than raising
   Luna effort.

A task capsule states the goal, scope, authority, load-bearing evidence,
success criteria, validation, and required material-delta output. Transfer the
exclusive active writer lease explicitly. The parent and writer never edit the
same worktree concurrently.

## Validate, review, and repair

The writer implements, runs focused tests and static checks, and returns concise
evidence. When the result is stable, use one fresh Sol `high` reviewer for every
non-trivial implementation. Add bounded QA when the user surface or risk makes
it useful; QA does not replace review.

Synthesize review, test, and QA findings before routing them. Retain the
completed writer run ID. For a routine implementation defect, continue it with
`runs.run(key, { resume: "<run-id>", task: "follow-up" })`, use the latest
returned `runId` for any further repair, and re-run the affected checks. Start a
fresh writer only when the retained context is unavailable, contradictory,
repeatedly failing, or based on an invalidated contract. If a
finding changes intent, architecture, ownership, security, risk, or scope, stop
the writer and return the decision to the parent or user.

One-shot QA returns concise evidence and artifact paths without creating
`docs/qa/` files. Create durable plans and comparable run reports only when the
user requests them, the plan will recur, or historical comparison is required.

## Keep handoffs material

Require worker and QA results to include:

- outcome and changed files;
- changed contracts or facts;
- invalidated assumptions;
- commands and checks with results;
- exact artifact or evidence paths;
- residual risks;
- decisions required from the parent.

Do not return raw logs, large diffs, or repeated task instructions. Keep full
operational output in the retained run or a named artifact. The parent inspects
the final diff, runs applicable final checks, and reports evidence without
inferring commit, push, pull-request, merge, release, deployment, or cleanup
authority.
