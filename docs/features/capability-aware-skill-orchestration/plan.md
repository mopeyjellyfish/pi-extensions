---
status: accepted
---

# Plan: Capability-aware skill orchestration

This plan delivers the accepted pitch in one review, validation, and publication
boundary. It preserves the existing private role profile and makes the
installable workflow guidance use those capabilities consistently.

## Review evidence

- **Applicability:** not applicable. The plan does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

Optional Fable planning perspective was not obtained because the selected bridge
model was unavailable. The parent used repository evidence and the completed
Researcher inventory. One distinct Opus/high rigorous challenge consumed the
planning independent-review budget. It found topology-mechanics gaps in shared
terms, lane setup, branch identity, integration, repair re-entry, and publication
authority. This revision resolves those findings without changing the accepted
delivery boundary or package scope.

## Execution mode

The selected mode is **accept-all implementation**. Whole-plan approval confirms
that authority only for this named accepted plan. It authorizes creation of the
two named local lane branches and worktrees below. It does not authorize their
publication or removal, or merge, release, deployment, destructive cleanup,
unrelated changes, or publication outside the named task branch and pull request.

A material forecast variance returns control to the human. A delivery-boundary
or authority change requires fresh approval. Publication of
`chore/subagent-routing-defaults` and its lower pull request remains a separate
precondition under its previously accepted authority. If that publication is
still blocked, this plan fails closed before publishing the upper branch.

## Delivery topology

| Delivery unit | Topology | Stack position | Branch                              | Pull request base                 | Dependencies                                               | Checks                                                                                                  | Ownership                                                                                                                                                                                                                                                                                | Integration point                                                                                      | CI fan-out                                         | Cascade cost                                                                                     |
| ------------- | -------- | -------------- | ----------------------------------- | --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1             | stack    | 2/2            | `feat/subagent-skill-orchestration` | `chore/subagent-routing-defaults` | Accepted and separately published six-role private profile | Focused resource tests, `npm run check`, source smoke included by the root check, final QA and Reviewer | Engineering: `feat/subagent-skill-orchestration-engineering-lane`; Feature Flow: `feat/subagent-skill-orchestration-feature-flow-lane`; serial integration Worker in the current task worktree; each lane is sole writer until ownership transfers at integration; parent owns synthesis | Verified lane trees are cherry-picked into the current task branch, then one frozen assurance boundary | 1 pull request after its lower pull request exists | Medium: an upstream role-contract change invalidates routing assumptions and cross-package proof |

The pitch, plan, package guidance, private-profile documentation, and tests share
this one implementation delivery unit. They have no independent merge or review
value. This plan adds no sibling pull request. The current branch stays stacked
on `chore/subagent-routing-defaults`; do not rebase or retarget it without new
authority. Publication must verify and publish the lower pull request before this
stacked pull request can use it as its base.

### Normative portable capability terms

All implementation lanes use these exact portable terms. Package guidance does
not map them to private role or model names.

| Term                               | Selection purpose                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `implementation writer capability` | One bounded non-trivial repository change and focused proof                       |
| `factual research capability`      | One named repository or primary-source evidence gap                               |
| `mechanical support capability`    | Bounded inventory or transformation when no specialist owns it                    |
| `QA capability`                    | Failed-command diagnosis, browser proof, or ambiguous acceptance                  |
| `review capability`                | Risk-selected intent and Standards review on a fixed boundary                     |
| `Git delivery capability`          | Authorized commit integration, conflict/rebase method, and pull-request mechanics |

All support capabilities return evidence only. The parent owns routing,
synthesis, product and architecture decisions, approval, final diff inspection,
verification, and publication decisions.

## Critical path, dependencies, and lanes

1. Commit the accepted plan on the current task branch.
2. Create local lane branches
   `feat/subagent-skill-orchestration-engineering-lane` and
   `feat/subagent-skill-orchestration-feature-flow-lane` from that exact commit,
   each in a separate managed worktree. Record the path, branch, base SHA, and
   clean state before launching a writer. Retain both worktrees as read-only
   evidence after integration; their removal is outside this plan.
3. Start two independent Worker implementation lanes concurrently:
   - **Engineering lane:** owns only `packages/engineering/**`.
   - **Feature Flow lane:** owns only `packages/feature-flow/**`.
4. Each Worker is the sole writer in its lane. Before its first test it activates
   the declared Node and Go runtimes, runs `npm ci --ignore-scripts`, and records
   the `.nvmrc`, `.gvmrc`, and `package-lock.json` fingerprint. Setup failure is
   diagnosed separately and is not red-test evidence. The Worker adds the
   intended failing resource assertion before guidance, runs focused proof and
   path-focused formatting proof, and returns one validated atomic commit plus
   evidence.
5. After both lanes complete, use the configured Git delivery capability to
   verify each commit's base, path set, tree, and non-overlap. Cherry-pick the
   Engineering commit and then the Feature Flow commit onto the current task
   branch. Lane SHAs are handoff identifiers; the integrated commit SHAs can
   differ. Verify integrated path sets and trees rather than SHA identity. Do not
   rebase, merge, amend, force, or mutate a remote.
6. After successful integration, lane worktrees become read-only and accepted
   path ownership transfers to one serial integration Worker in the current task
   worktree. That Worker owns the named root-profile paths and may repair any
   integrated accepted path only after a complete lane handoff. It must not
   replace or finish a blocked, partial, or variance lane; stop for parent
   ownership or replanning in that case.
7. The integration Worker adds the cross-surface contract assertion first,
   aligns private routing, runs the combined focused suite, and returns a clean
   handoff. The parent inspects the integrated diff and runs `npm run check`.
8. Freeze the production and resource diff with the exact base SHA, HEAD SHA,
   and tree identifier. Run QA and Reviewer concurrently. QA checks ambiguous
   cross-package acceptance and executable evidence; Reviewer checks the fixed
   diff against the pitch, plan, repository Standards, package independence, and
   lifecycle safety. Neither lane writes.
9. Join findings into one prioritized packet. Resume only the retained serial
   integration Worker in the current task worktree; do not launch a replacement.
   After any accepted-path repair, rerun invalidated focused proof and
   `npm run check`, create a new frozen identifier, and rerun QA and Reviewer
   concurrently. Do not accept assurance from a superseded frozen diff.
10. Create the atomic private-profile synchronization or repair commit, verify
    the final base, commit trees, messages, and clean task worktree, then publish
    only through `open-pr` after the separately authorized lower pull request
    exists and remote preflight succeeds.

**Critical-path forecast:** Two active write lanes reduce package-guidance time
because their ownership and tests do not overlap. Git integration and private
profile synchronization are serial. The expensive gate is one final
`npm run check`. Final QA and Reviewer run concurrently on one frozen diff. The
plan creates one delivery unit and one upper pull request. No additional CI
fan-out occurs. Expected implementation coordination is two Worker handoffs, one
Git integration handoff, one serial integration Worker handoff, and one joined
assurance handoff. Each fresh lane performs dependency setup once; the serial
integration Worker reuses the parent setup only after matching the recorded
selector and lockfile fingerprint.

**Invalidation map:**

- A change under `packages/engineering/**` invalidates the Engineering focused
  test and any final review finding for that package.
- A change under `packages/feature-flow/**` invalidates the Feature Flow focused
  test and any final review finding for that package.
- A change to root profile documentation or `test/tooling/packages.test.ts`
  invalidates the root focused test and cross-surface consistency proof.
- Any integrated-tree change after `npm run check` invalidates that final gate.
- Any change after the frozen-diff identifier invalidates both final assurance
  results unless the parent proves the changed paths are outside their recorded
  scope; material routing edits always invalidate both.
- A concrete contract conflict in a package outside Engineering, Feature Flow,
  and the private root profile is a reshape trigger. AC-011 applies only to the
  accepted owned entry surfaces.
- Post-assurance edits are not permitted on accepted production or resource
  paths without a new freeze and replacement QA plus Reviewer pass. Bounded plan
  checkbox or exact-evidence bookkeeping is outside the frozen production scope;
  the parent must verify that such a change contains no guidance or acceptance
  revision.
- Dependency metadata, runtime selectors, package manifests, workflows, or Go
  files are out of scope. If they change, stop and reshape before selecting extra
  security, workflow, setup, or Go gates.

## [x] 001 — Engineering owns implementation and assurance routing

### Outcome and requirement trace

Engineering entry and implementation methods select each capability by purpose:
normal non-trivial writes use one Worker; confirmed non-trivial bugs hand off to
`implement`; factual research and bounded mechanical support return evidence;
QA and Reviewer remain distinct; authorized Git delivery cannot replace the
implementation writer; child roles cannot orchestrate. Existing direct-parent
exceptions remain explicit.

Traces: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008,
AC-009, AC-010.

### Seam and files

Public seams:

- `packages/engineering/skills/developing-changes/SKILL.md`
- `packages/engineering/skills/implement/SKILL.md`
- Pi-specific additions in
  `packages/engineering/skills/diagnosing-bugs/SKILL.md`
- `packages/engineering/skills/just-do-it/SKILL.md` only if an explicit exception
  needs clarification
- Existing entry and handoff language in
  `packages/engineering/skills/domain-modeling/SKILL.md`,
  `packages/engineering/skills/ticket-workflow/SKILL.md`,
  `packages/engineering/skills/improve-codebase-architecture/SKILL.md`,
  `packages/engineering/skills/test-driven-development/SKILL.md`, and
  `packages/engineering/prompts/develop.md`; edit only when the red proof finds a
  concrete conflict
- `packages/engineering/README.md`
- `packages/engineering/test/resources.test.ts`

Do not rewrite the pinned upstream body of `diagnosing-bugs` or modify
`code-review` so it can spawn children.

### Dependencies

Accepted pitch and accepted plan commit. No dependency on slice 002.

### Execution lane and ownership

`parallel-ready`: Engineering lane in the managed
`feat/subagent-skill-orchestration-engineering-lane` worktree from the accepted
plan commit. One fresh Worker is sole writer for `packages/engineering/**`. No
other lane may edit those paths. Before testing, it completes declared runtime
activation and dependency setup once and records the setup fingerprint.
Integration waits for slices 001 and 002 to complete.

### Red proof

Add the smallest resource assertions that fail on the current text and prove:

- confirmed non-trivial bug fixes hand off from diagnosis to `implement` with the
  symptom, cause, regression seam, and evidence;
- research, mechanical support, QA, Reviewer, and Git delivery have distinct
  capability-based selection purposes;
- evidence-only support and child no-fanout authority are explicit; and
- the Worker-first rule and direct-parent exceptions remain consistent.

Run:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
```

Record the intended assertion failures before editing guidance.

### Green proof and checks

Make the minimum guidance and README changes that satisfy the failing contract.
Use the normative portable capability terms and honest unavailable-capability
fallbacks. Run the focused test and Prettier against the exact changed files:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm exec -- prettier --check <changed-engineering-files>
```

Any later edit under `packages/engineering/**` invalidates this proof. A
package-path failure found after integration belongs to the serial integration
Worker after ownership transfer.

### Atomic commit and pull request

Atomic commit: `feat(pi-engineering): coordinate capability-based subagents`.
It belongs to delivery unit 1 and does not create a separate pull request.

### Done when

- The focused test and path-focused formatting proof pass.
- The pinned diagnostic body is unchanged outside its Pi-specific addition seam.
- The commit changes only `packages/engineering/**`.
- The Worker returns the lane branch and path, commit SHA, base SHA, commit tree,
  exact changed paths, runtime-selector and lockfile fingerprint, setup command,
  validation output, and residual risks.

## [x] 002 — Feature Flow uses bounded evidence lanes

### Outcome and requirement trace

Shape and planning use read-only factual and mechanical support only for named
evidence gaps. Independent read-only lanes run concurrently only when disjoint
work shortens the critical path or protects parent context. The parent joins all
results before product, architecture, slice, or approval decisions. Planning
keeps the accepted safe parallel-writer requirements and direct-parent fallback.

Traces: AC-003, AC-004, AC-005, AC-008, AC-010.

### Seam and files

Public seams:

- `packages/feature-flow/skills/shape/SKILL.md`
- `packages/feature-flow/skills/planning-changes/SKILL.md`
- `packages/feature-flow/README.md`
- `packages/feature-flow/test/resources.test.ts`

The optional planning adviser budget remains separate. Do not add private role or
model names and do not assume Engineering is installed.

### Dependencies

Accepted pitch and accepted plan commit. No dependency on slice 001.

### Execution lane and ownership

`parallel-ready`: Feature Flow lane in the managed
`feat/subagent-skill-orchestration-feature-flow-lane` worktree from the same
accepted plan commit. One fresh Worker is sole writer for
`packages/feature-flow/**`. It has no file overlap with slice 001. Before
testing, it completes declared runtime activation and dependency setup once and
records the setup fingerprint. Integration waits for both lanes.

### Red proof

Add the smallest resource assertions that fail on current guidance and prove:

- each read-only lane needs a named evidence gap and critical-path or parent
  context benefit;
- parallel evidence gaps are disjoint and all results are joined before
  decisions;
- support cannot own product, architecture, slice, synthesis, approval, or final
  verification; and
- unavailable capabilities use an honest direct-parent fallback.

Run:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts
```

Record the intended assertion failures before editing guidance.

### Green proof and checks

Make the minimum Shape, planning, README, and resource-test changes. Keep the
existing adviser question and independent-review budgets unchanged. Use the
normative portable capability terms. Run the focused test and Prettier against
the exact changed files:

```sh
npm test -- --run packages/feature-flow/test/resources.test.ts
npm exec -- prettier --check <changed-feature-flow-files>
```

Any later edit under `packages/feature-flow/**` invalidates this proof. A
package-path failure found after integration belongs to the serial integration
Worker after ownership transfer.

### Atomic commit and pull request

Atomic commit: `feat(pi-feature-flow): coordinate bounded evidence lanes`. It
belongs to delivery unit 1 and does not create a separate pull request.

### Done when

- The focused test and path-focused formatting proof pass.
- Package resources remain independently installable and capability-neutral.
- The commit changes only `packages/feature-flow/**`.
- The Worker returns the lane branch and path, commit SHA, base SHA, commit tree,
  exact changed paths, runtime-selector and lockfile fingerprint, setup command,
  validation output, and residual risks.

## [x] 003 — Private profile maps and proves the lifecycle contract

### Outcome and requirement trace

The private root profile maps the portable capability contract to Worker,
Researcher, QA, Reviewer, Git, and Utility without changing their configured
models, thinking levels, tools, or count. Root guidance states direct-parent
exceptions, evidence-driven concurrency, child no-fanout authority, frozen QA
plus Reviewer assurance, retained-Worker repair, and Git delivery boundaries.
Contract tests prove the package and private guidance agree and contain no
forbidden package coupling.

Traces: AC-001 through AC-011.

### Seam and files

- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `test/tooling/packages.test.ts`
- `docs/features/capability-aware-skill-orchestration/plan.md` only for bounded
  completion checkbox or exact-evidence bookkeeping after assurance

Inspect `agents/*.md` and existing package tests as evidence. Do not edit agent
catalog files unless a concrete contract defect makes the accepted no-go
impossible; such a need is a reshape trigger.

### Dependencies

Slices 001 and 002 integrated into the current task branch through the configured
Git capability with verified non-overlapping commits.

### Execution lane and ownership

`serial`: one fresh integration Worker in the current task worktree after both
package commits are verified and cherry-picked. It is the sole writer during
this slice. Ownership transfers from completed lane Workers at this named
integration point. The integration Worker owns the named root paths and any
accepted integrated package path that needs cross-surface alignment or later
repair. The parent must not edit concurrently.

### Red proof

Add a focused assertion in `test/tooling/packages.test.ts` that fails on the
current root guidance and proves the exact private-role-to-portable-purpose
contract, direct-parent exceptions, evidence-driven concurrency, child no-fanout
rule, and no package-private role leakage.

Run:

```sh
npm test -- --run test/tooling/packages.test.ts
```

Record the intended assertion failure before editing root guidance.

### Green proof and checks

Align the minimum root guidance, then run the combined focused suite:

```sh
npm test -- --run \
  packages/engineering/test/resources.test.ts \
  packages/feature-flow/test/resources.test.ts \
  test/tooling/packages.test.ts
npm exec -- prettier --check \
  AGENTS.md README.md docs/architecture.md test/tooling/packages.test.ts
```

The parent inspects the full diff after the Worker returns, verifies matching
setup evidence, and runs `npm run check` once on the final integrated tree. Any
accepted-path repair invalidates the relevant focused proof, final check, and
frozen assurance.

Live Pi `/reload` acceptance is not applicable because this feature changes only
Markdown skill resources, documentation, and text-contract tests. Fresh source
loadability and lifecycle safety remain covered by the root source smoke inside
`npm run check`.

Freeze the exact production and resource diff with base SHA, HEAD SHA, and tree
identifier. Run QA and Reviewer concurrently. QA validates the ambiguous
cross-package acceptance contract and the recorded executable proof. Reviewer
performs one read-only fixed-diff review against the accepted pitch, plan,
repository Standards, package independence, and lifecycle risks. Join one
prioritized repair packet and resume only the retained integration Worker. Any
repair requires a new final check, frozen identifier, and replacement concurrent
QA plus Reviewer pass.

### Atomic commit and pull request

Atomic commit: `docs: align private capability orchestration`. It belongs to
delivery unit 1. The complete branch publishes through one stacked pull request
titled `feat: coordinate capability-aware skill orchestration` with base
`chore/subagent-routing-defaults`.

### Done when

- All focused resource tests pass on the integrated tree.
- `npm run check` passes after the final accepted-path edit.
- QA reports executable and cross-package acceptance evidence with no unresolved
  material defect on the final frozen identifier.
- Reviewer reports no unresolved material finding on the same final identifier.
- The final diff changes only accepted paths and preserves package independence,
  release metadata, role count, role models, and agent files.
- All planned commits pass repository commit validation and tree comparison.
- The task worktree and index are clean after commits. Lane worktrees remain
  retained and read-only; their removal is not authorized by this plan.
- Publication either verifies the separately authorized lower pull request,
  pushes the upper branch normally, creates the stacked pull request through
  `open-pr`, and verifies remote metadata, or fails closed with exact recovery
  guidance. No merge, release, rebase, force-push, amend, destructive cleanup,
  or branch removal occurs.
