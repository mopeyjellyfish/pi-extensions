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
the task has that worktree. Reuse the Shape worktree or create one with the available lifecycle
tool. If no safe tool is available, stop before any other planning work and ask
the human to provide an isolated worktree. Never use the main-branch checkout.

After routing, read the relevant instructions, public contracts, and tests.
Create or update `docs/features/<slug>/plan.md` from
`../shape/templates/plan.md` with `status: draft`.

## Plan complete delivery

Write one complete delivery plan before implementation begins. Cover all
accepted scope, not only the first slice. Do not alternate plan / work / plan /
work. Map the critical path, dependencies, atomic commit units, pull-request
bases and stack positions, and genuinely independent lanes before approval.
Optimize stack order before asking for approval.

For every slice record its observable outcome and requirement trace, public seam
and files, dependencies, execution lane/worktree ownership, red proof, green
proof and checks, atomic commit, PR base/stack position, and done conditions.
Use separate isolated worktrees and a sole writer for every parallel lane.
Reject overlapping parallel writers, shared mutable boundaries, and unresolved
dependencies; serialize them instead. Planning does not implement or start
parallel work.

When a slice changes module shape, use `codebase-design` vocabulary when
available. Otherwise use a direct-parent evidence-based fallback: current and
proposed boundaries, seams, dependencies, and test surface.

Show the whole plan document, not a summary or link, with:

1. **Approve and implement**
2. **Revise**
3. **Deepen**
4. **Independent review**

If the tool or document field is unavailable, show the whole plan in
conversation and ask the same question. Require explicit human approval of the
whole plan; one slice or a summary is insufficient.

Only **Approve and implement** is explicit human approval. It authorizes the
named plan branch's bounded commit and pull-request publication: invoke
`commit`, then `open-pr`, then invoke `implement` with the accepted plan. If `commit`,
`open-pr`, or required `gh stack` tooling is unavailable, fail closed for
publication: preserve local evidence, report recovery guidance, and continue the
plan-to-implementation handoff without publishing. Do not embed ad hoc Git
commands. If `implement` is unavailable, use the direct parent as executor. A
planned stack requires `open-pr` to use `gh stack`. `gh stack link` verifies a
Worktrunk-managed chain without creating a locally tracked view; use
`gh stack view --json` only where a local tracked view exists.
Approval never authorizes merge, release, deployment, destructive cleanup, or
unrelated remote changes. Mark the plan `status: accepted` only after approval.

## Bounded support

After worktree setup, cheap factual mapping, mechanical inventory, and QA
test-surface checks may provide evidence when useful. Use one independent plan
review at most when useful. Support never owns product, architecture, slice, or
approval decisions. Use the direct-parent fallback when a role is unavailable.
Any exceptional high-capability role requires explicit human approval;
production guidance must not depend on private agents or model names.
