# Artifact rules

The canonical feature root is `docs/features/<feature>/`. Initialize only
`pitch.md` and top-level `index.json`; create `plans/`, `assets/`, and
`prototypes/` only when used.

`pitch.md` is the human decision contract. `index.json` is the only mutable
workflow ledger. Use the helper for ledger transitions and canonical atomic
writes instead of regenerating JSON. Never edit an accepted pitch in place.
