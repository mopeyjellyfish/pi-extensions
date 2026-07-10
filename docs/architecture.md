# Architecture

## Package boundaries

The root package is private and exists only for shared development tooling and aggregate source loading. Each directory under `packages/` is an independent npm package with its own Pi manifest, runtime dependencies, documentation, tests, and optional native helper.

A package must not depend on undeclared modules or on another workspace by accident. Pi-provided packages belong in `peerDependencies`; third-party modules needed while an extension runs belong in `dependencies`; development-only tools belong in `devDependencies`. Root tooling does not become available when Pi installs a package with production dependencies only.

## Runtime model

Pi loads extension TypeScript directly. Production packages therefore publish reviewed TypeScript source rather than a generated build directory. The package manifest identifies every entrypoint under `pi.extensions`, and the root aggregate glob must resolve to exactly the same production entrypoints.

Extension factories perform registration and bounded initialization only. Long-lived processes, sockets, watchers, and timers start from `session_start` or from the command or tool that needs them. Every session-scoped resource has idempotent cleanup in `session_shutdown`.

Extensions must remain correct in TUI, RPC, JSON, and print modes:

- Guard terminal-only components with `ctx.mode === "tui"`.
- Guard dialogs and notifications with `ctx.hasUI` where required.
- Never write protocol data or diagnostics directly to standard output.
- Propagate `AbortSignal` to nested model, network, process, and file operations.
- Truncate custom tool output using Pi's exported limits and truncation helpers.
- Restore branch-aware state from session entries or tool-result details on `session_start`.

## TypeScript

The repository targets the minimum runtime supported by the pinned Pi host: Node `22.19.0`, ES2022, and Node16 module semantics. Strict compiler options and type-aware ESLint rules apply to production, tests, fixtures, and tooling. Library declaration checking alone is skipped because the current host's transitive declarations contain unresolved optional types; repository source is never skipped.

Prettier owns formatting. ESLint owns correctness, maintainability, dependency boundaries, promise safety, and protocol-specific restrictions. Knip detects unused files, exports, and dependencies.

## Go

An extension may add `packages/<name>/go/go.mod` when it needs a Go helper. Each helper remains an independent module and is tested with `GOWORK=off`, so it works outside this checkout. A root `go.mod` or `go.work` is intentionally absent until real shared Go code justifies it.

The Go runner discovers every nested `go.mod`, verifies module tidiness and integrity, applies the shared golangci-lint configuration, runs race-enabled shuffled tests, enforces 80% total coverage, and runs govulncheck.

Shipping native binaries is an extension-specific design decision. Prebuilt platform packages, install-time compilation, and download-on-first-use have different security and portability tradeoffs and require explicit review.

## Verification layers

1. Manifest validation checks package structure, dependency placement, Pi entrypoints, aggregate coverage, and npm pack contents.
2. Unit and integration tests exercise extension logic deterministically.
3. Source smoke tests load each extension with the real Pi CLI.
4. Packed smoke tests install the exact npm artifact with production dependencies and repeat Pi loading.
5. RPC smoke tests exercise factory initialization, `session_start`, command discovery, EOF shutdown, and `session_shutdown` in an isolated environment.

Pi lifecycle subprocesses do not send a model prompt, use user settings, persist sessions, expose credentials, or permit network access. Packed-artifact setup may contact the public npm registry to install runtime dependencies, but it runs with an isolated home and no ambient credentials, proxy settings, or npm configuration.
