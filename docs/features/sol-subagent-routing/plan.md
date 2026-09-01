---
status: accepted
---

# Plan: Sol subagent routing and Claude advice

Complete this delivery plan before implementation. It covers the accepted model
routing, implementation delegation, adviser capability, verification, and
publication boundary.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

The completed Fable 5 advisory pass informed the accepted pitch. Do not run a
second independent plan review unless the human selects **Independent review**.

## Execution mode

The selected mode is **accept-all implementation**. Whole-plan approval confirms
this authority only for this named plan. It never authorizes merge, release,
deployment, destructive cleanup, or unrelated work.

Accept-all execution pauses for setup, test, check, commit, or publication
failure. It also pauses for a material review finding, material forecast
variance, or a change to accepted scope, dependencies, delivery boundaries, or
authority.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                            | Pull request base | Dependencies | Checks                                                                                | Ownership                              | Integration point | CI fan-out       | Cascade cost |
| ------------- | ---------- | -------------- | --------------------------------- | ----------------- | ------------ | ------------------------------------------------------------------------------------- | -------------------------------------- | ----------------- | ---------------- | ------------ |
| 1             | standalone | `standalone`   | `chore/subagent-routing-defaults` | `main`            | none         | focused tests, package checks, source smoke, `npm run check`, live profile acceptance | one Worker in the active task worktree | final frozen diff | one pull request | low          |

The pitch, plan, root-profile changes, and Feature Flow change share one delivery
unit. The documents have no independent review or merge value. One branch and
one pull request minimize coordination cost.

## Critical path, dependencies, and lanes

Critical path:

1. establish current runtime and dependency setup evidence;
2. add failing root-profile and Feature Flow contract assertions;
3. implement the private routing and portable adviser contracts;
4. run focused and affected-boundary checks;
5. freeze the diff;
6. run QA gates and formal review concurrently on the same frozen diff;
7. repair through the retained Worker only if the joined evidence requires it;
8. run invalidated checks, final required checks, live profile acceptance, and
   bounded publication.

There is one serial writer lane. The root tests, agent profiles, root guidance,
Feature Flow guidance, and acceptance wording form one semantic boundary.
Parallel writers would overlap that boundary and add merge risk.

The final read-only lanes are independent and parallel-ready:

- QA owns the exact executable gates and live-acceptance evidence.
- Reviewer owns fixed-diff intent, correctness, architecture, security, and
  maintainability review.
- Both receive the same frozen-tree identifier. Reviewer does not rerun QA
  commands.

Forecast: one active writer, two concurrent final read-only lanes, one delivery
unit, one branch, one pull request, and no stack. The expensive gates are source
smoke, `npm run check`, deterministic root-profile startup, and idle `/reload`.
Cascade cost is low because there is no dependent branch.

Invalidation map:

- Agent frontmatter or role-table changes invalidate the root agent contract test
  and live catalog proof.
- Parent-profile or adviser wording changes invalidate the root documentation
  assertions.
- Portable adviser wording changes invalidate Feature Flow resource and package
  tests.
- Implementation-delegation wording changes invalidate Engineering resource
  tests.
- Any agent, skill, manifest, or root resource change invalidates source smoke
  and live reload acceptance.
- Any final file change invalidates the frozen-tree identifier and formal review.
- A command-definition, lockfile, runtime-selector, or setup change invalidates
  reusable setup and gate evidence.

## [x] 001 — Define the accepted routing and adviser contracts

### Outcome and requirement trace

Focused tests fail against the current Terra-medium Worker, Opus-medium Reviewer,
Fable-parent example, Sol-child approval rule, and incomplete adviser guidance.

Traces to AC-001, AC-002, AC-003, AC-005, AC-006, AC-007, and AC-008.

### Seam and files

Public seams:

- parsed package-agent frontmatter and the exact six-agent root catalog;
- root documentation for manual planning selection and private adviser routing;
- independently installable `planning-changes` guidance for an optional
  capability-based adviser.

Files:

- `test/tooling/packages.test.ts`
- `packages/feature-flow/test/resources.test.ts`
- `packages/engineering/test/resources.test.ts` only if an existing delegation
  assertion does not cover AC-003 and AC-004

### Dependencies

Accepted pitch and repository setup evidence.

### Execution lane and ownership

`serial`. The retained Worker owns the active task worktree and only the named
files. This test-first slice must complete before implementation edits.

### Red proof

Run:

```sh
npm test -- --run test/tooling/packages.test.ts packages/feature-flow/test/resources.test.ts packages/engineering/test/resources.test.ts
```

The changed assertions must fail for the intended old behavior:

- Worker still resolves to `openai-codex/gpt-5.6-terra` at `medium`;
- Reviewer still resolves to Opus 5 at `medium`;
- root guidance does not identify manual Sol `xhigh` planning selection or the
  accepted Fable/Opus `AskClaude` split;
- portable planning guidance does not state the accepted adviser capability,
  disclosure, distinct-question, budget, and fallback contract.

Do not accept setup, import, syntax, or unrelated failures as red proof.

### Green proof and checks

This slice is green only after slice 002 implements the behavior and the same
focused command passes. A change to the asserted role map or adviser contract
invalidates this proof.

### Atomic commit and pull request

Commit the test-first contract with its implementation in the two coherent
commits defined by slices 002 and 003. Do not publish an intentionally failing
commit as a stable boundary.

Delivery unit 1. Pull request base: `main`. Stack position: `standalone`.

### Done when

The focused failures identify only the accepted old routing and missing adviser
contract. The failures are ready for the minimum implementation.

## [x] 002 — Route the private profile through Sol Worker and Opus Reviewer

### Outcome and requirement trace

The private root profile keeps six agents. Worker uses GPT-5.6 Sol at `low` and
Reviewer uses Claude Opus 5 at `high`. The root guidance identifies GPT-5.6 Sol
at `xhigh` as the preferred manual Shape and planning selection. It does not
install a global parent default.

The root guidance also makes non-trivial Worker delegation and safe planned
parallel Workers explicit while preserving `/just-do-it`.

Traces to AC-001, AC-002, AC-003, AC-004, and AC-007.

### Seam and files

- `agents/worker.md`
- `agents/reviewer.md`
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `test/tooling/packages.test.ts`
- `packages/engineering/test/resources.test.ts` only if needed for a missing
  observable delegation assertion

Keep Researcher at Luna/low, QA at Luna/medium, Git at Terra/medium, and Utility
at Luna/medium. Keep exact fresh context, tools, private skills, acceptance roles,
and no fallback.

### Dependencies

Slice 001 red proof.

### Execution lane and ownership

`serial`. One Worker in the active task worktree owns all listed files.

### Red proof

Use slice 001's failing root-profile assertions. Confirm that the failure points
to the current Worker and Reviewer frontmatter or old documentation, not a parser
or setup defect.

### Green proof and checks

Run:

```sh
npm test -- --run test/tooling/packages.test.ts packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
npm run packages:check
```

Green evidence proves:

- exactly six parsed agents;
- Worker Sol/low and Reviewer Opus/high;
- unchanged accepted routes for the other four agents;
- no fallback or silent per-run override;
- manual Sol/xhigh planning guidance without installed setting mutation;
- non-trivial Worker use and safe parallel-ready implementation lanes;
- `/just-do-it` remains the direct-parent exception.

An agent, role, model, thinking, tool, skill, or root-profile documentation change
invalidates this evidence.

### Atomic commit and pull request

`feat: route non-trivial work through Sol Worker`

Delivery unit 1. This commit includes the related root contract assertions,
agent frontmatter, and synchronized private-profile documentation.

### Done when

The exact private role map and manual planning selection are observable through
focused tests and synchronized root documentation. No user settings or seventh
agent are added.

## [x] 003 — Add the portable adviser contract and private AskClaude mapping

### Outcome and requirement trace

Feature Flow allows one optional read-only adviser capability for planning when
source disclosure is permitted. The adviser receives a distinct question,
provides evidence only, does not own synthesis or approval, respects the one
independent-review budget, and has an honest unavailable-capability fallback.

The private root documentation maps this capability to isolated read-only
`AskClaude` calls: Fable 5 at `medium` for intent and planning perspective, and
Opus 5 at `high` only for a distinct rigorous challenge.

Traces to AC-005, AC-006, AC-007, and AC-008.

### Seam and files

- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/README.md`
- `packages/feature-flow/test/resources.test.ts`
- `README.md`
- `docs/architecture.md`
- `test/tooling/packages.test.ts`

Production guidance must not contain `AskClaude`, Fable, Opus, Sol, GPT model
names, private paths, or an assumption that an adviser capability is installed.

### Dependencies

Slice 001 red proof and slice 002's synchronized private role map.

### Execution lane and ownership

`serial`. Reuse the retained Worker and active task worktree. The shared root
documentation makes a parallel writer unsafe.

### Red proof

Use slice 001's failing Feature Flow assertions. The failure must identify the
missing capability-based adviser contract.

### Green proof and checks

Run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts test/tooling/packages.test.ts
npm --workspace @mopeyjellyfish/pi-feature-flow test
```

Green evidence proves:

- adviser use is optional, read-only, disclosure-aware, and question-specific;
- the parent retains architecture, synthesis, approval, and verification;
- one rigorous challenge consumes the independent-review budget;
- applicable mandatory specification review takes precedence;
- unavailable capability uses a direct-parent fallback without a false claim;
- production guidance contains no private profile or model names;
- private root documentation gives exact Fable/Opus call profiles and the
  non-bridge-parent limitation.

A change to the adviser authority, budget, disclosure, provider boundary, or
private mapping invalidates this evidence.

### Atomic commit and pull request

`docs(pi-feature-flow): define optional planning adviser`

Delivery unit 1. This package-owned documentation and skill change receives its
own atomic commit so Release Please can attribute the patch correctly.

### Done when

The portable planning method can use an installed adviser without depending on
this private profile. The root profile documents the exact `AskClaude` mapping
and honest limits.

## [x] 004 — Verify the frozen delivery unit and live profile

### Outcome and requirement trace

The final worktree passes focused, package, source, packed, security, and
repository checks. The live deterministic profile discovers the six updated
agents and `AskClaude` without duplicate or stale registrations. Idle `/reload`
preserves the same behavior.

Traces to AC-004, AC-005, AC-006, AC-007, AC-008, and AC-009.

### Seam and files

No planned production edit. This slice verifies the final frozen contents. A
repair returns to the retained Worker and only the invalidated files.

### Dependencies

Slices 002 and 003 are green. The writer is idle. The parent has inspected the
complete diff and created the frozen-tree identifier.

### Execution lane and ownership

Two parallel read-only lanes on the same active task worktree:

- QA runs exact gates and live acceptance.
- Reviewer performs `Review mode: fixed-diff code` against the accepted pitch,
  plan, frozen diff, and supplied evidence.

The parent joins both results. A repair uses the retained Worker only. No new
writer starts.

### Red proof

A failing gate, stale agent route, missing `AskClaude`, duplicate registration,
private name in production guidance, or material review finding is the final
failure signal. Do not rerun an unchanged failure.

### Green proof and checks

Run the final deterministic gates once after focused invalidated checks pass:

```sh
npm run smoke:source
npm run smoke:packed
npm run security:check
npm run check
```

Start the deterministic profile from the task worktree:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Confirm:

1. the six-agent catalog contains Worker Sol/low and Reviewer Opus/high;
2. the preferred planning selection can be set manually to Sol/xhigh;
3. `AskClaude` is present under the OpenAI parent;
4. an isolated read-only Fable/medium adviser call succeeds;
5. an isolated read-only Opus/high capability probe succeeds with a distinct,
   non-review question;
6. no duplicate, stale, or conflicting registrations appear;
7. after the focused test, idle `/reload` preserves the same catalog and tool
   behavior.

If the harness cannot perform an interactive idle `/reload`, stop before
publication and report that manual acceptance as unmet. Do not treat source
smoke as a substitute.

Any final file change invalidates the frozen-tree identifier, final gates,
formal review, and live acceptance for its affected surface.

### Atomic commit and pull request

No implementation commit unless a verified repair is needed. After all evidence
is green, use the installed `commit` method for any remaining coherent change,
then use `open-pr` for the standalone pull request if publication remains
authorized.

### Done when

QA gates pass, formal review has no unresolved material finding, live startup and
idle reload prove the updated profile, the final diff has no unrelated or
runtime artifacts, and the work evidence records residual risks and publication
state.
