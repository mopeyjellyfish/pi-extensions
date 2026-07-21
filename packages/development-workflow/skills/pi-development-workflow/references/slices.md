# Plan integrated vertical slices

Keep `plan.md` as an evolving ordered slice map linked to the pitch. Repeat the appetite and no-gos, identify the first demonstrable slice, and update sequencing as implementation reveals new facts. Do not create a frozen master backlog.

Each `slices/VS-*.md` must define:

- an independently observable outcome;
- how it advances the pitch;
- every necessary boundary crossed for that outcome;
- the test or observation that will be RED first;
- the minimum GREEN implementation;
- focused and regression verification;
- an objective Done When signal.

Reject horizontal phases such as “all models,” “backend first,” “frontend later,” “all tests,” or exhaustive layer inventories. The first slice should produce an early integrated walking skeleton. Later slices add meaningful behavior, risk retirement, or completeness.

Keep API, schema, SQL, protobuf, and other native contracts in their native formats under `contracts/`. Frontmatter stores immutable IDs, dependencies, requirement links, and risk only. Slice status is `planned`, `active`, `blocked`, `verified`, or `cut` in the workflow ledger.

Use Todo only after activating a slice, for concrete work discovered while executing it. Close or cancel those tasks before switching slices.
