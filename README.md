# Pi extensions

A strict npm-workspace monorepo for independently installable [Pi coding agent](https://github.com/earendil-works/pi) extensions written in TypeScript, with optional Go helpers.

> [!WARNING]
> Pi extensions execute with the user's full system permissions. Review every extension and its dependencies before installing it. Never load code from an untrusted package or repository.

The first production package is `@mopeyjellyfish/pi-worktrunk`, an independent
adapter that uses Worktrunk for worktree lifecycle operations while Pi routes
its tools into a selected linked worktree. It is not an official Worktrunk Pi
integration; see its [package README](packages/worktrunk/README.md) for the
separate `wt` prerequisite and safety model.

## Requirements

- [nvm](https://github.com/nvm-sh/nvm)
- Node `24.18.0` from `.nvmrc` for routine development
- Node `22.20.0` (Jod LTS) for minimum-runtime compatibility checks
- [gvm](https://github.com/moovweb/gvm)
- npm, included with each Node installation
- golangci-lint `2.12.2`
- govulncheck for repositories containing Go modules
- zizmor `1.26.1` when checking workflows locally

```sh
nvm install
nvm install 22.20.0
nvm use
gvm install go1.26.5 -B # only when the version is not already installed
source .gvmrc
npm ci --ignore-scripts
```

## Commands

| Command                   | Purpose                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run check`           | Run formatting, linting, type checking, tests, package validation, Pi smoke tests, and Go checks |
| `npm run commits:check`   | Validate a commit from stdin or a range supplied with `--from` and `--to`                        |
| `npm run fix`             | Apply supported TypeScript, documentation, and Go fixes                                          |
| `npm run smoke`           | Load source and packed artifacts through real Pi processes                                       |
| `npm run packages:check`  | Validate workspace, release metadata, aggregate coverage, and packed contents                    |
| `npm run workflows:check` | Run actionlint and zizmor against GitHub Actions                                                 |
| `npm run security:check`  | Audit dependencies and scan Git history for secrets                                              |

Individual gates are exposed in `package.json` for focused development.

## Layout

```text
packages/<extension>/
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
├── test/
└── go/                 # optional independent Go module
```

The private root package aggregates `packages/*/src/index.ts`, so `pi -e .` loads the full collection. A single package can be tested with `pi -e packages/<extension>`. Published packages remain independently installable.

Each extension is versioned independently through a review-gated Release Please PR. Merging that PR creates extension-specific tags such as `pi-example-v0.1.0` and matching GitHub Releases; npm publication is not automated yet. Package-local `docs` and `chore` commits intentionally produce patch releases, including skill and documentation maintenance, while root-only changes do not release an extension.

## Packages

| Package                                                        | Purpose                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`@mopeyjellyfish/pi-worktrunk`](packages/worktrunk/README.md) | Delegate worktree lifecycle actions to Worktrunk and safely route Pi tools into a confirmed linked worktree. |

See [the architecture](docs/architecture.md), [extension authoring guide](docs/authoring.md), and [package contract](packages/README.md) before adding code. Pi's authoritative [extension](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md) and [package](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md) documentation takes precedence over this repository's guidance.

## License

[MIT](LICENSE)
