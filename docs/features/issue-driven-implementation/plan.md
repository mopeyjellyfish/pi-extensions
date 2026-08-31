---
status: accepted
---

# Plan: Issue-driven implementation workflow

Complete this delivery plan before implementation. The accepted pitch is `docs/features/issue-driven-implementation/pitch.md` at commit `09c0e2db`.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Execution mode

Use **accept-all implementation**. Approval of this complete plan confirms accept-all authority for the named plan and branch. It permits the named implementation, focused repairs, package-owned atomic commits, push, and one ready pull request after all required evidence passes.

Accept-all pauses for setup, test, check, commit, or publication failure. It also pauses for material review findings, forecast variance, changed scope, changed delivery boundaries, changed dependencies, or changed authority. It never authorizes merge, release, deployment, destructive cleanup, ticket closure, project creation, credential changes, shared-taxonomy deletion or rename, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                | Pull request base | Dependencies | Checks                                                                   | Ownership                                       | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | --------------------- | ----------------- | ------------ | ------------------------------------------------------------------------ | ----------------------------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | `standalone`   | `feat/issue-workflow` | `main`            | none         | GitHub and Engineering focused tests, source smoke, root `npm run check` | Current isolated worktree and one Worker writer | none              | 1          | low          |

The accepted pitch, this plan, three implementation commits, tests, and guidance share one delivery unit and one pull request. The documents have no independent review or merge value. The GitHub and Engineering changes are one user workflow and must be reviewed and published in one pull request. Release Please still versions each package independently from its package-owned commits.

A stack or sibling pull requests would add coordination without independent rollback or merge value. No parallel writer is permitted in this delivery unit.

## Critical path, dependencies, and lanes

The critical path is slice 001, slice 002, slice 003, frozen-tree verification, one fixed-diff review, and publication.

- **Active implementation lanes:** 1.
- **Delivery units and pull requests:** 1 delivery unit and 1 standalone pull request.
- **Writer ownership:** One Worker owns the current `feat/issue-workflow` worktree. The parent owns accepted intent, final synthesis, final diff inspection, required gates, review resolution, and publication handoff.
- **Integration point:** None. All slices integrate directly on the current branch.
- **Expensive gates:** Manual Pi reload acceptance, `npm run smoke:source`, and `npm run check`.
- **Assurance:** The remote-mutation and privacy contract requires one fixed-diff formal review after the tree freezes. Deterministic green commands run directly. Add QA only for failed-command diagnosis or ambiguous manual acceptance.
- **Likely cascade cost:** Low. One branch has no stack cascade. A late shared-contract change can invalidate both package tests and the final review.

The repository setup fingerprint is Node `.nvmrc`, Go `.gvmrc`, and `package-lock.json`. Setup completed in this worktree with Node `v24.18.0`, npm `11.16.0`, Go `go1.26.5`, and `npm ci --ignore-scripts`. Reuse this setup while those inputs remain unchanged.

### Invalidation map

- A GitHub Projects command, permission, mutation, or visibility change invalidates the GitHub focused test and any integration evidence that consumes the GitHub method.
- A ticket source, taxonomy, status, ranking, or route change invalidates the Engineering focused test and `/next-issue` manual acceptance.
- An `/improve` issue-draft or confirmation change invalidates the Engineering focused test and `/improve` manual acceptance.
- A private/public boundary, capability fallback, partial-mutation rule, or package seam change invalidates both focused tests and the fixed-diff formal review.
- A prompt, skill, package README, or root README change invalidates source smoke and manual reload acceptance.
- Any change after the final frozen-tree identifier invalidates `npm run check`, review evidence for the changed surface, and publication reuse.

## [ ] 001 — Use configured GitHub Projects safely

### Outcome and requirement trace

The installed `github-cli` method supports optional configured GitHub Projects without guessing a queue or leaking private repository content. It supplies the GitHub-specific capability used by later ticket routing.

This slice satisfies AC-006, AC-007, the GitHub part of AC-011, the GitHub part of AC-012, and the GitHub portions of AC-013 and AC-014.

### Seam and files

Public seam: the installed `github-cli` skill and its progressively disclosed GitHub Projects reference.

Likely files:

- `packages/github/skills/github-cli/SKILL.md`
- `packages/github/skills/github-cli/references/projects.md` (new)
- `packages/github/test/skills.test.ts`
- `packages/github/README.md`

Do not change the GitHub package into an extension or add a tracker client. Keep GitHub CLI as the authenticated transport.

### Dependencies

The accepted pitch and the installed `gh project` command contract. No implementation slice dependency.

### Execution lane and ownership

`serial` in the current `feat/issue-workflow` worktree. One Worker owns the listed GitHub package files until the atomic commit is complete.

### Red proof

First extend `packages/github/test/skills.test.ts` so it fails because:

- The compact router does not link a Projects reference.
- No Projects reference covers `gh project list`, `view`, `field-list`, `item-list`, `item-add`, and `item-edit`.
- No contract resolves only an explicit or repository-configured project.
- No contract verifies `project` scope, repository access, project access, visibility, owner, project number, item URL, field, option, and resulting state.
- No contract prevents a private repository issue from entering a public project or exposing inaccessible content.
- The README does not describe optional configured-project behavior.

Run:

```sh
npm test -- --run packages/github/test/skills.test.ts
```

Record the intended new assertion failures. An unrelated existing failure is not red proof.

### Green proof and checks

Add the smallest Projects reference and router link. Keep bounded JSON fields, bounded item counts, explicit targets, one-field mutations, command-help discovery, and post-mutation verification. State that project access does not grant repository access. Fail closed before showing inaccessible content or crossing a private-to-public boundary.

Run:

```sh
npm test -- --run packages/github/test/skills.test.ts
```

A change to any Projects command, permission, privacy, or verification rule invalidates this proof.

### Atomic commit and pull request

Create one package-owned commit after focused proof:

```text
feat(pi-github): add configured project workflows
```

This commit belongs to delivery unit 1. It does not publish separately.

### Done when

- The GitHub resource test passes with meaningful Projects assertions.
- `github-cli` remains compact and progressively discloses `references/projects.md`.
- Project resolution is explicit or repository-configured, and repository issues remain the no-project fallback.
- Private/public access and mutation verification rules are complete.
- The GitHub README explains the behavior and requirements.
- The commit contains only the approved GitHub package paths.

## [ ] 002 — Select and route the next actionable ticket

### Outcome and requirement trace

Engineering accepts supported tracker tickets as untrusted durable Intent. `/next-issue` ranks actionable tickets and routes the selected ticket from its status to Shape, planning, or implementation. The workflow uses an in-progress transition as ordinary agent coordination.

This slice satisfies AC-001 through AC-005, the provider-neutral parts of AC-011 and AC-012, and the ticket-selection portions of AC-013 and AC-014.

### Seam and files

Public seams:

- `/implement <ticket URL or key>`.
- `/next-issue [optional tracker, project, repository, or area scope]`.
- One provider-neutral ticket workflow method shared by `implement`, `/next-issue`, and later `/improve` issue creation.

Likely files:

- `packages/engineering/skills/ticket-workflow/SKILL.md` (new)
- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/prompts/implement.md`
- `packages/engineering/prompts/next-issue.md` (new)
- `packages/engineering/test/resources.test.ts`
- `packages/engineering/README.md`
- `README.md`

The plan names `ticket-workflow` as a method, not a second implementation loop. It owns tracker capability resolution, queue policy, ticket selection, status transition, mutation verification, privacy preservation, and route handoff. `implement` retains implementation orchestration. Shape and `planning-changes` retain their approval and planning authority.

### Dependencies

Slice 001 supplies the installed GitHub Projects method. Linear, Jira, and other trackers remain capability-driven. Do not add provider clients or assume a specific harness tool.

### Execution lane and ownership

`serial` in the current worktree after slice 001. The same Worker owns the listed Engineering and root README files.

### Red proof

First extend `packages/engineering/test/resources.test.ts` so it fails because:

- The package does not ship `ticket-workflow` or `/next-issue`.
- `/implement` does not accept and resolve a supported ticket URL or key as untrusted durable Intent.
- Unavailable or unauthenticated capabilities do not produce the bounded fallback.
- Actionable selection does not exclude blocked, in-progress, unclassified, draft, and pull-request items.
- Selection does not rank needs-shape, needs-plan, and ready together by configured priority, oldest creation time, and stable ticket ID.
- Status does not route to Shape, `planning-changes`, or `implement`.
- The workflow does not create or verify the task worktree before the in-progress transition and substantive route work.
- The prior route status is not preserved in the durable handoff.
- Explicit resume does not guard an already in-progress ticket.
- Project privacy and partial-mutation failures are not preserved across the provider-neutral seam.

Also assert that the packed package contains the new skill and prompt, and that production guidance contains no target-repository paths or private agent names.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

Record only the intended assertion failures.

### Green proof and checks

Add the shared ticket method, `/next-issue`, and the minimum `implement` integration. Resolve queue scope in this order: explicit project or repository, repository-configured project, then current repository issues. Read the resolved policy once per run and pass it through durable handoffs.

For selection, rank configured priority first, oldest creation time second, and stable ticket ID third. Route needs-shape to Shape, needs-plan to `planning-changes`, and ready to `implement`. If a route skill is unavailable, return a self-contained handoff to the direct parent without claiming that the skill ran.

After route and worktree setup, transition the selected ticket to in progress and re-read the result before substantive route work. Do not promise atomic locking. Keep in-progress tickets excluded. Allow resume only with an explicit request and matching branch, pull request, or run evidence.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

A change to ticket input, queue scope, eligibility, ranking, status routing, in-progress handling, worktree ordering, capability fallback, or privacy invalidates this proof.

### Atomic commit and pull request

Create one package-owned commit after focused proof:

```text
feat(pi-engineering): add ticket queue routing
```

This commit belongs to delivery unit 1. It follows the GitHub package commit and does not publish separately.

### Done when

- The focused Engineering test passes.
- The package and root profile discover `/next-issue` and `ticket-workflow`.
- `/implement` can consume a supported ticket without executing ticket instructions.
- Selection, ranking, status routing, worktree ordering, and in-progress coordination match the accepted pitch.
- Missing provider or route capabilities fail honestly.
- Engineering remains independently installable and does not depend on the GitHub package.
- The Engineering and root READMEs describe the new entry points and boundaries.
- The commit contains only the approved Engineering and root README paths.

## [ ] 003 — Classify and create improvement issues from repository policy

### Outcome and requirement trace

`/improve` classifies issue drafts for Shape, planning, implementation, or blocking. It discovers the target policy once, prefers configured native fields, and uses the evergreen fallback only when the target defines no usable policy.

This slice satisfies AC-008 through AC-010, completes AC-011 through AC-014, and completes the accepted `/improve` outcome.

### Seam and files

Public seam: the `Track` and exact-set issue-creation flow in `improve-codebase-architecture`, composed with `ticket-workflow`.

Likely files:

- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/skills/ticket-workflow/SKILL.md`
- `packages/engineering/test/resources.test.ts`
- `packages/engineering/README.md`
- `README.md`

Do not duplicate tracker policy in `improve-codebase-architecture`. Keep the provider-neutral taxonomy, configured-project, privacy, and mutation contract in `ticket-workflow` and reference it from `/improve`.

### Dependencies

Slice 002 supplies `ticket-workflow`, package discovery, and the route vocabulary. Slice 001 supplies optional GitHub Projects operations.

### Execution lane and ownership

`serial` in the same worktree after slice 002. Reuse the same Worker because this slice edits the shared ticket method, Engineering resource test, and READMEs.

### Red proof

First extend the focused Engineering test so it fails because `/improve` and `ticket-workflow` do not yet require:

- Policy precedence of `CONTRIBUTING.md` and repository instructions, configured native fields and existing labels, then fallback labels.
- One discovery per resolved tracker, project, and repository per run, reused for all candidates.
- One repository-defined area when applicable, one priority, and exactly one route status.
- Status mapping for ready, needs-plan, needs-shape, and blocked.
- `meta` only for backlog coordination.
- The exact evergreen fallback labels, colors, and descriptions, including `status:in-progress`.
- No invented fallback area.
- A separate exact confirmation before creating missing fallback labels.
- No label rename or deletion.
- Optional project placement only when the request or repository policy resolves a project.
- Exact issue creation, project placement, field or label update, and resulting-state verification with partial-success reporting.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

Record only the intended new assertion failures.

### Green proof and checks

Compose `ticket-workflow` from the `/improve` Track flow. Preserve the existing exact displayed draft-set confirmation. Add the resolved repository, tracker, optional project, title, body, labels or fields, priority, route status, area when defined, grouping, and privacy state to each draft.

Use the accepted fallback label table only when repository instructions, configured project fields, tracker-native fields, and existing equivalent labels provide no usable policy. Ask one separate exact confirmation for the missing fallback label set. Create no issue until required taxonomy exists. Never rename or delete shared taxonomy.

For a confirmed issue set, verify each issue creation before optional project placement and verify every later mutation. Report a created issue whose project placement fails as partial success. Do not retry without diagnosis and new evidence.

Run in order:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm test -- --run packages/github/test/skills.test.ts packages/engineering/test/resources.test.ts
```

A change to policy precedence, fallback taxonomy, candidate classification, issue confirmation, optional project placement, privacy, or partial-success reporting invalidates this proof.

### Atomic commit and pull request

Create one package-owned commit after focused proof:

```text
feat(pi-engineering): classify improvement issues
```

This commit completes delivery unit 1. It does not publish until final evidence and review pass.

### Done when

- The Engineering focused test and combined package resource tests pass.
- Every issue draft has one priority and one route status, plus a policy-defined area when applicable.
- Policy discovery happens once per resolved target and is reused.
- The evergreen fallback is exact and creates no area labels.
- Missing fallback taxonomy requires a separate exact confirmation.
- Optional project placement and private/public handling match the accepted pitch.
- Partial remote mutations are reported without blind retry.
- Documentation explains taxonomy precedence and `/improve` behavior.
- The commit contains only the approved Engineering and root README paths.

## Final verification, review, and publication

After slice 003, stop all writers and freeze the diff. The parent inspects the complete diff for accepted scope, package independence, release attribution, prompt and skill discovery, private/public safety, untrusted ticket handling, bounded output, mutation verification, and artifact hygiene.

Run the manual reload path from the target worktree:

1. Start the deterministic root profile:

   ```sh
   npm exec -- pi \
     --no-extensions \
     --no-skills \
     --no-prompt-templates \
     --no-themes \
     -e .
   ```

2. Confirm `github-cli`, `ticket-workflow`, `/implement`, `/improve`, and `/next-issue` load without conflicts.
3. Run the combined focused test before reload.
4. Enter `/reload` while Pi is idle.
5. Expand `/next-issue` with a bounded explicit repository scope and stop before remote mutation. Confirm the prompt selects status-driven Shape, plan, or implement routing.
6. Exercise `/implement` with an inaccessible or deliberately non-mutating ticket reference. Confirm the bounded capability or access fallback without leaking content.
7. Exercise `/improve` through one issue draft and stop before exact-set confirmation. Confirm repository-first policy, route status, priority, optional project handling, and fallback behavior.
8. If a safe disposable private repository and private project are available, verify private-to-private project resolution and refuse a public project target. Otherwise record this live provider path as unmet manual evidence and rely on the deterministic contract test plus formal review. Do not create production issues or alter a real project for acceptance.

Then run:

```sh
npm run smoke:source
npm run check
```

Create the verified-tree identifier from the exact frozen contents, base `HEAD`, complete approved path set, command definitions, and setup fingerprint. Record changed files, red and green proof, manual acceptance, smoke and full-check output, residual risks, and efficiency telemetry.

Because the change controls remote tracker mutations and private/public boundaries, run one configured fresh read-only Reviewer with `Review mode: fixed-diff code`. Give it the accepted pitch, accepted plan, base ref, frozen diff, changed files, verified-tree identifier, focused evidence, and required-gate results. The Reviewer checks intent, correctness, architecture, security, privacy, package independence, and maintainability. It does not rerun QA gates.

If review returns material findings, accept-all pauses and returns control to the user. For non-material corrections within accepted intent, resume the retained Worker once with one prioritized repair packet, rerun only invalidated evidence, and verify the finding directly. A change to architecture, accepted scope, or a private/public boundary requires new planning or Shape approval and a replacement review.

After every selected gate is green and every material finding is resolved, invoke `commit` only if final documentation or review repair remains uncommitted. Then invoke `open-pr` for one ready standalone pull request from `feat/issue-workflow` to `main`. Publication never closes a ticket, changes project visibility, merges, releases, deploys, cleans a worktree, deletes a branch, force-pushes, or performs unrelated remote mutations.
