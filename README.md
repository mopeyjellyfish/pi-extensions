# Pi extensions

A strict npm-workspace monorepo for independently installable [Pi coding agent](https://github.com/earendil-works/pi) packages containing TypeScript extensions, Agent Skills, and optional Go helpers.

> [!WARNING]
> Pi extensions execute with the user's full system permissions, and skills can direct agents to run commands. Review every package and its dependencies before installing it. Never load resources from an untrusted package or repository.

The production packages provide provider-native web search, an independent
Worktrunk adapter, and focused Git convention skills. The Worktrunk package is
not an official upstream Pi integration; see its
[package README](packages/worktrunk/README.md) for the separate `wt`
prerequisite and safety model.

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
source "$HOME/.gvm/scripts/gvm"
source .gvmrc
npm ci --ignore-scripts
```

## Install the packages

npm publication is not automated yet. Install from a trusted local checkout;
Pi records the path without copying it, so keep the checkout available while
the package is installed.

Install the root aggregate to make every extension and skill available in all
projects:

```sh
git clone https://github.com/mopeyjellyfish/pi-extensions.git
cd pi-extensions
pi install "$(pwd)"
pi list
```

Install one package instead by passing its package directory:

```sh
pi install "$(pwd)/packages/worktrunk"
pi install "$(pwd)/packages/git-conventions"
pi install "$(pwd)/packages/web-search"
```

To scope an installation to another project, run the command from that project
with `-l` and an absolute path:

```sh
cd /path/to/project
pi install -l /path/to/pi-extensions/packages/worktrunk
```

Pi writes global installs to `~/.pi/agent/settings.json` and project installs
to `.pi/settings.json`. Review the checkout before trusting either scope;
extensions and skills run with the user's permissions.

## Develop with hot reload

This repository deliberately does not auto-load its root aggregate through
`.pi/settings.json`. Auto-loading the working copy would register each tool
twice when the Git aggregate is also installed globally.

From the repository root, start an isolated development session that disables
installed resources and explicitly loads the working copy:

```sh
nvm use
npm ci --ignore-scripts
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Approve Pi's project-trust prompt after reviewing the checkout. Edit an
extension or skill, then run `/reload` inside Pi. Reload shuts down the old
extension runtime, rereads the live TypeScript and skill sources, and starts a
fresh runtime; reinstalling the package is unnecessary. Restart Pi after
changing dependencies or startup-only CLI flags.

To develop one package instead of the aggregate, replace `.` with its package
directory:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/web-search
```

Keep the discovery-disabling flags for local development. They prevent a
globally or project-installed copy from registering the same tools, commands,
or skills as the explicit `-e` working copy. A normal `pi` session continues
to use the installed copy.

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
packages/<package>/
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── skills/              # optional Agent Skills
├── tsconfig.json        # TypeScript extension packages
├── src/index.ts         # TypeScript extension packages
├── test/
└── go/                  # optional independent Go module
```

The private root package aggregates package extensions and skills. Published
packages remain independently installable.

Each package is versioned independently through a review-gated Release Please PR. Merging that PR creates package-specific tags such as `pi-example-v0.1.0` and matching GitHub Releases; npm publication is not automated yet. Package-local `docs` and `chore` commits intentionally produce patch releases, including skill and documentation maintenance, while root-only changes do not release a package.

## Packages

| Package                                                                    | Purpose                                                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`@mopeyjellyfish/pi-git-conventions`](packages/git-conventions/README.md) | Provide repository-aware Conventional Commit and safe base-branch rebase skills.                             |
| [`@mopeyjellyfish/pi-web-search`](packages/web-search/README.md)           | Search the live web through the current or a configured model's provider-native search API.                  |
| [`@mopeyjellyfish/pi-worktrunk`](packages/worktrunk/README.md)             | Delegate worktree lifecycle actions to Worktrunk and safely route Pi tools into a confirmed linked worktree. |

See [the architecture](docs/architecture.md), [package authoring guide](docs/authoring.md), and [package contract](packages/README.md) before adding resources. Pi's authoritative [extension](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md), [skill](https://pi.dev/docs/latest/skills), and [package](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md) documentation takes precedence over this repository's guidance.

## License

[MIT](LICENSE)
