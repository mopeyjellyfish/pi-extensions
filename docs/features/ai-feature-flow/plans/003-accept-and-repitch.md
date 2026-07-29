---
schema: feature-flow-plan/v2
feature: ai-feature-flow
id: "003"
pitch_sha256: 4b76f3837e934962d15c679deb78f9e66243343c1cc946a616d770980c8a4ae9
depends_on:
  - "002"
---

# Slice 003: Accept and repitch

## Goal

Resuming a draft feature runs research-led shaping through one complete-pitch
approval, pins the accepted file hash, and freezes its bytes. A later material
decision preserves the accepted artifact, archives affected plans, and starts a
new complete draft/reacceptance loop.

## Pitch trace

- [Shaping loop](../pitch.md#shaping-loop)
- [Prototypes, diagrams, and assets](../pitch.md#prototypes-diagrams-and-assets)
- [Cross-functional pitch](../pitch.md#cross-functional-pitch)
- [Pitch immutability](../pitch.md#pitch-immutability)
- [Research and prior art](../pitch.md#research-and-prior-art)
- **AC-004**, **AC-005**, **AC-006**, **AC-007**, **AC-008**, relevant
  **AC-011**, **AC-014**, **AC-016**, and **AC-017**

## Observable outcome

The user sees a rich, independently reviewed pitch in one document-backed
question. Approval changes only its final frontmatter status, pins the SHA-256 in
`index.json`, and makes later byte edits fail validation. Repitching creates a
versioned immutable archive and a new draft without losing banked code.

## Dependencies and predecessor postconditions

Depends on slice 002. `/shape` can locate and activate exactly one safe feature,
validate its canonical draft artifacts, and derive `shaping` as the next phase.

## Scope

- Complete the rich pitch template and shaping guidance: repository truth,
  conditional primary-source research, adaptive recommended question batches,
  qualitative appetite, alternatives, Mermaid, optional smallest prototype,
  explicit boundaries and banking policy, and self-contained normative content.
- Require a separate read-only reviewer before the one whole-pitch approval.
- Add narrow helper transitions for prospective validation, final status change,
  SHA-256 pinning, accepted-byte verification, and archive/new-draft repitch.
- Preserve accepted bytes and used plan archives across ordinary failures; do
  not create empty asset/prototype directories.
- Keep product quality, materiality, research synthesis, and human questions out
  of the helper.

## Public seam and first TDD tracer

**Seam:** `/shape` while the helper derives `shaping`, plus helper
accept/verify/repitch commands.

**Independent expectation:** `node:crypto` over the final accepted bytes is the
hash authority.

Create one failing fixture that accepts a draft, independently hashes the final
file, and expects the ledger hash to match. Implement only that transition.
Then alter one accepted byte and observe a failing immutability test before
adding verification. Add archive byte-equality and ordinary write-failure
rollback one tracer at a time.

## Validation

- Focused helper acceptance/hash/archive tests and skill resource tests.
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- Package dry-run inspection.
- `npm run smoke:source`
- `npm run packages:check`
- `npm run check` after final edits.

## Dogfood and QA

In a disposable feature, let repository evidence answer a would-be user
question, research one material unknown, and use a minimal static prototype for
a deliberately visual decision. Review and approve the complete pitch, verify its hash independently, prove byte
edits are rejected, then introduce a material decision and exercise archive →
draft → review → reacceptance after an idle reload. Record complete slice
evidence and bank slice 003 before planning activates.

## Risks and escalation

- Multi-path archive operations are not filesystem-atomic. Validate the complete
  prospective result before writes and restore ordinary failures; report crash
  limits rather than introducing a database or service.
- Linked assets remain illustrative. Normative behavior must be embedded in the
  pitch.
- If a new question changes accepted intent, stop and repitch; do not patch a
  plan around it.

## Done when

A rich pitch can be accepted without a fixed-heading ceiling, only the complete
pitch approval accepts it, hash and archive behavior pass, accepted bytes remain
immutable, routine review fixes need no extra user gate, all checks pass, fresh
review is blocker-free, and complete evidence plus verified banking precede
slice 004.
