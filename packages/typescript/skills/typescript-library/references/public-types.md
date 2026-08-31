# Public types

## Decision

Public parameter, return, and exported object types are compatibility surface.
Keep them readable and minimal. Prefer a named structural type you own over an
anonymous inferred implementation shape or a dependency type that consumers
must install to compile. Use inference internally, but make important public
inference intentional and tested.

## Procedure

Generate declarations or use the repository's type-test mechanism. Write a
consumer fixture that imports from the package name, calls the public API, and
checks an intended inferred result:

```ts
const client = createClient({ retry: 2 });
const name: string = client.name;
```

Also include a rejected call when it guards an important contract, without
pinning compiler diagnostic wording. Review declaration changes in diffs just
as carefully as runtime exports.

## Failure modes

Exposing a private class, conditional implementation type, or `import("dep")`
type couples users to files and versions you do not control. An overly broad
`Record<string, unknown>` hides useful mistakes. Do not add type tests that
import internal source; they prove a different API than a published consumer
receives.
