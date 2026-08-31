# Legacy patterns

## Decision

Start with one failing behavior, compiler diagnostic, or maintainability cost in
one module. Preserve a known boundary, make a rollback-sized change, then record
before/after compiler and targeted-test evidence. Modernization is incremental:
do not combine formatting, dependency upgrades, architecture redesign, and
strictness changes in one review.

## Procedure

Inspect `tsconfig`, ESLint configuration, package module format, supported
runtimes, and existing commands. Choose one sequence: fix a boundary, add its
test, remove one unsafe escape, then typecheck and run the focused test. For
compiler settings, enable one compatible flag in a narrow project or module,
fix its diagnostics, and measure the result before the next flag. For ESLint,
inspect the installed preset and enable a rule family with a small baseline,
not a surprise repository-wide cleanup. For ESM, first prove emitted imports and
exports in a packed consumer.

## Failure modes

A global `strict` flip creates a noisy, unreviewable backlog. A blind ESLint
migration hides real warnings in mass suppressions. Do not change module format
to solve one import. Keep each commit reversible so a consumer failure can be
rolled back without losing unrelated improvements.
