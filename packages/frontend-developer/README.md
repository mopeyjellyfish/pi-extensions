# Pi frontend developer

`@mopeyjellyfish/pi-frontend-developer` provides a target-repository-neutral
frontend workflow. Install it explicitly, then use `frontend-development` or
`/frontend` for a change and `frontend-design` or `/design-ui` to route design
work.

`frontend-design` keeps a bounded mechanical style, spacing, or placement edit
direct. It routes a non-trivial app interface—such as a dashboard, admin panel,
tool, settings flow, data interface, or interactive product workflow—to the
standalone `interface-design` method. Marketing, campaign, landing-page, and
brand-only work route to `marketing-site-design` only when that separate
capability is available; otherwise the package states the limitation rather
than treating app-interface rules as a substitute.

The workflow starts from repository instructions, live product behavior, and
existing UI. An existing `DESIGN.md` is durable design context beneath those
sources; its absence does not block work. Creation or material rewrite requires
human approval. Mock-ups are design evidence, not behavior specifications:
interactive controls and meaningful content remain native accessible UI.

## Workflow and focused skills

1. Start with `frontend-development` or `/frontend` to inspect repository truth
   and coordinate the relevant methods.
2. Use `frontend-design` or `/design-ui` for impact routing. Use
   `interface-design` for material app work: it establishes person, task, feel,
   domain, a color world, signature, rejected defaults, hierarchy, type,
   density, tokens, depth, states, feedback, and visual proof without imposing
   a framework.
3. `interface-design` preserves the target framework and implementation
   conventions. It uses `react-interface` only when the target uses React and
   an applicable specialist is available. Target-owned commands own hot reload
   and cleanup.
4. It may use `image-generation` or `/generate-image` only when a reference is
   useful and the human has explicitly consented to provider privacy exposure,
   separately billed cost, and available credentials. It collects feedback after
   coherent material groups using a structured question capability when
   available, with a concise conversational fallback.
5. Use `visual-validation` after a stable non-trivial UI change when browser or
   screenshot capability is available. It defines named routes, states, and
   desktop and mobile viewports and returns a mismatch ledger. Without proof,
   report unmet proof instead of claiming visual acceptance.

The bundled `interface-design` method is a modified derivative of Damola
Akinleye’s MIT-licensed skill pinned at
`2f9be3206855bcb2d1d0af262c8bae25cba6658d`. Its complete copyright and
permission notice ships in `skills/interface-design/LICENSE.txt`.

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
