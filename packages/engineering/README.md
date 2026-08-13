# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent, skill-and-prompt-only Pi
package. It provides a quality-first coding workflow plus narrow guidance for
public-seam TDD, codebase design, diagnosing bugs, modeling domain language,
and reviewing changes. It has no extension, runtime
dependency, or Pi peer dependency.

The skills use the nearest `CONTEXT.md` for repository language. This
repository's root context file records its canonical terms. Review is
read-only unless a caller explicitly authorizes edits.

The focused implementation, TDD, codebase-design, and diagnosis methods adapt
MIT-licensed guidance from
[mattpocock/skills](https://github.com/mattpocock/skills). See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the pinned source and
license.

## Prompts

- `/develop [change request]`
- `/implement [approved slice, bounded request, or confirmed bug outcome]`
- `/work [approved slice, bounded request, or confirmed bug outcome]` (alias)
- `/diagnose [bug report]`
- `/model-domain [domain or change]`
- `/review-change [fixed point or change]`

Install the package with Pi's normal package installation command. Its narrow
skills remain independently usable. `/develop` and any `/implement` route that needs
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
to `implement`. `/implement` also owns bugs, refactors, documentation,
metadata, and mechanical implementation. For a bug, Implement selects the
executor before that executor applies `diagnosing-bugs`.

The focused skills own their methods. Shape owns product intent. Planning owns
vertical slices. Implement owns direct or retained execution, validation,
review, repair, and parent-only authorized delivery. `test-driven-development`
owns public-seam red and green behavior evidence. `codebase-design` owns deep
modules, stable seams, and evidence-based responsibility. `diagnosing-bugs`
owns the observable diagnosis loop. `reviewing-changes` owns formal review.
`/develop` owns only route choice, user coordination, synthesis, final
verification, and delivery authority.

Sequential, low-risk, locally understandable work that is cheap to validate can
stay in the parent through `/implement` and follows the same quality contract.
Behavioral code uses public-seam red and green evidence. Pure refactors and
non-behavioral work use applicable tests or focused validation instead of
manufactured failures. QA-only work uses a fresh read-only QA agent. One-shot
QA returns evidence without repository records unless records are requested,
reusable, or needed for comparison; QA never replaces formal review.

The private repository aggregate also discovers this package's `skills/` and
`prompts/` directories.
