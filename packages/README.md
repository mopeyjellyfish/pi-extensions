# Package contract

Every direct child directory of `packages/` is treated as a production extension. Discovery is automatic: an incomplete directory fails CI rather than being silently ignored.

## Required files

```text
packages/<name>/
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── src/index.ts
└── test/
```

The manifest validator requires:

- an independently publishable `@mopeyjellyfish/pi-<name>` package;
- a non-empty version and description;
- `license: "MIT"`, `type: "module"`, and `engines.node: ">=22.19.0"`;
- `files` containing `src/`, `README.md`, and `LICENSE`;
- `pi-package` and `pi-extension` keywords;
- one or more existing `pi.extensions` entrypoints;
- `@earendil-works/pi-coding-agent: "*"` in `peerDependencies`;
- canonical Git repository metadata whose `directory` matches the workspace path;
- package-local `test` and `typecheck` scripts;
- no dependency duplicated across dependency sections;
- Pi host packages only in `peerDependencies`.

The root aggregate must resolve to every package entrypoint and no unmanaged files. The standard aggregate glob covers `src/index.ts`; a package that deliberately declares additional entrypoints must add matching root `pi.extensions` patterns in the same change. `npm pack` must include each declared entrypoint, package manifest, README, and license.

## Dependency rules

Pi installs distributed packages with production dependencies. Declare every third-party runtime import in the package's `dependencies`, even when the root happens to contain it. Pi's core packages and `typebox` are host-provided peers when imported. Package-specific build and test tools belong in `devDependencies`; prefer shared root tooling when possible.

Do not use workspace-only runtime links in a publishable extension unless the dependency is deliberately bundled and its installation behavior has been tested from the packed artifact.

## Tests

Each package supplies focused tests under `test/`. Root CI applies strict TypeScript checking, type-aware ESLint, Vitest coverage, manifest checks, source loading, packed installation, and Pi RPC lifecycle smoke tests automatically.

Production TypeScript must remain above 90% line, function, and statement coverage and 85% branch coverage. A Go module must remain above 80% total coverage.

## Security

Extensions run with full user permissions. Minimize dependencies and privileges, avoid ambient credentials, validate all external input, use safe process argument arrays, and never log secrets or write to the RPC/JSON standard-output channel.
