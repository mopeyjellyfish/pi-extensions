---
status: accepted
---

# Plan: Faster risk-based subagent delivery

## Accepted intent

The user asked to reduce Pi delivery wall-clock latency and local tool overhead,
using the current root profile and recent local session telemetry as evidence.
The accepted direction is to:

- start Pi with the repository runtimes already active and install dependencies
  once per worktree state;
- avoid repeated runtime setup, dependency installation, and unchanged gates;
- select QA and formal review by change risk rather than by every Worker result;
- run required QA and formal review concurrently against one frozen diff;
- use deterministic execution for known green-path commands and reserve model QA
  for diagnosis, browser evidence, or ambiguous acceptance;
- run independent repository checks with bounded concurrency;
- let publication reuse verification bound to the exact staged tree instead of
  rerunning the same full gate;
- keep one writer per worktree, required high-risk evidence, final diff
  inspection, and bounded publication authority; and
- deliver the complete change from a fresh task worktree in one pull request.

The user prefers aggressive safe parallelism. This plan proposes **accept-all
implementation**. Approval of the whole plan confirms that authority for this
named plan through implementation, verification, commit, push, and pull-request
creation. It does not authorize merge, release, deployment, destructive cleanup,
or unrelated work.

## Observable requirements

- **R-001 — Inherited toolchains:** The repository development launcher activates
  `.nvmrc` and `.gvmrc` before Pi starts, so parent and child Bash calls inherit
  the required runtimes.
- **R-002 — Setup reuse:** Dependency setup is reused while the worktree lockfile
  and declared runtime selectors are unchanged. Worker and QA handoffs consume
  valid setup evidence and do not reinstall independently.
- **R-003 — Risk-based assurance:** Mechanical and low-risk work may use direct
  focused verification without mandatory QA or formal review. Material
  behavioral, lifecycle, dependency, security, cross-boundary, or irreversible
  work keeps proportionate independent evidence.
- **R-004 — Parallel assurance:** When QA and formal review are both required,
  they start together against the same frozen diff and join before repair or
  publication.
- **R-005 — Non-overlapping roles:** QA owns named executable evidence. Reviewer
  owns intent, correctness, architecture, security, and maintainability review
  without rerunning QA gates.
- **R-006 — One repair packet:** Concurrent QA and review findings are combined
  into one prioritized packet for the retained Worker. Unchanged review is not
  repeated after repair; the parent verifies addressed findings unless the
  repair changes architecture or accepted scope.
- **R-007 — Deterministic green path:** Exact non-browser commands can run through
  the parent or a repository runner without a model QA launch. Model QA is
  reserved for diagnosis, browser evidence, or ambiguous acceptance.
- **R-008 — Bounded check concurrency:** Independent root checks run concurrently
  with bounded process count, stable buffered output, cancellation, and an
  aggregate failure result. A composite check never runs concurrently with its
  own constituent commands.
- **R-009 — Frozen-tree evidence:** Final verification records the tested tree.
  Commit and publication verify the staged tree still matches it and do not
  repeat unchanged gates.
- **R-010 — Repository-neutral production guidance:** Engineering and Git skills
  do not assume this monorepo's commands, paths, agents, or tools. Root-only
  launcher and check-runner code remains development tooling, not a production
  package dependency.
- **R-011 — Safe parallelism:** Parallel writers remain isolated with sole write
  ownership. Parallel read-only work uses one frozen diff and cannot mutate it.
- **R-012 — Delivery:** Focused tests, source smoke, deterministic Pi reload
  acceptance, and the final repository check pass before one atomic delivery
  and pull request.

## Delivery topology

This is one delivery unit, one branch, one worktree, and one pull request.

| Delivery unit | Branch                              | Base   | Writer lanes | Pull requests |
| ------------- | ----------------------------------- | ------ | ------------ | ------------- |
| 1             | `perf/subagent-delivery-efficiency` | `main` | 1 serial     | 1             |

All slices change one orchestration contract and share root profile tests and
final evidence. Separate pull requests would create transitional contradictions
between setup, assurance, and publication reuse. Read-only QA and review form a
parallel final lane pair, not separate delivery units.

## Critical path and parallel forecast

```text
setup contract -> orchestration contract -> evidence/publication contract
                                      \
                                       -> root parallel check runner

frozen final diff -> [QA evidence || formal review] -> joined result
                  -> one repair when needed -> invalidated evidence only
                  -> final tree attestation -> commit and pull request
```

Forecast:

- active writer lanes: one;
- read-only final lanes: up to two, QA and reviewer;
- root check process concurrency: bounded and configurable, default three;
- full repository gate executions before publication: one against the final
  frozen tree, plus only invalidated focused evidence after a repair;
- formal review passes: zero for low-risk work, one for this material workflow
  change, and no second unchanged pass;
- setup executions: once for the worktree fingerprint;
- pull requests: one;
- stack operations and cascade cost: none.

Pause only for setup or check failure, material review findings, scope or
architecture variance, or publication failure. A material review finding pauses
accept-all execution before repair as required by repository policy.

## Validation invalidation map

| Changed surface                             | Immediate invalidation                     | Stable-boundary evidence                             |
| ------------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| Root launcher or setup fingerprint          | Launcher contract tests and shell syntax   | Launcher tests plus deterministic Pi startup         |
| Root check runner or package script         | Runner unit tests and root script contract | One complete `npm run check`                         |
| Engineering routing or implementation skill | Engineering resource tests                 | Package tests, source smoke, live reload, full check |
| Worker, QA, reviewer, or Git agent contract | Root profile contract tests                | Root profile discovery, live reload, full check      |
| Commit evidence-reuse contract              | Git Conventions resource tests             | Package tests, source smoke, full check              |
| README or architecture guidance             | Markdown and owning resource tests         | Full check                                           |
| Plan-only revision                          | Markdown                                   | Full check before publication                        |

Evidence may be reused only while its covered files, command definition, setup
fingerprint, and tested tree remain unchanged.

## Slice 001 — Activate and attest the worktree environment once

### Outcome

A root development launcher activates the declared Node and Go toolchains,
installs dependencies only when the worktree setup fingerprint changes, and
executes deterministic Pi from that prepared environment. Agent guidance accepts
valid parent-supplied setup evidence and verifies inherited tools before running
setup again.

### Public seams and files

- root `package.json` development command;
- new root launcher under `scripts/`;
- root launcher contract test under `test/tooling/`;
- `AGENTS.md`, root `README.md`, and `docs/architecture.md`;
- `agents/worker.md` and `agents/qa.md` setup contracts;
- Engineering implementation task/evidence contract.

### Proof

1. Add a failing tooling test for toolchain activation order, fingerprinted
   dependency reuse, argument forwarding, and final `exec`.
2. Add failing resource assertions that setup evidence is passed once and reused
   only when its fingerprint remains valid.
3. Implement the minimum launcher and instruction changes.
4. Run the tooling and Engineering focused tests.

### Non-goals

- Do not make root development tooling a production package dependency.
- Do not store credentials or user-specific absolute paths.
- Do not skip repository setup when evidence is absent or stale.

## Slice 002 — Select and parallelize assurance by risk

### Outcome

Implementation classifies assurance from explicit risk evidence. Exact green-path
commands use deterministic execution. When both independent QA and formal review
are justified, they launch concurrently on the same fixed diff, return one
joined result, and produce at most one retained-Worker repair packet.

### Public seams and files

- `packages/engineering/skills/developing-changes/SKILL.md`;
- `packages/engineering/skills/implement/SKILL.md`;
- `packages/engineering/skills/just-do-it/SKILL.md`;
- `packages/engineering/README.md`;
- `agents/qa.md` and `agents/reviewer.md`;
- root `README.md` and `docs/architecture.md`;
- Engineering and root profile resource tests.

### Behavior

- Mechanical, documentation, and reversible metadata changes use objective
  focused evidence and direct parent diff inspection by default.
- Material public behavior, lifecycle, state, concurrency, provider, dependency,
  cross-boundary, security, migration, or irreversible changes select the
  applicable QA and review lanes.
- Known commands do not require model QA on a green path.
- Browser or ambiguous acceptance and failed-command diagnosis may use QA.
- QA and reviewer receive the same frozen-tree identifier. Reviewer does not run
  named gates.
- Hosts with concurrent child support launch both read-only lanes together;
  hosts without it preserve the same role split sequentially.
- The parent joins both results before deciding whether to repair or publish.

### Proof

1. Replace current tests that require foreground-only sequential Worker/QA/review
   behavior with failing assertions for risk selection and parallel read-only
   assurance.
2. Add assertions that Reviewer does not rerun QA commands and that low-risk
   `/just-do-it` does not mandate a Reviewer.
3. Implement the minimum production guidance and agent contract changes.
4. Run Engineering and root profile focused tests.

## Slice 003 — Run independent root checks concurrently

### Outcome

`npm run check` retains the same required checks but executes independent groups
through a tested bounded runner. It buffers output per command, reports every
failure, terminates remaining children on cancellation, and returns non-zero when
any required check fails.

### Public seams and files

- root `package.json`;
- new `scripts/check.ts`;
- shared process helper only when the existing interface can safely support the
  runner without broad refactoring;
- new focused tests under `test/tooling/`;
- root development documentation.

### Execution groups

The implementation must derive groups from resource behavior and avoid shared
mutable output. The initial intended topology is:

1. bounded static checks such as formatting, lint, Markdown, Knip, type checking,
   and package validation;
2. bounded independent dynamic checks such as coverage, smoke, and Go checks.

The runner must not invoke the composite `check` script recursively. Concurrency
is configurable and defaults to three. If evidence shows a pair shares mutable
state or becomes unstable under concurrency, serialize only that pair and record
why.

### Proof

1. Add failing tests using harmless fixture commands for concurrency bounds,
   output order, aggregate failure, and cancellation.
2. Implement the runner and repoint only the root composite script.
3. Run runner tests, then the final root check once under the required runtimes.
4. Record before/after elapsed time when both commands can run against equivalent
   clean states; do not claim a speedup without comparable evidence.

## Slice 004 — Bind verification to publication without rerunning it

### Outcome

Final evidence records the verified tree and command definitions. Commit and Git
handoffs validate that the staged tree and relevant setup/check definitions still
match. When they match, publication reuses the evidence instead of running tests
or the full repository gate again.

### Public seams and files

- `packages/git-conventions/skills/commit/SKILL.md`;
- `packages/git-conventions/README.md`;
- `packages/git-conventions/test/skills.test.ts`;
- `agents/git.md`;
- `packages/engineering/skills/implement/SKILL.md` final evidence contract;
- Engineering/root profile tests and documentation.

### Proof

1. Add failing resource assertions for a verified-tree identifier, staged-tree
   comparison, stale-evidence invalidation, and no unchanged gate rerun.
2. Implement the minimum commit, Git agent, and implementation evidence changes.
3. Run Git Conventions, Engineering, and root profile focused tests.

## Integrated verification and review

After the final edit:

1. Use the repository launcher or one correctly prepared shell to activate
   `.nvmrc` and `.gvmrc` and install dependencies once.
2. Run focused tests for the launcher/check runner, Engineering resources, Git
   Conventions resources, and root profile contracts.
3. Run `npm run smoke:source` if not already covered by the final root gate's
   current definition.
4. Start deterministic Pi from this worktree with ambient discovery disabled;
   confirm the expected agents and skills load without conflicts.
5. Enter `/reload` while Pi is idle and confirm the changed resources reload
   without duplicate registrations or stale contracts.
6. Freeze the diff and tested tree.
7. Run required QA evidence and one formal review concurrently. The formal review
   uses this plan, the complete request recorded above, the fixed base, diff, and
   available focused evidence; it does not rerun QA gates.
8. If repair is needed, combine both packets, resume the retained Worker once,
   rerun only invalidated focused evidence and the required final gate, and have
   the parent verify repaired review findings unless architecture or scope changed.
9. Run the final `npm run check` once against the final tree, inspect the complete
   diff, and record the verified tree identifier.
10. Commit atomically, push only `perf/subagent-delivery-efficiency`, and create
    one pull request against `main` with a Conventional Commit title.

## Completion conditions

- R-001 through R-012 are traceable to tests and final evidence.
- Production guidance remains target-repository neutral.
- No required gate is skipped for this material workflow change.
- QA and review are concurrent at the final fixed boundary unless the runtime
  lacks concurrent read-only execution, in which case the limitation is reported.
- The full root gate and formal review are not repeated without invalidation.
- The branch contains no credentials, absolute local paths, sessions, caches,
  coverage artifacts, or subagent runtime artifacts.
- One pull request is open against `main`; merge remains a human decision.
