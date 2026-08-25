---
status: accepted
---

# Shape: Complete personal profile and Go-aware delivery

## Problem and evidence

The private root aggregate is David's personal Pi profile, but it does not load
every local production resource. It omits the `pi-lsp` and `pi-simple-english`
extensions and the Go and Simple English skill directories. The root README,
architecture guide, package contract, repository guidance, and exact-profile
tests still describe and enforce a deliberately small curated profile.

Go is a frequent backend language in target repositories. The current Shape,
planning, diagnosis, TDD, implementation, architecture-improvement, and
code-review methods do not consistently load the installed `go`,
`cobra-viper`, and `go-spec-reviewer` skills. Fresh Worker and Reviewer agents
set `inheritSkills: false`, so the root profile alone does not make Go guidance
available inside those child runs.

## Proposed solution

Make the private root aggregate the complete personal profile. Load every local
production extension and skill exactly once through a package-directory path,
including `./packages/feature-flow/skills` and
`./packages/grafana-skills/skills`. Remove the now-redundant root Grafana
package dependency. Keep `pi-claude-bridge` and `pi-subagents` on their external
paths. Existing prompt entries already cover every local prompt-bearing package
and remain unchanged.

Add evidence-based Go routing to the delivery lifecycle:

- Shape and planning determine Go applicability from the accepted request,
  target files, `go.mod`, imports, or repository context. They resolve the
  installed `go` skill and resolve `cobra-viper` only for CLI scope.
- Before every Go pitch or plan approval, run one `go-spec-reviewer` pass. This
  mandatory pass consumes the existing one-review budget. If the human later
  selects **Independent review** without a document change, show the completed
  review evidence instead of running a duplicate pass. A change to the proposed
  solution, boundaries, authority, or an acceptance criterion invalidates that
  review and requires one replacement pass; wording-only edits do not.
- The caller sends an explicit `Review mode: fixed-document Go specification`
  task with the document path and resolved `go` and applicable `cobra-viper`
  skill references; the review does not depend on the supplied skill's
  illustrative `/mnt/skills/user` paths. The parent resolves blocking issues and
  material questions before showing the approval question, then records the
  review status with the revised document.
- Extend the configured Reviewer's description and charter with that explicit
  specification-review mode. It performs the pass inline because Reviewer does
  not spawn subagents. Its existing `Review mode: fixed-diff code` keeps
  following `code-review` against one fixed diff. When Reviewer is unavailable,
  the direct parent performs the same bounded pass.
- Give Worker the exact added skills `go` and `cobra-viper`. Give Reviewer the
  exact added skills `go-spec-reviewer`, `go`, and `cobra-viper`, in addition to
  its existing review skills. Add matching `skillPath` entries because both
  agents use `inheritSkills: false`.
- Route direct Go work through `developing-changes`, `diagnosing-bugs`,
  `test-driven-development`, `implement`, `improve-codebase-architecture`, and
  `code-review`. Refactoring enters through `developing-changes` and then
  `implement` or `improve-codebase-architecture` as applicable. Each named
  method loads `go` when Go evidence applies and loads `cobra-viper` only for
  command, flag, or CLI-configuration scope.
- In formal Go code review, target-repository instructions and module contracts
  remain authoritative. The `go` and applicable `cobra-viper` skills provide
  language standards; `code-review/references/go.md` supplies concrete
  correctness and lifetime questions. Do not report a skill preference without
  a practical consequence, and do not duplicate tooling-enforced findings.
- Keep each production package independently installable. Cross-skill routing
  checks whether a companion skill is installed and uses an honest
  direct-parent fallback when it is unavailable.

Deliver the aggregate and workflow changes as one delivery unit on
`feat/go-skills` in pull request #99. The integration depends on the Go package
introduced by that pull request, so a separate publication boundary has no
independent value. The pitch and plan share the implementation publication.

## Boundaries and no-gos

- Do not change the supplied content of the three Go skills.
- Do not add a second copy of any extension, skill, prompt, or agent.
- Do not add external dependencies or user-level Pi settings.
- Do not create a new agent role or change model selection.
- Do not force Go guidance onto work that has no Go evidence.
- Do not make independently installed production packages assume that another
  repository package is present.
- Do not merge, release, deploy, or remove a worktree.

## Decision-changing research and risks

- Loading all local resources changes the root aggregate from a curated profile
  to a complete personal profile. `package.json`, `scripts/lib/packages.ts`,
  `test/tooling/packages.test.ts`, `README.md`, `AGENTS.md`,
  `docs/architecture.md`, `packages/README.md`, and `knip.config.ts` must change
  together.
- `pi-lsp` adds semantic tools and its `diff` and `vscode-jsonrpc` runtime
  dependencies to the installed profile. `pi-simple-english` adds output
  guidance to every root-profile session. This is intentional for the personal
  profile, but source and installed-profile smoke tests must detect missing
  dependencies, duplicate registration, or startup failures.
- Mandatory Go pitch and plan review adds one review pass and its latency. The
  pass is bounded to one document and relevant codebase context, and it does not
  replace the human approval gate.
- Adding skills to fresh Worker and Reviewer profiles increases their available
  guidance. Applicability stays evidence-based so unrelated tasks are not
  forced through Go methods.
- Replacing the installed Grafana skill path with its local package path removes
  one root dependency and changes the lockfile. The private profile resolves the
  skill directly from the copied `packages/` workspace, so the dependency is no
  longer needed. Package, install, smoke, and security checks must verify that
  root installation still works.

## Authority

The parent owns product and architecture decisions, routing, synthesis, and all
human approval gates. The selected execution mode is accept-all implementation.
It becomes implementation authority only after approval of the complete plan for
this named feature. It never authorizes merge, release, deployment, destructive
cleanup, or unrelated work.

Pitch approval authorizes a bounded pitch commit on `feat/go-skills`. Complete
plan approval may authorize implementation, required checks, one fixed review,
atomic commits, the normal push of unchanged history, and update of PR #99
within this accepted scope.

## Observable acceptance criteria

- **AC-001 — Complete personal aggregate:** The private root profile loads every
  local production extension and skill exactly once through package-directory
  paths. The exact profile includes `./packages/lsp/src/index.ts`,
  `./packages/go/skills`, `./packages/simple-english/skills`,
  `./packages/feature-flow/skills`, and `./packages/grafana-skills/skills`, while
  retaining required external resources without duplicate registration.
  Existing complete prompt coverage remains unchanged.
- **AC-002 — Accurate profile contract:** Root documentation, repository
  guidance, and exact-profile validation describe and enforce the complete
  personal aggregate rather than a curated subset.
- **AC-003 — Go pitch review:** Every Go-targeted Shape pitch resolves applicable
  Go guidance and receives one `go-spec-reviewer` pass before approval. The pass
  consumes the existing independent-review budget, and blocking issues are
  resolved before the approval question.
- **AC-004 — Go plan review:** Every Go-targeted delivery plan resolves applicable
  Go guidance and receives the same bounded, invalidation-aware review treatment
  before approval.
- **AC-005 — Go work routing:** `developing-changes`, `diagnosing-bugs`,
  `test-driven-development`, `implement`, `improve-codebase-architecture`, and
  formal `code-review` load `go`, plus `cobra-viper` when CLI evidence applies;
  refactoring uses the applicable named route.
- **AC-006 — Fresh child coverage:** Worker loads `go` and `cobra-viper`;
  Reviewer loads `go-spec-reviewer`, `go`, and `cobra-viper` in addition to its
  current review methods despite `inheritSkills: false`.
- **AC-007 — Dual Reviewer modes:** Reviewer keeps fixed-diff code review and
  adds fixed-document Go specification review without mixing their contracts.
- **AC-008 — Independent package fallback:** Feature-flow and Engineering remain
  independently installable and state availability checks and direct-parent
  fallback for companion Go skills.
- **AC-009 — Verification:** Focused resource, agent, and workflow tests, root
  profile validation, source and installed-profile smoke tests,
  `npm run security:check`, and `npm run check` pass against the final frozen
  diff; `npm run check` includes the repository Go toolchain gate.
