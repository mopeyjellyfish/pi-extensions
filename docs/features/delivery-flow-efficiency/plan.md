---
status: accepted
---

# Plan: Fast, evidence-driven delivery

Complete this delivery plan before implementation. It uses one delivery unit,
one branch, one pull request, one serial writer lane, focused feedback for each
vertical slice, and one full validation and review boundary.

## Delivery topology

This is **not a stack**.

| Delivery unit | Branch                          | Pull request                | Base   | Vertical slices | Lane/worktree owner                           |
| ------------- | ------------------------------- | --------------------------- | ------ | --------------- | --------------------------------------------- |
| 1             | `feat/delivery-flow-efficiency` | #78; verify before mutation | `main` | 001–003         | serial; current isolated worktree; one writer |

The accepted pitch, this plan, and implementation share this branch and pull
request. The current lifecycle published the pitch before this optimization
exists; implementation changes future Shape and planning behavior so a
single-delivery-unit workflow publishes once after the unit is stable. Plan
acceptance updates the existing PR under current authority; it does not create a
new branch, pull request, or stack position.

### Why one delivery unit

All slices change one lifecycle contract: planning chooses vertical slices and
delivery units, implementation uses their feedback and validation boundaries,
and publication consumes the resulting stable unit. None has useful independent
merge value without the others. Separate pull requests would duplicate contract
review, package smoke, CI, and synchronization while leaving intermediate
behavior inconsistent.

The delivery unit may contain multiple atomic commits. Commit boundaries follow
coherent package-owned behavior and do not imply separate branches or pull
requests.

## Critical path, lanes, and efficiency forecast

Critical path:

1. Define shared vocabulary and the planning model.
2. Make implementation execute vertical feedback and invalidation-aware gates.
3. Align publication and failure recovery with stable delivery units.
4. Run integrated proof, one fixed review, and one publication update.

There is one serial writer lane because all slices share lifecycle vocabulary,
resource tests, and integration behavior. A parallel writer would add synthesis
and conflict risk without shortening the dependency path. Reuse this worktree
and one writer across slices. Use bounded read-only support only for independent
final review or a concrete factual gap.

Forecast:

- active writer lanes: 1;
- worktrees: 1;
- delivery units: 1;
- branches and pull requests: 1 existing branch and PR;
- planned stack operations and cascade rebases: 0;
- focused feedback gates: one package test per owning slice;
- integration gates: the three owning package tests plus resource packing and
  source smoke;
- expensive stable-boundary gates: one complete repository check, one
  deterministic Pi reload acceptance, one fixed review, and one GitHub CI run
  after final publication;
- Git operations: preserve atomic commits, then batch the final PR update after
  the delivery unit is stable.

Pause and revise this topology if work reveals an independently valuable or
security-sensitive unit, overlapping ownership that cannot stay serial, a slice
that cannot pass in the shared branch, or coordination and repeated validation
materially exceed this forecast.

## Validation invalidation map

| Changed surface                                   | Immediate evidence invalidated                                                     | Stable-boundary requirement                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Feature-flow planning, Shape, or templates        | Feature-flow resource tests, prompt expansion, package packing                     | Owning tests, integrated resource tests, source smoke, full required checks |
| Engineering implementation, TDD, routing, or docs | Engineering resource tests, prompt expansion, package packing                      | Owning tests, integrated resource tests, source smoke, full required checks |
| GitHub publication, triage, or Actions guidance   | GitHub skill tests and package packing                                             | Owning tests, integrated resource tests, source smoke, full required checks |
| Shared workflow vocabulary or root docs           | Markdown validation and every owning contract test that consumes the term          | Integrated resource tests, source smoke, full required checks               |
| Accepted pitch or plan documents                  | Markdown validation                                                                | Markdown validation and full required checks                                |
| Test-only revision                                | The changed test's owning focused run and any production contract it newly exposes | Full required checks before publication                                     |

Recorded evidence is reusable only while its covered surface is unchanged.
Every revision reruns its invalidated focused signal. The complete repository
check still runs once after the final edit, regardless of reused intermediate
evidence.

## [ ] 001 — Plan vertical slices and right-sized delivery units

### Outcome and requirement trace

A planner identifies observable vertical slices first, then groups them into the
fewest coherent delivery units. Branches and pull requests follow independent
review, ownership, rollback, risk, merge value, and critical-path economics—not
file, package, slice, or commit count. Single-unit pitches and plans stay with
implementation for one publication boundary.

Trace: AC-001, AC-002, AC-003, AC-004, AC-010, AC-011, AC-012, AC-013.

### Seam and files

Public seams:

- shared `slice` and `delivery unit` vocabulary;
- Shape-to-plan publication behavior;
- `planning-changes` complete-plan contract;
- the pitch and plan templates consumed by fresh agents.

Likely files:

- `CONTEXT.md`;
- `packages/feature-flow/skills/shape/SKILL.md`;
- `packages/feature-flow/skills/planning-changes/SKILL.md`;
- `packages/feature-flow/skills/shape/templates/pitch.md`;
- `packages/feature-flow/skills/shape/templates/plan.md`;
- `packages/feature-flow/README.md`;
- `packages/feature-flow/test/resources.test.ts`.

### Dependencies

Accepted pitch only. This slice defines terms consumed by slices 002 and 003.

### Execution lane and ownership

`serial`. The delivery-unit writer owns all listed files in the current isolated
worktree.

### Red proof

Update `packages/feature-flow/test/resources.test.ts` first so it fails because
the current plan still maps every slice directly to an atomic commit and pull
request, does not define delivery-unit grouping or stack economics, and still
publishes accepted pitch and plan stages separately by default.

Focused command:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts
```

The intended red failure must be a missing workflow contract, not setup, syntax,
or an unavailable tool.

### Green proof and checks

The focused test passes and proves:

- vertical slices, delivery units, atomic commits, branches, and PRs are distinct;
- each behavioral slice records a narrow deterministic red/green signal;
- one delivery unit and PR is the default;
- every stack position needs independent value, check viability, integration
  dependency, CI fan-out, and justified cascade cost;
- planning documents share implementation publication unless independently
  valuable;
- the plan records critical-path forecast, invalidation map, and mid-flight
  correction trigger;
- package independence and direct-parent fallback remain intact;
- negative contract assertions reject repository-specific names, absolute paths,
  concrete project commands, CI provider assumptions, and private agent or model
  names in the changed portable guidance.

Then run package dry-run packing and Markdown validation for changed resources.

### Atomic commit and pull request

Two ordered atomic commits after green:

1. `docs: define delivery unit vocabulary` for `CONTEXT.md`.
2. `feat(feature-flow): size delivery by review value` for the package-owned
   planning behavior.

It remains inside delivery unit 1 on branch `feat/delivery-flow-efficiency` and
existing PR #78. It does not publish independently.

### Done when

A fresh planner can derive small testable vertical slices while selecting one
coherent branch by default, rejecting a needless stack, and recording why a real
split repays its cost.

## [ ] 002 — Execute focused feedback and invalidation-aware verification

### Outcome and requirement trace

Implementation keeps a fast deterministic red/green loop for each vertical
behavior, integrates dependent slices before broad validation, reuses evidence
only while its covered surface is unchanged, and runs every required check once
at the stable delivery-unit boundary. One serial writer and worktree continue
through the unit; delegation and review must repay fixed coordination cost.

Trace: AC-002, AC-005, AC-006, AC-007, AC-008, AC-010, AC-012, AC-013.

### Seam and files

Public seams:

- `implement` execution and evidence contract;
- `test-driven-development` vertical feedback method;
- `developing-changes` and `just-do-it` exemption from planned forecast overhead;
- Engineering package documentation.

Likely files:

- `packages/engineering/skills/implement/SKILL.md`;
- `packages/engineering/skills/test-driven-development/SKILL.md`;
- `packages/engineering/skills/developing-changes/SKILL.md`;
- `packages/engineering/skills/just-do-it/SKILL.md` only if needed to keep the
  bounded route explicit;
- `packages/engineering/README.md`;
- `packages/engineering/test/resources.test.ts`.

### Dependencies

Slice 001 vocabulary and plan contract.

### Execution lane and ownership

`serial`. The same writer and worktree continue. Do not launch a second writer
or a fresh implementation agent merely because the package boundary changes.

### Red proof

Add Engineering contract assertions first. They fail because current guidance
runs required completion checks after each coherent edit, does not distinguish
focused, affected-boundary, integration, and stable-boundary evidence, and does
not require delegation benefit or mid-flight topology correction.

Focused command:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

### Green proof and checks

The focused test passes and proves:

- one writer and worktree are reused for a serial delivery unit;
- each vertical behavior follows narrow red, green, refactor, then integration;
- the plan's invalidation map controls intermediate reverification;
- unchanged evidence may be reused but the complete required-check set cannot;
- formal review occurs once at a stable completed delivery unit;
- material review revisions return to the same writer and rerun invalidated
  evidence;
- delegation states critical-path, parent-context, or independent-evidence
  benefit;
- bounded one-unit routes do not acquire forecast or topology overhead;
- observed coordination variance pauses further delivery steps and seeks fresh
  approval only when accepted boundaries or authority change;
- negative contract assertions reject repository-specific names, absolute paths,
  concrete project commands, CI provider assumptions, and private agent or model
  names in the changed portable guidance.

Run package packing and Markdown validation after green.

### Atomic commit and pull request

One atomic package-owned commit:

`feat(engineering): focus verification on invalidated evidence`

It remains in delivery unit 1 and existing PR #78. It does not publish
independently.

### Done when

A fresh implementation agent can stay in a fast public-seam feedback loop,
knows exactly when broader checks become necessary, performs one complete final
gate, and does not create avoidable agents, worktrees, reviews, or validation
cycles.

## [ ] 003 — Publish stable units and diagnose before retry

### Outcome and requirement trace

Publication consumes one stable reviewed delivery unit, permits multiple atomic
commits in one PR, batches related Git and PR operations, and rejects stacks
that lack independent value. Remote failures are diagnosed from configuration,
triggering event, current state, and logs before one bounded correction rather
than being retried blindly.

Trace: AC-001, AC-003, AC-004, AC-005, AC-008, AC-009, AC-011, AC-012, AC-013.

### Seam and files

Public seams:

- `open-pr` standalone/stack selection and bounded recovery;
- `triage` handling of failed checks;
- GitHub Actions inspection guidance;
- GitHub package documentation and contract tests;
- root lifecycle documentation where it describes delivery units.

Likely files:

- `packages/github/skills/open-pr/SKILL.md`;
- `packages/github/skills/triage/SKILL.md`;
- `packages/github/skills/github-cli/references/actions.md`;
- `packages/github/README.md`;
- `packages/github/test/skills.test.ts`;
- `README.md`.

The atomic commit workflow remains the owner of commit splitting. Stack
positions keep the existing one-commit review-unit safeguard; this slice does
not relax `one-commit review units` or its contract assertion. Change
`packages/git-conventions` only if another exact conflicting contract is proven
during the red test; otherwise leave it untouched.

### Dependencies

Slices 001 and 002. Publication must consume their shared delivery-unit and
stable-boundary definitions.

### Execution lane and ownership

`serial`. The same writer and worktree continue through final integration.

### Red proof

Add GitHub contract assertions first. They fail because standalone publication
does not state that one delivery unit may contain multiple verified atomic
commits, planned stacks do not require stated economics, and bounded recovery
does not inspect configuration and triggering event before one correction.

Focused command:

```sh
npm test -- --run packages/github/test/skills.test.ts
```

### Green proof and checks

The focused test passes and proves:

- standalone publication is the default for one coherent delivery unit;
- one standalone PR may contain multiple verified atomic commits, while stack
  positions keep one-commit review units;
- a stack requires independent value and check viability at each position plus
  justified integration, fan-out, and cascade cost;
- related publication operations wait until the unit is stable and are batched
  where the selected delivery mechanism safely supports it;
- recovery inspects configuration, triggering event, current remote state, and
  bounded logs before one corrective action;
- rerunning the same failed event without new evidence is not diagnosis;
- publication pauses and reports the variance instead of continuing when
  observed coordination cost materially exceeds the accepted forecast;
- negative contract assertions reject repository-specific names, absolute paths,
  and private profile or model names while preserving GitHub-specific terms
  required by this package;
- existing authentication, shell-safety, metadata verification, leased rewrite,
  and no-destructive-action safeguards remain intact.

Run package dry-run packing and Markdown validation after green.

### Atomic commit and pull request

One atomic package-owned commit:

`feat(github): publish stable delivery units`

Root documentation needed to explain the integrated outcome may accompany the
owning feature commit. All commits remain in existing PR #78.

### Done when

A fresh publication agent chooses one PR for one coherent delivery unit, can
justify every stack position before creating it, and diagnoses a current remote
failure before attempting a bounded correction.

## Integrated stable-boundary proof

After all three slices are green and after the final edit, steps 1–3 are a fast
pre-gate signal that avoids spending the complete check on an obvious failure.
Skip them when the complete check in step 4 already passed on the current tree,
because it subsumes them.

1. Run the three owning focused suites together:

   ```sh
   npm test -- --run \
     packages/feature-flow/test/resources.test.ts \
     packages/engineering/test/resources.test.ts \
     packages/github/test/skills.test.ts
   ```

2. Run prompt expansion, package dry-run packing through the owning tests,
   Markdown validation, and `git diff --check`.
3. Run `npm run smoke:source` once for cross-package loading.
4. Run `npm run check` once with the required Node and Go toolchains and with
   ambient user configuration isolated when it would alter deterministic tests.
5. Start deterministic Pi from this worktree, verify the changed resources load
   without duplicate diagnostics, enter `/reload` while idle, and exercise the
   Shape, planning, implementation, and publication guidance without performing
   an unintended remote mutation.
6. Inspect the complete diff and requirement trace. Confirm one branch, one PR,
   no stack, no extra worktree, and no pending plan slice.
7. Run one fresh fixed-point review over `main..HEAD` through the configured
   reviewer capability, or the direct parent with `code-review` when unavailable.
   Return material findings to the same writer, rerun only invalidated focused
   evidence, then rerun the complete required final gate before publication.
8. Use `commit` to preserve the approved atomic commits, then use `open-pr` once
   to publish the stable reviewed delivery unit, updating the existing pull
   request when it still exists and creating it otherwise. Verify exact
   title, body, base, head, SHA, ready state, and required CI.

## Delivery-unit done conditions

Mark every slice `[x]` only after its focused green proof and required dependent
integration hold. Delivery unit 1 is complete when:

- AC-001 through AC-013 are traced to passing contract evidence;
- production guidance contains no repository-specific paths, package names,
  commands, CI provider assumptions, agent names, model names, or fixed timing
  thresholds from the motivating project;
- the complete required check set and manual reload acceptance pass after the
  final edit;
- one fixed review reports no unresolved material finding;
- the verified delivery pull request contains the reviewed atomic commits on one
  branch and its current CI is green;
- no merge, release, deployment, branch deletion, destructive cleanup, bypass,
  or unrelated remote mutation occurs.
