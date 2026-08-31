---
status: accepted
---

# Plan: Scalable Question lists and bulk `/improve` decisions

Complete this plan as one coordinated delivery. The accepted pitch is
`docs/features/improve-bulk-triage-actions/pitch.md` at commit `466a43f6`.
Implementation must preserve the Question and Engineering package boundaries.

## Review evidence

- **Applicability:** not applicable. The planned outcome does not change Go
  source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Independent plan review

- **Fixed draft:** the preapproval draft reviewed in run `7c709de1`.
- **Verdict:** revise.
- **Resolved blockers:** rebased onto current `origin/main`; reconciled grouped
  Track with `ticket-workflow`; obtained explicit caller approval of classify-each,
  confirm-once behavior; reapproved and recommitted the complete pitch.
- **Resolved material findings:** clarified the details-only 48,000-byte boundary
  and separate 8,000-byte model-content bound; added per-file coverage gates;
  required public limit documentation; recorded pitch-to-plan slice remapping.
- **Remaining evidence boundary:** the review predates these corrections and is not
  recorded as approval. The parent verified each correction against the current
  base. Planning permits one independent plan review, so the whole-plan approval
  is the next decision gate.

## Execution mode

The selected mode is **accept-all implementation**. Only approval of this whole
plan confirms that authority for the named branch and scope. The parent may
execute all four slices, run the named verification, repair review findings,
create the named commits, push the branch, and open or update one standalone pull
request without slice checkpoints.

A material forecast variance returns control to the caller. A change to delivery
boundaries or authority requires fresh approval. Approval never authorizes merge,
release, deployment, npm publication, provider billing, remote issue creation
without the exact-set confirmation, destructive cleanup, worktree removal, plain
force push, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                             | Pull request base                         | Dependencies                 | Checks                                                                                                                                      | Ownership                                                             | Integration point                                                                      | CI fan-out | Cascade cost                                                               |
| ------------- | ---------- | -------------- | ---------------------------------- | ----------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| 1             | standalone | standalone     | `feat/improve-bulk-triage-actions` | `origin/main` at accepted base `beea3711` | slices 001 → 002 → 003 → 004 | focused Question and Engineering tests; per-file coverage; package tests; typecheck; source and packed smoke; `npm run check`; final review | serial parent writer in `.worktrees/feat-improve-bulk-triage-actions` | Question's public tool contract consumed as optional capability by `/improve` guidance | 1          | low before publication; a later upstream rebase can invalidate final proof |

One delivery unit, branch, and standalone pull request is the smallest coherent
acceptance boundary. Question and Engineering remain independently installable,
and their package changes remain separate commits. Splitting pull requests would
make the requested `/improve` interaction depend on an unpublished Question
contract and would duplicate integration proof.

The accepted pitch and this plan share the implementation pull request. They do
not have independent merge value. Publish with `open-pr`; do not create a GitHub
stack.

## Critical path, dependencies, and lanes

The critical path is serial:

1. Define and prove the count-unbounded Question result contract.
2. Build the compact progress, option, and review viewports on that contract.
3. Update `/improve` to use bulk decisions, the scalable Question capability, and
   per-candidate `ticket-workflow` classification.
4. Freeze the integrated diff, verify it, review it, and publish it.

There are no parallel writing lanes. `packages/question` establishes the public
capability that the Engineering guidance describes. One writer avoids conflicting
changes across Question tests and across the `/improve` skill, report guide, and
resource tests.

Critical-path forecast:

- **Active lanes:** one serial implementation lane; independent read-only QA and
  formal review may run concurrently only after the diff is frozen.
- **Delivery units / pull requests:** 1 / 1.
- **Integration point:** the Question schema, validation error, result details,
  keyboard behavior, and public README contract used by the `/improve` guidance.
- **Expensive gates:** Question visual terminal evidence, source and packed smoke,
  root coverage, and `npm run check`.
- **Likely cascade cost:** low while local. A rebase, result-shape change, keybinding
  change, or Engineering label change invalidates focused and integration proof.

### Setup evidence

The worktree is already initialized with `npm ci --ignore-scripts`. Before the
first implementation command, verify this fingerprint and rerun setup only if it
is absent or stale:

- Node `v24.18.0` from `.nvmrc` SHA-256
  `8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48`.
- npm `11.16.0`.
- Go `go1.26.5 darwin/arm64` from `.gvmrc` SHA-256
  `9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566`.
- `package-lock.json` SHA-256
  `754c35d4a48d3b3b0fc800c4ffc66134722aadc610c3216a7cfad24d2bb21dff`.
- Vitest `4.1.10` under Node `v24.18.0`.
- Accepted-plan starting HEAD is this plan commit after approval; accepted pitch
  HEAD is `466a43f655a7cf4e66db8bd868f7bc9c15e76a21` on accepted base
  `beea3711cb6d51163d8028fdfb4461f4000105cf`.

Activate runtimes with:

```sh
nvm use
source "$HOME/.gvm/scripts/gvm"
source .gvmrc
```

If the selector or lockfile fingerprint changes, rerun
`npm ci --ignore-scripts`, record the new evidence, and invalidate all later
command evidence.

### Module design

Use two deep package-owned seams:

1. **Question result budget:** `results.ts` owns complete result construction,
   continuation signatures, aggregate JSON-byte preflight, deterministic text
   fitting, and the final size assertion. `bounds.ts` owns exported byte constants
   and UTF-8/JSON primitives. `schema.ts` owns structure and delegates aggregate
   validity instead of duplicating result-shape knowledge.
2. **Question viewport:** `QuestionDialog` owns interaction state and focus.
   `layout.ts` owns pure focused-window calculations, hidden-count metadata, and
   row fitting. Rendering consumes that view instead of constructing every hidden
   option or review row for every frame.

Do not expose `QuestionDialog` internals to Engineering. Engineering describes the
optional public `question` tool contract and retains direct-parent fallbacks. It
loads the existing `ticket-workflow` as the tracker-policy owner and must not
duplicate that policy. No runtime package dependency crosses from Engineering to
Question.

### Invalidation map

| Changed surface after proof                                                           | Evidence to rerun                                                                                                   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `bounds.ts`, `schema.ts`, `results.ts`, result types, or validation order             | slice 001 focused tests; full Question tests; Question typecheck; `npm run test:coverage`; Question pack inspection |
| `dialog.ts`, `layout.ts`, `state.ts`, keybindings, render strings, or TUI tests       | slice 002 focused tests; all Question tests; `npm run test:coverage`; narrow/wide/short visual states; source smoke |
| `rpc.ts` or RPC result/cancellation behavior                                          | Question RPC tests; aggregate-result tests; `npm run test:coverage`; source smoke                                   |
| `/improve` prompt, skill, Blueprint Ledger guide, Engineering README, or exact labels | Engineering resource tests; `ticket-workflow` integration assertions; markdown checks; source and packed smoke      |
| Any cross-package contract or README statement                                        | slices 001–003 integration checks; package tests; pack inspection                                                   |
| Any final repair, rebase, dependency metadata change, or runtime selector change      | affected focused and coverage proof plus all slice 004 final gates on the new HEAD/tree                             |

Do not reuse evidence after its covered surface changes. If coordination needs a
new package, dependency, protocol, branch, pull request, or writer lane, stop and
return to the caller before continuing.

## [ ] 001 — Count-unbounded Question contract with complete bounded results

### Outcome and requirement trace

Question accepts one or more questions and two or more options per question with
no fixed array maximum. It rejects a sanitized structure that cannot produce a
complete result below one exported aggregate details budget. Submitted,
cancelled, unavailable, and redirected details preserve all structural IDs,
selections, and continuation signatures. User-authored notes, custom answers, and
redirect text fit deterministically into the remaining budget with the existing
truncation marker.

Trace: AC-001 through AC-004 and the Question part of AC-009, AC-020, and AC-021.

### Seam and files

Public seam:

- `QuestionParameters`, `validateQuestions`, exported result-budget constant and
  validation behavior, `buildResult`, `restoreDraft`, and tool execution errors.

Expected files:

- `packages/question/src/bounds.ts`
- `packages/question/src/schema.ts`
- `packages/question/src/results.ts`
- `packages/question/src/types.ts`
- `packages/question/src/index.ts`
- `packages/question/test/question.test.ts`
- `packages/question/test/regressions.test.ts`
- `packages/question/test/final-regressions.test.ts`

Use an exact exported aggregate **result-details** budget of **48,000
JSON-encoded UTF-8 bytes**. The 48,000-byte measurement applies to `details`,
which is the structured result covered by the package's below-50-KB claim. The
model-facing text block remains a separate explicit bound of 8,000 UTF-8 bytes;
compact transcript rendering remains separately bounded at 320 bytes. Document
this measurement boundary instead of describing the complete tool-result envelope
as 48,000 bytes.

Preflight the largest structural details shape that the sanitized definition can
produce, including all answer entries, possible multi-select selections, labels,
and a redirected continuation snapshot. Exclude preview and document bodies
because they are display-only and do not enter details or continuation snapshots.
Keep their existing independent field limits.

The preflight error must use one stable form:

```text
Invalid question input: result details require <measured> JSON bytes; maximum is 48000
```

Result building must measure the final details object again. Allocate remaining
text bytes in stable questionnaire order. Keep structural fields and caller
labels complete. Bound only notes, custom answers, and redirect text, and include
`… [truncated]` whenever retained text is shortened. Throw an internal contract
error if the structural assertion is violated after successful preflight.

### Dependencies

Accepted pitch `466a43f6`; accepted base `beea3711`; setup fingerprint; existing
per-field bounds and continuation behavior. No prior implementation slice.

### Execution lane and ownership

`serial`. The parent is the sole writer in the active task worktree.

### Red proof

Add focused tests before source edits that show the current behavior fails:

1. TypeBox schema and `validateQuestions` reject five questions or five options.
   The intended test expects them to pass when below the aggregate budget.
2. A large-ID/label multi-select structure that exceeds 48,000 result bytes opens
   execution today. The intended test expects preflight rejection before UI/RPC
   calls and checks measured/allowed bytes.
3. Worst-case submitted and redirected states can exceed the intended aggregate
   result budget. The intended tests expect complete structural fields, bounded
   details, explicit text truncation, and deterministic allocation.
4. A count-unbounded redirected result cannot yet prove semantic restoration and
   one-use stale detection over the complete structure.

Run the narrow failing files and retain the expected assertion failures:

```sh
npm test -- --run packages/question/test/question.test.ts \
  packages/question/test/regressions.test.ts \
  packages/question/test/final-regressions.test.ts
```

A setup, compile, lint, timeout, or fixture failure is not accepted red proof.

### Green proof and checks

Implement the minimum aggregate contract and run:

```sh
npm test -- --run packages/question/test/question.test.ts \
  packages/question/test/regressions.test.ts \
  packages/question/test/final-regressions.test.ts
npm --workspace @mopeyjellyfish/pi-question run typecheck
npm --workspace @mopeyjellyfish/pi-question test
npm run test:coverage
```

Prove exact-boundary pass/fail behavior, Unicode JSON-byte measurement, duplicate
and reserved-label validation, no UI call before oversized rejection, complete
multi-select IDs and labels, cancelled/unavailable bounds, redirected snapshot
bounds, one-use branch-local continuation, stale/unknown errors, semantic option
restoration, and preview/document-insensitive restoration.

Any edit to the result budget, structural shape, labels, continuation signatures,
text allocation, or covered result branches invalidates the focused and per-file
coverage proof.

### Atomic commit and pull request

This slice is the contract half of
`feat(pi-question): support scalable questionnaires`. Keep it in the same Question
commit as slice 002 so the public count-unbounded schema never exists without a
usable scalable TUI. Delivery unit 1; standalone pull request to `origin/main`.

### Done when

- Schema metadata and runtime validation have no fixed question or option maximum.
- Aggregate preflight occurs before continuation lookup and before TUI/RPC calls.
- Every valid result details object is at most 48,000 JSON bytes.
- Structural fields remain complete and text truncation is explicit.
- Count-unbounded continuation behavior passes focused tests.
- The tool description, prompt guidance, schema metadata, exports, and README all
  advertise count-unbounded arrays, the 48,000-byte details budget, and separate
  model-content/compact-render bounds without retaining the old 1–4/2–4 claims.

## [ ] 002 — Compact progress and scalable Question viewports

### Outcome and requirement trace

The TUI implements accepted direction A: one stable-height compact progress
navigator, a focused option viewport with explicit hidden counts, and a scrollable
review viewport with sticky actions. Navigation works for large finite lists and
preserves documents, previews, editors, accessibility, inline/full-screen modes,
and RPC behavior.

Trace: AC-005 through AC-009 and the Question parts of AC-021 and AC-022.

### Seam and files

Public seam:

- `QuestionDialog` render and input behavior, injected Pi select keybindings,
  `walkRpc`, and the package README/tool description.

Expected files:

- `packages/question/src/dialog.ts`
- `packages/question/src/layout.ts`
- `packages/question/src/state.ts` if review offset belongs in shared state
- `packages/question/src/rpc.ts` only for count-unbounded cancellation regressions
- `packages/question/src/index.ts`
- `packages/question/test/question.test.ts`
- `packages/question/test/regressions.test.ts`
- `packages/question/test/final-regressions.test.ts`
- `packages/question/README.md`

Keep `QuestionDialog` as the interaction orchestrator. Add pure window calculations
to `layout.ts`; do not make tests depend on private rendering loops. Render only
the focused option window and visible review rows. The progress line must show
`Question <current> of <total>`, the sanitized current header, and the answered
count. Hidden markers must state exact earlier/later option counts.

Use `tui.select.pageUp` and `tui.select.pageDown` for option and review paging, and
`Key.home` / `Key.end` for first/last movement. Tab/Shift+Tab and left/right keep
question/review traversal. On the review tab, PageUp/PageDown and Home/End change
the review offset; up/down continue to move between sticky **Submit answers** and
**Chat about this…**. Document mode keeps its existing independent scroll offset.

### Dependencies

Slice 001 result/schema contract and the accepted compact-progress design evidence.
No `DESIGN.md` gate applies because the accepted pitch records this package-local
direction and the repository has no existing `DESIGN.md`.

### Execution lane and ownership

`serial`. The parent remains the sole writer in the active task worktree.

Use `frontend-development` for implementation, accepted
**A — Compact progress navigator** as the design direction,
`interface-design` for terminal product-UI craft, and `visual-validation` for
rendered evidence and the mismatch ledger. React, React Native, and view-transition
methods are not applicable.

### Red proof

Add focused behavior tests before source edits:

1. Forty-seven questions currently render an all-tabs strip instead of one compact
   progress line and exceed the intended stable header height.
2. A forty-option question currently builds every option row and cannot page or
   jump with Home/End through a visible option window with exact hidden counts.
3. A forty-seven-answer review currently relies on generic focus clipping and has
   no independent review offset, page movement, or first/last jump.
4. Short/narrow and wide/document states do not yet prove sticky review actions,
   cursor bounds, stable sentinels, IME cursor placement, or exact line widths at
   scale.

Run the focused Question test files and retain only assertion failures that show
these missing behaviors.

### Green proof and checks

Run the focused files after the minimum implementation, then:

```sh
npm --workspace @mopeyjellyfish/pi-question test
npm --workspace @mopeyjellyfish/pi-question run typecheck
npm run smoke:source
npm run test:coverage
```

Representative visual states:

- one question / two options;
- forty-seven questions with prior answers and current position in the middle;
- one multi-select question with forty options, notes, **Other…**, **Chat about
  this…**, and **Next →**;
- incomplete and complete forty-seven-answer review;
- document focus beside and below options;
- preview focused, note editor, custom editor, and redirect editor;
- 40×10, 80×24, 120×20, and 160×40 terminal surfaces;
- inline and full-screen presentation.

Accessibility and interaction proof:

- injected up/down/page bindings work;
- Home/End, Tab/Shift+Tab, left/right, Enter, Space, `n`, `d`, and Escape retain
  their documented roles;
- hidden counts and progress are textual, not color-only;
- focus remains visible; no out-of-range option/review cursor occurs;
- every rendered row fits width; short terminals keep sticky hints/actions
  reachable; IME cursor markers remain visible in editors;
- theme invalidation clears relevant caches.

Use target-owned render snapshots or deterministic terminal captures. Maintain a
visual mismatch ledger with severity, expected state, observed state, likely
cause, repair, and recheck. Resolve every material mismatch before slice
completion. Temporary design HTML, images, server files, Playwright artifacts, and
board state stay untracked and are not shipped.

RPC proof covers every finite question in order, large option arrays, multi-select
**Next →**, cancellation at select/input/review, abort precedence, continuation,
and no partial submission on cancellation.

Any change to row allocation, progress text, key handling, viewport math,
document/preview composition, or state offsets invalidates the focused and visual
proof.

### Atomic commit and pull request

After slices 001 and 002 both pass, create one atomic package commit:

```text
feat(pi-question): support scalable questionnaires
```

Include Question source, tests, and README only. Delivery unit 1; standalone pull
request to `origin/main`.

### Done when

- The accepted compact-progress signature is visible in all multi-question states.
- Options and review use explicit, navigable viewports at scale.
- Existing documents, previews, editors, presentations, and RPC remain compatible.
- Question focused tests, package tests, typecheck, per-file coverage, source smoke,
  and the visual mismatch ledger pass.
- The Question package commit is coherent and independently revertible.

## [ ] 003 — Bulk `/improve` decisions with safe grouped routing

### Outcome and requirement trace

With at least two awaiting candidates, `/improve` offers **Action all**, **Track
all**, **Select candidates**, and **Review individually**. A selected subset gets
one group-decision question. Grouped Action creates one dependency-aware handoff.
Grouped Track loads `ticket-workflow`, reuses resolved policy per target, and
classifies every candidate draft before one exact displayed draft-set
confirmation. Deepen remains individual. One accepted group decision updates all
affected Blueprint Ledger candidate articles in one revision.

Trace: AC-010 through AC-021 and the Engineering parts of AC-022.

### Seam and files

Public seam:

- shipped `/improve` prompt and `improve-codebase-architecture` skill behavior;
- existing `ticket-workflow` tracker-policy contract as a read-only dependency;
- Blueprint Ledger terminal handoff contract;
- Engineering README guidance and deterministic resource tests.

Expected files:

- `packages/engineering/prompts/improve.md`
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/skills/improve-codebase-architecture/HTML-REPORT.md`
- `packages/engineering/test/resources.test.ts`
- `packages/engineering/README.md`

Read `packages/engineering/skills/ticket-workflow/SKILL.md` as the current source
of truth. No edit to that skill is planned unless implementation exposes a genuine
missing generic ticket contract; such a scope change returns to planning.

Do not import Question or add a package dependency. Guidance may resolve the
installed `question` tool as an optional capability. If it is unavailable or the
aggregate selector is rejected, the direct parent must offer the complete
individual or conversational stable-ID fallback.

### Dependencies

Slices 001 and 002 establish the public Question capability and exact labels.
Existing `/improve` depth, intake, report, planning, and cleanup contracts plus the
current `ticket-workflow` target, taxonomy, route, grouping, privacy, and exact-set
confirmation contract remain inputs.

### Execution lane and ownership

`serial`. The parent is the sole writer. No child may edit the skill, report guide,
or shared resource test concurrently.

### Red proof

Add deterministic resource assertions before guidance edits that fail because the
current resources do not specify:

1. the exact batch-entry labels and order;
2. awaiting-only **all** scope and decided-candidate exclusion;
3. one count-unbounded multi-select with stable IDs, titles, routes, and no
   duplicate Question-owned controls;
4. the exact subset-decision labels;
5. empty/cancelled/unavailable/aggregate-rejected no-op behavior and complete
   fallback;
6. grouped Action dependency/overlap/integration/uncertainty analysis and
   proportionate route selection without starting a writer;
7. one classified draft per Track candidate, policy resolved once per target,
   exact target/taxonomy/route/grouping/privacy fields, and one separate exact-set
   confirmation;
8. individual-only Deepen;
9. one atomic Blueprint Ledger revision for all affected articles;
10. browser non-authority and updated report terminal handoff text.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

Retain the intended missing-contract assertion failures. Markdown or fixture
failures are not accepted red proof.

### Green proof and checks

Implement the minimum complete guidance and run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
npm run smoke:source
```

Verify exact label order and stable terminology across the prompt, skill,
HTML-report guide, README, and tests. Cover these flows:

- **Action all** over every awaiting candidate in the report or named subset;
- **Track all** with one classified draft per awaiting candidate and no remote
  creation;
- subset Action, Track, **Won't do**, and **Review selected individually**;
- mixed prior decisions where all operations exclude decided candidates;
- empty, skipped, cancelled, unavailable, and aggregate-rejected selector paths;
- individual flow retaining **Action**, **Track**, **Won't do**, and **Deepen**;
- one grouped Action handoff with route reasons and no writer start;
- grouped Track resolving policy once per target, classifying each candidate with
  target/taxonomy/route/grouping/privacy, then confirming the exact displayed set
  once;
- one revision increment and mirrored per-article updates;
- continuation with remaining awaiting candidates and bounded helper cleanup;
- report controls remaining read-only.

Resource tests prove the shipped contract, not model compliance. Do not run a
provider-backed Pi prompt. Deterministic load/reload proof in slice 004 checks
resource presence only.

Any label, option order, candidate scope, fallback, route authority,
`ticket-workflow` classification, report update, exact-set confirmation, or
browser-authority change invalidates this proof.

### Atomic commit and pull request

After the Engineering focused and package checks pass, create:

```text
feat(pi-engineering): add bulk improve triage
```

Include Engineering resources, tests, and README only. Delivery unit 1;
standalone pull request to `origin/main`.

### Done when

- Every batch and subset route is explicit, cancellation-safe, and awaiting-only.
- Grouped Action preserves planning authority.
- Grouped Track preserves per-candidate `ticket-workflow` classification and one
  exact-set confirmation before any remote creation.
- Deepen remains individual.
- One accepted group decision changes the report atomically.
- Engineering focused and package tests and source smoke pass.
- The Engineering package commit is coherent and independently revertible.

The accepted pitch listed documentation as its fourth serial slice. This plan
folds Question documentation into slice 002 and Engineering/report documentation
into slice 003 so each public contract ships with its owning package commit. Slice
004 is the integrated verification and publication boundary. No accepted content
or delivery unit is removed by this remapping.

## [ ] 004 — Integrated verification, fixed review, and publication

### Outcome and requirement trace

The final worktree proves the complete Question-plus-Engineering behavior, package
independence, loadability, lifecycle safety, packed contents, accepted terminal
direction, and publication hygiene. Independent QA and formal review approve one
frozen diff. The final branch is pushed and one standalone pull request is opened
or updated.

Trace: AC-020 through AC-022 and all earlier criteria as an integration gate.

### Seam and files

No new product seam is planned. This slice verifies the two package commits, the
accepted pitch and plan, package manifests and archives, deterministic Pi loading,
and the final Git diff. Review repairs may touch only files already authorized by
the pitch and owning slice.

Expected evidence, not tracked artifacts:

- focused command logs;
- visual terminal captures and mismatch ledger;
- source and packed smoke output;
- pack-file lists;
- QA result and formal fixed-diff review;
- final commit/tree/base identifiers.

### Dependencies

Slices 001–003 complete; two package behavior commits exist; worktree is clean;
setup fingerprint is current.

### Execution lane and ownership

The parent freezes the diff and remains the only writer. Run risk-selected QA and
formal review concurrently as read-only lanes if configured roles are available.
QA owns executable gates and visual evidence. Reviewer owns one fixed-diff review
against the accepted pitch, plan, repository standards, and package contracts.
The parent synthesizes one repair packet and applies repairs serially.

No Sol or exceptional high-capability implementation lane is authorized.

### Red proof

Before final gates, inspect the diff and demonstrate that only the accepted pitch,
plan, Question package, Engineering resources, focused tests, and package READMEs
changed. Treat any unrelated file, generated artifact, dependency change, package
boundary violation, untracked runtime artifact, or inconsistent release metadata
as a failing hygiene proof.

For manual acceptance, first run the focused automated tests. Then start the
pinned deterministic Pi command from this worktree with only the intended source
package loaded. Confirm Question registers without conflicts. While Pi is idle,
run `/reload`, then confirm resource registration and lifecycle reconstruction
without sending any provider-backed prompt. For Engineering, use deterministic
resource discovery/load evidence only; do not ask a model to execute `/improve`.

### Green proof and checks

Run after the final edit, on the final worktree:

```sh
npm test -- --run packages/question/test/question.test.ts \
  packages/question/test/regressions.test.ts \
  packages/question/test/final-regressions.test.ts
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-question run typecheck
npm --workspace @mopeyjellyfish/pi-question test
npm --workspace @mopeyjellyfish/pi-engineering test
npm run smoke:source
npm run smoke:packed
npm run check
git diff --check
git status --short --branch
```

Inspect `npm pack --dry-run --json` output for both packages. Confirm only intended
runtime files, skills/prompts, README, changelog, license, manifest, and package
metadata ship. Because no dependency or installation metadata change is planned,
`npm run security:check` is not required. Because no workflow file changes,
`npm run workflows:check` is not required. If either scope changes, return to the
invalidation map and add the applicable gate.

Visual acceptance uses `visual-validation` with deterministic terminal evidence,
not a web browser. Recheck all representative states from slice 002. Resolve the
mismatch ledger or record bounded residual risks that do not violate acceptance
criteria.

Freeze one diff after executable gates. Record base commit, HEAD, tree, changed
paths, command definitions, and setup fingerprint. Run independent QA and formal
review against that same fixed point. Repair only supported findings. Any repair
invalidates its affected proof and the final gates; rerun them before publication.
If repairs create fixup commits, autosquash them locally into the owning Question
or Engineering behavior commit before the final verification freeze. Do not
rewrite a published branch and do not use plain force push.

Before publication, fetch `origin`. If `origin/main` advanced beyond accepted base
`beea3711`, use the approved rebase workflow, then rerun every final gate because
the base and tree changed.
Use `open-pr` to push `feat/improve-bulk-triage-actions` and open or update one
standalone pull request with a Conventional Commit title. Do not merge it.

### Atomic commit and pull request

No planned product commit belongs only to this slice. Review repairs are folded
into the owning package behavior commit before final proof. The final history is:

1. `docs: accept scalable question and improve triage pitch`
2. `docs: accept scalable question and improve triage plan`
3. `feat(pi-question): support scalable questionnaires`
4. `feat(pi-engineering): add bulk improve triage`

Publish all four commits in delivery unit 1 as one standalone pull request to
`origin/main`.

### Done when

- Every focused, package, smoke, packed, root, diff, and hygiene check passes on
  the final tree.
- Deterministic load/reload acceptance passes without a provider-backed prompt.
- Visual evidence matches the accepted compact-progress direction with no material
  mismatch.
- QA passes and formal review approves the same final diff.
- Final history contains the accepted documents and two package behavior commits.
- The branch is pushed and one standalone pull request is open; no merge, release,
  deployment, publication, remote issue creation, or cleanup occurs.
