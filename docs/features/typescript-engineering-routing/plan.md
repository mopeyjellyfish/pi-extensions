---
status: accepted
---

# Plan: TypeScript engineering routing

This plan integrates the new TypeScript methods into the repository's normal
implementation, review, and architecture-improvement routes. A user who starts
with `/implement`, `/review-change`, or `/improve` must not need to invoke the
TypeScript skills separately.

## Review evidence

- **Applicability:** Not applicable. The outcome does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance or routing.
- **Fixed document:** Not applicable.
- **Status:** Not applicable.
- **Invalidation:** Not applicable.

## Execution mode

Checkpointed implementation. This plan contains one delivery unit, so approval
authorizes its bounded implementation, verification, review, commit, push, and
update to pull request 120. It does not authorize merge, release, deployment,
destructive cleanup, branch deletion, or unrelated work.

## Delivery topology

| Delivery unit | Topology   | Branch                   | Pull request base | Dependencies                                     | Checks                                                                                       | Ownership                                | Integration point                        | CI fan-out | Cascade cost |
| ------------- | ---------- | ------------------------ | ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------- | ---------- | ------------ |
| 1             | standalone | `feat/typescript-skills` | `main`            | TypeScript package commit already on this branch | focused Engineering and root-profile tests, source smoke, `npm run check`, fixed-diff review | current task worktree; one Worker writer | Engineering routes and fixed-role agents | 1          | low          |

This follow-up stays in pull request 120 because the TypeScript package and its
automatic Engineering routing form one user-visible capability. The change uses
a separate atomic Engineering feature commit after this accepted plan commit.

## Critical path, dependencies, and lanes

The critical path is: add failing routing-contract tests, update the three
Engineering methods, update fixed-role agent capabilities, document prompt and
root-profile behavior, then run the stable-unit checks. There is one active
lane, one writer, one worktree, and one pull request. Parallel writers would
overlap the same contract tests and add no review or rollback value.

Invalidation map:

- A change to an Engineering skill, prompt, or README invalidates the focused
  Engineering resource test and source smoke.
- A change to Worker or Reviewer frontmatter invalidates the root agent-profile
  contract test and source smoke.
- A change to root workflow documentation invalidates formatting and
  markdownlint checks.
- Any change after the frozen diff invalidates `npm run check` and fixed-diff
  review evidence for the changed surface.

## [ ] 001 — Automatic TypeScript method routing

### Outcome and requirement trace

`/implement`, `/review-change`, and `/improve` detect relevant TypeScript work
and resolve the installed TypeScript methods by name. Reusable TypeScript
library work receives library-specific guidance without a separate user command.
The routes remain independently installable and use honest direct-parent
fallbacks when the TypeScript package is absent.

The applicability matrix is:

- substantial TypeScript or TSX uses `typescript`;
- reusable package exports, declarations, ESM boundaries, public types,
  dependency-type exposure, or compatibility promises use
  `typescript-library`;
- TypeScript runtime, boundary, type-level, or asynchronous test work uses
  `typescript-testing`;
- fixed-diff TypeScript review uses `typescript-review`;
- legacy TypeScript cleanup or migration uses `typescript-modernize`.

Each method remains conditional on evidence. Target-repository instructions,
public contracts, current tools, and established commands stay authoritative.
The routes must not infer TypeScript applicability from unrelated toolchain
files alone, load every reference by default, duplicate compiler or linter
output, or claim that an unavailable companion skill loaded.

### Seam and files

Public seams:

- `/implement` through `implement` and the fixed Worker;
- `/review-change` and selected formal review through `code-review` and the
  fixed Reviewer;
- `/improve` through `improve-codebase-architecture` and its Action handoff.

Likely files:

- `packages/engineering/skills/implement/SKILL.md`;
- `packages/engineering/skills/code-review/SKILL.md`;
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`;
- `packages/engineering/prompts/{implement,review-change,improve}.md`;
- `agents/{worker,reviewer}.md`;
- `packages/engineering/test/resources.test.ts`;
- `test/tooling/packages.test.ts`;
- `packages/engineering/README.md`;
- root `README.md`, `AGENTS.md`, and `docs/architecture.md`.

### Dependencies

The five installed methods under `packages/typescript/skills/`, the independent
Engineering package contract, the fixed Worker and Reviewer profile contract,
and target-repository precedence rules.

### Execution lane and ownership

Serial in the current `feat/typescript-skills` worktree. One Worker owns all
writes. The parent owns final verification, fixed-diff review, and publication.

### Red proof

First add focused contract assertions that fail because:

- the three Engineering routes do not resolve applicable TypeScript methods;
- Worker and Reviewer do not preload the methods required by their fixed roles;
- the prompt and profile documentation does not promise automatic routing.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts test/tooling/packages.test.ts
```

### Green proof and checks

Add one compact TypeScript-routing section to each owning Engineering method.
The parent must resolve applicable methods before a Worker, evidence lane,
Action brief, or Reviewer handoff. Add the implementation methods to Worker and
the review methods to Reviewer, with profile text that applies them only when
the fixed task evidence matches. Keep the Engineering package free of a runtime,
peer, or production dependency on the TypeScript package.

Make each prompt state that its owning skill selects installed TypeScript
methods when applicable, so direct prompt use has the same contract. Document
the repository-wide profile behavior and independent-installation fallback.

Verify in this order:

```sh
npm test -- --run packages/engineering/test/resources.test.ts test/tooling/packages.test.ts
npm run smoke:source
npm run check
```

No dependency or installation metadata changes are planned, so
`npm run security:check` is not required unless the implementation changes that
boundary.

### Atomic commit and pull request

Create `feat(pi-engineering): route TypeScript methods` after the accepted plan
commit. Push the verified branch and update pull request 120. Update its title
and body so they describe both the TypeScript package and its Engineering
routing. Do not rebase, force push, merge, release, or delete the branch.

### Done when

- `/implement` automatically selects the applicable core, library, testing, and
  modernization methods before implementation handoff.
- `/review-change` and selected formal review apply `typescript-review` plus
  applicable core, library, testing, or modernization constraints.
- `/improve` applies TypeScript constraints before generic architecture advice
  and carries them into evidence lanes and Action briefs.
- Worker and Reviewer have the required fixed-profile skill paths and apply them
  conditionally.
- Independent Engineering installation records unavailable companions and uses
  bounded target-repository fallbacks without pretending the methods loaded.
- Focused tests, source smoke, and `npm run check` pass on the frozen diff.
- One fixed-diff review has no unresolved material findings.
- Pull request 120 is updated, open, ready, and cleanly published without merge
  or release.
