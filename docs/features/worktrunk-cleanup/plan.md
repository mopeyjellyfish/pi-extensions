---
status: accepted
---

# Plan: Safe bulk Worktrunk cleanup

Complete this delivery plan before implementation. The plan implements the accepted pitch in one package-owned delivery unit.

## Review evidence

- **Applicability:** not applicable
- **Fixed document:** not applicable
- **Status:** not applicable
- **Invalidation:** not applicable

## Independent plan review

Reviewer run `3d1bca6d` reviewed the fixed draft plan against the accepted pitch and current package. The verdict was `REVISE`. The parent resolved all three blockers and the material notes before approval:

- The plan now names documented Worktrunk schema-2 field paths and their conditional-absence semantics.
- Existing strict core facts stay required. Cleanup-only conditional facts cannot break existing actions.
- Preview uses one remote inspection. Per-candidate apply revalidation uses the plain local list under explicit candidate and time budgets.
- GitHub history, preview/apply field pairing, output enums and bounds, public guidance, and automated lifecycle proof are explicit.

These corrections do not change accepted product intent, boundaries, authority, or acceptance criteria. A later change to those items invalidates this review evidence.

## Execution mode

The selected mode is accept-all implementation. Only whole-plan approval confirms accept-all authority for this named plan.

That authority permits implementation, focused repairs, atomic commits, and one pull request from `feat/worktrunk-cleanup`. It does not permit merge, release, deployment, branch deletion, force removal, automatic cleanup, or unrelated work. Any material forecast variance returns control to the user.

## Delivery topology

| Delivery unit | Branch                   | Pull request base | Vertical slices | Dependencies | Lane/worktree owner                                      |
| ------------- | ------------------------ | ----------------- | --------------- | ------------ | -------------------------------------------------------- |
| 1             | `feat/worktrunk-cleanup` | `main`            | `001`-`003`     | none         | serial implementation lane; current worktree; one writer |

The accepted pitch, this plan, implementation, tests, and package guidance share one publication boundary. The delivery unit has one standalone pull request. A stack has no review, rollback, or merge value for this change.

The planned atomic commits are:

1. `feat(pi-worktrunk): preview safe bulk cleanup`
2. `feat(pi-worktrunk): apply approved bulk cleanup`
3. `feat(pi-worktrunk): expose the cleanup workflow`

Each commit keeps source, focused tests, and necessary public guidance together. Release Please owns `packages/worktrunk/CHANGELOG.md`. Do not edit that generated file.

## Critical path, dependencies, and lanes

The critical path is `001` → `002` → `003` → frozen-diff verification and review → focused repair → final gates → publication.

One writer owns the current isolated worktree for all implementation slices. The slices share `packages/worktrunk/src/index.ts`, `packages/worktrunk/src/worktrunk.ts`, and their tests. Parallel writers would add conflict cost without independent review value.

After the implementation diff is frozen, run two read-only lanes concurrently:

- QA owns focused executable proof, live reload acceptance, package smoke, package contents, and `npm run check`.
- Reviewer owns one fixed-diff review against the accepted pitch, this plan, repository instructions, Pi extension contracts, and Worktrunk safety rules.

The parent joins both results. One retained writer applies one bounded repair packet. Run invalidated proof again after any repair.

The forecast has one active implementation lane, one delivery unit, one pull request, and no stack cascade cost. The expensive gates are GitHub-history fixtures, bulk-removal failure cases, live Pi reload acceptance, `npm run smoke:source`, and `npm run check`.

Use the completed setup evidence while its fingerprint remains valid:

- Node `v24.18.0`
- Go `go1.26.5 darwin/arm64`
- npm `11.16.0`
- `.nvmrc`: `8f9258d5e9da5443c42966a661aee09292b49d1c64e718dcc5f72976500bac48`
- `.gvmrc`: `9e67f169fcd4a39b64c44ec9f237b5697a15665bcabd9c4704c43db2fa8d3566`
- `package-lock.json`: `754c35d4a48d3b3b0fc800c4ffc66134722aadc610c3216a7cfad24d2bb21dff`
- setup command: `npm ci --ignore-scripts`

The invalidation map is:

- A Worktrunk schema or GitHub adapter change invalidates slice `001` adapter and preview proof.
- A candidate rule, reason, ordering, limit, or fingerprint change invalidates slices `001` and `002`.
- A confirmation, revalidation, removal, or result change invalidates slice `002` tool and client proof.
- A tool schema, slash command, README, or skill change invalidates slice `003`, resource tests, smoke, and live reload acceptance.
- Any final source change invalidates the focused package test and typecheck evidence.
- Any final package change invalidates source smoke and packed-content evidence.
- Any change after the diff freeze invalidates the fixed-diff review and affected final gates.

## [ ] 001 — Preview the complete safe cleanup set

### Outcome and requirement trace

A `worktree` call with `{ action: "cleanup" }` returns a complete, no-mutation preview. The preview classifies every linked worktree as a candidate or a skipped worktree and gives one reason.

This slice covers AC-001 through AC-004, the preview part of AC-008, and the optional-evidence part of AC-009.

### Seam and files

Create a deep cleanup module in `packages/worktrunk/src/cleanup.ts`. Its interface accepts normalized Worktrunk facts, normalized terminal pull-request history, and the current Pi-routed path. It returns a deterministic preview with candidates, skipped worktrees, evidence status, and a fingerprint. Keep candidate rules, reason precedence, sorting, output eligibility, and fingerprint construction inside this module.

Create `packages/worktrunk/src/github.ts` as the GitHub terminal-history adapter. Inject the existing `pi.exec` runner at the package composition root. The adapter calls authenticated `gh` with explicit argument arrays, the Worktrunk-resolved GitHub repository, requested JSON fields, the caller's abort signal, and bounded command and overall-preview timeouts. Treat every field as untrusted input. Reject malformed or oversized output without exposing credentials or raw unbounded errors.

First run one repository-wide `gh pr list --state all` query with a named result limit and request `headRefName`, `headRepository`, `number`, `state`, and `url`. Read only `headRepository.nameWithOwner`. Fetch one item beyond the accepted history bound so the adapter can detect incomplete history. If history is incomplete, use a bounded per-branch `--head <branch>` fallback only for otherwise locally eligible unmatched branches. Stop fallback work at named request-count and overall-preview budgets. Mark every unresolved branch as insufficient evidence instead of inferring a terminal state.

Use these initial bounds as public implementation constants: 100 linked worktrees, 10,000 repository-wide pull requests plus one overflow item, 20 per-branch fallbacks, two minutes for preview, 30 minutes for apply, and 5 MB for each structured subprocess payload. A future increase needs matching output, latency, and failure proof.

Extend `packages/worktrunk/src/worktrunk.ts` to preserve these documented schema-2 facts for cleanup:

- `repo.forge` for optional repository forge identity
- `default_branch.integration.reason` and `display.state` for integrated or empty evidence
- `pr` plus `collected.ci` for open-review state
- conditional `worktree.locked`, `worktree.operation`, `worktree.prunable`, `worktree.detached`, and `worktree.branch_mismatch` protection
- required `worktree.changes`, `worktree.current`, `worktree.main`, `worktree.path`, branch, and HEAD facts

Keep current core facts strict. Parse cleanup-only fields as documented conditional facts. For example, an absent `worktree.locked` means not locked, an absent `worktree.operation` means no operation, and an absent `pr` means no open review only when `collected.ci` is true. A `null` value or an absence outside a documented determined-empty case means unknown and cannot provide safe evidence. Main items can omit `default_branch`. Existing status, list, create, activate, deactivate, and exact remove parsing must remain green.

Add two inspection calls. Remote cleanup preview uses `wt list --full --format=json`, pins schema 2, and disables Worktrunk summaries with `--config-set list.summary=false`. Local apply revalidation uses the existing plain schema-2 list with no forge or summary lookup. Existing action command shapes remain unchanged.

Extend `packages/worktrunk/src/index.ts` with the `cleanup` action and an optional `expectedFingerprint` field. Preview accepts only `{ action: "cleanup" }`. Apply accepts `confirm` and `expectedFingerprint` only when both are present. Reject either field alone. Enforce this pairing after the action-field map and preserve all existing strict result contracts.

Candidate reason precedence is:

1. Skip the main, current, or Pi-routed worktree.
2. Skip dirty, in-progress, locked, prunable, detached, branch/path-mismatched, unborn, or otherwise unsafe worktrees.
3. Skip a branch with any open pull request.
4. Include a branch with an own-repository merged pull request.
5. Include a branch with an own-repository closed pull request.
6. Include a branch that Worktrunk proves is integrated or empty.
7. Skip a branch with insufficient evidence.

An open pull request takes precedence over every older terminal pull request. Ignore terminal pull requests from a fork whose head repository does not match the resolved local repository. If `gh` is missing, unauthenticated, cancelled, malformed, incomplete after bounded fallback, or over a limit, report that evidence state. Do not fail existing actions. Only independent Worktrunk proof can qualify a worktree when GitHub evidence is unavailable.

Represent candidate reasons with `github_merged`, `github_closed`, `worktrunk_integrated`, or `worktrunk_empty`. Represent skipped reasons with `main`, `current`, `active_route`, `dirty`, `operation`, `locked`, `prunable`, `detached`, `branch_mismatch`, `unborn`, `open_review`, or `insufficient_evidence`. Represent GitHub evidence with `available`, `partial`, `unavailable`, or `not_github`. Never render Worktrunk's ANSI-bearing `display.statusline` or raw provider output. Use validated normalized fields only.

Build the fingerprint with Node's SHA-256 over canonical UTF-8 JSON. Include the resolved repository and main-path identity plus every sorted candidate's full branch, path, HEAD, reason, and terminal pull-request number when applicable. Do not fingerprint truncated display values. Use no new dependency.

Keep preview output within Pi's exported `DEFAULT_MAX_BYTES` and `DEFAULT_MAX_LINES`. The linked-worktree bound is 100. If the complete exact candidate and skipped set or any exact approval identifier cannot fit, return an overflow result without an apply fingerprint. Do not silently truncate an approvable set.

Likely files:

- `packages/worktrunk/src/cleanup.ts`
- `packages/worktrunk/src/github.ts`
- `packages/worktrunk/src/worktrunk.ts`
- `packages/worktrunk/src/index.ts`
- `packages/worktrunk/test/cleanup.test.ts`
- `packages/worktrunk/test/github.test.ts`
- `packages/worktrunk/test/worktrunk.test.ts`
- `packages/worktrunk/test/index.test.ts`

### Dependencies

The accepted pitch, Worktrunk schema 2, authenticated `gh` when GitHub evidence is available, and the existing branch-preserving Worktrunk client.

No new npm dependency is permitted. `gh` remains an optional external executable. Existing package behavior must not require it.

### Execution lane and ownership

Serial. The current isolated worktree has one writer.

Use the `codebase-design` vocabulary. The cleanup module is the shared seam for the tool and slash command. Worktrunk and GitHub are external adapters behind injected process runners. Do not expose adapter details through the public tool interface.

### Red proof

Add one public-seam test in `packages/worktrunk/test/index.test.ts` that calls `{ action: "cleanup" }`. The test must expect all candidate and skipped reasons, a stable fingerprint, GitHub evidence state, and zero `wt remove` calls.

Add narrow adapter tests that fail until schema-2 cleanup facts and GitHub terminal history are parsed strictly. Include open-over-terminal precedence, same branch name from a foreign fork, unavailable `gh`, cancellation, malformed JSON, oversized output, exact-limit incompleteness, and bounded errors.

### Green proof and checks

Run:

```sh
npm test -- --run packages/worktrunk/test/cleanup.test.ts packages/worktrunk/test/github.test.ts packages/worktrunk/test/worktrunk.test.ts packages/worktrunk/test/index.test.ts
npm --workspace @mopeyjellyfish/pi-worktrunk run typecheck
```

The proof is green when preview returns deterministic complete details, never mutates, and existing action tests remain green. A candidate-rule, parser, adapter, ordering, limit, or result-shape change invalidates this proof.

### Atomic commit and pull request

Commit the preview module, adapters, public tool preview, and focused tests as `feat(pi-worktrunk): preview safe bulk cleanup` in delivery unit 1.

### Done when

- Preview classifies every bounded linked worktree exactly once.
- Every candidate and skipped worktree has one stable reason.
- The fingerprint is deterministic for the exact candidate facts.
- Open pull requests and protected local states cannot qualify.
- Missing or failed GitHub evidence does not break existing actions or create false terminal evidence.
- Preview performs no removal or other mutation.

## [ ] 002 — Apply one exact approved cleanup set

### Outcome and requirement trace

A `worktree` call with `{ action: "cleanup", confirm: true, expectedFingerprint: "..." }` removes only the exact reviewed candidates that still qualify. The call preserves every branch and returns an honest complete result.

This slice covers AC-005 through AC-008 and the mutation part of AC-009.

### Seam and files

Deepen the cleanup module with one apply operation shared by the tool and later slash command. Declare a maximum approved-candidate count and an overall apply deadline. The bounds must support the current accepted preview while preventing unbounded command loops. Apply must:

1. Require interactive TUI or RPC mode.
2. Require `confirm: true` and a valid expected fingerprint.
3. Recompute one complete remote preview before confirmation. Fetch GitHub evidence once for this recomputation.
4. Refuse all mutation when the fingerprint differs or no approvable fingerprint exists.
5. Show one host confirmation with the candidate count, fingerprint, branch-preservation statement, ignored-output warning, and no-process-reaping warning.
6. Before each removal, call the plain local Worktrunk list with no `--full` or GitHub request.
7. Skip and report a candidate whose branch, path, HEAD, clean state, current state, lock, operation, prunable state, or active route changed.
8. Call the existing branch-preserving Worktrunk removal for each unchanged candidate in deterministic order.
9. Stop before the next candidate when cancellation or the overall apply deadline occurs. Record earlier successful removals.
10. Record candidate-local failures and continue only when cancellation, deadline, and global discovery remain healthy.
11. Return removed, changed, skipped, and failed entries plus counts and the reviewed fingerprint.

The apply operation must never pass `--force`, `--force-delete`, `--reap`, or branch-deleting arguments. Keep `--no-delete-branch`, `--no-hooks`, `--foreground`, structured output, and exact removed-path validation.

Do not persist an approved preview across reload, resume, fork, or shutdown. The fingerprint is a stateless comparison value, not cleanup authority. A new extension instance recomputes all evidence before mutation.

Likely files:

- `packages/worktrunk/src/cleanup.ts`
- `packages/worktrunk/src/worktrunk.ts`
- `packages/worktrunk/src/index.ts`
- `packages/worktrunk/test/cleanup.test.ts`
- `packages/worktrunk/test/worktrunk.test.ts`
- `packages/worktrunk/test/index.test.ts`

### Dependencies

Slice `001` preview facts, candidate rules, deterministic fingerprint, and existing exact Worktrunk removal.

### Execution lane and ownership

Serial. The current isolated worktree has one writer.

### Red proof

Add one tool-level test that previews two removable worktrees, applies the returned fingerprint, changes one candidate before its turn, and expects only the unchanged candidate to be removed. Assert exact Worktrunk argument arrays and branch-preserving structured results.

Add refusal tests for no UI, missing confirmation, missing or stale fingerprint, declined host confirmation, overflow preview, active route, dirty state, changed path, changed HEAD, cancellation after partial success, malformed removal output, and candidate-local process failure.

Add automated lifecycle tests. A fresh extension instance must recompute evidence and reject a stale fingerprint from a prior instance. `session_shutdown` must append no cleanup state and leave no cleanup approval resource.

### Green proof and checks

Run:

```sh
npm test -- --run packages/worktrunk/test/cleanup.test.ts packages/worktrunk/test/worktrunk.test.ts packages/worktrunk/test/index.test.ts
npm --workspace @mopeyjellyfish/pi-worktrunk run typecheck
```

The proof is green when exact approval gates all mutation, every candidate is revalidated, branches remain preserved, and partial outcomes are complete. A confirmation, fingerprint, local revalidation, command argument, cancellation, or result change invalidates this proof.

### Atomic commit and pull request

Commit apply behavior and focused tests as `feat(pi-worktrunk): apply approved bulk cleanup` in delivery unit 1.

### Done when

- No apply call can mutate without a matching current preview and host confirmation.
- A changed candidate is never removed.
- Every `wt remove` result proves the expected path and preserved branch.
- Cancellation and partial failure report completed work without a false all-success result.
- Reload and shutdown retain no cleanup approval state.

## [ ] 003 — Expose and document the cleanup workflow

### Outcome and requirement trace

A user can run `/worktree cleanup`, and an agent can follow the bundled skill to preview, obtain approval, and apply the matching fingerprint. Every public surface describes one safety contract.

This slice covers AC-010 and AC-011 and completes the public behavior from AC-001 through AC-009.

### Seam and files

Extend the existing `/worktree` command in `packages/worktrunk/src/index.ts`. `/worktree cleanup` must call the same cleanup module as the tool. The command shows the complete preview through the host UI, asks for one confirmation, and applies only the in-memory fingerprint from that displayed preview. In non-interactive modes, the command reports that apply is unavailable and performs no mutation.

Keep `/worktree status`, `/worktree list`, and `/worktree deactivate` unchanged. Update command usage text and description. Update the `worktree` tool description and prompt guidelines so an agent must preview, present the exact set, obtain approval, and apply only the matching fingerprint.

Update:

- `packages/worktrunk/README.md`
- `packages/worktrunk/skills/pi-worktrunk/SKILL.md`
- `packages/worktrunk/test/resources.test.ts`
- `packages/worktrunk/test/index.test.ts`

The README must state that `wt` remains required and `gh` is optional for GitHub terminal pull-request history. It must define candidate and skipped states, branch preservation, preview limits, confirmation, partial results, unsupported forge terminal-history lookup, and the no-force/no-reap contract. Distinguish the existing 20-item ordinary list cap from the separate complete bounded cleanup preview.

The skill must instruct agents to:

1. Call cleanup preview first.
2. Present the exact candidate set and evidence limitations.
3. Obtain explicit approval for that fingerprint.
4. Call cleanup apply with `confirm: true` and the matching fingerprint.
5. Report removed, changed, skipped, and failed worktrees.

Do not add a second skill or a new package. Do not edit the root architecture because repository-wide loading and lifecycle boundaries do not change.

### Dependencies

Slices `001` and `002`.

### Execution lane and ownership

Serial. The current isolated worktree has one writer.

### Red proof

Add a slash-command test that expects preview notification, confirmation, apply, branch-preserving removal, and final notification. Add cancellation, non-interactive, overflow, and failure cases.

Add automated command lifecycle proof. A fresh extension instance must not inherit cleanup authority, and command cancellation or `session_shutdown` must append no cleanup state.

Extend the resource contract test before editing guidance. The test must require the same preview, fingerprint, approval, protected-state, branch-preservation, optional-`gh`, and no-force/no-reap terms in the README and skill.

### Green proof and checks

Run the focused package checks:

```sh
npm --workspace @mopeyjellyfish/pi-worktrunk test
npm --workspace @mopeyjellyfish/pi-worktrunk run typecheck
```

Run package and source integration proof:

```sh
npm run smoke:source
npm pack --workspace @mopeyjellyfish/pi-worktrunk --dry-run --json
```

For live acceptance, start the pinned Pi from this worktree:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/worktrunk
```

Then:

1. Confirm that one `worktree` tool, one `/worktree` command, and the `pi-worktrunk` skill load without conflicts.
2. Run the focused automated package test before reload.
3. Call cleanup preview and confirm that the current repository's full bounded set appears without mutation.
4. Run `/worktree cleanup`, inspect the preview, and cancel the confirmation. Confirm that no worktree was removed.
5. Enter `/reload` while Pi is idle.
6. Repeat preview and cancelled command acceptance. Confirm that behavior is current and no duplicate registration or stale fingerprint exists.
7. Confirm that session shutdown leaves no cleanup resource or approval state.

After the final edit and any repair, run:

```sh
npm run check
```

No workflow file or dependency changes are planned. `npm run workflows:check` and `npm run security:check` are not required unless the final diff adds that scope.

A source, tool schema, command, skill, README, resource-test, or package-content change invalidates the applicable focused proof. Any final edit invalidates `npm run check`, live acceptance, and the fixed-diff review until rerun against the new tree.

### Atomic commit and pull request

Commit the slash command, public guidance, resource tests, and acceptance-owned fixes as `feat(pi-worktrunk): expose the cleanup workflow` in delivery unit 1.

After all slices are complete, freeze one diff. Run QA and Reviewer concurrently. Apply one bounded repair packet, rerun invalidated evidence, inspect the final diff, and use `open-pr` once with base `main`.

### Done when

- Tool and slash-command cleanup use the same module and rules.
- README and skill match the executable contract.
- Focused tests, typecheck, source smoke, package contents, live reload acceptance, and `npm run check` pass on the final tree.
- The final review has no unresolved blocking finding.
- One ready standalone pull request contains the accepted pitch, accepted plan, implementation, tests, and package guidance.
