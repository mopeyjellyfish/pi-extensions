---
status: accepted
---

# Plan: Clear, effective workflow and skill instructions

Deliver the [accepted revised pitch](pitch.md) as one model-neutral instruction
change. The guide is a research source, not a model requirement. Whole-plan
approval authorizes this replacement for the earlier model-specific evaluation plan.

## Review evidence

- **Applicability:** Guidance-only Go specification review applies to potential
  first-party instruction changes around Go skills. No Go source, technical
  standard, code example, CLI contract, or routing behavior changes are planned.
- **Fixed document:** SHA256
  `c0c712ed9459a84912c7128bece3d3116252a4e97fb822b0aee7e39c87e60c28`.
- **Status:** Review found one issue: an ambiguous reference to protected Go
  text. The parent corrected the source distinction and clarified routing-wording
  eligibility. No open blocking issue remains.
- **Invalidation:** A solution, scope, authority, or acceptance-criterion change
  requires replacement review. These wording-only corrections preserve the
  reviewed scope. A changed activation trigger would invalidate the review.

## Execution mode

**Accept-all implementation**, confirmed by explicit whole-plan approval.
Run the named slices serially through focused verification, selected review,
required checks, commits, and one final standalone pull request.

Pause for failures, material review findings, material forecast variance, or
changes to accepted scope, dependencies, or authority. No approval permits merge,
release, deployment, destructive cleanup, unrelated remote changes, or changes
to model settings. There is no automatic model-run benchmark or provider campaign.

## Delivery topology

| Delivery unit | Topology   | Stack position | Branch               | Pull request base | Dependencies                             | Checks                                                                              | Ownership                                              | Integration point          | CI fan-out       | Cascade cost                 |
| ------------- | ---------- | -------------- | -------------------- | ----------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------- | ---------------- | ---------------------------- |
| 1             | standalone | standalone     | existing task branch | `main`            | revised pitch and complete-plan approval | affected resource tests, source smoke, root check, workflow checks, selected review | one serial writer in the existing linked task worktree | final verified task branch | one pull request | none unless the base changes |

The existing task branch is `docs/astra-workflow-prompting`. Its historical name
is not a production model requirement. Do not rename it without authority.
Production resources start from `1f7c5b548ecec1bff461c0250a641b1468be7558`.
The earlier pitch commit remains history and is superseded by the revised intent.

Planning documents share implementation publication. Use coherent package-scoped
atomic commits within this unit. Use installed `commit` and `open-pr` methods.
There is no stack or additional pull request for an audit document.

## Critical path, dependencies, and lanes

Run 001, 002, then 003. The parent selects changes and owns synthesis, approval,
final diff inspection, and verification. The configured implementation-writer
capability owns non-trivial writes, with one writer per task worktree. Support
may inventory named evidence gaps but does not select product or policy changes.

The critical path is a focused audit, instruction changes, then verification.
The expensive gate is the root check. Do not build fixtures, an app, or a model
benchmark to support this work. QA is selected only for behavioral uncertainty or
browser evidence. Formal review checks the material shared-instruction diff.
When both are selected, run them concurrently on one frozen diff and join results.

Reuse the existing setup after verifying selectors, lockfile, and inherited tools:
Node `v24.18.0`, Go `go1.26.5`, and completed `npm ci --ignore-scripts`. Select both
runtimes in each shell that needs them. Do not confuse a setup failure with
behavioral evidence. Setup reported existing npm audit vulnerabilities. Do not
repair dependencies in this unit.

The active session's discovered agent profile differs from the current checkout.
Verify intended resource and agent loading from a fresh task-worktree Pi process
before using the changed profile. Do not silently compensate with model overrides.
If the intended writer is unavailable, use only the workflow's documented,
reported direct-parent fallback. Live reload acceptance must still use the
intended task-worktree sources.

### Evidence invalidation

- Instruction or prompt changes invalidate affected resource tests and decision
  checks, including consumers that load the changed guidance.
- A moved rule requires checking every affected entry point, fresh child, and
  independently installed package.
- Setup evidence is invalid after runtime-selector or lockfile changes.
- Final edits invalidate affected focused evidence and final required checks.
  Do not rerun unrelated investigation or a full review without a changed reason.

## [ ] 001 — Concrete instruction gaps and preserved contracts

### Outcome and requirement trace

Identify justified improvements for AC-001 and AC-003 without starting a broad
rewrite or performance study.

### Seam and files

Start with Feature Flow, Engineering, Productivity, frontend coordination,
and the agent handoff bodies. Inspect relevant first-party `prompts/`, `skills/`,
local references, and templates across other packages when they participate in
the affected flow. Go and TypeScript instructions are eligible, but technical
standards and protected upstream text remain unchanged.

Record a compact table in this plan under `Implementation evidence`. Each row
names the exact file and passage, problem, guide principle, proposed correction,
rule owner, affected consumers, and focused proof. Do not create another report
or general instruction framework.

### Dependencies

Revised pitch and complete-plan approval. Read the owning package README,
manifest, source guidance, and tests before selecting a change.

### Execution lane and ownership

Serial. The parent owns the audit and exact path selection. A read-only
inventory capability may resolve one bounded factual gap if it saves context.

### Red proof

Use concrete source evidence: contradictory instructions, a missing next action,
unclear completion, an unconditional rule with a conditional use, repeated rules
with unclear ownership, or lost intent at a handoff. Length alone is not a defect.
Record `already satisfied` when the existing text implements the recommendation.

### Green proof and checks

For each selected correction, identify the existing authority and technical
contracts that must survive. Inspect entry prompts and fresh-child loading,
not only the skill body. Select the smallest check that detects the original
problem. Resolve material ambiguity with the user rather than guessing.

### Atomic commit and pull request

Audit evidence stays with its related instruction changes in delivery unit 1.
It does not create a separate publication boundary.

### Done when

Every selected edit has an exact owning path, concrete before-state evidence,
preserved constraints, affected consumers, and a focused proof. Unchanged or
already-effective skills remain untouched.

## [ ] 002 — Clear instructions at the owning boundary

### Outcome and requirement trace

Implement AC-001 through AC-003. Improve correct next actions and complete
handoffs without changing technical advice or approval policy.

### Seam and files

Only the first-party instruction paths selected in 001, their package READMEs,
and directly related resource tests. New package-local references are permitted
only when they remove unnecessary reading without hiding required instructions.
Agent instruction bodies may change for an identified handoff problem. Agent
frontmatter, production runtime code, dependencies, and global configuration may not.

Preserve verbatim upstream debugging content and its HITL template, plus the
vendored frontend and Grafana resources identified by their package notices.
First-party Go skill instructions remain eligible for clarification with their
technical standards unchanged. Where text is protected, improve an existing
first-party integration passage instead.
Do not add another mandatory companion package or universal prompt layer.

### Dependencies

Slice 001. Stop for a new decision if a correction requires different technical
standards, authority, routing behavior, or runtime support.
Routing wording may change, but routing decisions and activation triggers may not.

### Execution lane and ownership

One configured implementation writer, serially, in the existing task worktree.
The parent supplies the accepted documents, exact paths, complete later decisions,
focused checks, and preserved contracts. Do not copy the conversation transcript.

### Red proof

Add a focused resource assertion first when a public instruction contract changes.
For unchanged-contract wording or organization, use source before-state evidence
and existing tests. Do not manufacture behavioral tests for prose alone.

### Green proof and checks

Apply only the corrections selected by the audit:

- Lead with the outcome and current action, not a tour of the process.
- Identify relevant context and trusted evidence without loading every reference.
- Preserve settled intent and ask only for material missing decisions.
- Distinguish permitted routine work from actions requiring approval.
- State tool prerequisites, failure behavior, and evidence where ambiguous.
- Delegate only useful independent work, preserving ownership and full intent.
- Make verification and stop conditions proportionate and explicit.
- Return concrete results, proof, unresolved limitations, and the next owner.

Keep slash prompts thin. Avoid duplicated instructions across the entry prompt,
skill, template, and agent body. Retain local rules when independent installation
or fresh context requires them. Do not force a common document template.
Per-skill Go routing is intentional duplication for standalone use. Preserve
each skill's local activation and fallback contract rather than consolidating
it into a shared reference that may be unavailable.

Run affected package tests after each coherent change. Preserve prompt argument
expansion, skill discovery, required instructions, and packaged references.
A changed regex must still test the protected contract, not merely new wording.

### Atomic commit and pull request

Use package-scoped Conventional Commits containing each coherent instruction
change, its tests, and necessary README updates. Root-only agent changes use a
separate coherent commit if needed. All remain in delivery unit 1.

### Done when

The selected ambiguities are resolved, focused checks pass, and the diff shows
no changed engineering standard, code example, approval policy, model setting,
permission, or production runtime behavior.

## [ ] 003 — Verify realistic paths and deliver the fixed unit

### Outcome and requirement trace

Verify AC-002 through AC-005 and report only what the evidence supports.

### Seam and files

The final instruction diff, affected tests, package loading, and the
`Implementation evidence` section below. No benchmark infrastructure is added.

### Dependencies

Slices 001 and 002, with a stable diff before final assurance.

### Execution lane and ownership

The parent runs deterministic checks and inspects the final diff. A fresh
read-only reviewer checks rule preservation and handoff correctness. Select QA
only when actual behavior or browser evidence remains uncertain. If both run,
they use one fixed tree and return one joined repair packet.

### Red proof

The exact source problems from 001. Do not substitute a model's self-rating or
passing word-presence checks for evidence of instruction effectiveness.

### Green proof and checks

Walk the affected paths using repository evidence and existing tests. Cover
these conditions only where the changed guidance participates:

- Shape with sufficient facts and a settled user decision.
- Planning from complete accepted intent without reopening settled scope.
- A fresh implementation handoff with a later user constraint.
- A failed focused check requiring diagnosis before another attempt.
- Fixed-diff review that separates concrete defects from preferences.
- Accepted frontend evidence that survives implementation and visual verification.
- Applicable Go or TypeScript guidance, unrelated toolchain evidence, an
  unavailable optional companion, and the unchanged narrower Cobra/Viper
  trigger for commands, flags, or CLI configuration.
- Local-only or no-commit instructions and untrusted external content.

Record which checks are static contract checks and which observe live behavior.
Use a targeted live run only when needed to resolve a named uncertainty, with
the user's selected model and current authority limits. Do not start a comparison
suite or claim a model-quality improvement from static checks. If necessary
behavior cannot be checked, report unmet proof rather than fabricate a result.

Run affected resource tests, then the required checks against the final tree:

```sh
npm test -- --run <affected resource test paths>
npm run smoke:source
npm run check
npm run workflows:check
```

Use the project formatter on changed files. Do not run a composite check beside
its own commands. Preserve dependency and installation boundaries. Do not add
security-driven dependency changes as an incidental repair.

Complete manual reload acceptance from the task worktree with the pinned Pi:

```sh
npm exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e .
```

Confirm intended resources and agent profiles, run focused tests, enter `/reload`
while idle, and exercise a changed entry point within a local-only boundary.
Record actual source loading without duplicate registration. Source smoke does
not replace this proof. Close any browser used for targeted verification.

Give the formal reviewer the accepted intent, fixed base and tree, changed paths,
source-to-rule evidence, and focused results. Preserve the mandatory Go
specification-review contract and applicable TypeScript review methods. Review
only practical consequences, not preferred prose style or duplicate tool findings.

Material findings pause accept-all execution. After authorized repair, use the
retained writer and rerun invalidated evidence. Inspect the final diff for scope,
package independence, unchanged technical standards, model-neutral production
text, release boundaries, and artifact hygiene. Record an exact verified tree
and use the installed commit and pull-request methods.

### Atomic commit and pull request

Publish the verified unit as one standalone pull request from the existing task
branch to `main`. Planning documents and concise implementation evidence travel
with the codebase changes. No merge or cleanup is authorized.

### Done when

The selected instruction problems are resolved, applicable checks and live
loading acceptance pass, material findings are resolved, and the verified unit
is published. Report blocked or incomplete evidence honestly instead of marking
it complete.

## Implementation evidence

No implementation has started. Slice 001 will record only decision-changing
source evidence here. This plan does not claim a measured model improvement.
