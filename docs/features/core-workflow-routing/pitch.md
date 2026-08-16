---
status: accepted
---

# Shape: Right-sized engineering delivery

## Executive summary

Route each coding request to the lightest safe workflow, add a `/just-do-it` path for small mechanical changes, shorten pitch and plan authoring, and make accepted stages publish through dedicated Git skills. Large work is planned once, split into reviewable pull requests with the `gh stack` CLI, and parallelized only where boundaries are independent.

## Problem

The current default route overuses Shape and planning for bounded work, while the implementation path does not own commit or pull-request delivery. Pitch and plan documents are more verbose than agents need, planning starts only the first slice, and parallel eligibility is recorded without designing the pull-request stack or execution lanes upfront. Git behavior is also split between a broad Conventional Commit skill and generic GitHub CLI guidance; there are no focused `commit`, `open-pr`, or `triage` lifecycle skills.

## Appetite

This is a cross-package workflow change with a high quality floor: safe worktrees, explicit human decisions, package independence, focused tests, required checks, and bounded remote mutations must remain intact. Prefer Markdown skills, prompts, and contract tests over a new runtime extension. Stop and reshape if automatic publication cannot preserve explicit authority or if a production skill would depend on this repository's private agents.

## Research and prior art

Repository mapping found four existing owners:

- `packages/engineering` routes and implements work.
- `packages/feature-flow` owns accepted pitches and complete plans.
- `packages/git-conventions` owns atomic commits and stacked branch rules.
- `packages/github` owns authenticated pull-request and review-thread mutations.

The root profile supplies optional Luna Researcher/Utility/QA, Terra Worker/Git, and Opus Reviewer roles, but independently installed packages must retain direct-parent fallbacks. Existing stage approvals and Git mutation gates provide a safe basis for bundling publication authority into explicit workflow actions instead of silently inferring it. The current development environment has `gh stack` 0.1.0; it is not part of GitHub CLI itself, so stacked delivery needs an explicit tooling preflight and installation requirement.

## Solution

### Right-sized routing

Make `developing-changes` classify work by intent uncertainty, impact, reversibility, risk, affected boundaries, and coordination cost:

1. **Just do it:** explicit, mechanical, low-risk, broadly repetitive work with an objective check. Invoke the new prompt/skill to launch one fresh Worker immediately.
2. **Implement now:** bounded behavior, bug, refactor, documentation, or metadata work with clear intent and one coherent outcome.
3. **Plan first:** clear accepted intent that spans multiple outcomes, packages, commits, or pull requests.
4. **Shape then plan:** unresolved product intent, major or hard-to-reverse behavior, security/privacy/migration risk, or material solution tradeoffs.

Size by impact and uncertainty, not file count alone. Ambiguous boundary cases ask one focused routing question.

### Fast mechanical path

Add an Engineering `/just-do-it` prompt and `just-do-it` skill. It validates that the request is bounded and mechanical, establishes an isolated task worktree, and immediately delegates the exact change and objective validation to one fresh Worker. If discovery reveals behavioral ambiguity or material risk, it stops and returns to the router instead of expanding scope. The parent verifies the diff and evidence.

### Lean Shape and complete planning

Replace the pitch template with a compact contract containing problem and evidence, proposed solution, boundaries/no-gos, decision-relevant research, risks, and observable acceptance criteria. Shape uses cheap bounded factual support where it saves parent context; the parent retains product and architecture decisions.

Planning writes the complete implementation and delivery plan before any production work starts. Each slice includes its observable outcome, seam/files, dependencies, test signal, checks, commit unit, pull-request base, and execution lane. The plan identifies a serial critical path and genuinely independent parallel lanes, including separate worktrees and sole writers. It may use bounded Researcher/Utility support for factual mapping and an Opus Reviewer for an optional independent plan review; no child owns product, architecture, or approval decisions.

### Focused Git delivery skills

Provide and integrate three focused skills:

- **`commit`:** the existing atomic Conventional Commit method under the requested skill name. Every workflow commit must use it.
- **`open-pr`:** inspect accepted intent, commits, diff, checks, and evidence; push the explicit branch; then create or update a standalone pull request or use the required `gh stack` CLI for a stack. Produce an approachable Simplified Technical English body using the repository template, with problem, outcome, important implementation details, tests, risks, and stack position. A stacked path must preflight `gh stack --version`, use `gh stack link` or `gh stack submit`, and verify the resulting stack and pull-request metadata.
- **`triage`:** resolve an explicit pull request or one opened in the conversation; collect conversation comments, reviews, checks, and unresolved threads; classify each item; apply valid fixes through the implementation and commit skills; respond accurately; and resolve only addressed threads.

Direct lifecycle prompts and skills do not issue ad hoc commit, push, or pull-request commands. Lower-level Git commands remain inside the focused Git skills where they are validated.

### Stage publication

Change approval actions so authority is explicit and delivery is automatic after acceptance:

- accepted pitch: commit with `commit`, push/open its pull request with `open-pr`, then plan;
- accepted complete plan: commit and publish it, creating or updating the planned stack through `gh stack`, then implement;
- accepted verified work: commit and publish each approved unit in dependency order, using `gh stack` whenever the plan defines a stack;
- `/just-do-it`: invocation authorizes one bounded implementation unit and its branch push/pull request after verification.

Approval authorizes only the named task-stack branches and pull-request mutations for that stage. It includes `gh stack` cascade rebases and atomic `--force-with-lease` updates after expected remote state is verified. It never authorizes plain `--force`, merge, deployment, release, destructive cleanup, or unrelated remote changes. Failures stop with durable local evidence and a clear recovery action.

## Fixed decisions

- Keep production packages independently installable with direct-parent fallbacks.
- Keep the parent responsible for routing, product and architecture judgment, synthesis, verification, and approvals.
- Use one writer per worktree; parallel writers require separate isolated worktrees and non-overlapping ownership.
- Plan the full accepted scope and pull-request topology before implementation; do not alternate planning and implementation slice by slice.
- Use role capabilities in production guidance; the root profile may map those roles to Luna, Terra, and Opus. Sol child use remains an explicit exceptional approval.
- An explicit stage approval or `/just-do-it` invocation includes bounded commit, push, and pull-request authority as described above.
- Stacked pull-request delivery requires the `github/gh-stack` CLI extension. Skills preflight it and stop with installation guidance when unavailable; they do not install external tooling without explicit authority.
- Approved stack maintenance may use `gh stack sync` and atomic `--force-with-lease` only for named non-default task branches after verifying expected remote state. Plain `--force` remains prohibited.

## Rabbit holes

- Do not build a workflow runtime or general task scheduler for Markdown guidance.
- Do not maximize subagent count; delegate bounded factual, mechanical, QA, Git, and review work only when it saves parent context or elapsed time.
- Do not split work into stacked pull requests when one atomic pull request is clearer.
- Do not preserve old verbosity merely to keep template headings stable; preserve behavioral safety contracts instead.

## No-gos

- No automatic merge, release, deployment, branch deletion, plain/unleased force-push, or hook bypass.
- No production dependency on private root agents, model names, or repository paths.
- No fallback from a planned stack to ad hoc `gh pr create`; a missing `gh stack` tool stops stacked delivery with exact recovery guidance.
- No parallel writers in one worktree or overlapping file ownership.
- No hidden product or architecture decisions by subagents.
- No manual `git commit`, `git push`, or `gh pr create` instructions in lifecycle skills outside the focused Git skills.

## Acceptance criteria

- **AC-001 — Right-sized route:** Engineering guidance deterministically selects just-do-it, direct implementation, plan-first, or Shape-plus-plan from change impact and uncertainty, with focused clarification for ambiguous cases.
- **AC-002 — Immediate mechanical work:** `/just-do-it <request>` loads and immediately hands one bounded mechanical change to a fresh Worker, or safely reroutes when the request is not mechanical.
- **AC-003 — Lean pitch:** Shape creates a materially shorter pitch that retains decision-relevant research, problem, solution, boundaries/no-gos, risks, authority, and observable acceptance criteria.
- **AC-004 — Complete upfront plan:** Planning covers the full accepted scope, test signals, dependencies, commit units, pull-request topology, and safe parallel lanes before implementation begins.
- **AC-005 — Efficient delegation:** Shape, planning, implementation, QA, Git, and review guidance uses the cheapest suitable configured role when available and preserves direct-parent fallback and explicit Sol approval.
- **AC-006 — Atomic commit skill:** A discoverable `commit` skill owns every workflow commit and retains Conventional Commit, staging, validation, and atomicity safeguards.
- **AC-007 — Approachable pull requests:** A discoverable `open-pr` skill pushes and opens or updates standalone pull requests and uses `gh stack` for stacked pull requests from accepted context and evidence, using Simplified Technical English and verified metadata.
- **AC-008 — Review triage:** A discoverable `triage` skill can select the current/conversation pull request, classify all bounded feedback surfaces, fix valid findings, respond, verify, and resolve only completed threads.
- **AC-009 — Automatic bounded publication:** Explicit stage acceptance triggers commit, push, and pull-request delivery without a second authorization prompt, while merge and other destructive or release actions remain prohibited.
- **AC-010 — Package and profile integration:** Package manifests, root resources, READMEs, prompts, tests, smoke loading, external-tool requirements, and release boundaries expose the new workflow without duplicate registration or repository-specific production assumptions.
- **AC-011 — Stack tooling:** Planned stacks preflight and use `gh stack` for linking, submission, leased cascade synchronization, ancestry, and stack verification; missing tooling fails closed with installation guidance.
