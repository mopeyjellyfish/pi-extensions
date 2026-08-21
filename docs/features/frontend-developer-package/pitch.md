---
status: accepted
---

# Shape: Frontend developer package

## Problem and evidence

The current package set can implement and review React code, but it does not give
Pi one coherent frontend workflow from visual intent to a verified interface.
Without that workflow, generated applications can converge on generic layouts,
arbitrary design choices, screenshot-shaped markup, and visually plausible work
that has not been checked at realistic viewport sizes.

The desired outcome is an independently installable
`@mopeyjellyfish/pi-frontend-developer` package that can:

- establish and preserve a deliberate visual direction;
- use a project `DESIGN.md` as durable design context when one exists;
- turn supplied or generated mock-up images into explicit design evidence and
  implementation decisions;
- write production React interfaces without replacing a target repository's
  chosen stack;
- verify responsive, interactive, accessible, and visual behavior; and
- optionally generate or edit mock-up imagery with OpenAI's GPT Image API when
  separately billed API credentials are available.

Anthropic's official frontend-design guidance confirms that a compact, on-demand
skill can materially reduce generic “AI slop,” but Anthropic does not define
`DESIGN.md` as its project contract. Google Labs publishes an Apache-2.0,
currently alpha, `DESIGN.md` specification for persistent visual identity.
OpenAI documents mock-up-driven frontend implementation and GPT Image 2
image-generation and editing workflows. These sources support the product
shape, but their text is not a package dependency or a source to copy without a
clear license.

## Proposed solution

Create one mixed Pi package with a small orchestrating frontend workflow,
focused method skills, prompt entry points, and one optional provider-backed
image tool. The package remains useful when image credentials or browser
automation are unavailable.

### App-interface design loop revision

Make a deeply integrated, framework-neutral `interface-design` skill the
package's primary app-interface method for dashboards, admin panels, tools,
settings, data interfaces, and interactive product workflows. Begin with the
complete pinned MIT skill, then modify that skill in place so `DESIGN.md`, image
generation, live feedback, target-owned hot reload, implementation handoff, and
visual validation form its own coherent method—not wrapper advice. Keep
`frontend-development` as the overall build entry, retain `react-interface` as
an independently improvable specialist used only for React targets, and make
`frontend-design` a small framework-neutral design router with no competing
app-design method.
The integrated `interface-design` workflow is:

1. **Route by impact and surface:** apply a direct repository-conforming edit
   for a bounded style or placement change. Route a new app surface, major app
   redesign, or unclear product-UI direction to `interface-design` before code.
   Marketing and campaign pages are outside that method; route to
   `marketing-site-design` when that capability is installed, otherwise state
   the limitation and use available repository guidance without pretending
   app-interface rules fit.
2. **Establish intent:** identify the real person, their core task, the desired
   feel, the product domain and vocabulary, a domain-grounded color world, one
   signature element, and obvious visual or structural defaults to reject. Use
   project truth and real content. Ask focused questions when a costly ambiguity
   remains; state only responsible, reversible assumptions.
3. **Explore with images when useful:** for greenfield apps, major redesigns, or
   unresolved visual direction, use `image-generation` with explicit privacy,
   cost, and credential consent when it is available and useful. Generate or
   edit references with the human in the loop, inspect every artifact, and
   obtain direction feedback before treating it as accepted evidence. Skip this
   pass for small changes, clear existing systems, unavailable credentials, or
   sensitive inputs.
4. **Build a live app surface:** use the target repository's existing framework,
   components, tokens, content, navigation, behavior, start command, and
   hot-reload workflow. The design method does not select or impose a framework.
   Hand implementation to an applicable installed specialist;
   `react-interface` is one such specialist only when the target uses React.
   Never leave a server or browser resource outside target command ownership.
5. **Confirm material groups:** after each coherent visual or interaction
   milestone, show the current result and ask for feedback through an available
   structured question capability, with a concise conversational fallback.
   Resolve the resulting decision ledger before continuing. Do not interrupt a
   one-step mechanical fix with mood boards or repeated approval prompts.
6. **Verify and converge:** use `visual-validation` at named desktop and mobile
   viewports after stable milestones. Iterate on feedback and evidenced shared
   causes until the human has accepted the direction, no material design
   questions remain, and unmet proof is reported honestly.

Copy the MIT-licensed `interface-design` skill from pinned commit
`2f9be3206855bcb2d1d0af262c8bae25cba6658d` into this package as the starting
method, then deeply revise the copied skill for Pi and this package. It must
remain recognizable as the complete app-design discipline rather than a
summary, external reference, unchanged vendored snapshot, or optional add-on.
Preserve its complete copyright and permission notice in the packed, co-located
`interface-design/LICENSE.txt` file. Prominently identify the modifications and
pinned source in the package README; do not add attribution prose to
`interface-design/SKILL.md`. Retain and reconcile its intent-first brief, domain
exploration, visual hierarchy, deliberate density, spatial rhythm, semantic token
and depth architecture, existing-control reuse, complete interaction and data
states, polish, motion, anti-patterns, rendering, build discipline, user
confirmation, and swap/squint/signature/token checks.

Replace `.interface-design/system.md` throughout the copied method with this
package's approved `DESIGN.md` contract and precedence. Weave the optional
`image-generation`, framework-neutral implementation handoff, structured
material-feedback, target-owned local hot-reload, and `visual-validation` loops
into the relevant stages of the method itself. Reference `react-interface` only
as the available React specialist, never as an architectural requirement.
Every integration remains capability-based so the skill is still useful when
credentials, a framework specialist, a structured question tool, or a browser
are unavailable. The supplied Apache-2.0 prose is prior art only and is not
copied or adapted.

### Frontend workflow

Provide one frontend-development entry that composes these focused capabilities
instead of duplicating a second general engineering implementation loop:

1. **Frontend design:** inspect product context, target-repository rules,
   existing UI, supplied images, and `DESIGN.md`; choose a specific visual thesis;
   define typography, color, spacing, composition, motion, density, and
   interaction principles; and name deliberate anti-patterns for that product.
2. **Mock-up to UI:** treat an image as design evidence rather than executable
   specification. Extract layout regions, hierarchy, assets, tokens, states,
   responsive hypotheses, and ambiguities. Keep controls, navigation, forms,
   and meaningful text as native accessible UI rather than flattening them into
   imagery.
3. **React implementation:** preserve the target repository's framework,
   component system, styling approach, conventions, and public behavior. For a
   genuinely greenfield React surface, recommend a stack only after checking
   repository intent. Implement real loading, empty, error, focus, hover,
   disabled, and responsive states where the feature needs them.
4. **Visual validation:** render the changed interface at named desktop and
   mobile viewports, exercise key interactions, inspect accessibility-relevant
   behavior, and compare screenshots with the accepted visual evidence. Report
   concrete mismatches and iterate on causes, not arbitrary pixel nudges. When
   no suitable browser or screenshot capability exists, report the unmet proof
   instead of claiming visual acceptance.

Accessibility, responsive behavior, content hierarchy, performance-sensitive
asset choices, and state coverage belong inside this workflow and its focused
references. They do not each become another top-level skill.

### DESIGN.md contract

When a target repository already contains `DESIGN.md`, treat it as the canonical
project design context beneath repository instructions and established product
behavior. Validate its statements against the live component system and UI;
do not let a stale document silently override repository evidence.

When the file is absent, frontend work can continue. Propose creating it when
visual decisions need to persist across changes, and require human approval
before adding or materially rewriting it. Use an original, lean template that
can align with the Google Labs alpha format where useful without requiring its
CLI or unstable schema. Record design rationale and application guidance, not
only tokens.

### Optional image generation

Register an image-generation tool for one-shot GPT Image 2 generation and
editing. It accepts a bounded prompt, optional input images and mask, supported
output controls, and an explicit target file. It validates paths, formats,
dimensions, response size, and provider errors; passes cancellation through the
request; writes no credentials or response data to standard output; and returns
a concise artifact reference that Pi can inspect as image input.

The tool uses OpenAI Platform API billing and a compatible OpenAI API credential
resolved through Pi's authentication boundary. It must reject ChatGPT/Codex
subscription OAuth as sufficient image-API authority, reject missing or
incompatible configuration before network access, and never expose a key to
browser code or repository files. Image generation is optional: design,
mock-up consumption, React implementation, and visual validation continue to
work without it.

### Smallest vertical slices

1. **Design contract:** an agent can inspect a target UI and supplied mock-up,
   produce a deliberate visual direction, and create or update an approved
   `DESIGN.md` without generic defaults or invented product behavior.
2. **Implemented interface:** an agent can turn accepted design evidence into a
   real React UI that preserves the target stack and passes focused behavior,
   accessibility, responsive, and static checks.
3. **Visual proof:** an agent can capture named viewport states, compare them
   with the accepted design evidence, and close evidenced mismatches without
   substituting screenshots for UI.
4. **Generated mock-up:** with separately billed OpenAI API credentials, an
   agent can generate or edit a mock-up artifact, inspect it, and feed it into
   the same design-contract and implementation flow; without credentials it
   fails before sending a request and explains the requirement.

The pitch and plan have no independent merge value. They should remain on this
feature branch and publish with the stable implementation delivery unit rather
than creating a documentation-only pull request.

## Boundaries and no-gos

- Do not copy Anthropic or OpenAI skill wording. Treat that material only as
  prior art. Adapt the pinned MIT-licensed `interface-design` source only with
  its complete copyright and permission notice in packed co-located `LICENSE.txt`
  and prominent modification attribution in the package README, not within
  `interface-design/SKILL.md`.
- Do not claim that `DESIGN.md` is an Anthropic standard or that Google's alpha
  schema is stable.
- Do not require `DESIGN.md` for every frontend edit, overwrite it silently, or
  let it override target-repository instructions and live design-system
  evidence.
- Do not create a parallel general implementation, planning, Git, or release
  workflow. Compose with available target capabilities and remain useful when
  companion packages are absent.
- Do not force React, Vite, Tailwind, shadcn/ui, a font blacklist, a palette, or
  a visual style onto an existing product. Distinctive means context-specific,
  not maximalist.
- Do not reproduce a mock-up as one static image, absolute-position every pixel,
  invent hidden interactions, or infer mobile behavior without surfacing the
  ambiguity.
- Do not make automated pixel-perfect similarity the only visual acceptance
  signal. Accessibility, interaction, responsive behavior, content, and
  accepted design intent remain independent constraints.
- Do not bundle a browser runtime merely as skill scaffolding. Use an available
  browser/test capability and report when visual proof cannot run.
- Do not scrape ChatGPT, reuse Codex OAuth, assume a ChatGPT subscription pays
  for API calls, store API keys in project configuration, or silently switch
  image providers or models.
- Do not expand the first release into Figma import/export, a hosted design
  service, a component library, a design-token compiler, arbitrary image
  providers, or framework-specific skills beyond React.

Reshape if Pi cannot safely obtain a separately billed OpenAI API credential
through its model registry, if the pinned Pi API cannot return image artifacts
without unsafe filesystem behavior, or if visual validation requires bundling a
browser extension to be independently useful.

## Decision-changing research and risks

- Anthropic's official skill and blog establish the anti-generic design goal and
  progressive-disclosure approach. The supplied prose remains prior art only
  and is not copied or adapted:
  <https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md>
  and <https://claude.com/blog/improving-frontend-design-through-skills>.
- Damola Akinleye's `interface-design` skill is MIT-licensed and directly covers
  product dashboards, tools, admin panels, design-system craft, intent-first
  exploration, and visual self-checks. Pin adaptations to commit
  `2f9be3206855bcb2d1d0af262c8bae25cba6658d`, retain its complete MIT notice
  in the packed co-located license, and identify modifications in the package
  README, not the skill, and do not import its separate project-memory file:
  <https://github.com/Dammyjay93/interface-design>.
- Google Labs' Apache-2.0 `design.md` project supplies a relevant structured
  format and linter, but it is alpha. Compatibility should be best-effort and
  optional, not a runtime dependency:
  <https://github.com/google-labs-code/design.md> and
  <https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md>.
- OpenAI's frontend-app-builder demonstrates approved-mock-up extraction,
  native interactive UI, and screenshot validation, but its repository does not
  currently expose a clear root license. Use it as research, not copied text:
  <https://github.com/openai/plugins/blob/main/plugins/build-web-apps/skills/frontend-app-builder/SKILL.md>.
- OpenAI documents `gpt-image-2` generation and editing through the Image API.
  Image calls use separate Platform API billing; a paid ChatGPT subscription
  does not include API usage:
  <https://developers.openai.com/api/docs/guides/image-generation> and
  <https://help.openai.com/en/articles/8156019-is-api-usage-included-in-chatgpt-subscriptions-even-if-i-have-a-paid-chatgpt-account>.
- Mock-ups can contain unreadable text, impossible layouts, missing states, and
  inaccessible contrast. The workflow must preserve uncertainty and verify
  behavior rather than treating generated pixels as product truth.
- Visual quality is partly judgment-based. Package validation and source/packed
  smoke prove resource composition, while runtime tests, fixture applications,
  and screenshot workflows provide behavioral evidence without encoding one
  preferred aesthetic.
- Provider requests can leak proprietary mock-ups. Documentation and tool
  output must make the external upload boundary and separate cost visible
  before use.

## Authority

The parent owns product scope, package composition, attributable design
guidance, provider-boundary decisions, vertical slices, and final pitch and plan
synthesis. Approval authorizes bounded local documentation, tests, skills,
prompts, extension code, package and release metadata, and user-facing README
work on `feat/frontend-developer-package`, followed by the repository's required
validation and the approved branch's publication boundary.

The requested execution preference remains **accept-all implementation**. This
is a preference only until the revised complete plan is approved. Even after
plan approval, implementation must pause for setup, test, check, commit, or
publication failure; material review findings; material forecast variance;
credential, billing, or privacy decisions; changed scope, delivery boundaries,
dependencies, or authority.

Approval does not authorize merge, release, deployment, npm publication,
credential creation or billing changes, destructive cleanup, worktree removal,
or unrelated remote changes.

## Observable acceptance criteria

- **AC-001 — Independent package:** `@mopeyjellyfish/pi-frontend-developer` is
  independently installable and contains only the resources and runtime needed
  for its public frontend behavior, with complete package and release metadata.
- **AC-002 — Coherent entry:** One frontend-development entry composes design,
  mock-up interpretation, React implementation, and visual validation without
  introducing a second general engineering delivery loop.
- **AC-003 — Deliberate design:** Frontend guidance requires a context-specific
  visual thesis and coherent typography, color, spacing, composition, motion,
  density, and interaction choices; it rejects repeated generic defaults
  without forcing one house style.
- **AC-004 — Durable design context:** Existing `DESIGN.md` is read before UI
  work and treated as canonical beneath repository truth. Its absence does not
  block work, and creation or material rewrite requires approval.
- **AC-005 — Mock-up evidence:** Supplied images are inspected for hierarchy,
  layout, assets, tokens, states, responsive hypotheses, and ambiguity. Native
  accessible UI remains native, and generated pixels never become invented
  product behavior.
- **AC-006 — React specialist:** React guidance preserves the target stack and
  produces maintainable components with required interactive, loading, empty,
  error, focus, disabled, and responsive states at repository-approved seams.
- **AC-007 — Accessible responsive behavior:** The workflow makes keyboard,
  semantics, contrast, reduced motion, content hierarchy, and named mobile and
  desktop behavior part of implementation and proof, not optional polish.
- **AC-008 — Visual proof:** The workflow captures or consumes screenshots at
  named viewports, exercises key states, reports concrete mismatches against
  accepted evidence, and never claims visual acceptance when browser proof was
  unavailable.
- **AC-009 — Optional generation:** With compatible separately billed OpenAI API
  credentials, the tool generates or edits a GPT Image 2 artifact at an
  explicit safe path and returns it for inspection. Without compatible
  credentials, it performs no request and gives a bounded actionable error.
- **AC-010 — Safe provider boundary:** The image tool resolves authentication
  through Pi, rejects ChatGPT/Codex subscription OAuth as image API authority,
  preserves provider headers, validates external inputs and outputs, propagates
  cancellation, bounds errors and updates, and never persists or prints
  credentials.
- **AC-011 — Credential-free utility:** Design, `DESIGN.md`, supplied-mock-up,
  React, and visual-validation skills load and remain useful without OpenAI API
  access.
- **AC-012 — Original and attributable:** Package guidance does not copy
  restrictively or unclearly licensed skill text. Any adapted permissive source
  is pinned and covered by the required license notice.
- **AC-013 — User guidance:** The README explains the complete workflow,
  optional companion capabilities, `DESIGN.md` precedence, mock-up limitations,
  visual verification, image-upload privacy, API billing, configuration, and
  failure recovery.
- **AC-014 — Verified delivery:** Focused runtime/provider transport tests,
  cancellation and failure tests, source and packed smoke, package validation,
  Markdown lint, security checks for the provider addition, the full repository
  check, final diff inspection, and fixed-point review pass on the implementation
  worktree.
- **AC-015 — App-interface scope and route:** The package discovers a standalone
  `interface-design` skill for dashboards, admin panels, tools, settings, data
  interfaces, and interactive product workflows. `frontend-design` routes
  non-trivial app-interface work to it, routes marketing work to
  `marketing-site-design` only when available, and assumes neither optional
  companion is installed outside this package.
- **AC-016 — Impact routing:** Small mechanical visual changes take the shortest
  safe path. New apps, major redesigns, and unclear app-interface directions
  start from the complete `interface-design` method before implementation.
- **AC-017 — Human design loop:** Material design work identifies the person,
  task, feel, domain, signature, and rejected defaults; uses generated image
  references only when useful and authorized; requests feedback after coherent
  milestones; and closes a decision ledger before declaring the design done.
- **AC-018 — Live implementation loop:** The framework-neutral design method
  preserves the target stack, uses its local hot-reload command when available,
  hands implementation to an applicable specialist, invokes `react-interface`
  only for React, composes `visual-validation`, cleans up owned resources, and
  reports unavailable proof honestly.
- **AC-019 — App craft:** Implemented guidance covers focal hierarchy,
  typography, density, spatial rhythm, semantic tokens, one depth strategy,
  accessible existing controls, complete states, restrained motion, useful UI
  writing, and swap/squint/signature/token self-checks without forcing one
  visual style.
- **AC-020 — Deeply integrated licensed method:** The pinned MIT
  `interface-design` skill is copied into the package, remains independently
  discoverable, and retains its complete substantive app-craft discipline. Its
  framework-neutral workflow is deeply modified to use this package's
  `DESIGN.md`, image, feedback, hot-reload, implementation-handoff, and
  visual-validation capabilities rather than mentioning them only in router or
  wrapper guidance. The packed co-located license retains its complete copyright
  and permission notice, while the package README identifies the modified
  derivative and pinned source; the skill contains no attribution prose.
