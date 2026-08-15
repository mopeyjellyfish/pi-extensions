# Minimal Pi Profile Plan

**Status:** Completed

**Date:** 2026-08-15

**Owner:** Repository maintainer

**Change type:** Repository workflow and private aggregate refactor

## Overview

Make the private Git aggregate a small, default-first Pi profile. It will load
Pi's native tools, the repository's `question` extension, and the Shape, plan,
and implement lifecycle only. Every production package remains independently
installable, but optional tools no longer enter every session through the root
manifest.

The change also removes the repository's custom subagent overlay and external
FFF and Ponytail runtime dependencies. The lifecycle skills will prefer direct
parent execution and use delegation only when the caller explicitly requests it
or a bounded independent lane clearly earns the extra context and token cost.

## Problem

The current private aggregate loads every repository extension, every skill and
prompt, FFF, Ponytail, and ten custom subagent definitions. This creates a large
always-available tool and instruction surface. Recent sessions also show stale
custom agent tool allowlists causing delegated work to fail before useful work
starts. The added routing, context compression, and command rewriting have not
shown a reliable end-to-end quality or token advantage over Pi's native tools
and compaction for complex coding tasks.

The repository needs a useful default, not an exhaustive showcase. Optional
packages must stay available without being coupled to the default session.

## Requirements

| ID  | Requirement                                                                                                                                                      | Proof                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| R1  | The private root manifest loads only the question extension and the Shape, plan, and implement resources.                                                        | Root profile contract test and source smoke.                                                     |
| R2  | FFF, Ponytail, and custom root subagent definitions are absent from the default profile.                                                                         | Manifest/lockfile assertions and removal of `agents/`.                                           |
| R3  | All production packages remain independently installable and validated.                                                                                          | Existing package discovery, packing, and smoke checks.                                           |
| R4  | Shape creates an accepted pitch, planning turns it into serial vertical slices, and implement delivers those slices with focused checks.                         | Package resource tests and skill inspection.                                                     |
| R5  | Direct execution is the default; delegation is optional, bounded, and uses host-provided roles rather than repository overrides.                                 | Lifecycle skill contract tests.                                                                  |
| R6  | Documentation explains the minimal default, optional package installation, native compaction posture, and migration away from global context/rewriting defaults. | README and architecture/package documentation review.                                            |
| R7  | The root profile remains deterministic when loaded with the pinned Pi source-development command.                                                                | `npm run smoke:source` and manual reload acceptance when an interactive Pi session is available. |
| R8  | The maintainer migration identifies every remaining user-level Pi resource and the single-package target state.                                                  | README migration commands, configuration paths, and expected `pi list` output.                   |

## Scope

### In scope

- Change the private root Pi manifest from an all-packages aggregate to an
  explicit minimal profile.
- Remove root FFF and Ponytail dependencies and update the lockfile.
- Remove the ten custom subagent definitions and their dedicated contract test.
- Replace exhaustive-root validation with a small exact-profile contract while
  preserving independent package validation.
- Simplify the Shape, planning, and implement skills and their package docs.
- Update repository documentation for the new install and compaction posture.
- Document the one-time maintainer cleanup for separately installed
  context-mode, pi-subagents, RTK rewriting, and stale subagent settings.

### Out of scope

- Deleting or merging independently installable production packages.
- Changing Pi's native tools, compaction implementation, or provider transport.
- Editing the maintainer's global Pi settings. The docs will identify global
  context-mode and RTK auto-rewrite as migration actions, not mutate them.
- Adding a replacement orchestration extension or a new subagent framework.
- Building benchmark infrastructure. A separate measured evaluation can follow
  if the lean profile still underperforms.

## Repository context and research

- `package.json` currently uses package-wide globs and adds FFF, Ponytail, and
  `./agents` to every Git aggregate session.
- `scripts/lib/packages.ts` and `test/tooling/packages.test.ts` encode the old
  assumption that the root must include every production resource.
- The production-package boundary lives in `packages/README.md` and
  `docs/architecture.md`; both must distinguish independent package validation
  from the private default profile.
- Pi skills are discovered progressively, while extension tools and injected
  instructions enlarge the active session surface. Pi already compacts long
  sessions and retains a recent-context tail.
- OpenAI's current Codex guidance treats subagents as useful for clean,
  independent lanes and notes their extra token cost. They are not a default
  requirement for one coherent implementation stream.
- Local RTK counters measure rewritten command output, not complete task token
  use or delivered quality. The available cross-run comparison did not show a
  stable end-to-end benefit from RTK and showed substantially higher use with
  context-mode in the tested repository. This evidence is directional, not a
  universal benchmark.

## Key decisions

1. The root package is a curated profile, not an aggregate completeness check.
2. The exact default resources are:
   - `packages/question/src/index.ts`
   - `packages/feature-flow/skills/shape`
   - `packages/feature-flow/skills/planning-changes`
   - `packages/engineering/skills/implement`
   - the matching `shape`, `plan`, and `implement` prompt templates
3. Optional packages remain unchanged and independently installable.
4. The lifecycle is serial by default. A child is an exception for an explicit
   or demonstrably independent lane, and no custom role overlay is shipped.
5. Native Pi compaction is the baseline. Durable pitch and plan files preserve
   decisions across long work; no context replacement extension is required.
6. RTK and similar command rewriting are opt-in tools for measured large-output
   cases, not baseline requirements.
7. No compatibility shim preserves the old aggregate. Users who want another
   package install it explicitly.
8. The maintained user environment has one Pi package entry: this Git profile.
   Host-owned integrations such as Herdr remain outside it when their own
   installer manages an inert, host-gated bridge.

## Implementation units

### [x] Unit 1: Minimal root profile

**Goal:** Make the root manifest and validation express the exact lean profile.

**Requirements:** R1, R2, R3

**Dependencies:** None

**Execution mode:** Serial, one writer

**Test posture:** TDD using the root package contract tests

**Files:**

- `package.json`
- `package-lock.json`
- `scripts/lib/packages.ts`
- `scripts/smoke-packages.ts`
- `test/tooling/packages.test.ts`
- `test/tooling/subagents.test.ts`
- `agents/*.md`

**Approach:**

1. Change the package test to require the seven exact profile entries and reject
   unmanaged root entries.
2. Remove validation that compares the root against every package resource.
3. Keep discovery and validation of every production package as an independent
   contract.
4. Update the root manifest and root smoke assertions, remove external runtime
   dependencies, regenerate the lockfile, and delete the custom agent overlay
   and obsolete test.

**Scenarios:**

- The repository root validates with only the curated resources.
- A missing required root resource produces a precise error.
- An additional root resource produces a precise error.
- Every production package still validates and packs independently.

**Red signal:** The root contract test rejects the current package-wide globs,
external dependencies, and custom subagent configuration.

**Green signal:** The root contract accepts only the seven curated entries and
the independent production-package checks still pass.

**Verification:**

- `npm test -- --run test/tooling/packages.test.ts`
- `npm run packages:check`
- `npm run security:check`

### [x] Unit 2: Three-stage lifecycle

**Goal:** Keep pitch, plan, and implement useful without routine orchestration.

**Requirements:** R4, R5

**Dependencies:** Unit 1 defines the resources loaded by default.

**Execution mode:** Serial, direct parent execution

**Test posture:** TDD using package resource contract tests

**Files:**

- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/skills/shape/templates/plan.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/test/resources.test.ts`
- `packages/feature-flow/README.md`
- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/test/resources.test.ts`
- `packages/engineering/README.md`

**Approach:**

1. Make Shape produce a concise pitch with appetite, boundaries, risks, and
   explicit acceptance before planning.
2. Make planning produce the smallest ordered vertical slices with tests and
   verification, without waves, leases, or default fanout.
3. Make implement work through accepted slices directly, preserve TDD where
   behavior changes, run focused checks, and report exact evidence.
4. Mention optional delegation once: use a host-provided role only for a bounded
   independent lane, with the parent retaining synthesis and verification.

**Scenarios:**

- A fuzzy request stops for pitch acceptance before implementation.
- Accepted intent becomes an ordered, checkable plan.
- A bounded change can enter implement directly.
- A large coherent slice stays with the parent rather than being split merely
  because it is large.

**Red signal:** The resource tests expose lifecycle text that requires routine
subagents, parallel waves, writer leases, or FFF-specific tools.

**Green signal:** The resource tests prove the accepted pitch-to-plan-to-
implement handoff and direct-execution default without provider-specific role
definitions.

**Verification:**

- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- `npm --workspace @mopeyjellyfish/pi-engineering test`

### [x] Unit 3: Default-first documentation and reconciliation

**Goal:** Make installation and operating guidance match the lean profile.

**Requirements:** R3, R6, R7, R8

**Dependencies:** Units 1 and 2

**Execution mode:** Serial

**Test posture:** Existing documentation, package, and smoke checks

**Files:**

- `README.md`
- `packages/README.md`
- `docs/architecture.md`
- `AGENTS.md` only where repository guidance encodes the superseded aggregate
  contract

**Approach:**

1. Lead with the minimal Git profile and list optional packages by need.
2. Explain that native tools and native compaction are the baseline.
3. Document migration: update the Git profile; remove the separate context-mode
   and pi-subagents packages, context-mode MCP entry, RTK auto-rewrite, and
   stale subagent settings; then add a capability back only after a measured
   task-specific benefit.
4. Update live-development instructions so `-e .` means the curated profile and
   `-e packages/<name>` means one optional package.
5. Reconcile terminology and remove stale FFF/custom-agent guidance.

**Verification:**

- `npm run smoke:source`
- `npm run check`
- Inspect the final diff for package independence, dependency, and artifact
  hygiene.
- Run the documented manual `/reload` loop if an interactive trusted Pi session
  is available; otherwise report it as the only manual follow-up.

## System impact

```text
Git install
  -> private root profile
     -> Pi native tools and compaction
     -> question extension
     -> Shape -> plan -> implement

Optional need
  -> install one independent package
     -> LSP, Worktrunk, todo, status, web search, or another focused capability

Host-owned integration
  -> remains outside the profile when its installer owns an inert host-gated bridge
```

No production package API changes. The main compatibility change is deliberate:
a Git install no longer loads every package or the custom subagent definitions.

## Testing strategy

- Use contract tests for exact root resource selection and lifecycle wording.
- Keep existing package-level behavior tests and smoke tests as the integration
  boundary.
- Run focused tests after each unit, then the complete repository check once
  after the final edit.
- Because dependencies are removed, run the repository security check.

## Risks and mitigations

| Risk                                                                       | Mitigation                                                                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Existing Git-install users lose tools they assumed were bundled.           | Document the breaking profile change and exact package install path.                                   |
| A useful optional capability is removed from the default too aggressively. | Keep every package installable; add it back only with measured evidence.                               |
| Exact resource validation becomes brittle.                                 | The root profile is intentionally small and private; exact arrays are the simplest auditable contract. |
| Long tasks lose context without context-mode.                              | Use accepted pitch and plan files as durable anchors and Pi's native compaction as the baseline.       |
| Delegation quality falls without custom roles.                             | Direct execution is the default; optional host roles avoid stale repository tool allowlists.           |

## Documentation notes

- Use “private root profile” for the Git-installed default.
- Reserve “production package” for independently installable children of
  `packages/`.
- State evidence limits: token-reduction counters are not quality benchmarks.
- Do not promise that fewer tools always improve quality; present the lean setup
  as the baseline to compare against measured additions.

## Implementation evidence

- Unit 1 red: `npm test -- --run test/tooling/packages.test.ts` rejected the
  package-wide root globs, external extensions, and custom subagent manifest.
- Unit 1 green: the same test passed with the exact root profile; package
  validation and installed-profile smoke also passed.
- Unit 2 red: the focused feature-flow test rejected routine Worktrunk,
  subagent, lease, and parallel-wave requirements.
- Unit 2 green: both feature-flow and engineering resource suites passed with
  the direct parent lifecycle.
- Unit 3 used the documentation/configuration TDD exception. `npm run check`
  passed after the final documentation and contract edits.
- The follow-up user-install inventory found two separately installed packages
  (`context-mode` and `pi-subagents`), one context-mode MCP entry, one loose RTK
  rewrite extension, stale subagent overrides, and a Herdr-owned state bridge.
  The README now gives the exact single-package target and treats Herdr as the
  host-managed exception.
- `npm run security:check` passed after activating the `.gvmrc` toolchain.
- Manual interactive `/reload` acceptance remains a maintainer follow-up; the
  deterministic source and installed-profile Pi smoke tests passed.

## Sources

- Repository: `package.json`, `scripts/lib/packages.ts`, `packages/README.md`,
  `docs/architecture.md`, lifecycle skills, tests, and recent local subagent
  session failures inspected during research.
- Pinned Pi documentation and source in the installed `0.84.0` dependency for
  package discovery, skills, and compaction behavior.
- OpenAI Codex subagent guidance:
  <https://developers.openai.com/codex/agent-configuration/subagents>
- OpenAI latest model guidance:
  <https://developers.openai.com/api/docs/guides/latest-model>
