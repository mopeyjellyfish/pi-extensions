# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` is an independent, skill-only Pi package for
starting or resuming end-to-end feature work in an isolated Worktrunk worktree.
It ships one progressive `shape` skill, the `/shape [feature brief]` prompt, and
a Node-standard-library helper for canonical feature artifacts and ledger
transitions. It registers no extension, agent, service, or runtime dependency.

## Use

A natural end-to-end feature brief can load `shape`. `/shape <brief>` is the
explicit fallback; `/shape` asks the skill to resume the active feature ledger.
This first slice supports verified initialization and the minimum slice banking
seam. Linked-worktree discovery, pitch acceptance, planning, repitching, and the
full Build loop arrive in later slices.

Worktrunk remains the only worktree lifecycle authority. Before writing, the
skill routes to the expected worktree and calls:

```text
node scripts/feature-flow.mjs init <feature> --branch <branch> --base <full-sha>
node scripts/feature-flow.mjs inspect <feature>
```

`init` fails closed on a dirty checkout, ambiguous base, branch collision, or
route mismatch. A verified route creates only:

```text
docs/features/<feature>/
├── index.json
└── pitch.md
```

The helper also provides narrow `activate` and `complete` commands. Completion
requires red/green, independent review, dogfood, checks, and banking evidence.
A slice declaring `commit` blocks later activation until Git contains a matching
`Feature-Slice: <id>` commit with the done ledger transition; a bounded
`checkpoint: <reason>` is available when repository policy forbids commits.

## Install

From a clone of this repository:

```sh
pi install "$(pwd)/packages/feature-flow"
```
