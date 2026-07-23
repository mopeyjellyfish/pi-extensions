# Pi extensions

This repository contains extensions and skills for the
[Pi coding agent](https://github.com/earendil-works/pi).

You can install the whole repository or choose one package. Each package has
its own README with setup and usage details.

> [!WARNING]
> Pi extensions run with your user permissions. Skills can also tell an agent
> to run commands. Read the source before you install a package you do not
> trust.

## Packages

| Package                                                                              | What it does                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [`@mopeyjellyfish/pi-development-workflow`](packages/development-workflow/README.md) | Runs a bounded pitch, vertical-slice, TDD, review, and shipping workflow.            |
| [`@mopeyjellyfish/pi-git-conventions`](packages/git-conventions/README.md)           | Helps write Conventional Commits and safely rebase a branch onto its base.           |
| [`@mopeyjellyfish/pi-question`](packages/question/README.md)                         | Gives agents a structured way to ask clear questions.                                |
| [`@mopeyjellyfish/pi-lsp`](packages/lsp/README.md)                                   | Adds LSP diagnostics, navigation, validation, and safe semantic refactoring tools.   |
| [`@mopeyjellyfish/pi-status-line`](packages/status-line/README.md)                   | Shows worktree, todo, and development-workflow visibility in a Powerlevel10k footer. |
| [`@mopeyjellyfish/pi-todo`](packages/todo/README.md)                                 | Keeps a small task list for the current Pi session.                                  |
| [`@mopeyjellyfish/pi-web-search`](packages/web-search/README.md)                     | Searches the web through the selected model provider.                                |
| [`@mopeyjellyfish/pi-worktrunk`](packages/worktrunk/README.md)                       | Creates and selects Worktrunk worktrees, then routes Pi tools to the selected path.  |

The Worktrunk package needs
[Worktrunk](https://worktrunk.dev) installed separately. It is an independent
Pi extension, not an official Worktrunk integration.

## Install everything

Install the repository as one global Pi package:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

This aggregate also installs and loads the external
[`@ff-labs/pi-fff`](https://www.npmjs.com/package/@ff-labs/pi-fff) extension.
Installing one package from `packages/` does not include that external extension.

Update it later with:

```sh
pi update --extension git:github.com/mopeyjellyfish/pi-extensions
```

Remove it with:

```sh
pi remove git:github.com/mopeyjellyfish/pi-extensions
```

## Install one package

Clone the repository first:

```sh
git clone https://github.com/mopeyjellyfish/pi-extensions.git
cd pi-extensions
```

Then install the package you want:

```sh
pi install "$(pwd)/packages/status-line"
```

Replace `status-line` with any package directory shown above.

Pi keeps the path to your checkout instead of copying it. Keep the checkout in
place while the package is installed. Run `pi list` to see what Pi has loaded.

To install it only for one project, run this from that project:

```sh
pi install -l /path/to/pi-extensions/packages/status-line
```

## Work on the repository

The repository uses the Node version in `.nvmrc` and the Go version in
`.gvmrc`. Install dependencies with:

```sh
nvm install
nvm use
source "$HOME/.gvm/scripts/gvm"
gvm install go1.26.5 -B # first use only
source .gvmrc
npm ci --ignore-scripts
```

Run the full check before you open a pull request:

```sh
npm run check
```

Run `npm run fix` to apply the supported formatting and lint fixes.

To try the working copy in Pi without loading an installed copy at the same
time, start Pi from the repository root with:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Use `/reload` after changing extension source or skill files. Restart Pi after
changing dependencies or startup options.

To load one package, replace `.` with its directory. For example:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/status-line
```

## Repository layout

Each directory under `packages/` is an installable Pi package. The root package
is private and loads all package extensions and skills for development.

```text
packages/<name>/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── src/             # extension packages
├── skills/          # skill packages
├── tsconfig.json    # extension packages
└── test/
```

A package may contain an extension, skills, or both. See the
[package contract](packages/README.md) and
[authoring guide](docs/authoring.md) before adding or changing a package.

For repository design and release details, read the
[architecture guide](docs/architecture.md). For setup rules and pull request
checks, read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
