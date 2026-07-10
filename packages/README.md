# Package contract

Every direct child directory of `packages/` is treated as a production extension. Discovery is automatic: an incomplete directory fails CI rather than being silently ignored.

## Required files

```text
packages/<name>/
├── CHANGELOG.md
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
- `license: "MIT"`, `type: "module"`, and `engines.node: ">=22.20.0"`;
- `files` containing `src/`, `README.md`, `CHANGELOG.md`, and `LICENSE`;
- `pi-package` and `pi-extension` keywords;
- one or more existing `pi.extensions` entrypoints;
- `@earendil-works/pi-coding-agent: "*"` in `peerDependencies`;
- canonical Git repository metadata whose `directory` matches the workspace path;
- package-local `test` and `typecheck` scripts;
- no dependency duplicated across dependency sections;
- Pi host packages only in `peerDependencies`.

The root aggregate must resolve to every package entrypoint and no unmanaged files. The standard aggregate glob covers `src/index.ts`; a package that deliberately declares additional entrypoints must add matching root `pi.extensions` patterns in the same change. `npm pack` must include each declared entrypoint, package manifest, README, changelog, and license.

## Releases

Each production package must have exactly one matching entry in `release-please-config.json` and `.release-please-manifest.json`. Its release type is `node`, and its release-manifest version equals `package.json`. The Node release strategy derives the tag component as the unscoped package name (`pi-<name>`); identity overrides are not supported. Use `0.0.0` for a new package so its first feature release is `0.1.0`.

Versions are independent. A consolidated Release PR can update several extensions to different versions; merging it creates a separate `<component>-v<version>` tag and GitHub Release for each. The `node-workspace` plugin keeps the root workspace lockfile synchronized without linking package versions. npm publication is not automated.

Release Please assigns commits by changed package path. Breaking changes release a major version, `feat` releases a minor version, and visible non-feature types (`fix`, `perf`, `docs`, `chore`, `refactor`, `revert`, `build`, and `deps`) release a patch version. Package-local skill, documentation, or dependency maintenance therefore receives a patch release, while root-only maintenance does not release an extension.

## Dependency rules

Pi installs distributed packages with production dependencies. Declare every third-party runtime import in the package's `dependencies`, even when the root happens to contain it. Pi's core packages and `typebox` are host-provided peers when imported. Package-specific build and test tools belong in `devDependencies`; prefer shared root tooling when possible.

Do not use workspace-only runtime links in a publishable extension unless the dependency is deliberately bundled and its installation behavior has been tested from the packed artifact.

## Tests

Each package supplies focused tests under `test/`. Root CI applies strict TypeScript checking, type-aware ESLint, Vitest coverage, manifest checks, source loading, packed installation, and Pi RPC lifecycle smoke tests automatically.

Production TypeScript must remain above 90% line, function, and statement coverage and 85% branch coverage. A Go module must remain above 80% total coverage.

## Security

Extensions run with full user permissions. Minimize dependencies and privileges, avoid ambient credentials, validate all external input, use safe process argument arrays, and never log secrets or write to the RPC/JSON standard-output channel.
