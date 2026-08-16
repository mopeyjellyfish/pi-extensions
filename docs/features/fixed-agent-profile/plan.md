---
status: accepted
---

# Plan: Fixed cross-provider agent profile

Work the first unchecked slice. Keep all slices serial in the accepted Shape worktree. The packages, root profile, and lifecycle contracts share resource names and tests, so parallel writers would create unnecessary integration risk.

## [x] 001 — Establish the one review method and deeper design vocabulary

### Outcome

An independent Engineering install exposes one `code-review` skill and one expanded `codebase-design` skill. Review covers the accepted pitch and plan plus repository Standards from a fixed diff, and implementation and review share precise deep-module vocabulary.

### Requirement trace

- [One code-review skill](pitch.md#one-code-review-skill)
- [Codebase design and architecture improvement](pitch.md#codebase-design-and-architecture-improvement)
- AC-009, AC-010, and AC-016

### Implementation

Use `packages/engineering/test/resources.test.ts` as the public resource contract. Add failing assertions for the `code-review` name, removal of `reviewing-changes`, the integrated single-reviewer axes, applicable language references, required review risk areas, and the expanded design vocabulary.

Replace `packages/engineering/skills/reviewing-changes/` with `skills/code-review/`. Adapt the pinned upstream `code-review/SKILL.md` at commit `068b6e0c62393147daf03530149cdce209c93da8` into the accepted Pi-native Pitch-and-plan and Standards flow. This follow-up integration supersedes the original source-preservation approach. Update `developing-changes`, `/review-change`, Engineering documentation, packed-resource expectations, and all active references. Do not leave a second review skill or command.

Adapt `skills/codebase-design/SKILL.md` with the useful current upstream glossary, depth, seam, adapter, leverage, locality, deletion, and test-surface guidance. Integrate the local evidence rules against speculative seams, forwarding-only layers, and syntax-only deduplication. Adapt its deepening and alternative-interface references to the profile. Update `THIRD_PARTY_NOTICES.md` with exact pinned sources and adapted status.

### Execution mode

`serial`. No dependencies. This supplies skills required by later Reviewer and Worker profiles.

### Difficulty

`standard` — bounded Markdown resources, attribution, and deterministic contract tests.

### Test posture

`tdd` — add resource, integration, language-reference, design-content, and packed-artifact assertions before replacing the skills.

### Red signal

The focused Engineering test fails because `code-review` and its language references are absent, `reviewing-changes` is still packed and referenced, the adapted design resources and safeguards are unavailable, and the expanded design terms are missing.

### Green signal

The focused test finds one integrated `code-review` skill with Pitch and plan plus Standards axes and applicable language references, no `reviewing-changes` resource or live reference, the complete adapted design contract, and synchronized notice and packed contents.

### Verification

- `npm test -- --run packages/engineering/test/resources.test.ts`
- `npm --workspace @mopeyjellyfish/pi-engineering test`
- `npm run packages:check`
- `git diff --check`

### Done when

The Engineering package independently ships exactly one integrated review method, codebase design contains the complete adapted vocabulary, testability guidance, references, and local safeguards, and attribution matches every changed resource.

## [x] 002 — Add the safe `/improve` architecture-discovery flow

### Outcome

An Engineering install exposes `/improve`. It reports ranked, evidence-backed codebase deepening opportunities and routes a selected candidate to Shape instead of editing production code.

### Requirement trace

- [Codebase design and architecture improvement](pitch.md#codebase-design-and-architecture-improvement)
- [Parent routing and Sol control](pitch.md#parent-routing-and-sol-control)
- AC-010, AC-011, AC-016

### Implementation

Extend the Engineering resource tests first. Add `skills/improve-codebase-architecture/SKILL.md` and `prompts/improve.md`. Adapt the upstream hot-spot, domain-context, architecture-decision, deepening-candidate, ranking, and before/after ideas to the accepted repository-neutral flow. Use `codebase-design` vocabulary, one optional bounded Researcher handoff, the `question` decision boundary, and Shape handoff.

Do not copy the upstream issue-tracker, grilling-skill, remote HTML asset, desktop-opening, or direct-edit assumptions. Update Engineering README, package resource expectations, and `THIRD_PARTY_NOTICES.md`.

### Execution mode

`serial`. Depends on slice 001's `codebase-design` contract.

### Difficulty

`standard` — one skill, one prompt, docs, attribution, and resource tests.

### Test posture

`tdd` — prove prompt expansion, packed discovery, report fields, human choice, and no-direct-edit or Shape-handoff behavior before adding the resources.

### Red signal

The focused Engineering test cannot discover or expand `/improve` and cannot find the accepted scan, ranking, decision, or Shape-handoff contract.

### Green signal

The package test discovers `/improve`, packs its skill and prompt, and proves that the command uses design vocabulary, reports evidence, asks for a selection, and does not implement directly.

### Verification

- `npm test -- --run packages/engineering/test/resources.test.ts`
- `npm --workspace @mopeyjellyfish/pi-engineering test`
- Probe `/improve` prompt expansion through the pinned Pi prompt loader
- `npm run packages:check`
- `git diff --check`

### Done when

`/improve` is a single safe discovery route, its selected output enters Shape, and no missing upstream companion skill or target-repository assumption remains.

## [x] 003 — Add complete conflict resolution and bounded Git publication

### Outcome

An independent Git Conventions install teaches intent-preserving merge and rebase conflict resolution, required verification, safe continuation, and bounded post-rebase publication without repeated user instruction.

### Requirement trace

- [Conflict-resolution support](pitch.md#conflict-resolution-support)
- [Fixed agent catalog](pitch.md#fixed-agent-catalog), Git authority
- AC-012, AC-013, AC-016

### Implementation

Add failing package tests for a third `resolving-merge-conflicts` skill, its packed contents, attribution, in-progress-operation guard, two-intent evidence, deliberate hunk repair, required checks, ask-on-incompatible-intent behavior, human-selected abort, merge or rebase continuation, current non-default branch protection, and verified `--force-with-lease` after rebase.

Add `packages/git-conventions/skills/resolving-merge-conflicts/SKILL.md`, adapting the pinned upstream sequence and composing it with the package's existing rebase and commit safety. Update `git-rebase-base` only where necessary to make the handoff and leased-force-push boundary coherent. Preserve explicit task authority for Git operations while allowing the accepted Git agent to push its current safe task branch. Add and package `THIRD_PARTY_NOTICES.md`; update the package manifest, README, and packed-resource test.

### Execution mode

`serial`. No code dependency on slices 001–002, but it shares the later Git agent profile and root docs.

### Difficulty

`standard` — security-sensitive wording, but the change remains a bounded Markdown contract with deterministic tests and no runtime implementation.

### Test posture

`tdd` — add skill, safety, manifest, attribution, and packed-artifact assertions before the resource.

### Red signal

The focused Git Conventions test finds only two skills and no enforceable conflict, continuation, abort, or leased-force-push contract.

### Green signal

The package ships and packs the conflict skill and notice; tests prove intent recovery, guarded resolution, required checks, safe continuation, bounded push, and the prohibition on default/protected destinations and plain force.

### Verification

- `npm test -- --run packages/git-conventions/test/skills.test.ts`
- `npm --workspace @mopeyjellyfish/pi-git-conventions test`
- `npm run packages:check`
- `npm run security:check`
- `git diff --check`

### Done when

The Git package independently supplies commit, rebase, and conflict methods with one coherent publication boundary, complete attribution, and no instruction that can silently overwrite protected history.

## [x] 004 — Install the six fixed agents and complete resource profile

### Outcome

`pi install git:github.com/mopeyjellyfish/pi-extensions` loads six package agents with exact models, thinking levels, tools, and private skills, plus complete Engineering and Productivity resources. Standard work routes through Terra Worker and formal review through Opus Reviewer with no fallback or automatic Sol use.

### Requirement trace

- [Fixed agent catalog](pitch.md#fixed-agent-catalog)
- [Parent routing and Sol control](pitch.md#parent-routing-and-sol-control)
- [Root install and repository-neutral contract](pitch.md#root-install-and-repository-neutral-contract)
- AC-001 through AC-008 and AC-014

### Implementation

Start with failing root and Engineering contract tests. Replace `agents/terra-worker.md`, `agents/sol-worker.md`, and `agents/fable-reviewer.md` with exactly:

- `worker.md`: Terra medium, writer tools, selected TDD/design/diagnosis/domain/writing skills;
- `researcher.md`: Luna low, read/search/Bash/web research, no edits;
- `qa.md`: Luna medium, read/search/Bash/Playwright, no edits;
- `reviewer.md`: Opus 5 medium, fixed-diff read tools and `code-review` plus design;
- `git.md`: Terra medium, Git mutation tools and commit/rebase/conflict/GitHub/Worktrunk skills;
- `utility.md`: Luna medium, bounded read/search/Bash/web support, no edits.

Pin fresh context, repository-instruction inheritance, explicit skills and private `skillPath`, acceptance roles, and no fallback in each profile. Verify every named tool exists under the pinned extensions. Keep every model explicit; pinned `pi-subagents` leaves explicit frontmatter stronger than `subagents.defaultModel`.

Change the exact root profile in `package.json`, `scripts/lib/packages.ts`, and `test/tooling/packages.test.ts` to load complete Engineering and Productivity skill and prompt directories. Expand aggregate tests to parse all six agent files and assert exact names, models, levels, role tools, selected skills, no fallback, no old profiles, and root resource lists.

Rewrite `packages/engineering/skills/implement/SKILL.md` and its tests so Worker is the only configured implementation child and Reviewer is the formal read-only review. Remove automatic difficulty-based Sol routing and Sol repair. A failed Worker or concrete hard constraint must produce a justified `question` before any explicit one-off Sol run. Update Engineering docs and active prompts without creating a hidden escalation profile.

### Execution mode

`serial`. Depends on slices 001–003 because the new profiles select their skills by name and private path.

### Difficulty

`hard` — the exact agent catalog, root manifest validator, package resource graph, model/provider contracts, and implementation lifecycle change together. A partial update can leave installation loadable but behaviorally inconsistent.

### Test posture

`tdd` — fail exact profile, role-capability, root-resource, and implementation-route contracts before replacing the catalog and routing.

### Red signal

Focused aggregate and Engineering tests still discover the three old profiles, Fable review, automatic Sol escalation, incomplete root resources, missing role skills, or incorrect tools and levels.

### Green signal

Focused tests discover exactly six fixed profiles; prove their model, thinking, authority, private skills, and no-fallback contracts; load complete Engineering and Productivity resources; and show Worker → parent verification → Reviewer with question-gated Sol only.

### Verification

- `npm test -- --run test/tooling/packages.test.ts packages/engineering/test/resources.test.ts packages/productivity/test/resources.test.ts`
- `npm --workspace @mopeyjellyfish/pi-engineering test`
- `npm --workspace @mopeyjellyfish/pi-productivity test`
- Preflight or equivalent pinned `pi-subagents` agent discovery for all six profiles
- `npm run packages:check`
- `npm run smoke:source`
- Start the deterministic root profile from this worktree and confirm six agents plus Engineering and Productivity resources load without conflicts
- Run the focused test, enter idle `/reload`, and confirm the same catalog and routes without duplicates or stale names
- `git diff --check`

### Done when

The root install exposes the accepted six-agent catalog and complete resource profile; every child is role-bounded and model-fixed; old profile names and automatic Sol paths are absent; and deterministic startup and reload prove the live package graph.

## [x] 005 — Make parent routing efficient and production resources repository-neutral

### Outcome

Shape and planning use the selected Fable or Sol parent for judgment, may offload one bounded discovery task to Researcher, apply codebase-design when module shape changes, and ask before uncertain routing or Sol use. Installed documentation explains exact setup and every production resource remains portable to unrelated repositories.

### Requirement trace

- [Parent routing and Sol control](pitch.md#parent-routing-and-sol-control)
- [Root install and repository-neutral contract](pitch.md#root-install-and-repository-neutral-contract)
- [Fixed decisions](pitch.md#fixed-decisions)
- AC-003, AC-005 through AC-008, AC-010, AC-014, AC-015, AC-017

### Implementation

Add failing Feature Flow tests for parent-owned Shape and planning judgment, one optional bounded Researcher handoff, no delegated product or architecture decision, codebase-design use for module-shape slices, and question-based ambiguity. Preserve worktree-first behavior and independent package fallback when package agents are unavailable.

Update Shape and planning with the smallest compatible routing guidance. Update `AGENTS.md` to state the target-repository contract: production extensions, skills, prompts, and agents run in other codebases; they use target instructions and vocabulary; and they cannot assume this monorepo's paths, packages, skills, extensions, or commands exist. Align its subagent profile guidance with Luna/Terra defaults, Opus review, and explicit Sol approval without depending on repository-owned agent names.

Update root `README.md`, `docs/architecture.md`, Engineering, Feature Flow, Git Conventions, and Productivity docs. Include the six-agent table, exact `subagents.disableBuiltins: true` setting, the explicit-frontmatter model precedence, sign-in prerequisites, selectable Fable/Sol parent, AskClaude's non-bridge-only limit, fixed no-fallback behavior, bounded Sol question, complete installed resources, and Git push/leased-force-push policy. Remove stale active references to the old agents and routes; historical accepted feature documents remain historical evidence and are not rewritten.

### Execution mode

`serial`. Depends on slice 004's installed agent and root resource contracts.

### Difficulty

`standard` — cross-document and skill-contract alignment with focused tests, but no new runtime behavior.

### Test posture

`tdd` for Feature Flow and active-resource contracts; focused before-and-after searches for repository neutrality and stale active names.

### Red signal

Feature Flow tests reject Researcher offload or design review, and active guidance still advertises old agents, automatic Sol, incomplete installation, or assumptions about this monorepo in target repositories.

### Green signal

Feature Flow tests preserve parent judgment and worktree safety while allowing one bounded Researcher task; active docs and instructions consistently describe the six fixed agents, exact user setup, provider limits, explicit Sol control, and repository-neutral production resources.

### Verification

- `npm test -- --run packages/feature-flow/test/resources.test.ts test/tooling/packages.test.ts`
- `npm --workspace @mopeyjellyfish/pi-feature-flow test`
- Search active resources for `terra-worker`, `sol-worker`, `fable-reviewer`, and `reviewing-changes`; only historical accepted feature documents may retain them
- `npm run smoke:source`
- `npm run smoke:packed`
- `npm run security:check`
- `npm run check`
- Repeat deterministic root startup, focused test, idle `/reload`, and one route probe for Researcher, Worker, Reviewer, Git, QA, Utility, and `/improve`
- Inspect `git diff --check`, package/release metadata, credentials, sessions, caches, coverage, archives, and delegated-agent artifacts

### Done when

All acceptance criteria hold against the final worktree, complete required checks pass after the final edit, live startup and reload show no duplicate or stale resources, and the diff contains no target-repository assumptions or unauthorized remote action.
