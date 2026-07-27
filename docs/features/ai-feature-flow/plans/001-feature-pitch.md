---
schema: feature-flow-plan/v1
feature: ai-feature-flow
slice: 001-feature-pitch
pitch_revision: 11
dependencies: []
status: reviewed
revision: 12
---

# Slice 001: Feature pitch and deterministic pitch core

## End-to-end observable outcome

A user can install or load `@mopeyjellyfish/pi-feature-flow`, invoke
`feature-pitch`, and move from repository evidence and parent-owned decisions to
a mechanically valid, blocker-free reviewed canonical pitch. The complete
pitch alone is shown with `Approve pitch`; only that choice permits acceptance.

The package ships one Node-standard-library helper at
`packages/feature-flow/scripts/feature-flow.mjs`. The skill invokes it by the
package-relative path for artifact/Git facts and explicit lifecycle
transitions. Models still research, shape, judge, review, and decide when a
human answer is required; they never reimplement helper logic.

## Pitch trace to AC IDs

- **AC-001:** create the independent skill package, shipped helper, metadata,
  documentation, release registration, and no-extension/no-runtime-dependency
  boundary.
- **AC-002:** establish the helper's command dispatch, bounded JSON/error
  contract, and deterministic-only responsibility through `validate-pitch`,
  `status`, and `pitch`; slice 002 completes the fixed five-command CLI.
- **AC-003:** cover strict pitch parsing, paths, required sections, Git
  summaries, exact failures, and mutation safety with executable helper tests.
- **AC-004:** cover pitch lifecycle transitions, explicit revision increments,
  and accepted-pitch checks with executable helper tests; slice 002 adds pins,
  plan transitions, and pitch-revision invalidation.
- **AC-005:** ship `feature-pitch` with the reasoning-versus-helper boundary.
- **AC-006:** close fresh whole-document review and complete-pitch-only human
  acceptance.
- **AC-010:** establish capability preflight, fresh serial delegation, and
  terminal barriers shared by later skills.
- **AC-011:** establish the changed-versus-unchanged pitch-level decision rule.
- **AC-012:** establish package/helper evidence and authorization-aware
  completion seams; final build evidence remains open.

## Preconditions and dependency postconditions

### Preconditions

- No implementation-slice dependency.
- Pitch revision 11 is accepted. This draft plan pins that accepted revision
  and remains `draft` pending fresh whole-set plan review.
- Before implementation, inspect current Git status/diff and preserve unrelated
  user changes.
- Before delegation, require compatible `subagent` and `subagent_wait`, discover
  builtin `worker` and `reviewer`, and preflight `question`. Missing capability
  fails closed with named setup guidance before side effects.

### Postconditions for slice 002

- `@mopeyjellyfish/pi-feature-flow` loads independently as a skill package with
  no production extension, custom agent, service, database, or npm runtime
  dependency.
- `scripts/feature-flow.mjs` is shipped in package `files`, uses only Node
  standard library APIs, implements pitch/status mechanics plus shared command
  seams, and is covered through spawned executable tests in temporary
  repositories.
- `feature-pitch`, the pitch template, and shared artifact/orchestration
  references provide stable seams for `feature-plan` and `feature-build`.
- Package metadata, root documentation/discovery, lockfile, and release files
  agree on version `0.0.0`.

## In scope and non-goals

### In scope

- Package manifest, README, changelog, license, `skills/`, `references/`,
  `scripts/`, and package-local tests.
- Root package documentation, normal lockfile synchronization, and both Release
  Please registrations.
- Helper commands `validate-pitch`, `status`, and `pitch`, with dispatch and
  response seams that slice 002 extends to the fixed five-command CLI.
- Strict canonical pitch frontmatter/body/path/status/revision parsing; bounded
  Git status/diff summary; narrow explicit pitch transitions; bounded JSON
  errors.
- `feature-pitch`, its template, and shared artifact/orchestration contracts.
- Executable helper behavior tests plus small skill-contract tests for helper
  invocation, reasoning ownership, complete-pitch acceptance, capability
  preflight, one-writer delegation, and terminal ordering.

### Non-goals

- Do not add `feature-plan` or `feature-build` behavior, `validate-plans` or
  `plans` implementation, complete-plan validation, dependency/AC coverage, or
  plan transitions/tests in this slice.
- Do not add `src/index.ts`, `tsconfig.json`, a Pi runtime peer, runtime npm
  dependency, CLI framework, schema/YAML library, custom agent, service,
  database, generic workflow engine, or project-management state.
- Do not ask the helper to judge pitch semantics, review quality, acceptance,
  slice verticality, TDD quality, scope, or pitch-level classification.
- Do not implement, stage, commit, or publish user feature work as part of the
  skill's pitch phase.

## TDD Red

1. Create `packages/feature-flow/test/feature-flow.test.ts` before the helper.
   Spawn `node scripts/feature-flow.mjs` against bounded temporary Git
   repositories; do not import private helper functions or commit fixtures.
2. Add valid pitch fixtures and assert `validate-pitch`, `status`, and `pitch`
   bounded JSON results and exit statuses.
3. Add table-driven invalid fixtures proving exact rejection of unknown,
   missing, or duplicate pitch frontmatter fields; invalid pitch schemas,
   statuses, revisions, required headings, and feature directories; illegal
   pitch transitions; `--revise` on status-only transitions; and invalid
   arguments.
4. Assert exact failing paths/reasons, nonzero exits, bounded stdout/stderr, and
   byte-for-byte pitch stability after every validation or failed transition.
5. Assert legal pitch status-only transitions preserve revisions, explicit
   draft/revise increments once, and successful writes preserve canonical
   content outside the frontmatter values being changed.
6. Assert `status` reports bounded current Git status/diff and pitch facts
   without embedding file bodies or making a semantic classification.
7. Create `packages/feature-flow/test/skills.test.ts` with only contract-level
   checks. Assert `feature-pitch` calls the relative helper before relevant
   transitions, leaves research/quality/blocker resolution to reasoning, shows
   the complete ready pitch to the human, and never treats helper success as
   review or acceptance.
8. Assert pitch writer/reviewer/fix handoffs use fresh async one-item task groups,
   explicit cwd, item-level `progress: false`, effective concurrency one, same-
   run wait/status terminal proof, parent-owned questions, and no implementation
   or unauthorized source-control action.

**Exact Red commands from the repository root:**

```bash
npm exec -- vitest run \
  packages/feature-flow/test/feature-flow.test.ts \
  packages/feature-flow/test/skills.test.ts
```

**Red signal:** Vitest executes the new tests; helper spawns fail because
`scripts/feature-flow.mjs` and the skill resources do not yet exist. A missing
test file is not Red evidence.

## TDD Green

1. Create the smallest skill-only package accepted by repository tooling and
   include `skills`, `references`, and `scripts/feature-flow.mjs` in package
   `files`.
2. Implement one direct Node ESM script with strict argument dispatch and only
   `node:fs`, `node:path`, and `node:child_process` as needed. Keep pitch parsing
   to the canonical template subset; do not build general YAML support.
3. Implement `validate-pitch`, `status`, and `pitch` once. Resolve the exact
   canonical pitch path from the feature value and bound every JSON field/list.
   Keep dispatch and result/error seams direct so slice 002 can add the remaining
   two fixed commands without a second helper.
4. Run Git status/diff summary commands in the caller's current working
   repository. Bound output and report command failure as a path/reason error;
   never interpret whether a change is related or safe.
5. Validate the complete prospective pitch transition before writing. Change
   only allowed frontmatter status/revision values, fail without a write, and
   increment revision only for an explicit revise argument.
6. Write `feature-pitch` as a concise parent orchestration skill. It invokes the
   helper by its package-relative path, uses exact helper failures rather than
   reparsing, and retains all interviewing, research, decision, quality, and
   review judgments in parent/subagent reasoning.
7. Add the canonical pitch template and concise shared artifact/orchestration
   references. Document helper facts and command usage without duplicating its
   implementation as prose assertions.
8. Keep the pitch draft through semantic fixes, invoke `ready` only after fresh
   blocker-free review, show the whole document through `question`, and invoke
   `accepted` only after `Approve pitch`. Semantic change uses the explicit
   draft/revise command and repeats review/acceptance.
9. Register and document the package using existing aggregate globs and normal
   npm tooling; add no already-covered explicit root resource path.

**Green signal:** both focused tests pass; invalid fixtures are unchanged;
package validation and dry-run contents show the intended script and skill
resources without an extension or runtime dependency.

## TDD Refactor

- Remove any skill prose or static test that duplicates deterministic helper
  invariants; keep one executable test table as authority.
- Keep helper functions local to the one script unless a second production
  caller genuinely requires an exported module.
- Keep JSON/errors bounded and names literal. Do not add aliases, config,
  plugin hooks, generic parsers, or a workflow abstraction.
- Rerun both focused tests after formatting the touched files.

## Expected files and public seams

### Create

- `packages/feature-flow/package.json`
- `packages/feature-flow/README.md`
- `packages/feature-flow/CHANGELOG.md`
- `packages/feature-flow/LICENSE`
- `packages/feature-flow/scripts/feature-flow.mjs`
- `packages/feature-flow/skills/feature-pitch/SKILL.md`
- `packages/feature-flow/skills/feature-pitch/references/pitch-template.md`
- `packages/feature-flow/references/artifact-contract.md`
- `packages/feature-flow/references/orchestration-contract.md`
- `packages/feature-flow/test/feature-flow.test.ts`
- `packages/feature-flow/test/skills.test.ts`

### Modify

- `README.md`
- `package-lock.json`
- `release-please-config.json`
- `.release-please-manifest.json`

### Public seams

- npm package `@mopeyjellyfish/pi-feature-flow`
- Agent Skill `feature-pitch`
- package-relative helper path `../../scripts/feature-flow.mjs` from a skill
  directory
- helper command-dispatch and bounded JSON/error seam; slice 001 exposes
  `validate-pitch`, `status`, and `pitch`, and slice 002 completes the fixed
  five-command interface
- canonical pitch path, frontmatter, statuses, revisions, and sections
- shared parent-orchestration and human-acceptance boundary

The root manifest globs already cover package skills; modify root `package.json`
only if repository validation proves the existing aggregate insufficient.

## Focused validation

Run after final slice edits and package/lockfile synchronization:

1. `npm run security:check`
2. `npm exec -- vitest run packages/feature-flow/test/feature-flow.test.ts`
3. `npm exec -- vitest run packages/feature-flow/test/skills.test.ts`
4. `npm --workspace @mopeyjellyfish/pi-feature-flow test`
5. `npm run packages:check`
6. `npm pack --dry-run --workspace @mopeyjellyfish/pi-feature-flow` and verify
   `scripts/feature-flow.mjs`, skills, references, and package documents are
   present without development tests.
7. Start deterministic Pi inside the target worktree with the package and
   required companions; confirm `feature-pitch` appears once, run the focused
   test before idle `/reload`, exercise draft validation/review/complete-pitch
   acceptance, then run `npm run smoke:source` and `npm run check`.

## Observable readiness evidence

- Helper test output shows valid and invalid temporary pitches, exact bounded
  path/reason failures, mutation safety, legal pitch transitions, explicit
  revision increments, and Git-summary bounds.
- Package dry-run lists the script and skill resources and shows no production
  extension, custom agent, runtime dependency, or committed fixture.
- `feature-pitch` uses helper output for mechanical facts while its transcript
  shows parent-owned research, questions, quality judgment, fresh review, and
  the complete-document `Approve pitch` gate.
- A semantic pitch change increments revision only through the explicit helper
  command, returns to draft, and repeats review/acceptance; helper success alone
  never accepts content.
- Final evidence reports changed files, focused commands, reviewer findings,
  residual risks, and staged/source-control state.

## Risks and parent decisions

- **Risk:** the strict parser's canonical subset could reject harmless template
  drift. **Containment:** executable exact-path fixtures define the public
  contract; change the contract intentionally rather than adding general YAML.
- **Risk:** package-root relative resource access may differ in packed Pi
  discovery. **Containment:** prove it through dry-run inspection and
  deterministic Pi dogfood.
- **Parent decisions:** none expected. A newly discovered package shape or pitch
  semantic choice is pitch-level and must stop for the user.

## Exit criteria

- Red was observed before production helper/skill files and retained in bounded
  slice evidence.
- Executable helper tests, small skill-contract tests, package checks, packed
  contents, deterministic discovery/reload, source smoke, and repository checks
  pass on the final diff.
- Slice 001 closes AC-001 and AC-005–006, establishes the pitch/status portions
  of AC-002–004, and establishes only shared AC-010–012 seams needed by later
  slices. Plan-specific helper mechanics and the complete fixed five-command
  surface remain owned by slice 002.
- A fresh reviewer reports no blockers. Every fix remains serial and passes the
  terminal barrier before revalidation/re-review.
- No implementation beyond this slice, unauthorized source-control action,
  scratch/progress artifact, or model-owned deterministic validation is added.
