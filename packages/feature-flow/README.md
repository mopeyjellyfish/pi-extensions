# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` provides the `/shape` and `/plan` prompts,
their skills, and pitch and plan templates. It has no extension or runtime
dependency.

The default lifecycle stays in the direct parent:

```text
feature brief -> isolated task worktree -> discovery -> accepted pitch -> ordered plan -> implement
```

Worktree setup is the first Shape and planning action. Shape creates or selects
an isolated linked worktree before discovery, research, repository reads, or
shaping questions. Planning reuses that worktree before it reads planning
context. Serial implementation continues there. The skills never work in the
main-branch checkout; when safe worktree tooling is unavailable, they stop and
ask the human to provide one.

Shape uses the `question` tool for material human decisions and presents the
complete pitch for approval, revision, deepening, or independent review.
Planning turns accepted intent into explicit vertical slices with execution
mode, dependencies, a `standard` or `hard` difficulty (with a reason for hard),
TDD red and green signals, and verification. It presents
the whole plan for the same feedback loop and requires explicit approval before
implementation. `parallel-ready` records eligibility; it does not start work.

Install the package from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/feature-flow
```

Without the root profile, Shape asks focused questions in conversation when the
structured `question` tool is unavailable.

Or install the repository's private root profile to combine it with `question`
and the `implement` skill:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

The selected Fable or Sol parent retains product and architecture judgment,
pitch synthesis, slice design, approval, and verification. After worktree setup,
it may use one bounded Researcher handoff for repository mapping, official
primary-source research, or concise factual context; the handoff makes no
product, architecture, or approval decision. If package agents are unavailable
in an independent installation, the direct parent performs that work. Ambiguous
routing uses `question`; no hidden Sol child is the default.

When a slice changes module shape, planning uses `codebase-design` vocabulary
when that method is installed, otherwise a direct-parent evidence-based
boundary, seam, dependency, and test-surface assessment. This package does not
automatically install companion extensions, agents, or tools.
