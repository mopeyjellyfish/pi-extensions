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
2. Require compatible `subagent` and `subagent_wait` tools, the `question`
   companion, builtin `scout`, and compatible named `worker` and `reviewer`
   roles. The worker must be the sole writer and the reviewer must operate
   read-only. Accept Pi builtins or existing project/user overrides; do not
   reject a compatible override merely because of its discovery scope. This
   package ships no agent definitions or custom agents. Discover builtin
   `researcher` only if external evidence is materially needed. Fail closed with
   named installation/setup guidance for a required missing capability. Do not
   add roles for headcount.
3. Run `node ../../scripts/feature-flow.mjs status <pitch-path> <plans-dir>` from
   the package-relative skill location. Treat its output as facts, not a safety
   or quality judgment. Preserve unrelated work.

Do not reparse frontmatter, paths, revisions, sections, Git summaries, or
transitions in model reasoning. Return exact helper errors to the writer.

## Research and grill

Use this fresh-run protocol for every scout, researcher, worker, fix worker, and
reviewer: launch an async top-level `tasks` group with exactly one item, an
explicit routed `cwd`, item-level `"progress": false`, top-level
`"concurrency": 1`, `"context": "fresh"`, and `"async": true`; record the run ID; wait with
`subagent_wait` for that same run ID; inspect same-run status; and require
complete lifecycle plus observed process termination before dependent work.
Keep one writer active.

First launch a fresh read-only scout for repository evidence. If external
evidence is materially needed to resolve material uncertainty, launch one fresh
read-only builtin `researcher` after the scout's terminal barrier. Do not launch
roles merely to increase headcount.

The user's initial prompt starts shaping. Before asking anything, absorb the
prompt and conversation, then use the scout and any material research to learn
what context and code can answer. Track only unresolved decisions that could
materially change product behavior, scope, architecture, risk,
non-negotiables, or acceptance criteria and are not reliably answered by the
prompt, conversation, repository, or research. Do not ask the user to repeat
known facts or decide implementation choices the agents can safely make later.

Parent asks every question through `question`, one pointed decision cluster at
a time. Couple questions only when the decisions depend on each other; include
recommended answers and tradeoffs, concrete examples and counterexamples, edge
and failure cases, and teach-back so the user can correct the parent's
understanding. Bias hard toward the smallest useful product solution: challenge
breadth, speculative flexibility, abstractions, and optional behavior. Move
every cut to `No-gos`. Keep the pitch evergreen and leave all delivery
decomposition to later planning. Stop questioning when no unresolved decision
can materially change the pitch.

After each cluster, update a concise parent-owned synthesis. Do not launch the
pitch writer or final reviewer until the user confirms that synthesis is
materially complete and accurate. This confirmation is not an extra approval
gate; it closes the clarification loop before drafting. Parent reasoning owns
the problem, solution, rabbit holes, no-gos, acceptance criteria, pitch-level
decisions, and quality.

## Write and validate

After synthesis confirmation, launch the compatible named `worker` fresh with
the protocol above. It writes only the canonical draft pitch from the template.
Then run
`node ../../scripts/feature-flow.mjs validate-pitch <pitch-path>`. Mechanical
failure goes to a fresh serial fix worker using the same one-item protocol and
exact helper errors.

## Review and acceptance

Launch the compatible named `reviewer` fresh and read-only with the same
protocol for adversarial product, scope, feasibility, and simplicity review of the entire
pitch. A routine blocker uses one fresh serial fix worker and then another fresh
whole-document review. The helper never resolves blockers. Remember: helper
success is not review or acceptance.

Before any semantic edit to a previously reviewed or accepted pitch, run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> draft --revise`. After
fixes, rerun validation and repeat complete review and human acceptance. If a
new pitch-level decision appears, stop and ask the user; record bounded evidence
when the answer confirms the accepted pitch unchanged.

Only after a fresh blocker-free review, run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> ready`, validate again,
and use `question` to show the entire ready pitch with exactly one approval
choice named `Approve pitch`; invoke acceptance only after that choice. This is
the only approval gate. Run
`node ../../scripts/feature-flow.mjs pitch <pitch-path> accepted`. Requested
changes return through `draft --revise`, validation, fresh review, and
complete-document acceptance.

## Boundaries

Do not implement user feature work. Do not create progress, receipt, hash,
backlog, or project-state artifacts. Do not stage, commit, push, merge, or open a
pull request unless already authorized. Never perform those actions during the
pitch phase. Report changed artifacts, validation/review evidence, residual
risks, and source-control state.
