---
name: planning-changes
description: >-
  Turns explicit accepted intent or an accepted Shape pitch into the smallest
  ordered vertical implementation slices.
---

# Planning changes

Accept explicit accepted intent or an accepted Shape pitch. Read repository
instructions, Git state, relevant public contracts, and the nearest tests.

Create or update `docs/features/<slug>/plan.md` from
`../shape/templates/plan.md` with `status: draft`. Plan serial by default. Use
the smallest ordered vertical slices that each produce an observable user or
operator outcome. Do not add waves, worker leases, or delegation machinery.

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
