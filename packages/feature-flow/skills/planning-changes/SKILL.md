---
name: planning-changes
description: >-
  Turns explicit accepted intent or an accepted Shape pitch into one complete
  delivery plan before implementation.
---

# Planning changes

Accept explicit accepted intent or an accepted Shape pitch. The selected parent
owns product and architecture judgment, slice design, approval, synthesis, and
verification. Read-only discovery may start in the initial checkout. Before the
first write, including a plan or generated artifact, reuse the Shape worktree
or create an isolated linked worktree with safe lifecycle tooling. Never write
in the main checkout. If that tooling is unavailable, stop before writing and
ask for an isolated worktree. Read relevant instructions, public contracts,
and tests before choosing the plan.
For accepted intent without a pitch, use checkpointed implementation unless the
human explicitly selected accept-all. Create or update
`docs/features/<slug>/plan.md` from `../shape/templates/plan.md` with
`status: draft`, unless the target repository defines another feature-document
location.

## Optional planning adviser

Use one optional read-only adviser capability at most when
it adds useful planning evidence and source disclosure is permitted. That
capability may receive at most one planning-perspective question and, when the
independent-review budget permits, one distinct rigorous-challenge question. It
must not duplicate a question or required review.
The adviser provides evidence only. The selected parent retains product and
architecture judgment, slice design, synthesis, approval, and verification.

A rigorous challenge consumes the one independent-review budget. Any applicable
mandatory specification review takes precedence, so do not request another
rigorous challenge when that review consumes the budget. If the adviser
capability is unavailable, use the direct-parent fallback, record that the
advice was not obtained, and do not claim that the capability ran.

## Go specification review

Treat a plan as Go-targeted only when its proposed outcome changes Go source, a
Go module, a Go CLI, or Go-specific guidance or routing for future Go work. An
unrelated `go.mod` or toolchain gate alone is not Go-targeted. For a Go-targeted
implementation-ready plan, resolve the installed `go` skill by name and resolve `cobra-viper` only
when CLI scope applies. Before approval, require review evidence covering the
implementation-ready Go contracts. For new or changed decisions, use one
`go-spec-reviewer` pass with `Review mode: fixed-document Go specification`, the fixed plan path, and
the caller-resolved `go` and applicable `cobra-viper` references; those caller
references supersede illustrative skill paths. The pass reviews a guidance-only
plan only for Go routing-contract accuracy, consistency, applicability, and
implementation readiness; skip absent code, package, concurrency, and CLI
design checks.

Do not repeat unchanged pitch review evidence. Reuse an early Go pass for the
contracts it covers, and review only material new implementation-ready decisions.
One substantive Go specification review is required at this boundary, not an
unconditional pitch-plus-plan pair. This pass consumes the independent-review budget; the parent
keeps other standards inline. Resolve blocking issues and material questions
before the approval question. Record applicability, fixed document, status, and
invalidation in the template's unconditional `Review evidence`; record `not
applicable` for non-Go plans. A proposed-solution, boundary, authority, or
acceptance-criterion change invalidates the pass and requires one replacement;
wording-only edits do not. The parent owns that classification. If Independent
review is selected without a document change, show the existing evidence rather
than running another pass.

For independent installation, attempt installed skill resolution by name. If a
companion skill is unavailable, record the unmet method and complete a bounded
direct-parent review against target-repository Go standards before approval;
do not claim that the skill loaded or block only for its absence.

## Plan complete delivery

Accept the whole outcome, boundaries, and dependencies before implementation.
Name internal slices and their observable results. Detail the next executable
behavior as evidence warrants, without expanding scope. A single-unit plan needs
no forecast or topology ceremony. For multiple delivery units, record the whole
scope and dependency order up front so local detail does not change delivery
boundaries. Identify vertical slices as observable end-to-end behaviors with
focused red/green proof, and group dependent slices into the fewest coherent
review, validation, and publication boundaries.

Start with the primary user journey, observable result, and shortest end-to-end
proof. Put an early runnable proof before supporting machinery. Green test counts
do not replace acceptance evidence. Add supporting work only when the outcome
or a concrete risk needs it. Compatibility and migrations need actual users,
data, contracts, or an explicitly requested policy. Do not invent them for
unused greenfield code. A scope update explicitly replaces or defers prior scope.

One delivery unit, one branch, and one standalone pull request is the default.
Planning documents share the implementation delivery unit's publication unless
they have independent review or merge value. Split only when independent review,
ownership, rollback, risk, or merge value repays coordination cost.

After grouping slices, model delivery units and their dependencies before
selecting branches or pull-request bases. Independent delivery units use sibling
branches and sibling standalone pull requests from their accepted common base.
Sequentially dependent delivery units use one ordered GitHub stack. A mixed plan
can contain parallel sibling pull requests and one or more dependent stacks.
Every delivery unit, sibling or stacked, must retain independent review value and
required-check viability.

Parallel lanes require separate isolated worktrees, sole writers, non-overlapping
ownership, and a named integration point. Record their common base, checks,
integration order, and CI fan-out. For each sequential chain, record every
branch, adjacent pull-request base, stack position, checks, and cascade cost. If
coordination cost does not repay review or merge value, collapse delivery units
before plan approval. Multiple slices or commits inside one delivery unit do not
create branches, pull requests, or stack positions. Every pull request uses
`open-pr`; only a planned sequential chain uses `gh stack`.

For multiple delivery units only, record the critical path and independent lanes:
active lanes, delivery-unit and pull-request count, integration points, expensive
gates, and likely cascade cost. Predeclare
an invalidation map: focused slice proof, affected-boundary checks, integration
proof, and required stable-unit gates. Reuse evidence only while its covered
surface is unchanged. For checkpointed plans, if observed coordination
materially exceeds that forecast, report the variance and simplify within
accepted boundaries. Seek fresh approval only for changed scope, architecture,
delivery boundaries, dependencies, or authority.

Repeat the pitch's selected execution mode in the complete plan: checkpointed
implementation remains the default, and accept-all remains a preference until
whole-plan approval confirms accept-all authority. State that accept-all
authority applies only to the named accepted plan and never authorizes merge,
release, deployment, destructive cleanup, or unrelated work. Routine in-scope diagnosis, check/review repair, and safe writer recovery are
authorized. Stop only for a real scope, architecture, authority, no-progress,
destructive, spending, credential, or unsafe publication decision.

For each named slice, detail the next executable behavior when evidence supports
it. Record its observable outcome and requirement trace, public seam
and files, dependencies, execution lane/worktree ownership, red proof, green
proof and checks, atomic commit, delivery-unit topology, pull-request base, stack
position when applicable, and done conditions. Use separate isolated worktrees
and a sole writer for every parallel lane. Reject overlapping parallel writers,
shared mutable boundaries, and unresolved dependencies; serialize them instead.
Planning defines but does not start parallel work.

Give every slice a stable ID and descriptive title for execution handoffs.
Carry its delivery unit, exact identity, observable outcome, focused proof, and
done conditions into `implement`. Keep final verification, review, and authorized
publication named separately. The accepted plan remains the intent authority.
The execution parent mirrors named slices in available progress tracking and
verifies evidence before closing them. Delegate a coherent serial delivery unit
to one writer with all accepted internal slices. Do not require a return/resume
handshake per tracker item. Prefer the retained writer for repair. If it cannot
continue, inspect child state and preserve the diff, evidence, and next action.
A replacement requires confirmed shutdown and ownership transfer. Never run
concurrent writers in one worktree or guess shutdown. Planning does not require
Todo, start execution tracking, or add publication boundaries per slice.

When the accepted pitch contains material UI scope, trace its accepted interface
criteria and any selected evidence or image-to-interface contract into vertical
slices. Each relevant interface slice names `frontend-development`, the accepted
design or operation method, native accessible structure, target components,
semantic tokens, representative states, responsive surfaces, accessibility
paths, design-system reuse, and operation-specific checks. Name
`react-best-practices` only for a React target; name `react-native-skills` only
for React Native or Expo work; name `react-view-transitions` only for applicable
React view-transition animation work. When an evidence capability exists, name
`visual-validation` and target-owned representative desktop and mobile browser
evidence. Complete the implementation only with a resolved or explicitly
accepted visual mismatch ledger containing observed differences, likely causes,
and recheck targets. If direction remains provisional, order a design-evidence
slice before UI implementation. Plan a parent-owned `design-documentation` and
`DESIGN.md` approval gate when durable decisions should persist. Frontend methods
supply context, implementation, and proof; `implement` retains engineering
orchestration. If these installed frontend methods are unavailable, use the named
capability resolution direct-parent fallback and record the unmet method or proof
honestly.

When a slice changes module shape, use `codebase-design` vocabulary when
available. Otherwise use a direct-parent evidence-based fallback: current and
proposed boundaries, seams, dependencies, and test surface.

Show the whole plan document through the question document field with
`format: "md"` when available, not a summary or link. Formal document approval
must stay full-screen: set `presentation: "fullscreen"` when that field is
available, or omit it so the tool's default full-screen presentation applies.
Use these options:

1. **Approve and implement**
2. **Revise**
3. **Deepen**
4. **Independent review**

The whole-plan approval presentation and question must name the selected
execution mode so approval explicitly confirms it. Do not add a fifth option.
If the tool or document field is unavailable, show the whole plan in
conversation and ask the same question. Require explicit human approval of the
whole plan; one slice or a summary is insufficient.

Only **Approve and implement** is explicit human approval. It authorizes the
named plan branch's bounded commit and later pull-request publication. Mark the
plan `status: accepted`, invoke `commit`, then invoke `implement` with the
accepted plan. Invoke `open-pr` at this stage only when the plan is its own
delivery unit with independent review or merge value; otherwise defer it to the
stable implementation delivery unit's single publication boundary.

If `commit` is unavailable, preserve local evidence, report recovery guidance,
and continue the plan-to-implementation handoff without publishing. When this
plan is an independent delivery unit, unavailable `open-pr` or required
`gh stack` tooling fails closed for publication while the handoff continues. Do
not embed ad hoc Git commands. If `implement` is unavailable, use the direct
parent as executor. A planned stack requires `open-pr` to use `gh stack`.
`gh stack link` verifies a Worktrunk-managed chain without creating a locally
tracked view; use `gh stack view --json` only where a local tracked view exists.
Approval never authorizes merge, release, deployment, destructive cleanup, or
unrelated remote changes.

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
