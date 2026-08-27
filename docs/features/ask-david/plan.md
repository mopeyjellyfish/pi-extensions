---
status: accepted
---

# Plan: Ask David

Revise the accepted `ask-david` support skill so `/ask-david` routes callers
through the public package flow before it gives source-backed usage help.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Execution mode

Accept-all implementation. Whole-plan approval confirms accept-all authority for
this named plan. It never authorizes merge, release, deployment, destructive
cleanup, or unrelated work. Stop and return control for setup, test, check,
commit, or publication failure, material review findings, scope changes, or any
material forecast variance.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                 | Pull request base | Dependencies | Checks                                           | Ownership                   | Integration point | CI fan-out       | Cascade cost |
| ------------- | ---------- | -------------- | ---------------------- | ----------------- | ------------ | ------------------------------------------------ | --------------------------- | ----------------- | ---------------- | ------------ |
| 1             | standalone | `standalone`   | `feat/ask-david-skill` | `main`            | none         | Productivity test, source smoke, `npm run check` | Current worktree and parent | none              | existing PR #106 | none         |

All three vertical slices, their atomic commits, the accepted pitch and plan,
and all documentation share the existing delivery unit, branch, and standalone
pull request. The revised planning documents do not need independent review or
merge value.

## Critical path, dependencies, and lanes

The first two slices are complete. The revision path is serial:

1. Add a failing prose contract for recommendation-first routing, the main
   delivery flow, on-ramps, and unavailable companion behavior.
2. Revise the skill and package documentation until the focused contract passes.
3. Repeat source discovery and reload acceptance for the changed skill.
4. Run the stable final repository gate and one fixed-diff formal review.
5. Commit the coherent routing feature and update existing pull request #106.

Use one active writer in the current task worktree. There are no independent
lanes or integration points. The revision forecast is one focused package test,
one source smoke, one reload exercise, one final `npm run check`, one review, one
commit, and one existing pull-request update. There is no stack or cascade cost.

Evidence invalidation:

- A change to `skills/ask-david/SKILL.md` or its assertions invalidates the
  focused Productivity resource test and reload exercise.
- A change to the routing prompt or package resource paths also invalidates the
  focused test and `npm run smoke:source`.
- A change after reload acceptance invalidates the affected `/ask-david` prompt
  or skill exercise.
- Any change after the final `npm run check` invalidates that final gate. Run the
  complete gate again on the final tree.

## [x] 001 — Route questions to evidence-first David-flavoured support

### Outcome and requirement trace

A caller can run `/ask-david <question>` or `/skill:ask-david <question>` and get
a source-backed, concise, David-flavoured answer about the public Pi package
suite. The answer remains transparent, read-only, and honest about missing
evidence. This completed slice satisfies AC-001 and AC-006 through AC-009.

### Seam and files

Public seams:

- the `ask-david` Agent Skill frontmatter and instructions;
- prompt-template expansion for `/ask-david` with and without arguments.

Likely files:

- `packages/productivity/test/resources.test.ts`;
- `packages/productivity/skills/ask-david/SKILL.md`;
- `packages/productivity/prompts/ask-david.md`.

### Dependencies

The accepted pitch and Pi's prompt-template and Agent Skill contracts. No prior
implementation slice.

### Execution lane and ownership

`serial` in the active `feat/ask-david-skill` worktree. The parent is the sole
writer.

### Red proof

Extend `packages/productivity/test/resources.test.ts` first. Require:

- `name: ask-david` and `disable-model-invocation: true`;
- complete-suite scope, authoritative evidence order, focused clarification,
  version uncertainty, direct recommendation, voice boundaries, transparent
  authorship, and read-only behavior;
- `/ask-david` prompt expansion that tells the agent to load and follow the
  `ask-david` skill and preserves `${ARGUMENTS}`;
- a useful no-argument fallback that asks for the caller's question.

Run:

```sh
npm --workspace @mopeyjellyfish/pi-productivity test
```

The intended red state is a missing `ask-david` skill or prompt contract, not a
setup, import, or unrelated failure.

### Green proof and checks

Add the minimum original skill and routing prompt that satisfy the accepted
contract. Keep the prompt thin so the skill remains the single source of truth.
Run:

```sh
npm --workspace @mopeyjellyfish/pi-productivity test
```

Changes to the skill, prompt, or assertions invalidate this focused proof.

### Atomic commit and pull request

One package feature commit with slice 002 in delivery unit 1. The expected
headline is `feat(pi-productivity): add ask David support`. The pull request is a
standalone change from `feat/ask-david-skill` to `main`.

### Done when

- The intended contract test fails before the resources exist.
- `/ask-david` routes its argument to `ask-david` without duplicating the skill.
- The skill enforces the accepted evidence, voice, authorship, uncertainty, and
  read-only boundaries.
- The focused Productivity test passes.

## [x] 002 — Ship and document the independent package resources

### Outcome and requirement trace

The Productivity package and David's root profile ship, discover, and document
the skill and prompt without a runtime dependency or duplicate registration.
This completed slice satisfies AC-010's package-delivery foundation.

### Seam and files

Distribution and documentation seams:

- Productivity package packed contents and resource discovery;
- `packages/productivity/README.md`;
- root `README.md` personal-profile inventory;
- `packages/productivity/test/resources.test.ts` packed-content assertions.

The generated package changelog remains Release Please-owned and does not need a
manual feature entry.

### Dependencies

Slice 001 resources and focused green proof.

### Execution lane and ownership

`serial` in the same active worktree and with the same parent writer.

### Red proof

Before documentation and packed-content changes, extend the focused package
contract to require both:

- `skills/ask-david/SKILL.md` in the packed artifact;
- `prompts/ask-david.md` in the packed artifact.

The focused test must fail because the new resources are absent from the
expected package contract.

### Green proof and checks

Update the Productivity README and root profile inventory with `/ask-david`, its
complete-suite support scope, transparent David-flavoured voice, and independent
installation boundary. Verify the package and source profile with:

```sh
npm --workspace @mopeyjellyfish/pi-productivity test
npm run smoke:source
```

For interactive acceptance, start the repository's deterministic Pi command in
this worktree, confirm `ask-david` and `/ask-david` appear without conflicts, run
the focused test, enter `/reload` while Pi is idle, and exercise `/ask-david`
with one representative package-usage question. Confirm the revised behavior
appears without duplicate registration or stale state. If this environment
cannot provide that interactive loop, report the unmet manual evidence instead
of claiming it passed.

After all final edits, run:

```sh
npm run check
```

Any resource-path change invalidates the focused test and source smoke. Any final
edit invalidates `npm run check`.

### Atomic commit and pull request

Share slice 001's `feat(pi-productivity): add ask David support` commit and the
single standalone pull request in delivery unit 1. The accepted pitch and plan
remain earlier atomic documentation commits on the same branch.

### Done when

- The packed artifact contains the new skill and prompt.
- Package and root documentation explain `/ask-david` without implying that the
  answer is personally authored by David.
- Focused tests, source smoke, and `npm run check` pass on the final tree.
- Interactive reload evidence passes or the handoff states the exact unmet
  manual proof.
- The final diff contains no runtime dependency, generated artifact, duplicate
  resource, private path, or unrelated change.

## [x] 003 — Route each situation to the next public flow

### Outcome and requirement trace

`/ask-david` first recommends the correct public resource or flow, gives one
practical reason, and names the next transition. It retains source-backed usage
help when the caller needs package details. This slice satisfies AC-002 through
AC-005 and completes AC-010 for the revised behavior.

### Seam and files

Public seam:

- `packages/productivity/skills/ask-david/SKILL.md`.

Likely files:

- `packages/productivity/test/resources.test.ts`;
- `packages/productivity/skills/ask-david/SKILL.md`;
- `packages/productivity/README.md`;
- root `README.md`.

The existing prompt remains a thin route and changes only if its usage hint no
longer represents questions and situations accurately.

### Dependencies

Completed slices 001 and 002 plus the revised accepted pitch.

### Execution lane and ownership

`serial` in the active `feat/ask-david-skill` worktree. One writer owns the
focused test, skill, and documentation changes.

### Red proof

Extend the existing `ask-david` resource test first. Require:

- recommendation, practical reason, and next transition before details;
- `/just-do-it`, direct `/implement`, `/plan` then `/implement`, and `/shape`
  then `/plan` then `/implement` with the accepted route distinctions;
- `diagnosing-bugs`, `improve-codebase-architecture`, `triage`, and
  `resolving-merge-conflicts` with their next transitions;
- an available-resource check and an honest unavailable-method fallback;
- preservation of evidence-first package support and the read-only boundary.

Run:

```sh
npm --workspace @mopeyjellyfish/pi-productivity test
```

The intended red state is missing routing guidance in the current skill, not a
setup, syntax, or unrelated failure.

### Green proof and checks

Add the smallest stable flow map to the skill. Name public resources and route
distinctions without copying their detailed contracts. Update package and root
documentation to describe recommendation-first routing. Run:

```sh
npm --workspace @mopeyjellyfish/pi-productivity test
npm run smoke:source
```

Repeat the deterministic Pi reload exercise and confirm `/ask-david` still
routes to the changed skill after reload. Then run the final repository gate:

```sh
npm run check
```

Skill or assertion changes invalidate the focused test and reload exercise. Any
final edit invalidates the complete check.

### Atomic commit and pull request

Create one package feature commit named
`feat(pi-productivity): route ask David through package flows`. Push the updated
branch and revise existing standalone pull request #106 without changing its
base, head, ready state, or accepted topology.

### Done when

- The intended routing contract fails against the lookup-first skill.
- The main flow and on-ramps name the correct next public entry and transition.
- Missing companion resources are reported honestly instead of assumed.
- Specialized package questions still receive source-backed usage help.
- Focused tests, source smoke, reload acceptance, and `npm run check` pass.
- Formal review has no unresolved material finding.
- PR #106 points to the final verified commit and describes the routing behavior.
