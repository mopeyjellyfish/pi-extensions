# Unions

## Decision

Use a discriminated union when a value has real alternative states. Give every
variant a literal tag that exists at runtime and only the data valid for that
state. This is safer than independent booleans and optional fields because an
impossible combination cannot be constructed.

## Example

```ts
type Load =
  | { state: "idle" }
  | { state: "loading"; requestId: string }
  | { state: "ready"; value: string }
  | { state: "failed"; message: string };

function label(load: Load): string {
  switch (load.state) {
    case "ready":
      return load.value;
    case "failed":
      return load.message;
    case "idle":
      return "Waiting";
    case "loading":
      return "Loading";
  }
}
```

## Failure modes

`{ loading: boolean; value?: string; error?: Error }` permits loading and error
at once, and leaves callers guessing which field wins. Add an exhaustive switch
or a `never` helper when every branch must return; a new variant should produce
compiler feedback. Do not use a union merely to encode unrelated optional
configuration: a clear object with independent options may be the honest model.
