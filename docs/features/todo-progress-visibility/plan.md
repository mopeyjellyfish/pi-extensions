---
status: accepted
---

# Plan: Visible nested Todo progress

Implement the accepted [pitch](pitch.md) as four serial slices in one delivery
unit. The user approved this complete plan before implementation begins.
The pitch is committed locally as `99189ca`.

## Review evidence

- **Applicability:** `not applicable`. No Go-targeted behavior or guidance changes.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

Optional planning advice was not requested. The parent owns this plan. Require
one fresh fixed-diff Reviewer for the completed implementation because state,
replay, lifecycle, and an independently installed consumer change.

## Execution mode

**Accept-all implementation**, explicitly confirmed by whole-plan approval.
Approval authorizes this named plan's bounded implementation, verification,
local commits, push, and one ready pull request. Do not ask routine continuation
questions between its four slices. Pause for failed gates, material review
findings, unavailable retained-run continuation, material forecast variance, or
changes to accepted intent, delivery boundaries, dependencies, or authority.

Approval never authorizes merge, release, deployment, destructive cleanup,
branch deletion, force push, or unrelated changes.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                          | Pull request base | Dependencies | Checks                     | Ownership                        | Integration point         | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ------------------------------- | ----------------- | ------------ | -------------------------- | -------------------------------- | ------------------------- | ---------- | ------------ |
| 1             | standalone | standalone     | `feat/todo-progress-visibility` | `main`            | none         | Focused proof, final gates | One retained Worker, serial lane | Final frozen feature tree | One PR     | No stack     |

Use the current isolated linked worktree. Keep a sole writer. The pitch, plan,
and implementation share this delivery unit's publication. Use installed
`commit` and `open-pr` methods. No GitHub stack or parallel implementation lanes
are needed. Atomic commits can follow the four coherent changes without adding
review or publication boundaries.

## Critical path, dependencies, and lanes

Execute `001 → 002 → 003 → 004 → final acceptance → fixed review/checks → publication`.
All slices share the Todo interface or its delivery contract, so serialize them.
One Worker implements slice 001 and is retained for the remaining slices and
permitted repairs. The parent verifies each result before continuation.

Forecast one implementation lane, four named slice handoffs, one integration
point, one full fixed-diff review, and one final full gate against a frozen tree.
The broad gates are `npm run check`, source loading, and real Pi acceptance.
Expect changes in the two extension entrypoints and their nearest tests, the
Status Line formatter, three package READMEs, Engineering guidance, and the
private Worker guidance. Small package-private files are permitted when they
improve change locality. Do not add an integration service or generic tree engine.

The forecast is a scope and coordination guide, not a tool, token, turn, or line
budget. Report material growth and return control before expanding scope.

### Setup and applicable methods

Setup succeeded with Node `v24.18.0`, Go `go1.26.5`, and
`npm ci --ignore-scripts`. Verify inherited tools and this unchanged fingerprint
before reusing setup:

| File                | SHA-256                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `.nvmrc`            | `8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48` |
| `.gvmrc`            | `9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566` |
| `package-lock.json` | `f0d7e244d07b346aa3670f0f28f513d0e03dd5a5c22bd0e0b49a7fd83eb430d1` |

Baseline focused Todo tests passed, 16/16. The accepted-pitch tree passed
`npm run check`, including 881 tests and source/packed/root smoke. This evidence
is baseline only, not implementation acceptance. Setup reported existing audit
vulnerabilities, including one high. Do not change dependencies in this scope.

Worker applies `test-driven-development`, `typescript`, `typescript-library`,
`typescript-testing`, and `codebase-design` at the public Todo and summary seams.
Reviewer applies target-repository instructions and `typescript-review`.
This is an existing terminal interface. Use its theme and glyphs, real terminal
rendering proof, and width checks. Browser methods and generated images are not
applicable.

### Validation and invalidation map

| Changed surface             | Focused proof                                                        | Affected proof                                   | Final proof                                          |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Todo tree or replay         | `npm --workspace @mopeyjellyfish/pi-todo test`                       | Todo typecheck and relevant type-aware lint      | Branch/reload acceptance, source smoke, full check   |
| Widget or result rendering  | Todo tests at representative widths                                  | Complete tree and RPC output                     | Live active-path/overflow acceptance, full check     |
| Summary or Status Line      | Todo tests and `npm --workspace @mopeyjellyfish/pi-status-line test` | Status Line typecheck, legacy/new consumer cases | Loadability and live integration, full check         |
| Context reminder            | Todo hook tests                                                      | Cancellation, tool-disabled and branch cases     | Real Pi reminder/no-extra-run acceptance, full check |
| Guidance and slice handoffs | Text review, formatter, Markdown lint                                | Recorded representative slice-handoff acceptance | Profile discovery/reload, full check                 |

Run focused checks while developing. Do not add Markdown-content tests or custom
prose-validation scripts. Run final source smoke and `npm run check` only after
implementation and acceptance repairs freeze. Final checks and the read-only
Reviewer may run concurrently on that exact tree. Do not run a composite check
alongside its constituent commands. Reuse proof only while its covered surface,
commands, setup fingerprint, base `HEAD`, and approved path set remain unchanged.

## Interface decisions

### Bounded tree and mutation semantics

Keep the tool actions `list`, `add`, `update`, `remove`, and `clear`.
Add optional `parentId` to `add`. Existing `items: string[]` creates roots without
that field. The field applies to the whole addition batch. Every node has a
stable ID, text, status, and optional parent ID. Include the relationship in
agent-facing text and structured output.

Do not support reparenting in this version. Parent links are fixed at creation.
Validate restored data for missing parents, cycles, depth above three levels,
invalid IDs, and invalid closure. Retain the 100-node total limit and existing
text limit. Sibling names are unique after existing text normalization. Different
parents can reuse names such as “Run focused tests”.

Store explicit statuses, not inferred completion. Permit at most one explicitly
`in_progress` node. A node with open descendants cannot be the active work item.
Its active descendant makes the ancestor visually active. A node whose descendants
are all closed can become active for its own final verification.
Starting another actionable node keeps existing single-active behavior by
returning the prior explicitly active node to pending.

Adding children to an active node requires returning that node to pending first.
Adding open children to a closed node is rejected. Completing a node requires
all descendants to be completed or cancelled in the resulting atomic state.
Reopening a descendant requires reopening any closed ancestors in the same
atomic update. Do not reopen ancestors implicitly.

An explicit group cancellation cancels its still-open descendants. Preserve
already completed or cancelled descendants. Include all changed IDs in the
result. This cascade is authorized by the explicit cancellation, not by a
rendering rule or completion heuristic.

Removing a parent requires naming its complete remaining subtree in `ids`.
Otherwise reject the operation. `clear` removes only closed subtrees whose roots
have no surviving parent. Keep closed descendants under an open parent so local
progress remains useful. `clear(all: true)` remains the explicit whole-tree clear.
IDs remain monotonic after removal and clearing.

Use a version-2 persisted snapshot and dedicated versioned custom-entry key.
Normalize valid version-1 custom entries and legacy tool-result snapshots into
flat version-2 roots. Preserve branch order across mixed formats, next IDs, and
revisions. Historical version-1 tool results must still render after upgrade.
Invalid entries must not replace the latest valid state.

### Counts, rendering, and summary compatibility

For each group, count immediate children only: completed, cancelled, and total.
Use “closed” only for completed plus cancelled, and expose cancellation separately.
Root progress counts roots only. No overall percentage counts both parents and
children as independent outcomes.

Render the active ancestor path before applying the existing eight-row widget
budget. Fill remaining rows with useful neighboring work, retaining each shown
node's ancestor context. Keep overflow explicit. Full views use a tree traversal
with sibling ordering that cannot move a node away from its parent.
At narrow widths, keep the current step recognizable without uncontrolled wrapping.
Use terminal display-width helpers, not plain character length, for width handling.

Publish a version-2 summary on `mopeyjellyfish:pi-todo:summary:v2`.
The bounded payload has version 2, root progress, and an optional current path.
Each path node carries its title, display status, and optional immediate-child
progress. The path has at most three nodes. Pending fallback selects an actionable
node, not a broad group with open descendants.

Continue emitting the version-1 channel for existing consumers. Its counts use
roots, and its current text identifies the current work with bounded context.
The updated Status Line prefers valid version-2 data and accepts version 1 when
version 2 is absent. Keep the consumer schema package-local. Do not import Todo
source or add a cross-package runtime dependency. Malformed or stale events must
not restore the wrong session's display. Clear both owned summaries on shutdown
and empty-state restoration.

Status Line shows the actionable title and nearest slice context at usable widths.
Use the deepest available group counts for local progress, with root progress as
fallback. At narrow widths, drop ancestors before the active title. Keep existing
whole-footer width policy and the no-duplicate standalone-status behavior.

### Reminder behavior

Use Pi's documented `context` hook to add one ephemeral, hidden, model-visible
reminder to the returned transcript. Do not persist the reminder in the session.
Do not use `sendMessage` to trigger a model run or settlement continuation.
Preserve all other messages, including tool-call/result relationships.

Use current in-memory restored state. Include the active path with IDs, relevant
local counts, and the instruction to update Todo before changing steps and after
verified results. If open work has no active actionable item, include a bounded
missing-active reminder. Do not warn merely because all nodes are closed.

Remove only this extension's own prior ephemeral reminder from the input before
adding the current one. Bound the reminder to a compact fixed-size output.
Do not include the entire tree. Add no reminder when the tree is empty, all work
is closed, or `todo` is not in the active tool set. Do not guess a user's task
complexity from their prompt. Empty-tree compliance comes from tool guidance.

### Parent-owned delegated tracking

Engineering guidance creates one delivery root, names every accepted slice, and
expands concrete steps for the active slice. Final verification, review, and
publication remain separate named work. Preserve unrelated session trees.
Tracking is a mirror of accepted intent, not a saved replacement plan.

Before the delegated slice starts, the parent activates its named delegated step.
The Worker receives only that slice's outcome, allowed paths, focused proof, and
stop conditions. Return after that slice. The parent inspects evidence, closes
verified work, and resumes the same retained Worker for the next slice.
Do not give the initial Worker all slices behind one broad visible item.

The existing `implement` method limits repair resumes. Amend it to distinguish
planned slice continuation from defect repair without weakening the repair or
pause rules. Check that the host reports the latest run as resumable before each
continuation. If not resumable, pause and report the visibility limit. Do not
launch a replacement writer or silently combine the remaining slices.

The private Worker tool allowlist currently omits `todo`. Do not add child Todo
mirroring just to make tracking appear shared. Worker guidance returns the exact
slice identity and red/green evidence. The parent updates its own tree. Independent
Engineering installs use available Todo hierarchy or report an honest flat/text
fallback without assuming this private profile.

## [ ] 001 — Create and restore a safe three-level Todo tree

### Outcome and requirement trace

Create delivery → slice → step through the public tool. Preserve old flat calls
and branch replay. Covers AC-001, AC-002, AC-003, and AC-006.

### Seam and files

- `packages/todo/src/index.ts`, with small package-private helpers only if useful.
- `packages/todo/test/index.test.ts` and focused executable test files if needed.
- `packages/todo/README.md` for mutation, status, and persistence contracts.

The public tool factory remains the caller seam. Keep tree validation and
persistence normalization inside Todo rather than duplicating rules in callers.

### Dependencies

None. Use the interface decisions above.

### Execution lane and ownership

Serial lane, one Worker in the existing task worktree. Parent owns final gates.

### Red proof

Add a public-tool test that creates a root, seven slice children, and step
children under one slice. Assert stable IDs and parent relationships.
The test must fail because `parentId` is unsupported, not because setup is absent.

Then add focused failing behaviors before each mutation or replay change.
Use synthetic version-1 and version-2 entries rather than document fixtures.

### Green proof and checks

Pass Todo tests for valid hierarchy, sibling-name reuse, atomic invalid calls,
active-path invariants, explicit completion, cancellation, reopening, removal,
clearing, monotonic IDs, historical rendering, and mixed-format branch replay.
Include abort/no-op behavior and rejected mutations without persisted entries.
Run Todo typecheck and affected type-aware lint as needed.

State changes invalidate later rendering, summary, and reminder proof.

### Atomic commit and pull request

Proposed unit: `feat(pi-todo): support bounded nested work items`.
Delivery unit 1, existing branch, base `main`, standalone PR.

### Done when

The public tool and persisted state satisfy the accepted tree contract. Focused
proof passes, and the parent verifies evidence before continuing the same Worker.

## [ ] 002 — Show the active path on every progress surface

### Outcome and requirement trace

The user can identify the current delivery, slice, and step without asking.
Full and compact views preserve hierarchy and honest local counts.
Covers AC-004, AC-005, and UI portions of AC-006.

### Seam and files

- Todo source, tests, and README from slice 001.
- `packages/status-line/src/index.ts` and `packages/status-line/src/powerline.ts`.
- `packages/status-line/test/index.test.ts` and `packages/status-line/test/powerline.test.ts`.
- `packages/status-line/README.md`.

Use the event-bus summary as the consumer seam. Preserve package independence.

### Dependencies

Slice 001's normalized hierarchy and mutation semantics.

### Execution lane and ownership

Same serial lane and retained Worker. No second UI writer.

### Red proof

Through the public tool and registered widget factory, create an active step
behind more than eight rows. Assert the active ancestor path remains visible.
The current flat renderer must fail this assertion for the intended reason.
Add a Status Line test for a synthetic version-2 path and local progress.

### Green proof and checks

Pass Todo and Status Line workspace tests. Cover inactive/pending/all-closed
states, cancellation counts, overflow, theme changes, long titles, narrow widths,
Unicode display width, legacy results, complete `/todos`, RPC, and non-UI modes.
Test version-1-only consumers, version-2 preference, malformed events, empty-state
clearing, shutdown, and duplicate standalone status prevention.

Record a live Pi rendering comparison for active path, overflow, and narrow
terminal width. Resolve material mismatches before final acceptance. No browser
or generated-image proof is required for this terminal surface.

Summary edits invalidate both package tests. Formatting-only guidance changes
do not invalidate executable state proof.

### Atomic commit and pull request

Two package-scoped atomic commits are permitted for the compatible producer and
consumer: `feat(pi-todo): show active nested progress` and
`feat(pi-status-line): show nested Todo context`. Keep both in delivery unit 1.

### Done when

The compact widget cannot hide the active path, complete views remain readable,
and new and legacy summary consumers have passing focused evidence.

## [ ] 003 — Remind models of current tracking without extra runs

### Outcome and requirement trace

A model receives a bounded current-state reminder while tracked work is open.
Reminders do not create session noise, hard gates, or automatic continuation.
Covers AC-007 and runtime portions of AC-006.

### Seam and files

- Todo source, registered event hooks, and nearest tests.
- `packages/todo/README.md` for reminder behavior and its limits.

Use the documented Pi 1.0.3 `context` hook as the model-visible seam.

### Dependencies

Slice 001's replay state and slice 002's current-path selection.

### Execution lane and ownership

Same serial lane and retained Worker.

### Red proof

Invoke the registered context hook after public Todo mutations. Assert that the
returned model transcript contains one current reminder. The existing factory
must fail because no context reminder is registered.

### Green proof and checks

Pass Todo tests for current IDs/path, missing-active guidance, state updates,
branch changes, replay, ephemeral replacement, preserved transcript ordering,
empty/closed/tool-disabled suppression, size bound, and non-UI use.
Assert no extra session entries or queued model turns from reminder callbacks.
Test that ordinary tool use and paused open work remain permitted.

Do not test shipped guidance wording. Runtime-message behavior is executable
output and can use small behavior-focused assertions.

### Atomic commit and pull request

Proposed unit: `feat(pi-todo): remind models of active work`.
Delivery unit 1, same standalone PR.

### Done when

Bounded reminder behavior passes through the registered hook and requires no
background process, timer, cross-session service, or automatic model run.

## [ ] 004 — Track named slices through delegated delivery

### Outcome and requirement trace

Engineering work uses delivery → slice → step and returns to the parent between
named slice handoffs. The same Worker continues within one delivery unit.
Covers AC-008, AC-009, and the model-use portions of AC-001 and AC-003.

### Seam and files

- Todo tool `promptGuidelines` and README.
- `packages/engineering/skills/implement/SKILL.md` and `packages/engineering/README.md`.
- `agents/worker.md` for the private slice-identity/evidence handoff.
- `packages/feature-flow/skills/planning-changes/SKILL.md` and package README only
  where named-slice handoff guidance is necessary.
- Feature acceptance notes under `docs/features/todo-progress-visibility/`.

Production guidance remains host-neutral and target-repository-aware. Do not
introduce a production package just to host instructions or tests.

### Dependencies

Slices 001–003. This slice changes guidance, not a new delegated runtime.

### Execution lane and ownership

Same serial lane and retained Worker. Parent owns integration and real-session
acceptance. Keep final review and publication visible as unfinished work.

### Red proof

Use before-state evidence: current tool guidance does not require a slice tree,
and current `implement` can hand off a multi-slice delivery without parent
progress updates. Do not manufacture Markdown unit tests.

### Green proof and checks

Review all changed guidance for one consistent tracking contract, continuation
versus repair semantics, honest fallback, and preserved authority. Run formatting
and Markdown lint. Runtime registration checks may cover the presence of tool
guidance without asserting exact prose.

Start deterministic Pi from this worktree with ambient resources disabled:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Inspect and accept project trust. Confirm the expected extensions and skills load
without duplicate registrations. Run focused tests before idle `/reload`.
After reload, exercise the changed Todo behavior and verify the edited worktree
resources, not the originally installed copy. Use the pinned dependency and
preserve user-selected parent settings.

In a bounded seven-slice acceptance session, verify:

1. The model creates seven named slices, not one broad execution leaf.
2. Starting a step updates the persistent active path before the work runs.
3. Verified results advance local progress without inferring group completion.
4. Pause/resume and branch navigation preserve honest unfinished work.
5. A delegated slice shows its named delegated step before launch. Two adjacent
   slices use the same retained Worker, with parent updates between handoffs.
6. An unavailable-continuation case reports the limit and pauses without a new writer.
7. Reminders reach the model without duplicate history or extra model runs.
8. Final checks, review, and publication remain named work after slice coding ends.

Use a small bounded test task or synthetic hierarchy. Do not authorize unrelated
production edits to obtain this evidence. Record observed results and limitations
without sessions, credentials, local absolute paths, or delegated runtime files.
If the live model/provider or terminal session is unavailable, report unmet proof
and pause for the required acceptance step. Do not claim automatic tests prove
model compliance.

### Atomic commit and pull request

Use package-owned commits for changed Engineering, Todo guidance, and any
necessary Feature Flow guidance. Private agent/acceptance notes can form a root
`docs` commit. All remain in delivery unit 1's single PR.

### Done when

Text review and live acceptance prove the named tracking and handoff behavior.
No old guidance still demands premature closure or permits a broad multi-slice
handoff without visible progress. Unmet proof is reported, not marked complete.

## Final integration, assurance, and publication

After all four slices, inspect the complete diff for package independence,
backward compatibility, type safety, lifecycle cleanup, limits, artifact hygiene,
and clear READMEs. Resolve the terminal mismatch ledger from slice 002.

Run focused Todo and Status Line tests, then `npm run smoke:source` and
`npm run check` against the final frozen implementation tree. Changes to GitHub
Actions, runtimes, or dependencies are not planned. If such changes become
necessary, pause for scope approval and add the required workflow/security gates.

Run one fresh fixed-diff Reviewer with accepted pitch/plan, exact base `HEAD`,
changed paths, frozen-tree identifier, setup fingerprint, and focused evidence.
Reviewer does not rerun deterministic gates. Use QA only for failed-command
investigation or ambiguous terminal acceptance. If both are selected, use the
same frozen boundary and join their repair packet before touching the tree.

Accept-all pauses for material findings. Any permitted repair reuses the retained
Worker or follows the explicitly approved recovery route. Rerun only invalidated
proof during repair, then attest the final complete required gates and tree.

Use installed `commit` and `open-pr` methods to publish this branch once all
selected gates and live acceptance pass. PR title:
`feat(pi-todo): add visible nested work tracking`.
Report local/remote delivery state, final checks, residual risks, and any skipped
action. Do not mark the delivery root complete before its authorized delivery
work finishes. Do not merge or clean up the worktree.
