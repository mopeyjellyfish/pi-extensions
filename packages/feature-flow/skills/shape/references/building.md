# Serial Build and banking

Run `inspect` before Build and after every transition. Its single next action has
strict precedence: recover the first unbanked done slice in plan order, then a
blocked slice, an active slice, the first dependency-ready pending slice, or
locally complete. Activation rejects any later ready slice. Do not work around
that order by editing `index.json`.

## Deliver one frozen slice

Keep one sole writer. Verify the accepted pitch before implementation and read
the active plan, its public seam, relevant repository contracts, sources, and
tests. If a discovery would change accepted intent, stop Build and use the
repitch path; never edit the accepted pitch or frozen plan.

Repeat this tracer for one public behavior at a time:

1. Add one public-seam test focused on behavior, with an expectation derived
   from an independent source of truth.
2. Run only that tracer and observe the expected Red before changing production
   code.
3. Add the minimum Green production change and observe it pass.
4. Repeat; never batch all tests before all implementation.

When the slice behavior is green, make only a bounded refactor and rerun the
focused tests. Record the observed cycles and that the refactor did remain green
in `red_green` evidence.

## Review, dogfood, and checks

Start a fresh read-only review with the accepted pitch, frozen plan, exact diff,
and test evidence. The sole writer fixes routine findings, reruns focused tests,
and requests fresh re-review until blocker-free. A finding that changes accepted
intent stops and repitches.

Exercise the plan's integrated user or operator journey; unit assertions alone
are not dogfood. Run focused tests and all applicable required checks. Keep
concise evidence in `red_green`, `review`, `dogfood`, and `checks`,
bounded, free of credentials, local absolute paths, and provider output.

Use `block` only from active with a bounded reason and concrete next action.
`unblock` resumes it; a blocked slice may complete when all completion gates are
satisfied. Use `cut` only for pending work whose dependents are already cut.

## Complete and bank

Run `complete` with all evidence. Include bounded-refactor-green evidence in
`--red-green`. Choose exactly one banking receipt:

- `commit` when the accepted pitch and repository policy permit a local commit;
  create one structurally valid Conventional Commit containing the done ledger
  transition and the exact raw footer line `Feature-Slice: <id>`, then run the
  target repository's agent-owned commit-message check; or
- `checkpoint: <reason>` when repository policy forbids the commit. The helper
  checks only bounded syntax; the coordinator and reviewer judge whether the
  reason truthfully reflects policy.

The ledger stores no SHA. One path-filtered, exact-trailer-prefiltered lookup per
ledger and HEAD checks at most 1,000 candidate commits for the current feature,
pitch number, pitch SHA-256, and exact done slice snapshot. Hitting that ceiling
without a match is a safe false negative: the slice remains unbanked and can be
rebanked in a new current receipt. Rewritten history or changed identity or
evidence likewise reopens recovery.

Activation requires a clean checkout only when the last done slice in plan order
has a `commit` receipt. Activation itself may dirty the ledger; block and
complete remain legal. A later checkpoint is the accepted sequencing alternative,
and `cut` has no cleanliness gate.

Re-run `inspect`. Do not advance another transition until banking verifies.
When every slice is done or cut and every done slice is banked, report locally
complete. This is workflow state, not a claim of clean Git. Locally complete
performs no push, PR creation, merge, deploy,
publication, destructive cleanup, worktree removal, or final human approval;
those remain separately authorized.
