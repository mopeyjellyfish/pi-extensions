---
status: accepted
---

# Shape: Live design board feedback

## Problem and evidence

The current `/design` workflow can describe a completed material group and ask the
human to choose a direction without first giving them an accessible visual result.
The observed prompt—asking which visually checked direction to finalize while the
human had no board, image, or working-site URL—makes informed feedback impossible.

The method also treats rendering as conditional inline evidence, keeps generated
images optional, routes milestone feedback through Pi questions, and requires owned
servers to be cleaned up without a useful end-of-task choice. This does not provide
the requested collaborative loop: inspect comparable visual directions, choose one,
explain why, inspect the live implementation, and decide whether its local review
resources stay open.

## Proposed solution

Add one local design-review capability to
`@mopeyjellyfish/pi-frontend-developer` and make it part of the material
`/design` workflow.

For a material UI-design request, the workflow will:

1. Ask one compact batch of at most four decision-changing questions covering the
   person and task, desired feel, content or product constraints, and reference
   preferences. It skips facts already established by repository evidence or the
   request and does not turn a bounded mechanical edit into a design interview.
2. Produce two to eight coherent visual directions. Each direction has inspectable
   image evidence. After explicit provider privacy and billing consent, the workflow
   may use `image_generation`; without consent, credentials, or a useful provider
   pass, it uses browser captures or rendered specimens instead of presenting a
   prose-only choice.
3. Create or update a local-only review board that shows the comparable directions,
   their images, concise labels, and the recommended direction. Verify that the
   board URL is reachable before asking for feedback. Never ask the human to choose
   a visual direction until the response contains the working board URL and says
   what is available there.
4. Let the human inspect full-width directions and full-size evidence on the board,
   then collect the selected direction and notes in the CLI by default. Enable
   board-native selection and notes only when that explicit feedback mode is useful.
   Record accepted feedback in the design decision ledger before continuing.
5. When implementation exists, keep a separate target-owned live-site URL and link
   it from the board. The board compares and records design evidence; the site
   remains the native accessible product implementation.
6. At each coherent material milestone, update the same board and request feedback
   only after the updated visual evidence is reachable. Avoid repeated approval
   prompts for isolated fragments.
7. At handoff, ask what to do with each owned board and live-site resource: open it,
   keep it serving for the active session, or close it. Localhost is the default;
   network exposure needs separate explicit approval. Session shutdown still cleans
   up package-owned resources idempotently.

The package will expose a bounded board tool rather than requiring every target
repository to contain review scaffolding. The tool will create/update a temporary
session-scoped board, return its URL, read submitted choices and notes, report
status, and close owned board resources. It will not modify the target product,
flatten interactive UI into images, or make board feedback count as implementation
behavior.

The pitch and plan have no independent review or merge value. They remain on the
feature branch and publish with the stable implementation delivery unit.

## Boundaries and no-gos

- Apply the board and image-evidence loop to material design direction, new app
  surfaces, and major redesigns. Keep one-step style, spacing, and placement fixes
  direct.
- Do not ask a visual-choice question before the human has a verified board URL with
  actual visual evidence.
- Do not require a separately billed provider request. Provider generation still
  requires explicit privacy and cost consent; browser captures or rendered specimens
  are the safe fallback.
- Do not expose the board beyond localhost, upload board feedback, or create a hosted
  design service without separate accepted scope and authority.
- Do not add temporary board files to the target repository or assume this monorepo's
  tools, commands, packages, or paths exist in a target repository.
- Do not replace the working app with the board. The target repository owns its live
  implementation server and hot-reload command.
- Do not infer approval from a board visit, an unsubmitted note, silence, cancellation,
  or a server left running.
- Do not promise that a board or site survives Pi process shutdown. “Keep serving”
  applies to the active session; shutdown cleanup remains mandatory.
- Do not expand this change into remote collaboration, authentication, multi-user
  synchronization, Figma integration, persistent hosted projects, or a general
  website builder.

## Decision-changing research and risks

- The existing `interface-design` method already requires feedback after material
  groups, but only conditionally renders inline specimens and does not require a
  reachable review URL. The fix belongs in that method and its `/design` routing,
  with a package capability that works independently of target repositories.
- Board-native feedback requires a small local HTTP boundary. Inputs, image paths,
  rendered text, feedback, request sizes, ports, and lifecycle cleanup need explicit
  validation and deterministic tests.
- A localhost URL may be inaccessible in remote or headless environments. The tool
  must report an unmet review surface rather than claiming that the human saw it;
  saved image artifacts remain available as a fallback, but no visual direction is
  silently accepted.
- Opening a URL depends on an available safe host capability. When it is unavailable,
  the workflow must present the URL clearly instead of spawning an undocumented or
  platform-specific workaround.
- Board images and feedback are untrusted local input. The implementation must avoid
  script injection, path escape, accidental file disclosure, and feedback ambiguity.

## Authority

The parent owns product scope, board/tool boundaries, lifecycle behavior, vertical
slices, and final pitch and plan synthesis. The selected execution mode is
**checkpointed implementation**.

Approval authorizes bounded local pitch, plan, tests, extension code, skills, prompt,
and README changes on `feat/design-board-feedback`, followed by focused and required
repository checks and the approved branch's publication boundary.

Approval does not authorize merge, release, deployment, npm publication, external
network exposure, provider billing or credential changes, destructive cleanup,
worktree removal, or unrelated remote changes.

## Observable acceptance criteria

- **AC-001 — Useful discovery:** Material `/design` work asks at most four compact,
  decision-changing questions covering person/task, feel, constraints/content, and
  references, while known facts and bounded mechanical edits do not trigger needless
  questioning.
- **AC-002 — Visual evidence before choice:** Every material direction checkpoint has
  inspectable image evidence for each direction, using an authorized provider pass or
  a browser/rendered fallback. No visual-choice question is asked first.
- **AC-003 — Reachable board:** Before requesting direction feedback, the agent verifies
  a localhost board URL and gives it to the human with a concise description of what
  can be inspected there.
- **AC-004 — Comparable directions:** The board presents two to eight coherent
  direction choices, images, concise labels, and a visible recommendation without
  replacing the native implementation.
- **AC-005 — Explicit feedback:** The default board is a visual inspection surface
  and the agent collects selection and notes in the CLI. An explicit board-feedback
  mode can instead submit the same bounded feedback from the board into the design
  decision ledger.
- **AC-006 — Separate live site:** When implementation exists, the board links to a
  separate target-owned live-site URL. The workflow verifies and reports both URLs
  before asking for implementation feedback.
- **AC-007 — Milestone updates:** Coherent material groups update the existing board and
  request feedback only after new visual evidence is reachable; isolated fragments and
  mechanical edits do not create repeated ceremonies.
- **AC-008 — End-of-task control:** Handoff asks whether to open, keep serving, or close
  each board and live-site resource, reports the resulting state, and cleans up
  package-owned resources on session shutdown.
- **AC-009 — Safe local boundary:** Board service and feedback stay on localhost by
  default; paths, content, feedback, request size, and lifecycle are bounded; no
  temporary board resource is committed to the target repository.
- **AC-010 — Honest fallback:** Remote, headless, unavailable-browser, unavailable-image,
  or unavailable-open-URL conditions are named as unmet proof or bounded fallbacks;
  the workflow never claims the human saw or approved inaccessible evidence.
- **AC-011 — User guidance:** The package README explains the board/site distinction,
  image policy and provider consent, feedback loop, local-only access, lifecycle
  choices, and failure recovery.
- **AC-012 — Verified delivery:** Focused tests cover board registration, rendering,
  image/path and feedback validation, local binding, updates, status, cleanup,
  cancellation or shutdown behavior, and skill/prompt contracts; source smoke and
  `npm run check` pass on the final worktree, followed by final diff inspection.
