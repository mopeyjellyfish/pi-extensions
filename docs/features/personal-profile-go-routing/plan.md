---
status: accepted
---

# Plan: Complete personal profile and Go-aware delivery

Intent source: [`pitch.md`](./pitch.md), accepted on `feat/go-skills`.

Mandatory pre-approval Go specification review: **Approved**.

This plan delivers the complete personal aggregate and evidence-based Go routing
in one serial delivery unit. It updates PR #99 because the routing depends on the
three Go skills introduced on that branch.

## Execution mode

Accept-all implementation. Whole-plan approval authorizes the named slices to
run through focused red/green proof, required gates, one fixed review, atomic
commits, a normal push of unchanged history, and update of PR #99. It does not
authorize merge, release, deployment, destructive cleanup, or unrelated work.

Implementation pauses for setup, test, check, commit, or publication failure;
material review findings; material forecast variance; or any change to accepted
scope, delivery boundaries, dependencies, or authority.

## Delivery topology

| Delivery unit | Branch           | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                   |
| ------------- | ---------------- | ----------------- | --------------- | ------------ | ----------------------------------------------------- |
| 1             | `feat/go-skills` | `main`            | `001–003`       | none         | serial; current linked worktree; one Worker or parent |

One delivery unit, branch, and pull request keeps the aggregate, installed Go
resources, workflow routing, and child profiles reviewable together. The pitch
and plan share this implementation publication and do not create independent
pull requests.

## Critical path, dependencies, and lanes

The critical path is serial:

1. Make the aggregate load every local extension and skill.
2. Make Shape, planning, and Reviewer perform one fixed-document Go review.
3. Make Engineering and Worker load applicable Go guidance for backend work.
4. Integrate documentation, run the installed-profile and repository gates, and
   complete one fixed-diff review.

There are no parallel lanes. Slices share `test/tooling/packages.test.ts`, root
documentation, and the fixed agent profiles. Parallel writers would overlap and
create avoidable integration risk.

Forecast:

- active implementation lanes: 1;
- delivery units and pull requests: 1 and 1;
- expected atomic implementation commits: 3 after this plan commit;
- primary integration points: root Pi resources, exact-profile validation,
  Worker and Reviewer skill paths, Feature Flow review gates, and Engineering
  entry methods;
- expensive gates: installed-profile smoke in `npm run check`,
  `npm run security:check`, and deterministic manual Pi reload acceptance;
- likely cascade cost: a root resource change can invalidate profile tests,
  dependency metadata, smoke tests, and root documentation together.

Invalidation map:

| Changed surface                      | Invalidate and rerun                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Root resource or dependency metadata | Root profile tests, package validation, lockfile checks, source and installed-profile smoke, security checks |
| Agent frontmatter or charter         | Agent contract tests and the applicable Feature Flow or Engineering tests                                    |
| Feature Flow skills                  | Feature Flow resource tests and the mandatory Go plan review                                                 |
| Engineering skills                   | Engineering resource tests and applicable agent contract tests                                               |
| Documentation only                   | Prettier and markdownlint for the changed documents                                                          |
| Any edit after the final gate starts | The focused check for that surface, then the complete final gate after the diff freezes again                |

## [ ] 001 — Load the complete personal aggregate

### Outcome and requirement trace

The root profile loads every local production extension and skill exactly once,
uses package-directory paths for local skills, removes the redundant root
Grafana dependency, and accurately documents the complete personal profile.

Traces: AC-001, AC-002, and the aggregate parts of AC-009.

### Seam and files

Public seam: root `pi` discovery and installed profile behavior.

Likely files:

- `package.json`
- `package-lock.json`
- `scripts/lib/packages.ts`
- `test/tooling/packages.test.ts`
- `knip.config.ts`
- `README.md`
- `AGENTS.md`
- `packages/README.md`
- `docs/architecture.md`

Keep local extensions in package-name order, followed by external extensions:
`frontend-developer`, `hashline`, `lsp`, `playwright-cleanup`, `question`,
`simple-english`, `status-line`, `todo`, `web-search`, `worktrunk`, then
`pi-claude-bridge` and `pi-subagents`. Keep skills in workflow order:
`feature-flow`, `engineering`, `productivity`, `simple-english`,
`git-conventions`, `github`, `worktrunk`, `frontend-developer`, `go`, and
`grafana-skills`. Each local name represents its root-relative package resource
path. Existing prompt coverage remains unchanged. Future prompt auto-inclusion
is deliberately outside this feature: prompt entries stay explicit because the
user selected every extension and skill, and the current profile already
includes every local prompt-bearing package.

### Dependencies

The accepted Go package commits already present on `feat/go-skills`.

### Execution lane and ownership

Serial in the current linked worktree. One writer owns all files in this slice.

### Red proof

First update the exact root-profile expectation in
`test/tooling/packages.test.ts` to require every accepted extension and skill,
local Grafana path, and dependency removal. Add a behavior test that introduces
a synthetic production package resource under a temporary root and proves that
profile validation rejects its omission. When `packages/` exists and contains
production packages, the validator derives required local extension and skill
paths from `discoverProductionPackages(root)`. Map each package-manifest resource
entry to the same root-relative path under `./packages/<directory>/`; deduplicate
identical mapped paths, and do not broaden a future package's specific declared
subdirectory to all of `skills/`. Compare derived and configured local resources
as sets; the explicit `ROOT_PROFILE` still fixes their order and allowed
external resources. Guard discovery with `pathExists`, and convert a malformed
package discovery failure into a returned validation error rather than throwing.
Prompt completeness remains outside the derived check. Replace the synthetic
additional-resource fixture that currently reuses the future legitimate LSP
path. Run:

```sh
npm test -- --run test/tooling/packages.test.ts
```

It must fail against the old manifest, validator constants, and missing
completeness check for the intended reasons.

### Green proof and checks

Update the root manifest, both validator constants (`ROOT_PROFILE` and
`ROOT_DEPENDENCIES`), both test mirrors, lockfile, Knip dependency ignore, and
profile documentation. Regenerate dependency metadata with the declared npm
setup rather than editing the lockfile by hand. Run:

```sh
npm test -- --run test/tooling/packages.test.ts
npm run packages:check
npm run smoke:source
```

The tests must verify exact ordered resource lists, no duplicates, future local
extension and skill completeness, the reduced root dependency set, and
successful source loading.

### Atomic commit and pull request

Commit: `feat: load the complete personal Pi profile`

Delivery unit 1 in PR #99. Do not publish between slices.

### Done when

- Root manifest and validator agree on every local extension and skill, and a
  synthetic future package cannot be omitted silently.
- Local Feature Flow and Grafana skills use package-directory paths.
- The redundant root Grafana dependency and stale Knip ignore at
  `knip.config.ts:12` are removed, with lockfile metadata synchronized.
- Rename the `keeps the private root profile curated` test to match the complete
  profile contract. Update current claims at `AGENTS.md:96`,
  `packages/README.md:34`, `README.md:5`, and `README.md:256`; do not rewrite
  historical plans or accepted feature documents.
- Focused root profile, package, and source smoke checks pass.

## [ ] 002 — Require Go specification review in Shape and planning

### Outcome and requirement trace

Every Go-targeted pitch and plan loads applicable Go standards and receives one
fixed-document `go-spec-reviewer` pass before approval. The pass consumes the
existing independent-review budget, has explicit invalidation rules, and uses a
Reviewer mode that cannot be confused with fixed-diff code review.

Traces: AC-003, AC-004, AC-006 (Reviewer), AC-007, AC-008, and the Feature Flow
parts of AC-009.

### Seam and files

Public seams: `shape`, `planning-changes`, and the configured Reviewer profile.

Likely files:

- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/README.md`
- `packages/feature-flow/test/resources.test.ts`
- `agents/reviewer.md`
- `test/tooling/packages.test.ts`
- root profile descriptions in `README.md`, `AGENTS.md`, and
  `docs/architecture.md`

Reviewer keeps its current `code-review` and `codebase-design` skills and adds,
in order, `go-spec-reviewer`, `go`, and `cobra-viper`. Their corresponding paths
are exactly `../packages/go/skills/go-spec-reviewer`,
`../packages/go/skills/go`, and `../packages/go/skills/cobra-viper`. Its task
contract selects either `Review mode: fixed-document Go specification` or
`Review mode: fixed-diff code`.

### Dependencies

Slice 001 makes the Go skills available in the root profile. Independent
Feature Flow installs still use installed-capability checks and direct-parent
fallback.

### Execution lane and ownership

Serial in the current linked worktree after slice 001.

### Red proof

Add Feature Flow and agent contract assertions for:

- evidence-based Go and CLI applicability;
- one mandatory pre-approval spec review;
- review-budget consumption and replacement only after proposed-solution,
  boundary, authority, or acceptance-criterion changes;
- explicit fixed-document mode, resolved skill references, issue resolution,
  and direct-parent fallback; and
- the Reviewer's exact skills, skill paths, description, and dual-mode charter.

Run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts test/tooling/packages.test.ts
```

It must fail because the current methods and Reviewer lack those contracts.

### Green proof and checks

Make the smallest instruction and agent-profile changes that satisfy the red
contract. Do not edit the supplied Go skills. Run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts test/tooling/packages.test.ts
npm --workspace @mopeyjellyfish/pi-feature-flow test
```

### Atomic commit and pull request

Commit: `feat(pi-feature-flow): require Go specification review`

Delivery unit 1 in PR #99. Do not publish between slices.

This package-scoped commit deliberately includes the inseparable root Reviewer,
agent-contract test, and current profile documentation changes that make the
Feature Flow behavior available in the personal aggregate. Do not split those
supporting root files into an independent commit.

### Done when

- Shape and planning enforce one applicable Go spec review before approval.
- The one-review budget, invalidation rule, issue handling, and human approval
  behavior are unambiguous.
- Reviewer can perform fixed-document Go review inline and retains fixed-diff
  code review as a separate mode.
- Feature Flow remains usable without the Go package or configured Reviewer and
  states the honest fallback.
- Focused Feature Flow and agent tests pass.

## [ ] 003 — Route Go guidance through backend engineering work

### Outcome and requirement trace

Go review, diagnosis, testing, implementation, refactoring, and architecture
analysis load `go`; Cobra/Viper guidance loads only when CLI evidence applies.
Fresh Worker and Reviewer runs have the required local skill paths, while
independent Engineering installs retain capability checks and direct-parent
fallback.

Traces: AC-005, AC-006 (Worker), AC-008, and the Engineering parts of AC-009.

### Seam and files

Public seams: Engineering entry skills and fixed Worker/Reviewer execution.

Likely files:

- `packages/engineering/skills/developing-changes/SKILL.md`
- `packages/engineering/skills/diagnosing-bugs/SKILL.md`, only in its Pi-specific
  additions after the pinned upstream boundary
- `packages/engineering/skills/test-driven-development/SKILL.md`
- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/skills/code-review/SKILL.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`
- `agents/worker.md`
- `agents/reviewer.md`
- `test/tooling/packages.test.ts`
- root lifecycle descriptions in `README.md`, `AGENTS.md`, and
  `docs/architecture.md`

Worker keeps its current skills and adds `go` and `cobra-viper`, with exact paths
`../packages/go/skills/go` and `../packages/go/skills/cobra-viper`. Slice 003 may
update Reviewer prose for Go code-review applicability but must not change the
final Reviewer skill arrays established in slice 002. Code review applies
precedence in this order: target repository instructions and module contracts;
applicable Go and Cobra/Viper standards; then concrete
`code-review/references/go.md` questions. It reports only practical consequences
and does not duplicate tool findings.

### Dependencies

Slices 001 and 002 provide root discovery and Reviewer dual-mode skill loading.

### Execution lane and ownership

Serial in the current linked worktree after slice 002.

### Red proof

Add Engineering and agent contract assertions that each named direct entry loads
`go` from Go evidence, conditionally loads `cobra-viper` from CLI evidence,
preserves cross-package availability fallback, keeps the vendored debugging
prefix byte-identical, and enforces code-review precedence and calibration. Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts test/tooling/packages.test.ts
```

It must fail because the current Engineering methods and Worker profile do not
contain the routing contract.

### Green proof and checks

Add one concise shared routing rule to each direct entry point, without copying
the Go standards into Engineering. Put diagnosis routing only in the existing
Pi additions. Update Worker skill paths and Worker/Reviewer prose; keep the
Reviewer arrays from slice 002 unchanged. Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts test/tooling/packages.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
npm --workspace @mopeyjellyfish/pi-go test
```

### Atomic commit and pull request

Commit: `feat(pi-engineering): route Go guidance through delivery`

Delivery unit 1 in PR #99. Publish only after integrated verification and fixed
review.

This package-scoped commit deliberately includes the inseparable root Worker,
agent-contract test, Reviewer prose, and current lifecycle documentation changes
that make the Engineering behavior available in the personal aggregate. Do not
split those supporting root files into an independent commit.

### Done when

- Every named Engineering entry method has evidence-based Go routing.
- CLI guidance activates only for commands, flags, Cobra/Viper, or CLI
  configuration evidence.
- Worker and Reviewer exact skill contracts pass.
- The debugging skill's pinned upstream content remains byte-identical.
- Engineering and Go focused tests pass.

## Integrated verification and delivery

After slice 003, freeze the diff. The parent inspects scope, package and release
boundaries, dependency and lockfile hygiene, supplied Go skill byte identity,
agent paths, documentation, and artifacts. Then run one fresh read-only QA pass
with these exact commands, once each:

```sh
npm test -- --run test/tooling/packages.test.ts packages/feature-flow/test/resources.test.ts packages/engineering/test/resources.test.ts packages/go/test/skill.test.ts
npm run smoke:source
npm run security:check
npm run check
```

If QA reports failures, repair only while the defect packet shows measurable
progress. Re-run invalidated focused checks first and the complete gate once only
after they pass.

Because manifests, skills, and agent resources change, complete deterministic
manual Pi acceptance from this linked worktree after the focused tests pass:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Confirm the complete extension and skill set appears once without conflict
diagnostics, including successful LSP startup with `diff` and `vscode-jsonrpc`
resolved from the workspace install. While Pi is idle, run `/reload`. Verify
that `go`, `cobra-viper`, and `go-spec-reviewer` remain discoverable; LSP and
Simple English resources do not duplicate; one fixed-document Go review can be
selected separately from one fixed-diff code review; and no stale registrations
remain. Runtime dependency or startup failure pauses accept-all execution.

When all checks pass, run one fresh fixed-diff formal review against `main` and
the accepted pitch and plan. The review follows `code-review`; this repository
diff contains TypeScript and Markdown workflow changes rather than Go program
code, so Go code-review standards apply only to claims about the Go routing
contract, not as style findings against non-Go files.

Accept-all authority then permits the three planned atomic commits if not
already created, a normal push of unchanged `feat/go-skills` history, and update
of PR #99. Stop before merge, release, deployment, destructive cleanup, or
worktree removal.
