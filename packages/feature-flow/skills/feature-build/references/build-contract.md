# Build execution and evidence contract

## Readiness boundary

Use only the shipped helper for deterministic artifact and Git facts. Do not
reparse frontmatter, paths, filenames, statuses, revisions, pitch pins, serial
dependencies, AC coverage, or Git summaries. On failure, report the exact helper
path and reason and stop without a model-derived substitute. An initial gate
failure permits no Worktrunk, todo, writer, or artifact mutation. A routed gate
failure permits no further build side effect. Run both routed checks with the
process working directory set to the routed working directory.

Helper success proves deterministic readiness only. Parent reasoning separately
classifies unrelated Git changes, invalid code assumptions, LSP applicability,
implementation choices, review blockers, and pitch-level findings. The helper
and children never make those judgments.

## Fresh serial run barrier

Every implementation worker, reviewer, and fix worker uses a fresh async
top-level `tasks` group with exactly one item:

```json
{
  "tasks": [
    {
      "agent": "worker-or-reviewer",
      "task": "bounded task handoff",
      "cwd": "/explicit/routed/worktree",
      "progress": false
    }
  ],
  "concurrency": 1,
  "context": "fresh",
  "async": true
}
```

Use compatible named `worker` and `reviewer` roles: the worker is the sole
writer for implementation and fixes, and the reviewer operates read-only.
Accept Pi builtins or existing project/user overrides, and do not reject a
compatible override merely because of its discovery scope. This package ships
no agent definitions or custom agents. Require the explicit routed `cwd` shown
above. Record the run as the recorded run ID. Use `subagent_wait` for the
same-run wait, then perform exactly one status check for that same run proving a
complete lifecycle and observed process termination before dependent work.

Never poll or infer completion. A timeout, abort, missing, active, unknown,
unobserved, or unresolved attention state is not a terminal barrier. Never
overlap writers and Never automatically resume a failed or paused run. When a
real pending parent-owned request exists, the parent answers it and re-waits on
the same run; the one terminal status check still follows completion. Advisory
inactivity permits at most one indexed steer to that run. For blocked or
drifting work, soft-interrupt it and leave it paused for an explicit resume,
stop, or replacement choice.

## Slice evidence

For each slice retain only:

- the direct readiness result, routed `pwd` and Git top-level, worker run ID, and
  terminal proof;
- Red, Green, Refactor, diagnostics, focused-test, and diff evidence, including
  the observable Red before production edits, smallest Green, and bounded
  Refactor while green;
- LSP or other semantic results when applicable, or the parent's bounded
  applicability reason;
- changed files, command/result summaries, reviewer run ID and findings, fix
  run IDs, and final blocker-free review.

Do not retain full transcripts. Treat credentials or provider output as secret
and omit them. Bound paths, summaries, findings, and evidence to the facts an
acceptance reviewer needs.

## Forbidden behavior

Do not mutate reviewed plans with progress or evidence. Do not add a human plan
or final-feature acceptance gate. Do not create full transcripts, persistent or
scratch progress state, or store credentials or provider output. Do not perform
destructive cleanup or an unauthorized source-control action. Do not add a
helper command, state artifact, hash, receipt, scheduler, or workflow engine.
Do not select or hardcode a provider or model.
