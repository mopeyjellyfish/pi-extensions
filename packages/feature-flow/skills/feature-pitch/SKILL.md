---
name: feature-pitch
description: Shape, review, and obtain human acceptance for one canonical feature pitch.
---

# Feature pitch

Create or revise `docs/features/<feature>/pitch.md`. Parent reasoning owns the
work; the helper reports mechanical facts only. Read this package's
`../../references/artifact-contract.md`,
`../../references/orchestration-contract.md`, and
`references/pitch-template.md` before starting.

## Preflight

Before any write or delegation:

1. Read repository instructions and inspect current Git status/diff.
2. Require compatible `subagent` and `subagent_wait` tools. Discover builtin `worker`
   and builtin `reviewer`, and require the `question` companion. Fail closed with
   named installation/setup guidance if anything is missing.
3. Run `node ../../scripts/feature-flow.mjs status <pitch-path> <plans-dir>` from
   the package-relative skill location. Treat its output as facts, not a safety
   or quality judgment. Preserve unrelated work.

Do not reparse frontmatter, paths, revisions, sections, Git summaries, or
transitions in model reasoning. Return exact helper errors to the writer.

## Shape the pitch

Parent asks every question. Grill the user until every pitch-level decision is
explicit. Gather repository evidence first and use external research when it
would materially reduce uncertainty. Parent reasoning owns the problem,
constraints, solution shape, rabbit holes, scope, blocking decisions, and
quality.

Launch a fresh writer as an async top-level `tasks` group with exactly one item,
an explicit routed `cwd`, item-level `"progress": false`, top-level
`"concurrency": 1`, and `"async": true`. Record the run ID. The worker writes
only the canonical draft pitch from the template; keep one writer active.
Wait with `subagent_wait` for that same run ID, then inspect same-run status and
require complete lifecycle plus observed process termination before reading or
validating its output.

Run
`node ../../scripts/feature-flow.mjs validate-pitch <pitch-path>`. Mechanical
failure goes to a fresh serial fix writer using the same one-item protocol and
exact helper errors.

## Review and acceptance

Launch a fresh read-only reviewer with the same async one-item, explicit-cwd,
progress-suppressed, concurrency-one protocol. It reviews the entire pitch for
semantic quality and blockers. Wait for same-run terminal proof before any fix.
A routine blocker uses one fresh serial fix writer and then another fresh whole-
document review. The helper never resolves blockers. Remember: helper success is not review or acceptance.

Before any semantic edit to a previously reviewed or accepted pitch, run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> draft --revise`. After
fixes, rerun validation and repeat complete review and human acceptance. If a
new pitch-level decision appears, stop and ask the user; record bounded evidence
when the answer confirms the accepted pitch unchanged.

Only after a fresh blocker-free review, run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> ready`, validate again,
and use `question` to show the entire ready pitch with exactly one approval
choice named `Approve pitch`; invoke acceptance only after that choice. Run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> accepted`. Requested
changes return through `draft --revise`, validation, fresh
review, and complete-document acceptance.

## Boundaries

Do not implement user feature work. Do not create progress, receipt, hash,
backlog, or project-state artifacts.
Do not stage, commit, push, merge, or open a pull request unless already authorized.
Never perform those actions during the pitch phase. Report changed artifacts,
validation/review evidence, residual
risks, and source-control state.
