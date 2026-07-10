# Contributing

## Development environment

Use the repository-pinned runtimes:

```sh
nvm install
nvm use
gvm install go1.26.5 -B # first use only
source .gvmrc
npm ci --ignore-scripts
```

Install golangci-lint `2.12.2` and govulncheck before working on Go code. The same exact versions run in CI.

## Changes

1. Create a focused branch from `main`.
2. Follow the package contract and extension authoring guide.
3. Add deterministic tests before or with production behavior.
4. Run `npm run fix` and `npm run check`.
5. Run `npm run workflows:check` for workflow changes and `npm run security:check` for dependency changes.
6. Review `npm pack --dry-run --json` results and the final diff.

Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit, for example `feat(extension-name): add a command` or `chore(ci): update a pinned action`. Keep commits scoped and do not combine unrelated cleanup.

## Pull requests

Describe behavior, risks, testing evidence, package contents, and any platform-specific constraints. A pull request must pass the stable `CI / required` check. Never weaken a gate, add an exclusion, or lower coverage merely to make a change pass; explain and review any narrowly necessary exception.

Do not commit credentials, environment files, personal paths, session data, generated output, coverage, archives, or delegated-agent artifacts.
