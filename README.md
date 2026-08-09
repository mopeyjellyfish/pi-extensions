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
`advisor`, `context-builder`, `delegate`, `oracle`, `planner`, `qa`, `reviewer`,
`scout`, and `worker` definitions. `planner`, `context-builder`, and `qa` are
repository-owned roles; the other definitions remain external companion
overrides. Parent agents and explicitly permitted fanout subagents can select
`qa` through `pi-subagents`. Ordinary child roles remain non-orchestrating.
Read-only roles receive search, semantic query, and validation tools; writer
roles also receive safe LSP mutation tools. The strict tool lists require FFF's
`tools-and-ui` (default) or `tools-only` mode; FFF's `override` mode uses
different tool names and is not compatible with these definitions. The
`researcher` remains web-only and uses the aggregate's provider-native
`web_search` tool instead of the separate `pi-web-access` tool set. The custom
overrides are validated with `pi-subagents` 0.43.0; compare its `agents/`
directory when adopting a newer version. Historical feature records keep the
version used when their acceptance work ran.

The execution profiles follow OpenAI's
[GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
and [Codex subagent guidance](https://developers.openai.com/codex/agent-configuration/subagents).
The aggregate uses Sol when accuracy matters and Luna when speed matters more:

- `scout` uses `openai-codex/gpt-5.6-luna` at `low` for fast, bounded codebase
  exploration.
- `qa` uses `openai-codex/gpt-5.6-luna` at `medium` to execute repeatable test
  plans and validate fixes through the product's user surface.
- `context-builder`, `researcher`, and `worker` use
  `openai-codex/gpt-5.6-sol` at `medium` for normal analysis and implementation.
- `planner` and `reviewer` use Sol at `high` for multi-step decisions and
  independent quality review.
- `advisor` and `oracle` use Sol at `max` only for the hardest inherited
  decisions. `delegate` inherits the parent model.

Before a launch, classify the task:

- Use Luna for targeted discovery, mechanical documentation or metadata
  changes, inventories, known test-output summaries, and narrow, repeatable,
  low-risk edits with focused deterministic checks.
- Use `qa` for bounded user-surface testing of websites, CLIs, and other
  software. It writes or updates `qa-plan.md`, records evidence, and reports
  coverage gaps. It uses an existing Playwright setup or `playwright-cli` when
  available.
- Override a worker with `openai-codex/gpt-5.6-luna:medium` when speed matters
  more than accuracy.
- Do not increase Luna reasoning to handle complexity. Promote the run to Sol
  instead.
- Override a worker with `openai-codex/gpt-5.6-sol:high` for security or
  data-loss risks, concurrency or lifecycle work, migrations, public APIs,
  protocols, provider transports, cross-package architecture, nondeterministic
  failures, or expensive or unclear validation.
- Escalate a failed Luna attempt to Sol at `medium`, or to `high` when these
  risks apply. Do not repeat the same Luna attempt.
- For a trivial edit, let the parent verify the result directly. If the parent
  starts a formal child review, use the Sol reviewer rather than a Luna quality
  gate.

Start with one agent. Add a subagent only for a bounded specialist lane or when
one agent is measurably struggling. Parallelize independent read-only work such
as codebase exploration, separate failure hypotheses, and correctness,
security, or test-gap review. Start with one child and use no more than three
parallel children unless distinct evidence justifies more. Keep one writer per
worktree. Use isolated worktrees for truly independent write lanes.

Use one Sol `high` reviewer as the formal quality gate. Additional speed-first
lanes can use Luna only for bounded, mechanical, non-gating checks. These
supporting lanes do not replace the Sol reviewer.

Each child task must state its goal, scope, authority, evidence, success
criteria, validation, and output. The parent waits for required children,
reconciles conflicting findings, verifies evidence, inspects the final diff,
and runs the applicable checks.

Per-run and chain-step model overrides take precedence. Include the thinking
suffix in a per-run model value when changing both settings.
`subagents.agentOverrides` can replace `description`. Other override fields fill
values that package frontmatter leaves unset and cannot replace explicit
frontmatter values. A user or project agent definition can still shadow a
package agent. These defaults therefore require
OpenAI Codex authentication unless the caller supplies another model when
launching the agent.

Roles load skills selectively because every custom role sets `inheritSkills: false`:
workers use `ponytail` and conditional bug diagnosis, reviewers use change
review and reserve `ponytail-review` for explicit simplicity reviews, planners
and context builders use domain modeling and agent writing, oracle and advisor
use conditional domain modeling, and researchers and QA use agent writing. QA
can use `playwright-cli` through its shell tool when the command is available.
Scout and delegate add no role skills.
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
