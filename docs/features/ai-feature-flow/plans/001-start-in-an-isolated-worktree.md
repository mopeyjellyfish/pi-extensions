---
schema: feature-flow-plan/v2
feature: ai-feature-flow
id: "001"
pitch_sha256: 4b76f3837e934962d15c679deb78f9e66243343c1cc946a616d770980c8a4ae9
depends_on: []
---

# Slice 001: Start in an isolated worktree

## Goal

A natural end-to-end feature brief or `/shape <brief>` exposes one `shape` skill
and one `/shape` prompt, routes through Worktrunk, and creates the canonical
draft feature artifacts only after the helper verifies the routed branch and
base commit.

## Pitch trace

- [User experience](../pitch.md#user-experience)
- [Workspace first](../pitch.md#workspace-first)
- [Canonical feature directory](../pitch.md#canonical-feature-directory)
- [Skill package architecture](../pitch.md#skill-package-architecture)
- [Deterministic helper boundary](../pitch.md#deterministic-helper-boundary)
- **AC-001**, **AC-002**, **AC-003**, **AC-015**, and the applicable parts of
  **AC-016** and **AC-017**

## Observable outcome

In deterministic Pi, the package registers `shape` and `/shape` exactly once.
In a temporary Git repository, an initialization attempt from the wrong branch
or base writes nothing. After routing to the expected worktree, the same public
flow creates only:

```text
docs/features/<feature>/
├── pitch.md
└── index.json
```

Optional directories do not exist until used.

## Dependencies and predecessor postconditions

None. Before Red, recheck repository instructions, current worktree and dirty
files, package/resource contracts, pinned Pi prompt-template documentation, and
the accepted pitch hash. Preserve unrelated changes.

## Scope

- Replace the three public skills with one concise `shape` coordinator and the
  directly linked artifact/workspace guidance needed for this slice.
- Add the thin `prompts/shape.md` fallback and generic `pi.prompts` support to
  package validation, packing, and the private root aggregate.
- Replace incompatible v2 helper behavior with the minimum v3 `init`, `inspect`,
  and self-hosting slice seams. `init` accepts a feature slug plus expected
  branch/base, validates the current Git top-level/branch/base first, then
  atomically creates the draft pitch and canonical top-level JSON ledger.
  Minimal `activate`/`complete` behavior enforces dependencies, one active slice,
  required evidence, `Feature-Slice` banking, and no advance while unbanked so
  this slice and slices 002–004 can obey the accepted banking gate. Slice 005
  extends this foundation with blocking, cutting, and full recovery behavior.
- Add initial pitch and ledger templates, package documentation, trigger cases,
  and new-feature/write-order rubrics.
- Remove old public skill/reference resources as part of the replacement; do
  not keep compatibility shims.
- Do not implement linked-worktree discovery, pitch acceptance, planning, or
  Build transitions yet.

Likely modified files include `packages/feature-flow/`, root `package.json`,
`packages/README.md`, `docs/architecture.md`, `scripts/lib/packages.ts`,
`scripts/smoke-packages.ts`, and `test/tooling/packages.test.ts`. Read
`docs/authoring.md` completely during preflight; change it only if the generic
prompt-package authoring contract is incomplete.

## Public seam and first TDD tracer

**Seam:** Pi resource discovery plus the shipped helper CLI.

**Independent expectation:** pinned Pi docs define package prompt discovery and
`/shape` expansion; the accepted pitch defines worktree-first writes.

1. Add one failing package-resource test proving the packed package and root
   aggregate expose exactly one `shape` skill and one `/shape` prompt whose
   no-argument expansion requests ledger resume.
2. Make only that test green.
3. Then add one helper integration test in a temporary Git repository: invoke
   `init` with a branch/base that do not match the current route and assert the
   feature directory does not exist.
4. Make only that test green, then add dirty-checkout, ambiguous-base, and
   branch-collision cases one at a time; each must require one structured routing
   decision and leave zero artifacts.
5. Continue one behavior at a time until the routed success case creates
   canonical files, then add the smallest pending → active → done/evidence/
   banking fixture needed to bank this slice through the new helper.

Do not write every resource/helper test before implementation.

## Validation

- Focused feature-flow resource and helper tests after each tracer.
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- `npm run packages:check`
- Package dry-run inspection for prompts, one skill, references, templates,
  helper, and package docs; tests must be absent.
- `npm run smoke:source`
- `npm run security:check` because installation/package metadata changes.
- `npm run check` after the final slice edit.

## Dogfood and QA

Start deterministic Pi in a disposable repository. Run the focused test, reload
while idle, and invoke `/shape <brief>`. Exercise route mismatch, dirty checkout,
ambiguous base, and branch collision; each must ask once and write nothing. Then
use Worktrunk to route correctly and confirm only `pitch.md` and `index.json`
appear. Verify natural positive/negative trigger cases, record all completion
evidence through the helper, and bank the slice with a Conventional Commit and
`Feature-Slice: 001` trailer before slice 002 activates.

## Risks and escalation

- Pi prompt resources must be supported generically, not by a feature-flow
  special case.
- The helper validates the current route but never creates or activates a
  worktree; Worktrunk remains the lifecycle authority.
- If the pinned Pi package contract cannot aggregate prompts as documented, stop
  as a pitch-level capability blocker rather than adding an extension.

## Done when

The focused Red was observed; prompt, route-edge, and canonical-write behaviors
are green; package/source checks pass; dogfood proves ordering; fresh review is
blocker-free; and the helper records complete evidence plus a verified banked
slice 001 before slice 002 can activate.
