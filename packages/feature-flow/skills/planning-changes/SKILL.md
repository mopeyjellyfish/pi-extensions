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
`../shape/templates/plan.md`. Plan serial by default. Use the smallest ordered
vertical slices that each produce an observable user or operator outcome. Do
not add waves, worker leases, or delegation machinery.

For every slice record:

- the outcome and pitch or requirement trace;
- the public seam and likely files;
- test posture, including the expected red and green signals when behavior
  changes;
- focused verification and repository-required checks;
- objective completion conditions.

Cover the complete accepted scope without speculative cleanup. Order slices so
the first slice proves the riskiest useful path. Return the complete plan to the
caller. The caller obtains any required approval and invokes `implement`.
