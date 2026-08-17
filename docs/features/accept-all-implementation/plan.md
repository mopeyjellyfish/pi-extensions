---
status: accepted
---

# Plan: Optional accept-all implementation authority

## Delivery topology

| Delivery unit | Branch                               | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                      |
| ------------- | ------------------------------------ | ----------------- | --------------- | ------------ | -------------------------------------------------------- |
| 1             | `feat/implement-continuation-prompt` | `main`            | `001`, `002`    | none         | serial; current isolated worktree; one Worker owns edits |

The planning document shares the implementation delivery unit and existing pull
request #79. This follow-up adds one atomic commit to the standalone branch. It
does not create a stack.

## Critical path, dependencies, and lanes

The critical path is serial: define and approve the execution-mode contract in
feature-flow, then make implement consume that accepted contract. There is one
active lane, one delivery unit, one branch, one pull request, and one integration
point between the accepted plan and implement. The full repository check is the
only expensive gate. Cascade cost is low because no parallel lanes or dependent
pull requests exist.

Invalidation map:

- Feature-flow wording or templates invalidate the feature-flow resource test.
- Implement authority wording invalidates the engineering resource test.
- Changes to the shared execution-mode contract invalidate both focused tests.
- Any final edit invalidates formatting and the full `npm run check` gate.

Pause before further publication if the work requires a fifth option in an
existing four-option approval question, broad authority outside the accepted
plan, a new runtime dependency, or another delivery unit.

## [x] 001 — Record and approve an optional implementation mode

### Outcome and requirement trace

During Shape, the human may optionally choose checkpointed implementation or
request accept-all implementation. The pitch records the request as a preference,
not authority over a plan that does not exist yet. The complete plan repeats the
selected mode. Approval of the whole plan confirms either the default
checkpointed mode or accept-all authority for every named delivery unit.

This traces to the requested optional choice while pitching and preserves the
existing rule that only a complete accepted plan can grant informed delivery
authority.

### Seam and files

- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/skills/shape/templates/pitch.md`
- `packages/feature-flow/skills/shape/templates/plan.md`
- `packages/feature-flow/README.md`
- `packages/feature-flow/test/resources.test.ts`

### Dependencies

None.

### Execution lane and ownership

`serial`; the configured Worker is the sole writer in the current isolated
worktree.

### Red proof

Add focused resource assertions that fail until Shape asks a separate optional
execution-mode question, the pitch records the preference, and planning confirms
the selected mode as part of whole-plan approval.

### Green proof and checks

Run `npm --workspace @mopeyjellyfish/pi-feature-flow test`. A revision to the
execution-mode terms invalidates this proof and the integration proof in slice 002.

### Atomic commit and pull request

Part of one follow-up atomic commit in delivery unit 1 on the existing standalone
pull request #79.

### Done when

- Checkpointed implementation remains the default.
- Shape can record an accept-all preference without treating it as premature
  implementation authority.
- Whole-plan approval explicitly confirms the chosen implementation mode.
- Accept-all authority is bounded to the named accepted plan and excludes merge,
  release, deployment, destructive cleanup, and unrelated work.

## [x] 002 — Execute accepted plans without routine prompts when authorized

### Outcome and requirement trace

When an accepted plan records accept-all authority, implement still runs every
planned test, required gate, fixed formal review, commit, and authorized
publication step, but it does not ask routine per-unit Accept and publish or
Continue questions. It proceeds through all named delivery units in dependency
order.

It pauses and returns control to the human for setup, test, check, commit, or
publication failures; material review findings; material forecast variance;
or any change to accepted scope, delivery boundaries, dependencies, or
authority. Checkpointed plans keep the existing prompts unchanged.

### Seam and files

- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`

### Dependencies

Slice 001 defines the accepted execution-mode contract.

### Execution lane and ownership

`serial`; the same Worker and worktree continue from slice 001.

### Red proof

Add focused resource assertions that fail until implement distinguishes the
default checkpointed mode from accepted accept-all authority, preserves all
verification and review work, suppresses only routine questions, and names every
mandatory pause condition.

### Green proof and checks

Run `npm --workspace @mopeyjellyfish/pi-engineering test`, then both focused
package tests as integration proof. Run `npm run check` once after the final
edit. Any revision to authority, pause conditions, or package documentation
invalidates both focused tests and the full gate.

### Atomic commit and pull request

Complete the single follow-up atomic commit in delivery unit 1 and update the
existing standalone pull request #79 after acceptance.

### Done when

- Default checkpointed plans retain Continue, Review next unit, Discuss, and
  Accept and publish prompts.
- Accept-all plans complete every named unit without routine human prompts.
- Tests, checks, fixed review, commit, and authorized publication remain
  mandatory.
- Every failure, material finding or variance, and accepted-plan change pauses
  safely.
- Focused tests and `npm run check` pass, the fixed review has no unresolved
  material finding, and the final diff stays within the two owning packages plus
  this plan.
