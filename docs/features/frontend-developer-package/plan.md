---
status: accepted
---

# Plan: Frontend developer package

This complete plan delivers every accepted vertical slice from
[`pitch.md`](pitch.md) through one package, one branch, one review boundary, and
one pull request.

## Execution mode

**Accept-all implementation** is selected. Whole-plan approval confirms
accept-all authority only for this named plan on
`feat/frontend-developer-package`. After approval, all four slices may proceed
without routine delivery-unit checkpoints, but every slice still requires its
named proof and coherent atomic commit.

Implementation returns control to the human for setup, test, check, commit, or
publication failure; material review findings; material forecast variance;
credential, billing, or privacy decisions; or changes to accepted scope,
delivery boundaries, dependencies, or authority. Accept-all never authorizes
merge, release, deployment, npm publication, destructive cleanup, worktree
removal, credential creation, billing changes, or unrelated work.

## Delivery topology

| Delivery unit | Branch                            | Pull request base | Vertical slices            | Dependencies | Lane/worktree owner                                                 |
| ------------- | --------------------------------- | ----------------- | -------------------------- | ------------ | ------------------------------------------------------------------- |
| 1             | `feat/frontend-developer-package` | `main`            | `001`, `002`, `003`, `004` | none         | serial package lane; current isolated worktree; one retained writer |

One delivery unit, branch, and pull request is the smallest coherent boundary.
Every slice changes the same package manifest, orchestrator, resource tests, and
README, so parallel writers would overlap and add integration risk. The accepted
pitch and this plan share the implementation pull request; neither has
independent merge value.

The root curated Pi profile is not part of this delivery. The new package must be
installed explicitly and remain useful without repository-private companion
resources. No stack is planned.

## Critical path, dependencies, and lanes

The serial critical path is:

```text
001 design contract
  -> 002 React implementation
  -> 003 visual validation
  -> 004 optional GPT Image generation
  -> integration, live reload, full checks, fixed review, publication
```

- **Active lanes:** one serial implementation lane in the current Worktrunk
  worktree, with one writer for all package and root metadata.
- **Delivery units / pull requests:** one / one.
- **Integration points:** package resource discovery; prompt expansion;
  `frontend-development` composition; package and release metadata; GPT Image
  configuration and Pi model-registry authentication; file-mutation queuing;
  source and packed loading.
- **Expensive gates:** mocked provider suite, deterministic Pi source and packed
  smoke, manual `/reload` acceptance, `npm run security:check`, and final
  `npm run check`.
- **Likely cascade cost:** low while skills change, medium after the extension
  seam and package manifest land because transport or dependency changes
  invalidate package, smoke, security, type, lint, and coverage evidence.
- **Variance rule:** any material increase beyond one package, one extension
  tool, four method areas, one branch, or one pull request returns control to the
  human before continuing. Under accept-all, any material coordination or gate
  variance returns control even if delivery boundaries do not change.

### Invalidation map

| Changed surface                                    | Focused proof invalidated                            | Affected-boundary proof invalidated                               | Integration / final proof invalidated                                                |
| -------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Skill, reference, template, or prompt text         | package resource-contract tests for that resource    | prompt/skill discovery and package README assertions              | source and packed smoke; manual skill invocation; Markdown checks                    |
| `package.json`, release metadata, or root lockfile | package manifest and packed-content assertions       | `packages:check`, workspace install, package test                 | source and packed smoke; security check when dependency metadata changes; full check |
| Image tool schema or registration                  | registration and schema tests                        | Pi tool discovery, TypeScript, lint                               | source/RPC/packed smoke; manual reload                                               |
| Configuration, auth, or transport                  | selection/auth/request unit tests                    | cancellation, provider errors, redaction, path/mutation tests     | package coverage, security check, full check                                         |
| Output file handling                               | generate/edit artifact tests                         | path normalization, overwrite, queue, cancellation, cleanup tests | manual generated-image readback; package and full checks                             |
| Repair after fixed review                          | all focused and affected checks named by the finding | complete package test                                             | required final gates once on the repaired frozen diff                                |

Evidence is reused only while its covered surface is unchanged. The complete
required gate runs once after the final diff freezes, and again only when a
repair invalidates it.

## [x] 001 — Preserve deliberate design context

### Outcome and requirement trace

An installed package gives Pi one coherent frontend-development entry plus a
focused frontend-design method. The method reads target-repository truth,
existing UI, supplied mock-ups, and an existing `DESIGN.md`; extracts explicit
visual evidence and ambiguity; establishes a context-specific visual thesis;
and creates or materially updates `DESIGN.md` only with human approval. It does
not require the file when absent or impose one house style.

Traces to AC-001, AC-002, AC-003, AC-004, AC-005, AC-011, AC-012, and the design
contract and mock-up portions of AC-013.

### Seam and files

Public seams:

- Pi package installation and discovery for
  `@mopeyjellyfish/pi-frontend-developer`;
- the `frontend-development` and `frontend-design` Agent Skills;
- `/frontend <request>` and `/design-ui <request>` prompt templates;
- the project-level `DESIGN.md` behavior described by the skills, with
  repository instructions and live product behavior above it.

Likely files:

- `packages/frontend-developer/package.json`
- `packages/frontend-developer/tsconfig.json`
- `packages/frontend-developer/README.md`
- `packages/frontend-developer/CHANGELOG.md`
- `packages/frontend-developer/LICENSE`
- `packages/frontend-developer/skills/frontend-development/SKILL.md`
- `packages/frontend-developer/skills/frontend-design/SKILL.md`
- `packages/frontend-developer/skills/frontend-design/references/design-contract.md`
- `packages/frontend-developer/skills/frontend-design/assets/DESIGN.template.md`
- `packages/frontend-developer/prompts/frontend.md`
- `packages/frontend-developer/prompts/design-ui.md`
- `packages/frontend-developer/test/resources.test.ts`
- `release-please-config.json`
- `.release-please-manifest.json`
- `package-lock.json`

The frontend-development module stays deep: its small interface accepts a
frontend request and optional visual evidence, while its implementation hides
repository discovery, design-context precedence, ambiguity handling, method
selection, proof requirements, and safe handoff to available engineering
capabilities. It does not expose package-private agent or tool names as required
interfaces.

### Dependencies

Accepted pitch, repository package contract, Pi Agent Skills and package
contracts, and the Google Labs `design.md` philosophy as optional Apache-2.0
research. No runtime dependency on Google's alpha CLI or schema.

### Execution lane and ownership

`serial`; current task worktree; one retained writer owns package scaffolding,
skills, prompts, tests, root release metadata, and lockfile. The parent owns
product and package-interface decisions and inspects all source wording for
license-safe originality.

### Red proof

Add `packages/frontend-developer/test/resources.test.ts` first. Its initial run
fails because the package and resource seams do not exist. The test must assert:

- exact package identity, declared extension/skill/prompt resources, required
  packed files, and release registration;
- discovery of `frontend-development`, `frontend-design`, `/frontend`, and
  `/design-ui`;
- precedence of repository instructions and live UI over `DESIGN.md`, canonical
  use when present, non-blocking absence, approval before creation or material
  rewrite, and stale-document reconciliation;
- mock-up evidence extraction, explicit ambiguity, native accessible controls,
  and rejection of screenshot-shaped implementation;
- a deliberate visual thesis without forced React, Vite, Tailwind, shadcn/ui,
  fonts, palettes, or maximalism;
- no copied Anthropic/OpenAI wording, monorepo-specific paths, private agents,
  or assumed companion tools in production resources.

### Green proof and checks

Make the focused resource test pass, then run:

```sh
npm --workspace @mopeyjellyfish/pi-frontend-developer test
npm run packages:check
npm run format:check
npm run markdownlint
```

Inspect `npm pack --dry-run --json` through the package test and verify the
skills, prompts, template, README, changelog, license, manifest, and extension
entrypoint declared for later slices are included. Any change to package
metadata, skill names, prompt names, template paths, or design-contract rules
invalidates this proof.

### Atomic commit and pull request

Create one coherent commit:

```text
feat(pi-frontend-developer): add frontend design workflow
```

It belongs to delivery unit 1 on `feat/frontend-developer-package`, based on
`main`. It includes package scaffolding, first resources and tests, release
metadata, and the lockfile update caused by the new workspace.

### Done when

The independent package loads and packs; its two initial skills and two prompts
are discoverable; a target repository can preserve deliberate design context
from code, images, and optional `DESIGN.md`; focused tests and named checks pass;
and package guidance remains original and target-repository neutral.

## [x] 002 — Implement production React interfaces

### Outcome and requirement trace

The frontend-development entry can load a focused React method and turn accepted
design evidence into maintainable interactive UI. It preserves the target
repository's React stack, component system, styling approach, behavior, and
checks; covers feature-relevant loading, empty, error, focus, hover, disabled,
and responsive states; and treats semantics, keyboard behavior, contrast,
reduced motion, content hierarchy, and asset cost as implementation constraints.

Traces to AC-002, AC-005, AC-006, AC-007, AC-011, AC-012, and the React and
accessibility portions of AC-013.

### Seam and files

Public seam: the standalone `react-interface` skill, composed by
`frontend-development` only when the target uses React or explicitly accepts it
for a greenfield surface.

Likely files:

- `packages/frontend-developer/skills/react-interface/SKILL.md`
- `packages/frontend-developer/skills/react-interface/references/react.md`
- `packages/frontend-developer/skills/frontend-development/SKILL.md`
- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/README.md`

Keep framework mechanics behind the React method's small interface. Do not add
separate top-level skills for accessibility, responsive design, animation,
performance, state coverage, CSS, or component libraries; load concise
references from the React method when needed.

### Dependencies

Slice 001 package and design evidence. Target-repository standards, dependencies,
and tests always override the package's general React guidance.

### Execution lane and ownership

`serial`; same task worktree and retained writer as slice 001 because the
orchestrator, README, and resource tests overlap.

### Red proof

Extend the focused package test before writing the skill. The intended failure
must prove the missing React seam and then assert that it:

- preserves an existing target stack and recommends a greenfield stack only
  after repository intent is checked;
- implements behavior and native controls rather than a static mock-up;
- names feature-relevant interaction and async states;
- covers semantic structure, keyboard and focus behavior, contrast, reduced
  motion, responsive hypotheses, content, and asset/performance choices;
- favors repository components and tokens before new abstractions;
- avoids speculative component layers, blanket memoization, framework rewrites,
  and styling-library mandates;
- supplies useful direct-parent behavior without assuming the engineering or
  Playwright packages are installed.

### Green proof and checks

Make the focused resource test pass, then run the package test, formatting,
Markdown, package validation, and source package smoke. Manually inspect the
skill against the repository's existing React review reference to remove
conflicting or duplicated general engineering policy.

Changes to the React skill, its reference, orchestrator composition, package
README, or resource declaration invalidate this slice's focused and package
proof. Changes to package metadata also invalidate slice 001 package proof.

### Atomic commit and pull request

Create one coherent commit:

```text
feat(pi-frontend-developer): add React interface workflow
```

It remains in delivery unit 1 and the same future pull request.

### Done when

The standalone React skill and integrated frontend entry lead from accepted
design evidence to real repository-conforming React behavior with explicit
state, accessibility, responsive, and performance-sensitive constraints, and
all focused checks pass.

## [x] 003 — Verify visual behavior at named viewports

### Outcome and requirement trace

The frontend-development entry can load a standalone visual-validation method,
use whatever browser or screenshot capability the target repository actually
provides, exercise named states at desktop and mobile viewports, compare the
result with accepted design evidence, and report concrete mismatches. It never
claims visual acceptance when browser proof is unavailable and never reduces
acceptance to pixel similarity alone.

Traces to AC-002, AC-005, AC-007, AC-008, AC-011, AC-012, and the visual-proof
portion of AC-013.

### Seam and files

Public seam: the `visual-validation` skill, composed after a stable UI change by
`frontend-development` and independently usable for existing interfaces.

Likely files:

- `packages/frontend-developer/skills/visual-validation/SKILL.md`
- `packages/frontend-developer/skills/visual-validation/references/visual-checklist.md`
- `packages/frontend-developer/skills/frontend-development/SKILL.md`
- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/README.md`

The skill's interface is capability-based: discover the target's start command,
browser/test tool, routes, viewport matrix, and accepted evidence; return a
mismatch ledger and proof status. It must not name this monorepo's Playwright
tool or require one private automation extension.

### Dependencies

Slice 001 design context and mock-up rules; slice 002 implementation state and
accessibility/responsive constraints. A target application and a browser or
repository screenshot capability are runtime prerequisites for visual proof,
not package runtime dependencies.

### Execution lane and ownership

`serial`; same task worktree and writer because the orchestrator, tests, and
README overlap. No browser runtime is added to the production package as skill
scaffolding.

### Red proof

Extend the focused resource test first. The failing contract must require:

- browser-capability discovery and a clear unmet-proof result when absent;
- named routes, states, viewport sizes, interactions, and reference evidence;
- desktop and mobile capture, keyboard/focus and reduced-motion checks where
  applicable, console/runtime error inspection, and content overflow checks;
- comparison on hierarchy, composition, typography, color, spacing, states, and
  assets without treating a raw similarity score as the verdict;
- a concrete mismatch ledger with severity, evidence, likely cause, and
  recheck target;
- bounded iteration on shared causes rather than arbitrary pixel nudges;
- browser cleanup and target-repository command ownership.

### Green proof and checks

Make the package resource test pass, then run package tests, formatting,
Markdown, package validation, and source smoke. During live acceptance, load the
package in a deterministic Pi session from this worktree, reload it while idle,
invoke `visual-validation` against a disposable local interface at named desktop
and mobile viewports, and confirm it records either real evidence or an explicit
unmet-proof state without duplicate resource registration.

Any change to the visual skill, checklist, orchestrator, browser fallback,
README, or resource declaration invalidates this proof. Browser-capability
changes invalidate manual visual evidence but not unrelated provider tests.

### Atomic commit and pull request

Create one coherent commit:

```text
feat(pi-frontend-developer): add visual validation workflow
```

It remains in delivery unit 1 and the same future pull request.

### Done when

The installed package can drive and report an evidence-based desktop/mobile
visual check through available target capabilities, distinguish visual,
interaction, accessibility, and responsive constraints, and fail honestly when
visual proof cannot run.

## [x] 004 — Generate and edit GPT Image 2 mock-ups safely

### Outcome and requirement trace

With a separately billed compatible OpenAI Platform API credential, Pi exposes
one `image_generation` tool that generates or edits a GPT Image 2 artifact at an
explicit project path and returns a concise path and metadata for later `read`
inspection. Without compatible credentials or configuration it sends no
request and returns an actionable bounded error. The image-generation skill and
prompt connect that artifact to the same design and implementation workflow.

Traces to AC-001, AC-002, AC-005, AC-009, AC-010, AC-011, AC-012, AC-013, and
AC-014.

### Seam and files

Public interfaces:

- `image_generation` tool with a strict provider-neutral schema: operation
  (`generate` or `edit`), bounded prompt, explicit output path, optional input
  image paths and mask path, and only documented portable output controls;
- trusted user/project configuration selecting an OpenAI Responses provider and
  model from Pi's registry as the endpoint and API-key authentication source;
- current-model default only when the active model already uses the compatible
  `openai-responses` API; no fallback from another provider;
- fixed first-release image behavior contract for `gpt-image-2` through the
  documented Image API;
- standalone `image-generation` skill and `/generate-image` prompt.

Likely files:

- `packages/frontend-developer/src/index.ts`
- `packages/frontend-developer/src/config.ts`
- `packages/frontend-developer/src/image-generation.ts`
- `packages/frontend-developer/skills/image-generation/SKILL.md`
- `packages/frontend-developer/prompts/generate-image.md`
- `packages/frontend-developer/test/index.test.ts`
- `packages/frontend-developer/test/resources.test.ts`
- `packages/frontend-developer/package.json`
- `packages/frontend-developer/tsconfig.json`
- `packages/frontend-developer/README.md`
- `package-lock.json` only if final dependency metadata changes

Module design:

- the extension factory only registers the tool;
- the configuration module hides trusted-path precedence, strict parsing, model
  lookup, compatible API checks, and the no-Codex-OAuth rule behind one
  selection interface;
- the image-generation module hides header preservation, endpoint construction,
  multipart/JSON request construction, response validation, bounded errors,
  cancellation, and artifact decoding behind one request interface;
- the tool owns path normalization, `withFileMutationQueue()` around the full
  mutation window, parent-directory creation, explicit no-overwrite behavior,
  and concise result details.

This produces depth and locality without speculative adapters: network fetch and
filesystem mutation are the two real volatile seams used by production and
controlled tests.

### Dependencies

Slices 001 and 003 for generated-mock-up interpretation and proof. Pinned Pi
extension, model-registry, tool-result, and file-mutation contracts; OpenAI's
current GPT Image guide and model documentation. The implementation may use
Node `fetch`, `FormData`, and filesystem primitives; add no OpenAI SDK unless a
specific tested requirement justifies its runtime and security cost.

### Execution lane and ownership

`serial`; same worktree and writer because package manifest, README,
orchestrator, prompts, and tests overlap. Provider network access is mocked in
automation. Real-provider acceptance uses only the developer's existing Pi
OpenAI API-key authentication and requires separate human confirmation before a
billable call; no credential or response is recorded.

### Red proof

Add `test/index.test.ts` through the registered public tool seam before transport
implementation. Use a fake Pi/model-registry context, temporary project roots,
and mocked `fetch`. Intended failing cases cover:

- exact tool registration, strict schema, named prompt guidelines, and generate
  request mapping;
- trusted explicit model selection, compatible current-model selection, unknown
  model, untrusted project config, invalid config, unsupported API, missing
  credentials, and rejection of `openai-codex-responses` subscription OAuth
  before fetch;
- API-key and provider-header preservation without credential leakage;
- generated and edited requests, multiple input images, mask validation,
  documented format/dimension/size limits, unsupported fields, malformed or
  oversized responses, empty image data, cancellation, and bounded provider
  errors;
- leading `@` normalization, relative path resolution from `ctx.cwd`, refusal to
  overwrite by default, parent creation, complete file-mutation queuing,
  incomplete-write cleanup, and returned artifact metadata;
- no request on preflight failures and no real network or persisted credentials.

Extend `resources.test.ts` to fail until `image-generation`, `/generate-image`,
extension discovery, manifest peers/files, packed contents, credential-free
skill utility, billing/privacy documentation, and target-neutral wording exist.

### Green proof and checks

Make the provider and resource tests pass. Run:

```sh
npm --workspace @mopeyjellyfish/pi-frontend-developer test
npm --workspace @mopeyjellyfish/pi-frontend-developer run typecheck
npm run lint
npm run packages:check
npm run smoke:source
npm run security:check
```

Then perform live reload acceptance from the target worktree:

1. start the pinned deterministic Pi command with only this package loaded;
2. confirm the extension, five skills, and three prompts appear once;
3. rerun the focused package test before reload;
4. enter `/reload` while idle;
5. exercise missing-credential failure and one mocked or explicitly approved
   real generate/edit path, then inspect the saved image with `read`;
6. invoke the generated mock-up through `frontend-design` and confirm the
   workflow extracts design evidence instead of treating pixels as behavior;
7. run `npm run smoke:source` again.

A real billable provider call is optional acceptance evidence and must never be
used in automated tests. If no separately billed API key is available, the
verified no-request credential failure plus mocked transport remains the
required proof, and the residual real-provider gap is reported.

Changes to the tool schema, auth/config selection, transport, filesystem
behavior, package manifest, or image documentation invalidate all focused image
proof plus type, lint, package, smoke, security, and coverage evidence.

### Atomic commit and pull request

Create one coherent commit:

```text
feat(pi-frontend-developer): generate GPT Image mock-ups
```

It remains in delivery unit 1 and the same future pull request. Include extension
source, focused tests, image skill and prompt, required manifest/lockfile changes,
and the corresponding README behavior in this commit.

### Done when

The package works without image credentials; compatible API-key users can
safely generate and edit an inspectable GPT Image 2 artifact; incompatible or
missing authentication fails before network access; cancellation, errors,
external inputs, paths, and output are bounded; and focused tests and named
checks pass without real network access.

## Delivery-unit integration and completion

After slice 004, freeze the complete delivery-unit diff and run the invalidation
map's outstanding checks, followed by:

```sh
npm run fix
npm run check
npm run security:check
```

`npm run workflows:check` is not required unless implementation changes a
workflow. Inspect the final diff and packed artifact for package independence,
root-profile exclusion, release/version synchronization, dependency placement,
license attribution, credentials, absolute paths, generated images, sessions,
coverage, archives, and other forbidden artifacts.

Run one fresh fixed-point read-only review against the accepted pitch, this
accepted plan, repository Standards, and final evidence. Material findings pause
accept-all execution before repair. Routine approved repairs return to the same
writer, rerun invalidated focused proof, re-enter one aggregated QA gate, and
restore a frozen green diff before publication.

When all four slices and the final delivery unit are green, commit any approved
plan-state closure as part of the final coherent delivery boundary, use the
repository commit workflow for every named atomic unit, and publish the current
branch through one pull request only. Publication authority does not include
merge, release, deployment, npm publication, or cleanup.
