---
status: accepted
---

# Shape: Clear, effective workflow and skill instructions

## Problem and evidence

Improve the shared flow, prompts, and skill instructions using the supplied
prompting guide. The change is model-neutral. Frontend work is one example,
not a scope boundary. Any first-party skill is eligible for a justified
instruction improvement, including Go and TypeScript skills. Preserve the
technical standards those skills teach.

This revision follows the user's clarification. It replaces the earlier
model-targeted proposal and its mandatory comparison suite. The existing pitch
commit remains history. This revised scope needs approval before implementation.

Repository evidence at `1f7c5b548ecec1bff461c0250a641b1468be7558`:

- Slash prompts are mostly thin skill entry points. Changing only their text
  would miss the main workflow instructions.
- The implementation skill combines intake, delegation, repair, assurance,
  language routing, publication, and continuation in one long document.
- Business-fit guidance appears in both that skill and the Worker instructions.
  Removing repetition requires checking what each fresh reader actually loads.
- Existing skills already include autonomy, bounded handoffs, evidence, and
  stop rules. These need a consistency audit, not another blanket checklist.
- Resource tests verify contracts, expansion, and packaging. They do not prove
  comparative model quality.

These facts identify useful audit targets. They do not establish that prompt
length or a specific model caused the user's observed quality gap.

## Proposed solution

Use one delivery unit with three dependent slices:

1. **Audit instruction effectiveness.** Compare the guide with shared workflows
   and first-party skills. Record concrete ambiguity, conflict, repetition,
   missing action or evidence, and unnecessary context. Mark already-satisfied
   advice as such. Select changes by their effect on decisions, not uniformity.
2. **Improve the owning instructions.** Put the task outcome and next action
   first. Make inputs, authority, tool use, verification, completion, and handoff
   conditions explicit where needed. Separate required rules from conditional
   methods and examples. Keep prompts thin and references easy to find.
3. **Verify the affected flow.** Check representative decisions and handoffs,
   run affected resource tests and required repository checks, and confirm live
   loading. Use targeted behavior checks where needed, not a new benchmark suite.

Preserve the current workflow's approval and delivery policy. Complete authorized
work before asking unnecessary questions, but stop for decisions that change
scope, architecture, authority, or other protected boundaries. Treat source
material as evidence, not permission or instructions for the running agent.

A skill may be reorganized or clarified without changing its technical advice.
Do not force every skill into the same template. Retain necessary local guidance
when a separately installed package or fresh child cannot access another owner.

The pitch, plan, and implementation share one task branch and eventual standalone
pull request. Atomic commits follow coherent changes and package ownership.
Planning documents do not need independent publication.

## Boundaries and no-gos

Eligible resources are first-party prompt templates, skill instructions and local
references, workflow document templates, directly related agent instruction
bodies, package READMEs, and resource tests. Start with Feature Flow, Engineering,
Productivity, and frontend coordination, then follow relevant instruction
boundaries into other first-party skills. Change only demonstrated gaps.

Preserve technical recommendations, code examples, language applicability,
review triggers, and unavailable-capability fallbacks. Go and TypeScript skill
files are not frozen, but their engineering standards remain unchanged. Preserve
vendored or verbatim upstream resources. Use their existing first-party
integration guidance rather than rewriting protected upstream text.
Routing wording is eligible for clarification. Routing decisions and activation
triggers remain unchanged, including the narrower CLI-specific trigger.

Do not add model names or checks to production guidance. Do not add a
model-specific layer, global prompt injection, evaluation platform, synthetic
app suite, dependency, production runtime change, or new package. Preserve agent
model settings, thinking levels, permissions, preloads, and ownership.

Do not weaken worktree isolation, explicit approvals, publication opt-outs,
source-disclosure limits, cancellation, or required checks. Do not invent a new
instruction hierarchy. A necessary policy, technical-standard, runtime, or
configuration change requires a separate decision.

## Decision-changing research and risks

The [supplied prompting guide](https://promptessor.com/blog/gpt-6-astra-prompting-guide)
is research input. Its recommendations on goals, relevant context, autonomy,
tools, delegation, verification, and stopping conditions are candidate
improvements, not a required model profile or mandatory prompt format.

[OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
supports auditing accessible instructions and calibrating follow-through,
delegation, and verification to the harness. Apply compatible principles without
changing this repository's authority rules.

The main risks are deleting a necessary constraint, moving it into an unread
reference, or losing it at a fresh-child or package boundary. Verify rule
ownership and realistic request paths. Do not claim that clearer wording alone
proves higher model quality or superiority over another model.

## Review evidence

- **Applicability:** Guidance-only Go specification review applies because
  first-party instructions around Go skills may be clarified. Technical Go
  standards, code examples, CLI contracts, and routing behavior remain unchanged.
- **Fixed document:** SHA256
  `c0b92d03afa1054b6510ae2e5fe9ccda16906b80ed30106f3104f714bddf3a5d`.
- **Status:** Approved with Questions. The parent clarified that routing wording
  may change while decisions and activation triggers remain identical.
- **Invalidation:** Changes to solution, scope, authority, or acceptance criteria
  require a replacement pass. The routing clarification and review-evidence
  updates preserve the reviewed scope. A changed activation trigger would
  invalidate the review and require a separate scope decision.

## Authority

The parent owns scope, architecture, synthesis, verification, and approval.
The user's **accept-all implementation preference** remains recorded. It becomes
authority only after explicit approval of the revised complete plan.

Pitch approval permits its bounded commit on the existing task branch and
continuation to planning. Final publication follows installed delivery methods
and required gates. No approval permits merge, release, deployment, destructive
cleanup, unrelated remote changes, or changes to model settings.

## Observable acceptance criteria

- **AC-001 — Traceable improvements:** Each changed instruction has a concrete
  before-state problem, an applicable guide principle, and an intended effect.
  Already-satisfied advice does not add process.
- **AC-002 — Clear decisions:** A fresh reader can identify the current goal,
  necessary context, permitted next action, required proof, and stopping point.
  Settled user intent survives planning and handoffs.
- **AC-003 — Preserved substance:** Technical standards, examples, authority,
  language applicability, model configuration, and package independence remain
  intact. No model-specific production guidance is introduced.
- **AC-004 — Focused verification:** Affected contracts, prompt expansion,
  representative decision paths, source loading, and required checks are verified.
  Static checks, observed behavior, and unverified quality claims stay separate.
- **AC-005 — Bounded delivery:** No benchmark project, blanket rewrite, or new
  runtime machinery is added. The final report identifies changed resources,
  evidence, and remaining uncertainty.
