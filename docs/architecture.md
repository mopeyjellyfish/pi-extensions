# Architecture

## Package boundaries

The root package is private and exists only for shared development tooling and aggregate source loading, including the repository-wide Git install documented in the root README. It may deliberately include an external Pi package for that aggregate install, but must declare the package as a production dependency and reference its resources explicitly. Each directory under `packages/` is an independent npm package with its own Pi manifest, runtime dependencies, documentation, tests, and optional native helper.

A package must not depend on undeclared modules or on another workspace by accident. Pi-provided packages belong in `peerDependencies` when imported; third-party modules needed while a package resource runs belong in `dependencies`; development-only tools belong in `devDependencies`. Markdown-only skill packages need no Pi runtime peer. Root tooling does not become available when Pi installs a package with production dependencies only.

## Runtime model

Pi loads extension TypeScript and Agent Skills directly. Extension packages therefore publish reviewed TypeScript source rather than a generated build directory, while skill-only packages publish their Markdown resources without fake extension scaffolding. Package manifests identify resources under `pi.extensions` and `pi.skills`; the root aggregate globs must resolve to exactly the same production resources.

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

## Go

An extension may add `packages/<name>/go/go.mod` when it needs a Go helper. Each helper remains an independent module and is tested with `GOWORK=off`, so it works outside this checkout. A root `go.mod` or `go.work` is intentionally absent until real shared Go code justifies it.

The Go runner discovers every nested `go.mod`, verifies module tidiness and integrity, applies the shared golangci-lint configuration, runs race-enabled shuffled tests, enforces 80% total coverage, and runs govulncheck.

Shipping native binaries is an extension-specific design decision. Prebuilt platform packages, install-time compilation, and download-on-first-use have different security and portability tradeoffs and require explicit review.

## Release model

Release Please tracks each package independently in manifest mode. It groups pending package bumps into one reviewable Release PR, but each package retains its own version and receives its own `pi-<name>-v<version>` tag and GitHub Release when that PR is merged. The `node-workspace` plugin updates the root lockfile while leaving versions unlinked. GitHub Releases do not currently publish packages to npm.

Release attribution follows changed package paths and preserved Conventional Commits. Rebase-only merges retain every validated commit, so a pull request can make a breaking change to one package and a patch change to another without collapsing their semantic types or file ownership. Breaking changes bump major versions, `feat` bumps minor versions, and visible non-feature types (`fix`, `perf`, `docs`, `chore`, `refactor`, `revert`, `build`, and `deps`) bump patch versions. Root-only changes do not bump package versions.

Once registered, package changelogs are generator-owned release artifacts. Release Please's Markdown renderer does not follow this repository's Prettier and markdownlint styles, so those tools narrowly exclude `packages/*/CHANGELOG.md`; all other Markdown remains checked. Release PR review verifies the generated notes semantically instead of reformatting content that the next automation update would replace.

## Verification layers

1. Manifest validation checks package structure, release metadata, dependency placement, Pi resources, aggregate coverage, and npm pack contents.
2. Unit and integration tests exercise extension logic and skill contracts deterministically.
3. Source smoke tests load each package with the real Pi CLI.
4. Packed smoke tests install the exact npm artifact with production dependencies and repeat Pi loading.
5. RPC smoke tests verify extension lifecycle behavior and skill command discovery in an isolated environment.

Pi lifecycle subprocesses do not send a model prompt, use user settings, persist sessions, expose credentials, or permit network access. Packed-artifact setup may contact the public npm registry to install runtime dependencies, but it runs with an isolated home and no ambient credentials, proxy settings, or npm configuration.
