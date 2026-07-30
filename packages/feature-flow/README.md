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
review/fix/re-review, and registration without a human plan-approval gate. Build then delivers one
frozen slice at a time through repeated public-seam Red/Green tracers, bounded
green refactoring, fresh read-only review/fix/re-review, integrated dogfood,
required checks, evidence, and verified banking.

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

The helper provides legal `pending → active|cut`, `active ↔ blocked`, and
`active|blocked → done` transitions. Completion requires red/green plus bounded
refactor evidence, independent blocker-free review, integrated dogfood, checks,
and banking. The first unbanked done slice blocks every other transition, and
only the first dependency-ready pending slice may activate. A slice declaring
`commit` stays in banking recovery until one reused, path-filtered lookup of at
most 1,000 exact-trailer candidates finds portable Conventional Commit structure,
one exact raw footer line `Feature-Slice: <id>` with parsed trailer semantics,
and the current feature, pitch number, pitch SHA-256, and done slice snapshot.
The ledger stores no commit SHA. Target-repository commit-message checks and the
truth of a bounded `checkpoint: <reason>` remain agent/reviewer judgments. A
ceiling false negative safely remains unbanked and recovers with a new current
bank receipt.

Resume precedence is first unbanked done, blocked, active, dependency-ready
pending, then locally complete when all slices are done or cut and every done
slice is banked. Clean Git is required for activation only when the last done
slice in plan order has a commit receipt; a later checkpoint is the accepted
alternative, and cuts are not cleanliness-gated. Locally complete is workflow
state, not a clean-Git assertion. It performs no push, PR, merge, deploy,
publication, destructive cleanup, worktree removal, or final human approval.

## Install

From a clone of this repository:

```sh
pi install "$(pwd)/packages/feature-flow"
```
