# Extension authoring

Read Pi's official extension and package documentation completely before implementing an extension. Follow linked TUI, RPC, session, compaction, provider, or theme documentation when the extension uses those APIs.

## Create a package

Create `packages/<name>/` using the contract in [`packages/README.md`](../packages/README.md). Use a package name of `@mopeyjellyfish/pi-<name>` and declare the canonical host as a peer:

```json
{
  "name": "@mopeyjellyfish/pi-example",
  "version": "0.0.0",
  "description": "A concise description.",
  "license": "MIT",
  "type": "module",
  "engines": { "node": ">=22.19.0" },
  "files": ["src/", "README.md", "CHANGELOG.md", "LICENSE"],
  "keywords": ["pi-extension", "pi-package"],
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*"
  },
  "pi": {
    "extensions": ["./src/index.ts"]
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mopeyjellyfish/pi-extensions.git",
    "directory": "packages/example"
  },
  "scripts": {
    "test": "vitest run test",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  }
}
```

The package's `tsconfig.json` extends `../../tsconfig.base.json` and includes `src/**/*.ts` and `test/**/*.ts`. Tests use the shared Vitest configuration unless the package has a documented reason to specialize it.

Create `CHANGELOG.md`, then register the package in both release files at the package's current version:

In the `release-please-config.json` `packages` object:

```json
{
  "packages/example": {
    "release-type": "node"
  }
}
```

In `.release-please-manifest.json`:

```json
{
  "packages/example": "0.0.0"
}
```

Starting at `0.0.0` lets the first `feat(pi-example): ...` commit produce the intended `pi-example-v0.1.0` release. The Node release strategy derives both the scoped package identity and unscoped `pi-example` tag component from `package.json`; do not override them in release configuration. The package validator rejects missing, orphaned, mismatched, or unsupported release metadata.

## Extension checklist

- Export one typed default factory from every declared entrypoint.
- Use `import type` when an import is erased.
- Use `StringEnum` from Pi AI for provider-compatible string enum schemas.
- Throw from custom tool execution to report errors; do not return an error-shaped success.
- Normalize a leading `@` when a custom tool accepts paths.
- Use `withFileMutationQueue()` around complete read-modify-write windows.
- Propagate cancellation and make cleanup idempotent.
- Start long-lived resources after session startup, never from module scope.
- Rebuild state from the current session branch after startup, reload, resume, and fork.
- Keep tool output within Pi's 50 KB and 2,000-line limits and identify saved full output.
- Name every `promptGuidelines` bullet's tool explicitly.
- Guard TUI-only behavior and provide useful non-interactive behavior.
- Avoid standard output because it is the JSON/RPC transport in non-TUI modes.
- Put runtime dependencies in `dependencies`, Pi-provided modules in `peerDependencies`, and tests/tooling in `devDependencies`.
- Test registration, event behavior, cancellation, error paths, state restoration, truncation, and cleanup.

## Optional Go helper

Create `packages/<name>/go/go.mod` with Go `1.26.5` and keep all code within that module. Add deterministic tests before implementation and ensure total coverage remains at least 80%. Do not add the module to a root workspace file.

The TypeScript extension must test process startup, protocol framing, cancellation, failure handling, and shutdown. Generated binaries and coverage files are never committed.

## Validate

```sh
npm run fix
npm run check
npm run workflows:check
npm run security:check
```

The generic Pi smoke test proves loadability and lifecycle safety. Extension-specific integration tests must exercise its tools, commands, UI-independent behavior, and any native helper; generic smoke is not a substitute for behavior tests.
