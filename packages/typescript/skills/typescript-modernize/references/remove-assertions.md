# Remove assertions

## Decision

For each `as` or non-null `!`, find the missing evidence: validation, a union
branch, an empty-case check, an inaccurate declaration, or a control-flow gap.
Fix that cause. Retain `as const` for literal preservation and `satisfies` for
shape checking because they do not pretend an unknown runtime value was checked.

## Procedure

Make one assertion visible in a test or compiler example. Before: `const user =
JSON.parse(text) as User`. After: parse to `unknown`, validate the needed fields,
and return a result union for invalid input. For `items[0]!`, branch on
`undefined`; for an exhaustive switch cast, add the missing state variant.
Re-run the module typecheck and a targeted valid/invalid runtime test after each
replacement.

## Failure modes

A double cast through `unknown` is not a migration. Replacing an assertion with
a sprawling guard can duplicate a parser already owned at the boundary. Do not
remove an assertion around an incomplete platform declaration without checking
the runtime contract; isolate and document a narrow adapter instead. Keep
evidence before and after so the review proves both safer typing and preserved
behavior.
