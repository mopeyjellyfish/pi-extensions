# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` provides `/shape` and `/plan`, their skills,
and compact pitch and plan templates. It has no runtime dependency.

```text
feature brief -> read-only discovery -> isolated writes -> accepted pitch -> delivery plan -> implement
```

With no command arguments, `/shape` and `/plan` reuse unambiguous intent from the
current conversation and ask only for missing or ambiguous information. `/plan`
still requires explicitly accepted intent or an accepted pitch. Reusing context
does not imply approval.

Shape also accepts self-contained improvement-review evidence from `/improve`,
`/improve-ui`, or a requested critique or audit follow-on. It preserves selected
candidate IDs, evidence, constraints, dependencies, overlap, integration points,
uncertainty, recommended routes, applicable methods, and proof needs. For UI
reviews, it preserves accepted directions, inspected images, notes, research,
responsive and accessibility requirements, and operation context. Shape does not
repeat discovery or settled visual selection unless a material ambiguity
invalidates a decision. Review evidence and route choice are input, not approval.
Shape seeks pitch approval, then planning seeks separate complete-plan approval
before implementation. Browser and design-board controls grant no workflow or
publication authority. If `planning-changes` is unavailable, return the accepted
pitch and self-contained evidence handoff and name the unmet capability without
claiming the transition ran.

The direct parent can inspect read-only evidence in the initial checkout. It
creates or selects an isolated linked worktree before the first Shape or planning
write, including documents and generated artifacts. The same worktree continues through planning and serial
implementation. Parallel work requires a separate worktree, a sole writer, and
non-overlapping ownership. The skills stop rather than use the main checkout or
unsafe worktree tooling.

Shape records problem and evidence, solution, boundaries/no-gos,
decision-changing research and risks, authority, and observable criteria. It
asks a separate optional execution-mode question: checkpointed implementation
is the default, while accept-all is only a recorded preference. If the question
tool is unavailable or the human cancels or skips it, checkpointed remains the
default.
Planning repeats the selected mode; only whole-plan approval confirms
accept-all authority for the named accepted plan. The parent owns product and
architecture judgment, synthesis, verification, and approval. Shape and planning
use a factual research capability only for a named repository or primary-source
evidence gap, and a mechanical support capability only for a named bounded
inventory or transformation evidence gap when no specialist capability owns it.
A QA capability may provide test-surface evidence, and at most one review
capability may be used when useful. Support is read-only and returns evidence
only. A support capability does not start further children. Independent
read-only evidence lanes run concurrently only for named
evidence gaps that are disjoint and have a critical-path or parent-context
benefit. The parent joins every result before a decision. Support cannot own
product, architecture, slice, synthesis, approval, final diff inspection, or
verification. If a selected factual research capability, mechanical support
capability, QA capability, or review capability is unavailable, use an honest
direct-parent fallback and record the unmet evidence; do not select another
capability as a substitute. An exceptional high-capability role needs explicit
human approval.

During planning, at most one optional read-only adviser capability may be used
when disclosure is permitted. That capability may receive at most one
planning-perspective question and, when the independent-review budget permits,
one distinct rigorous-challenge question. It must not duplicate a question or
required review and returns evidence only. The parent retains architecture,
synthesis, approval, and verification authority. A rigorous challenge consumes
the one independent-review budget; any applicable mandatory specification
review takes precedence. If the capability is unavailable, use the direct-parent
fallback and record that no advice was obtained.

Material UI scope receives conditional interface evidence during Shape and
traceable state, responsive, accessibility, system-reuse, and visual-proof gates
during planning. For a greenfield web application or materially new application
surface, Shape uses named capability resolution for a generation-first frontend
design pass before pitch approval. It records selected evidence and an
image-to-interface contract when that evidence is available. Planning maps it to
native accessible structure, target components, semantic tokens, representative
states, responsive and accessibility paths, and desktop/mobile browser
comparison with a resolved or explicitly accepted visual mismatch ledger.
Mechanical edits remain direct. Named capability resolution uses an honest
direct-parent fallback, so the package stays independently installable, makes no
unauthorized request, and records unmet evidence rather than blocking Shape.

Go-targeted work needs one substantive specification review at the
implementation-ready plan boundary. Review a pitch early only when consequential
Go decisions must be committed before planning. Do not repeat unchanged evidence.
Go source, modules, CLIs, and Go-specific guidance/routing activate this rule, not
unrelated toolchain evidence. Resolve installed `go` and CLI-applicable
`cobra-viper`. Independent installs record unavailable companions and bounded
standards fallback honestly. Review evidence records a deferred pitch pass when
appropriate.

Start with the primary user journey, observable result, and shortest end-to-end
proof. Put an early runnable proof before supporting machinery. Green test counts
do not replace acceptance evidence. Add supporting work only when the outcome
or a concrete risk needs it. Compatibility and migrations need actual users,
data, contracts, or an explicitly requested policy. Do not invent them for
unused greenfield code. A scope update explicitly replaces or defers prior scope.

Planning identifies vertical slices first. A vertical slice is one end-to-end
behavior with a narrow deterministic red/green proof. It then groups dependent
slices into delivery units: a delivery unit is one coherent review, validation,
and publication boundary. One delivery unit, one branch, and one pull request is
the default; that pull request is standalone and may contain multiple atomic
commits for coherent changes. Planning documents share the implementation
delivery unit's publication unless they have independent review or merge value.

Independent delivery units use sibling standalone pull requests, while sequential
dependency chains use ordered GitHub stacks. A mixed plan can combine parallel
sibling pull requests with dependent stacks. Every delivery unit retains
independent review value and required-check viability. Safe parallel lanes use
separate worktrees, sole writers, non-overlapping ownership, and named integration
points.
Plans record common or adjacent bases, checks, ownership, CI fan-out, and cascade
cost. Multiple slices or commits inside one delivery unit do not select another
branch or pull request. Only multi-unit plans need a critical-path/coordination
forecast. Single-unit plans accept the whole outcome, boundaries, and dependencies
without topology ceremony, and detail the next behavior as evidence warrants.
Report variance. Seek fresh approval only for a real changed decision boundary.

Each slice has a stable ID, descriptive title, outcome, and focused proof for
execution handoffs. Final verification, review, and authorized publication stay
named separately. The accepted plan owns intent. The execution parent mirrors
its slices in available progress tracking and verifies evidence before closing
progress. Delegate a coherent serial unit to one writer with named internal
slices and progress/evidence, not a return/resume handshake per slice. Accepted
intent authorizes routine in-scope diagnosis, check/review repair, and safe writer
recovery. Prefer the retained writer. Replacement requires confirmed shutdown
and diff/evidence ownership transfer, never concurrent writers. Report uncertain
shutdown as a blocker. Human stops remain for scope, architecture, authority,
no-progress, destructive, spending, credential, or unsafe publication decisions.
Planning does not require Todo or add publication boundaries per slice.

Explicit acceptance bundles bounded commit and later publication authority. An
accepted pitch uses `commit` before planning, and an accepted plan uses `commit`
before implementation. `open-pr` runs at those stages only when the planning
document is an independently valuable delivery unit; otherwise the stable
implementation unit publishes once. Every pull request requires `open-pr`; only
a planned sequential chain requires `gh stack`. Missing focused delivery tooling
fails closed for publication with local evidence and recovery guidance; the
direct parent continues the lifecycle handoff without publishing that stage.
Lifecycle text does not provide ad hoc Git commands. Approval never covers merge,
release, deployment, destructive cleanup, or unrelated remote changes. For
Worktrunk-managed branches, `gh stack link` verifies the chain but does not make a
locally tracked view; use `gh stack view --json` only for a locally tracked stack.

Install from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/feature-flow
```

The package does not automatically install companion extensions, agents, or
tools.
