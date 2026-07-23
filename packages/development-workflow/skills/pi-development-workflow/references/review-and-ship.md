# Review and ship

Use one fresh Sol high reviewer (`openai-codex/gpt-5.6-sol:high`) per completed active slice when pi-subagents is available. Give it the approved pitch, active slice, affected diff, direct contracts, and verification evidence. It reads that slice-shaped review package once and returns both:

- behavior and pitch/slice compliance;
- correctness, maintainability, repository conventions, verification quality, and material security, operations, or release risk.

The active slice is a relevance boundary, not a line-count limit: follow affected callers, contracts, and dependencies when correctness requires it. Add another fresh reviewer only for a genuinely distinct risk domain that the first review contract cannot cover. Do not launch several generic Sol reviewers over the same diff.

Reviewers are read-only. The main chat synthesizes findings and keeps authority; one worker applies accepted fixes through the same ladder: retain the original Terra effort for narrow fixes, cap Terra at high, return plan gaps to the Sol planner or Oracle, and use Sol medium only when the revalidated plan is sound but the fix still needs frontier judgment. If independent reviewers are unavailable, review sequentially in the current context and label the result **reduced assurance**. Record that label separately: it never substitutes for explicit intent, correctness, maintainability, or risk/operations evidence, and final verification is still required. Do not use arbitrary numeric scores as a gate. Read [model-routing.md](model-routing.md) for context and escalation rules.

Before requesting the Review transition, ensure every retained slice is verified or explicitly cut, debugging regressions are covered, accepted findings are fixed, and focused plus required repository checks are fresh against the current branch/HEAD. The evidence gate advances to Ship automatically; there is no human review ceremony.

Ship means ready-to-ship, not authorized-to-ship. Every external mutation needs its own explicit user authorization. Use `/dev-workflow authorize <action> -- <reason>` before commit, push, pull-request, merge, release, deploy, publish, or worktree-removal; use the Git conventions, GitHub, and Worktrunk skills for the actual operation. After the authorized operation succeeds or fails, record its truthful typed receipt with `development_workflow`; this consumes only that authorization and keeps Ship open for another separately authorized action. Never claim execution from authorization alone.

If an authorized action is cancelled before execution, the user clears it with `/dev-workflow cancel authorization -- <reason>`; never record a fictional receipt. A commit receipt may preserve the reviewed evidence only when the resulting worktree is clean; otherwise refresh verification before another authorization. Authorize worktree removal last: its receipt requires the authorized path to be gone, after which the direct finish relies on the already-approved gate chain because removed artifacts cannot be reread.

When the requested shipping sequence is over, the user closes the ledger with `/dev-workflow finish -- <reason>`. Finish is a direct decision, rejects an unconsumed authorization, and ordinarily revalidates ready-to-ship evidence. It may also close deliberately retained work without an external mutation.
