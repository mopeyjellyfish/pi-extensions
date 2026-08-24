---
name: planning-changes
description: >-
  Turns explicit accepted intent or an accepted Shape pitch into one complete
  delivery plan before implementation.
---

# Planning changes

Accept explicit accepted intent or an accepted Shape pitch. The selected parent
owns product and architecture judgment, slice design, approval, synthesis, and
verification. Make the first action selecting or creating an isolated linked
worktree. Do not read instructions, contracts, tests, or planning context before
the task has that worktree. Reuse the Shape worktree or create one with the
available lifecycle tool. If no safe tool is available, stop before any other
planning work and ask the human to provide an isolated worktree. Never use the
main-branch checkout.

After routing, read the relevant instructions, public contracts, and tests.
For accepted intent without a pitch, use checkpointed implementation unless the
human explicitly selected accept-all. Create or update
`docs/features/<slug>/plan.md` from `../shape/templates/plan.md` with
`status: draft`, unless the target repository defines another feature-document
location.

## Plan complete delivery

Write one complete delivery plan before implementation begins. Cover all
accepted scope, not only the first slice. Do not alternate plan / work / plan /
work. Identify vertical slices first: each is an observable end-to-end behavior
with a narrow deterministic red/green signal. Group dependent slices into the
fewest coherent delivery units. A delivery unit is one review, validation, and
publication boundary; atomic commits remain coherent-change boundaries within it.

One delivery unit, one branch, and one pull request is the default. Planning
documents share the implementation delivery unit's publication unless they have
independent review or merge value. Split only when independent review, ownership, rollback, risk,
or merge value repays coordination cost. Plan a stack only when every position
states independent value, required-check viability, integration dependency,
CI fan-out, and justified cascade cost; otherwise collapse it into fewer units.
A planned stack uses `open-pr` and `gh stack`.

Record the critical path and independent lanes in a critical-path forecast:
active lanes, delivery-unit and pull-request count, integration points, expensive
gates, and likely cascade cost. Predeclare
an invalidation map: focused slice proof, affected-boundary checks, integration
proof, and required stable-unit gates. Reuse evidence only while its covered
surface is unchanged. For checkpointed plans, if observed coordination
materially exceeds the forecast, pause before further publication, show the
variance, simplify the remaining topology, and seek fresh approval only when
delivery boundaries or authority change.

Repeat the pitch's selected execution mode in the complete plan: checkpointed
implementation remains the default, and accept-all remains a preference until
whole-plan approval confirms accept-all authority. State that accept-all
authority applies only to the named accepted plan and never authorizes merge,
release, deployment, destructive cleanup, or unrelated work. For an accepted
accept-all plan, every material forecast variance returns control to the human,
even when delivery boundaries and authority do not change. Fresh approval is
required only when delivery boundaries or authority change.

For every slice record its observable outcome and requirement trace, public seam
and files, dependencies, execution lane/worktree ownership, red proof, green
proof and checks, atomic commit, PR base/stack position, and done conditions.
Use separate isolated worktrees and a sole writer for every parallel lane.
Reject overlapping parallel writers, shared mutable boundaries, and unresolved
dependencies; serialize them instead. Planning does not implement or start
parallel work.

When the accepted pitch contains material UI scope, trace its accepted interface
criteria into vertical slices. Each relevant interface slice names
`frontend-development`, the accepted design or operation method, representative
states, responsive surfaces, accessibility paths, design-system reuse, and
operation-specific checks. Name `react-interface` only for a React target. When
an evidence capability exists, name `visual-validation`, target-owned browser
evidence, and a visual mismatch ledger: a prioritized list of observed
differences, likely causes, and recheck targets. If direction remains
provisional, order a design-evidence slice before UI implementation. Plan a
parent-owned `design-documentation` and `DESIGN.md` approval gate when durable
decisions should persist. Frontend methods supply context, implementation, and
proof; `implement` retains engineering orchestration. If these installed frontend
methods are unavailable, use the direct-parent fallback and record the unmet
method or proof honestly.

When a slice changes module shape, use `codebase-design` vocabulary when
available. Otherwise use a direct-parent evidence-based fallback: current and
proposed boundaries, seams, dependencies, and test surface.

Show the whole plan document through the question document field with
`format: "md"` when available, not a summary or link. Formal document approval
must stay full-screen: set `presentation: "fullscreen"` when that field is
available, or omit it so the tool's default full-screen presentation applies.
Use these options:

1. **Approve and implement**
2. **Revise**
3. **Deepen**
4. **Independent review**

The whole-plan approval presentation and question must name the selected
execution mode so approval explicitly confirms it. Do not add a fifth option.
If the tool or document field is unavailable, show the whole plan in
conversation and ask the same question. Require explicit human approval of the
whole plan; one slice or a summary is insufficient.

Only **Approve and implement** is explicit human approval. It authorizes the
named plan branch's bounded commit and later pull-request publication. Mark the
plan `status: accepted`, invoke `commit`, then invoke `implement` with the
accepted plan. Invoke `open-pr` at this stage only when the plan is its own
delivery unit with independent review or merge value; otherwise defer it to the
stable implementation delivery unit's single publication boundary.

If `commit` is unavailable, preserve local evidence, report recovery guidance,
and continue the plan-to-implementation handoff without publishing. When this
plan is an independent delivery unit, unavailable `open-pr` or required
`gh stack` tooling fails closed for publication while the handoff continues. Do
not embed ad hoc Git commands. If `implement` is unavailable, use the direct
parent as executor. A planned stack requires `open-pr` to use `gh stack`.
`gh stack link` verifies a Worktrunk-managed chain without creating a locally
tracked view; use `gh stack view --json` only where a local tracked view exists.
Approval never authorizes merge, release, deployment, destructive cleanup, or
unrelated remote changes.

## Bounded support

After worktree setup, cheap factual mapping, mechanical inventory, and QA
test-surface checks may provide evidence when useful. Use one independent plan
review at most when useful. Support never owns product, architecture, slice, or
approval decisions. Use the direct-parent fallback when a role is unavailable.
Any exceptional high-capability role requires explicit human approval;
production guidance must not depend on private agents or model names.
