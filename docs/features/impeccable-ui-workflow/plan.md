---
status: accepted
---

# Plan: Integrated interface craft workflow

Complete this delivery plan before implementation. It covers every accepted vertical slice, the critical path, dependencies, delivery units, and independent lanes.

## Execution mode

Accept-all implementation is selected. Only explicit whole-plan approval confirms accept-all authority for this named plan. That authority permits the approved branch’s bounded plan commit, implementation commits, verification, final review and repairs, and later pull-request publication. It never authorizes merge, release, deployment, destructive cleanup, worktree removal, or unrelated work. Any material forecast variance returns control to the human; fresh approval is required when delivery boundaries or authority change.

## Delivery topology

| Delivery unit | Branch                                | Pull request base | Vertical slices | Dependencies            | Lane/worktree owner                                                                |
| ------------- | ------------------------------------- | ----------------- | --------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| 1             | `feat/integrate-impeccable-ui-skills` | `main`            | `001-003`       | accepted pitch and plan | serial implementation lane; current isolated worktree; one Worker writer at a time |

One delivery unit, one branch, and one pull request is intentional. Frontend operation routing, DESIGN.md behavior, and feature-flow integration form one public workflow and need one frozen review and validation boundary. The accepted pitch and plan share implementation publication. Atomic commits remain coherent package-owned changes inside this unit.

No stack is planned. The slices do not have enough independent merge value to justify separate required-check runs, integration branches, CI fan-out, or cascade cost.

## Critical path, dependencies, and lanes

Critical path: accepted plan → frontend operation catalog → first-class DESIGN.md workflow → conditional Shape/planning integration → focused package checks → source smoke → full repository check → frozen-diff review → bounded repairs and invalidated checks → one pull request.

All implementation is serial in the current routed worktree because slices 001 and 002 share `prompts/design.md`, frontend routing skills, `README.md`, and `test/resources.test.ts`; slice 003 depends on their final vocabulary. One implementation writer owns the worktree at a time. Read-only review may run independently only against a frozen diff.

Forecast:

- active implementation lanes: 1;
- delivery units and pull requests: 1 and 1;
- expected implementation commits: 3 package-scoped feature commits, plus the already accepted pitch commit and the approved plan commit;
- integration points: `/design` routing into operation references and DESIGN.md; conditional feature-flow language into installed frontend capabilities; root source smoke discovering both packages;
- expensive gates: frontend and feature-flow package tests, package validation, `npm run smoke:source`, `npm run check`, and deterministic Pi reload acceptance because prompt and skill resources change;
- likely cascade cost: moderate because the frontend artifact becomes explicitly dual-licensed and exact resource, attribution, root-profile, packed-content, and feature-flow contracts change together.

Evidence invalidation map:

- changing an operation name, routing rule, or operation reference invalidates slice 001 focused tests and frontend package tests;
- changing DESIGN.md schema, precedence, approval, template, or document routing invalidates slice 002 focused tests and frontend package tests;
- changing Shape/planning UI criteria, capability independence, templates, or lifecycle ownership invalidates slice 003 focused tests and feature-flow package tests;
- changing shared frontend routing or README after slice 002 invalidates both slice 001 and 002 focused proof;
- changing the frontend skill inventory invalidates the root `README.md` and `AGENTS.md` profile descriptions;
- changing package manifests, approved license metadata, resource paths, or attribution inventory invalidates the root lockfile, package validator tests, package validation, packed-content proof, and source smoke;
- any final edit invalidates formatting and lint checks for touched files; unplanned TypeScript or dependency changes invalidate typecheck/security scope and require plan variance review;
- any prompt, skill, reference, or template edit after deterministic reload acceptance invalidates that acceptance;
- any post-review edit invalidates the frozen-diff review for the touched surface and requires bounded re-review after affected checks are green.

Material variance includes a need for a new package, a second production runtime/tool, an unplanned dependency or lockfile change beyond the approved frontend license-metadata synchronization, native or marketing-site scope, a second delivery unit, or inability to preserve `/design` and `/shape` ownership. Stop and report that variance before continuing.

## [x] 001 — Natural interface requests resolve to focused craft operations

### Outcome and requirement trace

`/design` remains the main human interface entry, while agent skill discovery and natural requests reliably select one focused web-interface operation. Every accepted operation has scope, required evidence, safe implementation handoff, and completion proof. This satisfies AC-001 through AC-004, AC-011 through AC-015, and the operation-catalog portion of AC-016.

The catalog covers:

- establish/evolve: `design`, `extract`, `document` routing;
- evaluate: `critique`, `audit`;
- refine: `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`;
- enhance: `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`;
- fix: `clarify`, `adapt`, `optimize`;
- iterate: `live` using installed Pi browser, board, and image capabilities.

“Teach the design system” routes to documentation. “Normalize” routes to `polish` for local drift or `extract` for reusable convergence. `/shape` remains the feature pitch lifecycle. `init`, `craft`, `/impeccable`, native-platform guidance, and unavailable marketing-site expertise are not introduced.

### Seam and files

Public seams:

- `packages/frontend-developer/prompts/design.md`;
- `packages/frontend-developer/skills/frontend-design/SKILL.md`;
- new `packages/frontend-developer/skills/interface-craft/SKILL.md` and `references/*.md`;
- delegations from `packages/frontend-developer/skills/frontend-development/SKILL.md` and `skills/interface-design/SKILL.md`;
- package discovery and user contract in `packages/frontend-developer/README.md`;
- explicit dual-license metadata and packed notice inventory in `packages/frontend-developer/package.json`, `LICENSE`, and new `NOTICE.md`;
- approved package-license validation in `scripts/lib/packages.ts` and `test/tooling/packages.test.ts`;
- synchronized frontend workspace metadata in `package-lock.json`.

Expected new operation references: `design.md`, `extract.md`, `document.md`, `critique.md`, `audit.md`, `polish.md`, `bolder.md`, `quieter.md`, `distill.md`, `harden.md`, `onboard.md`, `animate.md`, `colorize.md`, `typeset.md`, `layout.md`, `delight.md`, `overdrive.md`, `clarify.md`, `adapt.md`, `optimize.md`, and `live.md`.

The frontend package becomes explicitly `MIT AND Apache-2.0`: package-owned work stays MIT, while adapted Impeccable catalog references remain Apache-2.0. Append the complete Apache-2.0 text to the package `LICENSE`, retain upstream `NOTICE.md` content in `packages/frontend-developer/NOTICE.md`, add that notice to the packed file inventory, pin upstream commit `56f44523f76efdcec813e67b38ee550e49b16f48`, and mark every adapted reference as modified. Update the package validator’s narrow approved-license mapping and its tooling test rather than weakening the repository-wide default-MIT rule. Synchronize only the affected workspace metadata in `package-lock.json`; add no runtime dependency.

Tests: extend `packages/frontend-developer/test/resources.test.ts` with exact operation inventory, trigger vocabulary, routing, delegation, attribution, packed-resource, and forbidden-surface assertions. Extend `test/tooling/packages.test.ts` only for the named frontend dual-license contract.

### Dependencies

Accepted pitch and plan. Existing `frontend-design`, `interface-design`, `frontend-development`, `visual-validation`, `design_board`, `image_generation`, and optional engineering capabilities. No new runtime dependency or production tool; only approved license and packed-notice metadata changes.

### Execution lane and ownership

`serial`; current task worktree; one Writer owns all frontend-developer edits. Do not delegate overlapping reference, router, README, or test files.

### Red proof

Before production resource edits, add focused resource and tooling tests that fail because:

- `interface-craft` and its exact 21 operation references do not exist;
- Pi discovery has no trigger-rich `interface-craft` frontmatter `description`, `/design` has no natural-language routing surface, and the catalog body has no operation router;
- the required trigger phrases are absent or incomplete: “polish”, “audit”, “fix the layout”, “clarify”, “adapt”, “optimize”, “onboard”, “make bolder”, “make quieter”, “polish this”, “audit the settings flow”, “fix the mobile layout”, “make this calmer”, “improve onboarding”, “clarify the errors”, “document the design system”, “teach me this design system”, and “normalize”;
- routing and `/shape`, `init`, `craft`, and `/impeccable` collision rules are absent;
- dual-license metadata, complete Apache license text, retained upstream notice, modification markers, pinned provenance, and packed attribution inventory are absent;
- the package validator does not yet accept the named frontend package’s exact dual-license expression;
- forbidden Impeccable runtime/state strings are not guarded.

Run `npm test -- --run packages/frontend-developer/test/resources.test.ts test/tooling/packages.test.ts` and capture the intended failing assertions. Discovery tests must prove the frontmatter `description` carries selection terms, the catalog body owns routing, operation references own focused contracts, and `/design` supplies the human command surface.

### Green proof and checks

Implement the minimum coherent catalog and routing needed for the focused test to pass. Keep shared foundations in existing skills; keep each operation reference concise and operation-specific. Audit and critique remain evaluation-only unless follow-on work is requested. Behavioral changes delegate to `implement` or `developing-changes` when installed, otherwise use the existing direct-parent fallback. `live` reuses `playwright_browser`, target-owned site commands, `design_board`, and honest visual proof.

Apply the decided dual-license boundary and exact notice inventory without changing the root profile paths. The existing root `package.json` already loads the complete frontend skills directory and must remain unchanged.

Run:

- `npm test -- --run packages/frontend-developer/test/resources.test.ts test/tooling/packages.test.ts`;
- `npm --workspace @mopeyjellyfish/pi-frontend-developer test`;
- `npm run packages:check`;
- `npm pack --dry-run --json --ignore-scripts packages/frontend-developer` and inspect the exact license, notice, skill, reference, and prompt inventory.

A later slice 002 edit to shared routing, README, package inventory, or resource tests invalidates this green proof.

### Atomic commit and pull request

Atomic commit: `feat(pi-frontend-developer): add interface craft operations` in delivery unit 1. Pull-request base remains `main`; no stack position.

### Done when

- All 21 accepted operation references exist and are reachable through one catalog skill.
- The skill frontmatter description exposes agent-selection triggers, its body routes operations, references own focused contracts, and `/design` exposes the human request surface without one prompt per verb.
- `/shape` ownership, excluded `init`/`craft`/`/impeccable` names, mechanical-edit routing, evaluation-only behavior, and single engineering orchestration remain explicit.
- Exact `MIT AND Apache-2.0` metadata, complete license text, retained notice content, provenance, modification notices, package-validator support, synchronized lock metadata, and packed inventory cover adapted content.
- Focused, tooling, package, and package-validation tests pass with no forbidden runtime, hidden state, or repository-specific production path.

## [x] 002 — Humans and agents can safely create or reconcile DESIGN.md

### Outcome and requirement trace

A human can request `/design document ...`, and an agent can discover `design-documentation`, without completing a broader design task. Scan, seed, and merge/refresh modes produce a portable, evidence-grounded proposal and require explicit human approval before creation, replacement, or material rewrite. This satisfies AC-005 through AC-008, AC-011 through AC-013, and the DESIGN.md portion of AC-016.

### Seam and files

Public seams:

- new `packages/frontend-developer/skills/design-documentation/SKILL.md`;
- new official-format template under `packages/frontend-developer/skills/design-documentation/assets/DESIGN.template.md`;
- `packages/frontend-developer/skills/interface-craft/references/document.md` delegation;
- `packages/frontend-developer/prompts/design.md` document route;
- DESIGN.md precedence/delegation updates in `skills/frontend-design/references/design-contract.md`, `skills/frontend-design/SKILL.md`, and `skills/interface-design/SKILL.md`;
- `packages/frontend-developer/README.md`;
- root profile inventory descriptions in `README.md` and `AGENTS.md` after both new frontend skills exist; the root `package.json` remains unchanged because it already loads the complete frontend skills directory;
- `packages/frontend-developer/test/resources.test.ts`.

Move the canonical template to `skills/design-documentation/assets/DESIGN.template.md`, delete `skills/frontend-design/assets/DESIGN.template.md`, and repoint every inbound link, including `interface-design/SKILL.md`. Do not leave a redirect or duplicate schema.

### Dependencies

Slice 001 operation vocabulary and routing. Official DESIGN.md alpha specification reviewed during Shape. Existing repository precedence contract.

### Execution lane and ownership

`serial`; same frontend Writer and worktree after slice 001. Shared routing and tests make parallel work unsafe.

### Red proof

Add focused assertions before the new documentation skill and template:

- Pi skill discovery can find `design-documentation` and `/design document` routes to it;
- scan, seed, and merge/refresh modes are explicit;
- complete proposal presentation and approval-before-write rules are explicit;
- official alpha frontmatter groups and canonical section order are present;
- existing unknown content preservation, repository precedence, no invention, and no silent overwrite are present;
- `PRODUCT.md`, `.impeccable/`, sidecars, hidden state, and unsupported top-level token groups are rejected;
- the old `frontend-design/assets/DESIGN.template.md` path is absent from the packed inventory and no packaged resource links to it;
- root `README.md` and `AGENTS.md` enumerate `interface-craft` and `design-documentation` with the existing frontend skills.

Run `npm test -- --run packages/frontend-developer/test/resources.test.ts` and capture the intended failure.

### Green proof and checks

Implement one documentation owner and one canonical template. Scan mode extracts observed reused values and rendered evidence; seed mode records accepted direction and honest unresolved placeholders; merge/refresh mode shows the existing file and proposes a reconciliation. Use full-document `question` presentation with `format: "md"` and fullscreen formal approval when available; otherwise show the complete proposal conversationally. A cancelled or skipped question is not approval.

Use optional `version`, `name`, `description`, `omitted`, `colors`, `typography`, `rounded`, `spacing`, and `components` frontmatter. Keep present body sections in canonical order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do’s and Don’ts. Tokens are normative; prose explains use and rationale. Preserve unknown existing content where possible and ask on conflict.

Run:

- `npm test -- --run packages/frontend-developer/test/resources.test.ts`;
- `npm --workspace @mopeyjellyfish/pi-frontend-developer test`.

Any later shared frontend, root profile inventory, or package-resource edit invalidates the corresponding slice 001 or 002 assertions.

### Atomic commit and pull request

Atomic commit: `feat(pi-frontend-developer): add DESIGN.md documentation workflow` in delivery unit 1. Pull-request base remains `main`; no stack position.

### Done when

- `/design document` and `design-documentation` are independently usable.
- Scan, seed, and merge/refresh behavior is complete and evidence-grounded.
- The package has one official-format template and one approval/precedence contract.
- No write is authorized by agent discovery, silence, cancellation, or an existing absent file.
- Focused and frontend package tests pass.

## [x] 003 — Material UI scope receives design gates during Shape and planning

### Outcome and requirement trace

When installed capabilities and accepted scope indicate material UI work, Shape captures decision-changing interface evidence before pitch approval, and planning traces accepted interface intent into implementation slices and proof. Feature-flow remains independently installable and direct for non-UI or mechanical work. This satisfies AC-009 through AC-013 and the feature-flow portion of AC-016.

### Seam and files

Public seams:

- `packages/feature-flow/skills/shape/SKILL.md`;
- `packages/feature-flow/skills/planning-changes/SKILL.md`;
- conditional UI guidance in `packages/feature-flow/skills/shape/templates/pitch.md` and `plan.md`;
- `packages/feature-flow/README.md`;
- `packages/feature-flow/test/resources.test.ts`.

No dependency or package manifest change is expected. Feature-flow refers to applicable installed frontend-design, image-evidence, board, and visual-validation capabilities conditionally and provides a direct-parent fallback without naming this monorepo’s packages or tools as guaranteed resources.

### Dependencies

Slices 001 and 002 vocabulary and ownership contracts. Existing Shape → planning → implement lifecycle. New guidance must continue to satisfy the portability guard in `packages/feature-flow/test/resources.test.ts`: production Shape, planning, and template text names no repository, package path, package command, private model, or development-only capability.

### Execution lane and ownership

`serial`; same task worktree. A single Writer edits feature-flow after frontend vocabulary is stable. This package path does not overlap frontend files, but serial order avoids designing against provisional operation and DESIGN.md contracts.

### Red proof

Before changing feature-flow resources, extend `packages/feature-flow/test/resources.test.ts` with failing assertions that material UI scope conditionally requires:

- person/task, surface mode, current design authority, desired feel, focal workflow, representative states, responsive/accessibility constraints, operation needs, visual decisions, and DESIGN.md disposition in Shape;
- image-backed direction and explicit choice only when material visual direction remains unresolved and the capability exists;
- accepted interface requirement trace, state/responsive/accessibility coverage, design-system reuse, operation-specific checks, browser evidence, mismatch-ledger proof, and DESIGN.md approval gates in planning;
- direct mechanical routing, package independence, direct-parent fallback, and unchanged lifecycle approval/orchestration ownership.

Run `npm test -- --run packages/feature-flow/test/resources.test.ts` and capture the intended failure.

### Green proof and checks

Add concise conditional UI paragraphs and template prompts without bloating non-UI documents. Shape invokes applicable frontend design evidence before final pitch approval but retains product, architecture, and approval ownership. Planning orders a design-evidence slice before UI implementation when accepted direction remains provisional. DESIGN.md persistence is a separately approved write gate. `implement` remains the engineering owner; interface methods supply context and proof only.

Run:

- `npm test -- --run packages/feature-flow/test/resources.test.ts`;
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`.

Any vocabulary or lifecycle edit after this proof invalidates this focused test. Any frontend routing change that alters the conditional contract also invalidates cross-package final review and source smoke.

### Atomic commit and pull request

Atomic commit: `feat(pi-feature-flow): add UI design gates` in delivery unit 1. Pull-request base remains `main`; no stack position.

### Done when

- Material UI pitches and plans record accepted design evidence and proof obligations at the correct lifecycle stage.
- Image-backed choice is required only for unresolved material direction and never for a direct mechanical edit.
- DESIGN.md remains separately approved and repository evidence remains authoritative.
- Feature-flow has no hard frontend package or tool dependency and preserves the direct-parent fallback.
- Focused and feature-flow package tests pass.

## Integration, review, and completion gates

After all three slices and their atomic commits:

1. Inspect the complete diff and exact changed-file inventory. Confirm no generated files, sessions, credentials, sidecar state, hook manifests, dependencies, unapproved lockfile changes beyond the frontend license metadata, or unrelated formatting are present.
2. Run `npm run smoke:source` to prove the edited source packages load together with Pi.
3. Run `npm run check` against the final worktree. Run `npm run workflows:check` only if workflow files changed and `npm run security:check` only if dependency or installation mechanics changed; either change is forecast variance and should already have returned control.
4. Start the deterministic Pi command from this worktree, confirm expected skills and prompts load without conflict diagnostics, run the focused automated tests, use `/reload` while idle, and verify `/design polish`, `/design audit`, `/design document`, natural skill discovery, and `/shape` ownership without duplicate registrations or stale state. Close package-owned resources on shutdown.
5. Freeze the green diff and run one read-only formal review against the accepted pitch, this plan, repository standards, attribution, package independence, trigger coverage, and forbidden runtime/state surface.
6. Send material findings to the retained implementation Writer for the smallest repairs. Rerun every invalidated focused, package, smoke, and repository gate. Repeat gate 4 whenever a prompt, skill, reference, or template changed after reload acceptance. Stop on repeated or out-of-scope failures.
7. Inspect final commits, `git status`, package contents, and residual risks. Use `open-pr` once for delivery unit 1. Do not merge or remove the worktree.

The delivery unit is complete when AC-001 through AC-016 are traceable to green focused proof, source smoke and `npm run check` pass after the final edit, deterministic reload acceptance is recorded, formal review has no unresolved blocking findings, the branch contains only approved atomic units, and one bounded pull request is ready for human review.
