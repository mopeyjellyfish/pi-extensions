---
status: accepted
---

# Shape: an AI-first Git-native feature delivery flow

## Executive summary

One `shape` skill guides a feature from an initial brief through a reviewed,
human-approved pitch, an ordered vertical-slice plan, implementation, review,
and local completion. Worktrunk isolates the work; two Markdown files preserve
intent and progress; Git preserves history.

The workflow removes custom project-management machinery so agents spend context
on product and engineering decisions instead of maintaining workflow state.

## Problem

Feature delivery currently depends on users repeatedly prompting for research,
questions, scope control, vertical planning, test-first implementation, review,
and QA. Durable guidance helps, but the previous design encoded those practices
in a large command-line state machine with duplicate state, custom history
checks, and extensive edge-case tests.

That machinery grew beyond the problem it was meant to solve. It could prove its
own records were internally consistent, but it could not prove product value,
test quality, review quality, or that a commit contained the correct behavior.
Git, Worktrunk, repository checks, and independent review already own the useful
parts of that job.

The desired product is simpler: one skill that remembers the development method,
one pitch that records accepted intent, and one plan whose first unchecked slice
makes interruption recovery obvious to both humans and agents.

## Appetite

This is a direct pre-release simplification, not a compatibility project. Delete
superseded machinery rather than adapting it. Keep the package independently
installable, skill-only, dependency-free at runtime, and small enough for a
medium-reasoning implementation agent to follow without reconstructing hidden
state.

Do not trade away Worktrunk isolation, complete human pitch approval, one writer,
behavior-focused tests, independent review, applicable integrated QA,
repository-required checks, or source-control and remote-action boundaries.

## Research and prior art

Shape Up contributes the durable pitch structure: problem, appetite, solution,
rabbit holes, and no-gos. Repository truth, fixed decisions, and observable
acceptance criteria make that structure effective for agents as well as humans.

Git already records exact file history and working-tree interruption state.
Markdown task lists already represent ordered completion. Worktrunk already owns
creation, activation, and removal of linked worktrees. Reusing these native
capabilities is smaller and more truthful than maintaining parallel workflow
records.

A smaller validated state file was considered, but it would retain a second
source of truth, transition commands, reconciliation rules, and tests. The
Git-native design is preferred because the package is unshipped and has no
compatibility obligation.

## Solution

The `worktree` tool routes every feature to `feat/<slug>` before feature
artifacts are written. The skill matches its status active path to its list entry
to obtain branch identity without a direct Git query. With no brief, it resumes
the active feature route or asks the human to choose from the tool's existing
feature worktrees.

Each feature contains only:

```text
docs/features/<slug>/
├── pitch.md
└── plan.md
```

`pitch.md` carries `status: draft` or `status: accepted` and the complete
human/agent contract. A separate read-only review challenges it before the human
sees and approves the entire document. A material intent change returns it to
draft and repeats review and approval. Git preserves earlier versions.

`plan.md` contains ordered vertical slices headed
`## [ ] NNN — Observable outcome`. The first unchecked slice is current or next.
A dirty worktree means inspect and resume that slice; a clean worktree means
start it. A concise blocked note records only the reason and next action. A slice
is checked after its implementation, applicable tests and required checks,
independent review, and real user or operator QA when such a path exists.

Pending slices remain flexible. There is no separate plan-approval gate. When a
local commit is authorized, its delivery changes and checkbox update belong
together. Local completion grants no remote, publication, deployment,
destructive cleanup, or worktree-removal authority.

## Fixed decisions

- Ship one public `shape` skill and one thin `/shape` prompt.
- Install through this repository's aggregate so Worktrunk is available; do not
  advertise feature-flow as a standalone install.
- Keep the classic nine pitch headings used by this document and the package
  template.
- Keep exactly `pitch.md` and `plan.md` as durable feature-flow artifacts.
- Let Worktrunk own worktree lifecycle and Git own history and interruption
  state.
- Use one writer; parallelism is limited to read-only research, review, or QA.
- Use the first unchecked plan slice as the only resume marker.
- Require complete pitch review and human approval before planning or Build.
- Require appropriate tests, checks, review, and applicable integrated QA before
  checking a slice.
- Never infer authority for commits or remote, destructive, publication,
  deployment, or cleanup actions.
- Add no runtime dependency, service, extension, compatibility layer, or schema
  migration.

## Rabbit holes

- Reintroducing machine state for stronger-looking guarantees would recreate the
  deleted workflow engine without improving product evidence.
- Turning every practice into mandatory prose would replace code complexity with
  prompt complexity. Keep only the gates that prevent plausible costly failure.
- Automatically discovering and classifying every linked feature would duplicate
  Worktrunk. Human selection is acceptable when no route is active.
- Treating every slice as requiring manual dogfood would duplicate automated
  tests. Use integrated QA only when a real path exists.

## No-gos

- No workflow helper, machine-readable feature state, hashes, history scans,
  custom commit trailers, or bank receipts.
- No per-slice plan files, dependency graph, evidence fields, estimates, or
  generated archive copies.
- No raw Git worktree lifecycle fallback.
- No automatic staging, commit, push, pull request, merge, publication,
  deployment, cleanup, or worktree removal.
- No production extension, agent definition, daemon, database, or runtime
  dependency.
- No compatibility support for the unshipped superseded format.

## Acceptance criteria

- **AC-001 — Git-native package:** The packed package contains one skill, one
  prompt, and pitch/plan templates, with no workflow executable or machine-state
  template.
- **AC-002 — Human/agent pitch:** The pitch template retains the nine approved
  Shape Up headings and one whole-document approval gate.
- **AC-003 — Simple resume:** The skill resumes from Worktrunk, Git state, and
  the first unchecked slice in one plan.
- **AC-004 — Delivery quality:** Checked slices require appropriate tests,
  required checks, independent review, and applicable integrated QA.
- **AC-005 — Authority boundaries:** Local completion never implies commit,
  remote, publication, deployment, destructive cleanup, or worktree-removal
  authority.
- **AC-006 — Self-hosting:** This feature directory contains only the accepted
  pitch and one ordered plan.
- **AC-007 — Verification:** Focused package tests, repository checks, security
  checks, packed smoke, and live Pi reload acceptance pass.
