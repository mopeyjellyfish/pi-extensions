---
status: accepted
---

# Plan: Image-first UI design

This plan delivers the complete image-first UI design workflow in one delivery unit. It changes portable skill, prompt, template, test, and package documentation contracts. It does not change the image tool API or render product UI in this repository.

## Review evidence

- **Applicability:** `not applicable`; the plan does not change Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

## Execution mode

The selected mode is accept-all implementation. Whole-plan approval confirms accept-all authority only for this accepted plan on `feat/ui-image-design-flow`.

This authority does not include merge, release, deployment, destructive cleanup, unrelated work, unbounded provider cost, or a material change to the accepted pitch. A material forecast variance returns control to the human.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                      | Pull request base | Dependencies | Checks                                        | Ownership                         | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | --------------------------- | ----------------- | ------------ | --------------------------------------------- | --------------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | `standalone`   | `feat/ui-image-design-flow` | `main`            | none         | focused tests, smoke, reload, `npm run check` | current task worktree, one writer | none              | 1          | low          |

The accepted pitch, this plan, and both implementation slices share one delivery unit and one standalone pull request. The delivery unit can contain separate atomic commits for `pi-frontend-developer` and `pi-feature-flow` because each package has an independently releasable contract.

Before source edits, verify the branch base against the current remote `main`. If the branch is stale, use the repository rebase workflow. Do not merge another active feature branch to avoid conflicts.

## Critical path, dependencies, and lanes

Use one serial lane in the current isolated worktree. Both slices change adjacent workflow contracts and resource tests. Parallel writers would add coordination without independent merge value.

Critical path:

1. Verify or update the branch base.
2. Complete Slice 001 and its focused red/green proof.
3. Complete Slice 002 and its focused red/green proof.
4. Run both focused package tests.
5. Run deterministic source smoke and manual Pi reload acceptance for the final resources.
6. Run `npm run check` against the final tree.
7. Inspect the complete diff and publish one standalone pull request through the approved delivery workflow.

Setup evidence exists for Node `v24.18.0`, npm `11.16.0`, Go `1.26.5`, and `npm ci --ignore-scripts`. The selector and lockfile fingerprint is:

```text
package-lock.json 754c35d4a48d3b3b0fc800c4ffc66134722aadc610c3216a7cfad24d2bb21dff
.nvmrc           8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48
.gvmrc           9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566
```

Verify this fingerprint before reusing the setup. Rerun setup only if it changed or required tools are unavailable.

Evidence invalidation:

- A change under `packages/frontend-developer/` invalidates its focused resource test and package smoke evidence.
- A change under `packages/feature-flow/` invalidates its focused resource test and package smoke evidence.
- A change to consent, fallback, direction selection, or translation terms invalidates both focused tests.
- Any resource edit after manual reload acceptance invalidates that acceptance.
- Any final-tree edit invalidates `npm run check` and final diff evidence for the changed surface.

No browser mismatch ledger applies to this repository change because it changes workflow resources, not a product UI. The delivered workflow must require that ledger for future target-repository UI implementation.

## [ ] 001 — Generate and select the initial UI direction

### Outcome and requirement trace

For a greenfield web application or materially new application surface, `frontend-design` uses an installed image-generation capability for the initial direction pass when consent and credentials permit it.

The pass is bounded, produces two to eight inspected directions, presents them through a verified `design_board`, and records explicit human selection and notes. If generation is unavailable, declined, or unsuccessful, the workflow continues through normal UI design without false evidence.

This slice satisfies AC-001 through AC-004 and the frontend portion of AC-008 and AC-009.

### Seam and files

Public seams:

- `frontend-design` impact router;
- `interface-design` image evidence and feedback workflow;
- `image-generation` consent contract;
- `/design` prompt routing;
- frontend package documentation and resource tests.

Likely files:

- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/skills/frontend-design/SKILL.md`
- `packages/frontend-developer/skills/interface-design/SKILL.md`
- `packages/frontend-developer/skills/image-generation/SKILL.md`
- `packages/frontend-developer/prompts/design.md`
- `packages/frontend-developer/README.md`

Do not change `src/image-generation.ts`, `src/design-board.ts`, provider transport, or tool schemas unless a failing public-contract test proves that the accepted behavior cannot be expressed with existing capabilities. Such a need is a reshape trigger.

### Dependencies

The accepted pitch and verified branch base.

### Execution lane and ownership

Use the serial lane in the current task worktree. The parent is the sole writer unless `implement` assigns one approved Worker to this same lane.

### Red proof

Add the smallest failing assertions to `packages/frontend-developer/test/resources.test.ts`. Prove that the current resources do not require:

- a generation-first initial pass when the capability is available;
- one explicit bounded-pass consent contract;
- safe continuation when generation is unavailable or declined;
- inspected directions, verified board presentation, and explicit selection before handoff.

Run:

```sh
npm test -- --run packages/frontend-developer/test/resources.test.ts
```

Confirm that only the new intended assertions fail before production resource edits.

### Green proof and checks

Make the minimum portable resource changes. Keep provider naming and target paths out of cross-package workflow contracts. Preserve explicit privacy and billing consent. Keep generated images as evidence, not product behavior or production assets.

Run:

```sh
npm test -- --run packages/frontend-developer/test/resources.test.ts
```

A revision to generation, consent, fallback, board, or selection terms invalidates this proof.

### Atomic commit and pull request

Commit the coherent package behavior as:

```text
feat(pi-frontend-developer): add image-first design pass
```

This commit belongs to Delivery unit 1. It does not start another branch or pull request.

### Done when

- The focused test first fails for the intended missing contract and then passes.
- The initial pass is generation-first only when the installed capability, consent, and credentials permit it.
- Fallback does not block design or claim generated evidence.
- Direction generation and refinement have explicit bounds.
- Board presentation and human selection remain explicit.
- The frontend package stays target-repository-neutral.

## [ ] 002 — Carry the selected image from Shape into implementation proof

### Outcome and requirement trace

Shape records an accepted image-to-interface contract before pitch approval. Planning traces that contract into native accessible implementation and final visual comparison. The workflow separates observed pixels from behavior, missing states, responsive rules, accessibility, target component reuse, and accepted deviations.

This slice satisfies AC-005 through AC-009.

### Seam and files

Public seams:

- `shape` material UI evidence gate;
- pitch template interface evidence;
- `planning-changes` interface slice contract;
- plan template proof requirements;
- `frontend-development` mock-up translation;
- design evidence extraction contract;
- both package READMEs and focused resource tests.

Likely files:

- `packages/feature-flow/test/resources.test.ts`
- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/skills/shape/templates/pitch.md`
- `packages/feature-flow/skills/shape/templates/plan.md`
- `packages/feature-flow/README.md`
- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/skills/frontend-development/SKILL.md`
- `packages/frontend-developer/skills/frontend-design/references/design-contract.md`
- `packages/frontend-developer/README.md`

### Dependencies

Slice 001. The frontend method must define generation, selection, and fallback before Shape composes it.

### Execution lane and ownership

Continue in the serial lane and the same task worktree. Keep one writer. Do not create a parallel worktree for this dependent contract.

### Red proof

Add the smallest failing assertions to the two focused resource tests. Prove that the current resources do not require all of these facts:

- Shape uses the generation-first frontend method before pitch approval for applicable new application UI.
- The pitch records selected evidence and an image-to-interface contract.
- Planning maps the contract to native controls, target components, semantic tokens, representative states, responsive surfaces, and accessibility paths.
- Final browser evidence compares implementation with the selected direction and resolves or explicitly accepts a visual mismatch ledger.
- Generated pixels do not define hidden behavior or production assets.
- `feature-flow` keeps named capability resolution and an honest independent-installation fallback.

Run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts packages/frontend-developer/test/resources.test.ts
```

Confirm that only the new intended assertions fail before production resource edits.

### Green proof and checks

Make the minimum resource, template, and documentation changes. Keep Shape responsible for product intent and approval. Keep frontend skills responsible for design evidence and translation. Keep `implement` responsible for engineering orchestration.

Use React guidance only when the accepted target uses React. Do not add React, browser, image, or frontend package dependencies to `feature-flow`.

Run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts packages/frontend-developer/test/resources.test.ts
npm run smoke:source
```

Then run manual reload acceptance from the task worktree:

1. Start the pinned deterministic Pi command with ambient resources disabled and the working package resources explicitly loaded.
2. Confirm the expected frontend and feature-flow skills and prompts load without conflict diagnostics.
3. Run the focused tests before `/reload`.
4. Enter `/reload` while Pi is idle.
5. Exercise `/shape` with a greenfield application brief and confirm that the new generation-first, consent, fallback, selection, and translation guidance is present without duplicate registrations or stale state.
6. Confirm that a generation-declined path continues to UI design without a provider request.
7. Stop the acceptance session and do not retain Pi session or trust artifacts.

A resource edit after this sequence invalidates manual reload acceptance.

### Atomic commit and pull request

Commit the coherent cross-lifecycle contract as:

```text
feat(pi-feature-flow): carry image direction into UI delivery
```

Include required frontend translation files in this commit only when they are inseparable from the Shape-to-plan behavior. Otherwise include them in Slice 001. Both commits remain in Delivery unit 1.

### Done when

- Both focused tests show intended red proof and final green proof.
- The pitch and plan templates preserve the selected image-to-interface contract.
- Planning names native accessibility, target-system reuse, responsive states, and visual mismatch resolution.
- Capability absence does not couple or block `feature-flow`.
- Source smoke and manual reload acceptance pass on the final resources.
- `DESIGN.md` remains optional and approval-gated. This repository does not need a `DESIGN.md` change.

## Final delivery-unit verification

After the final edit, run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts packages/frontend-developer/test/resources.test.ts
npm run smoke:source
npm run check
```

Inspect:

```sh
git status --short --untracked-files=all
git diff --check
git diff --stat
git diff
```

Confirm that only the accepted pitch, plan, `feature-flow`, and `frontend-developer` paths changed. Confirm that no generated images, credentials, environment files, Pi sessions, trust state, coverage, package archives, or delegated-agent artifacts are present.

If verification passes, use the approved commit and publication workflows. Publish one standalone pull request from `feat/ui-image-design-flow` to `main`. Do not merge it.
