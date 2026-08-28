---
status: accepted
---

# Plan: Automatic implementation publication

Complete this delivery plan in the existing
`feat/automate-implementation-publication` worktree. The accepted pitch is
`docs/features/automatic-implementation-publication/pitch.md`.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Execution mode

Use **accept-all implementation**. Whole-plan approval confirms authority for
this named plan and branch. It permits the plan commit, implementation changes,
focused and required verification, one fixed formal review, accepted repairs,
validated commits, a normal push, and ready pull-request creation or update.

Accept-all pauses for setup, test, check, commit, publication, or authentication
failure. It also pauses for material review findings, material forecast variance,
or changes to accepted scope, delivery boundaries, dependencies, or authority.
It never authorizes merge, release, deployment, destructive cleanup, branch
deletion, plain force push, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch                                     | Pull request base | Dependencies | Checks                                           | Ownership                       | Integration point | CI fan-out | Cascade cost |
| ------------- | ---------- | -------------- | ------------------------------------------ | ----------------- | ------------ | ------------------------------------------------ | ------------------------------- | ----------------- | ---------- | ------------ |
| 1             | standalone | standalone     | `feat/automate-implementation-publication` | `main`            | none         | Engineering tests, source smoke, `npm run check` | current worktree, single writer | none              | 1          | low          |

This plan has one delivery unit, branch, and pull request. The accepted pitch,
this plan, and implementation share that pull request. They do not have separate
review or merge value.

The pitch commit already exists. Plan approval creates one root documentation
commit. Implementation creates one package-attributed feature commit that keeps
the skill, prompt, focused tests, package README, and root README together.

## Critical path, dependencies, and lanes

The work is serial because the skill, prompt, tests, and documentation describe
one authority contract and must stay consistent. Do not create parallel writers.

Critical path:

1. Add a focused failing Engineering resource contract.
2. Update `implement` and `/implement` at the public skill and prompt seams.
3. Update package and root documentation.
4. Pass focused tests and source smoke.
5. Exercise deterministic Pi reload and prompt expansion.
6. Run `npm run check` on the frozen diff.
7. Run one fixed formal review because this changes public workflow authority.
8. Resolve accepted findings, rerun invalidated evidence, then automatically
   commit, push, and open or update the ready pull request.

Expected active lanes: one. Expected delivery units and pull requests: one.
Expected expensive gates: one complete `npm run check` and one formal review.
Cascade cost is low because there is no stack.

Invalidation map:

- A change to `implement`, its prompt, or the focused assertions invalidates the
  Engineering package test.
- A change to package or root Markdown invalidates formatting and markdownlint.
- A change to loaded skill or prompt resources invalidates source smoke and the
  deterministic reload exercise.
- Any implementation or review repair invalidates the final verified tree and
  `npm run check` unless the changed surface is proven outside that gate.
- A base-branch change before publication invalidates the verified tree and
  requires the applicable focused and complete checks after rebase.

## [ ] 001 — Implementation finishes with bounded publication

### Outcome and requirement trace

A bounded request routed to `implement` completes its delivery unit through
verified commit, normal push, and ready pull-request creation or update without
a final publication prompt.

This slice satisfies AC-001 through AC-010 in the accepted pitch.

### Seam and files

Public seam:

- `packages/engineering/skills/implement/SKILL.md`
- `packages/engineering/prompts/implement.md`

Focused contract and documentation:

- `packages/engineering/test/resources.test.ts`
- `packages/engineering/README.md`
- `README.md`
- `docs/features/automatic-implementation-publication/plan.md`

Do not change Feature Flow, `just-do-it`, `code-review`, `commit`, or `open-pr`
unless the focused red proof demonstrates a contract gap that the accepted pitch
cannot satisfy through Engineering alone. Such a gap is scope variance and must
pause implementation.

### Dependencies

- Accepted pitch commit `011ad2be0f2924835e059609ff4ac1a93fd6e7d2`.
- Existing installed `commit` and `open-pr` methods.
- Existing plan approval authority from `planning-changes`.

### Execution lane and ownership

Use one serial writer in the current worktree. The parent owns the final diff,
evidence, formal review, repair acceptance, and publication readiness. A fresh
Worker may implement the bounded slice when available, but it does not publish.

### Red proof

Update `packages/engineering/test/resources.test.ts` first. Run:

```sh
npm --workspace @mopeyjellyfish/pi-engineering test
```

The focused test must fail because the current contract:

- asks checkpointed execution for **Accept and publish**;
- does not make a direct bounded implementation request publication authority;
- does not define publication opt-outs; and
- does not require automatic post-review `commit` then `open-pr` execution.

The test must assert behavior through the shipped skill, prompt, package README,
and root README. Do not couple it to line numbers or private helpers.

### Green proof and checks

Update `implement` so that:

- a direct bounded implementation request and an accepted plan grant bounded
  publication authority for the named task branch and delivery unit;
- publication runs only after tests, gates, selected review, accepted repairs,
  and invalidated evidence pass;
- checkpointed and accept-all execution invoke `commit` and then `open-pr`
  without a final **Accept and publish** question;
- checkpointed execution retains only the next-delivery-unit checkpoint;
- `local-only` permits a local commit but prevents push and pull-request
  mutation;
- `no commit` prevents commit and every dependent publication action;
- `no push` permits a local commit but prevents push and pull-request mutation;
- `no PR` permits commit and normal push but prevents pull-request mutation;
- publication failure preserves local evidence and stops for diagnosis; and
- merge, release, deployment, cleanup, branch deletion, plain force push, and
  unrelated changes remain prohibited.

Update `/implement` so its description and expansion state that the flow
implements, verifies, reviews when selected, commits, pushes, and opens or updates
a ready pull request by default. Keep the prompt thin and route detailed behavior
to the skill.

Update the Engineering and root READMEs with the same default and opt-out
boundary. Do not duplicate the detailed `commit` or `open-pr` contracts.

Run the focused test until green, then run:

```sh
npm run smoke:source
npm run check
```

Start deterministic Pi from this worktree with only the Engineering package.
Confirm `/implement` and `skill:implement` load without conflicts. Run the
focused test, enter `/reload`, then exercise `/implement` prompt expansion and
confirm the automatic publication wording is present without performing a Git or
GitHub mutation.

Freeze the final diff and run one read-only fixed-diff formal review against the
accepted pitch and plan. The reviewer does not rerun QA gates. Resolve accepted
findings, rerun only invalidated focused evidence, then run the exact complete
gate once against the final tree when required.

### Atomic commit and pull request

Implementation commit:

```text
feat(pi-engineering): automate implementation publication
```

Keep the implementation, prompt, tests, Engineering README, root README, and
completed plan marker in this atomic commit. Publish delivery unit 1 as one ready
standalone pull request from `feat/automate-implementation-publication` to
`main` through `open-pr`.

After successful final evidence and review, accept-all authority requires the
parent to invoke `commit` and `open-pr` automatically. Do not ask the user for a
separate commit, push, or pull-request instruction.

### Done when

- The focused red and green evidence is recorded.
- AC-001 through AC-010 are satisfied.
- Focused tests, source smoke, reload acceptance, and `npm run check` pass.
- The fixed formal review has no unresolved material finding.
- The plan checkbox is `[x]`.
- The feature commit is validated and the branch is pushed normally.
- The ready pull request has verified title, body, base, head, and head SHA.
- The worktree and index are clean.
