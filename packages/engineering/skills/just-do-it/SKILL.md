---
name: just-do-it
description: >-
  Delivers one explicit mechanical, low-risk change immediately and stops when
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

## Immediate execution

The direct parent is the default executor for this obvious bounded change. It
keeps sole write ownership, applies the mechanical edit, runs the objective
before-and-after check, and inspects the final diff without paying a fresh-agent
startup cost.

Use exactly one fresh `worker` only when broad repetition materially shortens
the critical path or protects scarce parent context. Use the fixed-role Worker
launch contract from `implement`; give it the exact mechanical scope,
exclusions, objective check, setup evidence, and bounded delivery authority. Do
not pass per-run model or thinking overrides. If Worker is unavailable, keep
direct parent ownership. Do not substitute a higher-capability role. Explicit
approval is required for a higher-capability role, with the evidence, expected
benefit, and bounded task.

Whichever executor owns the change must return changed files, validation
evidence, residual risks, and an unstaged diff for parent inspection.

A Utility or QA capability may do bounded inventory or validation only when useful
to shorten the critical path; neither owns implementation, routing, or approval.
Low-risk `/just-do-it` work uses its objective check and parent diff inspection;
it does not mandate independent QA or a Reviewer. The parent inspects the diff
and evidence in every case.
When material risk requires code review, a configured `reviewer` capability can
load and follow `code-review`; if unavailable, the direct parent uses
`code-review`.

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
