---
status: accepted
---

# Plan: Right-sized engineering delivery

Plan the full stack before implementation. Work in dependency order except for the two explicitly parallel-ready package lanes. Each writer owns one isolated worktree. Do not begin a production slice until this whole plan is accepted.

## Delivery topology

| Stack position | Branch                           | Pull request outcome                               | Base       | Execution                                                                        |
| -------------- | -------------------------------- | -------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| 0              | `feat/core-workflow-routing`     | Accepted pitch and complete plan                   | `main`     | Current task worktree                                                            |
| 1              | `feat/commit-workflow`           | Atomic `commit` skill                              | position 0 | Serial foundation                                                                |
| 2              | `feat/github-delivery-workflow`  | `open-pr` and `triage` skills                      | position 1 | Parallel lane A after position 1 exists                                          |
| 3              | `feat/feature-flow-optimization` | Lean Shape and complete upfront planning           | position 2 | Parallel lane B, developed from position 1 then rebased onto verified position 2 |
| 4              | `feat/engineering-routing`       | Router, `/just-do-it`, and implementation delivery | position 3 | Serial integration                                                               |

The accepted Stage 0 action authorizes `commit` validation, push, pull-request creation, and leased stack synchronization for position 0. Each later accepted slice carries the same bounded authority for its named non-default task branch and pull request. No stage authorizes merge, release, deployment, branch deletion, plain/unleased force-push, or hook bypass.

## Stack tooling gate

Stacked delivery requires `gh stack`. Before the first stack mutation, run `gh stack --version`; the current environment provides 0.1.0. If unavailable, stop and provide the exact `gh extension install github/gh-stack` recovery command, but do not install it without explicit authority. Use `gh stack link` for Worktrunk-managed branch chains and `gh stack submit` only for stacks managed by the extension. When a lower branch changes, `gh stack sync` may cascade-rebase and atomically push named task branches with `--force-with-lease` only after recording and verifying expected remote state. Never use plain `--force` or replace a planned stack with separate `gh pr create` calls. After every stack mutation, verify link/sync output and each pull request's title, body, base, head, SHA, and draft state. Use `gh stack view --json` additionally for locally tracked stacks; `gh stack link` intentionally creates no local tracking state for Worktrunk-managed branches.

Positions 0 and 1 already exist as PRs #71 and #72. After this revised plan is accepted, update position 0 through `commit`/`open-pr`, register the existing chain with `gh stack link --base main feat/core-workflow-routing feat/commit-workflow`, then use the stack's leased synchronization path to rebase and atomically update position 1 before publishing position 2. Verify both remote SHAs and PR bases after synchronization.

After position 1 is committed, positions 2 and 3 may use separate Worktrunk worktrees and sole Terra Worker writers. Their files do not overlap. Position 3 may rely only on the accepted names and contracts for `commit` and `open-pr`, not on uncommitted position 2 implementation. Before publication, use `git-rebase-base` to place position 3 above the verified position 2 branch, rerun its focused checks, and verify adjacent ancestry. If that rebase is not clean, stop and serialize the lanes instead. Position 4 starts only after positions 2 and 3 are verified in stack order.

Use bounded Luna Researcher or Utility runs in parallel for factual path/test mapping when useful. Use Terra Worker for each write lane, Luna QA for focused acceptance evidence when useful, Terra Git for Git-owned stage delivery, and Opus Reviewer at fixed review boundaries. These are root-profile optimizations; every production skill keeps a direct-parent fallback and never assumes those agents are installed.

## [x] 001 — Expose atomic commits as `commit`

### Outcome

Users and lifecycle skills can invoke a discoverable `commit` skill for every atomic Conventional Commit without also making that skill own pull-request publication.

### Requirement trace

Pitch: **Focused Git delivery skills**, **Fixed decisions**, **No-gos**. AC-006, AC-009, AC-010.

### Implementation

- Rename `packages/git-conventions/skills/conventional-commit/` to `packages/git-conventions/skills/commit/` and set frontmatter `name: commit`.
- Preserve repository-rule discovery, complete worktree inspection, atomic split planning, explicit-path staging, staged-tree attestation, commitlint validation, and commit verification.
- Make accepted workflow-stage authority a valid explicit commit authorization while preserving an authorization gate for ad hoc use.
- Move pull-request publication and `gh stack` metadata responsibilities out of `commit`; retain only branch/commit topology checks that are necessary to produce atomic units.
- Update `packages/git-conventions/README.md`, agent metadata, and `packages/git-conventions/test/skills.test.ts` for the new public name and narrower boundary.
- Update repository references to `conventional-commit` only where this slice can do so without depending on later skill behavior; later slices update their owning lifecycle text.

### Execution mode

`serial`. Foundation for positions 2–4. One Terra Worker in the position 1 worktree.

### Difficulty

`standard` — public resource rename and contract refocus, with no runtime code.

### Test posture

`tdd` — update the package contract tests before moving the skill.

### Red signal

`npm test -- --run packages/git-conventions/test/skills.test.ts` fails because `skills/commit/SKILL.md` and `name: commit` do not exist and publication boundaries remain in the old skill.

### Green signal

The focused test passes, the old `conventional-commit` skill is absent, packed contents contain `skills/commit/**`, and commit safety assertions remain green.

### Verification

- `npm test -- --run packages/git-conventions/test/skills.test.ts`
- `npm run smoke:source`
- Inspect the package diff and dry-run packed paths.
- At stack publication, verify position 0 is the only parent and position 1 is one atomic commit.

### Commit and pull request

One unit: `feat(git-conventions): expose atomic commit workflow`. Pull request position 1, based on position 0. Use `commit`, then `open-pr` when available; for this bootstrap slice, use the current GitHub CLI reference under the Stage 1 authority and verify exact metadata.

### Done when

The renamed skill is loadable and packed, every prior commit safeguard still has a contract test, PR publication is no longer its responsibility, focused checks pass, and position 1 is published as PR #72 with verified evidence.

## [x] 002 — Add focused pull-request delivery and triage

### Outcome

Users and lifecycle skills can publish approachable standalone or stacked pull requests with `open-pr`, and can safely process review feedback with `triage`.

### Requirement trace

Pitch: **Focused Git delivery skills**, **Stage publication**, **No-gos**. AC-007, AC-008, AC-009, AC-010, AC-011.

### Implementation

- Add `packages/github/skills/open-pr/SKILL.md` with authenticated repository preflight, explicit base/head resolution, remote-head push, commit/diff/check/evidence inspection, standalone delivery, required `gh stack` delivery for planned stacks, verified title/body/base/head/draft metadata, and bounded failure recovery.
- Make `gh stack --version` a required stacked-delivery preflight. Document the external `github/gh-stack` requirement and exact install command without installing it automatically.
- For Worktrunk branches, use `gh stack link --base <trunk> <bottom> ... <top>`; for extension-managed local stacks, inspect and use `gh stack submit`. When a lower branch changes, use bounded `gh stack sync`/leased cascade synchronization with expected-remote verification. Preserve adjacent ancestry, one-commit review units, generated metadata correction, draft/ready verification, stack membership/base/SHA verification, and prohibitions on `gh stack merge`, `gh stack unstack`, and plain `--force`.
- Define an approachable Simplified Technical English pull-request body contract: problem, outcome, important implementation details, tests/evidence, risks or none, and stack position/dependencies. Respect repository templates and exact technical identifiers.
- Add `packages/github/skills/triage/SKILL.md` to resolve an explicit PR, current-branch PR, or a PR URL recorded in current conversation context; fetch bounded conversation comments, reviews, checks, and unresolved GraphQL threads; classify actionable, invalid, obsolete, duplicate, and question-only feedback.
- Require valid fixes to return through `implement`, then `commit`, then `open-pr`; draft exact responses before mutation; resolve only threads whose concern is addressed and verified. Never infer approval, merge, or destructive authority.
- Keep `github-cli` as the generic low-level reference and share/link focused references rather than duplicate drifting command guidance.
- Update `packages/github/README.md` and `packages/github/test/skills.test.ts` to test discovery, packed resources, authority, stack metadata, plain-language PR sections, all feedback surfaces, fix routing, replies, and thread-resolution safeguards.

### Execution mode

`parallel-ready` lane A after slice 001. Separate position 2 worktree and sole Terra Worker. It does not share files with slice 003.

### Difficulty

`hard` — remote mutations, stacked metadata, and review-thread resolution are safety-sensitive.

### Test posture

`tdd` — add resource-contract tests for both skills before authoring them.

### Red signal

`npm test -- --run packages/github/test/skills.test.ts` fails on missing `open-pr`/`triage` resources and missing publication, evidence, classification, response, and resolution contracts.

### Green signal

The focused GitHub tests pass; dry-run packing includes both skills; their guidance requires `gh stack` for planned stacks, keeps mutations bounded, uses body files for multiline text, verifies actual stack and pull-request metadata, and prohibits merge/destructive actions.

### Verification

- `npm test -- --run packages/github/test/skills.test.ts`
- `npm run smoke:source`
- Dry-run pack and inspect all new Markdown resources.
- Run `gh stack --version` and test the documented preflight/fail-closed contract without changing a remote stack.
- Opus Reviewer fixed-diff review focused on remote authority, `gh stack` correctness, unsafe shell interpolation, incomplete feedback surfaces, and false thread resolution.

### Commit and pull request

One unit: `feat(github): add pull request delivery workflows`. Pull request position 2, based on position 1. Publish through `commit` and `open-pr` using `gh stack link`; verify title/body/base/head, stack number, and position.

### Done when

Both skills are independently loadable, document the required external `gh stack` tooling, are packed and contract-tested, are reviewed for remote safety, and position 2 is published through a verified stack.

## [x] 003 — Streamline Shape and plan the whole delivery upfront

### Outcome

Shape produces a lean decision document, and planning produces one complete implementation and pull-request plan with safe parallel lanes before any production implementation begins.

### Requirement trace

Pitch: **Lean Shape and complete planning**, **Stage publication**, **Fixed decisions**. AC-003, AC-004, AC-005, AC-009, AC-010.

### Implementation

- Replace `packages/feature-flow/skills/shape/templates/pitch.md` with a compact contract: problem/evidence, proposed solution, boundaries and no-gos, only decision-relevant research/risks, authority, and observable acceptance criteria.
- Tighten `packages/feature-flow/skills/shape/SKILL.md` so agents omit empty or non-decision-changing research and avoid restating repository truth. Preserve worktree-first routing, full-document review, parent judgment, and explicit acceptance.
- Replace the plan template's “work first unchecked slice” framing with a complete upfront delivery contract. For every slice require outcome, requirement trace, seam/files, dependencies, execution lane/worktree ownership, red/green proof, checks, atomic commit, PR base/stack position, and done conditions.
- Update `planning-changes` to map the whole accepted scope before implementation, identify critical path and independent lanes, reject overlapping parallel writers, and optimize stack order before approval. Planning must not alternate plan/work/plan/work.
- Permit bounded role-capability support: cheap factual mapping, mechanical inventory, QA test-surface checks, and one independent plan review when useful. Keep product/architecture/slice decisions in the parent, preserve direct-parent fallback, and keep Sol exceptional and explicitly approved.
- Change approval language to make bounded stage publication explicit: accepted pitch publishes then plans; accepted plan publishes then implements. For planned stacks, require `open-pr` to use `gh stack`; stop cleanly when `commit`, `open-pr`, or required stack tooling is unavailable rather than embedding ad hoc Git commands.
- Update `/shape`, `/plan`, `packages/feature-flow/README.md`, and `packages/feature-flow/test/resources.test.ts` for lean templates, complete-plan requirements, role boundaries, and delivery transitions.

### Execution mode

`parallel-ready` lane B after slice 001. Develop in a separate position 3 worktree from position 1 while lane A runs. Before publication, rebase position 3 onto verified position 2, run the focused test and smoke again, and stop on any conflict or contract drift.

### Difficulty

`hard` — changes approval semantics, planning completeness, parallel safety, and remote-action authority across the lifecycle.

### Test posture

`tdd` — first replace the current assertions that encode verbose headings and first-slice/serial-only framing with the accepted lean and complete-plan contract.

### Red signal

`npm test -- --run packages/feature-flow/test/resources.test.ts` fails because the templates lack delivery topology and the skills do not require complete upfront planning, optimized safe lanes, or bounded stage publication.

### Green signal

Focused tests pass; `/shape` and `/plan` expand; templates are materially shorter while retaining every accepted decision field; the package packs and source-smokes after the stack rebase.

### Verification

- `npm test -- --run packages/feature-flow/test/resources.test.ts`
- `npm run smoke:source` before and after rebasing onto position 2
- Compare old/new template line and heading counts without using size alone as correctness proof.
- Opus Reviewer fixed-diff review against accepted pitch and plan safety boundaries.

### Commit and pull request

One unit: `feat(feature-flow): streamline staged delivery planning`. Pull request position 3, based on position 2 after the verified rebase. Publish through `commit` and `open-pr`; verify adjacency and body evidence.

### Done when

A fresh agent can produce and approve a short pitch and one complete plan, identify safe parallel work and PR order, publish accepted stages only through focused skills, and all focused/rebase checks pass.

## [x] 004 — Route work by impact and add `/just-do-it`

### Outcome

Coding requests take the smallest safe route; mechanical requests immediately receive one Worker; verified implementation units automatically enter the commit and pull-request delivery path after explicit acceptance.

### Requirement trace

Pitch: **Right-sized routing**, **Fast mechanical path**, **Efficient delegation**, **Stage publication**. AC-001, AC-002, AC-005, AC-009, AC-010.

### Implementation

- Update `packages/engineering/skills/developing-changes/SKILL.md` with the four-route decision model: just-do-it, implement now, plan first, Shape then plan. Define thresholds using uncertainty, reversibility, risk, affected boundaries, and coordination cost; do not use line/file count alone. Ask one focused question only for a material boundary ambiguity.
- Add `packages/engineering/skills/just-do-it/SKILL.md` and `packages/engineering/prompts/just-do-it.md`. With arguments, worktree setup is first, then immediately launch one fresh Worker with exact scope, authority, objective before/after proof, required checks, and output. Without arguments, ask only for the mechanical request. If the Worker finds ambiguity, behavior design, security/migration risk, or expanding scope, stop and return to the router.
- Keep the parent responsible for diff inspection and evidence. Use Luna Utility/QA for bounded inventory or validation only when it shortens the critical path; use Terra Worker as sole writer and Opus Reviewer at the fixed final boundary. Preserve direct-parent fallback and explicit Sol approval.
- Update `implement` to consume the complete accepted plan, execute eligible lanes in planned dependency order, and avoid replanning between slices. Automatically run fixed review at a completed unit, then present an explicit **Accept and publish** action whose acceptance invokes `commit` and `open-pr` without a second mutation prompt.
- Make `/just-do-it` invocation itself the bounded implementation-and-publication authority for its named branch after verification. It must not authorize merge, deployment, force-push, cleanup, or unrelated changes.
- Remove lifecycle instructions for ad hoc commit/push/PR commands and stop with recovery evidence when focused delivery skills or required `gh stack` tooling are unavailable.
- Update `packages/engineering/README.md`, prompt tests, packing assertions, routing tests, implementation evidence tests, and root-profile documentation where it describes the curated workflow.

### Execution mode

`serial` integration after slices 002 and 003 are verified in stack order. One Terra Worker in the position 4 worktree. Bounded Luna mapping/QA may run read-only in parallel; no second writer shares the worktree.

### Difficulty

`hard` — cross-lifecycle routing, delegation, approval, and remote delivery integration.

### Test posture

`tdd` — add failing prompt expansion, skill packing, routing matrix, immediate Worker handoff, reroute, direct-parent fallback, and accepted-delivery contract assertions first.

### Red signal

`npm test -- --run packages/engineering/test/resources.test.ts` fails because `/just-do-it` is absent, routing lacks impact tiers, implementation can replan slice-by-slice, and accepted work does not invoke focused delivery.

### Green signal

Focused Engineering tests pass; `/just-do-it remove Y from all files` expands with the exact request and immediate Worker contract; all four routes, fallback behavior, review boundary, and bounded publication are present and packed.

### Verification

- `npm test -- --run packages/engineering/test/resources.test.ts`
- `npm run smoke:source`
- Run relevant package tests for all four changed packages.
- Start deterministic Pi from the final worktree, confirm `/just-do-it`, `commit`, `open-pr`, and `triage` discover without duplicate diagnostics, run focused tests, enter `/reload`, and exercise routing/prompt discovery without performing an unwanted remote mutation.
- `npm run check` after the final edit.
- Inspect `gh stack view --json` for locally tracked stacks, or verified `gh stack link` output plus structured PR metadata for Worktrunk-managed stacks; inspect final diffs, adjacent ancestry, review units, pull-request bases, package boundaries, packed resources, and absence of runtime artifacts.
- Opus Reviewer final fixed-stack review against the accepted pitch and whole plan; return material findings to the owning Terra Worker and reverify.

### Commit and pull request

One unit: `feat(engineering): route right-sized delivery`. Pull request position 4, based on position 3. Publish through `commit` and `open-pr` using `gh stack`; verify title/body/base/head, checks, evidence, stack number, and order.

### Done when

All acceptance criteria are demonstrated, required checks pass on the final stack, the deterministic Pi session discovers and reloads the resources, every stage uses focused Git delivery, all review findings are resolved or reported, and no pending implementation slice remains.
