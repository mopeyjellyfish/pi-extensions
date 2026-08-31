# Async

## Decision

A promise should represent real completion, including failures that matter to
the caller. Await work before reporting success, return the promise when the
caller owns completion, and pass cancellation signals through operations that
support them. Define ordering when concurrent updates touch the same state.

## Procedure

Trace one operation from input to visible result. Mark each promise as awaited,
returned, intentionally detached with error handling, or cancelled. For a
search request, make stale completion harmless by comparing its request ID to
the current `"loading"` union state before committing a result.

```ts
const result = await fetch(url, { signal });
if (!result.ok) throw new Error(`Request failed: ${result.status}`);
```

## Failure modes

An unawaited write may finish after its caller reports success; a rejected
promise can become an unrelated process failure. `void task()` is only honest
when the task has its own error reporting and lifecycle. Do not use casts to
silence promise lint rules or arbitrary delays to coordinate state. Test success,
rejection, cancellation, and ordering through controllable promises or clocks.
