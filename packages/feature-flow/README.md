# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` is an independent, skill-only Pi package for
starting or resuming end-to-end feature work in an isolated Worktrunk worktree.
It ships one progressive `shape` skill, the `/shape [feature brief]` prompt, and
a Node-standard-library helper for canonical feature artifacts and ledger
transitions. It registers no extension, agent, service, or runtime dependency.

## Use

A natural end-to-end feature brief can load `shape`. `/shape <brief>` is the
explicit fallback; `/shape` resumes the routed feature or discovers linked
candidates. Worktrunk supplies candidate paths and alone activates the selected
worktree; the helper inspects those paths read-only.

One valid candidate activates and resumes. Several produce one structured human
choice. Stale or malformed candidates are reported without adoption or a request
for another brief. Only a completely empty result requests a new brief. Draft shaping now uses
repository-led research, adaptive recommended questions, separate read-only
review, and one complete document-backed approval. Accepted pitches then move
through automatic whole-set vertical planning, independent read-only
review/fix/re-review, and registration without a human plan-approval gate. The
full Build loop remains a later slice.

Worktrunk remains the only worktree lifecycle authority. Before writing, the
skill routes to the expected worktree and calls:

```text
node scripts/feature-flow.mjs init <feature> --branch <branch> --base <full-sha>
node scripts/feature-flow.mjs inspect <feature>
node scripts/feature-flow.mjs inspect-candidates <absolute-worktree-path>...
```

`init` fails closed on a dirty checkout, ambiguous base, branch collision, or
route mismatch. A verified route creates only:

```text
docs/features/<feature>/
├── index.json
└── pitch.md
```

The helper provides `validate-pitch`, `accept`, `verify`, and `repitch` for the
mechanical pitch lifecycle. `accept <feature> <prospective-sha256>` requires the
full hash returned by validation so approval is bound to the exact displayed
bytes. Acceptance pins the SHA-256 of the final accepted bytes; verification
rejects later edits. Repitch preserves `pitch-vNNN.md` and
used `plans-vNNN/`, starts the next complete draft, clears current slice state,
and leaves banked code untouched. Ordinary multi-file failures roll back; process crashes can leave bounded
`pitch.md.tmp-<pid>`, `index.json.tmp-<pid>`, or `.feature-flow-repitch-*`
staging/backup artifacts that require manual recovery rather than a service or
database.

For planning, `validate-plans <feature> <complete-plan-file>...` checks one
ordered reviewed candidate set without writing. `register-plans` atomically
publishes the initial canonical files and pending records. `refine-plans`
atomically replaces the complete set while rejecting changes to active, blocked,
done, or cut plans and records. The same operation supports pending refinement,
split, merge, and reorder; independent empty dependency arrays stay empty.
Mechanical validation covers canonical v2 metadata and paths, accepted pitch
pins, exact literal AC coverage, dependency existence and cycles, bounds,
one-current state, and mechanical file/ledger agreement. Plan Goals carry rich
human detail; bounded ledger goals are concise resume summaries, not required
text mirrors. Pending refinement preserves an existing summary across non-Goal
changes and reseeds it only when that plan Goal changes. Semantic verticality,
dependency meaning, feasibility, and review quality remain agent judgments.

The helper also provides narrow bootstrap `activate` and `complete` commands. Completion
requires red/green, independent review, dogfood, checks, and banking evidence.
A slice declaring `commit` blocks later activation until Git contains a matching
`Feature-Slice: <id>` commit with the done ledger transition; a bounded
`checkpoint: <reason>` is available when repository policy forbids commits.

## Install

From a clone of this repository:

```sh
pi install "$(pwd)/packages/feature-flow"
```
