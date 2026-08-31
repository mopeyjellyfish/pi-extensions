---
status: accepted
---

# Plan: Test effectiveness and performance discovery in `/improve`

Complete this delivery plan before implementation. It covers the accepted pitch at `docs/features/improve-test-analysis/pitch.md` and all 19 acceptance criteria.

## Review evidence

- **Applicability:** Go-targeted guidance. The plan changes how `/improve` routes future Go and Go CLI test analysis through installed `go`, applicable `cobra-viper`, `test-driven-development`, and official Go toolchain evidence.
- **Fixed document:** `docs/features/improve-test-analysis/plan.md` draft before approval.
- **Status:** Approved with questions. The fixed-document Go specification review found no blocker. The parent corrected precedence wording, named obsolete assertions, and resolved package-independence, manual-profile, path, and setup-fingerprint questions.
- **Invalidation:** The review remains valid because the corrections restore accepted precedence and add proof precision without changing the proposed solution, boundaries, authority, or done conditions. Any later material change to Go, Cobra/Viper, or TDD precedence, initial intake, support-budget arithmetic, CI evidence behavior, delivery topology, authority, or done conditions requires a replacement review.

## Execution mode

The caller selected accept-all implementation. Only whole-plan approval confirms accept-all authority for this named plan. Accept-all never authorizes merge, release, deployment, destructive cleanup, CI mutation, or unrelated work. Any material forecast variance returns control to the caller. A delivery-boundary or authority change requires fresh plan approval.

## Setup evidence

The active isolated worktree is `/Users/david/code/personal/pi-extensions/.worktrees/feat-improve-test-analysis` on `feat/improve-test-analysis`. The accepted pitch is commit `0b849696d023557c62364e3ae117f13523b36ddc`. Its verified base is `5e7e2c53b698692c1b98db1555e009f90ac0853a`, the current `origin/main` when the branch was created.

Repository setup completed before the first check:

- Node `v24.18.0` from `.nvmrc`, SHA-256 `8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48`
- Go `go1.26.5` from `.gvmrc`, SHA-256 `9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566`
- `package-lock.json`, SHA-256 `754c35d4a48d3b3b0fc800c4ffc66134722aadc610c3216a7cfad24d2bb21dff`
- Combined setup fingerprint for `.nvmrc`, `.gvmrc`, and `package-lock.json`: `7b515354f2383333f84d4850b0162ef809bce224625ee150c0879495c05740d8`
- `npm ci --ignore-scripts` completed with npm `11.16.0`

Implementation can reuse this setup after it recomputes `cat .nvmrc .gvmrc package-lock.json | shasum -a 256` and confirms the combined fingerprint above plus the required tools. `npm run dev` uses the same algorithm and writes the value to the ignored `node_modules/.pi-setup-fingerprint`. Any mismatch invalidates setup evidence and requires the declared setup again before tests.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                       | Pull request base | Dependencies                     | Checks                                                                                                      | Ownership                                    | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ---------------------------- | ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | `standalone`   | `feat/improve-test-analysis` | `main`            | accepted pitch commit `0b849696` | focused Engineering test, source smoke, manual reload acceptance, `npm run check`, commit and PR validation | current isolated worktree, one Worker writer | none              | 1          | low          |

The pitch, plan, and both implementation slices share this delivery unit and one standalone pull request. They overlap in the Engineering skill, README, and resource tests. Separate pull requests would create conflicting intermediate guidance and no independent merge value.

The unit can contain three atomic commits:

1. the accepted pitch commit `docs: accept improve test analysis pitch`;
2. the accepted plan commit `docs: accept improve test analysis plan`; and
3. one implementation commit `feat(pi-engineering): add test improvement discovery`.

The implementation commit owns both dependent slices because both change one public `/improve` resource contract. Release Please attributes only the package-local implementation files to `pi-engineering`. The feature documents remain root-only.

## Critical path, dependencies, and lanes

The critical path is slice 001, slice 002, frozen-tree verification, publication. There are no parallel implementation lanes. Both slices change:

- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`

Slice 002 also depends on slice 001's test-lane ownership and report-candidate contract. One Worker is the sole writer in the current worktree. The parent owns accepted intent, final diff inspection, assurance selection, and publication handoff.

Forecast:

- active writer lanes: 1
- delivery units: 1
- pull requests: 1 standalone pull request to `main`
- integration points: none outside the independently installable Engineering package
- expensive gates: `npm run smoke:source`, deterministic manual Pi reload acceptance, and root `npm run check`
- likely cascade cost: low because there is no stack, but any concurrent change to the `/improve` skill, prompt, report contract, README, or focused tests invalidates all slice proof

Invalidation map:

- A change to prompt or intake rules invalidates slice 001 focused proof and manual intake acceptance.
- A change to test-lane, Go/TDD/source, or support-budget rules invalidates slice 001 focused proof and all slice 002 recommendations that depend on those rules.
- A change to CI, local-command, hot-case, candidate, or HTML report fields invalidates slice 002 focused proof and manual report acceptance.
- A change to either slice after source smoke invalidates source smoke.
- Any final-tree change invalidates `npm run check`, final diff review, tree attestation, and publication reuse.
- A change to runtime selectors or `package-lock.json` invalidates setup evidence.

## [ ] 001 — Ask for missing improvement depth and establish the adaptive test lane

### Outcome and requirement trace

`/improve` asks one initial multi-question intake whenever Improvement depth, Focus, or Outcome is unanswered. It asks only missing dimensions, preserves explicit input, and stops on user cancel or skip. Test analysis is normal `/improve` behavior, not a separate mode. A bounded evidence-only test lane uses the existing improvement-depth support budget and follows target-repository, Go, applicable Cobra/Viper, TDD, and primary-source constraints.

Traces to AC-001 through AC-006, AC-011, AC-012, AC-015 through AC-018, and the accepted pitch boundaries.

### Seam and files

Public seam: installed `/improve` prompt expansion and the `improve-codebase-architecture` skill instructions consumed by the parent.

Expected files:

- `packages/engineering/prompts/improve.md`
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`
- `docs/features/improve-test-analysis/plan.md`

Do not change `packages/engineering/skills/test-driven-development/SKILL.md`, any Go package skill, package dependencies, or runtime code.

### Dependencies

The accepted pitch commit `0b849696` and matching setup evidence. No implementation slice dependency.

### Execution lane and ownership

`serial` in the current `feat/improve-test-analysis` worktree. One Worker owns all named implementation files. The parent owns the accepted semantics and final verification.

### Red proof

Change `packages/engineering/test/resources.test.ts` first. Replace the three accepted assertions that intentionally become obsolete:

- line 935's empty expansion expectation for `medium improvement depth`;
- line 936's empty expansion expectation that only names the adaptive quick start and inferred scope; and
- line 634's README expectation for adaptive Focus and Outcome without Improvement depth.

The replacement empty-expansion assertion must require an adaptive request for missing Improvement depth, Focus, and Outcome, no preselected level before the question, and `medium` only as the documented `question`-unavailable fallback. Add the remaining contract assertions. The focused test must fail against the accepted pre-implementation skill and prompt because they:

- preselect `medium` in the empty prompt expansion;
- ask only Focus and Outcome in the adaptive quick start;
- do not run intake for every missing dimension;
- do not distinguish tool unavailability from user cancel or skip;
- do not define test analysis as normal `/improve` behavior with an evidence-only lane;
- do not share lane and external-lookup support slots; and
- do not apply the exact target-repository standards → installed `go` → applicable `cobra-viper` → `test-driven-development` → generic guidance chain, with unrelated toolchain evidence alone activating neither Go skill.

Use Markdown resource-contract assertions at the installed prompt and skill seam. Do not create runtime orchestration tests because the package ships guidance, not an orchestration runtime.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

Confirm failure is caused by the missing accepted contract, not setup, syntax, or an unrelated assertion.

### Green proof and checks

Make the minimum guidance changes that satisfy the red proof:

- keep `[low|medium|high|max] [optional scope]` and natural-language argument forwarding;
- replace the empty expansion's silent `medium` choice with an adaptive missing-dimension intake request;
- ask separate Improvement depth, Focus, and Outcome questions in one call only when each dimension is unanswered;
- preserve lightweight orientation for a missing Focus or agent-led `find improvements`, but skip orientation for a specific scope that only lacks level or outcome;
- use `medium` plus conversational choices only when `question` is unavailable;
- stop before discovery when the user skips or cancels;
- state that an explicit test request is an ordinary scope and broad reviews select test analysis from evidence;
- define the evidence-only test lane and its `low`, `medium`, `high`, and `max` shared support-slot behavior;
- apply target-repository standards, then installed `go`, then `cobra-viper` only for Cobra or Viper commands, flags, or CLI configuration, then `test-driven-development`, then generic guidance; unrelated toolchain evidence alone activates neither Go skill;
- allow official Go documentation to support a mechanism while repository evidence and skill constraints remain required for a candidate; and
- bound external lookup by capability, privacy policy, source-disclosure policy, and the shared support budget.

Update the Engineering README with the same public behavior. Then rerun the focused test. A change to any item above invalidates this proof.

### Atomic commit and pull request

No commit at the slice boundary. Keep the passing slice in the shared implementation commit `feat(pi-engineering): add test improvement discovery` within delivery unit 1. The pull request base is `main`; stack position is `standalone`.

### Done when

- The focused red failure was observed for the intended reason.
- The focused test passes after the minimum prompt, skill, README, and contract-test changes.
- Explicit input is not repeated.
- The lane is evidence-only, budgeted, and not a new user-facing mode.
- Go, Cobra/Viper, TDD, and primary-source precedence matches the accepted pitch.
- The diff contains no runtime parser, dependency, production extension, or unrelated skill edit.
- Existing manifest assertions at `packages/engineering/test/resources.test.ts:271-273` continue to prove the independently installable Engineering package has only skill and prompt resources, with no runtime or peer dependency.

## [ ] 002 — Report holistic and hot-case test evidence from local and branch/base CI data

### Outcome and requirement trace

A normal `/improve` review can assess both test effectiveness and performance. It separates holistic suite and CI-stage evidence from measured hot tests. Given comparable branch and base data, it reports refs, SHAs, run identifiers, timing boundaries, samples, distributions, and confounders. It uses provider-neutral read-only CI discovery with a documented GitHub Actions path. The Blueprint Ledger presents test evidence, tradeoffs, source references, and gaps without exposing private data or weakening defect detection.

Traces to AC-006 through AC-010 and AC-013 through AC-019.

### Seam and files

Public seam: test-focused candidates in `improve-codebase-architecture` and the generated Blueprint Ledger report contract.

Expected files:

- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/skills/improve-codebase-architecture/HTML-REPORT.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`
- `docs/features/improve-test-analysis/plan.md`

No report-server runtime change is expected. If implementation needs to change `packages/engineering/skills/improve-codebase-architecture/scripts/report-server.js`, stop and return to planning because that expands the accepted seam and executable test surface.

### Dependencies

Slice 001. It supplies the test-lane evidence ownership, skill precedence, shared support budget, and parent-owned recommendation contract.

### Execution lane and ownership

`serial` after slice 001 in the same worktree and with the same sole Worker.

### Red proof

Extend the focused resource test before guidance changes. The test must fail because the current skill and HTML report contract do not require:

- falsifiability, independent expected values, plausible wrong behavior, and public-seam effectiveness evidence;
- holistic suite commands, packages, shards, setup, cache, retry, and CI-stage boundaries;
- measured hot packages, files, tests, subtests, benchmarks, fixtures, flake, contention, or allocation evidence;
- comparable branch/base workflow, matrix, runner, event, revision, cache, sample, distribution, ref, SHA, and run identity;
- provider-neutral read-only CI plus the allowed GitHub `gh` and REST inspection path;
- explicit non-served temporary artifact destinations and immediate cleanup;
- bounded safe local commands with cache, instrumentation, repetition, shuffle, race, coverage, and parallelism conditions;
- primary-source citations connected to repository evidence; or
- balanced defect-detection and performance tradeoffs in candidate and report fields.

Run the same focused test command. Confirm the intended assertions fail and preserve slice 001 green proof.

### Green proof and checks

Add the minimum complete skill and report contract:

- map accepted behavior and public seams to falsifiable tests with independent expectations;
- treat coverage and test count as signals only;
- separate suite, job, step, package, and test timing boundaries;
- reject summed overlapping parallel subtest elapsed values as suite duration;
- compare only compatible branch/base runs and state every comparability gap;
- use official provider read-only capability, with GitHub list/view/download/checks and REST `GET` as the named path;
- create the report run's unique OS temporary directory before downloads, use a non-served child, and remove artifacts after bounded evidence extraction;
- permit bounded repository-documented local commands after definition and safety inspection, with a question for uncertain external effects;
- record cache and instrumentation conditions and never delete caches to manufacture evidence;
- prefer repository evidence, official toolchain and CI docs, then canonical maintainer sources such as Go team or spf13 material for the exact dependency version;
- omit unsupported external claims and label source gaps;
- report effectiveness risk, plausible missed wrong behavior, suite timing, hot cases, CI comparison, reliability, maintenance, skill constraints, sources, tradeoffs, route, and proof; and
- never rank a faster but weaker test suite as an improvement.

Update `HTML-REPORT.md` so the semantic fallback and structured report data can carry these fields without changing browser authority. Update the README. Rerun the focused test and confirm slice 001 remains green.

Then run the affected-boundary package test:

```sh
npm --workspace @mopeyjellyfish/pi-engineering test
```

A change to skill wording, report fields, or assertions invalidates focused and package evidence. A change to package resources after the package test invalidates it.

### Atomic commit and pull request

After all final checks, commit slices 001 and 002 together as `feat(pi-engineering): add test improvement discovery`. This is the implementation commit in delivery unit 1. Publish one standalone ready pull request from `feat/improve-test-analysis` to `main` through `open-pr` after verified-tree and publication checks.

### Done when

- Focused and workspace Engineering tests pass.
- The report contract separates holistic and hot-case evidence.
- Branch/base claims include comparability and uncertainty.
- CI inspection is read-only and temporary artifacts cannot enter or be served from the target repository.
- Local command evidence is bounded, reproducible, and safety-aware.
- Test-speed recommendations preserve or improve defect detection.
- The independent Engineering package gains no runtime or dependency.

## Final verification, acceptance, and publication

Freeze the complete implementation diff after both slices. Confirm the approved path set is limited to:

- `docs/features/improve-test-analysis/pitch.md`
- `docs/features/improve-test-analysis/plan.md`
- `packages/engineering/prompts/improve.md`
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/skills/improve-codebase-architecture/HTML-REPORT.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`

Run, in order:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
npm run smoke:source
npm run check
```

No workflow or dependency file changes are planned, so `npm run workflows:check` and `npm run security:check` are not required. If the final diff changes those surfaces, stop and return to planning.

Perform manual Pi acceptance from the task worktree in two profiles.

First, start the independently installable Engineering package with ambient discovery disabled:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/engineering
```

1. Confirm `/improve`, `improve-codebase-architecture`, and `test-driven-development` load without conflict diagnostics.
2. Confirm the focused automated test passed before reload.
3. Invoke `/improve` and confirm the unavailable-`question` conversational fallback supplies `medium` only for the unanswered level and presents the other missing choices without claiming tool-backed selection.
4. Enter `/reload` while Pi is idle. Repeat the fallback probe and confirm there are no duplicate registrations or stale instructions.

Then stop that process and start the deterministic root profile from the same worktree:

```sh
npm run dev
```

1. Confirm every expected Engineering resource and the `question`, subagent, web-search, CI, and browser capabilities used by the probe appear once. Record any unavailable optional capability.
2. Invoke `/improve checkout flow`. Confirm one initial call asks Improvement depth and Outcome but not Focus.
3. Cancel the intake. Confirm discovery does not start and the questions are not repeated in prose.
4. Invoke `/improve medium test performance on checkout flow`. Confirm it does not ask level or Focus, asks only missing Outcome, and treats the test request as a normal scope.
5. Enter `/reload` while Pi is idle. Repeat one intake probe and confirm the new behavior remains without duplicate registrations or stale state.
6. Exercise a report-only test-scope probe with bounded local repository evidence. Confirm the Blueprint Ledger contains the accepted test-effectiveness, holistic-suite, hot-case, CI/source-gap, and tradeoff fields. Do not trigger, rerun, or mutate CI.

Editing this checkout does not update a Pi process started elsewhere. All acceptance processes must start inside this task worktree.

After checks, inspect the complete diff for package independence, release attribution, source attribution, no generated or runtime artifacts, no credentials, and no unapproved paths. Select material formal review because the skill changes public orchestration, Go routing, remote CI guidance, and source-disclosure boundaries. QA is not required for exact green-path commands unless a command fails or browser/manual acceptance is ambiguous. If formal review and QA become required, run them concurrently on the same frozen diff, with Reviewer owning intent and Standards and QA owning executable evidence.

Commit the accepted plan before implementation. After implementation, validate the implementation commit message, exact staged tree, branch, base, and clean worktree. Push and open or update one ready standalone pull request only through the accepted `implement` and `open-pr` flow. Do not merge, release, deploy, clean worktrees, or mutate CI.
