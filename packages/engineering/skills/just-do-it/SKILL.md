---
name: just-do-it
description: >-
  Delegates one explicit mechanical, low-risk change immediately and stops when
  it needs a larger delivery route.
---

# Just do it

Use this only for an explicit mechanical, low-risk, broadly repetitive change
with an objective before-and-after check. It is one bounded delivery unit with
no forecast or topology overhead. It is not a route for behavior design,
uncertain intent, security or migration work, or an expanding scope. Return
those requests to `developing-changes`.

## Intake and worktree

With arguments, **worktree setup is first**: before repository reads or edits,
create or activate an isolated task worktree on its named task branch. Never
write in the main checkout. If safe worktree tooling is unavailable, stop before
writing and ask the user to provide an isolated worktree.

Without arguments, ask only for the mechanical request. Do not ask discovery or
design questions.

## Immediate handoff

Immediately launch **exactly one fresh `worker`** when that Worker capability is
available. When Pi's `subagent` tool supplies the capability, send this argument
object directly rather than putting it in `workflowScript`:

```text
agent: "worker"
task: "<rendered Worker task contract>"
cwd: "<active task worktree>"
async: false
```

Other hosts use their equivalent fixed-role foreground launch. Do not pass
`mode`, `model`, or `thinking` for this fixed-role launch; the agent profile owns
its tools, model, thinking level, and fresh-context default. Give it:

- the exact mechanical scope and exclusions;
- bounded implementation, commit, push, and pull request authority for the
  named branch after verification;
- the objective before check, after check, and required checks; and
- required output: changed files, validation evidence, residual risks, and an
  unstaged diff for parent inspection.

The Worker is the sole writer. If that capability is absent, the direct parent
performs the same bounded work and records the same evidence. Do not substitute
a higher-capability role. Explicit approval is required for a high-capability
role, with the evidence, expected benefit, and bounded task.

A Utility or QA capability may do bounded inventory or validation only when useful
to shorten the critical path; neither owns implementation, routing, or approval.
At the completed unit, when a configured `reviewer` capability exists, it must
load and follow `code-review`. If the reviewer is unavailable, the direct parent
loads and follows `code-review`. The parent inspects the diff and evidence in
every case.

For formal review, send `Review mode: fixed-diff code` with the handoff.

## Go routing

When work has Go source, a Go module, a Go CLI, or Go-specific work, resolve
`go` by its installed name and follow it. Resolve `cobra-viper` only when Cobra
or Viper commands, flags, or CLI configuration are in scope. Unrelated Go
toolchain evidence alone does not activate either method. If a companion skill
is unavailable, record the unmet method and have the direct parent use bounded
target-repository Go standards without pretending the skill loaded.

## Stop and reroute

The Worker or parent stops without widening scope and returns to
`developing-changes` if it finds ambiguity, behavior design, security risk,
migration risk, or expanding scope. Ask one focused question only when a
material boundary cannot be classified from the request.

## Delivery boundary

Invoking `/just-do-it` authorizes only this bounded implementation unit on its
named branch, including verified `commit` and `open-pr` delivery after the
parent accepts the evidence. Use those focused skills; do not issue ad hoc Git
commands. If either skill, or required `gh stack` tooling for a planned stack,
is unavailable, stop with local evidence and the recovery needed to resume.

This authority does **not authorize** merge, deployment, release, plain force
push, cleanup, destructive actions, or unrelated changes.
