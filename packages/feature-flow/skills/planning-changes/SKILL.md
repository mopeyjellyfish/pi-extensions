---
name: planning-changes
description: >-
  Turns explicit accepted intent or an accepted Shape pitch into the smallest
  ordered vertical-slice plan. Use through /plan; it plans but does not implement.
---

# Planning changes

Accept explicit accepted intent or an accepted Shape pitch.

## Check prerequisites at activation

At activation, before repository inspection or planning, confirm the `implement`
skill and the aggregate tools needed for the handoff are available. The default
plan path does not require `pi-subagents` or an independent reviewer. If a
required companion is missing, stop and report:

```text
Blocked prerequisite: /plan requires the Git aggregate for this handoff.
Install it, then retry:
pi install git:github.com/mopeyjellyfish/pi-extensions
```

This package is independently installable for resource discovery. It does not
claim that standalone installation supplies companion tools or skills.

After the prerequisite check, inspect repository instructions, current Git
state, public contracts, relevant tests, and the accepted source of intent.
Inspect enough of the end-to-end path to discover material unknowns. Resolve
repository facts directly. Ask the human only for unresolved product, scope,
architecture, risk, or authority decisions.

## Create or update the plan

Use the existing plan template at `skills/shape/templates/plan.md` rather than
inventing a second format. Plan the complete accepted scope before
implementation. Create the smallest ordered set of vertical slices that covers
every acceptance criterion.

Start with one delivery map. List every intended slice in delivery order. Mark
each slice as `first`, `after NNN`, or `parallel-safe with NNN`. Default to
sequential delivery. Use `parallel-safe` only when the slices do not share a
writer, mutable state, migration order, or another integration boundary. Record
all material unknowns and name the earliest slice that resolves each one. If an
unknown prevents a safe slice boundary, resolve it before accepting the plan.

Each slice names:

- one observable outcome and its public seam;
- one behavior-level red/green cycle, or focused non-behavioral validation;
- an integrated path for the user or operator when one exists;
- required checks; and
- objective done conditions.

Keep the accepted intent traceable. The map can change when implementation
reveals new evidence, but do not omit known later slices to start sooner.
Pending slices may be reordered, rewritten, split, merged, or deleted. Do not
implement or claim Git delivery authority.

Return the complete plan to Shape for one acceptance check. The plan does not
require independent review. Shape checks traceability, verticality, simplicity,
feasibility, validation, and done conditions, then accepts the plan and current
slice and invokes `implement`. Include the accepted intent, worktree path,
current writer-lease state, integrated path, required checks, and the rule that
a material intent change returns to Shape. Planning does not implement, choose
writers or models, define review or repair, or claim Git delivery authority.
