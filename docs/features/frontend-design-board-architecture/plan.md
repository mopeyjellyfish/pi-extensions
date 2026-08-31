---
status: accepted
---

# Plan: Frontend design board architecture

Complete this delivery plan before implementation. It covers every accepted
vertical slice, the critical path, dependencies, delivery units, and independent
lanes.

## Review evidence

- **Applicability:** not applicable. This plan does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Independent plan review

- **Fixed document:** revised draft plan after the accepted image-backed
  comparison-canvas choice.
- **Status:** REVISE with one blocking constraint; resolved before presentation.
- **Resolution:** The board must remain script-free. Selection reflection and
  sticky behavior stay CSS-only under unchanged CSP and security headers. The
  reviewer stated that direct-parent confirmation is sufficient and no second
  review is required for this bounded correction.
- **Prior review:** The earlier narrow-layout plan was approved with six document
  corrections, all resolved. The material interface-direction change invalidated
  that review.
- **Invalidation:** Any further scope, architecture, delivery-topology, public
  contract, material visual-direction, client-script, or CSP change requires
  another fixed-document review.

## Execution mode

**Accept-all implementation** is selected. Only explicit whole-plan approval
confirms accept-all authority for this named plan. That authority permits the
approved branch's bounded plan commit, implementation commits, verification,
formal review and repairs, and later pull-request publication.

Accept-all authority never authorizes merge, release, deployment, npm
publication, destructive cleanup, worktree removal, external network exposure,
provider billing, or unrelated work. Any material forecast variance returns
control to the human. Fresh approval is required when delivery boundaries or
authority change.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                                    | Pull request base | Dependencies                 | Checks                                                                                                 | Ownership                                              | Integration point                          | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ----------------------------------------- | ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------ | ---------- | ------------ |
| 1             | standalone | standalone     | `feat/frontend-design-board-architecture` | `main`            | accepted pitch and this plan | focused frontend tests, package test/typecheck, browser proof, smoke, pack inspection, `npm run check` | current isolated worktree; one serial Writer at a time | `design_board` tool and frontend skill set | 1          | low          |

One delivery unit, branch, and pull request is intentional. The renderer split
and comparison-canvas implementation overlap in `design-board.ts` and its public
tests. The routing assertions must precede the skill-description changes.
Separate pull requests would repeat required checks and make the intermediate
frontend package less coherent without independent merge value.

The accepted pitch and this plan share the implementation publication boundary.
Three atomic implementation commits remain coherent change boundaries inside the
unit. No stack, sibling pull request, integration branch, or parallel writer is
planned.

## Critical path, dependencies, and lanes

Critical path:

1. Record the current focused board behavior.
2. Isolate document rendering behind a render-only module without changing
   behavior.
3. Add intended failing public-board proofs for the heading-created empty track
   and width-reducing board-feedback panel.
4. Implement the accepted evidence-first comparison canvas and sticky decision
   strip.
5. Add failing routing-invariant scenarios.
6. Narrow skill descriptions and remove circular delegation.
7. Run focused and affected package checks.
8. Run browser evidence and resolve the visual mismatch ledger.
9. Run deterministic Pi reload acceptance, source smoke, pack inspection, and
   `npm run check`.
10. Freeze the diff for concurrent QA and formal review when selected by final
    risk, apply one bounded repair packet, and rerun only invalidated evidence.
11. Publish one standalone pull request through `open-pr` after all accepted
    implementation work and checks are complete.

Forecast:

- active implementation lanes: 1;
- delivery units and pull requests: 1 and 1;
- expected new commits: 1 plan commit and 3 implementation commits;
- implementation ownership: one retained Writer in the current routed worktree;
- read-only review: allowed only against one frozen diff;
- integration points: the renderer call from the local HTTP response, the
  CLI/board evidence canvas and sticky decision-strip markup, Pi skill discovery
  descriptions, and packaged source smoke;
- expensive gates: browser evidence, deterministic Pi reload acceptance,
  `npm run smoke:source`, package packing inspection, and `npm run check`;
- likely cascade cost: low because all implementation is serial and no package
  metadata or dependency change is planned.

Evidence invalidation map:

- changing renderer input, escaping, image URL construction, notes limits, token
  or path use, CSS, or semantic markup invalidates slice 001 focused board tests;
- changing the new renderer module after focused coverage invalidates
  `npm run test:coverage`; every new source file must independently meet the
  repository's per-file thresholds;
- changing comparison-canvas, card, decision-strip, or responsive markup or CSS
  invalidates slice 002 focused tests and the complete browser evidence matrix;
- changing skill frontmatter, routing references, or scenario expectations
  invalidates slice 003 focused resource tests;
- changing `src/index.ts`, the tool schema, lifecycle, HTTP routes, feedback,
  persistence, or cleanup is unplanned variance and invalidates source smoke,
  reload acceptance, and the complete board test suite;
- changing package files after pack inspection invalidates pack inspection;
- changing TypeScript after typecheck invalidates package typecheck;
- changing skills or prompts after deterministic reload acceptance invalidates
  that acceptance;
- any final edit invalidates formatting, linting, and diff hygiene for the
  touched path;
- any post-review edit invalidates review for the touched surface and requires a
  bounded recheck after affected executable evidence is green.

Material variance includes a public `design_board` schema or result change, a
new dependency, client script, a CSP or security-header change, a template file
loader, a framework, another server, package metadata or lockfile change, a
second delivery unit, a visual direction other than the accepted comparison
canvas, unapproved feedback behavior, a shared production routing matrix, or
cross-package protocol changes. Stop and report that variance before continuing.

## [ ] 001 — Board rendering no longer carries lifecycle state

### Outcome and requirement trace

Board document rendering uses one pure in-process module with an immutable,
render-only input. `DesignBoardService` retains image validation, HTTP handling,
feedback security, persistence, lifecycle, reachability, cleanup, and URL
opening. Public board behavior remains unchanged.

This slice satisfies AC-001 through AC-003 and supports AC-011 and AC-012.

### Seam and files

Public seam: the existing `design_board` tool and served localhost board URL.
The renderer remains an internal module and is not exported for callers or
private-helper tests.

Likely files:

- new `packages/frontend-developer/src/design-board-renderer.ts`;
- `packages/frontend-developer/src/design-board.ts`;
- `packages/frontend-developer/test/design-board.test.ts`.

The render-only input contains only document state. It can include title,
version, feedback mode, direction display records, recommended direction,
optional feedback, optional live-site URL, board path, and generated form token.
It must not include the live `Server`, mutable `Board`, `ExtensionAPI`,
`ExtensionContext`, filesystem paths not required for image URLs, lifecycle
state, or service methods.

Keep these cross-seam contracts explicit:

- `MAX_NOTES_LENGTH` remains one shared policy value used by markup and feedback
  validation;
- the renderer's encoded direction image URL agrees with `serveGet` route
  parsing;
- board path and same-origin token formats remain generated and constrained
  before interpolation;
- all human and repository-derived text remains HTML-escaped;
- CSP and security headers remain owned by the HTTP response, not by the
  renderer.

### Dependencies

Accepted pitch and plan. Existing public board tests. No new dependency, tool
schema, state schema, package metadata, or runtime asset.

### Execution lane and ownership

`serial`; current task worktree; one retained Writer owns renderer, service, and
focused test changes. Load and follow `codebase-design` and
`test-driven-development`. This slice is a pure refactor, so use existing
public-seam tests before and after instead of manufacturing a behavioral red.

### Red proof

Before the refactor, run:

`npm test -- --run packages/frontend-developer/test/design-board.test.ts`

Record the passing baseline and current test count. Confirm the test reaches the
registered tool and served HTTP board. Do not add a test for a private renderer
or derive expected HTML through the renderer itself.

The structural before-state is also explicit: `html(board)` accepts the mutable
`Board`, and `Board` contains a live `Server`. The minimum refactor is complete
only when that implementation dependency is absent from the renderer interface.

### Green proof and checks

Move rendering, escaping, mode-specific semantic markup, direction cards,
full-size viewers, and CSS into the new module. Prepare one immutable view model
inside the service. Keep the existing tool and HTTP tests unchanged unless a
public assertion must name an accepted invariant more clearly.

Run:

- `npm test -- --run packages/frontend-developer/test/design-board.test.ts`;
- `npm run typecheck --workspace @mopeyjellyfish/pi-frontend-developer`;
- `npm run test:coverage`;
- `npm exec -- prettier --check packages/frontend-developer/src packages/frontend-developer/test/design-board.test.ts`.

A slice 002 edit to renderer markup or CSS invalidates the rendering assertions
and requires the focused board test again.

### Atomic commit and pull request

Atomic commit: `refactor(pi-frontend-developer): isolate design board rendering`
in delivery unit 1. Pull-request base remains `main`; no stack position.

### Done when

- the renderer accepts an immutable render-only input and cannot access the live
  server or mutable service state;
- the service retains all non-rendering responsibilities;
- shared limits, URL shape, token/path constraints, escaping, and CSP ownership
  remain explicit;
- the existing public board test and package typecheck pass;
- every new source file meets the repository's per-file coverage thresholds;
- no public tool, state, feedback, lifecycle, or package contract changes.

## [ ] 002 — Evidence-first comparison canvas

### Outcome and requirement trace

CLI and board-feedback modes use one full-width, equal-scale evidence canvas for
two to eight directions. The heading cannot create an unused track. Board mode
uses one sticky bottom decision strip instead of a permanent right panel. The
strip preserves selected-direction context, notes, and submit access without
obscuring evidence. Full-size viewers, image containment, themes, semantic
controls, and accessible narrow layouts remain intact.

This slice satisfies AC-004 through AC-006 and supports AC-002, AC-011, and
AC-012.

### Seam and files

Public seam: HTML served by `design_board` in CLI and board feedback modes.

Likely files:

- `packages/frontend-developer/src/design-board-renderer.ts`;
- `packages/frontend-developer/test/design-board.test.ts`.

Accepted frontend methods and evidence:

- `interface-design` supplies the accepted material direction;
- `frontend-development` supplies the implementation discipline;
- `interface-craft` `layout` supplies the responsive structure checks;
- `visual-validation` supplies the evidence matrix and mismatch ledger;
- the user selected **B — Evidence-first comparison canvas** from three
  image-backed specimens;
- the temporary specimens were removed after selection and are not runtime
  assets;
- no React specialist, image generation, font or icon dependency, or
  `DESIGN.md` gate applies.

Representative states are CLI and board feedback modes with two and eight
directions, no selection and selected direction, recommendation, long labels
and descriptions, optional live-site link, full-size viewer, saved feedback,
and light/dark schemes. Responsive surfaces are narrow, intermediate, and wide
browser widths. Accessibility paths include DOM and visual order, keyboard
navigation, focus and focus return, zoom/text expansion, reduced motion,
semantic grouping, native controls, and sticky-strip overlap prevention.

### Dependencies

Slice 001. The renderer module and its public board seam must be stable before
layout behavior changes.

### Execution lane and ownership

`serial`; same retained Writer and worktree after slice 001. Renderer and board
test ownership overlaps slice 001, so no parallel writer is safe.

### Red proof

Add the smallest intended failing public-board proofs. Present a default CLI
board and a board-feedback board with two directions, then fetch their served
HTML. Independently prove both current wrong states:

1. the directions heading participates in the repeated article grid; and
2. board feedback uses a permanent two-column form with the decision panel
   taking comparison width.

The failures must be the current public markup structure, not a new private
helper, screenshot literal, or copied CSS layout algorithm. Replace existing raw
substring assertions only when the accepted structure makes them stale; retain
their public behavior, security, feedback, and accessibility intent.

Run:

`npm test -- --run packages/frontend-developer/test/design-board.test.ts`

Capture both intended failures before editing production markup or CSS.

Record the browser before-state separately at 1280 × 720: CLI mode shows two
400 px direction articles and one unused 400 px track in a 1248 px comparison
area. Board mode reserves about 28% of its form width for the permanent decision
panel. Browser proof is acceptance evidence, not the automated red.

### Green proof and checks

Implement the accepted comparison canvas with the minimum native structure.
Keep the section heading outside the repeated direction grid. In board mode,
keep `legend` as the first child of the full-width comparison `fieldset` and put
direction articles in an inner repeated-grid wrapper. Let CLI evidence use the
full board width. Place one sticky decision strip after the comparison in form
and DOM order. The strip contains selected-direction context, the existing notes
field, submit action, and saved-feedback status. Reserve bottom layout space
while the strip is sticky so it cannot cover card content. At narrow widths,
return the strip to normal flow and stack its controls.

Keep the board script-free. Implement selection reflection and sticky behavior
with native markup and CSS under the unchanged response CSP and security
headers. Stop for material variance if client script or a CSP change appears
necessary. Do not add navigation, keyboard shortcuts, new feedback fields,
autosave, filtering, sorting, or a new client framework.

Use the incumbent semantic palette, font stack, 4 px spacing base, card
containment, light/dark mode, and reduced-motion behavior. Refine hierarchy with
quiet orientation chrome, compact labels, low-contrast dividers, and one stronger
decision-strip elevation. The mock-up is direction evidence rather than a pixel
contract.

The package README's generic statement about board-native radio, notes, and
submit controls remains accurate. Change it only if implementation makes that
user-visible description false.

Run the focused board test. Then create the visual-validation matrix before
browser capture. Use the package's actual `design_board` service in a
deterministic Pi process started from this worktree.

Create two to eight synthetic PNG fixtures under the ignored
`.tmp/frontend-design-board-architecture/` directory before live acceptance.
Use those project-contained paths for the board matrix, then remove the complete
fixture directory after browser and reload proof. Do not commit captures or
fixtures.

Verify at minimum:

| Route/state | Viewport                   | Content                                  | Interaction and proof                                                                            |
| ----------- | -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| CLI mode    | 390 × 844                  | two and eight directions, long text      | one-column reflow, full evidence width, reading and keyboard order, zoom, no overflow            |
| CLI mode    | 900 × 800                  | two and eight directions                 | intermediate wrapping, equal-scale evidence, full-size viewer                                    |
| CLI mode    | 1280 × 720                 | two and eight directions                 | no unused track, balanced comparison, viewer open/close and focus return                         |
| Board mode  | 390 × 844                  | two directions, no and active selection  | static in-flow decision strip, fieldset/legend, native controls, no obstruction or overflow      |
| Board mode  | 1280 × 720                 | two and eight directions, saved feedback | full-width evidence, sticky strip, selection context, notes, submit, saved state, no obstruction |
| Both modes  | named wide and narrow rows | light/dark and reduced motion            | hierarchy, focus visibility, image containment, accessible names, console/runtime/network errors |

Return a mismatch ledger with severity, evidence, accepted expectation, likely
shared cause, affected rows, and recheck target. Fix shared layout causes before
local offsets. Run the complete matrix once after the UI freezes. Close the
owned browser and board resources.

Run:

- `npm test -- --run packages/frontend-developer/test/design-board.test.ts`;
- `npm --workspace @mopeyjellyfish/pi-frontend-developer test`;
- `npm run typecheck --workspace @mopeyjellyfish/pi-frontend-developer`.

Any later renderer or CSS edit invalidates the complete browser matrix and
focused board test.

### Atomic commit and pull request

Atomic commit: `feat(pi-frontend-developer): add evidence-first design board` in
delivery unit 1. Pull-request base remains `main`; no stack position.

### Done when

- intended public-seam tests fail before and pass after the comparison-canvas
  change;
- two to eight CLI and board directions use the available comparison width
  without a heading-created empty track or permanent side panel;
- board mode has one clear decision strip that cannot obscure evidence and
  becomes a usable in-flow control group on narrow screens;
- selection reflection and sticky behavior are CSS-only; the board remains
  script-free under unchanged CSP and security headers;
- the selected direction, notes, submit action, saved feedback, live-site link,
  full-size viewer, light/dark modes, and accepted semantic structure remain
  usable;
- the final browser matrix has a resolved mismatch ledger or names a blocking
  unmet proof;
- focused tests, package test, and typecheck pass.

## [ ] 003 — Frontend skill discovery has one first owner

### Outcome and requirement trace

Frontend skill descriptions no longer make broad overlapping first-owner claims,
and the focused design reference no longer routes back into a router that can
select it. Deterministic resource tests detect an overlapping owner or circular
delegation without claiming deterministic model behavior.

This slice satisfies AC-007 through AC-010 and AC-012's routing and package
verification.

### Seam and files

Public seams are Pi skill frontmatter descriptions and shipped routing guidance.

Likely files:

- `packages/frontend-developer/skills/interface-craft/SKILL.md`;
- `packages/frontend-developer/skills/interface-craft/references/design.md`;
- `packages/frontend-developer/skills/frontend-design/SKILL.md`;
- `packages/frontend-developer/skills/interface-design/SKILL.md`;
- `packages/frontend-developer/test/resources.test.ts`;
- `packages/frontend-developer/README.md` only if user-visible ownership becomes
  inaccurate.

Feature-flow and engineering production resources are verification boundaries,
not expected edit targets. Change them only if a focused test proves their
existing conditional ownership language conflicts with the accepted owner model.
That result is plan variance because it can change the approved path set and
atomic commit scope.

Accepted owner scenarios:

| Request class                                                                        | First owner            | Handoff                                                          |
| ------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| focused polish, audit, layout, clarify, adapt, or optimize request                   | `interface-craft`      | selected operation reference; implementation only when requested |
| material app direction, new app surface, major redesign, or unclear visual direction | `frontend-design`      | `interface-design` material method                               |
| material app-interface method after classification                                   | `interface-design`     | accepted direction evidence to implementation                    |
| implementation from accepted evidence                                                | `frontend-development` | optional framework specialist and visual proof                   |
| proof of a stable non-trivial interface                                              | `visual-validation`    | mismatch ledger                                                  |
| DESIGN.md creation or material rewrite                                               | `design-documentation` | separate document approval                                       |

Keep `image-generation` and React specialists conditional. Preserve direct-parent
fallbacks and target-repository neutrality.

### Dependencies

Slices 001 and 002 complete. Existing accepted skill ownership from the pitch.
Pi `docs/skills.md` confirms descriptions are always disclosed and determine
when agents load a skill. No deterministic model-choice harness is assumed.

### Execution lane and ownership

`serial`; same retained Writer and worktree. Load and follow
`test-driven-development`. Resource tests and the four frontend skills share one
routing vocabulary, so one Writer owns all edits.

### Red proof

Add the smallest deterministic scenario table and source-property checks before
editing skill descriptions or references. At minimum, prove these current wrong
states:

1. a representative audit/refinement request has more than one broad first-owner
   description;
2. the `interface-craft` design reference delegates to a router that can select
   `interface-craft` again.

The expected owner comes from the accepted pitch table. Do not derive expected
values by calling a production parser or copy the production routing text into a
second production contract.

Run:

`npm test -- --run packages/frontend-developer/test/resources.test.ts`

Capture the intended failing scenarios. Existing tests currently require the
`interface-craft` frontmatter to remain a first-class natural-language
web-interface router and to name `clarify`, `adapt`, `optimize`, `bolder`,
`quieter`, and `distill`. Revise those assertions only as part of this same
test-first change when narrower wording is needed. Preserve operation
discoverability without restoring broad overlapping ownership. Keep existing
attribution, upstream SHA, forbidden-path, package-neutrality, resource
inventory, and documentation guards. Do not replace effective checks with a
generic word count or raw phrase count.

### Green proof and checks

Narrow each description to its first-owner scope. Remove the circular back-route
from `interface-craft/references/design.md`. Keep detailed operation and material
method instructions in their existing owners. Update the README only when its
public summary becomes inaccurate.

Run:

- `npm test -- --run packages/frontend-developer/test/resources.test.ts`;
- `npm --workspace @mopeyjellyfish/pi-frontend-developer test`;
- `npm run typecheck --workspace @mopeyjellyfish/pi-frontend-developer`;
- `npm test -- --run packages/feature-flow/test/resources.test.ts packages/engineering/test/resources.test.ts` as affected-boundary proof;
- `npm run packages:check`.

A later frontend skill or routing-test edit invalidates this slice. A later
feature-flow or engineering edit expands implementation scope and requires
variance review.

### Atomic commit and pull request

Atomic commit: `fix(pi-frontend-developer): disambiguate frontend skill routing`
in delivery unit 1. Pull-request base remains `main`; no stack position.

### Done when

- each accepted request class has one clear first owner in skill descriptions;
- the design operation no longer routes back into its selecting router;
- focused tests fail for the old overlap and cycle and pass for the accepted
  owner model;
- implementation, proof, documentation, image, React, and fallback ownership
  remains explicit and package-neutral;
- frontend, feature-flow, engineering, package, and type checks pass without a
  new dependency or production source of truth.

## Stable delivery-unit verification and publication

After all slices are green, run formatting on touched files. Then run the
required deterministic live-Pi acceptance from this worktree:

1. Start the pinned Pi with ambient discovery disabled and this package loaded:

   `npm exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e packages/frontend-developer`

2. Confirm `design_board`, `image_generation`, and the expected frontend skills
   appear once without conflict diagnostics.
3. Run the focused board and resource tests before reload.
4. Enter `/reload` while Pi is idle.
5. Exercise an initial `design_board` `present`, a second `present` that updates
   the live board, CLI inspection, explicit board feedback, status, open, and
   close. Confirm restored behavior has no duplicate registration or stale
   state.
6. Confirm revised skill descriptions and design-reference routing are present
   after reload.
7. Close package-owned board and browser resources.

Then run:

- `npm --workspace @mopeyjellyfish/pi-frontend-developer test`;
- `npm run typecheck --workspace @mopeyjellyfish/pi-frontend-developer`;
- `npm test -- --run packages/feature-flow/test/resources.test.ts packages/engineering/test/resources.test.ts`;
- `npm run packages:check`;
- `npm run smoke:source`;
- `npm pack --dry-run --json --workspace @mopeyjellyfish/pi-frontend-developer` and inspect the source, skill, reference, prompt, README, license, notice, and absence of tests, sessions, browser captures, and local paths;
- `npm run check`.

Freeze the final diff after executable gates pass. Because this delivery changes
runtime rendering, lifecycle-adjacent code, the material board interface, public
skill discovery, and browser behavior, run QA and formal code review concurrently
against the same frozen diff. QA owns only the named executable evidence.
Reviewer owns intent, architecture, security, accessibility, and maintainability
without rerunning QA gates. Join findings into one bounded repair packet. Run
only invalidated checks and browser rows after repair, then re-freeze and
re-review touched risk surfaces.

Inspect:

- `git diff --check`;
- `git diff --stat` and the complete diff;
- `git status --short --untracked-files=all`;
- `packages/frontend-developer/package.json` and `package-lock.json` remain
  unchanged;
- package contents for credentials, absolute local paths, generated images,
  sessions, trust state, coverage, browser artifacts, open ports, or unrelated
  files.

After all accepted evidence is current, use `open-pr` to publish one standalone
pull request from `feat/frontend-design-board-architecture` to `main`. Use a
Conventional Commit pull-request title that reflects the package-visible fix.
Do not merge, release, deploy, publish to npm, or remove the worktree.
