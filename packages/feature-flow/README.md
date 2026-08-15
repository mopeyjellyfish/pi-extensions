# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` provides the `/shape` and `/plan` prompts,
their skills, and pitch and plan templates. It has no extension or runtime
dependency.

The default lifecycle stays in the direct parent:

```text
request -> accepted pitch -> ordered plan -> implement
```

Shape uses the `question` tool for material human decisions and presents the
complete pitch for approval, revision, deepening, or independent review.
Planning turns accepted intent into explicit vertical slices with execution
mode, dependencies, TDD red and green signals, and verification. It presents
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

Optional independent research or review uses one host-provided role only when
the human requests it. The direct parent retains synthesis and verification.
