# Pi profile A/B evaluation

Run this evaluation before adding deferred-tool loading, custom compaction, or
another always-on extension to the root profile.

## Variants

- **Baseline:** the current root profile and native Pi behavior.
- **Candidate:** the baseline plus exactly one proposed change.

Use the same Pi version, model, thinking level, repository revision, clean
worktree, task text, and acceptance checks. Start a fresh session for every run.
Alternate variant order to reduce warm-up bias.

## Cases

Use three representative tasks:

1. a cross-package feature with behavior tests;
2. a bug that requires reproduction and caller tracing;
3. a repository-grounded design decision with current external research.

Run each case once per variant for the first screen. Repeat only when the result
is close or inconsistent.

## Scorecard

Record:

- acceptance checks passed and review findings by severity;
- retries, tool errors, lost state, and human corrections;
- wall time and time to first useful progress update;
- total model tokens and subagent tokens;
- compaction count and any fact lost after compaction.

Reject a candidate with a correctness regression or a new unresolved
high-severity finding. Promote it only when at least two cases show a useful
repeatable gain and the third does not regress. Keep the raw prompts, results,
and scorecard with the proposal so another run can reproduce the decision.
