# Plan: Git-native feature flow

Resume by inspecting Git, then work the first unchecked slice. This plan is the
approved implementation contract for the pre-release Option B refactor.

## [x] 001 — Ship the reduced package contract

### Outcome

The installable package exposes one self-contained `shape` skill, one thin
`/shape` prompt, and two Markdown templates. No workflow engine or machine state
ships.

### Pitch trace

- [Solution](pitch.md#solution)
- [Fixed decisions](pitch.md#fixed-decisions)
- **AC-001**, **AC-002**, **AC-003**, **AC-004**, and **AC-005**

### Implementation

First replace `packages/feature-flow/test/resources.test.ts` with a small
structural contract and observe it fail against the old package. Rewrite the
skill, prompt, pitch template, plan template, README, and package manifest.
Delete the executable helper, its behavior suite, the machine-state template,
all phase references, and maintainer evaluation document. Restore the changelog
to HEAD because Release Please owns it. Add no dependencies or compatibility
layer.

### Validation

Run the focused workspace test. Inspect the dry-run package paths and confirm the
runtime contains only the intended skill, prompt, templates, and package docs.

### Done when

The focused test is green and no deleted workflow mechanism is shipped.

## [x] 002 — Migrate the self-hosting feature

### Outcome

This feature dogfoods the two-file workflow and carries no duplicate state or
archive copies.

### Pitch trace

- [Solution](pitch.md#solution)
- [No-gos](pitch.md#no-gos)
- **AC-006**

### Implementation

Rewrite `pitch.md` around the approved Git-native decisions and exact nine H2
headings. Use this file as the single implementation plan. Delete the old state
file, archived pitch, current per-slice plans, and archived per-slice plans. Git
retains their history.

### Validation

Confirm this directory contains exactly `pitch.md` and `plan.md`, and that both
remain useful without the deleted implementation.

### Done when

Only the two approved Markdown artifacts remain.

## [x] 003 — Verify package and live behavior

### Outcome

Automated and manual evidence shows the smaller package loads, resumes, and
reloads without stale resources.

### Pitch trace

- [Acceptance criteria](pitch.md#acceptance-criteria)
- **AC-007**

### Implementation

Run focused tests, the full repository check, security checks, packed/source
smoke, and `git diff --check`. Start deterministic Pi in this worktree with only
the package loaded, exercise `/shape` against this plan, reload while idle, and
confirm the reduced behavior remains without duplicate registrations.

### Validation

Report exact commands and results, inspect the final diff and source-control
state, and obtain a fresh independent review. Do not stage or commit.

### Done when

Every required check passes, review is blocker-free, the live package resumes
from this plan, and no files are staged.

## [x] 004 — Write clear pitches and plans

### Outcome

Pi can apply pragmatic ASD-STE100 rules to general human-facing text. The shape
workflow uses those rules for pitches and plans without changing their
contracts.

### Pitch trace

- [Solution](pitch.md#solution)
- [Fixed decisions](pitch.md#fixed-decisions)
- **AC-008**

### Implementation

Add an independent `simple-english` skill package with pragmatic ASD-STE100
rules and focused references. Register its release metadata and aggregate
discovery. Update the shape skill to revise completed pitch and plan content
while preserving required structure and technical text.

### Validation

Run the new package test, the feature-flow resource test, package validation,
security checks, source and packed smoke, and the full repository check. Review
the rules, compliance caveat, package boundary, and shape integration.

### Done when

The aggregate and standalone package load the skill, feature-flow requires it at
the correct authoring steps, all checks pass, and independent review has no
blockers.

## [x] 005 — Clarify intent before pitch approval

### Outcome

The shape workflow efficiently challenges unclear intent before research,
resolves research-backed decisions afterward, and confirms the complete pitch
with the human.

### Pitch trace

- [Solution](pitch.md#solution)
- [Fixed decisions](pitch.md#fixed-decisions)
- **AC-009**

### Implementation

Use the `question` tool for an initial grouped discovery pass before worktree
routing. Base research on those answers. Use a second grouped pass to resolve the
pitch decisions, then attach the complete reviewed pitch to a final approval
question.

### Validation

Extend the feature-flow resource test for the required ordering, grouped question
calls, and full-document approval. Run the focused test and required repository
checks. Review the workflow for useful challenge without a fixed questionnaire
or serial interrogation.

### Done when

The skill enforces question, research, question, and full-pitch approval in that
order, and all checks and independent review pass.
