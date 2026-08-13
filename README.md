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

| Package                                                                          | What it does                                                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`@mopeyjellyfish/pi-engineering`](packages/engineering/README.md)               | Routes coding work and guides diagnosis, domain language, and change review.        |
| [`@mopeyjellyfish/pi-feature-flow`](packages/feature-flow/README.md)             | Starts or resumes shaped features through one skill and `/shape` prompt.            |
| [`@mopeyjellyfish/pi-git-conventions`](packages/git-conventions/README.md)       | Helps write Conventional Commits and safely rebase a branch onto its base.          |
| [`@mopeyjellyfish/pi-github`](packages/github/README.md)                         | Guides authenticated GitHub CLI workflows for common repository operations.         |
| [`@mopeyjellyfish/pi-productivity`](packages/productivity/README.md)             | Helps humans and agents write clear instructions and repair unclear messages.       |
| [`@mopeyjellyfish/pi-question`](packages/question/README.md)                     | Gives agents a structured way to ask clear questions.                               |
| [`@mopeyjellyfish/pi-simple-english`](packages/simple-english/README.md)         | Helps agents write clear human-facing text with pragmatic ASD-STE100 rules.         |
| [`@mopeyjellyfish/pi-lsp`](packages/lsp/README.md)                               | Adds LSP diagnostics, navigation, validation, and safe semantic refactoring tools.  |
| [`@mopeyjellyfish/pi-playwright-cleanup`](packages/playwright-cleanup/README.md) | Owns and verifies cleanup of browser sessions started by Pi agents.                 |
| [`@mopeyjellyfish/pi-status-line`](packages/status-line/README.md)               | Shows a worktree-aware Powerlevel10k-style prompt with todo progress.               |
| [`@mopeyjellyfish/pi-todo`](packages/todo/README.md)                             | Keeps a small task list for the current Pi session.                                 |
| [`@mopeyjellyfish/pi-web-search`](packages/web-search/README.md)                 | Searches the web through the selected model provider.                               |
| [`@mopeyjellyfish/pi-worktrunk`](packages/worktrunk/README.md)                   | Creates and selects Worktrunk worktrees, then routes Pi tools to the selected path. |

The Worktrunk package needs
[Worktrunk](https://worktrunk.dev) installed separately. It is an independent
Pi extension, not an official Worktrunk integration.

## Choose an install profile

Use the smallest profile that supports the project:

- **Small:** Install only the repository packages that the project needs.
- **Medium:** Install the private Git aggregate and install `pi-subagents`
  separately.
- **Large:** Use the medium profile. Also install `context-mode`, the language
  servers that the project needs, and Worktrunk when you use linked worktrees.

These profiles are recommendations. The aggregate does not install
`pi-subagents`, `context-mode`, language servers, or the Worktrunk program.

For the medium profile:

```sh
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

For the large profile, also install context-mode:

```sh
pi install npm:context-mode
```

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
`scout`, and `worker` definitions. Together with the first-party Shape,
`planning-changes`, `implement`, and `developing-changes` skills, these
companions form the portable quality-first coding harness:

```text
/develop -> Shape -> planning-changes -> implement
```

Use `/develop` as the adaptive entry, `/plan` for accepted intent, and
`/implement` for an accepted slice or bounded change. Small fixes skip Shape
but keep the same quality gate. `/work` remains a compatibility alias for
`/implement`; it is not a second method. Implement composes TDD or focused
validation, regular focused and static checks, the final required suite,
fixed-point Spec and Standards review, and same-writer routine repair. After
retained execution, the writer returns its evidence and exclusive lease. The
parent verifies every route. For an approved Shape plan slice, the parent also
applies Shape's closure gate and updates the plan checkbox. A direct bounded
request needs no worker lease return or plan edit. When authorized, the parent
creates one Conventional Commit and pushes it to the existing pull request.

The focused standalone methods cover public-seam TDD, codebase design,
root-cause diagnosis, domain language, and change review. There is no
`engineering-practices` skill. Each package remains independently installable,
but operational delegation, retained writers, and independent review require
the Git aggregate and a separate `pi-subagents` installation. `/develop` blocks
with install instructions when either the Git aggregate or `pi-subagents` is
missing; it does not
silently remove retained implementation or independent review.
`planner`, `context-builder`, and `qa` are repository-owned roles; the other
definitions remain external companion
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
- `qa` uses `openai-codex/gpt-5.6-luna` at `medium` for bounded user-surface
  testing and fix validation. One-shot QA returns evidence without repository
  records; requested, reusable, or comparative QA keeps durable plans and runs.
- `context-builder`, `researcher`, and `worker` use
  `openai-codex/gpt-5.6-sol` at `medium` for normal analysis and implementation.
- `planner` and `reviewer` use Sol at `high` for multi-step decisions and
  independent quality review.
- `oracle` uses Sol at `max` only for the hardest inherited decisions.
- `advisor` and `delegate` inherit the parent model and thinking effort.

The advisor remains on demand. Select a complementary model for one run with:

```text
/run advisor[model=anthropic/<opus-model-id>:high] "Review this direction"
```

Use `pi --list-models` or Pi's `/model` selector to choose an available model
ID. For a persistent user or project choice, add an advisor override to the
applicable Pi settings:

```json
{
  "subagents": {
    "agentOverrides": {
      "advisor": {
        "model": "anthropic/<opus-model-id>",
        "thinking": "high"
      }
    }
  }
}
```

This configuration does not start the advisor automatically.

Before a launch, classify the task:

- Use Luna for targeted discovery, mechanical documentation or metadata
  changes, inventories, known test-output summaries, and narrow, repeatable,
  low-risk edits with focused deterministic checks.
- Use `qa` for bounded user-surface testing of websites, CLIs, and other
  software. One-shot QA returns concise evidence and artifact paths without
  adding `docs/qa/` files. When records are requested, reusable, or needed for
  historical comparison, it keeps plans in `docs/qa/plans/` and comparable run
  evidence in `docs/qa/runs/`. Later runs reuse the applicable plans and latest
  compatible evidence instead of repeating unchanged discovery. It uses an
  existing Playwright setup or `playwright-cli` when available.
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

Start with one agent. Tiny direct edits stay with the parent only when they are
sequential, low-risk, locally understandable, and cheap to validate. Behavioral
code must show an intended failing test and minimum passing implementation at a
public seam. Refactors, documentation, metadata, and mechanical changes use
focused evidence instead of manufactured tests. Practical engineering guidance
requires concrete evidence about reuse, shared policy, cohesion, public
contracts, volatile boundaries, interface depth, failures, and cleanup; it does
not use principle names as findings.

Noisy or multi-step implementation uses one fresh retained Sol writer. Implement
selects the direct or retained executor before that executor diagnoses a bug.
Routine review, test, or QA defects return to the same retained writer, while
formal review always uses fresh context. QA is bounded public-surface evidence
and never replaces review. The parent keeps decisions, synthesis, final diff
inspection, and final verification. Start another subagent only for a bounded specialist lane or when
one agent is measurably struggling. Parallelize independent read-only work such
as codebase exploration, separate failure hypotheses, and correctness,
security, or test-gap review. Start with one child and use no more than three
parallel children unless distinct evidence justifies more. Keep one writer per
worktree through an exclusive active writer lease and transfer it explicitly;
the parent and retained writer never edit concurrently. Use isolated worktrees
for truly independent write lanes.

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
package agent. Pinned OpenAI defaults require OpenAI Codex authentication unless
the caller supplies another model when launching the agent. The unpinned
advisor follows the parent model or its configured override.

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

## Publish packages

Release Please creates package tags and GitHub Releases. It does not publish to
npm. Do not advertise an npm version until a maintainer completes this checklist:

1. Review the generated version and changelog for each package.
2. Run `npm run check` from the clean release commit.
3. Inspect each artifact with `npm pack --dry-run --workspace <package>`.
4. Publish each intended public package with
   `npm publish --access public --workspace <package>`.
5. Confirm the exact version with `npm view <package>@<version> version`.
6. Install that exact version in an isolated Pi environment and confirm that its
   extensions, skills, and prompts load.

Never publish the private root aggregate.

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
