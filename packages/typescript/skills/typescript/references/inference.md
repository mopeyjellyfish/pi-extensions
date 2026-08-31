# Inference

## Decision

Let TypeScript infer local variables, object literals, callback parameters, and
obvious return expressions. Add an annotation at a meaningful boundary: a
public export, a parsed value, a callback contract, or a value whose widening
would hide a mistake. `const` plus a stable data table often gives a better
literal union than a hand-maintained duplicate type.

## Procedure

Start with the JavaScript value. Hover or inspect the inferred type, then ask
whether a caller needs a promise that the implementation does not yet make.
For example, derive a route type from one canonical table:

```ts
const routes = ["home", "settings"] as const;
type Route = (typeof routes)[number];
```

Use `satisfies` when a value must meet a shape while keeping its useful narrow
inference: `const codes = { ok: 200 } as const satisfies Record<string, number>`.

## Failure modes

Annotating every local as `string`, `object`, or a broad interface erases useful
facts and makes refactors noisier. Conversely, exporting a complex inferred
anonymous type can accidentally make internals public. Do not replace unclear
inference with `any`; name the boundary contract or improve the value model.
