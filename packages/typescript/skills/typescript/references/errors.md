# Errors

## Decision

Separate expected, recoverable outcomes from exceptional failures. Use a result
union when a caller can choose a normal recovery path; throw or reject for an
unexpected failure that should reach an error boundary. Catch values as
`unknown` and preserve useful causal context when wrapping an error.

## Example

```ts
type ParseResult = { ok: true; value: URL } | { ok: false; reason: string };
function parseUrl(text: string): ParseResult {
  try {
    return { ok: true, value: new URL(text) };
  } catch {
    return { ok: false, reason: "A full URL is required." };
  }
}
```

Callers must branch on `ok`; they cannot accidentally read a missing `value`.
For operational errors, use `error instanceof Error` before reading `message`.

## Failure modes

`catch (error) { return error.message }` assumes a thrown value is an `Error`.
Swallowing a rejection converts corruption into a misleading success. Returning
`undefined` for both not-found and failed-to-connect loses recovery information.
Avoid wrapping every error with a new generic message: retain `cause` where the
runtime supports it and expose safe context, never secrets.
