---
schema: feature-flow-pitch/v1
feature: ai-feature-flow
status: accepted
revision: 11
---

# AI-first feature flow

## Problem and desired outcome

Feature work has repository guidance for authoring, testing, and review, but no
canonical parent-led flow from one accepted problem through reviewed
vertical-slice plans to verified delivery. The current proposal also asks a
model to repeat mechanical parsing, lifecycle, path, dependency, and coverage
checks. That wastes reasoning and makes identical artifacts produce
non-identical results.

The desired outcome is an independently installable skill package that uses a
small Node-standard-library helper for deterministic artifact and Git checks.
The parent and its fresh worker/reviewer subagents spend reasoning only on user
interviews, research, solution quality, pitch-level decisions, slicing, TDD,
implementation, and adversarial review.

A user invokes `feature-pitch`, `feature-plan`, and `feature-build` in order. The
human accepts only the complete reviewed pitch. Once accepted, plan generation,
whole-set review, and serial build proceed automatically unless reasoning finds
a new pitch-level product, scope, architecture, risk, or non-negotiable
decision.

## Current behavior and repository evidence

- [`package.json`](../../../package.json) aggregates package skills with
  `./packages/*/skills` and builtin worker/reviewer definitions from
  [`agents/`](../../../agents/). The root aggregate does not install the
  `pi-subagents` extension, so the full flow requires a separate compatible
  installation.
- [`packages/README.md`](../../../packages/README.md),
  [`docs/architecture.md`](../../architecture.md), and
  [`docs/authoring.md`](../../authoring.md) permit independently installable
  skill-only packages without `src/index.ts` or a Pi runtime peer.
- [`packages/question/README.md`](../../../packages/question/README.md) provides
  the existing parent-owned decision and complete-document approval seam.
- [`packages/worktrunk/README.md`](../../../packages/worktrunk/README.md) and
  [`packages/todo/README.md`](../../../packages/todo/README.md) provide routed
  worktrees and bounded session-local execution state without a new database.
- [`packages/lsp/README.md`](../../../packages/lsp/README.md) and
  [`packages/web-search/README.md`](../../../packages/web-search/README.md)
  provide semantic validation and optional external research.
- [`agents/worker.md`](../../../agents/worker.md) defines the single writer and
  escalation boundary; [`agents/reviewer.md`](../../../agents/reviewer.md)
  defines read-only adversarial review.
- No repository package currently binds these capabilities into one feature
  flow or provides deterministic validation and lifecycle transitions for its
  canonical pitch and plan artifacts.

## In scope

- Add `@mopeyjellyfish/pi-feature-flow` under `packages/feature-flow/` as an
  independently installable skill package.
- Ship exactly three parent-facing Agent Skills: `feature-pitch`,
  `feature-plan`, and `feature-build`.
- Ship one small production helper at
  `packages/feature-flow/scripts/feature-flow.mjs`. It uses only Node standard
  library APIs, is included in package `files`, and is invoked by each skill by
  the same relative package path. Models call it; they do not restate or
  reimplement its logic.
- Give the helper deterministic ownership of:
  - strict parsing and validation of canonical pitch/plan frontmatter and
    required sections;
  - exact allowed fields, schemas, statuses, revisions, feature paths, plan
    paths, and `<NNN>-<slice>.md` filenames;
  - bounded current Git status and diff-summary inspection;
  - accepted-pitch status and revision validation;
  - complete plan-set validation, unique slice IDs, direct serial dependency
    order, matching `pitch_revision`, and literal coverage of every pitch
    `AC-*` ID;
  - narrow pitch `draft`, `ready`, and `accepted` and plan-set `draft` and
    `reviewed` transitions, with revision increments only when an explicit
    revise command requests them;
  - bounded machine-readable success/error output and nonzero failure with exact
    artifact paths and reasons.
- Keep semantic ownership with the parent and subagents: grilling/interviewing
  the user, repository and external research, solution shaping, rabbit-hole
  discovery, deciding whether blocking choices are resolved, vertical-slice
  decomposition, TDD-plan quality, deciding whether a finding is pitch-level,
  implementation, and adversarial review.
- Generate and review all plans automatically up front after pitch acceptance,
  then execute dependency-ready slices serially using the repository's existing
  companions and builtin agents.
- Add focused executable helper tests for valid/error/transition behavior and
  small skill-contract tests only for reasoning boundaries and tool
  orchestration.
- Add package documentation, root discovery/documentation updates, lockfile
  synchronization, and release registration required for a production package.

## Out of scope

- A Pi extension, custom agent, service, database, daemon, generic workflow
  engine, or runtime npm dependency.
- A CLI framework, schema dependency, YAML dependency, generic Git wrapper, or
  generic state machine.
- Letting the helper judge semantics, quality, scope, acceptance, blocker
  resolution, plan verticality, TDD quality, or whether an issue is pitch-level.
- Bundling or modifying question, Worktrunk, todo, LSP, web search,
  `pi-subagents`, or builtin agents.
- Human plan acceptance, a final feature-acceptance gate, cross-session project
  tracking, or source-control publication without prior authorization.
- Provider/model selection or configuration.

## Constraints

- Follow the skill-only package contract. Do not add `src/index.ts`, a Pi runtime
  peer, `tsconfig.json`, a custom agent, or an npm runtime dependency. The
  helper runs in Pi's supported Node environment and imports only `node:`
  modules.
- The package manifest must ship `scripts/feature-flow.mjs` in `files` alongside
  skills and references. Skills use its package-relative path rather than copy
  its validation or transition rules into prompts.
- Keep the helper interface to five commands:
  - `validate-pitch <pitch-path>` validates exact pitch structure and values;
  - `validate-plans <pitch-path> <plans-dir>` requires the current accepted
    pitch and validates the complete reviewed-or-draft serial plan set and
    literal AC coverage;
  - `status <pitch-path> <plans-dir>` reports bounded artifact readiness plus
    current Git status/diff summary without changing files;
  - `pitch <pitch-path> <draft|ready|accepted> [--revise]` performs only a legal
    pitch transition; `--revise` is valid only when returning to `draft` and
    increments revision once;
  - `plans <pitch-path> <plans-dir> <draft|reviewed> [--revise <plan-path> ...]`
    performs only a legal whole-set transition; returning to `draft` may
    increment only the explicitly named plan revisions.
- Commands write bounded JSON to standard output on success and bounded JSON to
  standard error on failure. Failures exit nonzero and identify each exact path
  and reason without credentials, file bodies, or unbounded Git output.
- The helper validates facts and requested transitions only. A successful check
  does not prove a pitch is good, a review is clean, a human accepted, or a plan
  is executable. The parent invokes transitions only after the corresponding
  reasoning or human event.
- Before each phase, require compatible `subagent` and `subagent_wait`, discover
  builtin `worker` and `reviewer`, and preflight phase companions. Missing
  capabilities fail closed before side effects with named setup guidance.
- Every worker, reviewer, and fix worker is a fresh async top-level `tasks`
  group with exactly one item, explicit routed `cwd`, item-level
  `progress: false`, top-level `concurrency: 1`, and a recorded run ID. Wait for
  that run and verify complete lifecycle plus observed process termination
  before dependent work. This is serial orchestration, not parallel work.
- Keep one writer active. Reviewers are read-only. Plans and implementation
  slices remain serial.
- Parent reasoning owns every human interaction. After complete-pitch
  acceptance, it asks again only for a newly discovered pitch-level decision.
- Inspect current Git status/diff before planning and build. The helper reports
  facts; parent reasoning classifies unrelated changes and invalidated
  assumptions and preserves user work.

## Non-negotiables

- Canonical paths are `docs/features/<feature>/pitch.md` and
  `docs/features/<feature>/plans/<slice>.md`, where `feature` is the canonical
  feature directory name, `slice` matches `NNN-slug`, and the filename equals
  the plan's `slice` value plus `.md`.
- Pitch frontmatter contains only `schema`, `feature`, `status`, and `revision`.
  Allowed pitch statuses are `draft`, `ready`, and `accepted`.
- Plan frontmatter contains only `schema`, `feature`, `slice`,
  `pitch_revision`, `dependencies`, `status`, and `revision`. Allowed plan
  statuses are `draft` and `reviewed`.
- A semantic pitch edit uses the explicit pitch revise transition: return to
  `draft`, increment revision once, repeat fresh whole-document review and
  complete-document human acceptance, and invalidate all plans. Status-only
  transitions never increment revision.
- A semantic plan edit uses the explicit plan-set revise transition: return the
  complete set to `draft`, increment only named changed plans, and repeat fresh
  whole-set review. A clean review permits one explicit whole-set transition to
  `reviewed`.
- The helper enforces transition legality but never decides that review or human
  acceptance occurred. The parent supplies those judgments and invokes the
  explicit command.
- Only the complete pitch is shown for human acceptance. `accepted` is set only
  after the user selects `Approve pitch`. Plans are never presented for human
  acceptance.
- Every plan pins the accepted pitch revision. Every pitch AC appears literally
  in at least one plan trace, every plan traces at least one pitch AC, slice IDs
  are unique, and each non-first plan depends directly and only on its immediate
  predecessor.
- All plans exist and pass deterministic validation plus a fresh blocker-free
  whole-set reasoning review before implementation.
- Planning/build stop only for a new pitch-level decision. If the answer changes
  the pitch, revise and reaccept it and regenerate all plans. If it confirms the
  accepted pitch unchanged, record bounded parent evidence and resume.
- Git status/diff, explicit artifact statuses, and monotonic revisions are the
  audit trail. Do not add hashes, receipts, acceptance records, or progress
  artifacts.
- Commit, push, merge, and PR actions occur only when already authorized and
  only after checks. Otherwise stop at a reviewed ready diff.

## User-visible behavior and flows

### Pitch flow

1. The parent preflights tools/roles, runs the helper `status`, researches the
   repository and optionally external sources, and grills the user until it
   judges every pitch-level decision explicit.
2. One fresh writer creates or semantically revises the canonical draft pitch.
   The parent waits for verified terminal completion, then runs
   `validate-pitch`. Mechanical failures return to the writer with exact helper
   path/reason output; no model reparses the artifact.
3. One fresh read-only reviewer judges the complete pitch. Routine blockers use
   one fresh serial fix worker. Before semantic fixes, the parent invokes the
   explicit draft/revise transition when required; after fixes it reruns
   `validate-pitch` and fresh review.
4. Once reasoning reports no blockers, the parent invokes the status-only
   transition to `ready`, reruns validation, and shows the entire pitch through
   `question` with one `Approve pitch` option.
5. Only that user choice authorizes the status-only transition to `accepted`.
   Requested semantic changes instead use draft/revise and restart complete
   review and acceptance. The helper verifies facts and transitions but never
   substitutes for review or acceptance.

### Plan flow

1. The parent runs `status` and `validate-pitch`, requiring an accepted pitch,
   then preflights planning tools and roles.
2. One fresh writer reasons about vertical decomposition and TDD quality and
   writes every draft plan up front with the accepted pitch revision.
3. The parent runs `validate-plans`. Exact helper errors are fixed before one
   fresh reviewer judges the accepted pitch and complete plan set. Routine
   semantic fixes use the explicit plan-set draft/revise command, one fresh
   serial fix worker, another deterministic validation, and another fresh
   whole-set review.
4. A blocker-free reasoning review authorizes the explicit whole-set
   status-only transition to `reviewed`, followed by `validate-plans`. There is
   no plan question or human acceptance.
5. A new pitch-level finding stops for the user. Changed pitch content restarts
   pitch review/acceptance and complete plan regeneration; unchanged
   confirmation resumes with bounded evidence.

### Build flow

1. Before any worktree, todo, or writer side effect, the parent runs helper
   `status` and `validate-plans`. The helper verifies current artifact/Git facts;
   the parent reasons about code assumptions, unrelated changes, capability
   needs, and whether any issue is pitch-level.
2. The parent creates or activates the authorized Worktrunk path and projects
   the fixed reviewed serial order into `todo`.
3. For each dependency-ready slice, one fresh worker follows Red, smallest
   Green, and bounded Refactor in the routed cwd, using LSP and repository
   checks where applicable. A verified terminal barrier precedes review.
4. One fresh reviewer adversarially examines the slice diff and evidence.
   Routine blockers use one fresh serial fix worker, revalidation, and another
   fresh review. A new pitch-level decision follows the pitch-decision rule.
5. After all slices, the parent performs deterministic Pi discovery, focused
   test, idle reload, changed-skill dogfood, source smoke, repository checks,
   bounded AC evidence, and only pre-authorized source-control actions.

## Solution shape and key seams

The package remains skill-first with one deterministic script:

- `skills/feature-pitch/SKILL.md` owns interviewing, research, shaping, review,
  and the complete-pitch human gate; it calls the helper for facts and
  transitions.
- `skills/feature-plan/SKILL.md` owns vertical slicing and plan-quality review;
  it calls the helper for accepted-pitch and complete-plan-set invariants and
  transitions.
- `skills/feature-build/SKILL.md` owns implementation/review orchestration; it
  calls the helper readiness/status gates before writer work.
- `scripts/feature-flow.mjs` is the sole implementation of strict canonical
  parsing, paths, statuses, revisions, direct serial dependencies, literal AC
  coverage, bounded Git summaries, and narrow transitions.
- `references/artifact-contract.md` documents the public artifact/CLI contract
  without duplicating implementation logic.
- `references/orchestration-contract.md` documents capability preflight, fresh
  one-item runs, terminal barriers, one-writer discipline, parent decisions,
  and forbidden side effects.
- Skill-local pitch/plan templates and build evidence guidance remain concise.

Executable tests spawn the helper in temporary Git repositories and assert
success JSON, bounded exact failures, no mutation on validation errors, legal
transitions, explicit-only revision increments, canonical path/filename checks,
accepted pitch pins, complete direct serial order, and literal AC coverage.
Small skill tests assert only that models invoke the helper before relevant
side effects and retain semantic/decision ownership, fresh serial delegation,
and human-only complete-pitch acceptance.

## Rabbit holes and resolved containment decisions

| Rabbit hole                                         | Containment decision                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Asking models to parse the same artifact repeatedly | One tested Node-stdlib helper owns mechanical parsing and validation.                         |
| Building a Pi extension or service for enforcement  | A package-shipped script invoked by skills is sufficient and has no lifecycle resource.       |
| Adding a workflow framework or CLI dependency       | Five direct commands and strict argument parsing cover the fixed workflow.                    |
| Letting the helper approve content                  | It checks facts and requested transitions only; parent/human judgment remains authoritative.  |
| General dependency scheduling                       | Plans form one direct serial chain; no DAG engine is needed.                                  |
| Adding artifact identity receipts                   | Status, monotonic revisions, and Git evidence are sufficient.                                 |
| Persisting build state                              | Existing session `todo` and bounded conversation evidence are sufficient.                     |
| Multiple artifact writers                           | One fresh writer at a time; reviews are read-only and fixes are serial.                       |
| Guessing through a new product choice               | Parent stops only for a pitch-level decision and applies changed-versus-unchanged resolution. |
| Editing reviewed plans with delivery results        | Keep plans immutable during build and retain bounded evidence in the parent conversation.     |
| Automating source-control completion                | Honor prior authorization after checks; otherwise leave a reviewed ready diff.                |

## No-gos

- No production extension, custom tool registration, custom agent, service,
  database, daemon, or runtime dependency.
- No CLI/schema/YAML framework, generic workflow engine, scheduler, or Git
  abstraction.
- No model reimplementation of helper parsing, validation, transition, Git
  summary, dependency, filename, or AC-coverage logic.
- No helper judgment of semantics, pitch quality, acceptance, plan verticality,
  TDD quality, blocker resolution, scope, or pitch-level classification.
- No parallel writers or parallel slice implementation.
- No human plan acceptance, mandatory final-feature question, extra receipt,
  artifact hash, progress file, backlog, estimates, or project-management state.
- No implementation before complete-pitch acceptance and a complete validated,
  blocker-free reviewed plan set.
- No provider/model IDs, credentials, destructive cleanup, publish, or
  unauthorized commit/push/merge/PR action.

## Acceptance criteria

- **AC-001:** `@mopeyjellyfish/pi-feature-flow` is an independently installable
  `0.0.0` skill package, release-registered and root-discoverable, with exactly
  three skills, one shipped Node-stdlib helper, and no Pi extension, custom
  agent, service, database, CLI framework, or runtime dependency.
- **AC-002:** The helper exposes only `validate-pitch`, `validate-plans`,
  `status`, `pitch`, and `plans`; every command emits bounded machine-readable
  output, fails nonzero with exact paths/reasons, and does not decide semantic
  quality or acceptance.
- **AC-003:** Executable helper tests prove exact frontmatter fields, schemas,
  statuses, required sections, feature paths, plan filenames, bounded Git
  status/diff summaries, and no mutation on validation failure.
- **AC-004:** Executable helper tests prove legal pitch/plan transitions,
  status-only stability, explicit-only revision increments, accepted-pitch
  status/revision checks, plan pitch pins, and pitch-revision invalidation.
- **AC-005:** `feature-pitch` keeps interviewing, repository/external research,
  shaping, rabbit-hole discovery, blocker resolution, and quality review in
  parent/subagent reasoning while delegating all mechanical artifact checks and
  transitions to the helper.
- **AC-006:** Only a fresh blocker-free complete pitch is shown to the human;
  `accepted` is set only after `Approve pitch`, and a later semantic pitch edit
  increments revision, returns to `draft`, and repeats full review/acceptance.
- **AC-007:** `feature-plan` requires a helper-validated accepted pitch, reasons
  about the complete vertical TDD slice set, and uses helper validation to
  enforce unique IDs, canonical filenames, direct serial dependencies,
  matching pitch revision, and literal complete pitch-AC coverage.
- **AC-008:** Plans remain automated: deterministic failures are fixed, a fresh
  reasoning reviewer judges the whole set, explicit revise transitions precede
  semantic fixes, and only a blocker-free review authorizes the whole-set
  `reviewed` transition without a human plan gate.
- **AC-009:** `feature-build` runs helper status/readiness checks before
  Worktrunk, todo, or writer side effects, then routes one dependency-ready
  slice at a time through worker Red/Green/Refactor and fresh adversarial review.
- **AC-010:** All three skills preserve parent ownership of pitch-level
  decisions, use compatible capability/role preflight, fresh async one-item
  serial runs with item-level progress suppression, and verified wait/status
  terminal barriers without overlapping writers or automatic recovery.
- **AC-011:** A new pitch-level finding always stops for the user; changed pitch
  content restarts review/acceptance and regenerates all plans, while unchanged
  confirmation resumes with bounded evidence. Routine plan/build judgments and
  fixes proceed automatically.
- **AC-012:** Final evidence covers focused tests, deterministic Pi
  discovery/reload/dogfood, source smoke, repository checks, changed files,
  test/review results, residual risks, and authorization-aware source-control
  state without mutating reviewed plans or adding persistent workflow state.

## Residual risks

- The helper can enforce artifact and Git facts but cannot prove that a model
  invoked it at every required point. Small skill-contract tests and manual
  dogfood cover orchestration drift without pretending to prove judgment.
- A strict stdlib parser intentionally accepts only the canonical template
  subset. Its exact-path failures and executable fixtures must make this
  limitation clear rather than growing into a general YAML implementation.
- Standalone skill discovery does not bundle companion tools. Each phase must
  fail closed with named setup guidance.
- Worktrunk routing does not retarget an already running Pi resource loader.
  Manual acceptance must start Pi in the target worktree as required by
  [`AGENTS.md`](../../../AGENTS.md).

## Blocking decisions

None. The helper boundary, fixed command surface, status/revision behavior,
complete-pitch-only human gate, automatic post-acceptance plan/build flow,
reasoning ownership, companion preflight, serial orchestration, and
source-control authorization rules are resolved.

## Proposed vertical-slice map

1. **001 — Feature pitch and deterministic core:** add the installable package,
   shipped Node-stdlib helper, focused executable helper tests, shared artifact
   and orchestration contracts, and `feature-pitch`. Close AC-001 and AC-003–006,
   establish AC-002/AC-004 helper seams, and establish shared AC-010–012 seams.
2. **002 — Feature plan:** add `feature-plan`, its template, deterministic
   accepted-pitch/complete-plan-set validation and plan-set transitions, plus
   reasoning-boundary orchestration tests. Close AC-007–008 and the planning
   parts of AC-010–011. Depends on slice 001.
3. **003 — Feature build:** add `feature-build`, deterministic status/readiness
   checks before reasoning/writer side effects, serial TDD/review orchestration,
   bounded final evidence, and package dogfood. Close AC-009 and remaining
   AC-010–012. Depends on slice 002.
