---
status: accepted
---

# Plan: Herdr live subagent panes

This plan delivers the accepted pitch on `feat/subagent-herdr-integration` in one
serial delivery unit. The pitch, plan, package, root-profile changes, engineering
guidance, and verification share one publication boundary.

## Review evidence

- **Applicability:** `not applicable`; this plan changes TypeScript, Markdown, npm
  metadata, and a Node viewer process. It does not change Go source, a Go module, a
  Go CLI, or Go-specific guidance.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`.
- **Invalidation:** `not applicable`.

One fresh fixed-document Reviewer pass found one pane-launch security blocker and
seven planning fixes. The parent resolved them by using structured `split --env`
data, a fixed non-secret `pane run` command, a mode-0600 descriptor, public upstream
control seams, explicit coverage and smoke proof, root dependency ownership, the
issue #1207 recheck, and live-Herdr test isolation. Optional deterministic-command,
overflow, duplicate-gate, `codebase-design`, and typed-viewer improvements were also
applied. No second independent plan review is selected; the parent verified the
localized corrections against the cited contracts.

## Execution mode

The selected mode is **accept-all implementation**. Whole-plan approval confirms
accept-all authority only for this named plan on
`feat/subagent-herdr-integration`. The implementation can proceed through all
accepted slices without intermediate approval prompts.

Every material forecast variance returns control to the human. Fresh approval is
required when delivery boundaries or authority change. Accept-all does not authorize
merge, release, npm publication, deployment, changes to Herdr or upstream
`pi-subagents`, an external fork, destructive cleanup, worktree removal, or unrelated
work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                            | Pull request base | Dependencies | Checks                                                                                                                                                     | Ownership                                                                              | Integration point                 | CI fan-out | Cascade cost                           |
| ------------- | ---------- | -------------- | --------------------------------- | ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------- | ---------- | -------------------------------------- |
| 1             | standalone | `standalone`   | `feat/subagent-herdr-integration` | `main`            | none         | focused package and resource tests; package validation; source and packed smoke; manual Herdr reload acceptance; `npm run security:check`; `npm run check` | one serial writer in the active task worktree; frozen-diff QA and review are read-only | one pull request from this branch | 1          | low; one branch and no dependent stack |

One delivery unit is sufficient. The package, profile, lifecycle behavior, and worker
guidance depend on one tested runtime pin and one final Herdr acceptance loop. Splitting
them would create duplicate package and profile states that cannot pass the required
checks independently. The feature documents have no independent merge value and
publish with the implementation.

After whole-plan approval, commit the accepted pitch, plan, and design images as the
first atomic commit in this delivery unit. Use `open-pr` only after the complete unit
is stable and approved for publication. Do not use `gh stack`.

## Critical path, dependencies, and lanes

The critical path is serial:

1. compose the latest upstream runtime exactly once;
2. prove one direct async child can open one safe live pane;
3. expand discovery and layout to workflow, nested, and foreground children;
4. add upstream-routed controls and exact pane lifecycle ownership;
5. strengthen mutation-worker terminal handoff guidance;
6. synchronize documentation and run final acceptance.

There is one active mutation lane and no parallel writer. Slice 001 establishes the
runtime and package contract. Each later slice depends on it and shares the new
package files. QA and formal review can run concurrently only after the parent freezes
the final diff. QA owns executable gates; Reviewer owns intent, architecture,
security, lifecycle, and maintainability review.

Forecast:

- **Delivery units / pull requests:** 1 / 1.
- **Mutation lanes:** 1 serial lane in the existing task worktree.
- **Integration points:** the package composition factory, `pi-subagents` event-bus
  RPC and artifacts, Herdr CLI, and the root Pi profile.
- **Expensive gates:** real Herdr launch and idle `/reload`, source smoke, packed
  smoke, `npm run security:check`, and `npm run check`.
- **Likely cascade cost:** low before final acceptance; medium only if the pinned
  0.58.0 public artifact contract cannot identify a required child or transcript.

A material variance includes a required private upstream import, an upstream or Herdr
change, a second execution authority, inability to identify required foreground or
nested children through public evidence, a new delivery unit, or coordination beyond
one writer plus final assurance. Stop and return control when one occurs.

### Invalidation map

- Changes to `pi-subagents` version, package composition, root profile, lockfile, or
  dependency metadata invalidate package composition tests, root tooling tests,
  package validation, both smoke modes, security checks, and final `npm run check`.
- Changes to child discovery, lifecycle parsing, transcript sources, viewer rendering,
  or Herdr commands invalidate focused supervisor/viewer tests and native Herdr
  layout, scrollback, state, and focus evidence.
- Changes to control routing, pane bindings, reload, fork, resume, or shutdown logic
  invalidate focused control/lifecycle tests and the manual `/reload` and close
  acceptance loop.
- Changes only to the Implement worker contract invalidate its focused resource test
  and documentation checks.
- Changes only to README, architecture, pitch, plan, or release metadata invalidate
  formatting, markdown, package validation, and root-profile documentation checks.
- The final required gates are reusable only for the exact final tree, base `HEAD`,
  command definitions, runtime selector and lockfile fingerprint, and approved path
  set.

## Interface evidence and method

The accepted interface direction is **Supervisor Rail** in
`design/direction-a-supervisor-rail.png`. Interface slices use
`frontend-development` with the accepted `interface-design` evidence. This is a
native terminal surface, not React, so `react-interface` does not apply.

Representative states are running, blocked, needs attention, partial, failed,
stopped, and successful. Representative surfaces are the verified 188-column Herdr
layout, narrower terminals, one child, three concurrent children, and overflow beyond
three children. Keyboard paths include native pane focus and scrollback plus bounded
steer, stop, and supported resume controls. Reuse Herdr panes, terminal text, ANSI
state color, and host scrollback instead of building a browser dashboard.

The target has no browser or screenshot surface for raw Herdr panes, so browser-based
`visual-validation` is unavailable. Native proof will use `herdr pane layout`,
`herdr pane read --format ansi`, exact focus and pane identities, and a visual mismatch
ledger against the accepted image. Do not claim browser or screenshot proof. The
ledger must record hierarchy, rail geometry, readable width, state labels, focus,
scrollback, likely causes, and recheck targets.

## [ ] 001 — Compose the latest upstream runtime exactly once

### Outcome and requirement trace

The root profile loads published `pi-subagents` 0.58.0 through the new
`@mopeyjellyfish/pi-herdr-subagents` composition package. The wrapper invokes the
unchanged upstream factory once, does not register its supervisor inside a child
runtime, and does not re-export upstream skills or prompts. Missing or incompatible
Herdr leaves upstream behavior available. This traces AC-001, AC-009, and the package
foundation of AC-010.

### Seam and files

Use the package composition root as the public seam:

- `packages/herdr-subagents/src/index.ts` — call the public default export from
  `pi-subagents` once and construct the supervisor only in a parent Pi process;
- `packages/herdr-subagents/src/compatibility.ts` — validate Herdr and public RPC
  capability versions from unknown input;
- `packages/herdr-subagents/test/index.test.ts` — composition, child-runtime, and
  compatibility behavior;
- `packages/herdr-subagents/package.json`, `tsconfig.json`, `LICENSE`, `CHANGELOG.md`,
  and initial `README.md` — independently installable package contract;
- root `package.json` and `package-lock.json` — keep a direct exact
  `pi-subagents: 0.58.0` root dependency for the explicit root prompt path, while the
  new package declares the same runtime dependency; replace only the direct upstream
  extension entry with the composition extension path and retain the root agent
  catalog;
- `scripts/lib/packages.ts` and `test/tooling/packages.test.ts` — exact profile,
  dependency, and resource expectations;
- `release-please-config.json` and `.release-please-manifest.json` — package release
  registration.

Use `codebase-design` vocabulary for this module-shape change. The composition module
is deep: callers know one Pi extension factory. Upstream registration order,
parent/child gating, compatibility negotiation, and supervisor construction remain
inside it.

### Dependencies

None. Before implementation, update the lockfile, reinstall with the declared Node
and Go selectors, and re-read the installed 0.58.0 `package.json`,
`CHANGELOG.md`, `docs/extension-api.md`, and `docs/observability.md`. The installed
package is the source of truth for event names, capability versions, and documented
artifact fields. Recheck upstream issue #1207 and every `agents/*.md` explicit tool
list; 0.58.0 claims the strict-allowlist fix, so remove only the stale root workaround
text unless current tests prove an agent-catalog change is required.

### Execution lane and ownership

`serial`. The sole writer is the implementation worker in the existing task worktree.
No other lane can edit package, root profile, lockfile, validator, or release files.

### Red proof

Add focused tests that initially fail because the package and root composition do not
exist:

- the package factory calls a mocked upstream public factory exactly once;
- `PI_SUBAGENT_CHILD=1` does not register the Herdr supervisor;
- compatible RPC/Herdr versions enable supervision and absent, malformed, or older
  Herdr returns one bounded diagnostic without blocking upstream registration;
- the root profile expects `./packages/herdr-subagents/src/index.ts`, no direct
  upstream extension registration, exact `pi-subagents: 0.58.0`, existing explicit
  prompts, and no bundled upstream skill.

Run:

```sh
npm test -- --run packages/herdr-subagents/test/index.test.ts test/tooling/packages.test.ts
```

Record the intended failures before production changes.

### Green proof and checks

Make only the composition and package/profile metadata pass. Then run:

```sh
npm test -- --run packages/herdr-subagents/test/index.test.ts test/tooling/packages.test.ts
npm run packages:check
npm --workspace @mopeyjellyfish/pi-herdr-subagents run typecheck
npm run smoke:source
```

A revision to the dependency pin, wrapper factory, manifest resources, root profile,
or validator invalidates all Slice 001 proof.

### Atomic commit and pull request

Atomic commit: `feat(herdr-subagents): compose latest subagent runtime`. It remains in
delivery unit 1. The pull request base is `main`; stack position is `standalone`.

### Done when

The root and packed package resolve 0.58.0, the upstream factory registers once in a
real source-smoke Pi process, child Pi runtimes do not start the supervisor, selected
prompts and agents remain unchanged, the #1207 workaround is resolved against 0.58.0,
compatibility failure does not block upstream behavior, and focused checks pass.

## [ ] 002 — Show one direct async child in one live Herdr pane

### Outcome and requirement trace

Starting one direct current-session async child automatically opens one package-owned
raw pane to the right of the main pane without changing focus. The pane shows the
complete available human-readable output and current structured state from documented
0.58.0 artifacts. This traces the direct-child part of AC-002, AC-003, AC-004, and
AC-009.

### Seam and files

Use one `HerdrSubagentSupervisor` interface with `start`, `reconcile`, and `shutdown`
operations. Keep its adapters internal and dependency-injected for tests:

- `packages/herdr-subagents/src/supervisor.ts` — child-to-pane projection and owned
  binding state;
- `packages/herdr-subagents/src/subagents.ts` — versioned
  `subagent:async-started`, RPC ping, session ownership, and documented artifact DTO
  guards;
- `packages/herdr-subagents/src/herdr.ts` — fixed `pi.exec("herdr", argv)` calls,
  structured pane-ID parsing, exact shell-readiness checks, and one fixed
  `pane run` command string;
- `packages/herdr-subagents/src/artifacts.ts` — safe recognized-version status and
  output source selection plus a user-private mode-0600 viewer descriptor;
- `packages/herdr-subagents/src/viewer.ts` — Node 22 erasable TypeScript viewer that
  reads variable run data from the descriptor path in its environment, follows file
  growth/replacement, and leaves output in native terminal scrollback;
- focused `supervisor.test.ts`, `artifacts.test.ts`, and `viewer.test.ts` fixtures.

Use `codebase-design` vocabulary for the supervisor module shape. Its interface hides
event correlation, compatibility, artifact parsing, Herdr process calls, and viewer
startup. Tests use hand-written fake adapters at the same internal seams; do not add
a generic framework.

### Dependencies

Slice 001 and the verified installed 0.58.0 event/artifact contracts. Use the
`subagent:async-started` exact run/session/`asyncDir` evidence; do not use the bounded
Fleet DTO because it intentionally omits run IDs.

Do not use `pi-subagents/project-panes`: it creates peer project Pi sessions and does
not attach existing children. Do not use model-facing `inspector.open`: 0.58.0 does
not expose it through RPC. Use the accepted package-owned viewer over documented
artifacts, with no private inspector import.

Inherited `HERDR_*` variables alone never authorize a pane mutation. The supervisor
must also observe an exact current-session child event or authoritative active-child
reconciliation record. Focused tests inject fake adapters and must not contact the
live Herdr socket even when the host test environment contains `HERDR_*`.

### Execution lane and ownership

`serial` in the existing task worktree, with the same sole writer.

### Red proof

With fake RPC, artifact, and Herdr adapters, emit one exact direct async start event.
Assert that the absent implementation fails to:

- correlate the current session and authoritative artifact directory;
- split the captured main `HERDR_PANE_ID` to the right with `--no-focus`, passing
  variable paths only through structured `--env` values;
- parse and retain the returned exact pane ID;
- wait with a bounded timeout until `pane process-info` reports the new interactive
  shell in the foreground, or close only that new pane on failure;
- write run identity, artifact paths, and any later control capability into a
  user-private descriptor, never shell text, argv, or pane output;
- call `pane run` with the fixed constant shell payload
  `exec node "$PI_HERDR_SUBAGENT_VIEWER"`; the viewer reads its descriptor path from
  the environment;
- stream an appended and replaced `output-0.log` while showing structured running and
  terminal state;
- skip malformed, wrong-session, escaped-path, unsupported-version, and missing-Herdr
  inputs with bounded diagnostics;
- make no real Herdr call in focused tests or smoke when no exact current-session
  child exists.

Use temporary files and a real viewer subprocess for transcript growth, terminal
flush, and clean exit. Assert that untrusted labels, paths, transcript content, and
control tokens never enter shell source, process arguments, or shell history.

### Green proof and checks

Run the focused package tests, then launch the deterministic Pi profile from the task
worktree inside Herdr and start one harmless async read-only child. Verify exact
parent focus, right split, live output, state label, scrollback, and terminal outcome
with:

```sh
npm test -- --run packages/herdr-subagents/test/supervisor.test.ts packages/herdr-subagents/test/artifacts.test.ts packages/herdr-subagents/test/viewer.test.ts
npm --workspace @mopeyjellyfish/pi-herdr-subagents run typecheck
herdr pane layout --pane "$HERDR_PANE_ID"
herdr pane read <owned-pane-id> --source recent-unwrapped --format ansi --lines 200
```

Follow `frontend-development` with the accepted `interface-design` evidence. Record a
native mismatch ledger for main-left hierarchy, rail width, focus, readable text,
state label, and scrollback. Browser `visual-validation` remains honestly unavailable.
Any viewer, artifact, observer, or Herdr adapter change invalidates this proof.

### Atomic commit and pull request

Atomic commit: `feat(herdr-subagents): show live async child panes`. It remains in
delivery unit 1 and the standalone pull request.

### Done when

One real async child opens exactly one owned no-focus right pane, the complete
available output remains readable in host scrollback, state is accurate, unsafe or
incompatible evidence is bounded, no test or idle smoke process mutates live Herdr,
each new TypeScript source meets the repository's per-file 90% line, statement, and
function plus 85% branch coverage floor, and focused plus native Herdr proof passes.

## [ ] 003 — Supervise workflow, nested, and foreground children in the rail

### Outcome and requirement trace

Every directly observable current-session leaf gets one pane: direct async children,
each workflow child, nested children with exact authoritative identity and artifacts,
and foreground children whose structured tool progress exposes a stable
`(runId, index)`. The first pane stays to the right and later panes stack below it.
This traces AC-002, AC-003, and AC-004 across all accepted child shapes.

### Seam and files

Extend the same deep supervisor and adapters rather than adding another coordinator:

- `src/subagents.ts` — authoritative status traversal, stable `(runId, index)`
  correlation, structured foreground `tool_execution_update`/`tool_result` evidence,
  and terminal outcome projection;
- `src/artifacts.ts` — workflow/nested output and session-file selection with
  recognized-version guards;
- `src/herdr.ts` — later-pane down splits, fixed ratio/resize policy, rename and
  metadata commands, and exact live-pane queries;
- `src/supervisor.ts` — idempotent one-leaf/one-pane reconciliation and explicit
  omission diagnostics;
- `src/viewer.ts` — display agent, state, elapsed time, context/budget evidence,
  current activity, attention, and terminal outcome without erasing transcript
  scrollback;
- package tests and fixtures for direct, workflow, nested, foreground, overflow, and
  malformed projections.

There is no hidden-child cap. Stack every exact live child in the rail. When pane
height becomes compact, retain the state header and full native scrollback, report the
compact layout, and let the user use Herdr's native pane zoom. Do not hide or move
overflow children to another tab.

### Dependencies

Slices 001 and 002. Foreground and nested panes require exact public 0.58.0 identity
and artifact evidence. If the installed public contract cannot supply it, that is a
material forecast variance; do not import private modules or infer identity from
rendered output.

### Execution lane and ownership

`serial` in the existing task worktree, with the same sole writer.

### Red proof

Add fixtures for a counted workflow, keyed workflow, nested fan-out, foreground
progress snapshots, partial result, needs attention, stop, failure, and success. The
failing tests must prove the current direct-only behavior does not yet:

- open one pane for each exact leaf while deduplicating repeated events;
- skip only children without exact identity/artifact evidence and report omissions;
- keep the main pane wide and focused while stacking later panes down;
- preserve full output through state refreshes and terminal outcomes;
- retain readability for one child, three children, narrower terminals, and overflow;
- keep model/tool text out of commands and metadata control fields.

Record the intended failure with:

```sh
npm test -- --run packages/herdr-subagents/test/supervisor.test.ts packages/herdr-subagents/test/artifacts.test.ts packages/herdr-subagents/test/viewer.test.ts
```

### Green proof and checks

Run focused tests for discovery, layout, rendering, and viewer behavior. In native
Herdr, launch a three-child read-only workflow and one foreground child. Verify pane
IDs, geometry, focus, each full scrollback, and representative running, blocked or
needs-attention, partial or failed, and successful states.

Use `frontend-development` and the accepted Supervisor Rail `interface-design`
evidence. Verify native keyboard pane focus, host scrollback, ANSI contrast, narrow
width, three-child rail, and overflow behavior. Update the mismatch ledger and recheck
all material differences. Do not claim browser or screenshot proof.

```sh
npm test -- --run packages/herdr-subagents/test
npm --workspace @mopeyjellyfish/pi-herdr-subagents run typecheck
herdr pane layout --pane "$HERDR_PANE_ID"
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
```

Changes to child projection, layout, viewer output, or artifact selection invalidate
all Slice 003 focused and native proof.

### Atomic commit and pull request

Atomic commit: `feat(herdr-subagents): supervise every visible child`. It remains in
delivery unit 1 and the standalone pull request.

### Done when

All publicly identifiable direct, workflow, nested, and foreground leaves have one
readable rail pane, repeats do not duplicate panes, inexact children are reported but
not guessed, the main pane retains focus and useful width, representative states and
compact overflow remain usable with native zoom and scrollback, every changed
TypeScript source retains the per-file coverage floor, and the mismatch ledger has no
unresolved blocker.

## [ ] 004 — Preserve upstream control and exact pane lifecycle ownership

### Outcome and requirement trace

Steer and supported resume actions initiated from an owned pane route through
`pi-subagents` public RPC. Stop uses public RPC when it supports the exact target and
otherwise the exported `pi-subagents/control-channel` `requestAsyncStop` seam for an
exact documented async directory. Closing a pane never changes run state. Reload,
resume, fork, manual close, completion, parent loss, and shutdown reconcile
idempotently and affect only exact package-owned panes. Terminal outcomes wake or
unblock the originating parent through upstream 0.58.0 behavior. This traces AC-005,
AC-007, and AC-008.

### Seam and files

Extend the supervisor with two bounded internal modules:

- `src/control-bridge.ts` — session-scoped loopback control endpoint, random capability
  token, bounded request schema and size, and versioned upstream control calls;
- `src/bindings.ts` — exact owner session, main Herdr identity, child identity, pane
  identity, process identity, and generation records;
- `src/supervisor.ts` — serialized start/tree/reconcile/shutdown transitions, watcher
  cancellation, and exact owned close decisions;
- `src/herdr.ts` — pane existence/identity checks and exact close calls;
- `src/viewer.ts` — bounded keyboard prompts and authenticated control requests;
  control disconnect or parent loss exits the viewer without stopping the child;
- lifecycle, control, security, and subprocess tests.

The loopback bridge is transport only. Store its random token and endpoint in the
mode-0600 descriptor. Never put the token in `--env`, argv, shell text, terminal
output, or a reusable file. `pi-subagents` remains the control authority. Do not
expose run control beyond localhost or let transcript content enter control requests.

### Dependencies

Slices 001 through 003. Use event-bus RPC `steer`, `stop`, and `resume` only when
0.58.0 advertises the applicable capability and exact target. Use the public
`pi-subagents/control-channel` `requestAsyncStop` only for the documented exact async
directory case; never write a private control inbox. Foreground or child-level
controls remain display-only when neither public seam supports the exact target.

The published `project-panes` interface is rejected because it starts a peer Pi
session. Model-facing `inspector.open` is rejected because it is not available over
public RPC. The local loopback endpoint only carries pane keyboard intent back to the
in-process public control adapter.

### Execution lane and ownership

`serial` in the existing task worktree, with the same sole writer.

### Red proof

With fake upstream RPC and Herdr adapters, add intended failing tests that:

- route valid steer, stop, and resume to the exact child identity and reject unknown,
  oversized, unauthenticated, cross-session, or unsupported requests;
- prove user pane close and viewer exit send no stop, interrupt, dismiss, or delete;
- run `session_start`, `session_tree`, reload, resume, fork, completion, manual close,
  and `session_shutdown` twice without duplicate viewers or foreign-pane closure;
- close only panes with an exact current package binding and leave completed, failed,
  blocked, needs-attention, and partial panes open until explicit close or parent
  shutdown;
- cancel watchers, close the control endpoint, and make orphan viewers self-exit after
  parent loss;
- observe upstream completion for success, failure, stop, partial, and attention
  without package polling or sleep.

Record the intended failure with:

```sh
npm test -- --run packages/herdr-subagents/test/control-bridge.test.ts packages/herdr-subagents/test/lifecycle.test.ts packages/herdr-subagents/test/viewer.test.ts
```

### Green proof and checks

Run focused control/lifecycle tests. Then start the deterministic Pi profile in the
task worktree, run the focused automated test before reload, enter `/reload` while Pi
is idle, and exercise live pane control, manual close, failure/partial visibility,
and successful parent wake. Confirm no duplicate tools, commands, listeners, panes,
notifications, or stale control endpoint.

```sh
npm test -- --run packages/herdr-subagents/test
npm --workspace @mopeyjellyfish/pi-herdr-subagents run typecheck
npm run smoke:source
```

Changes to RPC, control transport, binding identity, lifecycle, or cleanup invalidate
all Slice 004 automated and manual evidence.

### Atomic commit and pull request

Atomic commit: `feat(herdr-subagents): preserve control and pane ownership`. It
remains in delivery unit 1 and the standalone pull request.

### Done when

Owned pane controls use upstream public authority, unsupported controls are honest,
the capability token never enters process or terminal disclosure surfaces, pane
closure never stops work, lifecycle transitions are idempotent, only exact owned panes
close, terminal outcomes wake the exact parent, changed TypeScript sources retain the
per-file coverage floor, and the manual idle `/reload` loop shows no duplicate or
stale state.

## [ ] 005 — Make partial mutation handoffs explicit in the Implement contract

### Outcome and requirement trace

The target-repository-neutral Implement contract continues to prohibit generated hard
turn, tool, token, or cost budgets for mutation-capable workers. It now also states
that an explicitly supplied budget remains unchanged and, if it terminates work, the
parent must surface a partial or failed terminal handoff with changed-file evidence,
missing validation, and a supported recovery action. This traces AC-006.

### Seam and files

- `packages/engineering/skills/implement/SKILL.md` — extend the existing worker budget
  and partial-result contract without repository-specific terms;
- `packages/engineering/test/resources.test.ts` — assert generated mutation launches
  omit hard budgets, explicit caller limits are preserved, and terminated work does
  not trigger blind waiting, automatic retry, or a replacement worker.

### Dependencies

Slice 001 establishes the 0.58.0 terminal-handoff vocabulary. The guidance change can
be edited later but must be validated against the final runtime behavior.

### Execution lane and ownership

`serial` in the existing task worktree, with the same sole writer.

### Red proof

Extend the focused resource test first. It must fail until the skill explicitly
requires preservation of a supplied limit and the complete partial/failed handoff:
changed files when available, checks not run, recovery target, and immediate return of
control instead of waiting or launching a replacement mutation worker.

Record the intended failure with:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

### Green proof and checks

Make the smallest target-neutral wording change and run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
```

A change to the worker budget, partial-result, retry, or recovery wording invalidates
this proof. Do not manufacture runtime enforcement in the engineering skill.

### Atomic commit and pull request

Atomic commit: `fix(engineering): require explicit partial worker handoffs`. It remains
in delivery unit 1 and the standalone pull request.

### Done when

The resource test proves that generated mutation workers have no hard execution
budgets by default, explicit caller limits remain authoritative, and budget-terminated
work returns a complete recovery handoff without blind waiting or replacement writes.

## [ ] 006 — Synchronize user guidance and verify the complete delivery unit

### Outcome and requirement trace

The new package is independently installable and explains composition, Supervisor
Rail behavior, compatibility, controls, transcript trust, lifecycle, failure recovery,
and optional Herdr behavior. Root documentation and validators agree on the 0.58.0
pin and selected resources. The complete current tree passes automated, packed,
security, native Herdr, and fixed-diff assurance. This traces AC-010 and AC-011 and
closes AC-001 through AC-009.

### Seam and files

- `packages/herdr-subagents/README.md`, `CHANGELOG.md`, `LICENSE`, `package.json`, and
  `tsconfig.json`;
- root `README.md`, `docs/architecture.md`, and `packages/README.md` when its package
  inventory or install contract requires an entry;
- `agents/*.md` and the root issue #1207 workaround statement, changed only if the
  installed 0.58.0 contract and focused evidence require it;
- `scripts/lib/packages.ts`, `test/tooling/packages.test.ts`, root manifest, lockfile,
  and release metadata for final synchronization;
- accepted `pitch.md`, `plan.md`, and Supervisor Rail design images;
- final frozen diff and mismatch ledger evidence.

### Dependencies

Slices 001 through 005. Documentation must describe verified final behavior, not
planned behavior.

### Execution lane and ownership

`serial` for final edits. Freeze the tree after focused checks pass. Then run one
read-only QA lane and one read-only Reviewer lane concurrently against the same frozen
tree. Neither lane may edit files.

### Red proof

Before final documentation changes, run focused package/profile validation to expose
missing package files, release entries, stale 0.50.0 text, the issue #1207 workaround,
unexpected `agents/*.md` tool-list effects, direct upstream extension paths, missing
compatibility guidance, and any unverified acceptance criterion. Treat each mismatch
as the final documentation and metadata baseline.

### Green proof and checks

Run focused tests first, then the deterministic live acceptance and required gates on
the final tree. Do not run `npm run check` concurrently with any command it includes.

```sh
npm test -- --run packages/herdr-subagents/test packages/engineering/test/resources.test.ts test/tooling/packages.test.ts
npm --workspace @mopeyjellyfish/pi-herdr-subagents run typecheck
npm run packages:check
npm run smoke:source
npm run security:check
npm run check
```

The final `npm run check` includes the packed smoke path. Do not run a separate
unchanged `npm run smoke:packed` immediately before it; record the packed proof from
the composite gate.

Manual acceptance must use the task worktree and pinned Pi with ambient discovery
disabled. Inspect the worktree before trusting it, start the deterministic profile,
confirm one upstream subagent tool registration and expected local resources, run the
focused automated test, enter `/reload` while idle, launch direct, workflow, nested
when publicly observable, and foreground children, exercise controls and manual pane
close, and verify state, scrollback, focus, parent wake, and exact cleanup. Run
`npm run smoke:source` after the reload loop before final gates.

Use `herdr pane layout`, `pane list`, and `pane read --format ansi` to complete the
native mismatch ledger. Close only test panes and package-owned viewers. Do not close
unrelated Herdr panes or the active workspace.

Freeze the resulting tree. Run selected QA for executable and native acceptance and
Reviewer for the accepted pitch/plan, public seams, package composition, lifecycle,
security, and maintainability. Join findings into one repair packet, repair only
verified issues, rerun invalidated evidence, and repeat no unchanged review.

### Atomic commit and pull request

Atomic commit: `docs(herdr-subagents): document supervised subagent panes`. Include
final root-profile and feature-document synchronization that is not already part of a
behavioral commit. It remains in delivery unit 1.

After final review and verification, inspect the complete diff and use `open-pr` for
one standalone pull request based on `main` only when publication is authorized. Do
not merge or release.

### Done when

Every acceptance criterion has exact evidence; package, root profile, validator,
lockfile, docs, and release metadata agree; the native mismatch ledger has no blocker;
all new TypeScript sources satisfy the per-file 90% line, statement, and function plus
85% branch coverage floor; focused tests, package validation, source and packed smoke,
security checks, and `npm run check` pass on the final tree; final QA and review
findings are resolved or explicitly rejected with evidence; no staged credentials,
absolute local paths, package archives, sessions, trust state, coverage, or
delegated-agent artifacts exist.
