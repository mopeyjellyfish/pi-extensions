# Pi extensions

A strict npm-workspace monorepo for independently installable [Pi coding agent](https://github.com/earendil-works/pi) extensions written in TypeScript, with optional Go helpers.

> [!WARNING]
> Pi extensions execute with the user's full system permissions. Review every extension and its dependencies before installing it. Never load code from an untrusted package or repository.

No production extensions are included yet. The repository currently supplies the package contract, tooling, tests, and CI gates required before the first extension is added.

## Requirements

- [nvm](https://github.com/nvm-sh/nvm)
- [gvm](https://github.com/moovweb/gvm)
- npm, included with the Node version in `.nvmrc`
- golangci-lint `2.12.2`
- govulncheck for repositories containing Go modules
- zizmor `1.26.1` when checking workflows locally

```sh
nvm install
nvm use
gvm install go1.26.5 -B # only when the version is not already installed
source .gvmrc
npm ci --ignore-scripts
```

## Commands

| Command                   | Purpose                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run check`           | Run formatting, linting, type checking, tests, package validation, Pi smoke tests, and Go checks |
| `npm run fix`             | Apply supported TypeScript, documentation, and Go fixes                                          |
| `npm run smoke`           | Load source and packed artifacts through real Pi processes                                       |
| `npm run packages:check`  | Validate workspace manifests, aggregate coverage, and packed contents                            |
| `npm run workflows:check` | Run actionlint and zizmor against GitHub Actions                                                 |
| `npm run security:check`  | Audit dependencies and scan Git history for secrets                                              |

Individual gates are exposed in `package.json` for focused development.

## Layout

```text
packages/<extension>/
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

See [the architecture](docs/architecture.md), [extension authoring guide](docs/authoring.md), and [package contract](packages/README.md) before adding code. Pi's authoritative [extension](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md) and [package](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md) documentation takes precedence over this repository's guidance.

## License

[MIT](LICENSE)
