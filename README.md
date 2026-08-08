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

| Package                                                                    | What it does                                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`@mopeyjellyfish/pi-engineering`](packages/engineering/README.md)         | Guides bug diagnosis, domain language, and two-axis change review.                  |
| [`@mopeyjellyfish/pi-feature-flow`](packages/feature-flow/README.md)       | Starts or resumes shaped features through one skill and `/shape` prompt.            |
| [`@mopeyjellyfish/pi-git-conventions`](packages/git-conventions/README.md) | Helps write Conventional Commits and safely rebase a branch onto its base.          |
| [`@mopeyjellyfish/pi-productivity`](packages/productivity/README.md)       | Helps humans and agents write clear instructions and repair unclear messages.       |
| [`@mopeyjellyfish/pi-question`](packages/question/README.md)               | Gives agents a structured way to ask clear questions.                               |
| [`@mopeyjellyfish/pi-simple-english`](packages/simple-english/README.md)   | Helps agents write clear human-facing text with pragmatic ASD-STE100 rules.         |
| [`@mopeyjellyfish/pi-lsp`](packages/lsp/README.md)                         | Adds LSP diagnostics, navigation, validation, and safe semantic refactoring tools.  |
| [`@mopeyjellyfish/pi-status-line`](packages/status-line/README.md)         | Shows a worktree-aware Powerlevel10k-style footer with todo progress.               |
| [`@mopeyjellyfish/pi-todo`](packages/todo/README.md)                       | Keeps a small task list for the current Pi session.                                 |
| [`@mopeyjellyfish/pi-web-search`](packages/web-search/README.md)           | Searches the web through the selected model provider.                               |
| [`@mopeyjellyfish/pi-worktrunk`](packages/worktrunk/README.md)             | Creates and selects Worktrunk worktrees, then routes Pi tools to the selected path. |

The Worktrunk package needs
[Worktrunk](https://worktrunk.dev) installed separately. It is an independent
Pi extension, not an official Worktrunk integration.

## Install everything

Install the repository as one global Pi package:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

This aggregate also installs and loads these external resources:

- the [`@dietrichgebert/ponytail`](https://github.com/DietrichGebert/ponytail)
  extension and its six skills;
- the [`@ff-labs/pi-fff`](https://www.npmjs.com/package/@ff-labs/pi-fff)
  extension.

Installing one package from `packages/` does not include those external resources.

When `pi-subagents` is installed, the aggregate also supplies FFF/LSP-aware
`advisor`, `context-builder`, `delegate`, `oracle`, `planner`, `reviewer`, `scout`,
and `worker` definitions. `planner` and `context-builder` are repository-owned
roles; the other definitions remain external companion overrides. Read-only
roles receive search, semantic query, and validation tools; writer roles also
receive safe LSP mutation tools. The strict tool lists require FFF's
`tools-and-ui` (default) or `tools-only` mode; FFF's `override` mode uses
different tool names and is not compatible with these definitions. The
`researcher` remains web-only and uses the aggregate's provider-native
`web_search` tool instead of the separate `pi-web-access` tool set. The custom
overrides are validated with `pi-subagents` 0.43.0; compare its `agents/`
directory when adopting a newer version. Historical feature records keep the
version used when their acceptance work ran.

The aggregate uses `openai-codex/gpt-5.6-luna` for `scout`, `context-builder`,
`researcher`, `planner`, `reviewer`, and `worker`, with `medium` effort for
`worker` and `reviewer`, `high` for `context-builder`, `researcher`, and
`planner`, and `low` for `scout`. It uses `openai-codex/gpt-5.6-sol` at `max`
for `advisor` and `oracle`; `delegate` inherits the parent model. Per-run and
chain-step model overrides take precedence. `subagents.agentOverrides` can fill
fields that package frontmatter leaves unset, but cannot replace explicit
frontmatter fields. A user or project agent definition can still shadow a
package agent. These defaults therefore require OpenAI Codex
authentication unless the caller supplies another model when launching the agent.

Roles load skills selectively because every custom role sets `inheritSkills: false`:
workers use `ponytail` and conditional bug diagnosis, reviewers use change
review and reserve `ponytail-review` for explicit simplicity reviews, planners
and context builders use domain modeling and agent writing, oracle and advisor
use conditional domain modeling, and researchers use agent writing. Scout and delegate add no role skills.
Whole-repository `ponytail-audit` runs only when explicitly requested.

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
