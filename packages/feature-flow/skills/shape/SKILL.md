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

With a brief, derive a canonical feature slug and expected `shape/<slug>` branch,
then use Worktrunk to create or activate it.

Without a brief, Worktrunk must supply every candidate path before the helper
reads one. Call `worktree` with `action: "status"` first, then `action: "list"`.
If a route is active, inspect that linked path first and resume its valid ledger.
Otherwise, or if it has no valid ledger, inspect the linked paths from the list.
If the list is truncated, obtain Worktrunk's complete schema-2 list as directed
by the `pi-worktrunk` skill. Never enumerate worktrees with Git or filesystem
search.

Handle the bounded `valid`, `stale`, and `invalid` arrays independently.
Always report every stale and invalid diagnostic and its recovery action, even
when a valid candidate can proceed:

- One valid candidate: if already routed, resume it; otherwise Worktrunk
  activates its recorded branch, verify the route, then run `inspect <feature>`.
- Several valid candidates: ask one structured choice showing feature, branch,
  phase, and next action. Worktrunk activates only the chosen branch, then
  verify and inspect it.
- No valid candidate but any stale or invalid result: do not activate one or ask
  for a replacement brief.
- No result at all: ask for a new feature brief only when all three arrays are empty.

Use the package-relative helper with the routed working directory:

```text
node ../../scripts/feature-flow.mjs init <feature> --branch <expected-branch> --base <expected-base-sha>
node ../../scripts/feature-flow.mjs inspect <feature>
node ../../scripts/feature-flow.mjs inspect-candidates <absolute-worktree-path>...
node ../../scripts/feature-flow.mjs activate <feature> <slice-id>
node ../../scripts/feature-flow.mjs complete <feature> <slice-id> --red-green <evidence> --review <evidence> --dogfood <evidence> --checks <evidence> --banking <commit|checkpoint: reason>
```

Treat helper output as bounded mechanical facts. Candidate inspection is
read-only. Never create feature artifacts, research notes, prototypes, or plans
until `init` verifies the current Git root, branch, base, and clean route. Ask
one structured routing question when it reports a dirty checkout, ambiguous
base, branch collision, or route mismatch. Do not replace Worktrunk with raw Git
worktree commands.

## Boundaries

Keep one writer and require separate read-only review. Stop for decisions that
would change an accepted pitch. Do not stage, commit, push, merge, publish,
deploy, remove worktrees, or perform destructive cleanup without the authority
defined by the accepted pitch and repository instructions. Pitch acceptance,
repitching, plan registration, and full Build behavior are not available yet.
