# ESM

## Decision

Use native ESM when the supported runtime and package policy agree; it is not a
universal repair for import friction. Match source syntax, compiler module and
resolution options, emitted file layout, and the `package.json` package type.
For browser support, also confirm that the published code avoids Node-only APIs.

## Procedure

Inspect the target Node versions, existing package format, build output, and a
packed consumer. In an ESM build, write runtime-relative imports in the form
expected by emitted JavaScript, commonly `./file.js`, and use `import type` for
erased imports. Exercise `import("package-name")` from a temporary consumer or
the repository's package test.

## Failure modes

Source tests can resolve aliases that the published package does not export.
Changing only `tsconfig` can leave CommonJS output or a stale export map behind.
Do not prescribe a bundler or migrate a mixed package without a compatibility
plan. If CommonJS is supported, test its documented entrypoint separately;
otherwise reject it clearly instead of accidentally creating a half-working
path.
