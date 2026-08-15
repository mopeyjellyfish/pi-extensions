# Pi extensions

This repository contains independently installable extensions and skills for
the [Pi coding agent](https://github.com/earendil-works/pi). The private root
package is deliberately small; it is a recommended coding profile, not an
install-everything aggregate.

> [!WARNING]
> Pi extensions run with your user permissions. Skills can direct an agent to
> run commands. Read the source before installing an untrusted package.

## Recommended baseline

Install the repository profile:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

It loads only:

- Pi's native tools and native compaction;
- the [`question`](packages/question/README.md) extension;
- the [`status-line`](packages/status-line/README.md) Powerlevel10k-style prompt;
- the [`todo`](packages/todo/README.md) extension for parent progress visibility;
- the [`web-search`](packages/web-search/README.md) extension for provider-backed web research;
- the [`worktrunk`](packages/worktrunk/README.md) extension and skill for isolated worktrees;
- `conventional-commit` and `git-rebase-base` for safe Git delivery and stacked pull requests;
- `github-cli` for repository-aware pull request, review, Actions, issue, and release workflows;
- pinned [`pi-subagents`](https://github.com/nicobailon/pi-subagents) `0.50.0`, including its extension and prompt templates;
- `/shape` for an accepted pitch;
- `/plan` for ordered vertical slices;
- `/implement` for model-routed implementation and verification.

The lifecycle is intentionally serial and parent-led, with these execution
profiles:

| Stage          | Model       | Thinking | Context                                  |
| -------------- | ----------- | -------- | ---------------------------------------- |
| Shape and Plan | Fable 5     | medium   | parent session                           |
| Work           | GPT-5.6 Sol | medium   | fresh child for each accepted slice      |
| Review         | Fable 5     | high     | fresh read-only child when review starts |

Set the parent model in `~/.pi/agent/settings.json` so `/shape` and `/plan` use
Fable at medium effort:

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-fable-5",
  "defaultThinkingLevel": "medium"
}
```

Merge these keys with settings you intentionally keep. The installed
`sol-worker` and `fable-reviewer` profiles pin their own child models and
thinking levels, with no fallback model. Both child stages start with fresh
context. Both providers must already be signed in to Pi. The Git package does
not edit user settings.

Large tasks do not automatically become parallel subagent tasks. The root
profile starts one foreground `sol-worker` for each accepted slice. Add another
only for distinct `parallel-ready` work that the human approves, use no more
than three in parallel unless the evidence justifies it, and keep one writer per
worktree. Let the parent inspect the diff and verify all evidence. This follows OpenAI's current
[Codex subagent guidance](https://developers.openai.com/codex/agent-configuration/subagents),
which recommends care with parallel writes and notes that comparable subagent
runs use more tokens.

The aggregate does not load the broad bundled `pi-subagents` orchestration skill.
The focused Shape, planning, and implement skills own the lifecycle. The root
package also installs the two narrow model-routed agents. The extension and its
explicit prompt templates remain available.

Use this conservative user configuration in
`~/.pi/agent/extensions/subagent/config.json`:

```json
{
  "toolDescriptionMode": "compact",
  "asyncByDefault": false,
  "maxSubagentDepth": 1,
  "parallel": {
    "maxTasks": 3,
    "concurrency": 2
  },
  "scheduledRuns": {
    "enabled": false
  }
}
```

Merge these keys with any settings you intentionally keep. The Git package does
not overwrite user configuration during installation. Restart Pi after changing
this file.

Update or remove the profile with:

```sh
pi update --extension git:github.com/mopeyjellyfish/pi-extensions
pi remove git:github.com/mopeyjellyfish/pi-extensions
```

## Why the default is small

Tool-output counters are not end-to-end quality or token measurements. A
rewriter can report fewer shell-output tokens while the complete task uses the
same or more model tokens. Context replacement can also remove detail needed by
complex work. The available local and comparative evidence did not show a
stable task-level advantage from making RTK, FFF, or context-mode part of every
session.

Pi already provides file, search, shell, editing, session, and compaction
behavior. Skills are discovered progressively. The baseline therefore keeps
native behavior and adds the missing structured question, terminal status, web
research, worktree routing, delivery guidance, and lifecycle contracts. Accepted
`pitch.md` and `plan.md` files are durable anchors when a long session compacts.

Treat every extra extension as a measured addition:

1. Start with the baseline on representative complex tasks.
2. Add one extension for a specific observed gap.
3. Compare completion quality, wall time, retries, failures, and total model
   tokens, not only rewritten command output.
4. Remove the extension when the benefit is not repeatable.

Use the small [Pi profile A/B evaluation](docs/evaluations/pi-profile-ab.md)
before adding deferred-tool loading, custom compaction, or another always-on
extension.

OpenAI's [GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/latest-model)
also recommends comparing representative workloads when choosing model and
reasoning settings.

### Consolidate an existing user installation

After this profile update is available on the default branch, make it the only
user-installed Pi package:

```sh
pi update --extension git:github.com/mopeyjellyfish/pi-extensions
pi remove npm:context-mode
pi remove npm:pi-subagents
pi list --no-approve
```

The final list should contain only
`git:github.com/mopeyjellyfish/pi-extensions`. Pi's package commands do not
remove resources installed outside that package list. Inspect the standard user
configuration and remove these remaining baseline overrides when present:

- the `context-mode` server in `~/.pi/agent/mcp.json`;
- `~/.pi/agent/extensions/rtk.ts`, while retaining the RTK binary if explicit
  use is still useful;
- unrelated keys in `~/.pi/agent/extensions/subagent/config.json`; retain the
  conservative profile above unless a measured task needs different behavior;
- the `subagents` settings block in `~/.pi/agent/settings.json` when model,
  agent, extension, builtin, and watchdog overrides are no longer intended.

The root profile pins `pi-subagents` because its Pi 0.84 lifecycle, process
cleanup, worktree recovery, and model support were selected explicitly. Do not
add context-mode, RTK, FFF, or Ponytail as root dependencies without repeatable
task-level evidence. A host-managed integration that is inactive outside its host, such as Herdr's agent-state bridge, can
remain outside the profile because its installer owns its lifecycle. This
repository does not edit user-level Pi settings.

## Optional packages

Every directory under `packages/` remains independently installable. Add one
when the task needs its capability.

| Package                                                          | Add when you need                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`pi-engineering`](packages/engineering/README.md)               | Focused TDD, diagnosis, design, domain, or review skills beyond `implement`.      |
| [`pi-feature-flow`](packages/feature-flow/README.md)             | Shape and planning without the root profile.                                      |
| [`pi-git-conventions`](packages/git-conventions/README.md)       | Git delivery skills without the root profile.                                     |
| [`pi-github`](packages/github/README.md)                         | GitHub CLI workflows without the root profile.                                    |
| [`pi-lsp`](packages/lsp/README.md)                               | Semantic navigation, diagnostics, or refactoring for a supported language server. |
| [`pi-playwright-cleanup`](packages/playwright-cleanup/README.md) | Ownership and cleanup of browser sessions.                                        |
| [`pi-productivity`](packages/productivity/README.md)             | Clearer agent instructions.                                                       |
| [`pi-question`](packages/question/README.md)                     | Structured questions without the root profile.                                    |
| [`pi-simple-english`](packages/simple-english/README.md)         | Pragmatic ASD-STE100 writing guidance.                                            |
| [`pi-status-line`](packages/status-line/README.md)               | Powerlevel10k-style status without the root profile.                              |
| [`pi-todo`](packages/todo/README.md)                             | A small session task list.                                                        |
| [`pi-web-search`](packages/web-search/README.md)                 | Provider-backed web research without the root profile.                            |
| [`pi-worktrunk`](packages/worktrunk/README.md)                   | Worktree routing without the root profile.                                        |

The enabled Worktrunk resources need [Worktrunk](https://worktrunk.dev)
installed separately. The GitHub workflow skill needs an authenticated
[GitHub CLI](https://cli.github.com/), and stacked pull requests additionally
need the optional `github/gh-stack` CLI extension. The Pi package does not
install these external tools.

To install one package from a checkout:

```sh
git clone https://github.com/mopeyjellyfish/pi-extensions.git
cd pi-extensions
pi install "$(pwd)/packages/lsp"
```

Replace `lsp` with the package directory you need. Pi retains the checkout path,
so keep it in place. Use `-l` for a project-local installation.

## Development

Use the versions in `.nvmrc` and `.gvmrc`, then install dependencies:

```sh
nvm use
source "$HOME/.gvm/scripts/gvm"
source .gvmrc
npm ci --ignore-scripts
```

Run the full check before opening a pull request:

```sh
npm run check
```

Start a deterministic Pi session for the minimal root profile with:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Use `-e packages/<name>` instead to load one independent package. Run `/reload`
while Pi is idle after changing TypeScript, skills, prompts, or manifests.
Restart after dependency or startup-option changes.

## Repository layout and release

Each direct child of `packages/` is a production package with its own manifest,
README, changelog, license, resources, and tests. The private root profile is
never published.

Release Please creates package tags and GitHub Releases. It does not publish to
npm. Read the [package contract](packages/README.md),
[authoring guide](docs/authoring.md), [architecture guide](docs/architecture.md),
and [contribution guide](CONTRIBUTING.md) before changing a package or release.

## License

[MIT](LICENSE)
