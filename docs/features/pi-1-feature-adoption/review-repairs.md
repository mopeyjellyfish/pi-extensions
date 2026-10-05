# Pi 1 feature adoption review repairs

Status: Accepted bounded correction request

## Intent and authority

Correct PR #140 on `feat/pi-1-feature-adoption`. Keep one pull request. Preserve
remote head `10ce3ffd3eff94d2d54758eaa5f2a29293529bba` and the existing main merge.
The user requests review, triage, and correction of incorrect behavior.

The user selected **Codex subscription only**, then explicitly approved **our own
versioned Codex image transport**. This supersedes the original plan's Platform
API-key transport decision. There is no Platform fallback and no Codex app-server
or delegated model turn.

## Image transport contract

Follow the image JSON protocol from OpenAI Codex `rust-v0.160.0`. This is an
undocumented, version-sensitive backend contract, not a public compatibility
promise. Record that limit in the package documentation.

- Use Pi's existing `openai-codex` OAuth authentication. Do not read Codex auth
  files, change login state, or store credentials in configuration.
- Send JSON to the fixed trusted Codex backend's `/images/generations` or
  `/images/edits`. Never send subscription credentials to Platform endpoints.
- Use `gpt-image-2` by default. Do not claim verified `gpt-image-2.5` support.
- Encode reference images as inline image data URLs in the edit `images` array.
- Keep PNG output. Reject masks and JPEG/WebP selection before sending a request.
  The pinned Codex request types do not expose those controls.
- Replace the three-size enum with `auto` or a dimension string. For GPT Image 2,
  validate both edges divisible by 16, maximum edge 3840, aspect ratio at most
  3:1, and total pixels from 655360 through 8294400. The native endpoint encodes
  size as a string. Live custom-size backend acceptance remains unverified.
- Forward a valid requested size unchanged. Check returned image dimensions
  before saving an exact-size result. Never silently resize or substitute a
  preset. Explain backend rejection without claiming guaranteed compatibility.
- Preserve bounded responses, cancellation, useful non-interactive errors,
  output validation, project path containment, and refusal to overwrite evidence.
- Do not retry image POST requests automatically. No idempotency contract is
  established.

## Review repair inventory

1. **Actionable:** Todo mutation persistence is coupled to top-level tool
   results. Codemode nested results do not preserve those snapshots. Persist
   mutations in branch-aware custom entries and retain old snapshot replay.
2. **Actionable:** The doctor treats `advisor` as a builtin, although it is not
   one in pinned pi-subagents. Remove it. Without effective discovery, warn
   about possible override bypass instead of rejecting permitted custom agents
   or recommending their disablement.
3. **Actionable:** Worktrunk structured results omit truncation metadata. Add a
   schema-described completeness indicator. Explain that shortened identifiers
   cannot safely drive follow-up operations.
4. **Actionable user correction:** The image schema restricts supported custom
   dimensions to three presets. Use the dimension contract above.
5. **Actionable user correction:** Image generation uses separately billed API
   authentication instead of the requested subscription. Use the approved native
   Codex protocol above.

No GitHub conversation comments, review summaries, or review threads existed at
intake. All CI checks passed on the fixed remote head. No remote comments or
thread resolutions are requested.

## Verification and delivery

Use one implementation writer and behavior-focused failing tests before fixes.
Mock provider network and session persistence boundaries. Cover auth provenance,
exact URLs and JSON envelopes, reference edits, size validation, unsupported
controls, bounded output/errors, cancellation, and no Platform fallback.

Run affected focused tests, source smoke, and `npm run check`. Run required
security checks if dependency or installation metadata changes. Inspect the
final diff and verify each repaired finding. Commit and normally push only the
named branch, then update PR #140 without another PR or history rewrite.

Real image generation is not part of automated verification. It can expose
reference images and consume subscription quota. Report live entitlement and
custom-size acceptance as unverified until a separate bounded, consented test.

## Sources

- [Codex image request types](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/codex-api/src/images.rs)
- [Codex image endpoints](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/codex-api/src/endpoint/images.rs)
- [Codex native image backend](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/ext/image-generation/src/backend.rs)
- [Codex native image tool](https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/ext/image-generation/src/tool.rs)
- [GPT Image 2 dimensions](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)

## Local implementation evidence

The bounded repair is implemented and ready for publication. Parent-owned full
checks and source smoke pass. Independent fixed-boundary review found two
remaining Worktrunk truncation cases; both have public-tool regression tests and
are repaired. No real provider request or login change was made.

- Todo appends custom snapshots only for successful state changes, and replays
  custom and legacy tool-result snapshots in branch order. Tests cover nested
  calls without direct tool results, lifecycle restoration, branch switching,
  invalid latest entries, no-ops, cancellation, and atomic rejection.
- Doctor no longer treats `advisor` as a builtin. Possible `delegate`, `oracle`,
  and `scout` override bypasses are recommendations because discovery is not
  available. Packaged-role disablement remains an error.
- Worktrunk describes and returns `truncated` for every successful structured
  result. Tests cover omitted worktrees, shortened identifiers and main paths,
  and overflow cleanup previews that must not offer approval.
- Image tests verify subscription provenance, fixed Codex URLs, native JSON
  generation and reference edits, case-insensitive header merging, JWT account
  metadata fallback, exact custom size forwarding, PNG-only controls, bounded
  responses, safe errors, cancellation through writing, and no overwrite.
- The image runtime accepts only verified `gpt-image-2`. It has no Platform
  fallback, credential file reader, app-server, delegated turn, or retry loop.
  The existing base64 validator overflowed on an 8 MiB artifact; a public-tool
  regression test now passes with a non-recursive validation expression.

Intended red proofs failed for missing Todo custom entries, doctor error
severity and the false `advisor` builtin, absent Worktrunk truncation, old
Platform selection/schema, credential-bearing stream errors, cancellation
between open and write, and multi-megabyte base64 stack overflow. Two additional
Worktrunk fixture failures were diagnosed separately (duplicate paths, then
missing main worktree) and corrected; they were not behavioral red proof.

Focused validation uses Node `24.18.0`, Go `1.26.5`, and Vitest `4.1.11`, reusing
the parent's unchanged selector/lockfile setup fingerprint:

```sh
npm test -- --run packages/frontend-developer/test packages/todo/test packages/worktrunk/test test/tooling/profile-doctor.test.ts
npx tsc --noEmit -p packages/frontend-developer/tsconfig.json
npx tsc --noEmit -p packages/todo/tsconfig.json
npx tsc --noEmit -p packages/worktrunk/tsconfig.json
npx tsc --noEmit -p tsconfig.json
```

The affected suites pass with 119 tests in nine files. The final full check passes
with 881 tests in 58 files and source/packed smoke for 20 packages and the private
root profile. A separate source smoke passes. Changed TypeScript also passes
type-aware ESLint. No document-content tests were added.

The deterministic Pi `1.0.3` TUI loaded the worktree profile and reloaded it with
`/reload` without duplicate-resource or conflict diagnostics. `/todos` and
`/worktree status` worked after reload. Image execution remains covered by mocked
public-tool tests; real subscription entitlement was not tested.

Exact-release image types, endpoints, native backend, and native tool were read
from the official source links above. Pi `1.0.3` model-registry, Codex header/JWT,
and custom-session-entry contracts were checked in the pinned dependency. The
installed pi-subagents builtin directory contains no `advisor`.

The dimension guide contains a strict `<3840` statement alongside a 3840 example
and caveat. Local validation follows the accepted `<=3840` bound; documentation
reports possible backend rejection. Live subscription entitlement and custom-size
acceptance remain unverified. No dependency or installation metadata changed.
