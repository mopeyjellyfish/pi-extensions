---
name: just-do-it
description: >-
  Finishes one small, clear fix or follow-up immediately, verifies it, then
  commits and pushes the current branch without review.
---

# Just do it

Use this route when the user invokes it or when active work needs a small,
bounded correction. Accept a bounded fix, small breakage, cleanup, or obvious
follow-up with a clear objective check. The cause can be visible from the
request, current diff, failing check, or one bounded inspection pass. This route
is not limited to repetitive text edits.
It is one bounded delivery unit with no forecast or topology overhead.

Do not add a pitch, plan, forecast, checkpoint, approval prompt, or review. Do
not use this route for unresolved product intent, broad diagnosis, security or
migration work, dependency changes, irreversible actions, or expanding scope.

## Intake and worktree

With arguments, **worktree setup is first**. Reuse the current task worktree and
branch when they are safe for this request. Otherwise, create or activate an
isolated task worktree. Never write in the main checkout. If safe worktree
tooling is unavailable and the current checkout is unsafe, stop before writing
and ask the user to provide a task worktree.

Without arguments, ask only for the bounded request. Do not ask discovery or
design questions.

## Immediate execution

The direct parent is the default executor. Keep sole write ownership and start
immediately. Inspect only enough context to locate the requested correction and
its objective check. Preserve unrelated user changes. Apply the fix, run the
narrowest useful verification, inspect the final diff, and continue directly to
delivery when the evidence passes.

Do not run independent QA, a Reviewer, or formal review for this route. Do not
pause for review or ask the user to accept evidence before delivery. A small
behavior fix can stay on this route when the expected outcome, local cause, and
regression check are clear.

Use exactly one fresh `worker` only when broad repetition materially shortens
the critical path or protects scarce parent context. Use the fixed-role Worker
launch contract from `implement`. Give it the exact bounded scope, exclusions,
objective check, setup evidence, and delivery authority. Do not pass per-run
model or thinking overrides. If Worker is unavailable, keep direct parent
ownership. Do not substitute another role.

Whichever executor owns the change must return changed files, verification
evidence, residual risks, and an unstaged diff for parent inspection.

## Go routing

When work has Go source, a Go module, a Go CLI, or Go-specific work, resolve
`go` by its installed name and follow it. Resolve `cobra-viper` only when Cobra
or Viper commands, flags, or CLI configuration are in scope. Unrelated Go
toolchain evidence alone does not activate either method. If a companion skill
is unavailable, record the unmet method and have the direct parent use bounded
target-repository Go standards without pretending the skill loaded.

## Stop and reroute

Do not reroute only because the fix touches behavior or more than one file. Stop
without widening scope and return to `developing-changes` only when the request
needs product decisions, broad root-cause diagnosis, security or migration
judgment, a dependency change, an irreversible action, or materially expanded
scope. If one bounded inspection cannot establish the local cause and objective
check, use `diagnosing-bugs`.

Ask one focused question only when a material boundary cannot be classified
from the request and current evidence.

## Commit and push

Invoking `/just-do-it` authorizes this bounded implementation, verification,
commit, and normal push on the current named branch. Do not include unrelated
changes in the commit. Use the installed `commit` skill when available. After
verification, commit the change and push the current named branch. Do not ask
for a separate commit or push approval.

If verification, commit, or push fails, stop with the local evidence and the
exact recovery action. Do not claim delivery succeeded.

Do not open or update a pull request unless the user asks for it. This authority
does not authorize merge, deployment, release, plain force push, worktree
cleanup, destructive actions, or unrelated changes.
