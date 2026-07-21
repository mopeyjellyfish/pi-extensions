---
name: pi-development-workflow
description: Run a Pi-native software workflow from a raw idea or defect through an agreed Shape Up pitch, integrated vertical slices, TDD, independent review, and explicitly authorized shipping.
---

# Pi Development Workflow

Use this skill for non-trivial features and fixes that need durable decisions and evidence.

## Route from idea to delivery

1. Read `development_workflow` status first. If none exists, ask the user to run `/dev-workflow start <title>` for the raw idea, missing capability, or defect.
2. Discover repository truth and grill the idea in structured batches: identify the motivating story, desired outcome, demand, constraints, and unresolved decisions.
3. **Set boundaries:** agree the agent-effort appetite, fixed quality floors, cuttable scope, no-gos, and the mandatory wall-clock backstop required by the ledger circuit breaker.
4. **Rough out the elements:** sketch the macro solution, affordances, boundaries, flows, and observable acceptance signals without over-specifying implementation.
5. **De-risk the concept:** investigate decisive unknowns, patch rabbit holes, cut generality, and surface decisions the user must own.
6. **Write the pitch:** create `spec.md` as a rough, solved, bounded proposal. Read [references/pitch.md](references/pitch.md), grill it, and obtain explicit user agreement before asking them to approve Pitch.
7. Build an evolving `plan.md` and the first integrated demonstrable `VS-*.md` slice. Read [references/slices.md](references/slices.md), then obtain explicit agreement before Plan approval.
8. Execute each active slice with RED → GREEN → REFACTOR and focused verification. Read [references/build.md](references/build.md).
9. Obtain independent evidence where possible, fix accepted findings, and rerun fresh final checks. Read [references/review-and-ship.md](references/review-and-ship.md).
10. Request each next transition with `development_workflow`; only the user approves it with `/dev-workflow`.

Use [templates/spec.md](templates/spec.md), [templates/plan.md](templates/plan.md), and [templates/vertical-slice.md](templates/vertical-slice.md) as starting points, not status stores.

## Operating rules

- One worker writes by default. Parallelize read-only investigation and independent review only.
- Use Todo only for work discovered inside the active slice. Never copy pitch, slice, phase, approval, or ledger state into Todo.
- Prefer capability checks: use Worktrunk for isolated worktrees, Question for structured ambiguity, LSP for code intelligence, web search for external research, GitHub for remote evidence/actions, Git conventions for commits, and pi-subagents for scouts/reviewers when available.
- With Question, ask 2–4 independent related questions in one batch when possible; do not batch questions with unresolved decision dependencies. Without Question, ask the same compact numbered batch conversationally or record an unresolved decision and remain blocked.
- Without Worktrunk, confirm the effective workspace and never create a hidden raw-worktree manager. Without Todo, follow the active slice sequentially and report current/next work without creating another state store.
- Without LSP, use bounded repository search plus compiler, typechecker, and test evidence, and disclose reduced semantic precision. Without web search, use repository-local evidence and state that external research was not performed; never imply current external facts were verified.
- Without Git metadata, label freshness identity unavailable. Without Git conventions, follow repository instructions and preview explicitly authorized mutations. Without GitHub tooling, give the relevant command or URL and wait for separate authorization instead of inventing a client. Without pi-subagents, review sequentially and label same-context assurance reduced.
- If any optional extension is absent, continue only through its truthful fallback; never recreate its tool.
- Never claim a commit, push, PR, merge, release, or deployment before it occurs. Remote and destructive actions require explicit user authorization.
- Appetite is primarily an agent-effort envelope. Before Pitch approval, the ledger also requires an `Nh`, `Nd`, or `Nw` duration as a mandatory wall-clock backstop; it is not a substitute for shaping effort and scope. Pausing suspends workflow mutation, not the wall-clock timer.
- If the effort envelope is exhausted before the timer, stop and ask the user to cut scope and finish through normal Build approval, rewind the pitch, or abandon. Circuit commands are only for wall-clock backstop expiry; never silently expand effort, extend time, or lower quality floors.
