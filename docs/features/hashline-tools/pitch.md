---
status: accepted
---

# Shape: Hashline file tools

## Problem and evidence

Pi's native `edit` tool uses exact-text replacement. It does not provide the
snapshot-bound, line-addressed patch language requested for model-authored file
changes. The upstream
[`@oh-my-pi/hashline`](https://github.com/can1357/oh-my-pi/tree/644ad30d6e9436074a00f8bd08ecadcd98992fc1/packages/hashline)
package provides the parser, patcher, stale-snapshot checks, recovery, file
operations, clipboard registers, compact previews, grammar, prompt, and tests,
but it is a library rather than a Pi extension.

The analyzed upstream package also cannot be copied into this Node-based Pi
profile without an integration layer. It requires Bun and imports
`@oh-my-pi/pi-natives` and `@oh-my-pi/pi-utils`. Oh My Pi supplies substantial
coding-agent integration outside `packages/hashline`, including read formatting,
per-session snapshot state, the `edit` executor, filesystem policy, block
resolution, write synchronization, and rendering.

Pi 0.84 explicitly permits an extension to override built-in tools by
registering the same tool name. Its extension contract also requires file
mutations to use `withFileMutationQueue()` and tool overrides to preserve the
built-in result shape.

## Proposed solution

Add one independently installable production package,
`@mopeyjellyfish/pi-hashline`, and enable its extension in the private root
profile.

The package will contain the complete upstream `packages/hashline` source,
grammar, prompt, tests, documentation, and provenance from pinned commit
`644ad30d6e9436074a00f8bd08ecadcd98992fc1`. Keep the copied implementation
in-repository so it can be tested and changed locally. Adapt Bun-only and
Oh-My-Pi-only dependency seams to this repository's supported Node runtime
without weakening the language's fail-closed safety behavior. Port Oh My Pi's
`pi-ast` block-range and enclosing-boundary algorithms to TypeScript and run
them on strict Tree-sitter WASM. Load HTML, JavaScript/JSX, TypeScript/TSX, CSS,
Bash, Go, Rust, Python, JSON, Markdown, and YAML grammars by default. Preserve
the upstream copyright and full MIT notice, identify copied or adapted files,
and credit Can Bölük and Oh My Pi in both the package README and root README.

Integrate the library through coordinated Pi tool behavior:

1. Override `read` while preserving Pi's normal path handling, image behavior,
   truncation, details, and renderer contract. Text reads record the complete
   normalized file snapshot and present addressable rows under a `[PATH#TAG]`
   header. Partial reads mark only displayed lines as eligible anchors.
2. Override `edit` with the Hashline `{ input: string }` language. Apply all
   sections through one shared per-session snapshot store and clipboard,
   preflight multi-file patches, serialize every mutation through Pi's file
   mutation queue, fail closed on stale, unseen, malformed, ambiguous, or
   unsupported anchors, and return a fresh header plus bounded diff preview.
3. Preserve `write` as the whole-file/new-file operation rather than pretending
   Hashline replaces it. Wrap it only as needed to preserve Pi semantics and
   refresh or invalidate Hashline snapshot state after successful writes.
4. Keep search tools as discovery tools in the first delivery unit. A Hashline
   edit must be grounded by `read`; it must not accept a tag inferred from an
   unmodified native search result.
5. Rebuild branch-aware Hashline state from retained tool-result details after
   startup, reload, resume, and fork. Clear session-scoped memory on shutdown.
6. Make the Hashline prompt guidance active with the tool so the model uses
   `read` for anchors, `edit` for existing files, and `write` for new files or
   intentional whole-file replacement.

Thus, Hashline replaces Pi's **edit language**. It augments `read` to mint
anchors and coordinates with `write`; it does not replace reading or whole-file
writing as concepts.

Treat this as one delivery unit: the package library, Pi adapter, aggregate
profile entry, attribution, tests, and documentation do not have independent
review or merge value.

## Boundaries and no-gos

- Copy `packages/hashline`, not the full Oh My Pi coding-agent, native package,
  utility package, CLI, or unrelated tools.
- Do not require Bun or assume Oh My Pi is installed in a target repository.
- Do not silently disable grammar operations, stale recovery, seen-line checks,
  multi-section preflight, moves, removals, clipboard registers, line-ending
  preservation, or supported block operations. An unavoidable parity gap is a
  reshape trigger, not an undocumented fallback.
- Do not replace `bash`, `grep`, `find`, `ls`, browser tools, or unrelated
  extension tools.
- Do not convert native search output into trusted edit anchors in this delivery
  unit.
- Do not edit user or project settings. Installing the independent package loads
  its declared extension; installing the repository profile loads the explicit
  root entry.
- Do not log file contents, snapshots, credentials, or session data.
- Do not preserve upstream package identity or release metadata as if this were
  an official Oh My Pi distribution.

## Decision-changing research and risks

- **Integration size:** upstream Hashline is about 4,500 lines, while Oh My Pi's
  host integration is separate and much larger. Copying only the library does
  not produce a usable Pi tool.
- **Runtime compatibility:** upstream uses `Bun.file`, `Bun.write`, `Bun.hash`, a
  private LRU import, and native syntax/diff functions. Node-compatible file,
  hash, cache, and line-diff adapters are required. ast-grep's Node API can
  expose named nodes but not the strict parse-error status required by upstream
  fail-closed boundary behavior. Use `web-tree-sitter` and a pinned prebuilt WASM
  grammar catalog instead, and port Oh My Pi's two relevant `pi-ast` algorithms
  rather than its Rust/N-API distribution. The portable runtime and catalog add
  about 144 MB unpacked and trigger security, startup, and packed-install checks.
- **Tool composition:** a `read` override must preserve non-text behavior and
  exact details expected by Pi's renderer. A write wrapper must not race with
  edit; both must share Pi's mutation queue.
- **State correctness:** tags are meaningful only in the snapshot store that
  minted them. Reload and session branching require state evidence in session
  entries, not one ambient global cache.
- **Short tags:** upstream uses four hexadecimal characters as an index into
  retained full snapshots, not as identity. Collision handling must remain
  content-aware.
- **Upstream maintenance:** the pinned commit makes the imported baseline
  auditable. Future upstream updates are explicit reviewed imports, not automatic
  synchronization.

## Authority

The parent owns product and architecture decisions, pitch synthesis, plan
synthesis, acceptance verification, and any reshape decision. An accepted pitch
and accepted complete plan authorize bounded implementation, package and root
profile edits, tests, documentation, attribution, local atomic Conventional
Commits, and publication of this task branch as one pull request.

Execution preference: **accept-all implementation** after complete-plan
approval. This preference is not implementation authority until that plan is
approved.

Merge, release, npm publication, deployment, destructive cleanup, user-settings
changes, and worktree removal are not authorized.

## Observable acceptance criteria

- **AC-001 — Complete local source:** `packages/hashline` contains the pinned
  upstream Hashline implementation, grammar, prompt, tests, documentation, and
  explicit provenance, adapted only through reviewed host-compatibility seams.
- **AC-002 — Correct attribution:** the package and root READMEs credit Oh My Pi
  and Can Bölük, and the distributed package includes the complete upstream MIT
  notice and copied/adapted-file record.
- **AC-003 — Installable package:** the package satisfies this repository's
  independent package, release metadata, source smoke, packed smoke, and Node
  runtime contracts without Bun or an ambient Oh My Pi installation.
- **AC-004 — Anchored reads:** a text `read` returns `[PATH#TAG]` plus stable
  1-indexed addressable rows, records the full normalized snapshot, marks only
  displayed rows, and retains Pi's image, cancellation, error, truncation,
  details, and rendering behavior.
- **AC-005 — Hashline edits:** `edit` accepts the documented Hashline input and
  correctly applies ranges, insertions, block operations, cuts, register pastes,
  moves, removals, multiple sections, line endings, and BOM handling. Structural
  parsing works by default for HTML, JavaScript/JSX, TypeScript/TSX, CSS, Bash,
  Go, Rust, Python, JSON, Markdown, and YAML.
- **AC-006 — Fail-closed safety:** stale or unknown tags, unseen anchors,
  malformed patches, duplicate canonical targets, ambiguous recovery, and
  unsupported block anchors fail without partial or unintended writes.
- **AC-007 — Coordinated mutations:** `edit` and successful `write` operations
  share Pi's mutation queue and snapshot lifecycle; parallel calls cannot lose a
  sibling mutation or leave a successful write under a stale head tag.
- **AC-008 — Session correctness:** startup, reload, resume, fork, compaction,
  and shutdown tests prove branch-aware snapshot and named-register restoration
  or safe invalidation without cross-session leakage.
- **AC-009 — Tool guidance:** the active prompt tells the model to use anchored
  `read`, Hashline `edit` for existing files, and `write` for new or intentionally
  replaced files. Native exact-text `edit` is not active under the same name.
- **AC-010 — Default profile integration:** installing the repository profile
  enables the Hashline package extension once, while installing
  `@mopeyjellyfish/pi-hashline` independently provides the same file-tool
  behavior without companion repository resources.
- **AC-011 — Verified parity:** ported upstream behavior tests, focused Pi
  integration tests, deterministic source loading, manual idle `/reload`
  acceptance, `npm run smoke:source`, and the repository's required completion
  checks pass against the final worktree.
