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
and subagent extensions plus explicit subagent prompts without loading the
subagent dependency's broad orchestration skill.
It exposes six fixed package agents: a Sol-low Worker, Terra-medium Git writer,
Luna-low Researcher, Luna-medium QA verification and Utility read-only support,
and an Opus-high Reviewer. The private mapping is Worker = implementation writer
capability; Researcher = factual research capability; Utility = mechanical
support capability; QA = QA capability; Reviewer = review capability; and Git =
Git delivery capability. Support returns evidence only.

The human manually selects GPT-5.6 Sol at `xhigh` before Shape and planning;
installation does not set or overwrite a global parent default. Non-trivial
implementation uses the configured Worker. `/just-do-it`, one obvious trivial
correction, and an unavailable-implementation-writer fallback are direct-parent
exceptions; the unavailable route is an honest fallback and is reported.
Independent read-only lanes need named disjoint evidence gaps plus a
critical-path or parent-context benefit and are joined before decisions. Ordinary
children do not fan out. Accepted `parallel-ready` implementation lanes may run
concurrently only in separate isolated worktrees with sole writers,
non-overlapping ownership, complete dependencies, and named integration points.

Implementation keeps focused repair loops in Worker and selects QA and formal
review by risk. Mechanical, documentation, and reversible metadata work has
direct focused evidence. Material public behavior, lifecycle, state,
concurrency, provider, dependency, cross-boundary, security, migration, or
irreversible work has proportionate independent evidence. Deterministic green
commands do not select QA. QA and Reviewer are distinct and run concurrently
only on one frozen boundary when both are selected. QA owns executable gates,
and Reviewer does not rerun them. The parent joins their repair packet before the
retained Worker repairs it without a replacement. Git delivery uses installed
methods and is not an implementation substitute.

The private profile maps optional planning advice to `AskClaude` only under a
non-`claude-bridge` parent with Claude Code authentication, available provider
access, and permitted source disclosure. Calls use `mode: "read"` and
`isolated: true`: `claude-fable-5` at `medium` provides intent, taste, and
planning perspective, while `claude-opus-5` at `high` provides only a distinct
rigorous challenge. The two profiles do not receive the same question, and the
Opus challenge does not duplicate the formal Opus Reviewer. It consumes the one
independent-review budget; an applicable mandatory Go specification review takes
precedence, so that review replaces the Opus planning challenge. Advice is
evidence only. The parent retains architecture, synthesis, approval, and
verification. When authentication, provider access, disclosure permission, or
the tool is unavailable, the direct parent continues and reports the missing
advice. Parent settings and adviser selection remain user settings, so
installation never overwrites Pi authentication, preferences, or bridge
configuration.

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

The `/implement`, `/review-change`, and `/improve` entries use evidence-based
TypeScript routing: `typescript` for substantial TypeScript or TSX;
`typescript-library` for reusable package exports, declarations, ESM boundaries,
public types, dependency-type exposure, or compatibility promises;
`typescript-testing` for TypeScript runtime, boundary, type-level, or asynchronous
test work; `typescript-review` for fixed-diff review; and `typescript-modernize`
for legacy cleanup or migration. Target-repository rules remain first, and
unrelated toolchain evidence alone does not activate a method. Worker preloads
implementation methods, while Reviewer preloads all five. An unavailable companion
is recorded and uses bounded direct-parent target-repository TypeScript standards
without claiming it loaded.

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
