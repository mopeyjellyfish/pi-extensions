# Narrowing

## Decision

Narrow `unknown` with runtime evidence close to the use: `typeof`,
`Array.isArray`, equality against a discriminant, or a small predicate that
checks the properties the next operation needs. A predicate is a contract, so
make it no broader than its implementation proves.

## Procedure

Prefer direct checks for one use. For a repeated boundary shape, write a guard:

```ts
function hasName(value: unknown): value is { name: string } {
  return (
    typeof value === "object" && value !== null && "name" in value && typeof value.name === "string"
  );
}
```

Then reject or report the invalid value at the boundary, rather than asserting
it in a distant consumer. Use a discriminant for variants; it is easier to
narrow and test than guessing from optional fields.

## Failure modes

`value as User` and `value!` claim evidence that has not occurred. Checking only
`typeof value === "object"` does not prove a property exists or has a callable
method. Avoid a generic `isRecord` guard followed by unchecked property reads.
If a guard becomes a partial schema language, reuse the repository's parser or
keep its validation decisions explicitly documented and tested.
