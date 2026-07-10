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

npm enforces a 14-day minimum release age when resolving new versions. Do not disable this for routine updates. If a newly released version is required to remediate an active vulnerability, use `npm install --min-release-age=0 <package>@<version>` only after the security review described in [`SECURITY.md`](SECURITY.md), and document the exception in the pull request.

## Changes

1. Create a focused branch from `main`.
2. Follow the package contract and extension authoring guide.
3. Add deterministic tests before or with production behavior.
4. Run `npm run fix` and `npm run check`.
5. Run `npm run workflows:check` for workflow changes and `npm run security:check` for dependency changes.
6. Review `npm pack --dry-run --json` results and the final diff.

Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit, for example `feat(pi-example): add a command` or `chore(ci): update a pinned action`. Pull request titles must follow the same format. CI validates the title and every commit with a 100-character header limit.

The repository uses rebase-only merges. Keep commits scoped and do not combine unrelated cleanup: preserving each commit lets Release Please attribute changed paths and semantic bump types independently when one pull request changes several extensions.

For package-local commits, breaking changes (`!` or `BREAKING CHANGE`) bump major, `feat` bumps minor, and visible non-feature types (`fix`, `perf`, `docs`, `chore`, `refactor`, `revert`, `build`, and `deps`) bump patch. Root-only commits do not release an extension. Merges update a consolidated Release PR; merging that PR creates independent component tags and GitHub Releases. npm publication is not currently automated.

## Pull requests

Describe behavior, risks, testing evidence, package contents, and any platform-specific constraints. A pull request must pass the stable `CI / required` check. Never weaken a gate, add an exclusion, or lower coverage merely to make a change pass; explain and review any narrowly necessary exception.

Do not commit credentials, environment files, personal paths, session data, generated output, coverage, archives, or delegated-agent artifacts.
