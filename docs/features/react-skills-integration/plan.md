---
status: accepted
---

# Plan: React skills integration

Replace the shallow React implementation skill with deeper React guidance. Add
React Native and React View Transition skills. Strengthen the existing web UI
audit without adding a mutable runtime-fetch contract.

## Accepted intent

- Start from `origin/main` in the isolated `feat/react-skills-integration`
  worktree.
- Replace `react-interface` with `react-best-practices`.
- Preserve the supplied `react-best-practices` guide and copy every file from
  the upstream `rules/` directory without rewriting its rule content.
- Add the upstream React Native and React View Transition skill content.
- Integrate the new skills into package routing, agent profiles, documentation,
  and deterministic resource tests.
- Improve `interface-craft` audit coverage with applicable Web Interface
  Guidelines. Do not copy the live-fetch skill verbatim.
- Pin provenance to `vercel-labs/agent-skills` commit
  `063bee94c3f4df8453406c830b0a7df0f2860278` and
  `vercel-labs/web-interface-guidelines` commit
  `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`.

## Review evidence

- **Applicability:** `not applicable` because this plan does not change Go
  source, a Go module, a Go CLI, or Go guidance.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

## Execution mode

Checkpointed implementation. Whole-plan approval authorizes this one delivery
unit. It does not authorize merge, release, deployment, destructive cleanup, or
unrelated work.

## Module design

The discovered skill is the public seam. Keep that seam small and deepen each
skill through on-demand rule or reference files:

- `react-best-practices` owns React and Next.js implementation and performance
  guidance. Its `rules/` directory contains the complete upstream rule set.
- `react-native-skills` owns React Native and Expo guidance. It remains separate
  because its platform assumptions and dependencies differ from web React.
- `react-view-transitions` owns the experimental React View Transition workflow
  and its focused references.
- `interface-craft` remains the one web UI audit seam. Merge applicable stable
  checks there instead of adding an overlapping `web-design-guidelines` skill
  or a `WebFetch` dependency.

Target-repository instructions, installed framework versions, existing
components, and measured evidence override generic recommendations. Third-party
libraries shown in examples are options, not implicit dependencies.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                          | Pull request base | Dependencies | Checks                                                         | Ownership                   | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ------------------------------- | ----------------- | ------------ | -------------------------------------------------------------- | --------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | standalone     | `feat/react-skills-integration` | `origin/main`     | none         | focused frontend resource tests, package test, `npm run check` | active worktree, one writer | none              | 1          | low          |

The plan and implementation share one delivery unit and one pull request. No
parallel writer is useful because package routing, resource tests, and profile
metadata overlap.

## Critical path, dependencies, and lanes

The critical path is serial: establish failing resource contracts, import and
adapt the skill resources, update every caller, then run package and repository
checks. The forecast is one active lane, one delivery unit, one pull request,
and no integration point. The expensive gate is `npm run check`. A change to
skill names invalidates all route and discovery tests. A change to vendored
content invalidates source-inventory and provenance checks. A change to audit
content invalidates the focused audit contract. Any edit after final checks
invalidates the affected focused proof and the final repository check.

## [x] 001 — React skill resources have complete deterministic contracts

### Outcome and requirement trace

Focused tests fail until the package exposes the selected skill names, contains
all upstream source files, removes the old `react-interface` seam, records exact
source pins, and keeps target-repository precedence.

### Seam and files

Public seam: Pi skill discovery under
`packages/frontend-developer/skills/`.

Likely files:

- `packages/frontend-developer/test/resources.test.ts`
- `test/tooling/packages.test.ts`
- `packages/frontend-developer/skills/react-best-practices/**`
- `packages/frontend-developer/skills/react-native-skills/**`
- `packages/frontend-developer/skills/react-view-transitions/**`

### Dependencies

None.

### Execution lane and ownership

Serial in the active worktree. One writer owns all files.

### Red proof

Add deterministic resource tests for the three discovered skill names, exact
rule counts and filenames, required view-transition references, source commit
pins, target-repository precedence, and absence of `react-interface`. Run the
focused resource test and observe the intended failures before importing the
resources.

### Green proof and checks

Run:

```sh
npm test -- --run packages/frontend-developer/test/resources.test.ts
```

A change to a skill name, rule inventory, reference inventory, or provenance
statement invalidates this proof.

### Atomic commit and pull request

Include the tests and all skill resources in the delivery unit's package-owned
feature commit. The pull request base is `origin/main`.

### Done when

- The three skills are discoverable under their accepted local names.
- The React and React Native rule inventories match the pinned upstream source.
- The React View Transition references match the pinned upstream source.
- The old `react-interface` skill is absent.
- Generic guidance cannot silently override target repository truth.

## [x] 002 — All React callers route to the deeper skills

### Outcome and requirement trace

Frontend workflow skills, planning and implementation guidance, the Worker
profile, root profile documentation, and tests route React work through
`react-best-practices`. React Native and view-transition tasks load only their
applicable focused skill.

### Seam and files

Public seams: skill descriptions, workflow routing text, and the Worker allowed
skill list.

Likely files:

- `packages/frontend-developer/skills/frontend-development/SKILL.md`
- `packages/frontend-developer/skills/interface-design/SKILL.md`
- `packages/frontend-developer/README.md`
- `packages/engineering/skills/implement/SKILL.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `agents/worker.md`
- `README.md`
- related package and root resource tests

### Dependencies

Slice 001 defines the accepted skill names and files.

### Execution lane and ownership

Serial in the active worktree. One writer owns all files.

### Red proof

The Slice 001 and existing profile tests fail while callers still name
`react-interface` or omit the new focused skills.

### Green proof and checks

Run:

```sh
npm --workspace @mopeyjellyfish/pi-frontend-developer test
npm test -- --run packages/engineering/test/resources.test.ts packages/feature-flow/test/resources.test.ts test/tooling/packages.test.ts
```

A later route, skill-name, profile, or package documentation edit invalidates
the applicable command.

### Atomic commit and pull request

Keep caller updates with the feature commit because they are required for the
new public seam to work. The pull request base is `origin/main`.

### Done when

- No production route or profile names `react-interface`.
- React Native guidance does not apply to ordinary web React tasks.
- View-transition guidance loads only for applicable animation work.
- Root and package documentation list the complete skill surface.

## [x] 003 — Web UI audits gain stable guideline coverage without remote instructions

### Outcome and requirement trace

`interface-craft` remains the single web UI review entrypoint and adds applicable
missing checks from the pinned Web Interface Guidelines. It does not require
`WebFetch`, fetch mutable instructions, copy Vercel-specific copywriting rules,
or create a second overlapping audit skill.

### Seam and files

Public seam: `interface-craft` audit routing and report contract.

Likely files:

- `packages/frontend-developer/skills/interface-craft/SKILL.md`
- `packages/frontend-developer/skills/interface-craft/references/audit.md`
- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/README.md`
- `packages/frontend-developer/NOTICE.md`

### Dependencies

None, but serialize with Slices 001 and 002 because the files and tests overlap.

### Execution lane and ownership

Serial in the active worktree. One writer owns all files.

### Red proof

Add focused assertions for the missing audit areas: unobscured focus, resilient
forms and paste behavior, URL/deep-link state, hydration safety, locale-aware
formatting, safe areas, media alternatives, and concise `file:line` evidence.
The assertions fail against the current audit reference.

### Green proof and checks

Run:

```sh
npm test -- --run packages/frontend-developer/test/resources.test.ts
```

Any later audit, attribution, or report-format edit invalidates this proof.

### Atomic commit and pull request

Keep the audit strengthening and required MIT provenance with the package feature
commit. The pull request base is `origin/main`.

### Done when

- Existing `interface-craft` requests route to the strengthened audit.
- The audit distinguishes portable checks from Vercel-specific preferences.
- Reviews work offline with installed target-repository capabilities.
- The package records the pinned upstream source and MIT copyright.

## [x] 004 — Package and repository verification passes

### Outcome and requirement trace

The independently installable frontend package includes all resources and the
private root profile discovers them exactly once.

### Seam and files

All changed files in the delivery unit plus package manifests and validation
scripts as verification inputs.

### Dependencies

Slices 001 through 003.

### Execution lane and ownership

Serial parent verification after the writer stops.

### Red proof

No manufactured failing test. This slice verifies integration after the
behavior-focused red/green proofs.

### Green proof and checks

Run the focused tests first, then:

```sh
npm run smoke:source
npm run check
```

Inspect `git diff --check`, the complete diff, package file inventory, and Git
status. Any final edit invalidates the affected focused check and `npm run check`.

### Atomic commit and pull request

The verified delivery unit uses one package-scoped Conventional Commit. Plan
approval authorizes the bounded commit and later pull-request publication. It
does not authorize merge.

### Done when

- Focused and full checks pass against the final tree.
- Package resources and licenses are complete.
- No generated, temporary, credential, session, or cache artifact is included.
- The final diff stays within the accepted files and intent.
