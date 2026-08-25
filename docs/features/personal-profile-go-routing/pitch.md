---
status: accepted
---

# Shape: Complete personal profile and Go-aware delivery

## Problem and evidence

At task start, the private root aggregate omitted the `pi-simple-english`
extension and the Go and Simple English skill directories, while root guidance
and exact-profile tests still enforced a deliberately small curated profile.
In-flight slice 001 work now adds those resources and passes focused profile
tests, but it is uncommitted. Its required `npm run smoke:source` exited with
code 1 because `pi-lsp` and Hashline both register `write` and `edit`; Pi reported
both names as tool conflicts. `pi-lsp` is therefore an explicit compatibility
exception rather than part of the complete root aggregate.

Go is a frequent backend language in target repositories. The current Shape,
planning, diagnosis, TDD, implementation, architecture-improvement, and
code-review methods do not consistently load the installed `go`,
`cobra-viper`, and `go-spec-reviewer` skills. Fresh Worker and Reviewer agents
set `inheritSkills: false`, so the root profile alone does not make Go guidance
available inside those child runs.

## Proposed solution

Make the private root aggregate the complete compatible personal profile. Load
every non-conflicting local production extension and every local skill exactly
once through a package-directory path, including
`./packages/feature-flow/skills` and `./packages/grafana-skills/skills`. Keep
`pi-lsp` independently installable but out of the root aggregate because Pi
rejects its duplicate `write` and `edit` registrations with Hashline. Root
validation keeps one named, reasoned LSP exclusion while requiring every newly
added compatible local extension and every skill. The exclusion must still
match a discovered production resource, its reason appears in validation
evidence, and exact-profile validation rejects re-adding it. Re-evaluate the
exclusion if either package stops registering those names or Pi adds tool
namespacing.
Remove the now-redundant root Grafana package dependency. Keep
`pi-claude-bridge` and `pi-subagents` on their external paths. Existing prompt
entries already cover every local prompt-bearing package and remain unchanged.

Add evidence-based Go routing to the delivery lifecycle:

- Shape and planning treat work as Go-targeted when its proposed outcome changes
  Go source, a Go module, a Go CLI, or Go-specific guidance and routing applied
  to future Go work. An unrelated `go.mod` or toolchain gate alone does not
  activate the review. They resolve the installed `go` skill and resolve
  `cobra-viper` only for CLI scope.
- Before every Go pitch or plan approval, run one `go-spec-reviewer` pass. This
  mandatory pass intentionally consumes the existing one-independent-review
  budget; the parent still evaluates architecture, security, and other standards
  inline. If the human later selects **Independent review** without a document
  change, show the completed review evidence instead of running a duplicate
  pass. A change to the proposed solution, boundaries, authority, or an
  acceptance criterion invalidates that review and requires one replacement
  pass; wording-only edits do not. The parent owns that classification and
  records applicability, fixed document, status, and invalidation reason in the
  templates' unconditional `Review evidence` section. Non-Go documents record
  `not applicable` instead of omitting the section.
- The caller sends an explicit `Review mode: fixed-document Go specification`
  task with the document path and resolved `go` and applicable `cobra-viper`
  skill references. Those caller-supplied references supersede the supplied
  skill's illustrative `/mnt/skills/user` paths. When a Go-targeted document
  changes guidance or routing but no Go program code, the review is bounded to
  that Go contract's accuracy, consistency, applicability, and implementation
  readiness; non-applicable package, context, concurrency, and CLI checks are
  skipped. The parent resolves blocking issues and material questions before
  showing the approval question, then records the review status with the revised
  document.
- Extend the configured Reviewer's description and charter with two new explicit
  task modes. `Review mode: fixed-document Go specification` performs the spec
  pass inline because Reviewer does not spawn subagents.
  `Review mode: fixed-diff code` follows `code-review` against one fixed diff;
  `implement` and `just-do-it` add that token to their formal review handoffs.
  An omitted token defaults to fixed-diff code for backward compatibility. When
  Reviewer is unavailable, the direct parent performs the same bounded pass.
- Give Worker the exact added skills `go` and `cobra-viper`. Give Reviewer the
  exact added skills `go-spec-reviewer`, `go`, and `cobra-viper`, in addition to
  its existing review skills. Add matching `skillPath` entries because both
  agents use `inheritSkills: false`.
- Route direct Go work through `developing-changes`, `just-do-it`,
  `diagnosing-bugs`, `test-driven-development`, `implement`,
  `codebase-design`, `domain-modeling`, `improve-codebase-architecture`, and
  `code-review`. Refactoring enters through `developing-changes` and then
  `implement` or `improve-codebase-architecture` as applicable. Each named
  method loads `go` when Go evidence applies and loads `cobra-viper` only for
  command, flag, or CLI-configuration scope.
- In formal Go code review, target-repository instructions and module contracts
  remain authoritative. The `go` and applicable `cobra-viper` skills provide
  language standards; `code-review/references/go.md` supplies concrete
  correctness and lifetime questions. Do not report a skill preference without
  a practical consequence, and do not duplicate tooling-enforced findings.
- Fixed-document Go review uses the same precedence: explicit target-repository
  standards and accepted local conventions win, then the installed Go skills.
  The reviewer may question a legacy convention but blocks only a concrete
  implementation problem or contradiction in the document.
- Keep each production package independently installable. Cross-skill routing
  attempts installed skill resolution by name through the host. If a companion
  skill is unavailable, the direct parent records the unmet method and completes
  a bounded review against target-repository Go standards before approval. It
  does not block solely on the missing skill or pretend that the skill loaded.

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
- Do not add an LSP/Hashline compatibility layer in this delivery; `pi-lsp`
  remains an explicitly documented optional package.
- Do not merge, release, deploy, or remove a worktree.

## Decision-changing research and risks

- Loading all compatible local resources changes the root aggregate from a
  curated profile to a complete personal profile with one explicit LSP
  exception. `package.json`, `scripts/lib/packages.ts`,
  `test/tooling/packages.test.ts`, `README.md`, `AGENTS.md`,
  `docs/architecture.md`, `packages/README.md`, and `knip.config.ts` must change
  together.
- The rejected all-extension profile is preserved as evidence: source smoke
  failed because `pi-lsp` and Hashline both register `write` and `edit`. Keeping
  LSP optional preserves Hashline as the root mutation surface without changing
  either independent package. `pi-simple-english` still adds output guidance to
  every root-profile session, so smoke tests must detect duplicate registration
  or startup failures.
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

## Review evidence

- **Applicability:** Go-targeted because this pitch changes Go-specific guidance
  and routing applied to future Go work.
- **Fixed document:** This pitch after the accepted LSP compatibility decision.
- **Status:** Approved after the LSP compatibility revision.
- **Invalidation:** The LSP exclusion changed the proposed solution and
  invalidated the original review; wording-only evidence corrections did not.

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

- **AC-001 — Complete compatible personal aggregate:** The private root profile
  loads every compatible local production extension and every local skill
  exactly once through package-directory paths. The exact profile includes
  `./packages/go/skills`, `./packages/simple-english/src/index.ts`,
  `./packages/simple-english/skills`, `./packages/feature-flow/skills`, and
  `./packages/grafana-skills/skills`; it explicitly excludes
  `./packages/lsp/src/index.ts` because of the verified Hashline tool conflict.
  Required external resources remain unique, and existing complete prompt
  coverage remains unchanged.
- **AC-002 — Accurate profile contract:** Root documentation, repository
  guidance, and exact-profile validation describe and enforce the complete
  compatible personal aggregate with one named, reasoned LSP exclusion; every
  new compatible extension and every new skill remains mandatory.
- **AC-003 — Go pitch review:** Every Go-targeted Shape pitch resolves applicable
  Go guidance and receives one `go-spec-reviewer` pass before approval when that
  skill is installed. If it is unavailable, the parent records the unmet method
  and completes the bounded target-repository Go review before approval. The
  pass consumes the existing independent-review budget, blocking issues are
  resolved before the approval question, and the unconditional template section
  records review evidence or `not applicable`.
- **AC-004 — Go plan review:** Every Go-targeted delivery plan resolves applicable
  Go guidance and receives the same bounded, invalidation-aware review treatment
  before approval. Guidance-only plans review the Go routing contract rather
  than inventing absent Go program design.
- **AC-005 — Go work routing:** `developing-changes`, `just-do-it`,
  `diagnosing-bugs`, `test-driven-development`, `implement`, `codebase-design`,
  `domain-modeling`, `improve-codebase-architecture`, and formal `code-review`
  load `go`, plus `cobra-viper` when CLI evidence applies; refactoring uses the
  applicable named route.
- **AC-006 — Fresh child coverage:** Worker loads `go` and `cobra-viper`;
  Reviewer loads `go-spec-reviewer`, `go`, and `cobra-viper` in addition to its
  current review methods despite `inheritSkills: false`.
- **AC-007 — Dual Reviewer modes:** Reviewer introduces explicit fixed-diff code
  and fixed-document Go specification modes without mixing their contracts;
  formal code-review callers send the fixed-diff token and absent tokens retain
  fixed-diff behavior.
- **AC-008 — Independent package fallback:** Feature Flow and Engineering remain
  independently installable, attempt installed skill resolution by name, and
  record an honest direct-parent fallback when a companion skill is unavailable.
- **AC-009 — Verification:** Focused resource, agent, and workflow tests,
  `npm run packages:check`, source and installed-profile smoke tests,
  `npm run security:check`, and `npm run check` pass against the final frozen
  diff; `npm run check` includes the repository Go toolchain gate.
