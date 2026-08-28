---
status: accepted
---

# Shape: Automatic implementation publication

## Problem and evidence

The implementation flow stops after verification and asks for a separate
**Accept and publish** decision before it commits, pushes, and opens a pull
request. The user repeatedly has to request the same final actions.

This behavior conflicts with the accepted right-sized delivery direction in
`docs/features/core-workflow-routing/pitch.md`. That direction says accepted
verified work publishes automatically without a second authorization prompt.
The planning flow also already grants later pull-request publication authority
when the human approves a complete plan.

The missing case is normal checkpointed and plan-less implementation. It should
finish the delivery unit instead of returning a verified but unpublished branch.

## Proposed solution

Make a bounded implementation request publication authority for its named task
branch and delivery unit, unless the user explicitly requests local-only work or
excludes commit, push, or pull-request creation.

After implementation, complete the delivery unit in this order:

1. Run focused proof and required gates.
2. Run risk-selected QA or formal review.
3. Repair accepted findings and rerun invalidated evidence.
4. Use `commit` for the verified atomic commit or commits.
5. Use `open-pr` for the normal push and for ready pull-request creation or
   update.
6. Verify the remote branch and pull-request metadata, then report the result.

Do not ask a final **Accept and publish** question. Checkpointed plans keep the
checkpoint before the next delivery unit. Accept-all plans continue through
ready units without routine questions.

Keep publication behind successful evidence and resolved review findings. If
authentication, the base branch, the remote branch, required tooling, commit,
push, or pull-request verification is unsafe or fails, stop with preserved local
evidence and one clear recovery action.

The Engineering package owns this change through `implement`, its prompt,
package documentation, and focused resource tests. Root documentation can state
the default. Existing `commit` and `open-pr` safeguards remain the publication
implementation. Feature Flow already grants later publication authority for an
accepted plan and does not need a second publication contract.

## Boundaries and no-gos

- Do not change review into a mutation-capable method. Publication starts only
  after the parent accepts the completed evidence and resolves required review
  findings.
- Do not change `/just-do-it`; this pitch covers the normal `implement` flow.
- Do not publish when the user requests local-only work, no commit, no push, or
  no pull request.
- Do not publish unrelated dirty files or use the default branch as the head.
- Do not bypass `commit`, `open-pr`, repository hooks, required checks, or
  planned stack topology.
- Do not retry a failed Git or GitHub mutation without diagnosis and new
  evidence.
- Do not authorize merge, release, deployment, branch deletion, worktree
  cleanup, plain force push, destructive actions, or unrelated changes.
- Do not make the independently installable Engineering package depend on this
  repository's private agents or companion packages.

## Decision-changing research and risks

- The current `implement` skill already waits for tests, gates, and selected
  review before publication. The primary change is authority and removal of the
  final publication prompt, not a new delivery system.
- `planning-changes` already states that whole-plan approval authorizes later
  pull-request publication. Removing the duplicate prompt makes that authority
  effective for checkpointed plans.
- A plan-less implementation has no prior plan approval. Treat the direct
  bounded implementation request as publication authority, with an explicit
  local-only opt-out.
- Automatic remote mutation can expose a wrong base, branch, or account sooner.
  Existing `open-pr` preflight and fail-closed behavior remain mandatory.
- If `commit` or `open-pr` is unavailable in an independent installation, the
  parent must preserve verified local work and report the unmet publication
  method. It must not issue ad hoc Git commands.

## Review evidence

- **Applicability:** not applicable. This pitch does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns routing, scope, architecture, evidence acceptance, repair
verification, and publication readiness.

The selected execution preference is **accept-all implementation**. This
preference is not implementation authority until the complete plan is approved.
Whole-plan approval can authorize the named branch's bounded documentation,
tests, skill changes, commits, normal push, and pull-request creation or update.
It never authorizes merge, release, deployment, destructive cleanup, branch
deletion, plain force push, or unrelated work.

## Observable acceptance criteria

- **AC-001 — Default publication authority:** A direct bounded implementation
  request or accepted plan authorizes commit, normal push, and ready pull-request
  creation or update for its named task branch and delivery unit.
- **AC-002 — Post-review order:** Publication starts only after required tests,
  gates, selected review, accepted repairs, and invalidated evidence are complete.
- **AC-003 — No final publication prompt:** Checkpointed and accept-all
  implementation do not ask **Accept and publish** after a delivery unit is
  verified.
- **AC-004 — Checkpoint boundary:** Checkpointed plans still ask before starting
  the next delivery unit. They do not ask again before publishing the completed
  unit.
- **AC-005 — Explicit opt-out:** A local-only, no-commit, no-push, or no-PR
  instruction prevents the excluded publication action and is reported in the
  final state.
- **AC-006 — Focused Git methods:** `implement` invokes installed `commit` and
  `open-pr` methods. It does not embed ad hoc commit, push, or pull-request
  commands.
- **AC-007 — Fail closed:** Unsafe or failed authentication, base, branch,
  tooling, commit, push, or pull-request verification stops with local evidence
  and a bounded recovery action.
- **AC-008 — Safety boundary:** Automatic publication never includes merge,
  release, deployment, destructive cleanup, branch deletion, plain force push,
  or unrelated changes.
- **AC-009 — Independent installation:** Missing companion publication methods
  are reported honestly and do not cause the Engineering package to assume
  private repository resources.
- **AC-010 — Discoverable contract:** The `/implement` prompt, Engineering and
  root documentation, and focused resource tests describe and protect automatic
  post-review publication.
