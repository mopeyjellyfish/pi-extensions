# Repository guidance

## Scope

This repository contains independently installable Pi extension packages. Keep changes narrow, preserve package independence, and do not introduce a production extension as scaffolding.

## Required checks

Use Node from `.nvmrc` and Go from `.gvmrc`. Before handing off changes, run the focused tests followed by `npm run check`. Run `npm run workflows:check` after workflow changes and `npm run security:check` after dependency or installation changes.

## TypeScript

- Keep the compiler and type-aware ESLint clean without suppressing errors.
- Use explicit package dependencies and type-only imports.
- Keep Pi factories bounded; start and stop resources in session lifecycle hooks.
- Respect cancellation, state branching, output truncation, and non-interactive modes.
- Never write production extension output to standard output.

## Go

- Each extension owns an independent module under its package.
- Do not add a root Go module or workspace without an approved shared-code need.
- Keep `GOWORK=off` checks, race tests, module integrity, vulnerability checks, formatting, and coverage green.
- Use specific, explained `nolint` directives only when unavoidable.

## Repository hygiene

Use Conventional Commits. Do not stage or commit credentials, local absolute paths, environment files, generated artifacts, package archives, coverage, sessions, or delegated-agent runtime files. GitHub Actions use least privilege and immutable full-SHA action pins.

Keep the dependency release-age gate and low-frequency grouped update policy intact. Routine major upgrades are manual. A security-driven age-gate exception requires explicit review and pull-request documentation.
