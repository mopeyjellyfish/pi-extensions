# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent, skill-and-prompt-only Pi
package. It provides narrow workflows for diagnosing bugs, modeling domain
language, and reviewing changes. It has no extension, runtime dependency, or
Pi peer dependency.

The skills use the nearest `CONTEXT.md` for repository language. This
repository's root context file records its canonical terms. Review is
read-only unless a caller explicitly authorizes edits.

The package is original guidance, with [MIT-licensed inspiration from
mattpocock/skills](https://github.com/mattpocock/skills). It does not copy that
project's catalog or wording.

## Prompts

- `/diagnose [bug report]`
- `/model-domain [domain or change]`
- `/review-change [fixed point or change]`

Install the package with Pi's normal package installation command. The private
repository aggregate also discovers its `skills/` and `prompts/` directories.
