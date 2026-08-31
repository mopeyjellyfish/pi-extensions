# Assertions

## Decision

An assertion changes what the compiler believes without producing runtime
evidence. Treat `as`, non-null `!`, and definite-assignment claims as a design
question: identify the missing validation, control-flow fact, union branch, or
API contract. Keep `as const` and `satisfies` for their narrow value-preserving
purposes, not as escapes.

## Procedure

Before retaining an assertion, trace its value to the boundary. Replace
`payload as User` with a parser, `items[0]!` with an empty-case branch, or an
incomplete cast after a switch with exhaustive handling. If a platform API has
an intentionally incomplete declaration, isolate one documented assertion in a
small adapter and test the runtime assumption.

## Example

```ts
const first = items[0];
if (first === undefined) return { state: "empty" };
return { state: "ready", first };
```

## Failure modes

A cast can make refactoring silently unsafe, especially after JSON parsing or
filtering. Replacing all assertions mechanically may create verbose guards that
do not validate the needed property. Do not use a double assertion through
`unknown` to bypass incompatible types; either adapt the data or correct the
contract.
