# Exports

## Decision

Treat `package.json` `exports` as the public map, not a build detail. Export
only supported values and types, and keep implementation paths private. A
small explicit map lets maintainers reorganize internals without breaking users
who import deep files.

## Procedure

List each documented consumer import, then map it to a runtime file and its
declaration file. Test the packed package with the intended root import and any
intentional subpath. Keep type exports deliberate:

```ts
export { createClient } from "./client.js";
export type { ClientOptions, Client } from "./client.js";
```

When a new export is proposed, ask whether it has an owner, a compatibility
promise, and an example. Remove accidental re-exports before release rather
than teaching consumers an internal path.

## Failure modes

A barrel can expose private helpers or introduce a cycle. A type that works in
source may be absent from the declaration entrypoint. Do not test only a
relative source import: it misses export-map, ESM-resolution, and package-file
errors. A breaking rename needs the package's stated compatibility process.
