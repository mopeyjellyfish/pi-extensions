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

A pitch identifies vertical slices as smallest end-to-end behaviors with focused
red and green proof. Planning groups dependent slices into the fewest coherent
delivery units: a delivery unit is one review, validation, and publication
boundary, not a commit-count rule. Planning documents share the implementation
delivery unit's publication unless they have independent review or merge value.

Create `docs/features/<slug>/pitch.md` from `templates/pitch.md` with
`status: draft`, unless the target repository defines another feature-document
location. Show the complete pitch document, not a summary or link, with:

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

## Bounded support

After worktree setup, use cheap factual mapping, mechanical inventory, or QA
test-surface support only when it saves parent context. Use at most one
independent review when useful. Support provides evidence, not product,
architecture, slice, or approval decisions. Use the direct-parent fallback when
a role is unavailable. Any exceptional high-capability role requires explicit
human approval; production guidance must not depend on private agents or model
names.
