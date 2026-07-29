# Artifact rules

The canonical feature root is `docs/features/<feature>/`. Initialize only
`pitch.md` and top-level `index.json`; create `plans/`, `assets/`, and
`prototypes/` only when used. Never create empty optional directories.

`pitch.md` is the human decision contract. `index.json` is the only mutable
workflow ledger. Use the helper for ledger transitions and canonical atomic
writes instead of regenerating JSON. Never edit an accepted pitch in place.
Product quality, materiality, research judgment, and approval remain outside the
helper.

Use the package-relative lifecycle commands:

```text
node ../../scripts/feature-flow.mjs validate-pitch <feature>
node ../../scripts/feature-flow.mjs accept <feature> <prospective-sha256>
node ../../scripts/feature-flow.mjs verify <feature>
node ../../scripts/feature-flow.mjs repitch <feature>
```

`validate-pitch` validates the complete prospective accepted result without
writing. Run it before the document-backed approval question. `accept` freshly
prepares the current prospective accepted bytes and requires the full lowercase
64-hex SHA-256 returned before approval; a mismatch changes nothing. It then
changes only the pitch frontmatter status from final `draft` to `accepted`,
hashes those final accepted bytes with Node's `node:crypto`, and pins the hash in
the ledger.
`verify` fails if any accepted byte differs. `repitch` first verifies the
accepted bytes, preserves them as `pitch-vNNN.md`, moves registered `plans/` to
`plans-vNNN/` when present, advances the number, resets the prior complete pitch
to `draft`, clears the current slice set, and leaves code, commits, assets, and
prototypes untouched.

Acceptance and repitch validate their complete prospective files, sources, and
destinations before canonical writes. Ordinary failures roll back every changed
canonical path and remove staging files. These multi-file operations are not
crash-atomic: process crash, power loss, or filesystem failure between renames
can leave bounded `pitch.md.tmp-<pid>`, `index.json.tmp-<pid>`, or
`.feature-flow-repitch-*` staging or backup files beside the canonical
artifacts. Stop, preserve those files, and recover the original canonical set
before retrying; do not guess, delete them blindly, or introduce a service or
database for this bounded local failure mode.

`inspect-candidates` accepts only explicit absolute Worktrunk paths and writes
nothing. It reads at most 100 unique Git top-levels and 100 ledgers per top-level,
validates canonical feature-relative pitch and plan paths, closed known fields,
bounded strings and arrays, prior dependencies, statuses, evidence, and the
accepted pitch hash. Ledger artifacts contain branch and base identity, never a
local absolute path. Its result contains bounded `valid`, `stale`, and `invalid`
arrays; only `valid` entries may be activated.
