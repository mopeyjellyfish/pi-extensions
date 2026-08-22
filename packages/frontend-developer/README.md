# Pi frontend developer

`@mopeyjellyfish/pi-frontend-developer` provides a target-repository-neutral
frontend workflow. Install it explicitly, then use `/design` for any frontend
interface request. It routes design direction or UI-design work to
`frontend-design`; it routes implementation or frontend change work to
`frontend-development`, which may use `frontend-design` when needed.

`/generate-image` is a separate explicit command because it can expose input
to a provider, incur separately billed cost, require credentials, and needs
human consent. The package's focused methods remain available through skill
discovery.

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

1. Start with `/design` to classify the request. The selected
   `frontend-design` or `frontend-development` skill inspects repository truth.
2. For design direction or UI-design work, use `frontend-design` for impact
   routing. Use `interface-design` for material app work: it establishes
   person, task, feel, domain, a color world, signature, rejected defaults,
   hierarchy, type, density, tokens, depth, states, feedback, and visual proof
   without imposing a framework.
3. For implementation or a frontend change, use `frontend-development`. It may
   use `frontend-design` as needed. `interface-design` preserves the target
   framework and implementation conventions. When available, `implement` or
   `developing-changes` owns the general engineering loop; otherwise the method
   uses the one-Worker/TDD fallback. It uses `react-interface` only when the
   target uses React and an applicable specialist is available. Target-owned
   commands own hot reload and cleanup.
4. Use `/generate-image` only when a reference is useful and the human
   explicitly consents to provider privacy exposure, separately billed cost,
   and available credentials through Pi's `question` tool when available. Use
   a concise conversational fallback only when that tool is unavailable;
   cancellation or decline is not consent. It collects feedback after coherent
   material groups using the same capability.
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

## Local design review board

For material design direction, `/design` gathers only unresolved facts in one
compact batch of at most four questions, then creates two to eight coherent,
image-backed directions. It presents them through the local `design_board` tool
and verifies the localhost board URL before it asks for a visual choice. The
board is localhost-only and session-scoped. By default it is a full-width visual
inspection surface and the workflow collects the selected direction and notes in
the CLI. Call `present` with `feedbackMode: "board"` only when board-native radio,
notes, and submit controls are useful. A visit, silence, cancellation, or
unsubmitted note is not approval in either mode.
The board/site distinction matters: the board is design evidence, while a
separate target-owned live-site URL remains the native product implementation.
When that site exists, the workflow verifies and reports both URLs.
At coherent material milestones it updates the same board only after fresh image
evidence is reachable. Mechanical style, spacing, and placement corrections bypass
this ceremony.

Image generation still requires explicit provider privacy and separately billed
cost consent. If consent, credentials, a useful provider result, a browser, or
safe URL opening is unavailable, the workflow uses rendered specimens or
captures where possible and reports the unavailable review surface as unmet
proof; it never claims that anyone saw or approved it. At handoff, choose to
open, keep serving for the active session, or close each board and live-site
resource. Keep-serving never survives session shutdown; package-owned boards
close idempotently then.

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
