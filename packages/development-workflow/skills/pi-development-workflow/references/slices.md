# Plan integrated vertical slices

Keep `plan.md` as an evolving ordered slice map linked to the pitch. Do not repeat Appetite, No-Gos, or other pitch boundaries; identify the first demonstrable slice and update sequencing as implementation reveals new facts. Do not create a frozen master backlog.

Plan for a Terra worker: make each slice self-contained enough that a fresh implementation child can execute it without the parent transcript or hidden planner reasoning. The planner normally runs as `openai-codex/gpt-5.6-sol:high`; use Sol xhigh only for ambiguous shaping, architecture, conflicting requirements, security, concurrency, migrations, or repeated worker failure that suggests the plan itself is wrong. Record the worker effort selected by the orchestrator and its escalation trigger in the slice's Execution Profile.

Each `slices/VS-*.md` must define:

- an independently observable outcome;
- how it advances the pitch;
- every necessary boundary crossed for that outcome;
- the test or observation that will be RED first;
- the minimum GREEN implementation;
- focused and regression verification;
- an objective Done When signal.

Reject horizontal phases such as “all models,” “backend first,” “frontend later,” “all tests,” or exhaustive layer inventories. The first slice should produce an early integrated walking skeleton through the package's public Pi surface. Later slices add meaningful behavior, retire a shaped risk, or complete a bounded acceptance signal. Prefer the smallest slice that gives useful feedback over scaffolding for hypothetical later work.

Keep slice execution context-efficient: give a fresh planner or worker the pitch, active slice, direct contracts, explicit validation contract, and smallest relevant repository neighborhood. Do not fork the whole parent conversation, preload every future slice, repeat the pitch in Todo, or carry raw research transcripts forward. Update the plan index when implementation reveals sequencing facts.

Keep API, schema, SQL, protobuf, and other native contracts in their native formats under `contracts/`. Frontmatter stores immutable IDs, dependencies, requirement links, and risk only. Slice status is `planned`, `active`, `blocked`, `verified`, or `cut` in the workflow ledger.

After the user approves the first slice and map, treat well-scoped slice execution as autonomous. Register later integrated slices during Build as they are discovered and update the existing plan map without another approval or routine checkpoint. Rewind and ask the user only when new knowledge changes the approved outcome, Appetite, Acceptance Signals, No-Gos, first-slice strategy, or another hard boundary.

Use Todo only after activating a slice, for concrete work discovered while executing it. Close or cancel those tasks before switching slices.
