# Async testing

## Decision

Assert completion, rejection, cancellation, and ordering as observable behavior.
Await or return the promise under test. Use the target runner's fake timers,
controllable promises, and cleanup hooks rather than arbitrary sleeps. In
Playwright, wait for a visible user result rather than a guessed delay.

## Procedure

Create a deferred promise when a test needs to control order. Start request A,
start B, resolve B, then resolve A and assert the state keeps B's result. For a
cancelled operation, abort an `AbortController` and assert the documented
outcome. Ensure every started operation settles before the test ends so a late
rejection does not leak into another test.

## Failure modes

A forgotten `await` can make a test pass before the assertion runs. `setTimeout`
creates flaky timing and conceals races. Do not cast a promise or disable a lint
rule to hide `no-floating-promises`; decide who owns the task and its failure.
Runtime tests should prove actual cancellation and ordering, while static tests
can separately prove that a public async API returns the promised type.
