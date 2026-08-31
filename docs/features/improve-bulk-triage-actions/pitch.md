---
status: accepted
---

# Shape: Scalable Question lists and bulk `/improve` decisions

## Problem and evidence

`/improve` can report several supported candidates, but its current terminal flow
asks one four-option question for each candidate. A user who agrees with several
candidates must repeat the same **Action** or **Track** decision for every item.

The current `question` tool blocks the simpler interaction. Its public schema and
validator accept only one to four questions and two to four options per question:

- `packages/question/src/schema.ts` owns both fixed array maxima.
- `packages/question/src/index.ts` and `packages/question/README.md` advertise the
  same limits.
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md` therefore
  uses all four options for one candidate's **Action**, **Track**, **Won't do**,
  and **Deepen** decision.

The fixed counts also hide scale limits in the Question interface. The full-screen
TUI renders every question header in one tab strip, renders every option before it
fits the focused rows into the terminal, and renders every answer in one review
body. Removing only the schema maxima would let large valid calls consume the
whole header, redraw hidden content, and make review difficult.

Result safety also depends on the fixed counts. Question currently keeps individual
notes, custom answers, redirects, model content, and compact rendering bounded.
Its continuation snapshot and result details still grow with every question,
option, and answer. The README's claim that every valid result remains below Pi's
50 KB tool-result guidance would no longer hold without one aggregate contract.

The caller clarified that the Question tool should support **n questions and n
options**. “n” means no fixed array-count maximum. It does not remove Pi's payload
and complete-result safety limits.

## Proposed solution

Deliver one coordinated feature across the independently installable Question and
Engineering packages.

### 1. Make Question count-unbounded within aggregate safety

Keep the existing minimum of one question and two options per question. Remove the
fixed `maxItems` values and count-based validation. Accept any finite number of
questions and options whose sanitized structure can produce a complete result
within one exported aggregate byte budget below Pi's 50 KB guidance.

Centralize the aggregate contract at the Question input/result boundary:

- Preflight the sanitized, JSON-encoded structural result cost before opening TUI
  or RPC interaction.
- Include every question ID, option ID, answer, and continuation signature needed
  for a complete submitted, cancelled, or redirected result.
- Keep documents and previews under their existing independent field limits and
  omit their content from result details and continuation snapshots as today.
- Preserve the existing per-field limits for notes, custom answers, redirects,
  model-facing content, and compact transcript rendering. Fit user-authored result
  text into the remaining aggregate budget with the existing explicit truncation
  marker; never truncate or omit structural IDs, selections, or continuation
  signatures.
- Reject a structurally oversized call before showing UI. Report the measured and
  allowed encoded byte counts. Do not silently drop or page semantic input.
- Assert the aggregate bound again when building the result so no valid execution
  can exceed the public limit.

Keep stable IDs, one-use branch-local continuation IDs, semantic restoration,
cancellation, unavailable non-interactive results, and the existing document
contract.

### 2. Use the accepted compact progress navigator

The person is a developer making structured decisions in a terminal. They must
scan a possibly large set, keep their place, change prior answers, review the
complete set, and submit with confidence. The interface should feel dense, calm,
terminal-native, and stable rather than like a wide form compressed into tabs.

The accepted direction is **A — Compact progress navigator**, selected from two
image-backed specimens on a verified temporary local design board. The alternative
kept a window of nearby tabs. It was rejected because it retained width pressure
and added hidden-tab bookkeeping without improving the current decision focus.

Interface evidence:

- **Domain:** question, option, answer, progress, review, continuation, and
  candidate selection.
- **Color world:** existing terminal graphite, primary ink, muted slate, cyan
  focus, green completion, and amber review tokens. Do not add a palette.
- **Signature:** one stable progress navigator above a focused option window with
  explicit hidden counts.
- **Rejected defaults:** an all-question tab strip, windowed tabs, a full unwindowed
  list, and dashboard-style navigation.
- **Hierarchy:** the current question and focused option lead; progress and hidden
  counts orient; descriptions and hints remain secondary.
- **Temporary mock-up disposition:** the local specimens are design evidence only.
  Do not ship their HTML, screenshots, server files, or board state.

Replace the all-question tab strip with one stable-height line that shows the
current position, total question count, short header, and answered count. The
current question and focused option remain the focal content.

Render option and review bodies as focused viewports instead of building all
hidden rows into the frame:

- Up/down moves one option.
- PageUp/PageDown uses the injected `tui.select.pageUp` and
  `tui.select.pageDown` bindings to move by one visible option page.
- Home/End moves to the first or last option.
- Tab/Shift+Tab and left/right keep their current next/previous question behavior.
- The option viewport shows explicit hidden counts above and below the visible
  window.
- The review viewport shows every answer through PageUp/PageDown and Home/End
  scrolling while Submit and **Chat about this…** remain sticky and reachable.
- Document focus keeps its existing independent scroll behavior. Leaving document
  focus returns to the same option.

Keep existing theme tokens, borders, markers, descriptions, previews, notes,
editors, native keyboard conventions, and focus treatment. Do not add motion or a
new visual system. Verify narrow and wide terminals, short terminals, inline and
full-screen presentation, single and multiple questions, many options, documents,
review, redirection, cancellation, and IME cursor placement.

RPC remains a sequential walk over every question. It uses the host's `select` and
`input` protocol, keeps the existing **Next →** sentinel for multi-select, and
returns cancellation instead of committing partial state when the client cancels
or aborts.

No repository `DESIGN.md` exists. The accepted direction is local to the Question
package and belongs in this pitch, focused tests, and the package README. Do not
create a repository-wide design document for it.

### 3. Add action-first bulk triage to `/improve`

When at least two candidates still await a decision, ask one batch-entry question:

1. **Action all** — apply Action to all awaiting candidates.
2. **Track all** — apply Track to all awaiting candidates.
3. **Select candidates** — choose a subset, then choose one decision for it.
4. **Review individually** — use the current per-candidate flow.

“All” means every awaiting candidate in the active report or named triage subset.
It never reprocesses a candidate that already has a decision.

For **Select candidates**, ask one multi-select Question containing every awaiting
candidate that fits the Question aggregate contract. Show stable candidate IDs,
concise titles, and recommended routes. Do not split the set into artificial
four-item pages and do not add **Next**, **Submit**, **Other**, or **Chat about
this…** as candidate options because Question owns those controls.

After a non-empty subset is selected, ask one decision question:

1. **Action selected**
2. **Track selected**
3. **Won't do selected**
4. **Review selected individually**

**Review selected individually** preserves the current **Deepen** decision for
each selected candidate. Deepen remains a one-candidate operation because it
spends analysis budget on one seam and preserves one candidate ID. An empty,
skipped, cancelled, unavailable, or aggregate-rejected selector makes no candidate
decision and no report revision. The parent then offers the existing individual or
conversational named-ID fallback without omitting candidates.

Apply group decisions through the existing authority boundaries:

- **Action all** and **Action selected** create one self-contained grouped handoff.
  Record dependencies, overlap, integration points, uncertainty, and route reasons
  before selecting `implement`, `planning-changes`, or Shape then planning. Bulk
  Action never starts a writer directly and never proves parallel readiness.
- **Track all** and **Track selected** load and follow the existing
  `ticket-workflow`. Resolve tracker policy once per target, then classify every
  candidate draft with its resolved target, taxonomy, route, grouping, and privacy
  state. Remote creation still requires one separate confirmation for the exact
  displayed classified draft set and target.
- **Won't do selected** records only ephemeral report decisions.
- **Review individually** and **Review selected individually** retain the current
  four-option per-candidate question and all current route approvals.

After one accepted group decision, update the same Blueprint Ledger atomically in
one revision. Mirror the decision on every affected candidate article. Continue
with candidates that still await a decision. Stop the helper through the existing
bounded cleanup path when triage ends.

Update the Blueprint Ledger scaffold so its terminal handoff names batch and
individual choices. The report remains a reading surface. Browser controls never
select candidates, start implementation, or create issues.

### Delivery unit

Deliver the feature as one coordinated review and publication unit with four
serial vertical slices:

1. Question accepts count-unbounded input under one complete-result byte contract.
2. Question renders scalable progress, option, and review viewports in TUI and
   preserves RPC behavior.
3. `/improve` adds **Action all**, **Track all**, and count-unbounded subset
   selection with cancellation-safe fallback.
4. The Blueprint Ledger guide and both package READMEs document the complete
   behavior and authority.

Use one branch and one standalone pull request. Keep package changes in two atomic
behavior commits after the accepted pitch and plan commits:

1. `feat(pi-question): support scalable questionnaires`
2. `feat(pi-engineering): add bulk improve triage`

This topology keeps Question and Engineering independently installable and makes
each package change independently reviewable and revertible. Engineering adds no
runtime dependency on Question. The one pull request is the smallest coherent
acceptance boundary because the requested `/improve` interaction depends on the
new public Question contract.

## Boundaries and no-gos

- Change only the Question package, the Engineering `/improve` skill and Blueprint
  Ledger guide, both package READMEs, focused package tests, and feature documents.
- Keep `/improve` discovery and report generation read-only.
- Keep the current improvement depths, intake, Focus and Outcome choices,
  candidate evidence, workflow routes, `ticket-workflow` policy and classification,
  issue confirmation, and report lifecycle.
- Keep one question minimum, two options minimum, and all existing per-field text
  limits unless the complete-result proof requires a stricter aggregate allocation.
- Do not add a production package, external dependency, tracker client, browser
  control, persistent triage store, or runtime orchestration engine.
- Do not silently truncate questions, options, structural IDs, selections, or
  continuation signatures.
- Do not use a fixed question or option count as a substitute for aggregate safety.
- Do not infer independence, parallel readiness, implementation approval, issue
  creation, or publication from a bulk selection.
- Do not create **Deepen all** or multi-candidate Deepen behavior.
- Do not reprocess decided candidates through **Action all** or **Track all**.
- Do not create remote issues until the existing exact-set batch confirmation.
- Do not give browser controls terminal workflow authority.
- Return to Shape if implementation requires changed Pi core or RPC protocols, a
  new dependency, persistent cross-call state, changed tracker authority, or a
  result that cannot stay complete below Pi's tool-result guidance.

## Decision-changing research and risks

- Removing schema maxima alone is unsafe. The current tabs, option rendering,
  review body, continuation snapshot, and result details all scale with input.
- The accepted progress direction keeps navigation chrome at a stable height.
  Windowed tabs were rejected because they retain width pressure and add hidden-tab
  bookkeeping without improving the current decision focus.
- A byte-safe call can still be too large for good human judgment. Question should
  support the finite call, while callers such as `/improve` remain responsible for
  coherent, evidence-ranked candidate sets. Count-unbounded capability is not a
  reason to generate unbounded work.
- Result detail safety and model-facing usefulness are separate. The aggregate
  preflight must keep structured results complete; existing model-content bounds
  must remain explicit and must report truncation instead of implying that omitted
  text reached the model.
- The current state and RPC loops already use dynamic lengths. Their main risk is
  large-viewport usability and cancellation, not a four-item algorithmic
  dependency.
- Question is independently installable. Engineering must retain an unavailable or
  aggregate-rejected direct-parent fallback and cannot assume the companion package
  is installed merely because this repository contains it.
- Current `origin/main` makes `ticket-workflow` the owner of tracker target,
  taxonomy, route, grouping, privacy, and mutation policy. Grouped Track must reuse
  that policy for each candidate before one exact-set confirmation; it must not
  replace classification with one undifferentiated batch draft.
- Resource tests verify shipped Engineering guidance rather than model compliance.
  Deterministic Pi load and reload acceptance can verify resources and extension
  registration, but it cannot prove every model-driven branch. Do not run another
  provider-backed prompt for this acceptance. Record that evidence boundary.

## Review evidence

- **Applicability:** not applicable. This delivery does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns the count-unbounded Question contract, aggregate safety,
terminal-navigation behavior, bulk-selection semantics, grouped workflow routing,
per-candidate Track classification through `ticket-workflow`, cancellation, report
state, package boundaries, and compatibility with current Question and `/improve`
behavior.

The caller prefers **accept-all implementation**. This preference is not
implementation authority until the complete plan is approved. Pitch approval
authorizes the bounded pitch commit and planning handoff. Complete-plan approval
can authorize the named tests, source, skill, report guide, READMEs, feature
documents, verification, review repair, two package behavior commits, push, and
standalone pull-request work on `feat/improve-bulk-triage-actions`.

Approval never authorizes merge, release, deployment, npm publication, provider
billing, remote issue creation without the exact-set confirmation, destructive
cleanup, worktree removal, plain force push, or unrelated changes.

## Observable acceptance criteria

- **AC-001 — Count-unbounded schema:** Question accepts any finite number of
  questions and options without a fixed array maximum, while retaining at least
  one question and at least two options per question.
- **AC-002 — Aggregate preflight:** Before TUI or RPC interaction, Question rejects
  a sanitized structure that cannot produce complete result details below the
  exported aggregate budget. The error states measured and allowed encoded bytes.
- **AC-003 — Complete bounded results:** Submitted, cancelled, unavailable, and
  redirected details remain below Pi's 50 KB guidance. Structural IDs,
  selections, and continuation signatures are complete. Existing explicit text
  truncation applies only to user-authored or rendered text.
- **AC-004 — Continuation compatibility:** One-use branch-local continuation IDs,
  semantic option restoration, preview/document-insensitive restoration, stale
  detection, and cancellation remain compatible for count-unbounded calls.
- **AC-005 — Compact progress:** Multiple-question TUI replaces the all-tabs strip
  with a stable-height current/total/header/answered navigator consistent with the
  accepted direction.
- **AC-006 — Scalable options:** Option rendering shows a focused visible window,
  explicit hidden counts, one-row and page movement, Home/End movement, stable
  sentinels, previews, notes, and no out-of-range cursor state for large lists.
- **AC-007 — Scalable review:** Review scrolls through every answer with page,
  Home, and End navigation while Submit and **Chat about this…** remain sticky,
  accurately enabled, and keyboard reachable.
- **AC-008 — Presentation compatibility:** Single and multiple questions, inline
  and full-screen presentation, narrow/wide/short terminals, side-by-side and
  stacked previews, independent document scrolling, editors, IME focus, theme
  invalidation, and line-width bounds remain compatible.
- **AC-009 — RPC compatibility:** RPC walks every finite question and option set in
  order, preserves multi-select **Next →**, cancellation, abort precedence,
  unavailable modes, and complete bounded results.
- **AC-010 — Batch entry:** With at least two awaiting `/improve` candidates,
  terminal triage offers exactly **Action all**, **Track all**, **Select
  candidates**, and **Review individually** before per-candidate decisions.
- **AC-011 — One-click all:** **Action all** and **Track all** apply to every
  awaiting candidate in the active report or named subset and never reprocess a
  decided candidate.
- **AC-012 — Count-unbounded subset:** **Select candidates** uses one multi-select
  Question with every awaiting candidate that passes aggregate preflight. It does
  not create artificial four-item pages or duplicate Question-owned controls.
- **AC-013 — Group decision:** A non-empty selected subset offers exactly **Action
  selected**, **Track selected**, **Won't do selected**, and **Review selected
  individually**.
- **AC-014 — Cancellation safety:** Empty, skipped, cancelled, unavailable, or
  aggregate-rejected selection produces no candidate decision and no report
  revision, then offers a complete individual or conversational named-ID fallback.
- **AC-015 — Deepen remains individual:** The individual flow keeps **Action**,
  **Track**, **Won't do**, and **Deepen**. No bulk Deepen route exists.
- **AC-016 — Safe grouped Action:** Grouped Action creates one complete handoff
  with dependencies, overlap, integration points, uncertainty, and a proportionate
  `implement`, `planning-changes`, or Shape route. It starts no writer and grants
  no parallel-ready status.
- **AC-017 — Safe grouped Track:** Grouped Track loads `ticket-workflow`, resolves
  policy once per target, and classifies every candidate draft with its exact
  target, taxonomy, route, grouping, and privacy state. Remote creation still
  requires one separate confirmation for the exact displayed classified draft set
  and target.
- **AC-018 — Atomic report state:** One accepted group decision increments the
  report revision once, updates every affected candidate article, preserves
  candidate IDs, and leaves unselected awaiting candidates available for triage.
- **AC-019 — Reading-only report:** The Blueprint Ledger names batch and individual
  terminal choices but gives browser controls no mutation or workflow authority.
- **AC-020 — Package independence:** Question and Engineering remain
  repository-neutral and independently installable. Engineering adds no runtime
  dependency on Question and retains capability fallbacks.
- **AC-021 — Focused proof:** Question tests prove aggregate validation, large TUI
  and RPC flows, continuation, cancellation, result bounds, progress/options/review
  navigation, presentation states, and accessibility. Engineering resource tests
  prove exact bulk labels and order, awaiting-only scope, fallback, grouped Action,
  per-candidate `ticket-workflow` classification, exact-set Track confirmation,
  individual Deepen, atomic report updates, browser non-authority, and
  documentation consistency.
- **AC-022 — Verified delivery:** Focused package tests, Question typecheck,
  package tests, source and packed smoke, deterministic load and reload acceptance
  without a provider-backed prompt, `npm run check`, pack inspection, final diff
  checks, visual terminal evidence, and risk-selected QA and formal review pass on
  the final worktree.
