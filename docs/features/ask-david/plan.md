---
status: accepted
---

# Plan: Ask David

Deliver the accepted `ask-david` support skill and `/ask-david` routing prompt as
one independently installable Productivity package change.

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

| Delivery unit | Topology   | Stack position | Branch                 | Pull request base | Dependencies | Checks                                           | Ownership                   | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ---------------------- | ----------------- | ------------ | ------------------------------------------------ | --------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | `standalone`   | `feat/ask-david-skill` | `main`            | none         | Productivity test, source smoke, `npm run check` | Current worktree and parent | none              | one PR     | none         |

Both vertical slices, their atomic commits, the accepted pitch and plan, and all
documentation share one delivery unit, branch, and standalone pull request. The
planning documents do not need independent review or merge value.

## Critical path, dependencies, and lanes

The critical path is serial:

1. Add failing resource and prompt-routing contracts.
2. Add the skill and prompt until the focused contracts pass.
3. Update package and root documentation, then verify packed contents and source
   discovery.
4. Complete fresh-process and reload acceptance where the active environment can
   provide an interactive Pi session.
5. Run the stable final repository gate, inspect the diff, commit the coherent
   package feature, and publish the one authorized pull request.

Use one active writer in the current task worktree. There are no independent
lanes or integration points. The forecast is one delivery unit, one pull
request, one focused package test, one source smoke, one interactive acceptance
loop, and one final `npm run check`. There is no stack or cascade cost.

Evidence invalidation:

- A change to `skills/ask-david/SKILL.md`, `prompts/ask-david.md`, or their test
  assertions invalidates the focused Productivity resource test.
- A change to package resource paths or packed-content assertions also
  invalidates the Productivity resource test and `npm run smoke:source`.
- A change after interactive acceptance invalidates the affected `/ask-david`
  prompt or skill exercise.
- Any change after the final `npm run check` invalidates that final gate. Run the
  complete gate again on the final tree.

## [x] 001 — Route questions to evidence-first David-flavoured support

### Outcome and requirement trace

A caller can run `/ask-david <question>` or `/skill:ask-david <question>` and get
a source-backed, concise, David-flavoured answer about the public Pi package
suite. The answer remains transparent, read-only, and honest about missing
evidence. This slice satisfies AC-001 through AC-006.

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
This slice satisfies AC-007.

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
