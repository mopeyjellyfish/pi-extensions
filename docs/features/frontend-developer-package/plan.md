---
status: accepted
---

# Plan: Deeply integrated app-interface design

This complete revision plan delivers the accepted app-interface design loop from
[`pitch.md`](pitch.md) on the existing `feat/frontend-developer-package` branch
and updates the existing standalone pull request.

## Completed foundation

The package, design contract, React specialist, visual-validation method, and
GPT Image tool are already implemented and verified by completed slices 001
through 004. Their accepted behavior remains the foundation for this revision:

- `frontend-development`, `frontend-design`, and `/design-ui` already load;
- `DESIGN.md` is canonical beneath repository instructions and live behavior;
- `react-interface`, `visual-validation`, and `image-generation` are standalone,
  optional methods;
- provider, package, source, packed, security, and full checks passed before this
  revision.

This plan does not reimplement those slices. A changed shared surface invalidates
only the evidence named below, then the final gate rechecks the complete package.

## Execution mode

**Accept-all implementation** is selected. Whole-plan approval confirms
accept-all authority only for this revision on
`feat/frontend-developer-package`. The remaining slice, final verification,
fixed review, coherent commit, and existing pull-request update may proceed
without routine checkpoints.

Execution returns control for setup, test, check, commit, or publication failure;
material review findings; material forecast variance; credential, billing, or
privacy decisions; or changed scope, delivery boundaries, dependencies, or
authority. Accept-all never authorizes merge, release, deployment, npm
publication, destructive cleanup, worktree removal, credential creation, billing
changes, or unrelated work.

## Delivery topology and critical path

| Delivery unit | Branch                            | Base   | Slice | Lane/worktree owner                                            |
| ------------- | --------------------------------- | ------ | ----- | -------------------------------------------------------------- |
| 1             | `feat/frontend-developer-package` | `main` | `005` | serial; current isolated worktree; one retained package writer |

One branch, worktree, sequential writer, review boundary, and pull-request update
is the smallest safe topology. The deep method, router, design contract, prompt,
and README overlap, so parallel writers would add merge and integration risk.
Fresh read-only QA and formal review remain independent.

```text
005 deeply integrated app-interface method
  -> focused package and license proof
  -> source and packed smoke
  -> final checks and fixed review
  -> coherent commit and existing PR update
```

- **Integration points:** skill discovery; `frontend-design` routing; the new
  `interface-design` method; `DESIGN.md` precedence; optional image, question,
  framework-specialist, hot-reload, and browser capabilities; packed licensing.
- **Expensive gates:** package tests; package validation; source and packed smoke;
  manual `/reload` acceptance; `npm run security:check`; `npm run check`.
- **Likely cascade cost:** low during focused skill work and medium after router,
  contract, or package-resource changes invalidate package and smoke evidence.
- **Variance rule:** any increase beyond one package, one branch, one worktree,
  one sequential writer, one implementation slice, or one PR returns control.

## Invalidation map

| Changed surface                              | Focused proof               | Affected proof                         | Final proof                               |
| -------------------------------------------- | --------------------------- | -------------------------------------- | ----------------------------------------- |
| `interface-design` or its MIT license        | provenance review           | packed contents and README attribution | package validation, smoke, license review |
| `frontend-design`, prompt, or router wording | target review               | skill and prompt discovery             | package validation, Markdown, smoke       |
| `DESIGN.md` contract or template             | target review               | resource discovery                     | package validation, Markdown, smoke       |
| README or package file declarations          | documentation review        | package validation                     | source and packed smoke                   |
| Repair after fixed review                    | checks named by the finding | complete package test                  | required final gates once repaired        |

Evidence is reused only while its covered surface is unchanged. Run the complete
required gate once after the final diff freezes and again only when a repair
invalidates it.

## [x] 005 — Deeply integrate the app-interface design method

### Outcome and requirement trace

The installed package exposes a standalone, framework-neutral
`interface-design` skill for dashboards, admin panels, tools, settings, data
interfaces, and interactive product workflows. It starts from the complete
pinned MIT method and deeply incorporates this package's `DESIGN.md`, optional
image references, material-feedback checkpoints, target-owned hot reload,
framework-specialist handoff, and visual proof.

`frontend-design` becomes the small routing seam: it sends non-trivial app UI to
`interface-design`, keeps simple visual edits direct, and names
`marketing-site-design` only when that external capability is available.

Traces to AC-002 through AC-005, AC-007, AC-008, AC-011 through AC-020.

### Public seams and files

Public seams:

- independently discoverable `interface-design` as the primary app-UI method;
- framework-neutral `frontend-design` router and `/design-ui` prompt;
- existing `DESIGN.md` contract as the only durable project design memory;
- capability-based composition with `image-generation`, an applicable
  implementation specialist, target hot reload, and `visual-validation`.

Likely files:

- `packages/frontend-developer/skills/interface-design/SKILL.md`
- `packages/frontend-developer/skills/interface-design/LICENSE.txt`
- `packages/frontend-developer/skills/frontend-design/SKILL.md`
- `packages/frontend-developer/skills/frontend-development/SKILL.md`
- `packages/frontend-developer/skills/frontend-design/references/design-contract.md`
- `packages/frontend-developer/skills/frontend-design/assets/DESIGN.template.md`
- `packages/frontend-developer/prompts/design-ui.md`
- `packages/frontend-developer/README.md`

`interface-design` is the deep module. Its small public interface accepts an app
design, build, audit, or refinement request. Its method owns intent, domain
exploration, hierarchy, tokens, density, depth, controls, states, polish, motion,
reference generation, feedback, implementation handoff, and proof.
`frontend-design` classifies impact and surface only; it does not duplicate the
method.

### Dependencies and ownership

Dependencies are the completed package foundation, accepted revised pitch, the
MIT source at commit `2f9be3206855bcb2d1d0af262c8bae25cba6658d`, and the
target repository's commands, components, framework, and checks.

`marketing-site-design`, a structured question tool, image credentials, React,
and browser automation are optional capabilities, not package dependencies. One
retained writer owns every file in the current worktree. No parallel
implementation worktree or writer is planned.

### Resource integrity decision

This plan originally required package-owned resource-contract assertions in
`packages/frontend-developer/test/resources.test.ts`. That approach is
superseded: package tests cover only TypeScript tool/runtime behavior. Resource
integrity is covered by repository package validation, source and packed smoke,
and Markdown lint; targeted review verifies guidance semantics.

### Green proof and checks

Copy the pinned MIT skill and license, then deeply revise the copied skill
according to accepted guidance and targeted review. Run:

```sh
npm --workspace @mopeyjellyfish/pi-frontend-developer test
npm --workspace @mopeyjellyfish/pi-frontend-developer run typecheck
npm run packages:check
npm run format:check
npm run markdownlint
npm run smoke:source
```

Inspect `npm pack --dry-run --json` through package validation. Confirm the new
skill and MIT license are packed. Compare the final skill with the pinned source:
retain the complete substantive app-design discipline, remove every
`.interface-design/system.md` instruction, and verify that integrations live
inside `interface-design`, not only in router or README text. Verify the package
README prominently identifies the modified derivative and pinned source, the
packed co-located license retains the complete MIT notice, and
`interface-design/SKILL.md` contains no attribution prose.

For manual acceptance, load only this package from the current worktree in a
deterministic Pi session and:

1. confirm six skills and three prompts appear once;
2. invoke `/design-ui` for a mechanical CSS change and for a non-trivial app
   dashboard, confirming direct and `interface-design` routes respectively;
3. exercise missing image credentials and missing browser or structured-question
   capability without a false success claim;
4. reload while idle and confirm no duplicate resources or stale method text.

Changes to either design skill, contract/template, prompt, license, README,
resource declaration, or package file list invalidate this slice's focused
package, pack, Markdown, and smoke proof.

### Atomic commit and pull request

Create one coherent commit:

```text
feat(pi-frontend-developer): add interface design workflow
```

It remains in delivery unit 1 on `feat/frontend-developer-package`, based on
`main`, and updates the existing standalone pull request. Include the deep
method, attribution, routing, contract/template adjustments, focused checks, and
README behavior.

### Done when

Non-trivial app-interface work starts from the complete deeply integrated
`interface-design` method; simple changes remain simple; marketing routing is
conditional; `DESIGN.md` is the sole durable project design record; framework
choice stays with the target; optional image, feedback, React, hot-reload, and
visual capabilities compose without becoming requirements; focused and named
checks pass; and the MIT derivative is correctly identified and packed.

## Delivery-unit integration and completion

After slice 005, freeze the complete revision diff and run:

```sh
npm run fix
npm run check
npm run security:check
```

`npm run workflows:check` is not required unless a workflow changes. Inspect the
final diff and packed artifact for package independence, root-profile exclusion,
release/version synchronization, dependencies, attribution, credentials,
absolute paths, generated images, sessions, coverage, archives, and forbidden
artifacts.

Run one fresh fixed-point read-only review against the accepted pitch, this plan,
repository Standards, and final evidence. Material findings pause accept-all
execution before repair. An approved repair returns to the same writer, reruns
invalidated focused proof, re-enters one aggregated QA gate, and restores a
frozen green diff before publication.

When slice 005 and the final delivery unit are green, close the plan state in the
final coherent commit, use the repository commit workflow, and update the
existing pull request from the current branch only. Publication authority does
not include merge, release, deployment, npm publication, or cleanup.
