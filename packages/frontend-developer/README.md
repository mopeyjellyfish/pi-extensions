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

React implementation and visual validation methods are loaded only when they
fit the target. Optional image generation is documented with its tool when
available; it uses separately billed platform credentials and can upload input
images to that provider. Without image credentials, the other workflow methods
remain useful.

## Workflow and focused skills

1. Start with `frontend-development` or `/frontend` to inspect repository truth
   and coordinate the relevant methods.
2. Use `frontend-design` or `/design-ui` to extract mock-up evidence, resolve
   ambiguity, and maintain approved `DESIGN.md` context.
3. Use `react-interface` when the accepted target uses React. It preserves the
   existing stack and covers interaction, state, accessibility, and responsive
   behavior.
4. Use `visual-validation` after implementation. It defines named routes,
   states, and viewports and returns a mismatch ledger. Without an available
   browser or screenshot capability it reports unmet proof instead of claiming
   visual acceptance.
5. Use `image-generation` or `/generate-image` only when a generated or edited
   mock-up will improve the design evidence.

Browser automation and general engineering, planning, Git, and review workflows
are optional companion capabilities, not bundled dependencies. When they are
absent, use target-repository commands and report any verification that could
not run. Generated or supplied mock-ups do not define hidden behavior and must
not replace native controls or meaningful text.

## Image generation

`image_generation` uses GPT Image 2 through a separately billed OpenAI Platform
API key resolved by Pi. It does not accept ChatGPT or Codex subscription OAuth.
Configure a compatible registry model in trusted `.pi/image-generation.json` or
`~/.pi/agent/image-generation.json` as `{ "provider": "…", "model": "…" }`.
Project configuration takes precedence; an explicit invalid configuration fails
without a request. Input images and masks are uploaded to the provider, so
consider privacy and cost before use. Missing credentials leave the other
skills available and make no request.

Configuration must resolve to an official `openai` registry model whose base
URL is `https://api.openai.com`; compatible third-party Responses providers are
rejected before upload. For invalid configuration, correct or remove the
explicit file. For missing API-key authentication, configure separately billed
OpenAI Platform access or continue with a supplied mock-up. The tool refuses
paths outside the project and existing output files; choose a new explicit path
instead of overwriting evidence.
