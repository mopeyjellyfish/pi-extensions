# Remove `any`

## Decision

Classify each `any` before changing it. At an untrusted boundary, use `unknown`
and parse. Inside a proven relationship, use a concrete value type or a generic
only where implementation preserves that relationship. Some third-party gaps
need one isolated adapter; do not replace every `any` mechanically with an
assertion or `unknown` that callers immediately cast.

## Procedure

Choose one flow and capture before evidence: where the `any` enters, which
property reads it permits, and a focused failing input. Replace a JSON boundary
with `unknown`, add the smallest guard or repository validator, and make the
trusted result explicit. Then run the compiler and targeted runtime test. For
example, change `payload: any` to `payload: unknown` and validate `id` before
using it, so a number cannot reach a string-only API.

## Failure modes

`unknown as User` only moves the lie. `Record<string, unknown>` does not prove
known properties exist. A generic decoder such as `decode<T>()` invents
validation it cannot perform. Avoid a mass search-and-replace: it can turn
useful compiler diagnostics into vague errors. Keep the change small enough to
compare behavior before and after and roll it back cleanly.
