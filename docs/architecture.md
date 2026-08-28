# Architecture

## Package boundaries

The root package is private and provides David's complete compatible personal
Pi profile, documented in the root README. It loads every compatible local
production extension and every skill exactly once from its package directory,
including the Apache-2.0 Grafana skills package. `pi-lsp` remains independently
installable but optional because Pi rejects its `write` and `edit` tool-name
conflicts with Hashline. The root validator keeps that exact exception
reasoned and rot-guarded. It pins `@playwright/cli`, `pi-claude-bridge`, and
`pi-subagents` as external production dependencies. It loads the Claude bridge
and composes the unchanged subagent factory through the local
`pi-herdr-subagents` extension. Explicit upstream prompts remain selected without
loading the dependency's broad orchestration skill.

`pi-herdr-subagents` is a narrow observation and terminal adapter.
`pi-subagents` remains the sole launch, status, persistence, control, resume,
completion, and process-terminal authority. The adapter consumes versioned
event-bus RPC, exported control surfaces, and documented lifecycle artifacts. It
owns only mode-0600 viewer descriptors, a session-scoped loopback keyboard
bridge, and exact raw Herdr panes. Variable data enters Herdr through structured
environment arguments; pane shell text is one fixed non-secret command. Reload
adopts same-process owned bindings, and final shutdown closes only exact owned
panes. Missing Herdr or Herdr older than 0.7.5 disables only the adapter.

It exposes six fixed package agents: Terra-medium Worker and Git writers,
Luna-low Researcher, Luna-medium QA verification and Utility read-only support,
and an Opus-medium Reviewer. Implementation keeps focused repair loops in Worker
and selects QA and formal review by risk. Mechanical, documentation, and
reversible metadata work has direct focused evidence. Material public behavior,
lifecycle, state, concurrency, provider, dependency, cross-boundary, security,
migration, or irreversible work has proportionate independent evidence. Exact
non-browser green-path commands run without model QA. When both QA and formal
review are required, they receive the same frozen diff and run concurrently when
supported; QA owns executable gates and Reviewer does not rerun them. The parent
joins results before one retained-Worker repair packet. The human selects
a Fable or Sol parent; parent settings and AskClaude selection remain user
settings, so installation never overwrites
Pi authentication, preferences, or bridge configuration. AskClaude is available
only to a non-claude-bridge parent; a Fable parent uses the Opus Reviewer when
risk selects formal review. A Sol child requires a justified `question` and explicit human
approval, with no automatic fallback.

Shape and planning use an evidence-based Go gate: proposed Go source, modules,
CLIs, or Go-specific guidance or routing require one fixed-document Go
specification review before approval; unrelated `go.mod` or toolchain evidence
does not. Templates retain Review evidence for every document, with `not
applicable` for non-Go work. Reviewer has separate fixed-document specification
and fixed-diff code modes, while standalone packages resolve companions by name
and honestly use a bounded direct-parent target-repository standards fallback
when unavailable.

Engineering direct entries use the same evidence-based routing for Go source,
modules, Go CLIs, and Go-specific work: resolve `go`, and resolve `cobra-viper`
only for commands, flags, or CLI configuration. Toolchain evidence alone does
not activate either. Worker preloads both skills despite its fresh profile.
Fixed-diff Go review applies target-repository instructions and module contracts,
installed Go and applicable Cobra/Viper standards, then `references/go.md`;
findings need practical consequences and must not duplicate current tool output.

Each directory under `packages/` is an independent npm package with its own Pi
manifest, runtime dependencies, documentation, tests, and optional native
helper. Production resources install into unrelated target repositories and
must use the target repository's instructions and vocabulary; they cannot assume this monorepo's
paths, packages, agents, tools, skills, extensions, commands, or
development-only resources are present. Independent packages do not
automatically provide companion extensions or agents.

A package must not depend on undeclared modules or on another workspace by accident. Pi-provided packages belong in `peerDependencies` when imported; third-party modules needed while a package resource runs belong in `dependencies`; development-only tools belong in `devDependencies`. Markdown-only skill packages need no Pi runtime peer. Root tooling does not become available when Pi installs a package with production dependencies only.

## Runtime model

Pi loads extension TypeScript, Agent Skills, and prompt templates directly.
Extension packages therefore publish reviewed TypeScript source rather than a
generated build directory, while Markdown-only skill or prompt packages publish
their resources without fake extension scaffolding. Package manifests identify
resources under `pi.extensions`, `pi.skills`, and `pi.prompts`. The private root
profile uses explicit paths so its active surface stays auditable.

Extension factories perform registration and bounded initialization only. Long-lived processes, sockets, watchers, and timers start from `session_start` or from the command or tool that needs them. Every session-scoped resource has idempotent cleanup in `session_shutdown`.

Extensions must remain correct in TUI, RPC, JSON, and print modes:

- Guard terminal-only components with `ctx.mode === "tui"`.
- Guard dialogs and notifications with `ctx.hasUI` where required.
- Never write protocol data or diagnostics directly to standard output.
- Propagate `AbortSignal` to nested model, network, process, and file operations.
- Truncate custom tool output using Pi's exported limits and truncation helpers.
- Restore branch-aware state from session entries or tool-result details on `session_start`.

## TypeScript

The repository's minimum runtime is Node `22.20.0`, a Jod LTS release, with ES2022 and Node16 module semantics. `.nvmrc` selects Node `24.18.0` for routine development, while CI also exercises the minimum runtime. The `@types/node` minor line tracks that minimum so type checking cannot silently admit APIs unavailable to supported users. Strict compiler options and type-aware ESLint rules apply to production, tests, fixtures, and tooling. Library declaration checking alone is skipped because the current host's transitive declarations contain unresolved optional types; repository source is never skipped.

Prettier owns formatting. ESLint owns correctness, maintainability, dependency boundaries, promise safety, and protocol-specific restrictions. Knip detects unused files, exports, and dependencies.

## Root development tooling

The private root launcher activates the declared Node and Go selectors, records
a setup fingerprint for the selectors and lockfile, and reuses matching setup.
The root check runner executes independent required commands with a configurable
bounded concurrency (default three), buffers output in command order, reports
all failures, and cancels child processes on interruption. It never invokes the
composite check command recursively. Final evidence records the exact tested
tree, base `HEAD`, approved path set, command definitions, and setup fingerprint;
publication reuses it only while every value remains unchanged.

## Go

An extension may add `packages/<name>/go/go.mod` when it needs a Go helper. Each helper remains an independent module and is tested with `GOWORK=off`, so it works outside this checkout. A root `go.mod` or `go.work` is intentionally absent until real shared Go code justifies it.

The Go runner discovers every nested `go.mod`, verifies module tidiness and integrity, applies the shared golangci-lint configuration, runs race-enabled shuffled tests, enforces 80% total coverage, and runs govulncheck.

Shipping native binaries is an extension-specific design decision. Prebuilt platform packages, install-time compilation, and download-on-first-use have different security and portability tradeoffs and require explicit review.

## Release model

Release Please tracks each package independently in manifest mode. It groups pending package bumps into one reviewable Release PR, but each package retains its own version and receives its own `pi-<name>-v<version>` tag and GitHub Release when that PR is merged. The `node-workspace` plugin updates the root lockfile while leaving versions unlinked. GitHub Releases do not currently publish packages to npm.

Release attribution follows changed package paths and preserved Conventional Commits. Rebase-only merges retain every validated commit, so a pull request can make a breaking change to one package and a patch change to another without collapsing their semantic types or file ownership. Breaking changes bump major versions, `feat` bumps minor versions, and visible non-feature types (`fix`, `perf`, `docs`, `chore`, `refactor`, `revert`, `build`, and `deps`) bump patch versions. Root-only changes do not bump package versions.

Once registered, package changelogs are generator-owned release artifacts. Release Please's Markdown renderer does not follow this repository's Prettier and markdownlint styles, so those tools narrowly exclude `packages/*/CHANGELOG.md`; all other Markdown remains checked. Release PR review verifies the generated notes semantically instead of reformatting content that the next automation update would replace.

## Verification layers

1. Manifest validation checks package structure, release metadata, dependency placement, Pi extensions/skills/prompts, the exact root profile, and npm pack contents.
2. Unit and integration tests exercise extension logic and skill contracts deterministically.
3. Source smoke tests load each package with the real Pi CLI.
4. Packed smoke tests install the exact npm artifact with production dependencies and repeat Pi loading.
5. RPC smoke tests verify extension lifecycle behavior and skill command discovery in an isolated environment.

Pi lifecycle subprocesses do not send a model prompt, use user settings, persist sessions, expose credentials, or permit network access. Packed-artifact setup may contact the public npm registry to install runtime dependencies, but it runs with an isolated home and no ambient credentials, proxy settings, or npm configuration.
