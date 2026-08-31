# Type testing

## Decision

Use type tests for public assignability, rejection, declaration output, and
important inference. Keep them separate from runtime tests because a compiler
acceptance says nothing about JSON validation, and a runtime assertion cannot
prove a consumer receives the intended declaration type. Use the target's
existing type-test mechanism or a small compile fixture.

## Procedure

Import from the public package entrypoint, not internal source. Give an exported
function a representative call and assign its result to the expected type.
Test a state union by narrowing its discriminant, and test a rejected public call
only when it protects a meaningful API rule. Avoid asserting exact compiler
error text; TypeScript revisions change it.

```ts
const result = parseUrl("https://example.test");
if (result.ok) {
  const url: URL = result.value;
}
```

## Failure modes

A fixture that imports private files misses exports and declaration packaging.
Using `as any` in a type test defeats the contract. Do not replace behavior
tests with `expectTypeOf` or a successful `tsc` run. If declaration generation
is part of publication, inspect and test the emitted public types after an
export or dependency change.
