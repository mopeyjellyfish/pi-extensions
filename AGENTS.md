# Repository guidance

## Scope

This repository contains independently installable Pi extension packages. Keep
changes narrow, preserve package independence, and do not introduce a
production extension as scaffolding for tooling, tests, or skills.

## Communication

Human-facing plans, handoffs, reviews, documentation, and status summaries use pragmatic Simplified Technical English and terms from the nearest `CONTEXT.md`. Preserve exact technical content.

## Production resources run in target repositories

Production extensions, skills, prompts, and agents install into unrelated target
repositories. Use the target repository's instructions and domain vocabulary.
Never assume this monorepo's paths, package names, agents, tools, skills,
extensions, commands, or development-only resources are installed merely
because they exist here. Editing a resource in this checkout does not make it
immediately available to the active Pi process; load the intended package from
the target worktree and reload or restart as required. No production resource
may be specific to this repository.

## Subagent execution profiles

Start with the parent. Use Luna for cheap bounded read-only or mechanical
support not covered by another role, Terra for normal implementation and Git,
and Opus for formal review. A Sol child requires a justified `question` and
explicit human approval; if uncertain, ask. Keep one writer per worktree. Every
child task states its goal, scope, authority, required evidence, success
criteria, validation, and output. The parent synthesizes results, verifies
evidence, inspects the final diff, and runs applicable checks. Use
host-provided role guidance without depending on repository-owned agent names
or tool allowlists.

## Start with repository truth

Before any repository mutation, inspect the current branch, worktree, and dirty
files. Read-only discovery may happen in the initial checkout except during
Shape and planning: those workflows must make task-worktree setup their first
action before repository reads, discovery, research, or questions. All writes,
including pitches, plans, documentation, tests, code, generated metadata, and
formatting, must happen in an isolated linked worktree on a non-main task
branch. Never make changes in the main-branch checkout.

If the session is already rooted in, or Pi is already routed to, the correct
linked worktree, keep using it. Otherwise, use the Worktrunk tool to create or
activate the task worktree before the first write. If safe worktree tooling is
unavailable, stop and ask the human to provide an isolated worktree. Reuse one
task worktree across Shape, planning, and serial implementation. Give each
explicitly parallel writer a separate worktree and sole write ownership.
Preserve unrelated user changes.

Read the nearest sources of truth for the change:

- `package.json` for supported commands and the private root Pi profile;
- `packages/README.md` for the installable-package contract;
- `docs/architecture.md` for runtime, dependency, release, and verification
  boundaries;
- `docs/authoring.md` before adding or materially changing a package;
- the package's own `package.json`, `README.md`, source, and tests.

Confirm behavior against the pinned Pi dependency or Pi's authoritative docs.
Do not rely on remembered APIs when lifecycle, package loading, or tool
contracts may have changed.

## Development environment

Treat repository setup as part of creating or activating a fresh linked
worktree. Ignored dependencies, generated files, and local tool state do not
normally carry across worktrees. Before the first test, build, or generated-file
command, read the repository instructions, select the declared runtimes, run the
declared dependency setup once, and verify the required tool is available. A
setup failure is not behavioral test evidence. Diagnose it separately and do
not rerun an unchanged command.

Use Node from `.nvmrc` and Go from `.gvmrc`:

```sh
nvm use
source "$HOME/.gvm/scripts/gvm"
source .gvmrc
npm ci --ignore-scripts
```

Do not silently change either runtime line. Keep the root lockfile synchronized
when dependency metadata changes.

## Live Pi development

The repository deliberately does not commit a `.pi/settings.json` that loads
`..`. A developer may already have the Git profile installed globally, and
automatic project loading would register the same tools, commands, and skills
twice. Do not add an automatic project package entry for the working copy.

The private root manifest is David's complete compatible personal profile. It
loads all compatible local production extensions and every local skill:
Frontend Developer, Hashline, Playwright-cleanup, Question, Simple English,
Status Line, Todo, Web Search, and Worktrunk extensions; Feature Flow; complete
Engineering and Productivity skills and prompts; Simple English, Git, GitHub,
Worktrunk, Frontend Developer, Go, and Grafana skills; their existing prompt
coverage; and the pinned `pi-claude-bridge` and `pi-subagents` extensions,
subagent prompts, and six model-routed package agents. LSP remains independently
installable, but Pi rejects its `write` and `edit` tool-name conflicts with
Hashline. The Luna QA agent runs bounded read-only final gates and aggregates
failures before retained-Worker repairs. Worker and QA repeat while verification
evidence shows
measurable progress and stop on repeated or out-of-scope failures. The bundled
subagent orchestration skill is intentionally excluded. Pi reevaluates the root
manifest during `/reload`.

Shape and planning require one evidence-based fixed-document Go specification
review before approving a Go-targeted pitch or plan. The trigger is proposed Go
source, module, CLI, or Go-specific guidance or routing, not unrelated `go.mod`
or toolchain evidence. The Reviewer's fixed-document specification mode is
separate from its fixed-diff code-review mode; independently installed packages
attempt named skill resolution and record an honest bounded direct-parent
target-repository standards fallback when a companion is unavailable.

Pi reloads resources from the working directory where that Pi process started.
Activating a worktree through the Worktrunk extension routes file and Bash
tools, but it does not retarget Pi's resource loader. To test changes from a
linked worktree, start a new Pi process inside that worktree, either by entering
it first or by using Worktrunk's `--execute` option.

After `npm ci --ignore-scripts`, use the repository's pinned Pi and suppress
ambient globally or project-installed resources for a deterministic profile
development session:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Replace `.` with `packages/<name>` to load one package. Explicit `-e` package
resources remain available when discovery is disabled, so the session contains
the selected worktree sources without a second installed copy registering the
same tools, commands, or skills.

Review and accept the project-trust prompt only after inspecting the worktree.
When Pi is idle, use `/reload` after editing TypeScript, skills, package
manifests, or root profile paths. Restart Pi instead after changing
dependencies or startup-only CLI flags. A reload is a full lifecycle
transition:

- the old runtime receives `session_shutdown`;
- package manifests and resources are rediscovered from live source;
- the new runtime receives `session_start` with a reload reason.

Factories must remain bounded. Start long-lived resources only in
`session_start` or the command/tool that needs them, and stop them idempotently
in `session_shutdown`. Rebuild branch-aware state after startup, reload,
resume, and fork.

For manual reload acceptance, agents must:

1. Start the deterministic Pi command from the target worktree and confirm the
   expected extension and skills appear without conflict diagnostics.
2. Run the focused automated test before reloading.
3. Enter `/reload` while Pi is idle.
4. Exercise the changed tool, command, event, or skill and confirm the new
   behavior is present without duplicate registrations or stale state.
5. For lifecycle-sensitive changes, confirm tests cover `session_shutdown`
   cleanup and `session_start` reconstruction.
6. Run `npm run smoke:source`, then the required completion checks.

The generic source smoke proves loadability and lifecycle safety in a fresh Pi
process; the manual `/reload` loop is the acceptance proof that the active
development session picked up the edited worktree. Never commit Pi sessions,
package caches, trust state, or other runtime artifacts.

## Feature workflow

1. Identify the owning package and its public Pi behavior.
2. Find the nearest tests and add the smallest behavior-focused failing test
   before implementation when behavior changes.
3. Implement one vertical slice through the package's public factory, command,
   tool, or client surface.
4. Run the focused test and follow the live Pi reload acceptance steps when the
   behavior is interactive or lifecycle-sensitive.
5. Update the package README for user-visible behavior and root docs only when
   the repository-wide workflow changes.
6. Run the required completion checks and inspect the final diff for package
   boundary, release, dependency, and artifact hygiene.

Prefer real integration chains over tests coupled to private helpers. Mock true
process, filesystem, network, or UI boundaries only when necessary. Generic
smoke tests prove loading and lifecycle safety; they do not replace
extension-specific behavior tests.

## Required checks

Before handing off changes, run the focused tests followed by `npm run check`.
Useful focused commands include:

```sh
npm test -- --run path/to/test.ts
npm --workspace @mopeyjellyfish/pi-<name> test
npm run smoke:source
```

Also run `npm run workflows:check` after workflow changes and
`npm run security:check` after dependency or installation changes. Do not claim
a check passed unless it ran against the current worktree after the final edit.

## TypeScript

- Keep the compiler and type-aware ESLint clean without suppressing errors.
- Use explicit package dependencies and type-only imports.
- Keep Pi factories bounded; start and stop resources in session lifecycle
  hooks.
- Respect cancellation, state branching, output truncation, and non-interactive modes.
- Never write production extension output to standard output.
- Test registration, reload cleanup, cancellation, failures, state restoration,
  truncation, and useful non-interactive behavior where applicable.

## Provider-backed tools

Treat Pi's model registry and pinned provider contracts as the source of truth.
Prefer capability checks on `model.api` over model-name allowlists so compatible
new models work when Pi adds them. Use `ctx.model` as the default when behavior
should follow the conversation, and resolve explicit provider/model selections
through `ctx.modelRegistry.find()` without silently falling back to another
model or provider.

Read project-local provider configuration only when `ctx.isProjectTrusted()` is
true. Resolve it relative to `ctx.cwd`, which is also what makes configuration
worktree-specific when Pi starts inside a linked worktree. Configuration files
may select a model and a provider-neutral thinking level only; credentials
remain in Pi's auth storage and must never be written to a repository file.

Obtain request authentication with `ctx.modelRegistry.getApiKeyAndHeaders()`.
Preserve model and registry headers case-insensitively, then add only the
provider-native headers the selected API requires. Provider transports must:

- pass Pi's abort signal through fetch and streaming reads;
- surface bounded provider errors without leaking credentials;
- parse streaming data defensively and tolerate unknown event fields;
- treat result text, titles, and URLs as untrusted external input;
- deduplicate and validate sources before rendering them;
- bound both streaming updates and final output to Pi's tool limits.

Keep the Pi tool schema provider-neutral unless a control has portable meaning
across every supported API. A provider-backed tool that makes another request
with the current or configured model must preserve the selected execution
profile: use an explicit tool-specific thinking-level override when configured,
otherwise use `pi.getThinkingLevel()`, then map or clamp it through the target
model's metadata. Never force a lower reasoning level or response verbosity
merely to reduce search cost. Keep cost and latency tradeoffs under the user's
Pi model and thinking selection.

Use documented research-capable provider limits rather than lookup-only limits
for tools advertised for research. Bound transport errors, updates, retries,
and rendered output without starving the model's reasoning or provider-tool
loop. Continue resumable provider stop states such as Anthropic `pause_turn`
with the original content and a strict continuation bound. Reserve final-output
budget for citations so a long answer cannot truncate every source.

Treat versioned provider tools as behavior contracts, not date upgrades. Before
adopting a newer tool version, verify its default caller, compatibility, cost,
and streaming semantics against every supported model family; do not infer
support from model names alone.

Mock the provider network boundary in automated tests. Cover API-key and OAuth
paths when both are supported, completed and incremental citation events,
invalid configuration before fetch, cancellation, provider errors, and output
truncation. Real-provider acceptance uses the developer's existing Pi auth and
must never print, fixture, or commit credentials or responses containing them.

## Go

- Each extension owns an independent module under its package.
- Do not add a root Go module or workspace without an approved shared-code need.
- Keep `GOWORK=off` checks, race tests, module integrity, vulnerability checks, formatting, and coverage green.
- Use specific, explained `nolint` directives only when unavoidable.

## Repository hygiene

Every direct child of `packages/` is production and must remain independently
installable. A new package needs its manifest, tests, README, changelog,
license, and matching entries in `release-please-config.json` and
`.release-please-manifest.json`. Keep each existing production package
synchronized across those three release/version sources.

Use Conventional Commits for every commit and pull request title. Scope
package-owned changes so Release Please can attribute them, and preserve
validated commits with rebase-only merges. Root-only changes do not release a
package; package-local features, fixes, docs, dependencies, and chores do.

Release Please owns package changelog updates after a package is registered.
Its generated Markdown intentionally remains outside Prettier and markdownlint
because rewriting it in a release branch would be overwritten by the next
automation update. Review generated release notes for accuracy, but do not
hand-format them or weaken repository-wide Markdown rules to accommodate them.

Do not stage or commit credentials, local absolute paths, environment files,
generated artifacts, package archives, coverage, sessions, trust state, or
delegated-agent runtime files. GitHub Actions use least privilege and immutable
full-SHA action pins.

Keep the dependency release-age gate and low-frequency grouped update policy
intact. Routine major upgrades are manual. A security-driven age-gate exception
requires explicit review and pull-request documentation.
