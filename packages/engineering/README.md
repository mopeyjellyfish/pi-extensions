# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent, skill-and-prompt-only Pi
package. It provides a quality-first coding workflow plus narrow guidance for
public-seam TDD, evidence-based engineering practices, diagnosing bugs,
modeling domain language, and reviewing changes. It has no extension, runtime
dependency, or Pi peer dependency.

The skills use the nearest `CONTEXT.md` for repository language. This
repository's root context file records its canonical terms. Review is
read-only unless a caller explicitly authorizes edits.

The package is original guidance, with [MIT-licensed inspiration from
mattpocock/skills](https://github.com/mattpocock/skills). It does not copy that
project's catalog or wording.

## Prompts

- `/develop [change request]`
- `/work [approved slice, bounded request, or confirmed bug outcome]`
- `/diagnose [bug report]`
- `/model-domain [domain or change]`
- `/review-change [fixed point or change]`

Install the package with Pi's normal package installation command. Its narrow
skills remain independently usable. `/develop` and any `/work` route that needs
delegation or independent review additionally require the Git aggregate agent
set and `pi-subagents`. A missing companion is an actionable blocked
prerequisite, not a reason to weaken the quality gate:

```sh
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

Natural implementation, bug, validation, QA, and review requests can match
`developing-changes`. `/develop` is a lean router across the first-party
workflow: unresolved product intent goes to `shape`, accepted non-trivial
intent goes to `planning-changes`, and accepted slices and bounded changes go
to `work`. `/work` also owns bugs, refactors, documentation, metadata, and
mechanical implementation. For a bug, work selects the executor before that
executor applies `diagnosing-bugs`.

The focused skills own their methods. Shape owns product intent. Planning owns
vertical slices. Work owns direct or retained execution, TDD, implementation,
validation, review, and repair. `test-driven-development` owns public-seam red
and green behavior evidence. `engineering-practices` owns practical,
evidence-based design guidance. `reviewing-changes` owns formal review.
`/develop` owns only route choice, user coordination, synthesis, final
verification, and delivery authority.

Sequential, low-risk, locally understandable work that is cheap to validate can
stay in the parent through `/work` and follows the same quality contract.
Behavioral code uses public-seam red and green evidence. Pure refactors and
non-behavioral work use applicable tests or focused validation instead of
manufactured failures. QA-only work uses a fresh read-only QA agent. One-shot
QA returns evidence without repository records unless records are requested,
reusable, or needed for comparison; QA never replaces formal review.

The private repository aggregate also discovers this package's `skills/` and
`prompts/` directories.
