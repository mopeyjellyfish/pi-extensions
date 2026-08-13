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
skill and the aggregate tools and agents needed by the plan gate are available,
including the `subagent` tool and independent reviewer supplied through
`pi-subagents`. If a required companion is missing, stop and report:

```text
Blocked prerequisite: /plan requires the Git aggregate and pi-subagents for this gate.
Install both, then retry:
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

This package is independently installable for resource discovery. It does not
claim that standalone installation supplies companion tools, skills, or agents.

After the prerequisite check, inspect repository instructions, current Git
state, public contracts, relevant tests, and the accepted source of intent.

## Create or update the plan

Use the existing plan template at `skills/shape/templates/plan.md` rather than
inventing a second format. Create or update the smallest ordered set of vertical slices.
Each slice names:

- one observable outcome and its public seam;
- one behavior-level red/green cycle, or focused non-behavioral validation;
- an integrated path for the user or operator when one exists;
- required checks; and
- objective done conditions.

Keep the accepted intent traceable. Pending slices may be reordered, rewritten,
split, merged, or deleted as repository evidence teaches more. Do not implement
or claim Git delivery authority.

Return the complete plan to Shape for independent review and acceptance. Shape,
not planning, accepts the reviewed plan and current slice, then invokes `implement`.
Include the accepted intent, worktree path, current writer-lease state,
integrated path, required checks, and the rule that a material intent change
returns to Shape. Planning does not implement, choose writers or models, define
review or repair, or claim Git delivery authority.
