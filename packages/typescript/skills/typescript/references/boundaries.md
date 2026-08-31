# Boundaries

## Decision

A type annotation does not turn network JSON, an environment variable, a file,
or a plugin result into that type. Receive untrusted input as `unknown`, parse
it once at the boundary, and pass a trusted domain value inward. Choose a small
local parser before adding a validation library; reuse the repository's validator
when one already owns the boundary.

## Procedure

For a configuration port, check the actual runtime shape and return either a
value or an explainable failure:

```ts
function parsePort(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65_536 ? port : undefined;
}
```

Keep parsing near `process.env`, `JSON.parse`, request decoding, or deserialization.
Convert aliases such as `"prod"` to one canonical runtime value before business
logic sees them.

## Failure modes

`JSON.parse(text) as Settings` only silences the compiler; a missing nested
property still fails later. Parsing in every consumer causes inconsistent rules.
Do not validate trusted values repeatedly without a security or ownership reason.
Record which boundary owns invalid-input behavior and test valid and invalid
runtime data separately from static types.
