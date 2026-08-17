---
status: accepted
---

# Shape: Fast, evidence-driven delivery

## Problem and evidence

The delivery workflow can preserve safety while still losing substantial elapsed
time to coordination. A complete plan may turn every vertical slice into a
separate branch, pull request, review, and full validation cycle even when those
slices are tightly coupled and only useful together. Lower-branch corrections
then cascade through upper branches, multiplying rebases, remote checks, and
metadata verification.

Implementation feedback can also arrive too late. When focused lint, type,
contract, or integration signals are deferred until publication, a small defect
invalidates already-published delivery units. Conversely, repeating every
expensive check after each small edit adds latency without increasing confidence
when the edit did not invalidate that evidence.

Delegation and review have similar fixed costs. Fresh agents repeatedly recover
context, and repeated fixed-point reviews or Git handoffs can take longer than
the bounded work they protect. The workflow needs to optimize the critical path,
not maximize slices, branches, agents, checks, or gates.

## Proposed solution

Make planning distinguish three concepts that are currently too easy to
conflate:

1. A **vertical slice** is the smallest end-to-end behavior with a focused red
   and green signal.
2. A **delivery unit** is one coherent review and validation boundary containing
   one or more dependent vertical slices.
3. A **branch or pull request** publishes one delivery unit. It is not created
   merely because a slice, package, directory, or commit exists.

Planning first identifies vertical slices from observable acceptance criteria.
For each slice it names the public seam, the narrowest deterministic command
that fails for the intended behavioral reason, and its dependencies. It then
groups slices into the fewest coherent delivery units that preserve independent
review, rollback, ownership, and merge value.

Grouping slices into one delivery unit does not collapse atomic commit
boundaries. The commit workflow still splits the work into one or more atomic
commits by coherent change. A delivery unit is the shared review, validation,
and publication boundary, not a commit-count rule.

For a single-delivery-unit plan, accepted pitch and plan commits stay on the
same task branch as the implementation they authorize and publish once with
that implementation. Give planning documents a separate delivery unit only when
they need independent review or merge value before implementation.

Use one branch and pull request by default. Plan a stack only when every position
has independent review and merge value, can satisfy its own required checks,
and materially reduces risk or the critical path enough to repay cascade and CI
fan-out costs. Keep tightly coupled contract changes in one delivery unit. Use a
separate worktree only for an active independent writer lane, not for every
planned commit or slice.

Add an invalidation-aware validation ladder:

- run the narrowest public-seam red/green proof while developing each vertical
  slice;
- run affected package or component checks when a dependency boundary changes;
- run integration checks when dependent slices join;
- run required full checks once at the stable delivery-unit boundary before
  publication;
- after a revision, rerun the checks invalidated by the changed files or
  behavior, plus required final gates, instead of reflexively repeating all
  prior evidence.

The plan predeclares which signal each relevant change surface invalidates, so
invalidation is a reviewed planning decision rather than improvised during
implementation. Reuse recorded evidence only while its covered surface is
unchanged. Invalidation can reduce intermediate repetition; it never reduces
the complete required-check run at the stable delivery-unit boundary.

Required repository checks remain mandatory. The optimization changes when and
why evidence is collected; it does not weaken target-repository policy.

Make execution account for fixed coordination cost. Reuse one writer for a
serial delivery unit. Delegate only when a bounded agent run is expected to
shorten elapsed time, protect scarce parent context, or provide genuinely
independent evidence. Batch related Git publication operations after the unit is
stable. Diagnose remote failures from their current event, trigger, payload, and
logs before retrying; do not use retries as diagnosis.

Planning records a concise delivery-efficiency forecast: critical path, active
writer lanes, delivery-unit and pull-request count, expensive validation gates,
integration points, and likely cascade cost. If orchestration, publication, or
validation is expected to dominate implementation, simplify the topology before
approval. Do not add this forecast to a route that already delivers one bounded
unit without a plan.

If observed rebases, republication, repeated validation, or handoffs materially
exceed the accepted forecast, pause before more remote mutation, show the
variance, and simplify the remaining topology. Seek fresh approval when the
correction changes accepted delivery boundaries or authority.

Implementation keeps one fixed review at each stable delivery-unit boundary.
Material findings return to the owning writer, but unchanged evidence is reused
unless the revision invalidates it. The parent verifies the final diff,
requirement trace, completion state, and required checks before publication.

## Boundaries and no-gos

- Keep worktree isolation, sole-writer ownership, explicit human decisions,
  required repository checks, independent review where material, and bounded
  remote authority.
- Formalize the existing `delivery unit` term as one shared definition in the
  workflow vocabulary, planning, implementation, and publication guidance.
- Do not encode repository names, paths, package layouts, CI providers, languages,
  commands, agent names, model names, or timing assumptions from one project.
- Do not define branch size by file count, line count, package count, or a fixed
  maximum number of commits.
- Do not force unrelated behavior into one pull request merely to reduce PR
  count; independent risk, ownership, review, rollback, or merge value still
  justifies separation.
- Do not make a stack the default for multi-slice work.
- Do not skip a required check, security review, migration proof, or target
  repository gate to meet a speed goal.
- Do not parallelize overlapping writers or unresolved dependencies.
- Do not repeat full validation or review solely because a workflow stage was
  entered; tie repetition to evidence invalidation and required final gates.
- Reshape when no focused feedback seam exists, a delivery unit cannot pass on
  its own, stack synchronization dominates the critical path, or late failures
  repeatedly escape the focused loop.

## Decision-changing research and risks

The current one-to-one mapping is encoded in the plan template's per-slice
atomic-commit-and-pull-request field, the slice field list in planning guidance,
the implementation instruction to run required completion checks after each
coherent edit, and contract tests that assert those headings. These surfaces
encourage branch topology to follow decomposition rather than review and merge
economics, and they do not distinguish focused feedback, integration proof, and
expensive final gates.

Grouping slices can create oversized pull requests if coherence is treated as a
reason to avoid useful boundaries. The plan therefore must state why each
delivery unit is independently reviewable and why any split repays its
coordination cost. Invalidation-aware checking can become hand-waving unless the
plan names concrete focused, integration, and final signals and the parent still
runs every repository-required gate before publication.

## Authority

The parent owns slice design, delivery-unit grouping, branch topology, validation
invalidation decisions, architecture judgment, synthesis, and approval. Bounded
mapping, implementation, QA, review, and Git capabilities may supply evidence
when they shorten the critical path. They do not create extra lanes, branches,
checks, or retries by default.

Approval authorizes only the named implementation and publication work already
covered by the existing lifecycle. It does not add merge, release, deployment,
destructive cleanup, bypass, or unrelated remote authority.

## Observable acceptance criteria

- **AC-001 — Separate planning concepts:** Planning distinguishes vertical
  slices, delivery units, atomic commits, branches, and pull requests instead of
  mapping them one-to-one; multi-slice delivery units preserve atomic commit
  splitting by coherent change.
- **AC-002 — Vertical feedback:** Every behavioral slice names the narrowest
  stable public seam and a deterministic red/green command that can guide its
  implementation before broad validation.
- **AC-003 — Right-sized branches:** The plan defaults to one coherent delivery
  branch and introduces another branch or stacked PR only for independent review,
  ownership, rollback, risk, merge value, or material critical-path benefit. It
  also states whether accepted planning documents share the implementation
  delivery unit.
- **AC-004 — Stack economics:** A planned stack states each position's independent
  value, required-check viability, integration dependency, CI fan-out, and
  cascade cost; otherwise the plan collapses it into fewer delivery units.
- **AC-005 — Efficient worktrees and agents:** A serial delivery unit reuses one
  writer and one worktree. Each delegation states whether it provides genuine
  critical-path parallelism, parent-context protection, or independent evidence,
  and related publication operations are batched after the unit is stable.
- **AC-006 — Validation ladder:** Implementation uses focused slice feedback,
  affected-boundary checks, integration proof, and required stable-boundary
  checks without weakening target-repository gates.
- **AC-007 — Evidence invalidation:** Revisions rerun evidence their changed
  surface invalidates, reuse only evidence whose covered surface is unchanged,
  and always complete the full required-check set at the stable boundary before
  publication.
- **AC-008 — Stable review boundary:** Formal review occurs on a complete stable
  delivery unit, which is what implementation guidance means by a completed
  unit. Material revisions return to the owning writer and trigger applicable
  reverification before the final gate.
- **AC-009 — Diagnose before retry:** Remote failures are inspected through their
  configuration, triggering event, current state, and logs before one bounded
  corrective action; blind reruns are prohibited.
- **AC-010 — Critical-path forecast:** A complete plan exposes critical path,
  active lanes, delivery-unit and PR count, integration points, expensive gates,
  and likely cascade cost so topology can be simplified before approval.
- **AC-011 — Repository-neutral contract:** Production guidance remains portable
  across repositories, languages, CI systems, package structures, and available
  agent capabilities, with direct-parent fallbacks.
- **AC-012 — Quality floor:** Worktree safety, sole-writer ownership, explicit
  approval, requirement traceability, required checks, security and migration
  evidence, final diff inspection, and bounded publication authority remain
  intact.
- **AC-013 — Mid-flight correction:** When observed coordination cost materially
  exceeds the accepted forecast, the parent pauses, shows the variance, and
  simplifies the remaining topology before continuing, with fresh approval for
  changed delivery boundaries or authority.
