# Modules

## Decision

Make the module boundary match the runtime and the package contract. Import
concrete values normally; use `import type` where the import is erased. Keep a
small public entrypoint and direct internal imports so consumers do not bind to
folder layout. Follow the repository's ESM, CommonJS, bundler, and resolution
settings instead of applying a universal migration.

## Procedure

Inspect `package.json`, `tsconfig`, emitted files, and a real consumer import.
For an ESM package, verify extension and `exports` behavior in the supported
Node or browser build, not just the editor. Add a type-only import when a value
is never read at runtime:

```ts
import type { RequestOptions } from "./options.js";
```

## Failure modes

A barrel can create cycles, hide an expensive initialization, or accidentally
publish internals. A source import may typecheck while the packed package cannot
resolve it. Do not change module format to fix one local import error. Diagnose
whether the runtime, compiler resolution mode, build output, and package export
map agree, then make the smallest compatible change.
