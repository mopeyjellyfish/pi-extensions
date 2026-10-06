---
status: accepted
---

# Plan: Explicit review-to-Shape handoff

This plan delivers the accepted review-to-Shape handoff across the independent Engineering, Frontend Developer, and Feature Flow packages. It keeps one coherent review, validation, and publication boundary.

## Review evidence

- **Applicability:** `not applicable`; the plan changes Markdown workflow resources and no Go source, module, CLI, or Go-specific routing.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

## Execution mode

Checkpointed implementation. This single delivery unit has no intermediate delivery-unit checkpoint. Whole-plan approval authorizes only the named plan and does not authorize merge, release, deployment, destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                         | Pull request base | Dependencies             | Checks                                             | Ownership                                    | Integration point                                      | CI fan-out                | Cascade cost                                   |
| ------------- | ---------- | -------------- | ------------------------------ | ----------------- | ------------------------ | -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ | ------------------------- | ---------------------------------------------- |
| 1             | standalone | `standalone`   | `feat/review-to-shape-handoff` | `main`            | accepted pitch `42688d1` | focused Markdown and source smoke; `npm run check` | current isolated worktree; one Worker writer | final cross-package contract review on the frozen diff | one required pull request | low; one branch and no dependent pull requests |

The pitch, plan, and implementation share this delivery unit and one pull request. The accepted pitch remains its own atomic commit because Shape approval required it before planning. The accepted plan will be another atomic root-document commit. Package behavior changes use package-scoped atomic commits inside the same branch so Release Please can attribute them correctly.

## Critical path, dependencies, and lanes

The work is serial in one existing isolated worktree because the slices change adjacent workflow contracts and final documentation must describe their joined behavior.

Critical path:

1. Define explicit Shape choices and self-contained reviewed-candidate handoffs in Engineering.
2. Define optional Shape-and-plan choices for visual improvement review and focused critique or audit in Frontend Developer.
3. Teach Feature Flow to preserve accepted upstream review evidence, then reconcile root and package documentation.
4. Run focused formatting, Markdown, and source-loading proof.
5. Freeze the complete diff for one formal read-only review because the change alters public workflow behavior across package boundaries.
6. Resolve material findings, rerun invalidated proof, run `npm run check` once on the final tree, then publish one standalone pull request.

Forecast: one active implementation lane, one delivery unit, one pull request, no integration merge, no expensive browser or provider gate, and low cascade cost.

Invalidation map:

- A change to Engineering triage labels, grouping, authority, or fallback invalidates slice 001 inspection and focused Markdown proof.
- A change to UI selection, audit routing, evidence preservation, or fallback invalidates slice 002 inspection and focused Markdown proof.
- A change to Shape input handling, approval boundaries, package installation assumptions, or cross-package wording invalidates slice 003 inspection and source smoke.
- Any post-review edit invalidates the reviewed diff for the changed paths. Material intent or architecture change returns to Shape. Any final edit invalidates the final required gate evidence.

## [ ] 001 — Choose Shape explicitly from architecture improvement review

### Outcome and requirement trace

A user who has reviewed `/improve` candidates can choose Shape for one candidate, a selected subset, or all awaiting candidates. The handoff preserves the complete reviewed evidence and starts only the pitch lifecycle. This slice satisfies AC-001, AC-002, AC-005, and the Engineering part of AC-006 and AC-008.

### Seam and files

Public seams:

- `/improve` terminal candidate triage and its Question fallback;
- the `improve-codebase-architecture` Action and Shape handoff contract; and
- the Engineering package README.

Likely files:

- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/prompts/improve.md`
- `packages/engineering/README.md`

Keep the existing appetite-aware **Action** route. Add distinct **Shape all**, **Shape selected**, and per-candidate **Shape** choices. The self-contained handoff must include stable candidate IDs, scope, evidence, constraints, dependencies, overlap, integration points, uncertainty, recommended routes, proof needs, and the user's chosen candidate set. If `shape` is unavailable, return that handoff and name the unmet capability.

### Dependencies

Accepted pitch `docs/features/review-to-shape-handoff/pitch.md`; no implementation slice dependency.

### Execution lane and ownership

Serial lane in the current Worktrunk worktree. One Worker owns the listed Engineering files for this slice.

### Red proof

Before-state inspection shows that batch triage offers **Action all**, **Track all**, **Select candidates**, and **Review individually**; selected triage offers no Shape choice; and individual review offers only **Action**, **Track**, **Won't do**, and **Deepen**. The existing Action route can infer Shape but cannot record an explicit user choice to use the pitch lifecycle.

Do not add tests that assert these Markdown contents.

### Green proof and checks

Inspect the final terminal option sets and fallback prose against AC-001 and AC-002. Confirm that Shape is distinct from Action, browser controls remain non-authoritative, and missing companion behavior is explicit. Run Prettier and markdownlint on the changed Engineering Markdown files.

### Atomic commit and pull request

Atomic commit: `feat(pi-engineering): add explicit Shape handoffs to improve`

Delivery unit 1, standalone pull request to `main`.

### Done when

- Individual, selected, and all-candidate paths expose an explicit Shape decision.
- The handoff is self-contained and starts no writer.
- Existing Action, Track, Won't do, Deepen, report, and browser-authority behavior remains intact.
- Independent installation fallback is explicit.
- Focused Markdown checks pass.

## [ ] 002 — Choose Shape after UI improvement review

### Outcome and requirement trace

After an accepted `/improve-ui` visual direction, the user can choose **Shape and plan** or **Plan directly**. A focused read-only critique or audit offers the same choice only when the user asks to deliver proposed improvements. Accepted visual evidence is preserved instead of repeated. This slice satisfies AC-003, AC-004, AC-005, and the Frontend Developer part of AC-006 and AC-008.

### Seam and files

Public seams:

- `/improve-ui` after explicit visual selection;
- `frontend-design` routing for the composed improvement workflow;
- `interface-craft` critique and audit completion; and
- the Frontend Developer package README.

Likely files:

- `packages/frontend-developer/prompts/improve-ui.md`
- `packages/frontend-developer/skills/frontend-design/SKILL.md`
- `packages/frontend-developer/skills/interface-craft/SKILL.md`
- `packages/frontend-developer/README.md`

The Shape handoff must carry the accepted direction, inspected image evidence, user notes, current-state and research evidence, constraints, accessibility and responsive requirements, unmet proof, and selected operation context. **Plan directly** preserves the current planning route. Missing `shape` or `planning-changes` returns the same self-contained context and names the unmet capability.

### Dependencies

Slice 001 establishes the shared user-facing distinction between explicit Shape and the existing direct route. No file dependency requires a separate branch.

### Execution lane and ownership

Serial lane in the current Worktrunk worktree. The same retained Worker owns the listed Frontend Developer files after slice 001.

### Red proof

Before-state inspection shows that `/improve-ui` always hands accepted design evidence directly to `planning-changes`. `interface-craft` critique and audit propose a follow-on operation but do not define an explicit Shape-or-plan delivery decision.

Do not add tests that assert these Markdown contents.

### Green proof and checks

Inspect the final prompt and skill contracts against AC-003 and AC-004. Confirm that visual selection is not repeated, terminal choice remains authoritative, review stays read-only, direct planning remains available, and no implementation starts. Run Prettier and markdownlint on the changed Frontend Developer Markdown files.

### Atomic commit and pull request

Atomic commit: `feat(pi-frontend-developer): add review-to-Shape handoff`

Delivery unit 1, standalone pull request to `main`.

### Done when

- `/improve-ui` asks the explicit Shape-or-plan delivery question after visual selection.
- Critique and audit remain read-only and offer the choice only for requested follow-on delivery.
- Accepted image and research evidence reaches Shape without a second visual selection.
- Independent installation fallback is explicit.
- Focused Markdown checks pass.

## [ ] 003 — Preserve upstream review evidence through Shape and document the joined flow

### Outcome and requirement trace

Shape accepts a self-contained improvement-review handoff as feature-brief evidence, preserves explicit prior decisions, and does not rerun settled visual selection unless a material ambiguity remains. Public package and root documentation describe one consistent review-to-pitch-to-plan lifecycle. Fixed-diff `/code-review` remains outside this feature. This slice satisfies AC-005, AC-006, AC-007, and AC-008.

### Seam and files

Public seams:

- Shape's accepted feature-brief input and evidence rules;
- the Feature Flow package contract;
- root architecture and profile guidance; and
- the accepted plan document.

Likely files:

- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/README.md`
- `docs/architecture.md`
- `README.md`
- `docs/features/review-to-shape-handoff/plan.md`

Do not alter `/code-review` command behavior. State only that fixed-diff review remains defect-focused and is not an improvement-discovery handoff.

### Dependencies

Slices 001 and 002, because this slice reconciles their concrete handoff fields and option names.

### Execution lane and ownership

Serial lane in the current Worktrunk worktree. The same retained Worker owns the listed Feature Flow and root documentation files after slice 002.

### Red proof

Before-state inspection shows that Shape accepts a general feature brief but does not explicitly preserve an upstream reviewed candidate set or accepted visual selection. Root and package documentation describe automatic improvement routing or direct UI planning, not the new explicit choice.

Do not add tests that assert document wording.

### Green proof and checks

Inspect the complete workflow from review decision through Shape approval and planning approval. Confirm:

- upstream evidence is input, not implicit approval;
- settled visual evidence is preserved;
- Shape still writes and seeks approval for a pitch;
- planning still writes and seeks approval for a complete plan;
- unavailable companions produce honest self-contained fallback evidence; and
- `/code-review` authority and behavior are unchanged.

Run focused Prettier and markdownlint for every changed Markdown file, then `npm run smoke:source`. Freeze the diff for one fresh read-only Reviewer pass against the accepted pitch and plan. Repair material findings with the retained Worker and rerun only invalidated focused proof. Run `npm run check` against the final tree.

### Atomic commit and pull request

Atomic commit: `docs(pi-feature-flow): define improvement review handoffs`

Root documentation supports the same package contract in this commit. Delivery unit 1, standalone pull request to `main`.

### Done when

- Shape preserves complete reviewed evidence without treating it as pitch or plan approval.
- Previously accepted visual selection is not repeated unless a material ambiguity invalidates it.
- Feature Flow, Engineering, Frontend Developer, root README, and architecture documentation use consistent terms and authority boundaries.
- Formal review has no unresolved material finding.
- `npm run smoke:source` and `npm run check` pass on the final tree.
- The final diff contains only the accepted pitch, plan, and named workflow documentation changes.
