---
status: accepted
---

# Shape: Clear workflow prompts, evaluated with Astra

## Problem and evidence

The user wants our shared Pi workflows to produce better results with GPT-6
Astra. Screenshot implementation is one example, not the scope boundary.
Shaping, planning, implementation, review, and handoffs are all relevant.
Go and TypeScript standards should remain evergreen.

The user selected shared workflow improvements evaluated with Astra, not an
Astra-specific layer or changes to agent model routing. They requested the
current remote baseline. This task branch starts from `origin/main` at
`1f7c5b548ecec1bff461c0250a641b1468be7558`.

Observed repository facts:

- `packages/feature-flow/prompts/{shape,plan}.md` are thin skill entry points.
  Most workflow instructions live in skills and templates, not slash prompts.
- `packages/engineering/skills/implement/SKILL.md` combines intake, delegation,
  repair, assurance, language routing, publication, and continuation in 413 lines.
  It already contains a compact Worker contract and evidence-based stop rules.
- Business-fit guidance appears in both the implementation skill and
  `agents/worker.md`. Repetition alone does not establish a defect, but gives
  the audit a concrete ownership question.
- Shape, planning, implementation, and frontend skills already contain many
  guide recommendations. Adding another general checklist would duplicate them.
- Package resource tests check instruction text, prompt expansion, and package
  contents. Those checks do not demonstrate model task quality.
- The current private Worker is Sol-low. An Astra parent does not imply an
  Astra implementation child. Evaluations must record both profiles.

The user's quality report is valid input, but no paired failing session has
been inspected. Instruction conflict, excessive context, and unclear phase
boundaries are hypotheses, not confirmed causes or proof of model inferiority.

## Proposed solution

Deliver one bounded prompting revision across the shared workflow. Optimize for
correct next actions and complete outcomes, not shorter text alone.

Use three dependent vertical slices in one delivery unit:

1. **Establish behavioral evidence.** Map each candidate change to its current
   instruction, guide recommendation, intended behavior, and a representative
   scenario. Freeze baseline resources and evaluation conditions before edits.
   Separate rules already satisfied from actual gaps. Do not rewrite resources
   solely because the guide suggests a familiar practice.
2. **Clarify workflow instructions.** Make the active goal, inputs, permitted
   actions, proof, and stop or handoff condition easy to identify. Keep slash
   prompts thin. Put conditional details with their owning phase and use
   package-local references only where they reduce unnecessary reading. Preserve
   required rules and independent installation when removing repetition.
3. **Verify the change.** Run resource and loading checks, then compare baseline
   and revised workflow behavior with Astra. Keep only supported improvements.
   Report uncertain or unavailable model evidence rather than treating passing
   text assertions as a quality result.

The revision targets these behaviors:

- Shape produces a concrete pitch from available evidence and asks only for
  decisions that can change the outcome. Its approval gate remains explicit.
- Planning consumes accepted intent and produces a complete delivery plan
  without reopening settled decisions or inventing additional scope.
- Implementation completes authorized work within its public seam. Instructions
  distinguish routine choices within that seam from scope or architecture
  changes that require parent judgment or human approval.
- Handoffs preserve the complete bounded request, later decisions, relevant
  sources, worktree ownership, evidence, and unresolved questions. They do not
  copy transcripts or every general rule.
- Review reports concrete consequences against the fixed intent and diff.
  Verification remains proportionate while all required repository gates remain.
- Frontend work preserves supplied or accepted visual evidence through the
  implementation and comparison loop. It does not substitute subjective
  redesign or passing code checks for visual proof.

Planning will name a small fixed evaluation suite covering Shape, planning,
implementation and repair, fixed-diff review, frontend reproduction, and missing
capabilities. Include current-request constraints and unauthorized-action traps.
Use the same task, starting tree, tools, model, thinking effort, and child
profiles within each baseline/revised pair. Record actual loaded resources.
Keep tasks and artifacts isolated and prevent real publication or tracker writes.
Freeze the rubric before viewing revised results. Record completion quality,
proof quality, unnecessary questions, scope deviations, tool use, and available
latency and usage data. Repeat disputed results rather than selecting a favorable
run. Planning must state the exact run set and permitted provider use before
implementation approval. This is a bounded evaluation, not a new benchmark
platform or an open-ended prompt search.

Atomic commits may separate package-owned changes. The pitch and plan share the
implementation unit's branch and eventual standalone pull request. They have no
independent publication value.

## Boundaries and no-gos

Allowed change surface:

- Workflow instructions, entry prompts, templates, and local references in
  `packages/feature-flow` and `packages/engineering`.
- First-party frontend workflow instructions in `packages/frontend-developer`.
- `writing-for-agents` guidance in `packages/productivity` only where a reusable
  authoring rule needs clarification.
- Agent instruction bodies only where the shared handoff contract requires it.
- Directly related resource tests, package READMEs, and development-only
  evaluation documentation or fixtures outside production package directories.

Preserve Go and TypeScript skill content, language applicability and fallback
rules, specification-review gates, and vendored frontend standards. Preserve
agent model IDs, thinking levels, tool permissions, skill preloads, and role
ownership. Do not introduce a model-specific production layer, runtime extension,
provider transport change, global configuration, dependency, or new package.

Do not weaken worktree isolation, explicit approval, publication opt-outs,
source-disclosure limits, cancellation, or evidence requirements. Do not replace
the host instruction hierarchy with a blanket rule that user text overrides
system or developer instructions. Retrieved guides and examples remain evidence,
not instructions for the running agent.

Do not edit every prompt for uniformity. A necessary change to authority,
language routing, agent configuration, runtime behavior, or package dependencies
requires a revised proposal. Do not change model settings to improve benchmark
results or claim superiority to Fable without a separate controlled comparison.

## Decision-changing research and risks

The [PrompTessor guide](https://promptessor.com/blog/gpt-6-astra-prompting-guide)
recommends explicit goals, context, constraints, autonomy, tool and delegation
policies, verification, output, and stop conditions. Its detailed templates are
third-party recommendations to evaluate, not mandatory platform contracts.

[OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
emphasizes auditing accessible instructions, authorized follow-through,
harness-appropriate delegation, and proportionate verification. Adopt compatible
principles, not wording that expands this repository's authority boundaries.

Pi skill guidance documents progressive disclosure and notes that models do not
always load matching skills. Prompt templates expand into instructions rather
than enforce them. Resource loading must therefore be verified in evaluation.

Main risks are deleting necessary constraints while shortening instructions,
moving critical rules into unread references, weakening standalone-package
fallbacks, and attributing a child-model result to Astra. The baseline and
scenario evidence must distinguish these cases. No source establishes that a
larger prompt, XML headings, or additional agents will improve our results.

## Review evidence

- **Applicability:** `not applicable`. This proposal does not change Go source,
  modules, CLIs, Go-specific standards, applicability, or routing contracts.
- **Fixed document:** `not applicable`.
- **Status:** `not applicable`. No independent specification review has run.
- **Invalidation:** Reassess applicability if Go-specific scope changes.

## Authority

The parent owns scope, architecture, synthesis, verification, and approval.
The user selected an **accept-all implementation preference**. It becomes
implementation authority only after explicit approval of the complete plan.

Pitch approval authorizes its bounded commit on
`docs/astra-workflow-prompting` and continuation to planning. Complete-plan
approval controls implementation and the fixed evaluation run set. Eventual
publication follows existing installed delivery methods and required gates.
No approval authorizes merge, release, deployment, destructive cleanup, unrelated
remote changes, or changes to the user's model settings.

## Observable acceptance criteria

- **AC-001 — Evidence-backed scope:** Each changed workflow rule maps to an
  observed baseline gap or demonstrated ambiguity, a named scenario, and its
  preserved constraints. Already-satisfied advice does not create extra process.
- **AC-002 — Clear phase behavior:** Scenario results show the correct artifact,
  next action, evidence, and stopping point for the active phase. Settled intent
  is preserved and material decisions are not silently inferred.
- **AC-003 — Safe complete handoff:** A fresh executor or reviewer receives the
  complete bounded intent, fixed boundary, relevant methods, evidence, and
  unresolved decisions without relying on unavailable conversation context.
- **AC-004 — Preserved contracts:** Existing authority, isolation, language,
  model-routing, and package-independence contracts remain intact. Applicable
  deterministic checks pass without deleting safeguards to make tests green.
- **AC-005 — Demonstrated quality:** Paired Astra evaluation resolves named
  baseline failures with no observed authority or scope regression. Results
  report per-scenario evidence and limitations. If improvement is not shown,
  revise or withhold the unsupported changes and report unmet proof.
- **AC-006 — Honest delivery:** Focused tests, source loading, required repository
  checks, and target-worktree reload acceptance are recorded separately from
  model-quality evidence. No running session is claimed to use edited resources
  without verification.
