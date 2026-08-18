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
- [`playwright_browser`](packages/playwright-cleanup/README.md), a session-owned
  browser tool backed by the pinned Playwright CLI;
- the [`question`](packages/question/README.md) extension;
- the [`status-line`](packages/status-line/README.md) Powerlevel10k-style prompt;
- the [`todo`](packages/todo/README.md) extension for parent progress visibility;
- the [`web-search`](packages/web-search/README.md) extension for provider-backed web research;
- the [`worktrunk`](packages/worktrunk/README.md) extension and skill for isolated worktrees;
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
  including `writing-for-agents` and `/wait-what`.

The configured Git agent composes the focused Git and GitHub skills. Given a
worktree, branch, authority, intent, and evidence, it derives atomic units and
messages, stages, commits, pushes, and creates or updates the pull request. It
returns after bounded structured verification; it does not watch CI or run
long-lived commands.

The lifecycle is parent-led and routes work by impact and uncertainty.
`/just-do-it` delegates one explicit mechanical low-risk request after worktree
setup; clear bounded work implements now; coordinated clear work plans first;
and uncertain, hard-to-reverse, or risky work Shapes then plans. Shape and
planning set up or verify an isolated linked task worktree before repository
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

Implementation uses Worker for one vertical slice and focused checks, then QA
for one read-only pass over the exact named repository gates. QA aggregates all
failures before each retained-Worker repair. Worker and QA repeat while failure
signatures, diagnostic counts, or coverage gaps show measurable progress. They
stop on repeated evidence, a non-completed Worker result, or scope variance;
formal review starts only after QA verifies the gates. This keeps broad checks
and coverage out of the Worker's development loop while the parent retains
finalization and acceptance.

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
call it. Use the fixed Opus Reviewer at the formal review boundary instead.

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
conservative extension controls in
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

We evaluated
[`pi-subagents-lite`](https://github.com/AlexParamonov/pi-subagents-lite) for
this workflow. Its smaller parent tool schema may reduce orchestration context,
but replacing the pinned runtime now would remove contracts used by this
profile: retained-Worker resume, structured usage telemetry, acceptance gates,
and the status RPC consumed by the status line. Those capabilities directly
support the progress-bounded Worker ↔ QA verifier flow. Keep the current
runtime and measure representative end-to-end runs before considering a
smaller tool description alone does not reduce Worker discovery, repair, or
repository-check work.

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

The root profile pins `pi-claude-bridge`, `pi-subagents`, and
`@playwright/cli` because their lifecycle behavior was selected explicitly.
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
when the task needs its capability.

| Package                                                          | Add when you need                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`pi-engineering`](packages/engineering/README.md)               | Focused TDD, debugging, design, domain, or review skills beyond `implement`.      |
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
