---
name: shape
description: >-
  Starts or resumes an isolated feature from a brief through research, an
  accepted cross-functional pitch, vertical-slice plans, TDD implementation,
  dogfooding, review, and shipping preparation. Use when the user starts or
  shapes end-to-end feature work from a brief, or asks to resume a feature that
  already has a feature-flow ledger. Do not use for narrow fixes, reviews, or
  vague improvement requests without confirmed end-to-end intent.
---

# Shape

Coordinate one feature from its brief or canonical ledger. Read
[workspace routing](references/workspace.md) before any side effect,
[artifact rules](references/artifacts.md) before using the helper, and the
[slice evaluation](references/evaluation.md) before dogfood.

## Start or resume

With a brief, derive a canonical feature slug and expected `shape/<slug>` branch.
Without a brief, inspect the current routed ledger; linked-worktree discovery is
a later slice, so request a brief when no current ledger exists.

Use Worktrunk to create or activate the isolated worktree. Worktrunk is the only
worktree lifecycle authority. Then run the package-relative helper with the
routed working directory:

```text
node ../../scripts/feature-flow.mjs init <feature> --branch <expected-branch> --base <expected-base-sha>
node ../../scripts/feature-flow.mjs inspect <feature>
node ../../scripts/feature-flow.mjs activate <feature> <slice-id>
node ../../scripts/feature-flow.mjs complete <feature> <slice-id> --red-green <evidence> --review <evidence> --dogfood <evidence> --checks <evidence> --banking <commit|checkpoint: reason>
```

Treat helper output as bounded mechanical facts. Never create feature artifacts,
research notes, prototypes, or plans until `init` verifies the current Git
root, branch, base, and clean route. Ask one structured routing question when it
reports a dirty checkout, ambiguous base, branch collision, or route mismatch.
Do not replace Worktrunk with raw Git worktree commands.

## Boundaries

Keep one writer and require separate read-only review. Stop for decisions that
would change an accepted pitch. Do not stage, commit, push, merge, publish,
deploy, remove worktrees, or perform destructive cleanup without the authority
defined by the accepted pitch and repository instructions. This slice only
bootstraps draft artifacts and ledger banking; pitch acceptance, planning,
linked-worktree discovery, and full Build behavior are not available yet.
