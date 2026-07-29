# Artifact rules

The canonical feature root is `docs/features/<feature>/`. Initialize only
`pitch.md` and top-level `index.json`; create `plans/`, `assets/`, and
`prototypes/` only when used.

`pitch.md` is the human decision contract. `index.json` is the only mutable
workflow ledger. Use the helper for ledger transitions and canonical atomic
writes instead of regenerating JSON. Never edit an accepted pitch in place.

`inspect-candidates` accepts only explicit absolute Worktrunk paths and writes
nothing. It reads at most 100 unique Git top-levels and 100 ledgers per top-level,
validates canonical feature-relative pitch and plan paths, closed known fields,
bounded strings and arrays, prior dependencies, statuses, evidence, and the
accepted pitch hash. Ledger artifacts contain branch and base identity, never a
local absolute path. Its result contains bounded `valid`, `stale`, and `invalid`
arrays; only `valid` entries may be activated.
