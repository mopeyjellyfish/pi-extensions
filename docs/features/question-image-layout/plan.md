---
status: accepted
---

# Plan: Keep image-backed questions below visual evidence

Complete this delivery plan before implementation. It covers the accepted image-safe caller contract, independent frontend workflow fallback, focused proof, review, and publication.

## Execution mode

Accept-all implementation. Whole-plan approval confirms bounded authority for this named plan: implement the slice, run its proof and required gates, repair in-scope findings, create the planned atomic commits, and publish one ready pull request without routine checkpoints. Any material forecast variance returns control to the human. This authority never permits merge, release, deployment, destructive cleanup, dependency changes, Pi core changes, or unrelated work.

## Delivery topology

| Delivery unit | Branch                      | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                        |
| ------------- | --------------------------- | ----------------- | --------------- | ------------ | ---------------------------------------------------------- |
| 1             | `fix/question-image-layout` | `main`            | `001`           | none         | serial parent lane; current isolated worktree; sole writer |

One delivery unit, branch, and pull request are sufficient. The question-tool caller contract and frontend visual-feedback guidance produce one user outcome and must be reviewed together. The accepted pitch and this plan share the implementation delivery unit's publication; they have no independent pull-request value. Two package-attributed atomic implementation commits preserve release ownership without creating extra delivery units.

## Critical path, dependencies, and lanes

Critical path: add focused failing contract assertions → update question guidance and documentation → update independent frontend workflow guidance and documentation → run focused tests and both package typechecks → verify source loading and deterministic reload behavior → run the full repository check → freeze and review the diff → repair only accepted in-scope findings → commit and publish.

There is one active serial lane, one delivery unit, and one pull request. No parallel writer is justified because the two package guidance changes share one acceptance contract and final proof. Integration points are the model-facing `question` metadata and the independently installable `interface-design` skill. Expensive gates are source smoke, deterministic Pi reload acceptance, and `npm run check`. Cascade cost is low: no runtime schema, state, dependency, or Pi core changes are planned.

Invalidation map:

- Changes to `packages/question/src/index.ts`, its guidance assertions, or question README invalidate the question focused test and question typecheck evidence.
- Changes to the interface-design guidance, frontend README, or resource assertions invalidate the frontend focused test and frontend typecheck evidence.
- Changes to either package after source smoke or deterministic Pi acceptance invalidate that integration evidence.
- Any change after `npm run check` invalidates the final required gate and frozen-diff review.
- Formatting-only plan status updates invalidate only formatting and diff checks unless they alter accepted scope.

Return control to the human for a material forecast variance, including any need for Pi core changes, automatic transcript-image detection, side-by-side core image rendering, a package dependency, a default-presentation change, or an additional delivery unit.

## [ ] 001 — Keep visual-choice questions below displayed images

### Outcome and requirement trace

Agents using the active question tool are explicitly instructed to choose `presentation: "inline"` after displaying terminal image evidence, so the existing non-overlay dialog renders below the images. The interface-design workflow applies that contract to image-backed CLI visual feedback when supported and uses a concise below-evidence conversational fallback when it is not. Existing full-screen defaults, documents, formal approvals, package independence, and runtime behavior remain unchanged.

Trace: AC-001 through AC-005.

### Seam and files

Public seams:

- The model-facing `question` tool description and `promptGuidelines` in `packages/question/src/index.ts`.
- The documented question presentation contract in `packages/question/README.md`.
- The production `interface-design` workflow in `packages/frontend-developer/skills/interface-design/SKILL.md`.
- The independent-package fallback documented in `packages/frontend-developer/README.md`.
- Package contract assertions in `packages/question/test/question.test.ts` and `packages/frontend-developer/test/resources.test.ts`.

Expected files:

- `packages/question/src/index.ts`
- `packages/question/test/question.test.ts`
- `packages/question/README.md`
- `packages/frontend-developer/skills/interface-design/SKILL.md`
- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/README.md`
- `docs/features/question-image-layout/plan.md`

Do not edit question schema, dialog, layout, state, results, RPC code, package manifests, dependencies, feature-flow approval guidance, or Pi core.

### Dependencies

The merged inline presentation contract on `origin/main` at `96364621`, Pi 0.84.0's documented non-overlay `ctx.ui.custom()` behavior, and the accepted pitch. No package dependency is added.

### Execution lane and ownership

Serial parent lane in `/Users/david/code/personal/pi-extensions.fix-question-image-layout`. The parent is the sole writer and owns TDD, documentation, verification, final diff inspection, and synthesis. Read-only QA and fixed-diff review may be delegated after the parent freezes the relevant evidence.

### Red proof

Before production guidance changes:

1. Add a question contract assertion requiring model-facing guidance to mention displayed terminal images, `presentation: "inline"`, and placement below the images. Run `npm test -- --run packages/question/test/question.test.ts` and capture the intended failure.
2. Add a frontend resource assertion requiring image-backed CLI feedback to use inline presentation when supported and a below-evidence fallback otherwise. Run `npm test -- --run packages/frontend-developer/test/resources.test.ts` and capture the intended failure.

The failures must be caused by the missing public guidance, not setup, formatting, or private helper details.

### Green proof and checks

Implement only enough public guidance and documentation to pass the new assertions, then run:

```sh
npm test -- --run packages/question/test/question.test.ts packages/frontend-developer/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-question run typecheck
npm --workspace @mopeyjellyfish/pi-frontend-developer run typecheck
npm run smoke:source
npm run check
```

For deterministic live Pi acceptance, start the pinned Pi from this worktree with ambient discovery disabled and `-e .`. Confirm the question tool guidance includes image-safe inline placement, enter `/reload` while idle, and confirm the same worktree guidance remains loaded without duplicate registrations or stale content. Exercise an inline question after visible image evidence when the terminal can render it; otherwise record the unavailable terminal-image proof rather than claiming it.

After the final green gate, freeze `origin/main...HEAD` plus tracked implementation changes for one read-only review against the accepted pitch, plan, AC-001 through AC-005, package independence, exact Pi API behavior, and repository standards. Repair blocking findings in the same serial lane, rerun only invalidated evidence and the final required gate, then stop review iteration.

### Atomic commit and pull request

Within delivery unit 1:

1. `fix(pi-question): guide image-safe inline placement` — question model-facing guidance, focused contract test, and package README.
2. `docs(pi-frontend-developer): keep visual feedback below images` — interface-design workflow, resource assertion, and package README.

The already accepted pitch and this accepted plan remain separate bounded documentation commits on the same branch. Publish one ready standalone pull request from `fix/question-image-layout` to `main` after final verification and fixed review. Do not merge it.

### Done when

- AC-001 through AC-005 are satisfied by public package behavior and focused deterministic tests.
- The question package explicitly directs image-following questions to inline presentation and explains below-image placement.
- The frontend workflow uses the supported inline contract without assuming `pi-question` is installed and retains a below-evidence fallback.
- Existing full-screen, document, formal approval, schema, and runtime contracts are unchanged.
- Focused tests, both package typechecks, source smoke, deterministic reload acceptance, and `npm run check` pass against the final worktree, or any unavailable terminal-image proof is reported precisely.
- One fixed-diff review has no unresolved blocking findings.
- The worktree contains only intended files, no staged leftovers or runtime artifacts, `git diff --check` passes, the planned commits exist, and the ready pull request metadata matches the accepted delivery topology.
