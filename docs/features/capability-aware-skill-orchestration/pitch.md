---
status: accepted
---

# Shape: Capability-aware skill orchestration

## Problem and evidence

The private profile now supplies fixed Worker, Researcher, QA, Reviewer, Git,
and Utility roles. The installable workflow skills do not use those roles with
one consistent lifecycle contract.

`implement` already routes normal non-trivial writes to one Worker. It also
separates deterministic gates, QA, and formal review, and it can run QA and
Reviewer concurrently on one frozen diff. However, the surrounding entry skills
split related rules across different files:

- Shape and planning allow bounded support but do not state the same role
  boundaries or evidence-driven parallel rule.
- Direct debugging can continue from diagnosis into a fix without an explicit
  handoff to the normal implementation writer.
- Research and Utility support have no shared portable selection rule.
- Git and GitHub methods correctly own authorized delivery mechanics, but the
  lifecycle contract does not state clearly that they are not implementation
  substitutes.
- Worker repair and no-replacement behavior is concentrated in `implement`, so
  other entry paths can accidentally start a second writer instead of returning
  one joined repair packet.

The result is underuse in some paths and unnecessary fanout in others. The user
wants the harness to shorten the critical path and protect quality without
adding agents only because work is large.

## Proposed solution

Add one lifecycle-wide, capability-based orchestration contract to the existing
coordinating skills. Do not add another orchestration skill or production
package.

The contract has four vertical behaviors:

1. **Mutation ownership:** Route normal non-trivial repository writes through
   `implement` and one Worker capability. Keep `/just-do-it`, one obvious trivial
   correction, and an unavailable-Worker fallback as direct-parent exceptions.
   A diagnosis method returns its confirmed outcome, regression seam, and
   evidence to `implement` before a non-trivial fix.
2. **Bounded support:** Use a read-only factual research capability for a named
   repository or primary-source evidence gap. Use bounded mechanical support
   only when no specialist role owns the task. Support returns evidence only.
   The parent retains routing, product and architecture judgment, synthesis,
   approval, final diff inspection, and verification.
3. **Evidence-driven concurrency:** Start independent read-only support lanes
   concurrently only when each lane has a named evidence gap and parallel work
   shortens the critical path or protects parent context. Join all results before
   a decision. Start parallel writers only for accepted `parallel-ready`
   delivery units with separate worktrees, sole ownership, non-overlapping files,
   complete dependencies, and named integration points. Ordinary child roles do
   not orchestrate more children.
4. **Assurance and delivery:** Keep deterministic green commands with the parent
   or deterministic runner. Use QA for failed-command diagnosis, browser proof,
   or ambiguous acceptance. Use Reviewer for risk-selected intent and Standards
   review. When both are selected, run them concurrently on the same frozen
   boundary and join one repair packet for the retained Worker. Use the installed
   commit, rebase/conflict, and pull-request methods for authorized Git work
   instead of treating Git as an implementation role.

Engineering owns implementation, assurance, repair, and publication
orchestration. Feature Flow owns evidence collection and plan lane definitions.
Mutation-capable direct-entry skills defer to those owners. Frontend, Git, and
GitHub skills keep their specialist methods and change only if a concrete
conflict remains. The private root profile can map these portable capabilities
to its six exact roles, but installable packages use capability terms and honest
direct-parent fallbacks.

The pitch, plan, skill guidance, documentation, and contract tests form one
coherent delivery unit. The planning documents have no independent merge value.

## Boundaries and no-gos

- Do not add a seventh agent, an orchestration extension, a chain, or a shared
  runtime dependency.
- Do not put private model names, private agent names, private repository paths,
  or `AskClaude` assumptions in independently installable skill guidance.
- Do not make every task use a Worker. `/just-do-it`, an obvious trivial change,
  and unavailable capability fallbacks remain direct-parent routes.
- Do not use QA for a known deterministic command that passed. Do not ask
  Reviewer to rerun QA commands.
- Do not start speculative research, Utility work, or parallel lanes without a
  named evidence, context, or critical-path benefit.
- Do not let ordinary child roles fan out or make product, architecture,
  approval, or publication decisions.
- Do not duplicate full orchestration rules in specialist frontend, Git, or
  GitHub skills when they already defer to Engineering.
- Do not change role models, thinking levels, tools, or the six-agent catalog in
  this feature.
- Reshape if the smallest consistent contract requires a new cross-package
  runtime dependency or makes an independently installable package depend on a
  companion role.

## Decision-changing research and risks

- The existing `implement` contract is already comprehensive. The change must
  deepen entry-point consistency rather than rewrite that skill or add generic
  fanout ceremony.
- `diagnosing-bugs` contains a pinned upstream body. Any routing addition belongs
  in its Pi-specific additions and must not rewrite the pinned source.
- Feature Flow and Engineering are independently installable. Shared behavior
  must use synchronized capability terms and package-local tests, not imports or
  assumptions about the private root profile.
- Researcher inventory found no portable Researcher, Utility, or Git agent skill.
  Therefore selection guidance belongs in coordinator methods, while exact role
  mapping remains private.
- Fable planning advice was unavailable because the selected bridge model could
  not be accessed. The direct parent used repository evidence instead and does
  not claim that advice ran.
- Evidence-driven parallelism is the accepted policy. Proactive fanout was
  rejected because it raises cost and coordination without guaranteed evidence
  value.

## Review evidence

- **Applicability:** not applicable. The pitch does not change Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns product and architecture decisions, pitch and plan synthesis,
role selection, joined evidence, approval, and final verification.

The selected execution mode is **accept-all implementation**. This is a
preference until whole-plan approval confirms authority for this named plan. It
does not authorize merge, release, deployment, destructive cleanup, branch
removal, or unrelated work.

Pitch approval authorizes the bounded pitch commit and later publication with
the implementation delivery unit. It does not authorize implementation until the
complete plan is approved.

## Observable acceptance criteria

- **AC-001 — Worker-first mutation:** Every normal non-trivial implementation
  entry routes to one Worker capability through `implement`. `/just-do-it`, one
  obvious trivial correction, and unavailable-Worker fallback remain explicit
  direct-parent exceptions.
- **AC-002 — Diagnosis handoff:** A non-trivial confirmed bug fix leaves
  diagnosis with a reproducible symptom, cause, regression seam, and evidence,
  then enters `implement` instead of starting an uncoordinated writer.
- **AC-003 — Bounded role selection:** Coordinator guidance distinguishes
  factual research, bounded mechanical support, QA, Reviewer, and authorized Git
  delivery by observable purpose and states that support is evidence only.
- **AC-004 — Evidence-driven read parallelism:** Independent read-only lanes run
  concurrently only for named disjoint evidence gaps with a stated critical-path
  or parent-context benefit, and the parent joins them before decisions.
- **AC-005 — Safe writer parallelism:** Parallel Workers start only for accepted
  ready units with separate isolated worktrees, sole writers, non-overlapping
  ownership, complete dependencies, and named integration points. Otherwise,
  implementation serializes.
- **AC-006 — Distinct assurance:** Deterministic green commands do not select QA.
  QA owns failed-command diagnosis, browser proof, or ambiguous acceptance.
  Reviewer owns risk-selected intent and Standards review without rerunning QA.
- **AC-007 — Concurrent frozen assurance:** When QA and Reviewer are both
  selected, the host runs them concurrently on one frozen boundary, joins one
  prioritized packet, and returns repair to the retained Worker without a
  replacement writer.
- **AC-008 — Child and parent authority:** Ordinary child roles cannot fan out or
  own routing, product, architecture, approval, synthesis, final verification,
  or publication decisions.
- **AC-009 — Delivery role boundary:** Authorized Git work uses installed commit,
  conflict/rebase, and pull-request methods. Git capability does not replace the
  implementation Worker.
- **AC-010 — Package independence:** Production skill resources use portable
  capability language and direct-parent fallbacks. They contain no private model
  names, private role assumptions, or new cross-package runtime dependency.
- **AC-011 — Contract proof:** Focused resource tests fail for the previous
  inconsistent entry behavior and pass only when Engineering, Feature Flow, root
  profile documentation, and applicable direct-entry guidance state the same
  lifecycle contract.
