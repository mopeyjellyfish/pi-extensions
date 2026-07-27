# Orchestration contract

Before side effects, the parent verifies required companion tools and builtin
roles, inspects helper-reported artifact/Git facts, and preserves unrelated
work. Missing capabilities fail closed with named setup guidance.

Every worker, fix worker, and reviewer is a fresh async top-level `tasks` run
with exactly one item, an explicit routed working directory, item-level progress
suppression, and top-level concurrency one. Record its run ID, wait for that
same run, and verify complete lifecycle and observed process termination before
dependent work. Only one writer may be active; reviewers are read-only.

The parent owns all questions and decides whether a finding is pitch-level.
Routine blockers use fresh serial fixes and fresh review. A new pitch-level
decision returns to the human. Source-control publication occurs only with
prior authorization and after required checks; otherwise leave a reviewed,
unstaged diff.
