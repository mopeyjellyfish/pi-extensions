# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` provides `/shape` and `/plan`, their skills,
and compact pitch and plan templates. It has no runtime dependency.

```text
feature brief -> isolated task worktree -> accepted pitch -> complete delivery plan -> implement
```

The direct parent creates or selects an isolated linked worktree before Shape or
planning discovery. The same worktree continues through planning and serial
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

For a Go-targeted pitch or plan—Go source, module, CLI, or Go-specific guidance
or routing—the parent resolves installed `go` guidance and `cobra-viper` only
for CLI scope, then requires one fixed-document Go specification review before
approval. An unrelated `go.mod` or toolchain gate is not Go-targeted. That pass
uses the one independent-review budget, while other standards stay inline;
material solution, boundary, authority, or acceptance-criterion changes replace
its evidence. Templates always record Review evidence and use `not applicable`
for non-Go documents. Independent installations attempt named resolution; if a
companion is absent, the parent records the unmet method and completes a bounded
target-repository Go standards review without claiming it loaded.

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
branch or pull request. Plans forecast the critical path, lanes, integration,
expensive gates, and coordination cost; they predeclare evidence invalidation and
pause to report material forecast variance.

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
