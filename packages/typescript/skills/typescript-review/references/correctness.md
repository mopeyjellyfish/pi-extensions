# Correctness

## Decision

Review changed runtime behavior before type elegance. Trace a real value from
its source through parsing, branching, storage, and output. Ask what concrete
wrong result, data loss, security exposure, or contract violation a user sees.
Types describe trusted values; they do not validate a request, file, environment
variable, or JSON response.

## Procedure

Read the public seam and the changed branch. Check input normalization, empty
and malformed cases, numeric boundaries, error translation, and cleanup. For
example, a parser that accepts `"2x"` through `parseInt` can silently charge
2 instead of rejecting the invalid amount. Compare implementation behavior with
repository tests and documented support promises, then report the smallest
correction that prevents the consequence.

## Failure modes

A passing compiler can hide an unchecked `JSON.parse` result or a default that
changes a user choice. Do not report a theoretical style preference as
correctness. Avoid repeating a current test, compiler, or linter diagnostic;
explain the runtime path it misses. If no observable failure is plausible, lower
the finding priority or omit it.
