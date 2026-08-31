---
name: shape
description: >-
  Turns a fuzzy feature request into an explicitly accepted pitch, then hands
  the accepted intent to planning-changes.
---

# Shape

The selected parent is the direct parent and default executor. It owns product
and architecture judgment, pitch synthesis, approval, and verification.

After receiving a feature brief, make the first action creating or selecting an
isolated linked worktree before discovery, research, repository reads, or
shaping questions. Inspect only the Git and worktree state needed to route the
task. Continue when already in the task worktree; otherwise use the available
worktree lifecycle tool. If no safe tool is available, stop before any other
Shape work and ask the human to provide an isolated worktree. Never work in the
main-branch checkout. Keep the same worktree through planning and serial
implementation; parallel writers need separate worktrees.

## Decide enough to pitch

Read repository instructions and the nearest relevant sources after worktree
setup. Use the `question` tool only for a human decision; otherwise inspect the
repository. Resolve the problem and evidence, smallest outcome, boundaries and
no-gos, material risks, authority, and observable acceptance criteria. Do not
restate repository truth. Keep only decision-changing research; omit empty or
non-decision research.

For material user interface scope, load and follow `frontend-design` before pitch
approval when that installed capability is available. For a greenfield web
application or materially new application surface, use its generation-first
initial design pass before pitch approval. It may select `interface-craft`,
`interface-design`, or `design-documentation` as the accepted method. Shape keeps
product intent, unresolved-direction decisions, and approval ownership. When
generation runs, Shape records its bounded consent, selected evidence, and
image-to-interface contract after explicit human selection and notes. If the
image-generation capability, consent, credentials, or result is unavailable,
continue through frontend design without generation and record no generated
evidence. Record the smallest decision-changing interface evidence: person and
task, surface mode, current design authority, desired feel, focal workflow,
representative states, responsive and accessibility constraints, operation
needs, required visual decisions, and `DESIGN.md` disposition. For unresolved
material visual direction, require image-backed directions and an explicit human
choice when that evidence capability exists; otherwise record unmet evidence
without pretending approval. Keep a bounded mechanical interface correction
direct and do not add this ceremony. Use the direct-parent fallback when
`frontend-design` is unavailable and record the unavailable evidence honestly.

A pitch identifies vertical slices as smallest end-to-end behaviors with focused
red and green proof. Planning groups dependent slices into the fewest coherent
delivery units: a delivery unit is one review, validation, and publication
boundary, not a commit-count rule. Planning documents share the implementation
delivery unit's publication unless they have independent review or merge value.

Ask a separate optional execution-mode question: **Checkpointed implementation
(default)** or **Accept-all implementation**. Do not add an option to the
four-option pitch approval question. If the question tool is unavailable or the
human cancels or skips it, use checkpointed implementation by default. Record
an accept-all preference in the pitch Authority section, but treat that
preference as not implementation authority until complete-plan approval.

Create `docs/features/<slug>/pitch.md` from `templates/pitch.md` with
`status: draft`, unless the target repository defines another feature-document
location. When the question document field is available, attach the complete
pitch document with `format: "md"`, not a summary or link. Formal document
approval must stay full-screen: set `presentation: "fullscreen"` when that
field is available, or omit it so the tool's default full-screen presentation
applies. Otherwise show the complete pitch in conversation. Present it with:

1. **Approve and plan**
2. **Revise**
3. **Deepen**
4. **Independent review**

If the tool or document field is unavailable, show the complete pitch in
conversation and ask the same question. Do not infer approval from silence.

Only **Approve and plan** is explicit human approval. It authorizes the named
pitch branch's bounded commit and later pull-request publication. Mark the pitch
`status: accepted`, invoke `commit`, then invoke `planning-changes` with the
accepted pitch. Invoke `open-pr` at this stage only when the pitch is its own
delivery unit with independent review or merge value; otherwise defer it to the
stable implementation delivery unit's single publication boundary.

If `commit` is unavailable, preserve local evidence, report recovery guidance,
and continue the pitch-to-plan handoff without publishing. When this pitch is an
independent delivery unit, unavailable `open-pr` or required `gh stack` tooling
fails closed for publication while the handoff continues. Do not embed ad hoc
Git commands. For a planned stack, `open-pr` must use `gh stack`. Approval never
authorizes merge, release, deployment, destructive cleanup, or unrelated remote
changes. Return here for fresh approval when implementation changes accepted
intent.

## Go specification review

Treat a pitch as Go-targeted only when its proposed outcome changes Go source, a
Go module, a Go CLI, or Go-specific guidance or routing for future Go work. An
unrelated `go.mod` or toolchain gate alone is not Go-targeted. For a Go-targeted
pitch, resolve the installed `go` skill by name and resolve `cobra-viper` only
when CLI scope applies. Before approval, require one `go-spec-reviewer` pass
with `Review mode: fixed-document Go specification`, the fixed pitch path, and
the caller-resolved `go` and applicable `cobra-viper` references; those caller
references supersede illustrative skill paths. The pass reviews a guidance-only
pitch only for Go routing-contract accuracy, consistency, applicability, and
implementation readiness; skip absent code, package, concurrency, and CLI
design checks.

This mandatory pass consumes the one independent-review budget; the parent
keeps other standards inline. Resolve blocking issues and material questions
before the approval question. Record applicability, fixed document, status, and
invalidation in the template's unconditional `Review evidence`; record `not
applicable` for non-Go pitches. A proposed-solution, boundary, authority, or
acceptance-criterion change invalidates the pass and requires one replacement;
wording-only edits do not. The parent owns that classification. If Independent
review is selected without a document change, show the existing evidence rather
than running another pass.

For independent installation, attempt installed skill resolution by name. If a
companion skill is unavailable, record the unmet method and complete a bounded
direct-parent review against target-repository Go standards before approval;
do not claim that the skill loaded or block only for its absence.

## Bounded support

After worktree setup, use cheap factual mapping, mechanical inventory, or QA
test-surface support only when it saves parent context. Use at most one
independent review when useful. Support provides evidence, not product,
architecture, slice, or approval decisions. Use the direct-parent fallback when
a role is unavailable. Any exceptional high-capability role requires explicit
human approval; production guidance must not depend on private agents or model
names.
