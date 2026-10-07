# Pi frontend developer

`@mopeyjellyfish/pi-frontend-developer` provides a target-repository-neutral
frontend workflow. Install it explicitly, then use `/design` for any frontend
interface request. It routes design direction or UI-design work to
`frontend-design`; it routes implementation or frontend change work to
`frontend-development`, which may use `frontend-design` when needed.

Focused interface requests route through `interface-craft`; its 21 operations
cover design, evaluation, refinement, enhancement, fixes, and live iteration.
`/design document` routes directly to `design-documentation` for an approved
portable DESIGN.md proposal.

Use `/improve-ui <app surface and user task>` for an evidence-led improvement
plan, not implementation. It inspects the named app surface, evaluates repository
standards and current UX, and uses the standalone `interface-research` skill to
compare the same task across competitors, adjacent products, and platform
conventions. Research records sources, dates, access limits, and adopt/adapt/reject
decisions without copying products or treating popularity as usability proof.

The prompt composes read-only `interface-craft` critique/audit,
`frontend-design`, material `interface-design`, `visual-validation`, and applicable
React specialists. It presents original image-backed directions through a verified
`design_board`, obtains explicit human selection and notes, then offers a terminal
**Shape and plan** or **Plan directly** choice. Shape seeks pitch approval before
planning. Direct planning preserves the route for already-settled intent. Planning
owns the complete delivery plan and its separate approval. Neither visual selection
nor route choice authorizes implementation. Missing
optional capabilities remain unmet proof. Without inspectable images or a verified
board, the visual gate remains incomplete. No app implementation or `DESIGN.md`
rewrite is authorized. `/design` routes explicit research-only requests to
`interface-research` and research-and-plan requests to `/improve-ui`. Ordinary
focused improvements still use `interface-craft`. Critique and audit remain
read-only and offer the same delivery choice only when follow-on delivery is
requested.

Both routes carry a self-contained handoff: selected direction or improvements,
inspected image evidence, user notes, current-state and research evidence,
constraints, accessibility and responsive requirements, unmet proof, and operation
context. Shape preserves accepted visual selection rather than repeating it.
If `shape` or `planning-changes` is unavailable, return that handoff and any
accepted pitch, name the unmet capability, and do not claim the transition ran.
When `question` is unavailable, ask in conversation. Browser and design-board
controls never authorize Shape, planning, implementation, tracker mutation, or
publication.

`/generate-image` is a separate explicit command because it can expose input
to a provider, consume subscription quota, require credentials, and needs
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

`design-documentation` is directly discoverable and available through
`/design document`. Scan mode extracts implemented reusable decisions; seed mode
records an explicitly accepted direction without fabricated tokens; merge/refresh
mode reconciles an existing file while preserving unknown content. It presents
the complete portable proposal and requires explicit approval before creation,
replacement, or material rewrite.

## Workflow and focused skills

1. Start with `/design` to classify the request. The selected
   `frontend-design` or `frontend-development` skill inspects repository truth.
2. For design direction or UI-design work, use `frontend-design` for impact
   routing. Use `interface-design` for material app work: it establishes
   person, task, feel, domain, a color world, signature, rejected defaults,
   hierarchy, type, density, tokens, depth, states, feedback, and visual proof
   without imposing a framework. For a greenfield web application or materially
   new application surface, use an available image-generation capability for a
   consented, bounded generation-first initial pass. If generation cannot run,
   continue normal UI design without generated evidence.

3. For implementation or a frontend change, use `frontend-development`. It may
   use `frontend-design` as needed. `interface-design` preserves the target
   framework and implementation conventions. When available, `implement` or
   `developing-changes` owns the general engineering loop; otherwise the method
   uses the one-Worker/TDD fallback. It uses `react-best-practices` only for a
   React target, `react-native-skills` only for React Native or Expo work, and
   `react-view-transitions` only for applicable React view-transition animation
   work. Target-owned commands own hot reload and cleanup.
4. Use `/generate-image` for the accepted initial pass or another useful
   reference. Before the first provider request, obtain explicit consent for
   privacy exposure and subscription quota use. State one bounded pass; further
   provider work needs a new bound and consent. Inspect two to eight directions,
   verify the `design_board` URL, and record explicit human selection and notes.
   If generation is unavailable, declined, or failed, make no unauthorized
   request and continue normal UI design without generated evidence.
5. Use `visual-validation` after a stable non-trivial UI change when browser or
   screenshot capability is available. It defines named routes, states, and
   desktop and mobile viewports and returns a mismatch ledger. Without proof,
   report unmet proof instead of claiming visual acceptance.

Image-based work requires inspection of the reference and result images, not
only their paths or capture-success messages. Accepted visual decisions remain
the target. Missing required images are unmet proof, and passing code checks do
not establish visual acceptance.

The bundled `interface-design` method is a modified derivative of Damola
Akinleye’s MIT-licensed skill pinned at
`2f9be3206855bcb2d1d0af262c8bae25cba6658d`. Its complete copyright and
permission notice ships in `skills/interface-design/LICENSE.txt`.

`interface-craft/references` are modified Apache-2.0 adaptations of Impeccable
4.1.1 at `56f44523f76efdcec813e67b38ee550e49b16f48`. The package remains
MIT-owned for its original work and ships the Apache-2.0 text and retained
upstream notice in `LICENSE` and `NOTICE.md` for those references.

The `react-best-practices`, `react-native-skills`, and
`react-view-transitions` resources vendor Vercel's MIT-licensed guidance from
`vercel-labs/agent-skills` at
`063bee94c3f4df8453406c830b0a7df0f2860278`. `interface-craft` includes
portable audit checks informed by `vercel-labs/web-interface-guidelines` at
`e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`; it does not use that project's
live-fetch workflow or Vercel-specific copywriting preferences. `NOTICE.md`
retains the required provenance and license notices.

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
For image-backed CLI feedback, use `presentation: "inline"` when the active
`question` schema supports it so the question and options render below displayed
images. If the tool or field is unavailable, use a concise conversational question
after the evidence as the fallback.
The board/site distinction matters: the board is design evidence, while a
separate target-owned live-site URL remains the native product implementation.
When that site exists, the workflow verifies and reports both URLs.
At coherent material milestones it updates the same board only after fresh image
evidence is reachable. Mechanical style, spacing, and placement corrections bypass
this ceremony.

Image generation still requires explicit provider privacy and subscription quota consent. If consent, credentials, a useful provider result, a browser, or
safe URL opening is unavailable, the workflow uses rendered specimens or
captures where possible and reports the unavailable review surface as unmet
proof; it never claims that anyone saw or approved it. At handoff, choose to
open, keep serving for the active session, or close each board and live-site
resource. Keep-serving never survives session shutdown; package-owned boards
close idempotently then.

## Image generation

`image_generation` uses GPT Image 2 with Pi's existing `openai-codex`
subscription OAuth. Use Pi `/login` for `openai-codex`. The tool automatically
finds an `openai-codex-responses` registry model with usable OAuth, independently
of the conversation model. No model switch or image configuration is required.
Platform API keys are not accepted and there is no Platform fallback. No Codex
auth files, app-server, or delegated model turn are used.

To select a different registry entry for the same subscription, configure trusted
`.pi/image-generation.json` or `~/.pi/agent/image-generation.json`:

```json
{ "provider": "openai-codex", "model": "<your registry model ID>", "imageModel": "gpt-image-2" }
```

`model` selects authentication, not the image model. Optional `imageModel`
defaults to `gpt-image-2`; only that verified ID is accepted. Project configuration
takes precedence and is read only when trusted. Explicit selection is authoritative:
invalid configuration, missing or unsupported models, and unusable OAuth fail
without automatic selection or a provider request. Errors identify the configuration
path and corrective action without exposing auth errors. Fix or remove the file
to restore automatic selection. Never put credentials in this file.

The versioned native JSON transport follows OpenAI Codex
[`rust-v0.160.0` image request types](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/codex-api/src/images.rs)
and [image endpoints](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/codex-api/src/endpoint/images.rs).
It sends only image requests to the fixed `https://chatgpt.com/backend-api/codex`
origin. Model and auth base-URL overrides cannot change that destination.
This is an undocumented, version-sensitive backend contract, not a public
compatibility promise. Live subscription entitlement remains unverified.

Generation and reference edits produce PNG only, with opaque background and
automatic quality. PNG, JPEG, and WebP reference images are sent as inline data
URLs in JSON. Masks and JPEG/WebP output are not supported and are rejected
before upload. Obtain consent for input privacy exposure and subscription quota
use before each bounded pass. Cancellation does not guarantee that upstream
quota use is reversed. Requests are never retried automatically.

`size` defaults to `auto`. An optional `WIDTHxHEIGHT` is forwarded unchanged:
both edges must be divisible by 16, neither may exceed 3840, the aspect ratio
must be at most 3:1, and total pixels must be 655360–8294400. Exact-size results
are checked before saving; the tool never resizes or substitutes a preset.
**Custom-size backend acceptance remains unverified.** The model's
[dimension guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
also notes experimental large sizes and a possible strict `<3840` backend edge
limit. Backend rejection is still possible after local validation.

Responses and errors are bounded; provider error bodies are not echoed. The tool
validates PNG artifacts, propagates cancellation, refuses paths outside the
project, and refuses existing output files. Choose a new explicit `.png` path
instead of overwriting evidence. Missing subscription authentication leaves the
other skills available and makes no provider request.
