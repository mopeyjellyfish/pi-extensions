---
name: feature-plan
description: Generate, validate, and automatically review the complete vertical TDD plan set for an accepted feature pitch.
---

# Feature plan

Start delivery decomposition only after the evergreen product pitch is
accepted, then create every `docs/features/<feature>/plans/<slice>.md` before
implementation. The pitch defines the product and acceptance criteria; this
skill owns slices, tasks, phases, and dependencies. Parent reasoning owns plan
quality; the helper owns mechanical facts. Read this
package's `../../references/artifact-contract.md`,
`../../references/orchestration-contract.md`, and
`references/plan-template.md` before starting.

## Preflight

Before any write or delegation:

1. Read repository instructions and inspect current Git status/diff.
2. Run `node ../../scripts/feature-flow.mjs status <pitch-path> <plans-dir>`.
   Preserve unrelated work and classify bounded Git facts and changed code
   assumptions in parent reasoning.
3. Run `node ../../scripts/feature-flow.mjs validate-pitch <pitch-path>` and
   require an accepted pitch.
4. Require compatible `subagent` and `subagent_wait` tools and compatible named
   `worker` and `reviewer` roles; the worker must be the sole writer and the
   reviewer must operate read-only. Accept Pi builtins or existing project/user
   overrides, and do not reject a compatible override merely because of its
   discovery scope. This package ships no agent definitions or custom agents.
   Preflight `question` only for a possible new pitch-level decision. Fail closed
   with named setup guidance before writer side effects if any capability is
   missing.

Do not reparse frontmatter, paths, filenames, revisions, pins, dependencies, AC
coverage, Git summaries, or transitions. Return exact helper errors for fixes.

## Generate the complete set

Launch the compatible named `worker` as one fresh plan writer in an async
top-level `tasks` group with exactly one item, an explicit routed `cwd`,
item-level `"progress": false`, top-level
`"concurrency": 1`, and `"async": true`. Record the run ID. Give it the entire
accepted pitch and template. Keep one writer active and require the smallest
complete set of end-to-end vertical outcomes. The writer reasons about scope,
feasibility, TDD Red, smallest Green, and bounded Refactor, risks, current-code
assumptions, and whether a discovery is pitch-level.

Wait with `subagent_wait` for the same run ID, inspect same-run status, and
require complete lifecycle plus observed process termination before reading the
plans. Then run
`node ../../scripts/feature-flow.mjs validate-plans <pitch-path> <plans-dir>`.
Mechanical failure goes to a fresh serial fix worker using the same one-item
protocol and exact helper errors; rerun deterministic validation after its
verified terminal barrier. Remember: helper success is not review.

## Review and automatic correction

Launch one fresh read-only whole-set reviewer using the compatible named
`reviewer`, accepted pitch, exact complete plan set, and successful bounded
helper result. Use the same fresh
async one-item, explicit-cwd, progress-suppressed, concurrency-one protocol and
terminal barrier. It judges end-to-end verticality, scope, feasibility, TDD
quality, risks, implementation assumptions, and pitch-level classification; it
does not repeat deterministic helper checks.

For routine semantic findings, run
`node ../../scripts/feature-flow.mjs plans <pitch-path> <plans-dir> draft --revise <changed-plan-path> ...`
with only changed plans named. Launch one fresh serial fix worker, verify its
same-run terminal barrier, rerun deterministic validation, and launch another fresh whole-set review. Repeat automatically until a fresh review is
blocker-free.

Only that blocker-free result authorizes
`node ../../scripts/feature-flow.mjs plans <pitch-path> <plans-dir> reviewed`,
followed by another deterministic plan validation. Never ask a plan question or
treat helper success as review. Plans have no human acceptance gate.

## Pitch-level findings

Stop only for a new pitch-level decision, owned and asked by the parent through
`question`. If the answer changes the pitch, run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> draft --revise`, then
repeat complete pitch review and human acceptance and regenerate the complete plan set. If the answer confirms the accepted pitch is unchanged, record bounded
parent evidence and resume planning.

## Boundaries

Do not implement feature work, create a worktree, mutate todo, or launch an
implementation worker. Do not create a receipt, progress file, hash, backlog,
or project-state artifact. Do not stage, commit, push, merge, or open a pull
request. Report changed plans, helper/review evidence, residual risks, and
source-control state.
