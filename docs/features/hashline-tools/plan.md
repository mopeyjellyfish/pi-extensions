---
status: accepted
---

# Plan: Hashline file tools

This plan delivers the accepted
[`pitch.md`](./pitch.md) completely before publication. It uses the pinned Oh My
Pi Hashline source at commit
`644ad30d6e9436074a00f8bd08ecadcd98992fc1` and Pi 0.84's public extension and
tool-definition APIs.

## Execution mode

**Accept-all implementation.** Whole-plan approval confirms accept-all
authority only for this named plan on `feat/hashline-integration`. Material
forecast variance returns control to the human. A changed delivery boundary or
authority needs fresh approval.

Accept-all does not authorize merge, release, npm publication, deployment,
destructive cleanup, user-settings changes, worktree removal, or unrelated
work.

## Delivery topology

| Delivery unit | Branch                      | Pull request base | Vertical slices            | Dependencies | Lane/worktree owner                                      |
| ------------- | --------------------------- | ----------------- | -------------------------- | ------------ | -------------------------------------------------------- |
| 1             | `feat/hashline-integration` | `main`            | `001`, `002`, `003`, `004` | none         | serial implementation lane; current worktree; one writer |

One delivery unit, branch, and pull request is appropriate because the vendored
library, Pi tool adapter, snapshot lifecycle, aggregate profile entry, and
attribution are one installable behavior. The pitch and plan share the
implementation publication. No stack position has independent merge or rollback
value before the complete tool chain exists.

## Critical path, dependencies, and lanes

Critical path:

```text
001 installed anchored edit
  -> 002 full language and safety parity
    -> 003 write/session coordination
      -> 004 aggregate and packed acceptance
```

There are no parallel writer lanes. Every slice changes
`packages/hashline`, and later slices depend on the same tool and state
contracts. One sole writer keeps the current linked worktree for all
implementation. The parent retains product and architecture decisions, inspects
each fixed point, and owns plan closure and publication.

Forecast:

- active lanes: one serial implementation lane;
- delivery units and pull requests: one and one;
- integration points: upstream library to Node adapters, library to Pi tool
  overrides, tool results to session restoration, package to root profile;
- expensive gates: about 144 MB of Tree-sitter WASM runtime and grammar catalog
  installed and the accepted grammar set loaded on supported CI platforms, the
  ported upstream suite, concurrency and lifecycle integration tests, source and
  packed Pi smoke, `npm run check`, `npm run security:check`, and manual idle
  `/reload` acceptance;
- likely cascade cost: a change to snapshot details or canonical path handling
  invalidates slices `001`-`003`; a runtime dependency or manifest change also
  invalidates slice `004` packed and security evidence.

Material variance includes an unsupported required grammar operation, inability
to preserve Pi image/read/write result contracts through public APIs, a required
copy of another Oh My Pi package, unsupported target platforms, a second
publication boundary, or a need for more than one writer. Stop and return to the
human if any occurs.

Invalidation map:

| Changed surface                                   | Evidence invalidated                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Vendored parser, applier, normalization, recovery | Ported upstream focused tests and all library parity tests                            |
| Syntax or line-diff adapter                       | Block, boundary-repair, stale recovery, platform packed-install, and security checks  |
| Read formatting or seen-line metadata             | Anchored-read tests, edit grounding tests, output bounds, session restoration         |
| Edit filesystem or canonical path policy          | Mutation, traversal, symlink, multi-section preflight, move/remove, concurrency tests |
| Write wrapper or snapshot state                   | Write/edit serialization, head-tag refresh, reload/resume/fork tests                  |
| Package manifest, lockfile, root profile          | Package validation, source smoke, packed smoke, security checks, deterministic reload |
| Prompt, README, notice, or copied-file inventory  | Prompt contract, pack contents, markdown checks, attribution review                   |

## [x] 001 — Installed package performs one safe anchored edit

### Outcome and requirement trace

Installing `@mopeyjellyfish/pi-hashline` provides a real extension: `read` emits
a `[PATH#TAG]` header and numbered addressable rows, and `edit` applies one
tagged `PUT N.=M:` replacement to the observed file. The package also exposes
the complete imported Hashline library under the supported Node runtime.

Trace: AC-001, AC-002, AC-003, AC-004, the range-edit part of AC-005, AC-009,
and the independent-install part of AC-010.

### Seam and files

Public seams:

- package install through `packages/hashline/package.json#pi.extensions`;
- default extension factory in `packages/hashline/src/index.ts`;
- copied library exports under `packages/hashline/src/hashline/`;
- Pi's public `createReadToolDefinition`, `registerTool`,
  `withFileMutationQueue`, truncation helpers, and built-in result details.

Likely files:

- `packages/hashline/{package.json,tsconfig.json,README.md,CHANGELOG.md,LICENSE}`;
- `packages/hashline/THIRD_PARTY_LICENSES.md` and
  `packages/hashline/UPSTREAM.md`;
- complete upstream source, `grammar.lark`, and `prompt.md` under
  `packages/hashline/src/hashline/`;
- Node compatibility adapters under `packages/hashline/src/runtime/`;
- extension, state, filesystem, and initial read/edit adapters under
  `packages/hashline/src/`;
- ported tests under `packages/hashline/test/upstream/` and focused extension
  tests under `packages/hashline/test/`;
- `release-please-config.json`, `.release-please-manifest.json`, and
  `package-lock.json`.

Slice `001` provisionally used `@ast-grep/napi@0.45.0`; slice `002` removes it
because its public Node interface does not expose the strict parse-error signal
required by upstream fail-closed behavior. Use exact runtime dependencies
`web-tree-sitter@0.26.11` and `tree-sitter-wasm@1.1.3` for syntax, plus
`diff@9.0.0` for line-run recovery. Port Oh My Pi's `pi-ast` block-range and
enclosing-boundary algorithms to TypeScript over Tree-sitter's named-node,
position, traversal, and `hasError` interface. Load HTML, JavaScript/JSX,
TypeScript/TSX, CSS, Bash, Go, Rust, Python, JSON, Markdown, and YAML grammars by
default from the catalog. Every selected version is older than the repository's
14-day release-age floor. Replace Bun file/hash and the private LRU with Node
crypto/fs and a small package-owned bounded cache. Do not import another Oh My
Pi runtime package or add Rust/native-binary release infrastructure.

### Dependencies

Accepted pitch, pinned upstream commit, repository package contract, and Pi 0.84
public tool-override contract.

### Execution lane and ownership

Serial. The sole implementation writer owns the current linked worktree. No
other writer may modify package, release, lockfile, or root metadata.

### Red proof

Add a public integration test that loads the extension factory, invokes `read`
on a fixture, extracts its minted tag, and invokes `edit` with one tagged range.
Before production code exists, it fails because no Hashline tools are
registered. Also port representative upstream parser/patcher tests; they fail
under Node while Bun and Oh My Pi imports remain unresolved.

### Green proof and checks

- The extension registers one `read` override and one Hashline `edit` override.
- A text read and tagged range edit pass end to end through public tool
  execution; an image read delegates unchanged to Pi's built-in definition.
- Read output applies the 2,000-line/50-KB limits after adding anchors and keeps
  `ReadToolDetails` compatible.
- The copied package entrypoint loads under Node without Bun or ambient Oh My Pi
  modules.
- Representative parser, normalization, snapshot-collision, patcher, and range
  tests pass under Vitest.
- `npm --workspace @mopeyjellyfish/pi-hashline test`, package typecheck, focused
  package validation, `npm pack --dry-run --json`, and
  `npm run security:check` pass after the dependency and lockfile change.

Changes to library adapters, read formatting, schema, package dependencies, or
result details invalidate this proof.

### Atomic commit and pull request

Completed in `abc0f10` as
`feat(pi-hashline): add anchored Hashline editing`. It includes source, focused
tests, package documentation and notices, release registration, and the lockfile
required to leave a valid independently installable package. Delivery unit 1;
no separate stack position.

### Done when

The package is structurally valid and independently loadable, attribution is in
the packed artifact, and one observed text range can be changed only with its
valid tag without regressing image reads or output limits.

## [x] 002 — Full language and recovery fail closed

### Outcome and requirement trace

The Pi `edit` override supports the complete imported Hashline language and
retains its safety properties: inserts, block operations on supported
languages, cuts and registers, moves, removals, multi-section preflight,
line-ending/BOM preservation, boundary repair, stale-session recovery, seen-line
validation, and bounded diff previews. Unsupported syntax resolution fails
clearly rather than guessing.

Trace: AC-005, AC-006, and the edit side of AC-007.

### Seam and files

Public seam: one `edit({ input })` call and its `EditToolDetails`-compatible
result.

Likely files:

- remaining adaptations in `packages/hashline/src/hashline/`;
- `packages/hashline/src/runtime/{syntax.ts,line-diff.ts}`;
- `packages/hashline/src/edit-tool.ts`, filesystem/path policy, queue helper,
  compact result builder, and tool schema;
- complete ported upstream behavior tests plus Pi-specific policy and result
  tests.

The syntax adapter initializes Tree-sitter WASM and loads the accepted grammars
once before tool use, maps accepted file extensions to those grammars, and ports
Oh My Pi's `block_range_at` and `enclosing_block_boundaries` algorithms over
strict parse trees. `block_range_at` rejects a block when its selected subtree
has an error, but deliberately permits unrelated root parse errors; it returns
`null` for unknown languages or load failures. `enclosing_block_boundaries` and
whole-file parse-clean advisories reject root parse errors. Every tree/parser
resource is bounded and deleted when no longer needed. The line-diff adapter maps jsdiff runs to the exact
unchanged/added/removed contract recovery expects.
Canonical targets accept the same cwd-relative and absolute paths as Pi's
built-ins, normalize a leading `@`, and key snapshots by canonical absolute
path. This adapter does not add a cwd sandbox that Pi itself does not impose.

For multi-section edits, resolve and sort unique canonical paths, acquire nested
Pi mutation queues in deterministic order, preflight every section while all
locks are held, then commit. This prevents deadlock, partial validation writes,
and sibling lost updates.

### Dependencies

Slice `001` and its package/tool/state contracts.

### Execution lane and ownership

Serial in the same current worktree with the same sole writer.

### Red proof

For each remaining behavior family, first enable or add the smallest ported
upstream public test and one Pi integration assertion where host policy differs.
At minimum, observe intended failures for block resolution, named-register
cross-section movement, stale but recoverable anchors, unseen-line rejection,
duplicate canonical targets, and a late-invalid multi-section patch that must
leave every file unchanged.

### Green proof and checks

- All applicable upstream Hashline tests pass under Vitest without weakening
  assertions. Any intentionally host-specific exclusion is listed in
  `UPSTREAM.md` with a reason and equivalent replacement proof.
- Block and boundary tests prove exact behavior for HTML,
  JavaScript/JSX, TypeScript/TSX, CSS, Bash, Go, Rust, Python, JSON, Markdown,
  and YAML. Unknown or unparsable languages reject `PUT N*`/`CUT N*`;
  after-block lowering keeps only upstream's documented warning behavior.
- Stale recovery maps unchanged unambiguous anchors and rejects changed or
  duplicated ambiguous anchors.
- Seen-line tests reject edits in or across undisplayed/elided rows.
- Multi-section preflight and deterministic nested queues leave all files
  unchanged on every prepare failure and avoid duplicate canonical targets.
- Edit results provide a fresh header, bounded compact preview, standard diff
  and patch details, first changed line, warnings, and per-file data without
  exceeding Pi tool limits.
- Focused package tests, typecheck, lint, and package coverage thresholds pass.

Any parser, recovery, syntax, filesystem, canonicalization, queue, or result
change invalidates its focused family and the full ported suite.

### Atomic commit and pull request

Atomic commit: `feat(pi-hashline): complete patch language safety`. Delivery
unit 1; no separate stack position.

### Done when

Every accepted grammar and safety behavior has public red/green evidence, all
applicable upstream tests pass on Node, and unsupported or ambiguous edits fail
without writes.

## [x] 003 — Writes and session branches preserve valid state

### Outcome and requirement trace

Whole-file `write` remains Pi's new-file/rewrite tool, but successful writes and
Hashline edits share the mutation queue and one branch-aware snapshot/clipboard
state. Startup, reload, resume, fork, compaction, and shutdown restore only
verifiable bounded state or safely invalidate it; no state crosses sessions.

Trace: AC-007, AC-008, and AC-009.

### Seam and files

Public seams:

- Pi-compatible `write({ path, content })` override;
- `session_start` and `session_shutdown` lifecycle handlers;
- bounded state metadata in read/edit/write tool-result details;
- resumed/forked branch entries exposed by `ctx.sessionManager.getBranch()`.

Likely files:

- `packages/hashline/src/write-tool.ts`;
- `packages/hashline/src/state.ts` and extension lifecycle wiring;
- read/edit result metadata and restoration changes;
- lifecycle, branch, concurrency, cancellation, and output-bound tests;
- package README prompt/tool workflow.

Use Pi's built-in write definition with injected operations so directory
creation, write, abort checks, snapshot refresh, and queue ownership remain one
window. Persist only bounded restoration metadata: canonical path, tag,
displayed-line provenance, and bounded named-register state. On session start,
re-read a referenced path and restore a snapshot only when its current normalized
content recomputes the recorded tag. Inconsistent, missing, oversized, or stale
metadata is ignored and requires a fresh `read`. Restore from the active branch,
not all session entries. Clear all in-memory state idempotently on shutdown.

### Dependencies

Slices `001` and `002`.

### Execution lane and ownership

Serial in the same current worktree with the same sole writer.

### Red proof

Add deterministic tests that initially expose:

- parallel `write` and `edit` calls against one path losing one mutation or
  leaving an old head tag;
- reload and resume losing a still-verifiable tag;
- fork restoring state from an abandoned sibling branch;
- an oversized or changed-on-disk restoration payload being trusted;
- shutdown leaving state visible to the next session instance;
- cancellation releasing a queue before an in-flight write settles.

### Green proof and checks

- Built-in write content, errors, details, renderer inheritance, leading-`@`
  handling, directory creation, and abort behavior remain compatible.
- Same-path write/edit calls serialize through Pi's queue; different paths may
  proceed independently.
- A successful write records the landed full text before releasing its queue and
  returns a usable fresh tag in bounded details; a failed or cancelled write
  does not advance state.
- Startup/reload/resume/fork reconstruct only the active branch's verifiable
  current snapshots and bounded registers; stale state fails closed and tells
  the next edit to re-read.
- Compaction retains needed details through active branch entries, and shutdown
  cleanup is idempotent.
- Focused lifecycle/concurrency tests, package test, typecheck, lint, and
  coverage thresholds pass.

State schema, queue windows, write operations, or lifecycle handlers invalidate
all slice `003` evidence and the affected read/edit tests from prior slices.

### Atomic commit and pull request

Atomic commit: `fix(pi-hashline): preserve branch-aware file state`. Delivery
unit 1; no separate stack position.

### Done when

Write remains a compatible whole-file tool, concurrent mutations cannot lose
updates, branch transitions restore only safe state, and shutdown leaves no
session leakage.

## [ ] 004 — Default profile installs and reloads Hashline once

### Outcome and requirement trace

Installing the repository profile enables the new extension exactly once and
gives the model the documented anchored-read/Hashline-edit/whole-file-write
workflow. Independent package installation remains valid. Source and packed
artifacts include all required source, grammar, prompt, notices, and docs.

Trace: AC-002, AC-003, AC-009, AC-010, and AC-011.

### Seam and files

Public seams:

- root `package.json#pi.extensions` and root lockfile;
- `packages/hashline/package.json#files`, exports, and Pi manifest;
- root and package installation documentation;
- release metadata, package validator, source/packed smoke, Pi RPC discovery,
  and deterministic manual `/reload` acceptance.

Likely files:

- root `package.json`, `package-lock.json`, and `README.md`;
- `packages/hashline/{package.json,README.md,UPSTREAM.md,THIRD_PARTY_LICENSES.md}`;
- package/resource validator fixtures only if the existing generic contract
  needs a behavior-focused extension;
- accepted `docs/features/hashline-tools/plan.md` checkbox state.

### Dependencies

Slices `001`-`003` stable in the same delivery unit.

### Execution lane and ownership

Serial in the same current worktree. The implementation writer returns the
lease and evidence before the parent performs final fixed-diff review, plan
closure, commit verification, and publication.

### Red proof

Before root integration, run the deterministic root-profile discovery probe and
show that `read`/`edit`/`write` still resolve to built-ins. Add or extend a
manifest/profile test that expects the explicit Hashline extension path and
packed third-party files; observe it fail before the manifest/doc changes.

### Green proof and checks

- Root profile discovery reports the Hashline extension once, with `read`,
  `edit`, and `write` owned by that extension and no duplicate extension
  registration. Pi's documented built-in-override warning is expected.
- Independent `-e packages/hashline` discovery exposes the same three tools
  without relying on root resources.
- Package pack inventory contains the full imported/adapted source, grammar,
  prompt, README, changelog, license, upstream provenance, and third-party
  notice, with no Bun cache, native build artifact, session, or credential.
- Root and package READMEs credit Oh My Pi and Can Bölük and explain that
  Hashline replaces edit syntax while read and write retain their roles.
- Run the focused automated suite before reload. Start the repository's pinned
  deterministic Pi command from this worktree, confirm the expected tools and
  only Pi's documented built-in-override warning, enter `/reload` while idle,
  then read and edit a fixture and confirm fresh behavior without stale or
  duplicate state.
- Run `npm run smoke:source`, then `npm run fix`, `npm run check`, and
  `npm run security:check`. Inspect `npm pack --dry-run --json`, the complete
  final diff, untracked files, package boundaries, release metadata, and
  generated-artifact hygiene.
- One fresh fixed-diff formal review checks the accepted pitch and plan on Spec
  and Standards axes. Material repairs rerun invalidated focused and final
  gates and receive bounded re-review.

Any manifest, dependency, lockfile, extension entrypoint, package-file list,
prompt, notice, or root profile change invalidates source/packed smoke and final
required gates. Production TypeScript changes additionally invalidate package
tests, typecheck, lint, coverage, and formal review.

### Atomic commit and pull request

Atomic commit: `feat: enable Hashline file tools`. It includes root profile and
documentation integration plus final accepted plan state. Delivery unit 1,
base `main`, one pull request. Publish only after all final gates and review pass;
do not merge.

### Done when

Both independent and root-profile installs load the intended tools once; manual
reload exercises the current worktree source; all focused, packed, security, and
required checks pass; attribution is complete; formal review has no blocking
finding; and the branch is ready for one authorized pull request.
