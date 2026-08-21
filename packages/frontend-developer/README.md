# Pi frontend developer

`@mopeyjellyfish/pi-frontend-developer` provides a target-repository-neutral
frontend workflow. Install it explicitly, then use `frontend-development` or
`/frontend` for a change and `frontend-design` or `/design-ui` for focused
design work.

The workflow starts from repository instructions, live product behavior, and
existing UI. An existing `DESIGN.md` is durable design context beneath those
sources; its absence does not block work. Creation or material rewrite requires
human approval. Mock-ups are design evidence, not behavior specifications:
interactive controls and meaningful content remain native accessible UI.

React implementation methods are loaded only when they fit the target.

## Workflow and focused skills

1. Start with `frontend-development` or `/frontend` to inspect repository truth
   and coordinate the relevant methods.
2. Use `frontend-design` or `/design-ui` to extract mock-up evidence, resolve
   ambiguity, and maintain approved `DESIGN.md` context.
3. Use `react-interface` when the accepted target uses React. It preserves the
   existing stack and covers interaction, state, accessibility, and responsive
   behavior.
Browser automation and general engineering, planning, Git, and review workflows
are optional companion capabilities, not bundled dependencies. When they are
absent, use target-repository commands and report any verification that could
not run. Generated or supplied mock-ups do not define hidden behavior and must
not replace native controls or meaningful text.
