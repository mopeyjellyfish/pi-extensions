# Maintainability

## Decision

After correctness and safety, check whether a future maintainer can understand
names, state transitions, async ownership, failure paths, and public contracts
locally. Prefer removing duplicated conversions and escape hatches over adding
a general framework. Match the repository's established conventions when they
do not hide a concrete risk.

## Procedure

Read one representative call site and test. Verify each union variant has a
clear transition, each background promise has an error owner, and exported
symbols match support promises. Look for a runtime constant table plus a
separately maintained union that can drift. Check that comments explain a
non-obvious constraint rather than restate a type. Propose a small change, such
as naming one canonical conversion or extracting one parser, only when it
removes repeated, divergent behavior.

## Failure modes

Style-only feedback should not outrank a parser that accepts bad input, a stale
async write, or an accidental export. Do not duplicate current formatter or
linter output. Avoid speculative abstractions, broad renames, and tests coupled
to private layout. A finding is useful when it names the consequence, location,
and proportionate correction; otherwise record no finding.
