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
- `/shape` for an accepted pitch;
- `/plan` for ordered vertical slices;
- `/implement` for direct implementation and verification.

The lifecycle is intentionally serial and parent-led:

```text
request -> accepted pitch -> ordered plan -> implement -> verification
```

Large tasks do not automatically become subagent tasks. Use one host-provided
child only for a bounded independent lane whose extra context and token cost are
worth it. Keep one writer, and let the parent inspect the diff and verify all
evidence. This follows OpenAI's current
[Codex subagent guidance](https://developers.openai.com/codex/agent-configuration/subagents),
which recommends care with parallel writes and notes that comparable subagent
runs use more tokens.

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
native behavior and adds only the missing structured question, terminal status,
and lifecycle contracts. Accepted `pitch.md` and `plan.md` files are durable
anchors when a long session compacts.

Treat every extra extension as a measured addition:

1. Start with the baseline on representative complex tasks.
2. Add one extension for a specific observed gap.
3. Compare completion quality, wall time, retries, failures, and total model
   tokens, not only rewritten command output.
4. Remove the extension when the benefit is not repeatable.

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
- the `subagents` settings block in `~/.pi/agent/settings.json` after removing
  `pi-subagents`.

Do not add context-mode, pi-subagents, RTK, FFF, or Ponytail as root
dependencies without repeatable task-level evidence. A host-managed integration
that is inactive outside its host, such as Herdr's agent-state bridge, can
remain outside the profile because its installer owns its lifecycle. This
repository does not edit user-level Pi settings.

## Optional packages

Every directory under `packages/` remains independently installable. Add one
when the task needs its capability.

| Package                                                          | Add when you need                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`pi-engineering`](packages/engineering/README.md)               | Focused TDD, diagnosis, design, domain, or review skills beyond `implement`.      |
| [`pi-feature-flow`](packages/feature-flow/README.md)             | Shape and planning without the root profile.                                      |
| [`pi-git-conventions`](packages/git-conventions/README.md)       | Conventional Commits or safe rebasing.                                            |
| [`pi-github`](packages/github/README.md)                         | Guided GitHub CLI workflows.                                                      |
| [`pi-lsp`](packages/lsp/README.md)                               | Semantic navigation, diagnostics, or refactoring for a supported language server. |
| [`pi-playwright-cleanup`](packages/playwright-cleanup/README.md) | Ownership and cleanup of browser sessions.                                        |
| [`pi-productivity`](packages/productivity/README.md)             | Clearer agent instructions.                                                       |
| [`pi-question`](packages/question/README.md)                     | Structured questions without the root profile.                                    |
| [`pi-simple-english`](packages/simple-english/README.md)         | Pragmatic ASD-STE100 writing guidance.                                            |
| [`pi-status-line`](packages/status-line/README.md)               | Powerlevel10k-style status without the root profile.                              |
| [`pi-todo`](packages/todo/README.md)                             | A small session task list.                                                        |
| [`pi-web-search`](packages/web-search/README.md)                 | Provider-backed web research.                                                     |
| [`pi-worktrunk`](packages/worktrunk/README.md)                   | Worktrunk worktree selection and tool routing.                                    |

The Worktrunk package needs [Worktrunk](https://worktrunk.dev) installed
separately. It is not an official Worktrunk integration.

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
