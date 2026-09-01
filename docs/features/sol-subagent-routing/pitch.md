---
status: accepted
---

# Shape: Sol subagent routing and Claude advice

## Problem and evidence

The private root Pi profile does not match the preferred model routing. It uses
Terra at medium thinking for Worker and Opus at medium thinking for Reviewer.
The preferred routing uses Sol at low thinking for non-trivial implementation
and Opus at high thinking for formal review.

Planning also needs a clear manual profile. The preferred planning selection is
GPT-5.6 Sol at `xhigh`. Installation must not overwrite the global parent model
or thinking settings. The human selects this profile before Shape or planning.

The current implementation method already delegates normal work to Worker. It
also launches independent Workers in parallel only when each lane has an
isolated worktree, one writer, non-overlapping ownership, complete dependencies,
and a named integration point. The change must preserve this safety contract and
the direct-parent `/just-do-it` exception.

`pi-claude-bridge` 0.7.0 already registers `AskClaude` in this session. A
successful read-only Fable 5 advisory call confirmed that the tool can provide a
planning perspective. The pinned bridge accepts per-call `model`, `thinking`,
`mode`, and `isolated` values. `AskClaude` is unavailable when the parent itself
uses `claude-bridge`.

## Proposed solution

Keep the existing six-agent catalog. Apply this routing:

| Role            | Model         | Thinking | Purpose                                                   |
| --------------- | ------------- | -------- | --------------------------------------------------------- |
| Planning parent | GPT-5.6 Sol   | `xhigh`  | Manually selected profile for Shape and planning judgment |
| Worker          | GPT-5.6 Sol   | `low`    | Non-trivial implementation in one owned worktree          |
| Researcher      | GPT-5.6 Luna  | `low`    | Bounded factual discovery                                 |
| QA              | GPT-5.6 Luna  | `medium` | Acceptance, browser, and failure evidence                 |
| Reviewer        | Claude Opus 5 | `high`   | Formal fixed-document or fixed-diff review                |
| Git             | GPT-5.6 Terra | `medium` | Git delivery and conflict repair                          |
| Utility         | GPT-5.6 Luna  | `medium` | Bounded general support                                   |

Document GPT-5.6 Sol at `xhigh` as the preferred manual planning selection. Do
not install it as a global parent default and do not add a seventh Planner agent.

Use Worker for non-trivial implementation. Preserve direct parent execution for
`/just-do-it` and an unavailable Worker fallback. Use parallel Workers only for
safe independent lanes that the accepted plan marks `parallel-ready`.

Use `AskClaude` as an optional read-only adviser when source disclosure is
permitted and the parent is not a `claude-bridge` model:

- use `claude-fable-5` at `medium` for intent, taste, and planning perspective;
- use `claude-opus-5` at `high` only for a distinct rigorous challenge;
- use `mode: "read"` and `isolated: true` by default;
- do not duplicate the formal Opus Reviewer or the same question;
- count a rigorous planning challenge against the existing independent-review
  budget;
- skip the Opus planning challenge when a mandatory Go specification review
  consumes that budget.

Keep model names and private tool names in the private root profile and its
repository documentation. In the independently installable Feature Flow
package, describe only an optional read-only adviser capability, disclosure
check, distinct question, parent authority, and unavailable-capability fallback.

The pitch and plan share the implementation delivery unit. They do not need an
independent pull request or publication boundary.

## Boundaries and no-gos

- Do not change the six-agent catalog or add a Planner agent.
- Do not write user settings, credentials, authentication, or bridge
  configuration.
- Do not make Sol `xhigh` a global installed parent default.
- Do not add private model names, `AskClaude`, or this repository's paths to
  independently installable production guidance.
- Do not remove the `/just-do-it` direct-parent exception.
- Do not create parallel writers for overlapping files or one worktree.
- Do not add model fallback or silent per-run model overrides.
- Do not use Fable advice and Opus challenge for the same question.
- Do not use an Opus planning challenge when the Go specification review already
  consumes the independent-review budget.
- Keep prior accepted feature documents as historical evidence. Do not rewrite
  their old fixed decisions.
- Reshape if the pinned model registry cannot resolve Sol, Fable 5, or Opus 5 at
  the selected thinking levels.

## Decision-changing research and risks

- The request intentionally supersedes the earlier rule that every Sol child is
  exceptional. The fixed Sol Worker becomes the approved normal implementation
  child. Other Sol child overrides remain approval-gated.
- Pi cannot apply one parent model only during planning. Manual model and thinking
  selection is the smallest behavior that preserves user control.
- Sol Worker can increase subscription use, latency, or cost even at low
  thinking. The existing profile evaluation method remains available for later
  representative comparison.
- `AskClaude` requires Claude Code authentication and a non-`claude-bridge`
  parent. It must fail honestly when unavailable.
- Read-only `AskClaude` advice cannot replace executable QA.
- The model-routing files, root documentation, and root contract tests share one
  semantic boundary. Parallel writers would add merge risk without useful
  critical-path reduction.

## Review evidence

- **Applicability:** not applicable. This pitch does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns routing, architecture, synthesis, and approval. Fable and Opus
advice supplies evidence only.

The selected execution mode preference is **accept-all implementation**. This
preference is not implementation authority until the complete plan receives
whole-plan approval. Accept-all authority applies only to the accepted plan and
never authorizes merge, release, deployment, destructive cleanup, or unrelated
work.

Pitch approval authorizes the bounded pitch commit and planning handoff. It does
not authorize a remote push or pull request before whole-plan approval and final
verification.

## Observable acceptance criteria

- **AC-001 — Manual planning profile:** Root documentation identifies GPT-5.6
  Sol at `xhigh` as the preferred manual Shape and planning selection and states
  that installation does not overwrite parent settings.
- **AC-002 — Exact agent routing:** The private root profile keeps exactly six
  agents and routes Worker to `openai-codex/gpt-5.6-sol` at `low`, Reviewer to
  `claude-bridge/claude-opus-5` at `high`, and the other four agents to the
  accepted unchanged models and levels.
- **AC-003 — Non-trivial Worker use:** Normal non-trivial implementation uses one
  configured Worker. Safe independent `parallel-ready` lanes use isolated
  Workers concurrently. `/just-do-it` remains the direct-parent exception.
- **AC-004 — Safe parallelism:** No two active writers share a worktree or
  overlapping ownership. Every parallel lane has complete dependencies and a
  named integration point.
- **AC-005 — Fable planning advice:** Under a non-bridge parent, `AskClaude` can
  use `claude-fable-5` at `medium` in isolated read-only mode for intent and
  planning perspective.
- **AC-006 — Distinct Opus challenge:** `AskClaude` can use `claude-opus-5` at
  `high` in isolated read-only mode for a distinct rigorous challenge without
  duplicating formal review or an applicable Go specification review.
- **AC-007 — Honest capability boundary:** Guidance states the authentication,
  provider, disclosure, read-only, and unavailable-capability limits.
- **AC-008 — Package independence:** Independently installable production
  guidance uses capability terms and contains no private model, tool, profile,
  or repository names.
- **AC-009 — Verification:** Focused root and Feature Flow contract tests, source
  smoke, required checks, deterministic profile startup, and idle `/reload`
  acceptance pass against the final worktree.
