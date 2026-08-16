---
name: planning-changes
description: >-
  Turns explicit accepted intent or an accepted Shape pitch into the smallest
  ordered vertical implementation slices.
---

# Planning changes

Accept explicit accepted intent or an accepted Shape pitch. The selected parent
owns slice design, product and architecture judgment, approval, and synthesis.
Make worktree setup the first action. Inspect only the Git and worktree state
needed to route the task. Do not read repository instructions, public contracts,
tests, or other planning context before the task has an isolated linked worktree.

Reuse the Shape worktree when one exists. Otherwise, derive a short task branch
from the accepted intent and use the available worktree lifecycle tool to create
and activate it. If no safe worktree tool is available, stop before any other
planning work and ask the human to start or select an isolated worktree. Never
work in the main-branch checkout. After routing, read repository instructions,
relevant public contracts, and the nearest tests.

Create or update `docs/features/<slug>/plan.md` from
`../shape/templates/plan.md` with `status: draft`. Plan serial by default. Use
the smallest ordered vertical slices that each produce an observable user or
operator outcome. Do not add waves, worker leases, or delegation machinery.

When a slice changes module shape, apply `codebase-design` vocabulary if that
method is available. If it is unavailable in an independent install, use a
direct-parent evidence-based fallback: describe the current and proposed
boundaries, seams, dependencies, and test surface without assuming companion
packages are installed.

For every slice record:

- the outcome and pitch or requirement trace;
- the public seam and likely files;
- execution mode: `serial` or `parallel-ready`, with dependencies;
- difficulty: `standard` or `hard`, marking `hard` with its reason for
  cross-cutting scope, migrations, security-sensitive areas, or deep debugging;
- test posture and separate expected red signal and green signal;
- focused verification and repository-required checks;
- objective completion conditions.

Use `parallel-ready` only when a slice is encapsulated, has no unresolved
dependency or shared mutable boundary, and can use its own worktree and writer.
The label makes a slice eligible; it does not start a worker. Keep uncertain or
overlapping slices serial.

Cover the complete accepted scope without speculative cleanup. Order slices so
the first slice proves the riskiest useful path.

Show the whole plan in the `question` tool's document field with these actions:

1. **Approve and implement** — accept all slices and start the first eligible
   slice.
2. **Revise** — apply feedback and show the whole plan again.
3. **Deepen** — investigate one named uncertainty, update the plan, and show it
   again.
4. **Independent review** — use one fresh read-only reviewer, resolve material
   findings, and show the whole plan again.

If the tool or document field is unavailable, show the whole plan in
conversation and ask the same four-way question. Require explicit human approval
of the whole plan; approval of one slice or a summary is insufficient.
After approval, change `status: draft` to `status: accepted` and invoke
`implement`. Planning does not implement or start parallel work.

## Optional bounded discovery

After worktree setup, the selected parent may use the combined Shape-and-
planning lifecycle's one bounded Researcher handoff for repository mapping,
official primary-source research, or concise factual context when that avoids
expensive parent exploration. If the accepted pitch records that handoff, do not
start another; use its evidence or the direct parent. The Researcher makes no
product, architecture, slice-design, or approval decision. Use the direct-parent
evidence-based fallback if the role is unavailable, then continue from evidence.
For ambiguous routing, use the `question` tool; never default to a hidden Sol
child. Independent installs without package agents use the direct parent.
