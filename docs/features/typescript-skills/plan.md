---
status: accepted
---

# Plan: TypeScript skills package

This plan delivers the accepted TypeScript Skills Extension PRD as one
independently installable, skill-only Pi package. It uses Pi's native Agent
Skills discovery and progressive disclosure. It does not add a no-op runtime
extension.

## Review evidence

- **Applicability:** Not applicable. The outcome does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance or routing.
- **Fixed document:** Not applicable.
- **Status:** Not applicable.
- **Invalidation:** Not applicable.

## Research evidence

Research was checked on 2026-08-31 against these current upstream revisions and
official pages:

- `spf13/go-skills` at `e67851cfcca008592c7c4965b8220c7cb37e2f1c`;
- `mattpocock/skills` at `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`;
- `antfu/skills` at `a74f281a27dadc02397bc1a174b0f2c97531b6ae`;
- `vercel-labs/agent-skills` at
  `063bee94c3f4df8453406c830b0a7df0f2860278`;
- Microsoft TypeScript Design Goals, Handbook, and TSConfig reference;
- typescript-eslint shared configurations and typed-linting documentation;
- publicly available Effective TypeScript articles and the 2024 second-edition
  announcement;
- Sindre Sorhus's `typescript-definition-style-guide` at
  `5be6cdab9c13bc2a7eb9ef345d497ba8ae43f919` and `tsconfig` at
  `5db01b5dc2492011deee834e5bb175804f05c198`.

The implementation will paraphrase principles and create original examples. It
will distinguish Microsoft language semantics, typescript-eslint executable
checks, and practitioner recommendations. It will not copy substantial source
text or code.

## Execution mode

Checkpointed implementation. This plan contains one delivery unit, so approval
authorizes that unit's bounded implementation, verification, review, commit,
and pull-request publication. It does not authorize merge, release, deployment,
destructive cleanup, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                   | Pull request base         | Dependencies | Checks                                              | Ownership                                | Integration point                   | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ------------------------ | ------------------------- | ------------ | --------------------------------------------------- | ---------------------------------------- | ----------------------------------- | ---------- | ------------ |
| 1             | standalone | standalone     | `feat/typescript-skills` | repository default branch | none         | focused package test, source smoke, `npm run check` | current task worktree; one Worker writer | root profile and package validation | 1          | low          |

The planning document shares the implementation delivery unit and pull request.
All slices are serial because they change the same package contract test and root
profile metadata. Separate writers or pull requests would add coordination cost
without independent review or rollback value.

## Critical path, dependencies, and lanes

The critical path is: establish the package contract test, add the core skill,
add the four specialist skills, integrate and document the package, then run the
stable-unit gates. There is one active lane, one delivery unit, one branch, and
one pull request. The expensive gates are source smoke and the repository-wide
check. No independent implementation lane exists.

Invalidation map:

- A change to one skill or reference invalidates its resource-contract test and
  the package test.
- A manifest, root-profile, release, or lockfile change invalidates package
  validation and source smoke.
- A change after the frozen diff invalidates `npm run check` and selected formal
  review evidence for the changed surface.

## [ ] 001 — Discoverable skill-only package contract

### Outcome and requirement trace

Pi discovers an independent `@mopeyjellyfish/pi-typescript` package with five
skills and no fake runtime extension. The package is release-registered, packed
with all required resources, and included once in the private root profile.
This covers the working extension, Pi integration, installation boundary, and
automated-test requirements.

### Seam and files

Public seam: the package manifest and Pi skill discovery.

Likely files:

- `packages/typescript/package.json`;
- `packages/typescript/test/resources.test.ts`;
- `packages/typescript/{README.md,CHANGELOG.md,LICENSE}`;
- `package.json` and `package-lock.json`;
- `scripts/lib/packages.ts`;
- `test/tooling/packages.test.ts`;
- `release-please-config.json` and `.release-please-manifest.json`.

### Dependencies

Repository package contract, Pi package and skill documentation, and the
research evidence above.

### Execution lane and ownership

Serial in the current `feat/typescript-skills` worktree. One Worker owns all
writes.

### Red proof

Add the focused package resource test first. It must fail because the package
manifest, five skill entry points, required references, and packed resources do
not yet exist or are not yet integrated.

### Green proof and checks

Create the minimum skill-only package and root integration needed to pass:

```sh
npm test -- --run packages/typescript/test/resources.test.ts test/tooling/packages.test.ts
```

Update the root lockfile through the repository's npm workflow. Package or root
metadata changes invalidate this focused proof, package validation, and source
smoke.

### Atomic commit and pull request

Part of `feat(pi-typescript): add opinionated TypeScript skills`, delivery unit
1, standalone pull request to the repository default branch.

### Done when

- Pi resolves exactly five named skills from `./skills`.
- The package contains no extension entrypoint, runtime dependency, fake source
  file, or TypeScript configuration.
- Package, release, root-profile, lockfile, and packed-resource contracts agree.

## [ ] 002 — Core idiomatic TypeScript workflow

### Outcome and requirement trace

The `typescript` skill guides normal `.ts` and `.tsx` implementation toward
JavaScript-native, compiler-assisted TypeScript. It counters enterprise-style
layering, unsafe escape hatches, invalid state models, duplicated value/type
sources, and delayed typechecking. Its activation description targets
substantial TypeScript implementation, review, debugging, and refactoring
without injecting detailed guidance into unrelated prompts.

### Seam and files

Public seam: `/skill:typescript` and contextual activation through the skill
description.

Files:

- `packages/typescript/skills/typescript/SKILL.md`;
- `packages/typescript/skills/typescript/references/{inference,boundaries,unions,narrowing,generics,assertions,errors,async,modules,api-design}.md`;
- focused assertions in `packages/typescript/test/resources.test.ts`.

### Dependencies

Slice 001 and the Microsoft, Effective TypeScript, Matt Pocock, and
typescript-eslint evidence.

### Execution lane and ownership

Serial in the current task worktree with the same Worker.

### Red proof

Extend the focused resource test with the core philosophy, repository-inspection
workflow, progressive-disclosure links, strictness calibration, continuous
verification loop, and portable target-repository boundary. Confirm that the
new assertions fail before adding the skill resources.

### Green proof and checks

Add a compact `SKILL.md` with high-priority rules and an ordered workflow. Put
examples and edge cases in the ten references. Run the focused package test.
Changes to the core skill or its references invalidate this proof.

### Atomic commit and pull request

Part of the delivery unit 1 feature commit and standalone pull request.

### Done when

- The core skill states that TypeScript is not Java or C# with structural typing.
- It prefers inference locally, explicit meaningful boundaries, `unknown`,
  narrowing, parsing, discriminated unions, canonical runtime values,
  `satisfies`, narrow exports, and demonstrated abstractions.
- It treats compiler failures as design feedback and requires continuous
  typechecking and targeted tests with repository-native commands.
- It recommends `strict` for new projects, identifies separately opted-in
  strictness flags accurately, and gives existing projects an incremental path.

## [ ] 003 — Focused library, testing, review, and modernization methods

### Outcome and requirement trace

Four specialist skills provide focused workflows for reusable libraries,
behavior and type testing, prioritized review, and incremental legacy
modernization. Each main file remains short and discloses only the references
needed for the current branch.

### Seam and files

Public seams:

- `/skill:typescript-library`;
- `/skill:typescript-testing`;
- `/skill:typescript-review`;
- `/skill:typescript-modernize`.

Files under `packages/typescript/skills/`:

- `typescript-library/SKILL.md` and six requested references;
- `typescript-testing/SKILL.md` and four requested references;
- `typescript-review/SKILL.md` and four requested references;
- `typescript-modernize/SKILL.md` and five requested references;
- focused assertions in `packages/typescript/test/resources.test.ts`.

### Dependencies

Slices 001 and 002. Library guidance also uses Anthony Fu and Sindre Sorhus
sources. Review and tooling guidance uses typescript-eslint as the executable
layer.

### Execution lane and ownership

Serial in the current task worktree with the same Worker.

### Red proof

Add focused contract assertions for each specialist workflow before its
resources. The assertions cover the PRD's priority order, repository adaptation,
public API and ESM concerns, runtime-versus-static testing, and incremental
modernization boundaries.

### Green proof and checks

Implement the smallest original skill and reference set that passes the focused
resource test. Do not mandate a package manager, test runner, bundler, runtime
validator, formatter, linter, monorepo tool, or dependency-injection framework.
Run the focused package test after each coherent specialist skill.

### Atomic commit and pull request

Part of the delivery unit 1 feature commit and standalone pull request.

### Done when

- Library guidance covers minimal exports, package exports, native ESM when the
  target supports it, public type stability, dependency-type leakage,
  portability, compatibility, and exported-type tests.
- Testing guidance adapts to the target runner and separates runtime behavior,
  boundary validation, and type-level tests.
- Review guidance orders findings by concrete impact and detects the named
  unsafe typing, state, async, architecture, and export problems without
  repeating tool output.
- Modernization guidance uses small reviewable steps with objective before/after
  evidence and avoids broad rewrites or blind global strictness changes.

## [ ] 004 — Source-backed user documentation and stable-unit verification

### Outcome and requirement trace

Users can install the package, invoke each Pi-native skill command, understand
the philosophy and source hierarchy, and follow realistic examples. The exact
packed package and root profile load successfully.

### Seam and files

Public seam: `packages/typescript/README.md`, packed package contents, and Pi
source discovery.

Likely files:

- `packages/typescript/README.md`;
- `packages/typescript/test/resources.test.ts`;
- root README only if the private profile needs a concise package entry;
- all metadata and resource files from prior slices.

### Dependencies

Slices 001-003.

### Execution lane and ownership

Serial in the current task worktree with the same Worker.

### Red proof

The focused package test initially fails on missing install instructions,
Pi-native `/skill:<name>` examples, source URLs and revisions, source-authority
classification, and packed reference documents.

### Green proof and checks

Document installation, all five entry points, contextual activation, examples,
source hierarchy, strictness caveats, and repository-aware behavior. Verify in
this order:

```sh
npm test -- --run packages/typescript/test/resources.test.ts test/tooling/packages.test.ts
npm run smoke:source
npm run check
```

After the diff freezes, select one formal fixed-diff review because this adds a
public package and broad agent behavior. The Reviewer checks intent,
source-attribution safety, skill clarity, portability, package boundaries, and
maintainability. The parent inspects the final diff for release, dependency,
artifact, and copyright hygiene. Any final edit invalidates the affected
focused proof and the final repository gate; architecture or accepted-scope
changes also invalidate review evidence.

### Atomic commit and pull request

Complete `feat(pi-typescript): add opinionated TypeScript skills` and publish
delivery unit 1 as one standalone pull request.

### Done when

- The README documents philosophy, authoritative and practitioner sources,
  installation, five commands, contextual activation, and example use.
- The package test and root package-contract test pass.
- `npm run smoke:source` and `npm run check` pass on the frozen diff.
- Formal review has no unresolved material findings.
- The final diff contains no copied substantial third-party text, undeclared
  dependency, generated artifact, local absolute path, or unrelated change.
