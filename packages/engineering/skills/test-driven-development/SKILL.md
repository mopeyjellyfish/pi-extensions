---
name: test-driven-development
description: >-
  Implements behavioral code through one intended failing test and the minimum
  passing change at an approved public seam.
---

# Test-driven development

Before any repository write, verify that the session is rooted in, or Pi is
routed to, an isolated linked worktree for this task. Never add tests or
production behavior in the main-branch checkout. Use the available worktree
lifecycle tool to create or activate the task worktree when needed. If safe
worktree tooling is unavailable, stop before writing and ask the human to
provide an isolated worktree.

After entering a new worktree, read the repository instructions and perform its
declared runtime and dependency setup before the first test. Ignored
dependencies and generated files do not normally carry across worktrees. Run
the declared setup once and verify the required tool is available; do not invent
commands or assume another worktree's ignored files exist. A setup failure is
not behavioral red proof. Diagnose it separately and do not rerun an unchanged
setup command.

A good test is falsifiable: it describes one observable capability through a
public interface, uses an independent expected value, and would fail for a
plausible wrong implementation. It survives internal refactoring. Use the narrowest stable
approved seam that still proves the behavior. An accepted request, accepted
pitch, or accepted plan counts as seam approval; ask only when the seam is
unresolved.

**Tautological tests are harmful.** A test is tautological when it derives the
expected value by calling the implementation under test, repeats the same
algorithm, uses a production helper that encodes the same rule, or compares an
output with itself. Rewrite or remove a tautological test because it cannot
provide independent evidence.

For each vertical behavior, use a narrow red, green, refactor sequence:

1. Add the smallest behavior test with an independent expected value from
   accepted intent, a known literal, or a worked example.
2. Run it and confirm the public seam fails for the intended behavioral reason,
   not because of setup or syntax. Diagnose a failed test before any rerun. If
   one correction leaves the same failure, stop and inspect the complete
   failure, command, test, and sibling assertions before another change; never
   repeat an unchanged command without new evidence.
3. Add only the minimum production behavior needed to pass.
4. Run the focused test, then refactor while green.
5. Repeat vertically, then run integration proof when dependent behaviors join.
   When a plan exists, follow its invalidation map for broader checks; otherwise
   derive the smallest ladder from the changed surfaces. Required final gates
   still run at the stable delivery-unit boundary.

Reject mock-call-only tests, tests of a private helper or implementation
structure, tautological expected values, and horizontal batches of imagined
behavior. Preserve substitution with the same public behavior tests. Mock only
real process, filesystem, time, randomness, network, provider, or UI boundaries
when necessary, not owned collaborators.

A pure refactor uses applicable existing tests or the smallest focused
validation before and after. Add a public-seam behavior test only when it gives
material protection. Documentation, metadata, generated-contract, and
mechanical work use the smallest focused validation that can detect the
intended error; do not manufacture a red test.

## Go routing

When work has Go source, a Go module, a Go CLI, or Go-specific work, resolve
`go` by its installed name and follow it. Resolve `cobra-viper` only when Cobra
or Viper commands, flags, or CLI configuration are in scope. Unrelated Go
toolchain evidence alone does not activate either method. If a companion skill
is unavailable, record the unmet method and have the direct parent use bounded
target-repository Go standards without pretending the skill loaded.
