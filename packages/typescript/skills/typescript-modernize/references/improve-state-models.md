# Improve state models

## Decision

Replace booleans and nullable fields that permit impossible combinations with a
discriminated union. Each state should carry only the data valid in that state,
and each transition should be explicit. This gives both runtime clarity and
compiler feedback when a new state is introduced.

## Example

Before, `{ loading: boolean; value?: User; error?: Error }` permits all three
fields at once. After:

```ts
type UserLoad =
  | { state: "idle" }
  | { state: "loading"; id: string }
  | { state: "ready"; user: User }
  | { state: "failed"; message: string };
```

Switch on `state` and make transitions return a complete variant. Test the old
valid paths plus rejected impossible combinations at runtime and package public
types where consumers construct state.

## Failure modes

Do not add a tag while retaining every optional field; the invalid model remains.
A union cannot validate JSON by itself, so parse external state before trusting
its discriminant. Avoid a broad reducer rewrite when one transition is the
problem. Change one state machine, record before/after compiler and behavior
evidence, and keep the commit small enough to roll back.
