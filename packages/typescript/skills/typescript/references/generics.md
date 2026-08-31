# Generics

## Decision

Introduce a generic only when the implementation preserves a real relationship
between inputs and outputs. A generic says callers choose a type; it is not a
replacement for `unknown`, runtime parsing, or a concrete domain union.
Constrain it only with members the implementation reads.

## Example

A lookup preserves the relationship between an object and one of its keys:

```ts
function pick<T extends object, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
```

This is useful because `pick(user, "name")` returns the actual field type. Use
mapped or conditional types when they express a stable transformation between
types that callers already understand. Name and test the transformation when
nesting makes compiler failures difficult to interpret. For a few known
commands, a discriminated union or overload is clearer than a conditional
generic that callers cannot read.

## Failure modes

A generic such as `function decode<T>(text: string): T` lies: text cannot prove
which `T` it contains. Do not add `extends any`, broad constraints, or type
parameters used once just to appear reusable. Excessive generic factories push
errors to call sites. First write a concrete implementation and generalize only
when a second proven use needs the same relationship.
