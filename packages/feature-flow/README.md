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
default. Planning repeats the selected mode; only whole-plan approval confirms
accept-all authority for the named accepted plan. The parent owns product and
architecture judgment, synthesis, verification, and approval. It may use
bounded factual, mechanical, QA, or one independent review support when useful;
an independent installation uses the direct parent when
those capabilities are unavailable. An exceptional high-capability role needs
explicit human approval.

Material UI scope receives conditional interface evidence during Shape and
traceable state, responsive, accessibility, system-reuse, and visual-proof gates
during planning when applicable capabilities are installed. Mechanical edits
remain direct. The package stays independently installable: design capabilities
supply evidence only, and the direct parent preserves lifecycle ownership and an
honest fallback.

Planning identifies vertical slices first. A vertical slice is one end-to-end
behavior with a narrow deterministic red/green proof. It then groups dependent
slices into delivery units: a delivery unit is one coherent review, validation,
and publication boundary. One delivery unit, one branch, and one pull request is
the default; it may contain multiple atomic commits for coherent changes.
Planning documents share the implementation delivery unit's publication unless
they have independent review or merge value. A stack is justified only when
every position has independent value, required-check viability, integration
dependency, CI fan-out,
and cascade cost that repays coordination. Plans forecast critical path, lanes,
units, integration, expensive gates, and cascade cost; they predeclare evidence
invalidation and pause to report material forecast variance.

Explicit acceptance bundles bounded commit and later publication authority. An
accepted pitch uses `commit` before planning, and an accepted plan uses `commit`
before implementation. `open-pr` runs at those stages only when the planning
document is an independently valuable delivery unit; otherwise the stable
implementation unit publishes once. A planned stack requires `open-pr` and
`gh stack`. Missing focused delivery tooling fails closed for publication with
local evidence and recovery guidance; the direct parent continues the lifecycle
handoff without publishing that stage. Lifecycle text does not provide ad hoc
Git commands. Approval never covers merge, release, deployment, destructive
cleanup, or unrelated remote changes. For Worktrunk-managed branches, `gh stack link` verifies the chain but
does not make a locally tracked view; use `gh stack view --json` only for a
locally tracked stack.

Install from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/feature-flow
```

The package does not automatically install companion extensions, agents, or
tools.
