# Pi extensions

This repository contains independently installable extensions and skills for
the [Pi coding agent](https://github.com/earendil-works/pi). The private root
package is David's complete compatible personal Pi profile: it loads every
local production extension and skill except optional `pi-lsp`.

> [!WARNING]
> Pi extensions run with your user permissions. Skills can direct an agent to
> run commands. Read the source before installing an untrusted package.

## Personal profile

Install David's complete repository profile:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

It loads:

- Pi's native tools and native compaction;
- [`pi-hashline`](packages/hashline/README.md), which augments `read` with
  anchored `[PATH#TAG]` headers, replaces `edit` syntax with fail-closed
  Hashline patches, and keeps `write` for new files and whole-file replacement;
- [`playwright_browser`](packages/playwright-cleanup/README.md), a session-owned
  browser tool backed by the pinned Playwright CLI;
- the [`question`](packages/question/README.md) extension;
- the [`status-line`](packages/status-line/README.md) Powerlevel10k-style prompt;
- the [`todo`](packages/todo/README.md) extension for parent progress visibility;
- the [`web-search`](packages/web-search/README.md) extension for provider-backed web research;
- the `pi-frontend-developer` extension, with its `image_generation` tool; eight
  focused skills—`design-documentation`, `frontend-design`,
  `frontend-development`, `image-generation`, `interface-craft`,
  `interface-design`, `react-interface`, and `visual-validation`; `/design` for
  routing frontend interface requests; and
  `/generate-image`, which requires explicit human consent before provider
  privacy exposure, separately billed cost, or credential use;
- the [`worktrunk`](packages/worktrunk/README.md) extension and skill for isolated worktrees;
- `pi-simple-english`, including its pragmatic ASD-STE100 writing guidance;
- complete `pi-go` skills for Go programming and delivery;
- [`pi-grafana-skills`](packages/grafana-skills/README.md), which redistributes
  Grafana's official `grafana-oss`, `dashboarding`, and `promql` skills;
- `commit` and `git-rebase-base` for safe Git delivery and local stack topology;
- `github-cli`, `open-pr`, and `triage` for repository-aware GitHub operations, approved pull-request delivery, and review-feedback processing;
- pinned [`pi-claude-bridge`](https://github.com/elidickinson/pi-claude-bridge) `0.7.0`, using Claude Code subscription quota as a Pi provider;
- pinned [`pi-subagents`](https://github.com/nicobailon/pi-subagents) `0.50.0`, including its extension and prompt templates;
- `/shape` for an accepted pitch;
- `/plan` for ordered vertical slices;
- complete [Engineering](packages/engineering/README.md) skills and prompts,
  including `/just-do-it`, `/implement`, `/debug`, `/improve`, code review,
  TDD, and design;
- complete [Productivity](packages/productivity/README.md) skills and prompts,
  including `writing-for-agents`, `/wait-what`, and `/ask-david` for
  recommendation-first routing through the public Pi package suite, followed by
  source-backed usage help in a transparent David-flavoured voice.

For Go-targeted Shape pitches and plans, the parent requires one fixed-document
Go specification review before approval. The evidence-based trigger covers Go
source, modules, CLIs, and Go-specific guidance or routing, not an unrelated
`go.mod` or toolchain gate; non-Go documents record `not applicable` review
evidence. The configured Reviewer keeps separate fixed-document Go
specification and fixed-diff code modes.

Engineering routes Go source, modules, Go CLIs, and Go-specific work through
installed `go`, adding `cobra-viper` only for commands, flags, or CLI
configuration; toolchain evidence alone does not activate either. Worker
preloads both skills. Fixed-diff Go review applies target-repository instructions
and module contracts before installed Go standards and `references/go.md`, and
reports only practical findings that do not duplicate current tool output.

The configured Git agent composes the focused Git and GitHub skills. Given a
worktree, branch, authority, intent, and evidence, it derives atomic units and
messages, stages, commits, pushes, and creates or updates the pull request. It
returns after bounded structured verification; it does not watch CI or run
long-lived commands.

The lifecycle is parent-led and routes work by impact and uncertainty.
`/just-do-it` keeps an explicit mechanical low-risk request with the direct
parent by default and uses one Worker only when broad repetition saves critical
path time or parent context. Clear bounded work implements now; coordinated
clear work plans first; uncertain, hard-to-reverse, or risky work Shapes then plans.
Shape and planning set up or verify an isolated linked task worktree before repository
reads, discovery, research, or questions. Complete accepted plans execute in
dependency order, with only planned independent lanes using separate worktrees
and sole writers. A coherent delivery unit normally keeps its atomic commits in
one branch and pull request; a stack needs independent value and check viability
at each position. No lifecycle stage works in the main-branch checkout.

The human selects a Fable or Sol parent for Shape and planning; installation
does not overwrite parent settings. The fixed child catalog is:

| Agent        | Model         | Thinking | Role and tools                                          |
| ------------ | ------------- | -------- | ------------------------------------------------------- |
| `worker`     | GPT-5.6 Terra | medium   | sole implementation writer                              |
| `researcher` | GPT-5.6 Luna  | low      | bounded read-only repository or primary-source research |
| `qa`         | GPT-5.6 Luna  | medium   | read-only gate verification and acceptance evidence     |
| `reviewer`   | Opus 5        | medium   | formal read-only code review and design review          |
| `git`        | GPT-5.6 Terra | medium   | authorized Git delivery and conflict repair             |
| `utility`    | GPT-5.6 Luna  | medium   | bounded read-only or mechanical support                 |

Implementation selects assurance by risk. Mechanical, documentation, and
reversible metadata work uses direct focused verification and parent diff
inspection. Exact green-path non-browser commands run deterministically without
a model QA launch. Material behavior, lifecycle, state, concurrency, provider,
dependency, cross-boundary, security, migration, or irreversible work selects
the applicable QA and formal review lanes. When both lanes are required, the
parent freezes one diff, gives QA and Reviewer its identifier, and launches the
read-only lanes concurrently when the host supports it. QA owns named executable
gates; Reviewer does not rerun them. The parent joins findings into one repair
packet before a retained Worker repair.

Every child starts with fresh context and has no model fallback. Shape and
planning remain the selected Fable or Sol parent's responsibility for product
and architecture judgment, approval, slice design, and synthesis. They may use
at most one bounded Researcher handoff after worktree setup. A Worker failure,
a concrete hard constraint, or a possible Sol child requires a justified
`question` and explicit human approval before Sol; difficulty never routes to Sol
automatically. Ambiguous routing also uses `question`.

Claude Code and OpenAI Codex must already be signed in. For a Fable parent, set
your existing `~/.pi/agent/settings.json` parent settings, for example:

```json
{
  "defaultProvider": "claude-bridge",
  "defaultModel": "claude-fable-5",
  "defaultThinkingLevel": "medium"
}
```

A Sol parent is a human choice, not an installed default. Configure the bridge
in `~/.pi/agent/claude-bridge.json` only when you use it:

```json
{
  "askClaude": {
    "enabled": true,
    "defaultMode": "read",
    "defaultIsolated": true,
    "allowFullMode": false
  }
}
```

AskClaude is available only to a non-claude-bridge parent; a Fable parent cannot
call it. Use the fixed Opus Reviewer when risk selects formal review.

Hide pi-subagents built-ins in the pinned pi-subagents **Pi settings** object
at `~/.pi/agent/settings.json` (not its extension config file):

```json
{
  "subagents": {
    "disableBuiltins": true
  }
}
```

A `subagents.defaultModel` is unnecessary: pinned pi-subagents gives each
explicit agent frontmatter model precedence. Do not use a per-run model
override unless the human explicitly approves that exception. Keep these
bounded extension controls in
`~/.pi/agent/extensions/subagent/config.json`:

```json
{
  "toolDescriptionMode": "compact",
  "asyncByDefault": false,
  "maxSubagentDepth": 1,
  "parallel": {
    "maxTasks": 4,
    "concurrency": 3
  },
  "scheduledRuns": {
    "enabled": false
  }
}
```

We evaluated
[`pi-subagents-lite`](https://github.com/AlexParamonov/pi-subagents-lite) for
this workflow. Its smaller parent tool schema may reduce orchestration context,
but replacing the pinned runtime now would remove contracts used by this
profile: retained-Worker resume, structured usage telemetry, acceptance gates,
and the status RPC consumed by the status line. Those capabilities support
progress-bounded repair and concurrent read-only assurance. Keep the current
runtime and measure representative end-to-end runs before considering a
smaller tool description; schema size alone does not reduce implementation,
repair, or repository-check work.

Pinned `pi-subagents` 0.50.0 is affected by
[issue #1207](https://github.com/nicobailon/pi-subagents/issues/1207). Remove
`contact_supervisor` from every explicit agent `tools` list. The default bridge
adds `contact_supervisor` at runtime when a supervisor target exists, preserving
coordination without triggering the strict-allowlist regression. Recheck this
workaround when the pinned dependency changes.

Merge settings you intentionally keep. Installation never changes user or
project settings. The root profile loads complete Engineering and Productivity
resources, including `/improve`, code review and design methods, and Git
conflict support. Independent package installs do not automatically provide
companion extensions, agents, or tools; use their documented direct-parent
fallbacks and install requirements.

For Git delivery, use a normal push for unchanged history. Only after a rebase,
verify the expected remote state and use an explicit `--force-with-lease` on the
current safe non-default, non-protected branch; never use plain force.

Update or remove the profile with:

```sh
pi update --extension git:github.com/mopeyjellyfish/pi-extensions
pi remove git:github.com/mopeyjellyfish/pi-extensions
```

## Why the profile is complete

This is David's personal profile, so it deliberately loads every compatible
local production extension and skill. `pi-lsp` remains optional because Pi
hard-fails when it and Hashline both register `write` and `edit`. The root
validator prevents a future compatible local extension or skill from being
omitted silently while keeping prompt entries explicit. Each package remains
independently installable for target repositories that need only a specific
capability.

OpenAI's [GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/latest-model)
also recommends comparing representative workloads when choosing model and
reasoning settings.

### Consolidate an existing user installation

After this profile update is available on the default branch, make it the only
user-installed Pi package:

```sh
pi update --extension git:github.com/mopeyjellyfish/pi-extensions
pi remove npm:context-mode
pi remove npm:pi-claude-bridge
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
- unrelated keys in the `subagents` block in `~/.pi/agent/settings.json`;
  retain `"disableBuiltins": true` while this exact six-agent catalog is
  intended, and remove the whole block only when pi-subagents built-ins should
  return.

The root profile pins the external `pi-claude-bridge`, `pi-subagents`, and
`@playwright/cli` dependencies. Local Grafana skills resolve directly from the
`packages/grafana-skills` workspace package.

`playwright_browser` resolves the profile's local CLI and safely owns and
cleans up each browser session. The Playwright browser binary is downloaded
separately when it is first needed; run
`npx playwright-cli install-browser chromium` from a trusted workspace if it
is not already present. Do not add context-mode, RTK, FFF, or Ponytail as root
dependencies without repeatable task-level evidence. A host-managed integration
that is inactive outside its host, such as Herdr's agent-state bridge, can
remain outside the profile because its installer owns its lifecycle. This
repository does not edit user-level Pi settings.

## Optional packages

Every directory under `packages/` remains independently installable. Add one
when the task needs its capability. `pi-hashline` adapts Hashline from
[Oh My Pi](https://github.com/can1357/oh-my-pi) by Can Bölük under the MIT
license.

| Package                                                          | Add when you need                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`pi-frontend-developer`](packages/frontend-developer/README.md) | Deliberate frontend design, implementation, visual validation, or image evidence. |
| [`pi-engineering`](packages/engineering/README.md)               | Focused TDD, debugging, design, domain, or review skills beyond `implement`.      |
| [`pi-feature-flow`](packages/feature-flow/README.md)             | Shape and planning without the root profile.                                      |
| [`pi-git-conventions`](packages/git-conventions/README.md)       | Git delivery skills without the root profile.                                     |
| [`pi-github`](packages/github/README.md)                         | GitHub CLI workflows without the root profile.                                    |
| [`pi-go`](packages/go/README.md)                                 | Idiomatic Go programming guidance.                                                |
| [`pi-grafana-skills`](packages/grafana-skills/README.md)         | Grafana OSS administration, dashboard authoring, and PromQL guidance.             |
| [`pi-hashline`](packages/hashline/README.md)                     | Anchored reads and fail-closed Hashline edits without the root profile.           |
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
installed separately. The GitHub workflow skills need an authenticated
[GitHub CLI](https://cli.github.com/). Planned stack delivery requires the
`github/gh-stack` CLI extension; install it before use with
`gh extension install github/gh-stack`. The Pi package does not install these
external tools, and `open-pr` stops rather than falling back to ad hoc PR
creation for a planned stack.

To install one package from a checkout:

```sh
git clone https://github.com/mopeyjellyfish/pi-extensions.git
cd pi-extensions
pi install "$(pwd)/packages/lsp"
```

Replace `lsp` with the package directory you need. Pi retains the checkout path,
so keep it in place. Use `-l` for a project-local installation.

## Development

Use the development launcher to activate the declared runtimes and reuse setup
while its lockfile and runtime-selector fingerprint remains unchanged:

```sh
npm run dev
```

For manual commands, use the versions in `.nvmrc` and `.gvmrc`, then install
dependencies:

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
