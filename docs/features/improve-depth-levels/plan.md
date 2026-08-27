---
status: accepted
---

# Plan: Appetite-aware architecture improvement depth

This plan delivers the complete accepted pitch in one Engineering package delivery unit. It keeps discovery read-only and adds no runtime extension.

## Review evidence

- **Applicability:** Go-targeted guidance. The plan changes Go-specific architecture and test-improvement instructions for future Go work.
- **Fixed document:** `docs/features/improve-depth-levels/plan.md` draft before approval.
- **Status:** Approved. The replacement fixed-document Go specification review found no blocking issues or material questions.
- **Invalidation:** The review remains valid because only its status evidence changed after approval. A later change to the improvement-depth behavior, Go routing, workflow routes, boundaries, authority, or acceptance criteria requires a replacement review.

## Execution mode

The selected mode is **accept-all implementation**. This is a preference until whole-plan approval confirms authority for this accepted plan.

After whole-plan approval, accept-all authority covers the named delivery unit's tests, required gates, risk-selected assurance, commit, and authorized pull request publication. It pauses for setup, test, check, commit, publication, material review, or forecast variance. It never authorizes merge, release, deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                      | Pull request base | Dependencies | Checks                                                                            | Ownership                                                                                         | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | --------------------------- | ----------------- | ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | `standalone`   | `feat/improve-depth-levels` | `main`            | none         | focused Engineering test, workspace test, source smoke, manual reload, root check | current isolated worktree, one Worker writer, parent verification; no concurrent writer permitted | none              | 1          | low          |

The pitch and plan share the implementation delivery unit's publication. The delivery unit contains the accepted pitch commit, the accepted plan commit, and one atomic Engineering behavior commit. It has one standalone pull request from `feat/improve-depth-levels` to `main`. No stack or sibling pull request adds independent review or merge value.

## Critical path, dependencies, and lanes

The critical path is slice 001, then slice 002, then one frozen-tree verification and publication boundary. Both slices change `packages/engineering/skills/improve-codebase-architecture/SKILL.md` and `packages/engineering/test/resources.test.ts`, so they stay serial in one worktree with one writer.

There are no parallel implementation lanes. This feature teaches `/improve` how to identify future parallel-ready candidates, but its own overlapping files make parallel writers unsafe.

Forecast:

- active implementation lanes: 1
- delivery units and pull requests: 1 and 1
- integration points: none
- expensive gates: deterministic Pi reload acceptance and `npm run check`
- likely cascade cost: low because there is no stack and no dependent pull request

Setup evidence is valid for the current selectors and lockfile:

- Node `v24.18.0`
- Go `go1.26.5`
- `.nvmrc`: `8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48`
- `.gvmrc`: `9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566`
- `package-lock.json`: `754c35d4a48d3b3b0fc800c4ffc66134722aadc610c3216a7cfad24d2bb21dff`
- setup command: repository runtime activation followed by `npm ci --ignore-scripts`

Invalidation map:

- A skill or focused-test change invalidates the focused Engineering test and workspace test.
- A prompt change also invalidates prompt-expansion proof and manual `/reload` acceptance.
- A Go-guidance change invalidates the fixed-document review before plan approval. During implementation, it invalidates focused Go-routing contract proof and any selected formal diff review.
- A README or feature-document-only change invalidates Markdown and diff checks, but not unchanged behavior proof.
- Any final file change invalidates the frozen-tree identifier and the affected final gate. Run `npm run check` once against the final frozen tree.

## [ ] 001 — Select improvement depth and report bounded evidence

### Outcome and requirement trace

`/improve` accepts `low`, `medium`, `high`, or `max`, defaults to `medium`, keeps scope independent, and reports evidence within an honest declared boundary.

Trace: AC-001 through AC-006, AC-013, and the input, scope, coverage, vocabulary, and attribution parts of AC-014.

### Seam and files

Public seam: the installed `/improve` prompt expansion and the `improve-codebase-architecture` skill instructions consumed by the parent agent.

Likely files:

- `packages/engineering/prompts/improve.md`
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/test/resources.test.ts`

Keep `packages/engineering/THIRD_PARTY_NOTICES.md` unchanged.

### Dependencies

The accepted pitch at `docs/features/improve-depth-levels/pitch.md`. No implementation slice dependency.

### Execution lane and ownership

`serial` in the current `feat/improve-depth-levels` worktree. One Worker owns the allowed package files. The parent owns the accepted intent, final diff, and gates.

### Red proof

Extend the existing architecture-discovery resource test and prompt-expansion test first. The focused test must fail because the current resources do not define:

- the four improvement depths and `medium` default
- case-insensitive leading-level normalization
- level-only scope inference and the reserved-token escape
- the updated argument hint and empty-call default
- scope types, coverage, exclusions, impact, reversibility, and overlap fields
- the distinction between improvement depth and `codebase-design` **Depth**

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

Record the intended assertion failures before editing the skill or prompt.

### Green proof and checks

Make the smallest resource changes that satisfy the accepted level table and input contract. Keep `${ARGUMENTS:-...}` for the empty call. Reword the prompt so arguments are an initial improvement request, not always a scope. Do not add a parser or extension.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
```

A later prompt or skill change invalidates this proof.

### Atomic commit and pull request

This slice joins slice 002 in one atomic commit: `feat(pi-engineering): add improve depth levels`. Delivery unit 1 publishes one standalone pull request to `main`.

### Done when

The focused tests prove every input form, level meaning, bounded report field, honest no-finding behavior, vocabulary distinction, and unchanged attribution.

## [ ] 002 — Select candidates and route proportionate delivery

### Outcome and requirement trace

`/improve` safely presents up to three candidates plus no-change, allows multi-selection only for independent candidates, uses target-language test patterns, and routes selected work to `implement`, planning, or Shape without starting a writer.

Trace: AC-007 through AC-012 and AC-014 through AC-016.

### Seam and files

Public seam: candidate reports, the `question` decision, unavailable-companion fallback, and the self-contained workflow handoff from `improve-codebase-architecture`.

Likely files:

- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/test/resources.test.ts`
- `packages/engineering/README.md`
- `docs/features/improve-depth-levels/plan.md`

### Dependencies

Slice 001's accepted input, appetite, scope, and report contract.

Preserve the current conditional `cobra-viper` route for Go CLI commands, flags, and configuration. The new Go test guidance extends the existing Go route instead of replacing it.

### Execution lane and ownership

`serial` in the same worktree and writer lane as slice 001. The shared skill and test file prohibit a parallel writer.

### Red proof

Extend the focused resource test before the routing edit. The test must fail because the current resources do not define:

- three candidates plus an exclusive no-change option
- multi-selection only for independent candidates
- candidate dependencies, overlap, integration points, and route reasons
- one bounded candidate to `implement`
- independent or coordinated candidates to `planning-changes`
- unresolved material architecture to Shape
- unavailable route skills returning a self-contained brief without implementation
- language-aware test consolidation
- Go table-driven tests as the installed `go` default and the `go` skill as the tiebreaker
- preservation of conditional `cobra-viper` routing
- README guidance for improvement levels, scope examples, multi-selection, route behavior, and Go precedence

Run the focused Engineering test and record the intended failures.

### Green proof and checks

Implement the routing and fallback contract without starting workers or editing target production code. State in the shipped skill that the installed `go` skill decides unclear Go test-pattern cases. Update the README with level and scope examples, quick-win multi-selection, route behavior, and Go precedence.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
npm run smoke:source
```

Then perform deterministic manual Pi acceptance from this worktree:

1. Start the pinned Pi command with ambient resources disabled and load `packages/engineering` explicitly.
2. Confirm `/improve` and `improve-codebase-architecture` load without conflicts.
3. Run the focused test before reload.
4. Enter `/reload` while Pi is idle.
5. Probe a low quick-win scope and a Go test scope. Confirm the new improvement-depth, selection, routing, and Go behavior appears without duplicate registrations or stale instructions.
6. If the host cannot complete the TUI loop, stop and return control with the unmet evidence. Do not mark the delivery unit complete or claim manual acceptance until this proof passes.

Freeze the final diff. Run `npm run check` once against that tree. Run `git diff --check`. A change after either command invalidates only the affected evidence and frozen-tree identifier.

### Atomic commit and pull request

Combine both completed slices, focused tests, skill, prompt, and README in `feat(pi-engineering): add improve depth levels`. Delivery unit 1 uses the existing branch and one standalone pull request to `main`.

### Done when

The public resources satisfy AC-001 through AC-016. Focused tests, workspace tests, source smoke, manual reload acceptance, `npm run check`, and diff checks pass against the final tree. The final diff contains no manifest, dependency, changelog, attribution, generated, session, or runtime-artifact changes.
