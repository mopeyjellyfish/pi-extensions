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
