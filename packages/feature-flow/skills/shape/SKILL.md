---
name: shape
description: >-
  Turns a fuzzy feature request into an explicitly accepted pitch, then hands
  the accepted intent to planning-changes.
---

# Shape

The selected parent is the direct parent and default executor. It owns product
and architecture judgment, pitch synthesis, approval, and verification.

Read-only discovery can start in the initial checkout. Before the first write,
including a pitch or generated artifact, select or create an isolated linked
worktree. Reuse it through planning and serial implementation. Never write in
the main checkout. If safe worktree tooling is unavailable, stop before writing
and ask for an isolated worktree. Parallel writers need separate worktrees.

## Receive upstream improvement-review evidence

A feature brief can be a self-contained handoff from architecture improvement
review, accepted UI review, or focused critique or audit. Read that handoff as evidence, not as pitch or plan approval. Preserve the user's
chosen candidate set and stable IDs, scope, reviewed evidence, constraints,
applicable methods, dependencies, overlap, integration points, uncertainty,
recommended routes and reasons, and proof needs. For UI work, also preserve the
accepted direction, inspected image evidence, user notes, current-state and
research evidence, accessibility and responsive requirements, unmet proof, and
operation context. Keep observations separate from proposals.

Do not repeat review discovery or settled visual selection. Inspect only gaps
that can change the pitch. Carry settled decisions into the pitch and planning
handoff. If a material ambiguity or conflict invalidates a prior decision, name
it and ask only for the affected decision. Missing evidence remains unmet proof.
An upstream Shape choice starts this lifecycle only. Shape still synthesizes
and seeks approval for the pitch, then planning separately seeks complete-plan
approval before implementation. Browser and design-board controls grant no
workflow or publication authority.

## Decide enough to pitch

Read repository instructions and the nearest relevant sources. Use the `question` tool only for a human decision; otherwise inspect the
repository. Resolve the problem and evidence, smallest outcome, boundaries and
no-gos, material risks, authority, and observable acceptance criteria. Do not
restate repository truth. Keep only decision-changing research; omit empty or
non-decision research.

Start with the primary user journey, observable result, and shortest end-to-end
proof. Put an early runnable proof before supporting machinery. Green test counts
do not replace acceptance evidence. Add supporting work only when the outcome
or a concrete risk needs it. Compatibility and migrations need actual users,
data, contracts, or an explicitly requested policy. Do not invent them for
unused greenfield code. A scope update explicitly replaces or defers prior scope.

For material user interface scope, load and follow `frontend-design` before pitch
approval when that installed capability is available. Supply accepted upstream
review evidence to satisfy settled direction decisions, not to restart its visual
selection loop. For a greenfield web application or materially new application
surface without accepted upstream visual evidence, use its generation-first
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
accepted pitch and preserved upstream evidence. If `planning-changes` is
unavailable, return a self-contained handoff with the accepted pitch, evidence,
and unmet planning capability. Do not claim that planning ran or substitute
implementation. Invoke `open-pr` at this stage only when the pitch is its own
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
when CLI scope applies. Require an early pitch `go-spec-reviewer` pass only
when consequential Go design decisions must be committed before planning.
Otherwise defer the substantive review to the implementation-ready plan. An
early pass uses `Review mode: fixed-document Go specification`, the fixed pitch path, and
the caller-resolved `go` and applicable `cobra-viper` references; those caller
references supersede illustrative skill paths. The pass reviews a guidance-only
pitch only for Go routing-contract accuracy, consistency, applicability, and
implementation readiness; skip absent code, package, concurrency, and CLI
design checks.

When needed, this early pass consumes the one independent-review budget. The parent
keeps other standards inline. Resolve blocking issues and material questions
before the approval question. Record applicability, fixed document, status, and
invalidation in the template's unconditional `Review evidence`; record `not
applicable` for non-Go pitches and `deferred to implementation-ready plan`
when no consequential Go decision needs early commitment. A proposed-solution, boundary, authority, or
acceptance-criterion change invalidates the pass and requires one replacement;
wording-only edits do not. The parent owns that classification. If Independent
review is selected without a document change, show the existing evidence rather
than running another pass.

For independent installation, attempt installed skill resolution by name. If an early pass is needed and a companion skill is unavailable, record the
unmet method and complete a bounded direct-parent review against target-repository
Go standards before approval.
Do not claim that the skill loaded or block only for its absence.

## In-scope continuation

Accepted intent authorizes routine diagnosis and bounded check/review repairs,
not another approval for each failure. Stop for scope, architecture, authority,
no-progress, destructive, spending, credential, or unsafe publication decisions.
Prefer a retained writer. A replacement requires confirmed shutdown and transfer
of the current diff and evidence, never concurrent writers. Report uncertain
shutdown as a blocker. Read-only discovery does not require worktree setup.

## Bounded support

Use a factual research capability only for one named
repository or primary-source evidence gap. Use a mechanical support capability
only for one named bounded inventory or transformation evidence gap when no
specialist capability owns it. A QA capability may provide test-surface evidence,
and use at most one review capability when useful. Support is read-only and
returns evidence only. A support capability does not start further children.
Run independent read-only evidence lanes concurrently only when their named
evidence gaps are disjoint and the concurrent work has a
critical-path or parent-context benefit. The parent joins every result before a
decision. Support cannot own product, architecture, slice, synthesis, approval,
final diff inspection, or verification. If a selected factual research
capability, mechanical support capability, QA capability, or review capability
is unavailable, use an honest direct-parent fallback and record the unmet
evidence; do not select another capability as a substitute.
Any exceptional high-capability role requires explicit human approval;
production guidance must not depend on private agents or model names.
