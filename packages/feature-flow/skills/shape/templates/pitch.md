---
status: draft
---

# Shape: {{feature}}

## Problem and evidence

Name the primary user journey, observable outcome, and shortest end-to-end
proof. State only pain and evidence that changes the proposal.

## Proposed solution

State the smallest useful behavior and concrete failure risks. Compatibility
and migrations need actual users, data, contracts, or explicitly requested policy.
Order early runnable proof before necessary supporting machinery.
For delivery work, distinguish vertical slices (testable end-to-end behaviors),
delivery units (review, validation, and publication boundaries), atomic commits,
branches, and pull requests. State whether planning documents need independent
review or merge value before implementation.

For material interface scope, record the accepted design evidence, person and
task, design authority, representative states, responsive and accessibility
constraints, chosen visual direction, operation needs, and `DESIGN.md`
disposition. For a greenfield web application or materially new application
surface, also record the selected evidence and image-to-interface contract:
desired feel, focal workflow, visible regions and hierarchy, layout, density,
palette, typography, shape language, imagery, represented and missing states,
reusable target components and semantic tokens when known, and unresolved
behavior or visual ambiguity. Generated pixels are evidence, not hidden behavior
or production assets. Omit this guidance for non-interface or bounded mechanical
work.

## Boundaries and no-gos

Name scope limits, acceptable cuts, prohibited workarounds, and reshape triggers.
State which prior scope a later decision replaces or defers.

## Decision-changing research and risks

Record only research, alternatives, unknowns, and risks that change a decision.
Omit this section's entries when none do.

## Review evidence

- **Applicability:** `not applicable` for non-Go work; otherwise state the
  Go-targeted evidence.
- **Fixed document:** State the reviewed pitch revision, or `deferred to implementation-ready plan`
  when no consequential Go design decision needs early commitment, or `not applicable`.
- **Status:** State the early Go review result, `deferred`, or `not applicable`. Do not
  require both pitch and plan passes for unchanged decisions.
- **Invalidation:** State why the review remains valid or was replaced, or
  `not applicable`.

## Authority

State parent-owned product and architecture decisions and the bounded authority
needed for approved delivery. Record the execution mode: checkpointed
implementation (default) or an accept-all preference. The preference is not
implementation authority until whole-plan approval. Never infer remote, release,
or destructive authority.

## Observable acceptance criteria

- **AC-NNN — Name:** Observable outcome.
