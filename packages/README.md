# Package contract

Every direct child directory of `packages/` is treated as a production Pi package. A package may ship extensions, skills, or both. Discovery is automatic: an incomplete directory fails CI rather than being silently ignored.

## Required files

```text
packages/<name>/
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── skills/             # when pi.skills is declared
├── tsconfig.json       # when pi.extensions is declared
├── src/index.ts        # when pi.extensions is declared
└── test/
```

The manifest validator requires:

- an independently publishable `@mopeyjellyfish/pi-<name>` package;
- a non-empty version and description;
- `license: "MIT"`, `type: "module"`, and `engines.node: ">=22.20.0"`;
- `files` containing `README.md`, `CHANGELOG.md`, `LICENSE`, and each declared resource directory;
- the `pi-package` keyword and `pi-extension` for packages with extensions;
- one or more existing `pi.extensions` or `pi.skills` entrypoints;
- `@earendil-works/pi-coding-agent: "*"` in `peerDependencies` for extension packages;
- canonical Git repository metadata whose `directory` matches the workspace path;
- a package-local `test` script, plus `typecheck` for extension packages;
- no dependency duplicated across dependency sections;
- Pi host packages only in `peerDependencies`.

The root aggregate must resolve to every package extension and skill with no unmanaged resources. The standard aggregate globs cover `src/index.ts` and `skills/`; a package that deliberately declares another resource layout must add matching root `pi` patterns in the same change. An external Pi package included by the private root Git aggregate must be declared in `dependencies`, and the root `pi` manifest must reference its resources under `node_modules/`. `npm pack` must include each declared resource, package manifest, README, changelog, and license.

## Releases

Each production package must have exactly one matching entry in `release-please-config.json` and `.release-please-manifest.json`. Its release type is `node`, and its release-manifest version equals `package.json`. The Node release strategy derives the tag component as the unscoped package name (`pi-<name>`); identity overrides are not supported. Use `0.0.0` for a new package so its first feature release is `0.1.0`.

Versions are independent. A consolidated Release PR can update several packages to different versions; merging it creates a separate `<component>-v<version>` tag and GitHub Release for each. The `node-workspace` plugin keeps the root workspace lockfile synchronized without linking package versions. npm publication is not automated.

Release Please assigns commits by changed package path. Breaking changes release a major version, `feat` releases a minor version, and visible non-feature types (`fix`, `perf`, `docs`, `chore`, `refactor`, `revert`, `build`, and `deps`) release a patch version. Package-local skill, documentation, or dependency maintenance therefore receives a patch release, while root-only maintenance does not release a package.

## Dependency rules

Pi installs distributed packages with production dependencies. Declare every third-party runtime import in the package's `dependencies`, even when the root happens to contain it. Pi's core packages and `typebox` are host-provided peers when imported and must use the `"*"` range required by Pi's package contract. A Markdown-only skill package needs no Pi runtime peer. Package-specific build and test tools belong in `devDependencies`; prefer shared root tooling when possible.

Do not use workspace-only runtime links in a publishable package unless the dependency is deliberately bundled and its installation behavior has been tested from the packed artifact.

## Tests

Each package supplies focused tests under `test/`. Root CI applies strict TypeScript checking to TypeScript packages, type-aware ESLint, Vitest coverage, manifest checks, source loading, packed installation, and Pi RPC discovery smoke tests automatically.

Production TypeScript must remain above 90% line, function, and statement coverage and 85% branch coverage. A Go module must remain above 80% total coverage.

## Security

Extensions run with full user permissions, and skills can direct agents to execute commands. Minimize dependencies and privileges, avoid ambient credentials, validate all external input, use safe process argument arrays, and never log secrets or write to the RPC/JSON standard-output channel.
