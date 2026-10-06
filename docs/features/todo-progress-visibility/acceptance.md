# Acceptance: Visible nested Todo progress

## Accepted boundary

The accepted pitch and plan cover four serial slices in one delivery unit on
`feat/todo-progress-visibility`, with one pull request targeting `main`.
Accept-all authority covers bounded implementation and publication, not merge,
release, deployment, or cleanup.

Implementation began at `c96df91fc2e0926946e6fa6f2f35237e13272ade`.
The parent inspected the complete implementation diff and each slice's evidence.
This delivery adds no dependency, runtime-selector, package-version, release
metadata, or generated-changelog changes relative to its verified `main` base.
No Markdown-content tests were added.

## Authorized upstream integration

Publication preflight found six new `main` commits. The user explicitly approved
integration before the first push, rather than waiving base integration.
The approved scoped commits and accepted documents were rebased onto
`1de45b524df2ea4e8691fb1e06a324771c4a49bc` without conflicts. Range-diff showed
all seven task patches unchanged. Both overlapping READMEs retained the upstream
Shape additions and the task's tracking contract. The parent checked this result.

The inherited lockfile updates `source-map-js` 1.2.1 to 1.2.2. The parent refreshed
setup with declared Node 24.18.0, Go 1.26.5, and `npm ci --ignore-scripts`.
The new lockfile SHA-256 is
`2b6fb93ba3f614e03867bc70d18801abd68602beaa77df22ef6a0f9a621178f2`.
Runtime selectors, root command definitions, Todo/Status Line source and tests,
and named tracking guidance are unchanged. Prior live acceptance remains
evidence for those unchanged surfaces, not an additional claim of a new live
provider run after integration. Source/packed smoke and final gates run afresh.

The final publication handoff records the rebased, tested tree. The earlier
review and pre-integration tree identifiers remain historical evidence only.

## Focused executable proof

| Slice     | Intended before-state proof                                                                 | Verified result                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001       | Public `add` rejected `parentId`. Mutation/replay tests exposed the changed tree contracts. | Safe three-level state, explicit closure, sibling-name reuse, atomic updates, cancellation, subtree clearing, monotonic IDs, and mixed-version replay passed. Todo: 23 tests. |
| 002       | Flat widget omitted the active ancestor context. Status Line ignored version 2.             | Reserved active path, complete tree views, local counts, Unicode/width bounds, and compatible summaries passed. Todo: 26 tests. Status Line: 30 tests.                        |
| 003       | Registered factory had no context hook.                                                     | Current-path reminders, replacement, transcript preservation, branch refresh, bounds, and empty/closed/disabled suppression passed. Todo: 32 tests.                           |
| 004       | Guidance allowed broad multi-slice handoffs and premature closure of remaining work.        | Named tracking and handoff contracts passed text review, formatter, Markdown lint, and existing Todo tests. No prose unit tests.                                              |
| R1 repair | Renderer truncated `Verify branch replay after compaction` to retain `Slice 4`.             | Regression preserves the complete actionable title and drops context first. Status Line: 31 tests.                                                                            |

Workers ran affected compiler, type-aware lint, formatting, and diff checks.
The larger test diff covers public-tool state chains, branch snapshots, and
synthetic runtime-message fixtures rather than document contents.

Final source smoke and `npm run check` run after this report and the plan markers
are frozen. The delivery handoff records their exact tested tree and results.
Earlier full implementation verification passed 899 tests and all root gates.
That earlier result does not substitute for the final repaired-tree check.

## Live Pi acceptance

QA used the pinned Pi 1.0.3 from the task worktree with ambient resources disabled:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

Owned temporary session storage was outside tracked source. Existing model,
authentication, and settings remained unchanged. No trust prompt appeared.
No trust override or approval was sent. QA removed its owned terminals and
temporary session artifacts without touching other sessions or source files.

Observed proof:

- All 11 expected root extensions and expected skills loaded without duplicate
  or conflict diagnostics.
- Focused tests ran before idle `/reload`. Reload succeeded and the edited
  worktree's nested tree, counts, and active path remained available.
- In a bounded read-only interface audit, the model created seven named slice
  children and concrete steps. It activated a step before reading its file.
- Evidence-backed steps closed. A redundant step was explicitly cancelled.
  A group with all children closed remained pending until explicit verification.
- The widget showed the active delivery, slice, and step beyond its row budget,
  plus an overflow count. Local completed/cancelled counts did not double-count
  roots and descendants.
- Captures at 200, 120, 60, and 32 columns kept active widget titles and hierarchy
  recognizable. At 200 columns, Status Line showed active work and local counts
  without duplicate standalone Todo status.
- A later model turn reported the current hidden reminder's path and local
  counts. Session inspection found zero persisted ephemeral-reminder entries.
  No unsolicited extra runs were observed while idle.
- `/tree`, with no summary requested, restored the earlier active step and counts
  rather than the later paused state.

Model self-report is not an independent provider-wire inspection. Focused tests
separately verify Pi's custom-message-to-model conversion and reminder behavior.
RPC, print, compaction, fork, and full-view contracts have automated proof, not
an additional claim of complete live coverage.

## Review and repair

One fresh integrated fixed-diff Reviewer inspected all 14 changed paths against
accepted intent and repository Standards. Its frozen tree was
`0ef255771efbd81fd6d9909e449d9819d46dfa69`.

The review found one medium finding, R1, at the active-title truncation seam.
The parent reproduced it and paused. The user approved a bounded replacement
Worker repair. The correction removed context reservation before title
truncation and added a focused red/green renderer regression.

The parent reproduced the corrected output. A focused live QA recheck then
confirmed `1/3 · Verify branch replay after compaction` in the actual Pi footer
at 200 columns before and after reload. The widget retained slice context.
No source writes or defects occurred during that recheck. R1 is closed.
No architecture or scope change required another full review.

## Terminal mismatch ledger

| Surface/state            | Observation                                                                              | Disposition                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Isolated tmux startup    | Extended-keys warning. Ordinary input and slash commands worked.                         | Environment limitation, not a changed product defect. No user configuration changed. |
| Narrow integrated footer | Existing whole-footer priority omits the optional Todo segment.                          | Accepted existing policy. Persistent widget still shows the active path.             |
| Widget at 32 columns     | Long inactive count suffixes truncate.                                                   | Bounded rendering. Active titles, status glyphs, and hierarchy remain recognizable.  |
| No active step           | Pending fallback can select a group whose descendants are closed for final verification. | Expected explicit-group verification behavior, not inferred completion.              |
| R1 long active title     | Context initially displaced a title that fit alone.                                      | Repaired and rechecked in actual Pi.                                                 |

## Explicit proof gap and recovery decisions

**AC-009 actual retained handoffs: waived for this PR, not passed.**

The current parent host reported no retained child available for resumption.
Two real adjacent slice handoffs using the same retained Worker remain unverified.
QA launched no children. Its unavailable-continuation demonstration was an
explicitly labelled simulation using supplied host evidence. The model showed
named delegated work, reported the visibility limit, and paused without an
unauthorized replacement or remaining-slice execution.

The user explicitly authorized replacement Sol-high Workers for this delivery
and the bounded R1 repair. The user later accepted only the documented real
retained-handoff acceptance gap. The shipped Engineering guidance still requires
safe pause and explicit recovery when continuation is unavailable. No automatic
replacement or shared child Todo behavior is claimed.

Reminders and guidance cannot guarantee that every model tracks honestly.
The original setup reported one high audit vulnerability. The inherited upstream
security fix removed that high finding. Refreshed setup reports six existing
findings: three low and three moderate. This delivery adds no dependency changes.

## Verification efficiency

Four named implementation slices and one bounded review repair completed.
There was one formal full review, one main live QA lane, and one focused R1
terminal recheck. Writers remained serial. No incomplete Worker result required
an automatic retry.

The initial combined source-smoke/root-check command hit its 120-second tool
limit after successful source smoke. No check process remained active. The
parent ran only the root check separately with a sufficient time limit, and it
passed. Repair and then upstream integration each invalidated earlier tree proof.
The parent reruns final gates after the complete report and rebased source freeze.
Git preparation paused on unexpected remote history before making mutations;
the human integration decision granted the later bounded rebase. No blind
publication retry or advanced-base waiver occurred.
