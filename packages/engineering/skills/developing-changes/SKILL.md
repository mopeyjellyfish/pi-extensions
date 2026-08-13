---
name: developing-changes
description: >-
  Routes implementation, bug, validation, QA, and review requests through the
  smallest focused first-party engineering workflow.
---

# Developing changes

Route the request. Do not copy or perform the selected skill's execution
method.

At activation, confirm that the Git aggregate supplies the `shape`,
`planning-changes`, and `work` skills and the `worker`, `qa`, and `reviewer`
agents. Also confirm that the `subagent` tool from `pi-subagents` is available.
If a prerequisite is missing, stop and report:

```text
Blocked prerequisite: /develop requires the Git aggregate and pi-subagents.
Install both, then retry:
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

The parent owns the user conversation, scope and authority, route choice,
synthesis, final diff inspection, final verification, and delivery authority.

## Choose one route

Work one route at a time:

1. For unresolved product intent or when a feature pitch is needed, route to
   `shape`.
2. For accepted non-trivial intent that has not been sliced, route to
   `planning-changes`.
3. For an accepted current slice, explicit bounded small fix, bug or unexplained
   regression, refactor, documentation, metadata, or mechanical implementation,
   route to `work`.
   - Label bug work as a bug. `work` selects the executor before the selected
     executor applies `diagnosing-bugs`.
4. For QA-only work, launch a fresh read-only `qa` with the configured Luna
   `medium` profile. One-shot QA is ephemeral unless the user requests a
   record or the work is recurring or comparative. QA never replaces formal
   review.
5. For review-only work, use a fresh `reviewer` agent and
   `reviewing-changes` when the current repository contract requires formal
   review. Otherwise follow the user's bounded review request.

The selected skill or agent owns its method, including execution selection,
models, diagnosis, testing, implementation, review, repair, and evidence
format. Develop only routes and synthesizes the result.
