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
decision-changing research and risks, authority, and observable criteria. The
parent owns product and architecture judgment, synthesis, verification, and
approval. It may use bounded factual, mechanical, QA, or one independent review
support when useful; an independent installation uses the direct parent when
those capabilities are unavailable. An exceptional high-capability role needs
explicit human approval.

Planning writes one complete delivery plan before implementation: all slices,
critical path, dependencies, lanes, worktree ownership, red/green proof, checks,
commit units, PR bases and stack positions, and done conditions. It does not
alternate plan/work/plan/work or start overlapping parallel writers.

Explicit acceptance bundles bounded publication authority. An accepted pitch
uses `commit` then `open-pr` before planning; an accepted plan uses them before
implementation. A planned stack requires `open-pr` and `gh stack`. Missing
`commit`, `open-pr`, or stack tooling fails closed for publication with local
evidence and recovery guidance; the direct parent continues the lifecycle
handoff without publishing. Lifecycle text does not provide ad hoc Git commands. Approval never
covers merge, release, deployment, destructive cleanup, or unrelated remote
changes. For Worktrunk-managed branches, `gh stack link` verifies the chain but
does not make a locally tracked view; use `gh stack view --json` only for a
locally tracked stack.

Install from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/feature-flow
```

The package does not automatically install companion extensions, agents, or
tools.
