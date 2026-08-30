---
status: accepted
---

# Shape: Frontend design board architecture

## Problem and evidence

The frontend design board keeps its complete HTML and CSS template inside
`DesignBoardService`. The same 740-line module also owns image validation, HTTP
security, feedback, session persistence, lifecycle recovery, reachability, and
URL opening. The private renderer accepts the mutable `Board` object, which
includes a live HTTP server. This makes template work share an implementation
surface with security and lifecycle work.

The default CLI board also wastes comparison space for a common two-direction
review. At 1280 × 720, two direction articles each use 400 px while a third
400 px grid track remains empty. The full-span heading prevents `auto-fit` from
collapsing that track. The board therefore leaves about 408 px unused on the
full-width comparison surface.

The new frontend skills add a separate discovery problem. Pi always includes
skill names and descriptions in the model context. `interface-craft` and
`interface-design` both claim broad design, review, audit, and refinement work.
The `interface-craft` design reference also routes back into the frontend design
router, while that router can select `interface-craft`. Current resource tests
prove that required phrases exist, but they do not detect overlapping first
owners or circular delegation.

## Proposed solution

Deliver one coordinated architecture and behavior change on
`feat/frontend-design-board-architecture`.

1. Put board document rendering behind one pure in-process module with a frozen,
   render-only input. Keep image validation, HTTP handling, feedback security,
   persistence, lifecycle, reachability, and URL opening in
   `DesignBoardService`. Keep shared policy explicit at the seam, including the
   notes limit, image URL shape, generated path and token invariants, and CSP.
2. Correct the CLI comparison grid so unused tracks collapse and two to eight
   directions use the available evidence surface. Preserve board-feedback
   controls, full-size viewers, image containment, themes, and narrow layouts.
3. Add deterministic routing invariants over existing skill frontmatter and
   references. Detect overlapping first-owner claims and circular delegation.
   Keep attribution, forbidden-path, package-hygiene, lifecycle, and security
   checks.
4. Narrow the overlapping frontend skill descriptions and remove the back-route
   from the `interface-craft` design reference. Keep the current ownership
   model: `interface-craft` selects focused operations, `frontend-design`
   classifies material direction, `interface-design` supplies the material app
   method, `frontend-development` owns build guidance, and
   `visual-validation` owns proof. Express each owner in its own skill. Do not
   add a shared production routing matrix.

Planning will preserve three dependent vertical slices:

- isolate rendering without changing public board behavior;
- fix and prove the CLI comparison layout through the public board URL; and
- add routing invariants before changing discovery descriptions and delegation.

The pitch and plan have no independent merge value. They will publish with one
stable implementation delivery unit.

### Interface evidence

- **Person and task:** A developer or product owner compares two to eight UI
  directions and chooses what the implementation should carry forward.
- **Surface mode:** A localhost browser board, with CLI feedback by default and
  optional board-native feedback.
- **Design authority:** Preserve the current implemented board and the accepted
  live-board contract. This work does not establish a new visual identity.
- **Desired result:** Keep the restrained inspection surface. Use available
  width for evidence and keep the comparison path clear.
- **Focal workflow:** Read the checkpoint, compare equal direction evidence,
  inspect full size when needed, then return to the CLI or submit explicit board
  feedback.
- **Representative states:** CLI and board feedback modes; two and eight
  directions; recommendation; long labels and descriptions; separate live-site
  link; full-size viewer; saved feedback; light and dark color schemes.
- **Responsive and accessibility constraints:** Verify narrow, intermediate,
  and wide widths. Keep DOM and focus order aligned with visual order. Preserve
  semantic groups, native controls, visible focus, reduced motion, keyboard
  access, zoom, long content, and image containment.
- **Operation:** Use `interface-craft` `layout` for the bounded grid correction.
  The renderer split is architecture work, not a visual redesign.
- **Visual direction:** Preserve the incumbent board direction. No image-backed
  direction choice is required for this bounded correction.
- **`DESIGN.md` disposition:** Do not create or modify `DESIGN.md`. This change
  does not establish durable new visual-system decisions.

## Boundaries and no-gos

- Keep the `design_board` tool schema and result contract unchanged unless a
  failing public-seam test proves a required correction.
- Do not move HTTP, feedback, lifecycle, persistence, or URL-opening behavior
  into the renderer.
- Do not export a private renderer only to make tests easier. Keep behavior
  tests at the public tool and served-URL seams.
- Do not add a web framework, DOM test dependency, template loader, runtime file
  I/O, production scaffolding, or another local server.
- Do not combine the renderer refactor and grid correction without separate
  proof. The refactor must remain behavior-preserving.
- Do not redesign board color, typography, copy, navigation, or feedback
  behavior beyond changes required by the accepted layout correction.
- Do not add a shared skill-ownership matrix. It would become a second source of
  truth and weaken package independence.
- Do not promise deterministic model skill selection. The testable contract is
  non-overlapping descriptions and acyclic delegation.
- Preserve Apache attribution, package manifests, packed resources, direct-parent
  fallbacks, and independently installable package behavior.
- Reshape if the renderer needs a new runtime dependency, if the public tool
  contract must change, or if routing changes require a new cross-package
  protocol instead of narrow description and reference edits.

## Decision-changing research and risks

- A separate renderer improves argument scope and change locality. It does not
  create a new external seam or a large Depth gain because the current HTML is
  already produced by one private function.
- The renderer split makes implicit policy visible. `MAX_NOTES_LENGTH` is used
  by rendering and feedback validation. Image URL construction must agree with
  HTTP route parsing. The generated token and path are safe to interpolate only
  because their current format is constrained.
- Browser evidence covers Chrome at 1280 × 720 in CLI and board modes with two
  directions. Mobile, keyboard, popover, zoom, long-content, and eight-direction
  proof remain implementation acceptance work.
- Pi documentation confirms that descriptions determine when agents load
  skills. Model choice is still probabilistic, so deterministic tests must
  check source properties rather than claim model behavior.
- Current HTML tests use many raw substrings and CSS fragments. Replace only the
  assertions that cannot detect the accepted behavior. Keep broad security and
  lifecycle coverage.
- No suite timing, branch/base CI comparison, mutation result, or deterministic
  model-routing run was collected. Do not claim a faster suite or quantified
  routing reliability.

## Review evidence

- **Applicability:** not applicable. This pitch does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns product scope, architecture, slice boundaries, frontend method
selection, pitch and plan synthesis, approval, and final verification.

The execution-mode preference is **accept-all implementation**. This preference
is not implementation authority until the complete plan is approved. A material
forecast variance still returns control to the human.

Pitch approval authorizes this branch's bounded pitch commit and planning
handoff. Complete-plan approval can authorize the named tests, source, skill,
reference, documentation, and verification changes in the accepted delivery
unit.

Approval does not authorize merge, release, deployment, npm publication,
provider billing, external network exposure, destructive cleanup, worktree
removal, unrelated changes, or automatic remote publication outside the later
approved publication boundary.

## Observable acceptance criteria

- **AC-001 — Render-only module:** Board document rendering uses one pure module
  with an immutable render-only input. The input does not expose the live HTTP
  server or mutable service state.
- **AC-002 — Stable public board:** Present, update, status, open, close,
  feedback, persistence, restoration, reachability, security headers, and image
  routes keep their accepted public behavior after the renderer split.
- **AC-003 — Explicit shared policy:** Notes limits, image route construction,
  generated token/path invariants, escaping, and CSP responsibilities remain
  explicit and covered at the renderer/service seam.
- **AC-004 — Full comparison width:** In default CLI mode, two to eight direction
  articles use the available comparison width without a heading-created empty
  grid track.
- **AC-005 — Responsive and accessible layout:** Named narrow, intermediate, and
  wide browser checks cover two and eight directions, long content, zoom,
  keyboard focus, full-size viewers, image containment, reduced motion, and DOM
  versus visual order without console errors.
- **AC-006 — One first owner:** Frontend skill descriptions give focused
  operation selection to `interface-craft` and material app direction to
  `frontend-design` and `interface-design` without overlapping broad claims.
- **AC-007 — Acyclic delegation:** No frontend design reference routes back into
  a router that can select the same reference. Existing implementation, proof,
  documentation, image, and React ownership remains explicit.
- **AC-008 — Effective routing tests:** A plausible overlapping-description or
  circular-delegation case fails before the minimum contract change. Tests use
  independent expected ownership and do not create a second production source
  of truth.
- **AC-009 — Package independence:** Frontend, feature-flow, and engineering
  resources keep capability-based language and do not assume companion packages,
  private agents, monorepo paths, or unavailable tools exist in target
  repositories.
- **AC-010 — No dependency expansion:** The delivery adds no runtime or DOM test
  dependency, framework, template loader, server, generated artifact, or
  repository-specific production scaffold.
- **AC-011 — Verified delivery:** Focused board and resource tests, package tests,
  typecheck, browser evidence, deterministic Pi reload acceptance,
  `npm run smoke:source`, and `npm run check` pass on the final worktree. The
  final diff, status, and packed contents contain no credentials, sessions,
  browser artifacts, local paths, or unrelated changes.
