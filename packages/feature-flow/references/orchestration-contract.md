# Orchestration contract

Before side effects, the parent verifies required companion tools and roles,
inspects helper-reported artifact/Git facts, and preserves unrelated work.
Missing capabilities fail closed with named setup guidance.

Every scout, researcher, worker, fix worker, and reviewer is a fresh async
top-level `tasks` run with exactly one item, an explicit routed working
directory, item-level progress suppression, top-level concurrency one, and
top-level `context: fresh`.
Record its run ID, wait for that same run, and verify complete lifecycle and
observed process termination before dependent work. Use builtin `scout` for
read-only repository evidence and builtin `researcher` only when external
evidence is materially needed. Require compatible named `worker` and `reviewer`
roles: the worker is the sole writer and the reviewer operates read-only. Accept
Pi builtins or existing project/user overrides, and do not reject a compatible
override merely because of its discovery scope. This package ships no agent
definitions or custom agents. Do not add roles for headcount. Only one writer
may be active.

The parent owns all questions and decides whether a finding is pitch-level.
Routine blockers use fresh serial fixes and fresh review. A new pitch-level
decision returns to the human. Source-control publication occurs only with
prior authorization and after required checks; otherwise leave a reviewed,
unstaged diff.
