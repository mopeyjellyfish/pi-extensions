---
status: accepted
---

# Plan: Live design board feedback

## Execution mode

Use **checkpointed implementation**. Whole-plan approval authorizes only the
named plan on `feat/design-board-feedback`; it never authorizes merge, release,
deployment, destructive cleanup, external network exposure, provider billing, or
unrelated work.

## Delivery topology

| Delivery unit | Branch                       | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                         |
| ------------- | ---------------------------- | ----------------- | --------------- | ------------ | ----------------------------------------------------------- |
| 1             | `feat/design-board-feedback` | `main`            | `001`, `002`    | none         | serial parent/Worker; current isolated worktree; one writer |

One delivery unit, branch, and pull request is sufficient. The local board runtime
and the `/design` workflow contract are useful only together and share one package,
one validation boundary, and one rollback boundary. The accepted pitch and this plan
have no independent merge value; they publish with the stable implementation unit.
Atomic commits remain coherent changes within that unit.

No parallel writer is justified. Slice `002` depends on the tested tool contract from
slice `001`, and both slices touch the package entrypoint and package-level tests.

## Critical path, dependencies, and lanes

Critical path:

1. Prove the missing `design_board` registration and safe local board behavior.
2. Implement the session-scoped board runtime and public tool contract.
3. Prove the existing `/design` method can still ask for visual feedback without a
   reachable board, images, board-native feedback, or lifecycle choice.
4. Tighten the prompt/skill/README contract around the working board capability.
5. Run browser evidence, lifecycle reload acceptance, package checks, source smoke,
   packing inspection, and the repository gate.

Forecast: one active serial lane, one delivery unit, one pull request, two package
commits after this plan's accepted workflow-stage commit, no integration branch,
and no cascade cost. The expensive gates are manual deterministic Pi reload
acceptance, `npm run smoke:source`, and `npm run check`.

Invalidation map:

- Changes to board schema, HTTP handling, state, HTML, or lifecycle invalidate the
  focused board tests and browser evidence.
- Changes to `src/index.ts` invalidate tool-registration tests and source smoke.
- Changes to `/design`, `frontend-design`, `interface-design`, `image-generation`, or
  README wording invalidate the focused resource-contract tests and Markdown checks.
- Changes after manual reload acceptance invalidate the affected live behavior proof.
- Any final package edit invalidates `npm --workspace @mopeyjellyfish/pi-frontend-developer test`,
  `npm run smoke:source`, packing inspection, and `npm run check`.

Pause and report variance if the board requires a hosted service, a new runtime
package, target-repository scaffolding, public network binding, a browser bundle, or
more than one package/delivery unit.

## [x] 001 — Local board presents directions and returns explicit feedback

### Outcome and requirement trace

A material design workflow can call one `design_board` tool to present or update two
to four image-backed directions on a verified localhost URL, link a separate live
site, receive a selected direction and notes, inspect current status, request a safe
open attempt, and close the board. Board state follows the active session branch and
owned resources close idempotently on shutdown.

Traces to AC-003, AC-004, AC-005, AC-006, AC-008, AC-009, AC-010, and the local board
portion of AC-012.

### Seam and files

Public seam:

- Register `design_board` beside `image_generation` in
  `packages/frontend-developer/src/index.ts`.
- Use a strict provider-neutral action schema for `present`, `status`, `open`, and
  `close`. `present` carries a bounded board title, two to four direction records,
  one recommended direction id, optional separate live-site URL, and validated image
  paths. `present` and `status` make a bounded self-request and return explicit
  reachability evidence with the URL, current version, resource state, and latest
  submitted feedback.
- Serve the board from `127.0.0.1` on an ephemeral port with an unguessable board path
  and same-origin submission token. Validate loopback `Host` and `Origin` headers to
  resist DNS rebinding and cross-origin form posts. Render escaped semantic HTML with
  native radio, link, textarea, and submit controls; set a restrictive CSP and bound
  request bodies. Normalize a leading `@`, allow only validated PNG/JPEG/WebP
  artifacts under `ctx.cwd` or the board's package-owned session temp directory, and
  never expose arbitrary files. Board files and fallback captures in that temp root
  are runtime artifacts, not target-repository content; provider images may remain at
  their separately approved project evidence paths.
- Keep board content/state in memory and session entries/tool-result details, not in
  the target repository. On feedback submission, persist a bounded selection and
  notes, deduplicate replay of the same board-version submission, and send a clearly
  delimited Pi custom message with `deliverAs: "followUp"` and `triggerTurn: true` so
  idle agents wake without interrupting an active turn. Reconstruct branch state on
  startup/reload/resume/fork and restart only a board marked open. Reuse its path and
  preferred port when available; if the URL changes, persist and send the replacement
  URL before any further visual-feedback request.
- `open` uses only an available, explicit, platform-safe URL-opening path and returns
  an honest unavailable result otherwise. It never binds externally.
- `close` and `session_shutdown` use the same idempotent resource cleanup.

Likely files:

- `packages/frontend-developer/src/design-board.ts` (new)
- `packages/frontend-developer/src/index.ts`
- `packages/frontend-developer/test/design-board.test.ts` (new)
- `packages/frontend-developer/test/index.test.ts`

No new production dependency is expected; use Node HTTP, crypto, filesystem, and URL
APIs plus Pi's existing extension API.

### Dependencies

None. Preserve the existing `image_generation` contract and package independence.

### Execution lane and ownership

Serial. One implementation writer owns the current isolated worktree. Behavioral code
uses the accepted `design_board` tool as the public seam and follows
`test-driven-development`.

### Red proof

Add the smallest focused failing tests first:

1. Extension registration expects strict `design_board` actions and fails because the
   tool is absent.
2. `present` with project-owned and package-temp image fixtures expects a reachable
   `127.0.0.1` URL, explicit successful self-check evidence, and HTML containing both
   escaped direction choices, recommendation, images, and separate site link; it
   fails before implementation.
3. A native form submission expects bounded direction/notes feedback to appear in
   `status` and one follow-up Pi feedback message; replaying the same board-version
   submission is deduplicated.
4. Invalid direction counts/ids, path escape outside allowed roots, unsupported or
   malformed images, oversized feedback, invalid loopback Host/Origin, prohibited
   site URLs, stale submissions, and repeated close/shutdown cases fail safely.

Capture and report the intended test failure before production implementation.

### Green proof and checks

- `npm test -- --run packages/frontend-developer/test/design-board.test.ts`
- `npm test -- --run packages/frontend-developer/test/index.test.ts`
- `npm --workspace @mopeyjellyfish/pi-frontend-developer typecheck`
- When browser capability is available in the active development harness, use it to
  open the returned board URL and verify two to four directions, image loading,
  recommendation, keyboard-operable selection, notes submission, success state,
  separate site link, wide and narrow layouts, and no console/runtime errors. Close
  the owned browser after capture. If browser capability is absent, record the unmet
  visual proof; shipped package guidance must not assume this repository's browser
  tool exists in target repositories.
- Lifecycle proof covers `session_shutdown` cleanup and branch-aware reconstruction
  across startup/reload/resume/fork without duplicate listeners or stale ports.

Any edit to the public schema, board renderer, HTTP boundary, state restoration, or
cleanup invalidates this complete focused proof.

### Atomic commit and pull request

Commit the board runtime, registration, focused tests, and inseparable lifecycle
behavior as:

`feat(pi-frontend-developer): add local design review board`

This is the first commit in delivery unit 1. The eventual pull request targets
`main`; it is not a stack position.

### Done when

- The strict tool is registered without changing `image_generation` behavior.
- A reachable localhost board presents safe image-backed directions and a separate
  site link.
- Submitted choices/notes are bounded, persisted to the active session branch, and
  surfaced to the agent.
- Open/status/close behavior is honest in TUI, RPC, JSON, and print modes.
- Reload/resume/fork reconstruction preserves or explicitly replaces the reported URL,
  and idempotent shutdown cleanup passes focused tests.
- Available browser evidence confirms accessible usable wide and narrow board states,
  or the unavailable proof is reported without claiming visual acceptance.

## [x] 002 — `/design` requires visible evidence before feedback and closes the loop

### Outcome and requirement trace

For material UI design, `/design` conducts compact decision-changing discovery,
creates image-backed comparable directions, gives the human a verified board URL
before asking for a choice, consumes board-native feedback, updates the same board at
coherent milestones, reports a separate live-site URL when implementation exists,
and ends by asking whether to open, keep, or close each resource. Bounded mechanical
visual edits remain direct.

Traces to AC-001, AC-002, AC-003, AC-006, AC-007, AC-008, AC-010, AC-011, and the
workflow-contract portion of AC-012.

### Seam and files

Public workflow seam:

- Strengthen `prompts/design.md` so material design routes explicitly require the
  review-board loop while implementation requests still route through
  `frontend-development`.
- Update `skills/frontend-design/SKILL.md` to distinguish mechanical edits from
  material board-based design and load `interface-design` for the latter.
- Revise the integrated `skills/interface-design/SKILL.md` method:
  - ask one compact batch of at most four questions only for unresolved person/task,
    feel, content/constraints, and references;
  - create two to four coherent directions with image evidence;
  - obtain provider consent before `image_generation`, otherwise use rendered
    specimens or browser captures;
  - call `design_board`, verify the URL, and present it before any visual-choice ask;
  - accept board-native selection/notes as explicit feedback, record them in the
    decision ledger, and update the same board for coherent material groups;
  - verify and report the separate target-owned site URL when implementation exists;
  - never claim inaccessible evidence was seen; and
  - finish with an explicit per-resource open/keep-serving/close question and report
    the resulting state.
- Align `skills/image-generation/SKILL.md` and
  `skills/visual-validation/SKILL.md` without duplicating the integrated method.
- Update the package README explicitly with the board/site distinction, required
  visual-evidence and provider-consent policy, localhost-only access, board-native
  feedback, open/keep/close lifecycle choices, and unavailable-surface recovery.
- Add deterministic package resource-contract tests that guard ordering: visual
  evidence and verified URL before feedback, compact discovery, board feedback,
  separate site, lifecycle question, and mechanical-edit bypass.

Likely files:

- `packages/frontend-developer/prompts/design.md`
- `packages/frontend-developer/skills/frontend-design/SKILL.md`
- `packages/frontend-developer/skills/interface-design/SKILL.md`
- `packages/frontend-developer/skills/image-generation/SKILL.md`
- `packages/frontend-developer/skills/visual-validation/SKILL.md`
- `packages/frontend-developer/README.md`
- `packages/frontend-developer/test/resources.test.ts` (new)

### Dependencies

Slice `001` supplies the real `design_board` capability and lifecycle contract. Do not
write guidance that assumes any other package, board server, browser, question tool,
or image credential exists. Use capability-based fallbacks and name unmet proof.

### Execution lane and ownership

Serial, after slice `001`, in the same worktree with the same sole writer. These are
workflow resources and tests, not a second implementation lane.

### Red proof

Add one focused resource-contract test that reads the shipped prompt, skills, and
README and fails against the current prose because it does not require:

- compact four-topic discovery;
- two to four image-backed directions;
- `design_board` and a verified URL before visual feedback;
- board-native selected direction and notes;
- a separate verified live-site URL;
- same-board milestone updates;
- the final open/keep/close resource choice; and
- README guidance for the board/site distinction, provider consent and fallback,
  local-only access, board-native feedback, lifecycle choices, and unavailable
  review-surface recovery.

The test also asserts that provider consent remains required and mechanical edits
still bypass the ceremony.

### Green proof and checks

- `npm test -- --run packages/frontend-developer/test/resources.test.ts`
- `npm --workspace @mopeyjellyfish/pi-frontend-developer test`
- `npm --workspace @mopeyjellyfish/pi-frontend-developer typecheck`
- `npm exec -- prettier --check packages/frontend-developer docs/features/design-board-feedback`
- `npm exec -- markdownlint-cli2 packages/frontend-developer docs/features/design-board-feedback`
- Start deterministic Pi from this worktree with the package explicitly loaded and
  ambient resources disabled. Confirm `design_board`, `image_generation`, and the
  expected skills/prompts appear without conflict diagnostics.
- Run focused automated tests, enter `/reload` while Pi is idle, exercise
  `design_board` present/update/feedback/status/close and the material `/design`
  routing, and confirm the revised behavior without duplicate registrations or stale
  state.
- Run `npm run smoke:source`.
- Inspect `npm pack --dry-run --json --workspace @mopeyjellyfish/pi-frontend-developer`
  for the new source, tests exclusion, prompts, skills, README, license, and absence
  of board/session artifacts.
- Run `npm run check` after the final edit.
- Inspect `git diff`, `git status --short --untracked-files=all`, and packed contents
  for package boundaries, release attribution, credentials, local paths, sessions,
  generated images, open ports/processes, and unrelated files.

Any edit to workflow resources or tool behavior invalidates the corresponding focused
proof. Any package edit after source smoke, packing inspection, or `npm run check`
invalidates those completion gates.

### Atomic commit and pull request

Commit the workflow tests, prompt/skill contract, and README together as:

`fix(pi-frontend-developer): show design evidence before feedback`

This is the second commit in delivery unit 1. It ships in the same pull request to
`main` as slice `001` and the accepted feature documents.

### Done when

- Material `/design` checkpoints cannot ask for a visual choice before a verified
  image-backed board URL is available.
- Discovery is more probing but remains one compact, non-redundant batch.
- Board-native choice/notes and separate live-site feedback are explicit parts of the
  decision ledger.
- Milestones reuse the board, and handoff asks open/keep/close for every owned
  resource.
- Mechanical edits, unavailable provider credentials, unavailable browser/opening,
  and non-interactive modes retain useful honest behavior.
- The README documents the board/site distinction, provider consent and image
  fallback, local-only access, board-native feedback, lifecycle choices, and failure
  recovery.
- Focused package tests, manual reload acceptance, source smoke, packing inspection,
  `npm run check`, and final hygiene inspection pass on the frozen worktree.
