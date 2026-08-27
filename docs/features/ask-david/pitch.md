---
status: accepted
---

# Shape: Ask David

## Problem and evidence

Users do not remember every extension, skill, prompt, command, configuration rule,
or workflow in David's Pi package suite. The first accepted implementation gives
source-backed package support, but it treats every request as a documentation
lookup. It does not use the suite's strongest guidance: the opinionated routes
between Shape, planning, implementation, diagnosis, review, and publication.

Matt Pocock's `ask-matt` skill is useful because it maps a situation to a flow,
an on-ramp, or a standalone resource. It answers “what should I use next, and
why?” before it explains details. David's suite already has an equivalent main
flow and bounded entry routes. `ask-david` must make that map explicit.

David's conversation and repository writing provide consistent voice evidence:
direct recommendations, pragmatic Simplified Technical English, exact technical
terms, explicit boundaries, light informality in conversation, and no inflated
claims. A production skill cannot depend on private or unavailable chat history.
It therefore needs a small durable voice contract derived from this evidence.

## Proposed solution

Keep the manually invoked `ask-david` skill and `/ask-david` prompt in the
independently installable `@mopeyjellyfish/pi-productivity` package. Make
workflow routing the skill's primary behavior and source-backed package support
its secondary behavior.

The normal entry point remains:

```text
/ask-david <question or situation>
```

The underlying `/skill:ask-david <question or situation>` command remains
available.

For change delivery, the skill will classify the situation before recommending
a route:

1. **Mechanical, explicit, low-risk work:** use `/just-do-it`.
2. **One clear coherent outcome:** use `/implement`.
3. **Clear coordinated work:** use `/plan`, then `/implement`.
4. **Uncertain, risky, or hard-to-reverse work:** use `/shape`, then `/plan`,
   then `/implement`.

The main flow ends with focused proof, required checks, atomic commits, and
bounded pull-request publication through the applicable installed delivery
resources. `ask-david` recommends the next public entry point. It does not
reimplement those resources' contracts.

The skill will also identify these on-ramps and standalone situations:

- unresolved broken, failing, or slow behavior starts with `diagnosing-bugs` and
  joins `implement` after the outcome and regression seam are confirmed;
- architecture upkeep starts with `improve-codebase-architecture`, then sends a
  selected opportunity into Shape and planning;
- pull-request feedback starts with `triage`;
- an active merge or rebase conflict uses `resolving-merge-conflicts`.

For a specialized package-usage question rather than a flow decision, the skill
will retain its evidence order:

1. Identify the named or implied package and the caller's task.
2. Inspect available target-repository instructions, package README, manifest,
   source contract, and relevant public documentation.
3. Ask one focused clarification when the situation, package, or version changes
   the answer.
4. State evidence gaps and version uncertainty instead of inventing behavior.

Every answer will start with the recommended resource or flow, one practical
reason, and the next transition. It will then give only the exact commands,
configuration, or steps needed for the caller's question.

The answer style will remain calm, direct, pragmatic, mildly informal, and
concise. It will avoid canned AI phrases, theatrical roleplay, excessive
headings, repeated summaries, fake quotations, and claims that David personally
authored or approved the answer. The skill gives a David-flavoured answer. It
does not impersonate David.

The skill remains read-only. It can inspect evidence and recommend the exact next
action, but it does not execute the selected workflow or mutate the caller's
repository or extension state.

The revised flow map, focused contract tests, package documentation, and feature
documents remain in the existing delivery unit and pull request.

## Boundaries and no-gos

- Cover the complete public Pi package suite in this repository, not every
  project David has authored.
- Keep `ask-david` manually invoked with `disable-model-invocation: true`. Keep
  `/ask-david` as a thin route to the skill.
- Add no runtime extension, dependency, or new production package.
- Keep the package independently installable. Name public resources, but check
  what is available and remain useful when companion packages are absent.
- Do not depend on private root agents, model names, this monorepo's paths,
  unavailable tools, or private chat history.
- Do not duplicate complete workflow or package documentation. Record only the
  routing distinctions and transitions needed to choose the next resource.
- Do not claim access to personal memory, private intent, unpublished opinions,
  or David's approval.
- Do not execute Shape, planning, implementation, Git, or GitHub mutations on
  the caller's behalf. This skill answers and routes.
- Do not invent a route or command that is not present in the available package
  evidence.
- Reshape if the map needs a runtime resource index or cannot remain useful when
  installed independently.

## Decision-changing research and risks

The current `ask-matt` source uses `disable-model-invocation: true` and organizes
its repository into a main flow, on-ramps, architecture upkeep, vocabulary, and
standalone resources. Its value comes from opinionated routing, not a Matt
persona. `ask-david` will adapt that organizing idea to this suite's public
routes without copying Matt's repository-specific flow.

The main risk is route drift. Workflow resources can change while a copied map
stays stale. The map must remain compact, name only stable public entry points
and transitions, and defer detailed behavior to the installed resource's own
contract.

A second risk is false availability. The Productivity package cannot assume
that Engineering, Feature Flow, Git, or GitHub companions are installed. The
skill must recommend an available resource when possible, state an unavailable
method honestly, and explain the direct next step without pretending that a
companion loaded.

The existing false-authority risk remains. A fluent David-style answer can look
like a personal statement even when evidence is missing. Transparent authorship,
source-first reasoning, and exact uncertainty remain required.

## Review evidence

- **Applicability:** not applicable. The pitch does not propose Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns the workflow map, route boundaries, support boundary, voice
contract, package placement, authorship safeguards, evidence order, test
contract, and final verification.
Pitch approval authorizes one bounded commit on `feat/ask-david-skill` and the
complete-plan handoff. It does not authorize merge, release, deployment,
destructive cleanup, or unrelated remote changes.

The selected execution preference is accept-all implementation. This preference
is not implementation or publication authority until the complete plan is
approved.

## Observable acceptance criteria

- **AC-001 — Manual support entry:** Pi discovers `ask-david` as a manually
  invoked skill, does not expose it for automatic model invocation, and expands
  `/ask-david <question>` into a request that loads and follows the skill.
- **AC-002 — Recommendation-first answer:** Every answer names the recommended
  resource or flow, gives one practical reason, and states the next transition
  before detailed usage help.
- **AC-003 — Main delivery flow:** The skill distinguishes `/just-do-it`, direct
  `/implement`, `/plan` then `/implement`, and `/shape` then `/plan` then
  `/implement` from impact, uncertainty, reversibility, and coordination needs.
- **AC-004 — On-ramps and standalone routes:** The skill maps unresolved bugs,
  architecture upkeep, pull-request feedback, and active conflicts to their
  named public resources and correct next transition.
- **AC-005 — Available-resource boundary:** The skill names stable public entry
  points without assuming companion packages are installed, and states an
  unavailable method or evidence gap honestly.
- **AC-006 — Evidence-first package support:** Specialized usage answers follow
  available target instructions, package README, manifest, source contract, and
  public documentation, with exact version uncertainty.
- **AC-007 — David-flavoured voice:** Answers stay pragmatic and concise,
  preserve exact technical terms, and avoid canned AI phrasing and excessive
  structure.
- **AC-008 — Transparent authorship:** The skill never claims to be David or to
  express David's personal approval, memory, private intent, or unpublished
  opinion.
- **AC-009 — Read-only boundary:** The skill routes and answers without starting
  workflows, changing files, installing packages, running setup, or mutating
  repository, extension, Git, or GitHub state.
- **AC-010 — Independent package delivery:** Productivity tests, packed
  resources, package documentation, root profile documentation, source smoke,
  and required checks include the revised route without runtime dependencies or
  duplicate registrations.
