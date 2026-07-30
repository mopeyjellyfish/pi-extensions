# Vertical-slice planning

Planning starts automatically when `inspect` derives `planning`: the pitch is
accepted and hash-pinned, and no slices are registered. Run `verify` first. A
changed hash returns to repitch; it is never planned around.

## Create the smallest coherent set

Before selecting slice boundaries, inspect the relevant current repository
sources, tests, contracts, and public seams. Use the v2 plan template to write
one complete candidate set in a temporary working directory, not canonical
`plans/`. Each slice must deliver one observable outcome across every product
and technical boundary it needs.
Reject horizontal phases, speculative task inventories, and dependencies added
only to serialize Build. Independent outcomes keep `depends_on: []`; serial
execution does not create a predecessor postcondition.

Every plan has a concise goal, exact pitch-section links and literal `**AC-NNN**`
trace, real dependencies and predecessor postconditions, a public seam with an
independent expectation and first Red/Green tracer, applicable checks, an
integrated user or operator dogfood path, and objective done conditions. Add
scope cuts, boundaries crossed, implementation route, later-cycle guidance,
risks, or escalation only when material. Never add plan status, delivery
estimates, or other mutable workflow fields.

Run the read-only mechanical check over the complete ordered candidate set:

```text
node ../../scripts/feature-flow.mjs validate-plans <feature> <complete-plan-file>...
```

Argument order becomes ledger plan order. The helper checks objective artifact
facts only. Semantic verticality, dependency meaning, feasibility, public-seam
quality, test quality, and whether a finding changes accepted intent remain with
the planner and reviewer.

## Independent review and automatic registration

After mechanical validation, give the accepted pitch and exact complete plan set
to a separate read-only whole-set reviewer. Review coverage, verticality,
simplicity, feasibility, dependency meaning, useful ordering, tracer quality,
and integrated dogfood. The sole writer fixes routine findings, reruns
`validate-plans`, and requests a fresh whole-set re-review until blocker-free.
A pitch-level finding stops for repitch; ordinary planning choices do not.

After the blocker-free result, rerun validation and register immediately:

```text
node ../../scripts/feature-flow.mjs register-plans <feature> <complete-plan-file>...
```

Never ask for plan approval. The accepted pitch is the only human gate.
Registration copies the complete reviewed set to canonical `plans/` and writes
matching pending ledger records as one rollback-safe operation. Plan Goals carry
rich human delivery detail. A ledger `goal` is an independently bounded concise
resume summary, not a text mirror; registration seeds it from the normalized
plan Goal.

## Refine only pending plans

Implementation learning may refine, split, merge, or reorder pending slices.
Build one complete candidate set containing byte-identical copies of every
active, blocked, done, or cut plan plus the intended pending set. Preserve
unchanged pending bytes and metadata. Argument order expresses reordering; IDs
and filenames remain canonical, and dependencies express meaning rather than
execution order.

Run `validate-plans`, repeat independent read-only whole-set review/fix/re-review,
then publish the blocker-free complete set with:

```text
node ../../scripts/feature-flow.mjs refine-plans <feature> <complete-plan-file>...
```

The helper rejects any fixed-plan byte or record change, unknown or cyclic
references, pitch-pin drift, incomplete literal AC coverage, non-canonical
paths, bounds violations, and mechanical plan/ledger disagreement. An existing
pending ledger summary survives non-Goal refinement; changing that plan's
normalized Goal reseeds only its summary, and a new slice is seeded like initial
registration. Ordinary failures
restore every canonical plan and the ledger. A process crash can leave bounded
`.feature-flow-plans-*` staging or backup paths; stop and recover them rather
than guessing or adding a service.

Do not activate a slice or implement Build during planning. After registration,
resume from the helper's single derived next action.
