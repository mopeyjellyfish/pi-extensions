---
name: pi-development-workflow
description: Run a Pi-native software workflow from problem discovery through a Shape Up pitch, integrated vertical slices, TDD, independent review, and explicitly authorized shipping.
---

# Pi Development Workflow

Use this skill for non-trivial features and fixes that need durable decisions and evidence.

## Route by current phase

1. Read `development_workflow` status first. If none exists, ask the user to run `/dev-workflow start <title>`.
2. Discover the concrete problem and relevant repository truth.
3. Shape `spec.md` as a rough, solved, bounded pitch. Read [references/pitch.md](references/pitch.md).
4. Build an evolving `plan.md` and the first integrated demonstrable `VS-*.md` slice. Read [references/slices.md](references/slices.md).
5. Execute the active slice with RED → GREEN → REFACTOR and focused verification. Read [references/build.md](references/build.md).
6. Obtain independent evidence where possible, fix accepted findings, and rerun fresh final checks. Read [references/review-and-ship.md](references/review-and-ship.md).
7. Request the next transition with `development_workflow`; only the user approves it with `/dev-workflow`.

Use [templates/spec.md](templates/spec.md), [templates/plan.md](templates/plan.md), and [templates/vertical-slice.md](templates/vertical-slice.md) as starting points, not status stores.

## Operating rules

- One worker writes by default. Parallelize read-only investigation and independent review only.
- Use Todo only for work discovered inside the active slice. Never copy pitch, slice, phase, approval, or ledger state into Todo.
- Prefer capability checks: use Worktrunk for isolated worktrees, Question for structured ambiguity, LSP for code intelligence, web search for external research, GitHub for remote evidence/actions, Git conventions for commits, and pi-subagents for scouts/reviewers when available.
- Without Worktrunk, confirm the effective workspace and never create a hidden raw-worktree manager. Without Question, ask one conversational question or record an unresolved decision and remain blocked. Without Todo, follow the active slice sequentially and report current/next work without creating another state store.
- Without Git metadata, label freshness identity unavailable. Without Git conventions, follow repository instructions and preview explicitly authorized mutations. Without GitHub tooling, give the relevant command or URL and wait for separate authorization instead of inventing a client. Without pi-subagents, review sequentially and label same-context assurance reduced.
- If any optional extension is absent, continue only through its truthful fallback; never recreate its tool.
- Never claim a commit, push, PR, merge, release, or deployment before it occurs. Remote and destructive actions require explicit user authorization.
- An expired appetite triggers the circuit breaker: finish verified scope, reshape, explicitly extend, or abandon. Never silently extend time or lower quality floors.
