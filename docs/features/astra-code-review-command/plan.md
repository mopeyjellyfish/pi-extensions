---
status: accepted
---

# Plan: Astra `/code-review` command

This plan implements the accepted pitch in one delivery unit. It keeps the
Engineering package independently installable while the complete root profile
adds the approved Astra, Sol, Luna, Reviewer, Utility, Worker, GitHub, and
Worktrunk routing.

## Review evidence

- **Applicability:** Go-targeted guidance. The implementation changes review and
  repair routing for future Go source, modules, CLIs, and Go-specific work.
- **Fixed document:** Draft revision with SHA-256
  `9ed00d9a6c1b75bffff3733ad7efe5944884be35091731a84015d1b18ac6b595`.
- **Status:** Fixed-document review `77877322` approved the complete revision
  with no blockers, material questions, or required corrections. It verified
  public seams, package and license boundaries, Go/module/CLI routing, role
  authority, comment safety, exact-tree repairs, verification, invalidation, and
  commit/PR topology.
- **Invalidation:** A change to the solution, boundaries, Authority, acceptance
  criteria, Go routing, delivery topology, or slice contracts requires a
  replacement review. Wording-only edits do not.

## Execution mode

Execution mode is accept-all implementation. Whole-plan approval authorizes the
named plan on `feat/code-review-skill` to continue through all slices, final
verification, the implementation commit, push, and one ready pull request. A
material forecast variance returns control to the human. This authority does not
include merge, release, deployment, destructive cleanup, unrelated work, or any
runtime GitHub review comment that the human did not invoke with `--comment`.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                   | Pull request base | Dependencies | Checks                                                                                              | Ownership                                                           | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ------------------------ | ----------------- | ------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | `standalone`   | `feat/code-review-skill` | `main`            | none         | focused package-validator test, source smoke, manual Pi acceptance, `npm run check`, security check | current task worktree; one non-frontend Worker; parent finalization | `main`            | 1          | low          |

The accepted pitch, this plan, and implementation share one pull request. The
already accepted pitch commits remain root documentation commits. Whole-plan
approval authorizes one plan commit and one coherent package-scoped implementation
commit, proposed as `feat(engineering): add rigorous code review command`. The
command rename, review method, root profile contract, dual-license metadata, and
supporting documentation are one inseparable public behavior.

## Critical path, dependencies, and lanes

All implementation is serial in the current task worktree. One non-frontend
Worker uses Sol medium and owns all writes until handoff. No parallel writer is
safe because the slices overlap `packages/engineering/skills/code-review/SKILL.md`,
the prompt command, root profile guidance, and package metadata. The parent owns
product and architecture decisions, accepted-source interpretation, final diff
inspection, manual Pi acceptance, required gates, formal review, repair synthesis,
and publication.

Critical path:

1. Establish executable license and command-discovery contracts.
2. Implement the default five-lens review and confidence workflow.
3. Add the opt-in GitHub `--comment` route.
4. Add local-only `--fix` and combined-flag behavior.
5. Synchronize documentation and attribution, run manual acceptance, freeze the
   tree, run required checks and formal review, repair if needed, then publish.

Forecast: one active writer lane, one delivery unit, one pull request, and no
integration branch. Expensive gates are packed smoke inside `npm run check`, the
security check, manual provider-backed review probes, and the final Astra review.
The expected CI fan-out is one required workflow. Cascade cost is low because no
stack exists. A need for executable extension code, a second package, default
remote mutation, Fable, a different model topology, or automatic publication is a
material variance and returns to the human.

Invalidation map:

- A package-license metadata change invalidates the focused package-validator
  test, package checks, packed smoke, security check, and root lockfile evidence.
- A prompt filename or manifest-resource change invalidates command discovery,
  source smoke, packed smoke, and `/reload` acceptance.
- A review-method or Reviewer-charter change invalidates all five default review
  probes, Go and TypeScript routing probes, and formal review.
- A `--comment` change invalidates the GitHub preview, final-head, payload,
  suggestion, zero-finding, and mutation-verification probes.
- A `--fix` or Worker-handoff change invalidates reviewed-tree reconstruction,
  worktree, model-routing, focused-check, no-publication, and combined-flag
  probes.
- Any post-review scope or architecture change invalidates the frozen-tree formal
  review. A bounded repair invalidates only the affected focused evidence and
  final required gates.

Setup evidence is available in this worktree. Node is `v24.18.0`, npm is
`11.16.0`, and Go is `go1.26.5`. The setup fingerprint inputs are:

- `.nvmrc`: `8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48`;
- `.gvmrc`: `9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566`;
- `package-lock.json` before implementation:
  `d7f67c0ff1f966a8a8d91f4ea43eff0385607e9e77c14c53d51e28dfbaff144d`.

`npm ci --ignore-scripts` completed. It reported the repository's current eight
npm audit findings. This setup output is not security-check evidence. The lockfile
fingerprint becomes stale when slice 001 synchronizes package metadata.

## [ ] 001 — License and discover the `/code-review` entry point

### Outcome and requirement trace

The Engineering package exposes `/code-review [target] [--comment] [--fix]`, no
longer exposes `/review-change`, and can legally redistribute the adapted current
Claude Code review workflow. This slice traces AC-001, AC-014, AC-015, and AC-016.

### Seam and files

Public seams and likely files:

- `packages/engineering/prompts/review-change.md` moved to
  `packages/engineering/prompts/code-review.md` and rewritten as a thin entry to
  the maintained skill;
- `packages/engineering/package.json` license metadata;
- `packages/engineering/LICENSE` with the existing MIT text followed by the
  Apache-2.0 text from the pinned official source;
- `packages/engineering/THIRD_PARTY_NOTICES.md` with the pinned commit, source URL,
  content SHA-256, modified resource list, and modification notice;
- `scripts/lib/packages.ts` with a declarative Engineering dual-license exception;
- `test/tooling/packages.test.ts` with executable manifest-validation coverage;
- `package-lock.json` synchronized from the changed workspace manifest.

Pinned sources:

- <https://github.com/anthropics/claude-code/blob/db8834ba1d72e9a26fba30ac85f3bc4316bb0689/plugins/code-review/commands/code-review.md>;
- current command content SHA-256
  `2b0837c5ec0b2e75f8ba4565bdafd76fa916b0dc146608c5733af7ba5802012c`;
- Apache-2.0 from the same official plugin source.

Adapt behavior and structure. Do not copy Claude branding, telemetry, or model
names into user-visible results. Mark the Engineering resources as modified.

### Dependencies

Accepted pitch and existing Engineering package contract. No prior implementation
slice.

### Execution lane and ownership

`serial`. The current task worktree and one Sol-medium Worker own all listed
files. The parent verifies source identity and license completeness.

### Red proof

1. Add a focused package-validator case that treats
   `@mopeyjellyfish/pi-engineering` with `MIT AND Apache-2.0` as the approved
   exception and rejects another incorrect Engineering license. Run:

   ```sh
   npm test -- --run test/tooling/packages.test.ts
   ```

   It must fail before the exception is implemented.

2. Query the Engineering package through Pi RPC before the prompt move. Record
   that `review-change` exists and `code-review` does not. This is executable
   command discovery, not a Markdown-content assertion.

### Green proof and checks

1. Implement the smallest validator exception, prompt move, dual-license package
   metadata, attribution, and lockfile update. Synchronize with the declared npm
   runtime and `npm install --package-lock-only --ignore-scripts`; do not change
   dependency versions.
2. Rerun the focused validator test. It must pass.
3. Query Pi RPC again. `code-review` must appear exactly once and `review-change`
   must be absent.
4. Run `npm run packages:check` and `npm run smoke:source` after the command and
   metadata settle.

A later edit to package metadata, prompt name, attribution, license, validator, or
lockfile invalidates this evidence.

### Atomic commit and pull request

Part of the single `feat(engineering): add rigorous code review command` atomic
implementation commit in delivery unit 1. Pull request base is `main`; stack
position is `standalone`.

### Done when

The executable validator accepts only the approved Engineering dual license, the
package contains both license texts and pinned attribution, the lockfile matches
the manifest without dependency changes, and source discovery exposes only
`/code-review`.

## [ ] 002 — Run five bounded review lenses and one confidence gate

### Outcome and requirement trace

A default `/code-review` invocation pins one stable diff, gathers eligibility and
intent, runs five disjoint Sol-medium read-only lenses in parallel, consolidates
and scores candidates with one Luna-medium Utility run, and lets the Astra-high
parent report only verified findings at confidence 80 or higher. This slice traces
AC-002 through AC-009, AC-013, and the default-review part of AC-015.

### Seam and files

- `packages/engineering/skills/code-review/SKILL.md` becomes the one orchestration
  and review method for parent, lens, scorer, and direct-parent fallback modes;
- `packages/engineering/prompts/code-review.md` passes the target and flags to the
  skill without duplicating the workflow;
- `agents/reviewer.md` adds explicit `Review mode: fixed-diff lens` while keeping
  omitted and `fixed-diff code` modes as full integrated reviews;
- `AGENTS.md`, `README.md`, `docs/architecture.md`, and
  `packages/engineering/README.md` document the approved `/code-review`
  model-and-role exception and independent-package fallback.

The skill must define one complete handoff contract shared by all five lanes:
review base and head, exact diff command or recorded uncommitted patch, immutable
tree identifier, PR title and body when applicable, complete durable Intent paths,
changed paths, nearest instruction files, applicable methods, unavailable
evidence, assigned lens, read-only Authority, output schema, and no-child-fan-out
rule.

The five lenses are:

1. accepted intent, repository instructions, and applicable Go or TypeScript
   standards;
2. changed-line correctness, security, performance, and edge cases;
3. tests, failure paths, cancellation, concurrency, and resource lifetime;
4. focused blame, history, and directly relevant prior pull-request discussion;
5. in-file guidance, changed public contracts, architecture, testability, and
   right-sized maintainability.

The scorer receives all deduplicated candidates and fixed evidence in one fresh
read-only handoff. It applies the documented 0, 25, 50, 75, and 100 confidence
meanings. A finding must score at least 80 and survive Astra-parent evidence
validation. Every retained finding includes location, axis, cited evidence,
concrete consequence, confidence, unavailable evidence, and smallest correction.

### Dependencies

Slice 001 command discovery and licensed source baseline.

### Execution lane and ownership

`serial`. The same Worker owns the overlapping skill, prompt, agent, and
documentation files. Runtime review lanes described by the skill are read-only and
are not implementation writers.

### Red proof

Use the current installed package before editing as the before-state proof:
`/code-review` is absent, `code-review` specifies one integrated reviewer only,
and `agents/reviewer.md` has no fixed-diff lens mode. Record this through Pi RPC,
resource inspection, and one default route probe. Do not add a test that asserts
Markdown wording.

### Green proof and checks

Start the deterministic Pi profile from this worktree:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e .
```

After the focused automated check and while Pi is idle, run `/reload`. In a
bounded temporary target repository, perform these manual route probes and retain
session/run IDs as evidence:

1. default local fixed diff: exactly five fresh read-only Sol-medium lens runs,
   followed by one Luna-medium Utility scorer; no child writes or fans out;
2. stable-boundary refusal: invalid, empty, and changed boundaries stop without a
   finding report;
3. eligibility: closed, draft, automated, trivial, and same-head prior-review
   states are reported and require human confirmation before read-only review;
4. high-signal filtering: include one real changed-line defect, one pre-existing
   issue, one tooling-only issue, and one speculative issue; only the verified
   high-confidence changed defect remains;
5. intent and instruction precedence: root and nearest instructions plus supplied
   request or accepted pitch and plan reach the applicable lens;
6. Go routing: Go source or module activates `go`; Cobra/Viper command, flag, or
   configuration changes also activate `cobra-viper`; unrelated toolchain files
   activate neither; repository/module contracts win; unavailable companions are
   reported; a current tool finding is not duplicated;
7. TypeScript routing: substantial TypeScript activates `typescript-review` and
   only the evidence-selected TypeScript companions before the maintained
   reference; unrelated toolchain files activate none;
8. independent-package fallback: load `packages/engineering` alone and verify it
   reports unavailable root orchestration capabilities without claiming the full
   multi-agent route or silently changing models.

Do not run build, test, lint, coverage, smoke, or QA commands inside review lanes.
A skill, prompt, agent charter, model, lens, rubric, or routing change invalidates
all probes.

### Atomic commit and pull request

Part of the single implementation commit and standalone delivery unit 1.

### Done when

The default command meets every fixed-boundary, model, lens, scoring, language,
low-noise, read-only, and honest-fallback criterion with recorded manual evidence.
Ordinary integrated Reviewer behavior remains unchanged outside explicit lens
mode.

## [ ] 003 — Add opt-in inline GitHub review comments

### Outcome and requirement trace

`/code-review <pull request> --comment` previews and performs one bounded,
verified GitHub comment action after review. Retained findings become one
`COMMENT` review with inline comments. Zero findings become one short conversation
comment. This slice traces AC-004, AC-005, AC-010, AC-013, and the comment part of
AC-015.

### Seam and files

- `packages/engineering/skills/code-review/SKILL.md` comment authority, preview,
  payload, suggestion, final-head, failure, and verification rules;
- `packages/engineering/prompts/code-review.md` `--comment` argument surface;
- Engineering and aggregate documentation;
- installed `github-cli` and its pull-request reference when available.

Use the current official GitHub REST endpoint described at
<https://docs.github.com/en/rest/pulls/reviews>: create one review with
`event: "COMMENT"`, the pinned `commit_id`, and inline `comments` containing
repository-relative `path`, `line`, `side`, and `body`. Use `start_line` and
`start_side` only for a real multi-line range. Prefer current `line` and `side`
over deprecated diff positions. Only an added or context line with a valid PR-diff
anchor can receive an inline comment.

A suggestion block is allowed only when it contains the complete smallest safe
replacement, fits the anchored changed range, requires no hidden edits, and does
not expose credentials or untrusted instruction content. Otherwise, leave
explanatory text. The parent shows the resolved repository, PR, head SHA, review
summary, and exact inline bodies before mutation. `--comment` is the explicit
mutation authority; it does not authorize another GitHub action.

### Dependencies

Slices 001 and 002. The final candidate set and stable head are inputs.

### Execution lane and ownership

`serial`. The same Worker writes guidance. The parent owns manual mutation
acceptance. No child posts directly.

### Red proof

Before this slice, `/code-review --comment` has no accepted GitHub mutation
contract. Record the route stopping at the Pi report. No test reads Markdown to
assert the absence.

### Green proof and checks

Use a human-approved scratch pull request or the later published feature pull
request only after explicit target-specific `--comment` invocation. Never use an
unrelated contributor pull request for testing.

1. Finding path: preview the exact target and bodies, recheck the head, create one
   `COMMENT` review with at least one valid inline changed-line comment, then
   refetch and verify the review ID, head commit, path, line, body, and canonical
   URL.
2. Suggestion path: verify one complete small correction renders as a GitHub
   suggestion and a non-self-contained correction remains prose.
3. Zero-finding path: after the final head check, create one short no-issues
   conversation comment, refetch it, and report its canonical URL.
4. Stale-head path: change the reviewed head before mutation and verify no review
   or comment is posted.
5. Capability path: missing or wrong-host `gh` authentication reports the unmet
   action without login changes, fallback APIs, or a blind retry.

If no authorized scratch target is available before publication, complete the
non-mutating preview and stale-head probes, record actual comment creation as an
explicit residual acceptance gap, and do not claim the mutation was verified.
That gap blocks a full verified claim but does not authorize a substitute target.

### Atomic commit and pull request

Part of the single implementation commit and standalone delivery unit 1.

### Done when

The command has a bounded, previewed, head-pinned, verified `--comment` route for
both finding and zero-finding results, with safe inline suggestion limits and no
implicit mutation.

## [ ] 004 — Repair verified findings locally with `--fix`

### Outcome and requirement trace

`/code-review <target> --fix` reconstructs the reviewed tree in an isolated
writable worktree, sends only retained findings to one configured Worker, runs
invalidated target checks, and reports a new repair-tree identifier without
committing or pushing. `--comment --fix` fixes locally and defers every comment.
This slice traces AC-003, AC-004, AC-011, AC-012, AC-013, and the fix part of
AC-015.

### Seam and files

- `packages/engineering/skills/code-review/SKILL.md` repair transition, Worker
  handoff, verification, variance, and combined-flag rules;
- `packages/engineering/prompts/code-review.md` `--fix` argument surface;
- `AGENTS.md`, Engineering documentation, root README, and architecture guidance;
- existing Worktrunk, Worker, TDD, diagnosis, Go, TypeScript, and target-repository
  methods resolved by capability rather than assumed by the independent package.

The repair handoff includes Business reason, reviewed base/head/tree, recorded
uncommitted patch when applicable, retained findings and evidence, accepted
correction bounds, target checks, applicable methods, explicit local-only
Authority, and prohibited publication actions. The repair worktree must reproduce
the exact reviewed tree before the Worker starts. Frontend or mixed repairs use
Astra medium; non-frontend repairs use Sol medium. One Worker has sole write
ownership.

### Dependencies

Slices 001 and 002. Slice 003 supplies combined-flag semantics but does not grant
comment authority after local fixes.

### Execution lane and ownership

`serial`. The same implementation Worker writes the feature. At command runtime,
one configured Worker owns each repair worktree. The review lenses, scorer, and
GitHub support stay read-only.

### Red proof

Use the pre-slice route as before-state proof: `--fix` has no bounded worktree,
Worker, check, or no-publication contract and therefore must not edit. Do not add
a Markdown-content test.

### Green proof and checks

In bounded temporary target repositories:

1. committed non-frontend defect: reconstruct the pinned tree, launch one
   Sol-medium Worker, make the smallest repair, run the focused and required
   checks, record the repair-tree identifier, and verify no commit or push;
2. reviewed uncommitted defect: preserve status and patch, reproduce them in the
   repair worktree before writing, then prove the original reviewed tree and new
   repair tree are distinct and correctly recorded;
3. frontend or mixed defect: verify the same Worker is launched with the required
   Astra-medium override;
4. unresolved or failed repair: report remaining findings and failed evidence
   without a blind retry, alternate model, publication, or scope expansion;
5. scope or architecture variance: stop and return to planning or a new full
   review rather than applying an unapproved design;
6. combined flags: `--comment --fix` completes local repair, posts nothing, and
   reports that a published new head and new review are required before comments.

Any worktree reconstruction, finding packet, Worker model, repair, check, or
combined-flag change invalidates the related probe.

### Atomic commit and pull request

Part of the single implementation commit and standalone delivery unit 1.

### Done when

Every repair begins from the exact reviewed tree, uses one correctly routed
Worker, verifies only the accepted correction, records a new tree, leaves Git
history and remotes unchanged, and defers combined-mode comments.

## [ ] 005 — Finalize, review, and publish one delivery unit

### Outcome and requirement trace

All public documentation, package metadata, attribution, runtime guidance, and
accepted behavior agree. The final tree passes required checks, one fresh formal
Astra review, and publication hygiene. This slice traces all acceptance criteria.

### Seam and files

Complete approved path set:

- `AGENTS.md`;
- `README.md`;
- `docs/architecture.md`;
- `docs/features/astra-code-review-command/{pitch,plan}.md`;
- `agents/reviewer.md`;
- `packages/engineering/{package.json,LICENSE,THIRD_PARTY_NOTICES.md,README.md}`;
- `packages/engineering/prompts/code-review.md` and deletion of
  `packages/engineering/prompts/review-change.md`;
- `packages/engineering/skills/code-review/SKILL.md`;
- `scripts/lib/packages.ts`;
- `test/tooling/packages.test.ts`;
- `package-lock.json`.

Historical accepted feature documents can retain `/review-change` and old model
contracts as history. Active instructions, architecture, package docs, prompts,
and skills must not.

### Dependencies

Slices 001 through 004 and all manual acceptance evidence.

### Execution lane and ownership

`serial` parent finalization after Worker handoff. The Worker remains retained for
one bounded repair packet if formal review finds an issue. The parent owns final
synthesis and Git delivery handoff.

### Red proof

Before finalization, active docs and notices still describe the old single-review
and `/review-change` behavior, and the package has not passed all current-tree
checks. Record the active-reference inventory without treating historical feature
documents as defects.

### Green proof and checks

1. Update active documentation and attribution. Do not edit the generated
   Engineering changelog.
2. Run formatter and inspect changes:

   ```sh
   npm run fix
   ```

3. Rerun focused evidence after the final edit:

   ```sh
   npm test -- --run test/tooling/packages.test.ts
   npm run smoke:source
   npm run security:check
   ```

4. Complete the manual deterministic Pi startup, idle `/reload`, route probes,
   and mismatch ledger described in slices 002 through 004. Close the session
   cleanly and do not commit Pi state, caches, trust files, scratch repositories,
   or subagent artifacts.
5. Run the complete required gate once against the final tree:

   ```sh
   npm run check
   ```

6. Record base `HEAD`, approved path set, command definitions, updated setup
   fingerprint, and a verified-tree identifier from a temporary index.
7. Freeze that tree and run one fresh Astra-high Reviewer in
   `Review mode: fixed-diff code`. Supply the accepted pitch, accepted plan, base
   ref, commit list, complete diff, verified-tree identifier, focused and manual
   evidence, unavailable remote acceptance, and required gate results. The
   Reviewer checks intent, correctness, orchestration, model and role boundaries,
   Go and TypeScript routing, GitHub mutation safety, fix authority, package
   independence, licensing, source attribution, test boundary, documentation, and
   maintainability. It does not rerun QA commands.
8. If findings exist, send one prioritized packet to the retained Worker. Rerun
   only invalidated focused evidence, manual probes, security check, and final
   gate. Repeat formal review only if accepted scope or architecture changed.
9. Inspect `git diff`, `git diff --cached`, untracked files, package contents,
   release attribution, license metadata, and artifact hygiene. Verify no
   credentials, local absolute paths, scratch repositories, provider output,
   sessions, caches, coverage, package archives, or delegated-agent artifacts are
   present.
10. Use the accepted implementation and publication authority to create the one
    atomic implementation commit, push `feat/code-review-skill`, and open one
    ready standalone pull request to `main`. Use installed `commit` and `open-pr`;
    no merge or release action follows.

A final edit invalidates only the evidence named in the invalidation map. Do not
reuse checks across a changed tree.

### Atomic commit and pull request

One implementation commit:

```text
feat(engineering): add rigorous code review command
```

Publish one ready standalone pull request from `feat/code-review-skill` to
`main`. The accepted pitch and plan commits remain earlier commits in the same
branch and pull request.

### Done when

All slices are complete; current-tree focused, manual, security, and full checks
are recorded honestly; no material Reviewer finding remains; the implementation
commit matches the verified tree; the branch is pushed; one ready pull request is
open; and no unapproved remote, merge, release, cleanup, or artifact action
occurred.
