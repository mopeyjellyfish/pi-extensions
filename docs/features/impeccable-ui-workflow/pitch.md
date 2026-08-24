---
status: accepted
---

# Shape: Integrated interface craft workflow

## Problem and evidence

The frontend package has a strong app-interface method, visual board, image generation, React handoff, and visual validation, but it exposes most refinement work through broad skills. Requests such as “audit this UI”, “fix the layout”, “clarify this flow”, “polish it”, “improve onboarding”, or “optimize the interface” do not yet resolve to a named operation contract with operation-specific evidence and completion rules. `DESIGN.md` creation is only an optional end-of-task action, so a human or agent cannot reliably request design-system extraction as a first-class task.

The Shape and planning lifecycle is also interface-neutral. A UI-bearing feature can therefore reach implementation without an accepted visual thesis, representative states, responsive expectations, or a named visual-proof gate. The implementation workflow can recover some of this context, but too late: product intent, visual direction, and delivery scope may already be fixed.

Impeccable 4.1.1, reviewed at upstream commit `56f44523f76efdcec813e67b38ee550e49b16f48`, provides a useful operation vocabulary and focused playbooks. Its full runtime is not a safe drop-in here: it adds its own scripts, browser, question server, image path, hooks, `PRODUCT.md`, `.impeccable/` state, and `npx` execution. Those overlap this repository’s existing Pi tools and parent-owned engineering workflow. Its `DESIGN.md` work does, however, target the public Google Labs DESIGN.md alpha specification, whose canonical file uses optional token frontmatter and ordered prose sections.

## Proposed solution

Extend `@mopeyjellyfish/pi-frontend-developer` with one integrated interface-operation catalog, while keeping `/design` as the main human entry point and preserving skill discovery for agent-triggered work.

### Interface operation catalog

Add an `interface-craft` skill with a trigger-rich description and one concise reference per operation. `/design <request>` and `frontend-design` route an explicit or clearly implied operation to the matching reference; if two operations materially overlap, ask once. The references supply focused diagnosis, required evidence, scope guardrails, implementation handoff, and completion proof without creating another orchestration stack.

Bring across and adapt these web-interface operations:

| Intent              | Operations                                                         | Contract                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Establish or evolve | `design`, `extract`, `document`                                    | Create a direction, extract reusable tokens/components, or create/refresh `DESIGN.md`.                                                                                          |
| Evaluate            | `critique`, `audit`                                                | Separate heuristic UX/design judgment from measurable accessibility, performance, responsive, theming, and implementation-integrity findings. Evaluation does not silently fix. |
| Refine              | `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`      | Preserve accepted product truth and visual authority while improving finish, expression, restraint, simplicity, edge cases, or time to value.                                   |
| Enhance             | `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive` | Apply one deliberate craft dimension with repository tokens, accessible controls, responsive behavior, and visual proof.                                                        |
| Fix                 | `clarify`, `adapt`, `optimize`                                     | Improve interface language, device/container behavior, or measured user-facing performance without inventing product claims or optimizing without evidence.                     |
| Iterate             | `live`                                                             | Use the installed target site, `playwright_browser`, image evidence, and `design_board`; do not vendor Impeccable’s browser or live server.                                     |

Natural requests must trigger these contracts without exact command syntax. Examples include “polish this”, “audit the settings flow”, “fix the mobile layout”, “make this calmer”, “improve onboarding”, “clarify the errors”, and “document the design system”. `teach me this design system` is an alias for design documentation, not for a new `PRODUCT.md`. “Normalize” routes to `polish` or `extract` according to whether the request concerns local drift or reusable system convergence.

`shape` remains exclusively the feature pitch lifecycle and is not imported as a design-operation name. General new-interface work remains `/design`; `craft` is not added as a second entry point. Native iOS/Android playbooks are outside this frontend package.

### First-class DESIGN.md capability

Add a discoverable `design-documentation` skill and `/design document ...` route. It supports:

- **scan mode** for extracting only observed, reused tokens, components, states, responsive rules, and rationale from an implemented product;
- **seed mode** for recording an explicitly accepted visual world before implementation without fabricating settled tokens;
- **merge/refresh mode** for reconciling an existing file with repository instructions and verified live behavior.

Use the official DESIGN.md alpha structure: optional frontmatter with `version`, `name`, `description`, `omitted`, `colors`, `typography`, `rounded`, `spacing`, and `components`, followed by applicable canonical sections in order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do’s and Don’ts. Tokens are normative; prose explains application and rationale.

Repository instructions and verified behavior continue to outrank `DESIGN.md`. Creation, replacement, or a material rewrite requires explicit human approval. Agents may trigger analysis and propose a complete document, but may not infer approval or silently overwrite. Keep one portable `DESIGN.md`; do not add `PRODUCT.md`, `.impeccable/design.json`, another memory file, or hidden state.

### Pitch and plan integration

Make UI lifecycle integration conditional so the independently installable feature-flow package does not require the frontend package:

1. **Shape:** When accepted scope includes a material user interface and an applicable frontend-design capability is installed, collect the smallest decision-changing interface evidence before pitch approval. Record the person and task, surface mode, current design authority, desired feel, focal workflow, representative states, responsive/accessibility constraints, design-operation needs, `DESIGN.md` status, and required visual decisions. Material visual direction uses image-backed directions and an explicit human choice before the pitch is finalized. The pitch links the chosen evidence and states whether durable decisions should be proposed for `DESIGN.md`.
2. **Planning:** Trace accepted interface criteria into vertical slices. Each relevant slice names behavior states, responsive surfaces, accessibility paths, design-system reuse, operation-specific checks, target-owned browser proof, and the visual mismatch ledger. When direction remains provisional, plan a design-evidence slice before UI implementation. When decisions should persist, plan a separate approval gate for creating or materially updating `DESIGN.md`.
3. **Implementation:** `implement` or `developing-changes` remains the sole engineering orchestrator. Interface skills provide accepted design context and focused quality contracts; they do not launch a competing Worker/TDD/QA/review loop. Behavioral UI code still uses TDD. Stable material UI still uses visual validation at named desktop and mobile viewports.

This is one delivery unit because the frontend routing and feature-flow lifecycle contracts must agree before either is useful. It may contain separate atomic commits for the frontend operation catalog and feature-flow integration, but uses one branch, final review, validation boundary, and pull request. The pitch and plan documents share that implementation publication boundary.

### Attribution and source boundary

Adapt the useful operation concepts and selected playbook text, not the Impeccable runtime. Pin the reviewed upstream commit in package documentation, ship the Apache-2.0 license and required collective package `NOTICE.md` beside the derivative references, and preserve the package’s existing MIT resources as separate work. The package-level notice replaces per-reference provenance banners. Add resource tests for exact attribution, packed contents, trigger vocabulary, forbidden runtime paths, and absence of Impeccable state or hook instructions.

## Boundaries and no-gos

- Keep `/design` as the sole main interface prompt; do not add `/impeccable` or one prompt per verb.
- Do not vendor or invoke Impeccable scripts, `npx impeccable`, its browser, question server, image generator, hooks, detector, or live-panel state.
- Do not create `PRODUCT.md`, `.impeccable/`, sidecar JSON, provider hook manifests, or repository-specific state.
- Do not let interface skills own Shape approval, planning approval, engineering orchestration, Git publication, or product-behavior invention.
- Do not apply app-interface rules as a substitute for unavailable marketing-site or native-platform expertise.
- Do not force design boards or DESIGN.md ceremony onto bounded mechanical edits.
- Do not silently fix during an audit or critique unless the human requests a follow-on implementation.
- Do not claim visual, accessibility, responsive, or performance acceptance without the named evidence.
- Do not copy upstream text into MIT-owned files without the required Apache attribution and modification notice.

Acceptable cuts are operation references that delegate shared foundations to `interface-design`, `frontend-development`, or `visual-validation` instead of repeating them. Reshape if official DESIGN.md alpha changes materially before implementation, if compliant attribution requires a separate independently installable package, or if operation discovery cannot be made reliable through one catalog skill and `/design` routing.

## Decision-changing research and risks

- **Single catalog versus one skill per verb:** one operation skill with references keeps skill discovery useful without flooding Pi with overlapping skills. A separate `design-documentation` skill is justified because humans and agents must be able to invoke it independently and it has a distinct write-approval contract.
- **Upstream runtime versus native integration:** native integration reuses `question`, `design_board`, `image_generation`, `playwright_browser`, Shape, planning, and implementation. Vendoring the runtime would duplicate lifecycle ownership and add unsafe ambient hooks and state.
- **DESIGN.md interoperability:** adopting an alpha public specification improves portability but creates schema-drift risk. Pin the reviewed specification expectations in tests and preserve unknown existing content during merges rather than rewriting it away.
- **Vocabulary collisions:** `shape`, `document`, `audit`, and `live` already have broader meanings. Explicit routing rules must keep lifecycle ownership clear and ask once only when intent is genuinely ambiguous.
- **Ceremony creep:** UI quality gates can make small fixes expensive. Impact routing must retain the direct mechanical path and apply Shape/plan integration only to material UI scope.
- **False confidence:** checklists can become unsupported assertions. Every operation needs evidence requirements and honest unmet-proof outcomes.
- **Licence boundary:** Apache-derived references inside an MIT package need a clear collective package notice, shipped license, retained upstream notices, and an upstream commit pin. The adapted references do not repeat per-file provenance banners. If validation or legal review finds that boundary unclear, move the derivative catalog to a separate Apache-2.0 skill-only package while retaining `/design` integration.

Sources reviewed:

- Impeccable 4.1.1 at <https://github.com/pbakaus/impeccable/tree/56f44523f76efdcec813e67b38ee550e49b16f48/.pi/skills/impeccable>
- Official DESIGN.md alpha specification at <https://github.com/google-labs-code/design.md/blob/main/docs/spec.md>

## Authority

The parent owns product decisions, architecture, operation mapping, pitch and plan synthesis, approval, and final verification. Approved delivery may modify the frontend-developer and feature-flow package resources, tests, package documentation, root profile references when required, and attribution files within this named branch. It may create the accepted plan and implement the bounded delivery unit after separate approvals.

Execution mode preference is accept-all implementation. This preference is not implementation authority until the complete plan is approved. Approval does not authorize merge, release, deployment, destructive cleanup, unrelated remote changes, or automatic worktree removal.

## Observable acceptance criteria

- **AC-001 — Main entry point:** `/design` remains the documented main prompt and routes explicit or natural-language interface requests to the applicable operation without requiring `/impeccable` syntax.
- **AC-002 — Trigger coverage:** `design`, `extract`, `document`, `critique`, `audit`, `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`, `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`, `clarify`, `adapt`, `optimize`, and `live` each have a discoverable contract with scope, evidence, handoff, and completion rules.
- **AC-003 — Natural requests:** focused resource tests prove that representative phrases such as “polish”, “audit”, “fix the layout”, “clarify”, “adapt”, “optimize”, “onboard”, “make bolder”, and “make quieter” are present in routing and skill-discovery surfaces.
- **AC-004 — Collision safety:** `/shape` still owns feature pitches; the design catalog does not register `shape`, `craft`, or `/impeccable` as competing entry points, and ambiguous operation requests ask at most once.
- **AC-005 — Direct DESIGN.md use:** a human can request `/design document`, and an agent can discover `design-documentation`, without first running a full design or implementation task.
- **AC-006 — Safe DESIGN.md writes:** scan, seed, and merge/refresh modes use repository evidence, present the complete proposal, require explicit approval before creation or material rewrite, preserve unknown existing content where possible, and never silently overwrite.
- **AC-007 — Portable document:** generated guidance follows the official DESIGN.md alpha token groups and canonical section order, keeps tokens normative, omits unsupported or invented values, and records unresolved decisions honestly.
- **AC-008 — One durable design file:** the integrated skills never instruct creation of `PRODUCT.md`, `.impeccable/`, a DESIGN sidecar, provider hooks, or hidden method state.
- **AC-009 — UI-aware Shape:** material UI pitches conditionally capture interface intent, current authority, representative states, responsive/accessibility constraints, selected visual evidence, operation needs, and DESIGN.md disposition before pitch approval when the frontend capability is available.
- **AC-010 — UI-aware planning:** accepted interface criteria trace into ordered slices with design dependencies, state coverage, responsive/accessibility paths, visual evidence, mismatch-ledger proof, and any separate DESIGN.md approval gate.
- **AC-011 — Single orchestration owner:** operation references delegate behavioral implementation to `implement` or `developing-changes`; they do not add a Worker, TDD, QA, review, Git, question, browser, image, or lifecycle orchestration loop.
- **AC-012 — Proportionate workflow:** bounded mechanical UI edits remain direct; audits and critiques remain read-only unless follow-on implementation is requested; material changes receive design and visual-proof gates.
- **AC-013 — Existing package independence:** feature-flow uses conditional capability language and remains independently installable without frontend-developer; frontend-developer does not assume feature-flow or engineering companions exist.
- **AC-014 — Attribution:** every adapted Apache-2.0 reference ships the required license, retained notice material, upstream commit pin, and prominent modification notice; package documentation identifies the derivative boundary.
- **AC-015 — Forbidden runtime surface:** tests reject Impeccable script paths, `npx impeccable`, ambient hooks, duplicated servers/tools, sidecar state, and monorepo-specific production paths.
- **AC-016 — Verification:** focused frontend-developer and feature-flow resource tests, package tests, `npm run smoke:source`, and `npm run check` pass after the final edit; lifecycle-sensitive changes complete the repository’s deterministic Pi reload acceptance loop.
