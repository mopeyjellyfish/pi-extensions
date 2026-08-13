# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent, skill-and-prompt-only Pi
package. It provides a quality-first coding workflow plus narrow guidance for
diagnosing bugs, modeling domain language, and reviewing changes. It has no
extension, runtime dependency, or Pi peer dependency.

The skills use the nearest `CONTEXT.md` for repository language. This
repository's root context file records its canonical terms. Review is
read-only unless a caller explicitly authorizes edits.

The package is original guidance, with [MIT-licensed inspiration from
mattpocock/skills](https://github.com/mattpocock/skills). It does not copy that
project's catalog or wording.

## Prompts

- `/develop [change request]`
- `/diagnose [bug report]`
- `/model-domain [domain or change]`
- `/review-change [fixed point or change]`

Install the package with Pi's normal package installation command. Its narrow
skills remain independently usable. `/develop` additionally requires the Git
aggregate agent set and `pi-subagents` so retained implementation and fresh
independent review are available. A missing companion is an actionable blocked
prerequisite, not a reason to weaken the quality gate:

```sh
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

Natural requests to implement, fix, debug, validate, or QA code can match the
`developing-changes` skill. It keeps tiny sequential, low-risk work in the
parent and routes noisy or multi-step work to one retained Sol writer followed
by fresh formal review. One-shot QA returns evidence without repository QA
records unless records are requested, reusable, or needed for comparison.

The private repository aggregate also discovers this package's `skills/` and
`prompts/` directories.
