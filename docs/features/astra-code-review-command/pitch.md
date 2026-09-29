---
status: accepted
---

# Shape: Astra `/code-review` command

## Problem and evidence

The Engineering package has a strong `code-review` skill, but its prompt command is
named `/review-change`. The command does not select the configured Astra Reviewer
or apply the high-confidence review loop from Claude Code's official
`/code-review` plugin.

The older installed plugin copy uses five primary lenses, history evidence, and
numeric confidence scoring. The current official Claude Code command at commit
`db8834ba1d72e9a26fba30ac85f3bc4316bb0689` uses a preflight, instruction-file
discovery, a change summary, four parallel primary reviewers, per-issue
validation, terminal output, and opt-in `--comment` inline GitHub feedback. The
Pi command intentionally keeps five broader review lenses and one consolidated
confidence scorer so it can add repository history and the existing Go and
TypeScript review contracts. The parent launches and joins named, disjoint,
read-only lanes. No child receives fan-out authority.

The existing Engineering method is stronger in other areas. It pins a fixed diff,
checks accepted intent and repository Standards, traces changed behavior through
public seams, rejects tautological tests, and resolves applicable Go and
TypeScript methods. The new command must compose these strengths instead of
replacing the maintained method.

The root profile pins `pi-claude-bridge` 0.7.0, which is also the latest npm
release. It registers `claude-fable-5`, but it does not register
`claude-fable-5-1`. The user decided to leave Fable out until the bridge supports
the intended model, keep Pi output as the default, add explicit `--comment` and
local-only `--fix` behavior, and replace `/review-change` with `/code-review`.

## Proposed solution

Add one `/code-review [target] [--comment] [--fix]` prompt template to the
Engineering package and remove `/review-change`. Fable remains out of scope until
the bridge registers the intended Fable model.

In the complete root profile, `/code-review` uses this approved topology:

1. Require the parent to use GPT-6 Astra at high thinking effort. If it does not,
   stop and ask the human to select that profile before review.
2. Pin and state the fixed review boundary. For a pull request, read its current
   state and head. For local work, record `HEAD`, status, and the exact diff.
3. Treat pull requests that are closed, draft, automated, trivial, or previously
   reviewed at the same head as eligibility evidence. Review can continue when
   the human confirms, but remote comments remain limited to an eligible open
   pull request.
4. Launch five parallel fresh, read-only Reviewer-contract lanes with the
   explicitly approved GPT-5.6 Sol medium model override. No lane can edit or
   launch another child:
   - accepted intent, target-repository instructions, and applicable Go or
     TypeScript standards;
   - changed-line correctness, security, performance, and edge cases;
   - tests, failure paths, cancellation, concurrency, and resource lifetime;
   - focused blame, history, and directly relevant prior pull-request discussion;
   - in-file guidance, changed public contracts, architecture, testability, and
     right-sized maintainability.
5. Join and deduplicate candidate issues. Send the complete candidate set and
   fixed evidence to one fresh Luna-medium Utility scorer. The scorer applies the
   official 0–100 confidence meanings and rejects candidates below 80.
6. Have the Astra-high parent validate every retained issue against the fixed
   diff, cited instruction or intent, practical consequence, and confidence
   rubric. Report only verified issues, ordered by practical severity, and state
   unavailable evidence.
7. Confirm that the fixed boundary did not move before the final report or remote
   comment. Stop and request a stable boundary when it changed.

Every lane uses the maintained `code-review` method or a bounded lens handoff from
that method. The method keeps accepted intent and Standards as explicit axes,
rejects tautological tests, and resolves only the Go, TypeScript, React, and SQL
guidance supported by diff evidence. Target-repository instructions remain first.

Update the root `agents/reviewer.md` charter with one explicit
`Review mode: fixed-diff lens`. A lens handoff names exactly one of the five
scopes, applies the method's universal fixed-boundary, evidence, calibration,
language-routing, and read-only rules, and does not repeat both complete axes.
The existing default `Review mode: fixed-diff code` remains one integrated
Pitch-and-plan plus Standards pass. Neither mode can fan out.

Adapt the current official Claude Code command's review and comment behavior
under Apache-2.0. Record the pinned upstream commit and local content hash,
identify each modified resource, add the Apache license to the Engineering
package, set its package license to `MIT AND Apache-2.0`, and update the package
license validator, focused test, and root lockfile. Keep the existing MIT source
attribution.

The default result stays in Pi. `--comment` grants one bounded GitHub mutation
for an eligible pull request. After showing the resolved target and intended
review, perform the final head check and use the installed GitHub method. When
retained issues exist, submit one `COMMENT` review with inline comments on
changed lines. Include a committable suggestion block only when the complete,
smallest safe correction fits the changed range; otherwise use explanatory text.
When no issue survives, post one short no-issues conversation comment. Refetch
the created review or comment and report its canonical URL. A missing
authenticated GitHub capability reports the unmet action without a substitute.

`--fix` grants local code edits for retained findings only. Before writing, set up
or verify an isolated writable task worktree whose initial tree exactly matches
the pinned target, including a recorded patch for reviewed uncommitted changes.
Record the repair base and each resulting repair-tree identifier separately.
Launch one configured Worker with the joined finding packet: Astra medium for
frontend or mixed work, and Sol medium for non-frontend work. Follow
target-repository methods, add or update behavioral proof where needed, run
invalidated focused and required checks, and have the parent verify that each
finding is resolved. Do not commit, push, or publish. If the repair changes
accepted scope or architecture, stop and return to the applicable planning or
review boundary.

When `--comment` and `--fix` are both present, fix locally and defer all GitHub
comments. Local-only repairs do not change the remote pull-request head, so the
command reports that comments require a later published head and a new review.

This feature is one delivery unit with one package-scoped commit and one pull
request. The pitch and plan travel with implementation because they have no
independent merge value.

## Boundaries and no-gos

- Do not add Fable selection, a Fable reviewer profile, an `AskClaude` route, or a
  placeholder model branch in this change.
- Do not use Terra for review. Terra remains the Git delivery model. The five
  review lenses use the approved Sol-medium override under read-only Reviewer
  contracts.
- Do not let a child launch children. The parent owns all fan-out, joining,
  confidence validation, and final decisions.
- Do not weaken ordinary Reviewer behavior. Lens mode applies only to an explicit
  `/code-review` lens handoff; omitted or fixed-diff code mode remains the full
  integrated review.
- Do not add a production extension. Skills and prompt templates are sufficient.
- Without `--comment` or `--fix`, do not post, edit, commit, push, or perform any
  other repository mutation.
- `--comment` authorizes one eligible GitHub review or no-issues conversation
  comment only. It does not authorize edits, issue changes, merge, release, or
  other remote actions.
- `--fix` authorizes local repairs and verification only. It does not authorize a
  commit, push, pull-request update, merge, release, deployment, or cleanup.
- Do not run builds, tests, type checks, linters, coverage, smoke checks, or other
  QA gates during the review phase. The fix phase runs only target-required and
  invalidated verification.
- Do not report pre-existing issues, unchanged-line concerns, tooling-handled
  style, speculative risks, or general improvements without a concrete changed
  consequence.
- Do not activate Go or TypeScript methods from unrelated toolchain files.
- Do not duplicate the `code-review` skill or keep `/review-change` as an alias.
- Re-shape before adding Fable, default remote posting, adjustable confidence
  thresholds, different model topology, automatic publication, or broader fix
  authority.

## Decision-changing research and risks

- The current official Claude Code command uses four parallel primary reviewers:
  two Sonnet instruction reviewers and two Opus bug reviewers. It then launches a
  separate validator for each candidate. The accepted Pi topology uses five
  broader Sol-medium Reviewer lenses and one consolidated Luna-medium scorer
  under an Astra-high parent. This preserves independent lenses and adds history,
  test, architecture, Go, and TypeScript coverage with fewer child launches, but
  one consolidated scorer has less isolation than one scorer per issue.
- Sol is normally the non-frontend implementation model, not the formal Reviewer
  model. The user explicitly approved this read-only Sol-medium override for the
  five lenses. The fixed Reviewer tool and skill contract must remain read-only.
- History and prior pull-request evidence can be expensive or unavailable. Bound
  lookups to changed lines and directly relevant files. Report unavailable remote
  evidence and continue with repository evidence.
- A prompt template cannot enforce model, tool, or write restrictions in code.
  Clear handoff contracts, fixed agent profiles, package discovery checks, and
  manual Pi acceptance are the available controls. Tests must not assert
  Markdown wording.
- The current official command is Apache-2.0. Adapting its review and inline
  comment behavior requires a pinned attribution, a copy of the Apache license,
  a modified-resource notice, dual package license metadata, validator coverage,
  and lockfile synchronization. This is package metadata, not a new runtime
  dependency.
- The current Reviewer charter requires every fixed-diff run to perform both
  axes. The accepted topology therefore needs a narrow root-profile charter
  change for explicit lens mode. Package-only installs still use capability-based
  handoffs and cannot assume that root agent exists.
- An independently installed Engineering package might not have the root
  subagents, selected models, Worktrunk, GitHub method, or confidence scorer. It
  must report each unmet capability. It must not claim the full multi-agent review
  ran or silently select another model.
- Inline review comments are public remote mutations. `--comment` must be the
  explicit authority, and a final head check must prevent comments on stale code.
- Local `--fix` changes invalidate the reviewed tree. The parent can verify the
  named repairs, but a scope or architecture change requires a new full review.
- Removing `/review-change` is an intentional command rename. Existing users must
  move to `/code-review`; no alias remains.
- The authoritative current command is pinned at
  `db8834ba1d72e9a26fba30ac85f3bc4316bb0689`; the inspected content has SHA-256
  `2b0837c5ec0b2e75f8ba4565bdafd76fa916b0dc146608c5733af7ba5802012c`.
  The accepted five-lens design intentionally extends its four primary lenses.

## Review evidence

- **Applicability:** Go-targeted guidance. The command preserves and extends
  routing for future fixed-diff reviews of Go source, modules, CLIs, and
  Go-specific work.
- **Fixed document:** Draft revision with SHA-256
  `dd86b7e328519ec88bfbfa171b6dcf4f6752de9d8d713626bd49bb98c4daa2c2`.
- **Status:** Replacement review `3f52d2b5` approved the complete current
  revision with no blockers, material questions, or recommendations. It verified
  Go routing, role and package boundaries, remote comment authority, local repair
  safety, and the dual-license path.
- **Invalidation:** This status update is wording-only. The review remains valid
  while the proposed solution, boundaries, Authority, acceptance criteria, and
  Go routing stay unchanged.

## Authority

The parent owns product decisions, architecture, orchestration, synthesis, pitch
and plan approval, candidate joining, final confidence validation, final diff
inspection, verification, and publication decisions. The user explicitly
approved an Astra-high parent, five parallel read-only Sol-medium
Reviewer-contract lenses, and one Luna-medium Utility scorer for
`/code-review`.

Pitch approval authorizes bounded changes on `feat/code-review-skill` to the
Engineering skill, prompt, package manifest, license, third-party notice and
documentation; root `agents/reviewer.md`, `AGENTS.md`, package-license validator,
focused validator test, lockfile and aggregate documentation; and required
feature documents. It does not authorize merge, release, deployment, destructive
cleanup, or unrelated changes.

At command runtime, no flag means read-only review. `--comment` is explicit
authority for one bounded eligible GitHub review or no-issues conversation
comment. `--fix` is explicit authority for local isolated repairs and required
verification only. Combined flags fix locally and defer comments. Neither flag
grants commit, push, merge, release, deployment, cleanup, or unrelated authority.

Execution mode preference for implementing this feature is accept-all. This
preference does not become implementation authority until the complete plan is
approved.

## Observable acceptance criteria

- **AC-001 — Command surface:** The Engineering package exposes
  `/code-review [target] [--comment] [--fix]` and no longer exposes
  `/review-change`.
- **AC-002 — Explicit topology and lens contract:** In the complete root profile,
  `/code-review` requires an Astra-high parent, starts five parallel fresh
  read-only Reviewer-contract lanes with the approved Sol-medium override, then
  starts one Luna-medium Utility scorer. `agents/reviewer.md` supports an explicit
  fixed-diff lens mode without changing its integrated fixed-diff default. No
  child can fan out or write.
- **AC-003 — Honest capability failure:** If the required parent profile, child
  capability, model, or tool is unavailable, the command reports the unmet
  capability and does not silently select a substitute or claim the full review
  ran.
- **AC-004 — Stable boundary:** Every review states its resolved base, head, and
  diff. It stops when the ref is invalid, the expected diff is empty, or the
  boundary moves before reporting or commenting.
- **AC-005 — Eligibility evidence:** Pull-request review records closed, draft,
  automated, trivial, and same-head prior-review state. The human decides whether
  a read-only review continues. Remote comments require an eligible open pull
  request and a final unchanged-head check.
- **AC-006 — Five evidence lenses:** The parallel lanes cover intent and
  repository Standards; changed-line correctness and risk; tests and failure
  behavior; focused history and prior pull-request evidence; and in-file guidance,
  public contracts, architecture, and maintainability.
- **AC-007 — Complete language routing:** Go reviews apply target-repository and
  module contracts, installed `go` and applicable `cobra-viper`, then the
  maintained Go reference. TypeScript reviews apply target-repository contracts
  and evidence-selected TypeScript methods, including `typescript-review`, before
  the maintained TypeScript reference. Missing companions are reported honestly.
- **AC-008 — Independent confidence gate:** Candidate issues include evidence,
  practical consequence, and smallest sufficient correction. One Luna-medium
  scorer applies the 0–100 rubric. The Astra parent verifies and reports only
  issues scored 80 or higher, ordered by practical severity.
- **AC-009 — Low-noise result:** The final result excludes pre-existing issues,
  unchanged-line concerns, speculative findings, tooling-handled issues,
  duplicate candidates, and style preferences not required by repository rules.
- **AC-010 — Inline comments:** With `--comment` only, an authenticated eligible
  GitHub pull request and retained findings produce one `COMMENT` review with
  inline comments on changed lines after a preview and final head check. A
  complete, smallest safe replacement can use a suggestion block. With no
  retained findings, the command posts one short no-issues conversation comment.
  It refetches and reports the created URL. Missing GitHub capability is reported
  without substitution.
- **AC-011 — Local fixes:** With `--fix`, one configured Worker repairs only
  retained findings in an isolated writable task worktree whose initial tree
  matches the pinned review target, including recorded uncommitted changes.
  Frontend or mixed repairs use Astra medium; non-frontend repairs use Sol medium.
  The workflow records separate repair-tree identifiers, runs invalidated focused
  and target-required checks, and reports unresolved findings without commit or
  push.
- **AC-012 — Combined flags:** With `--comment --fix`, the command fixes locally,
  posts nothing, and states that inline comments are deferred until fixes are
  published and a new remote head is reviewed.
- **AC-013 — Default read-only authority:** Without mutation flags, the command
  reports in Pi only. Review lanes do not edit files or run QA gates, and no
  finding authorizes repository mutation.
- **AC-014 — One maintained method:** Every lens derives from the existing
  `code-review` method and applicable installed companions. The package does not
  add a second review skill, Fable path, or `/review-change` alias.
- **AC-015 — Package and live discovery:** Source and packed checks find
  `/code-review` and do not find `/review-change`. Manual Pi acceptance covers Go
  source or module changes, Cobra/Viper command changes, unrelated Go toolchain
  evidence, unavailable companions, repository-standard precedence, a
  tooling-duplicate candidate, all three flag modes, and `/reload` without
  registration conflicts.
- **AC-016 — Licensed adaptation:** The Engineering package records the pinned
  official Claude Code source and modified resources, includes Apache-2.0 with
  its existing MIT license, declares `MIT AND Apache-2.0`, passes the package
  license validator, and keeps the root lockfile synchronized without adding a
  runtime dependency.
