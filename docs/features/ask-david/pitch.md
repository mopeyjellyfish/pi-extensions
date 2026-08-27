---
status: accepted
---

# Shape: Ask David

## Problem and evidence

Users do not remember every extension, skill, prompt, command, configuration rule,
or workflow in David's Pi package suite. The package READMEs and source contracts
contain the answers, but the user must first know which package and document to
inspect.

Matt Pocock's `ask-matt` skill provides a useful manual entry point for this
problem. Its current implementation is a repository-specific workflow router,
not a persona. `ask-david` needs a different outcome: answer a caller's question
about the complete public Pi package suite, with a recognizable but transparent
David-flavoured voice.

David's conversation and repository writing provide consistent voice evidence:
direct recommendations, pragmatic Simplified Technical English, exact technical
terms, explicit boundaries, light informality in conversation, and no inflated
claims. A production skill cannot depend on private or unavailable chat history.
It therefore needs a small durable voice contract derived from this evidence.

## Proposed solution

Add a manually invoked `ask-david` skill and an `/ask-david` prompt to the
independently installable `@mopeyjellyfish/pi-productivity` package. The prompt
passes the caller's question to the skill, so the normal entry point is:

```text
/ask-david <question>
```

The underlying `/skill:ask-david <question>` command remains available. The
skill answers how to use any public extension, skill, prompt, command,
configuration surface, or workflow in this repository's package suite.

For each question, the skill will:

1. Identify the named or implied package and the user's intended task.
2. Inspect the nearest authoritative package README, manifest, source contract,
   and relevant target-repository instructions that are available.
3. Use public upstream or repository documentation only when local evidence is
   absent and an available research capability can access it.
4. Ask one focused clarification when the subject or version materially changes
   the answer.
5. Give the recommendation first, followed by the minimum exact commands,
   configuration, or next steps that the caller needs.
6. State evidence gaps and version uncertainty instead of inventing behavior.

The answer style will be calm, direct, pragmatic, mildly informal, and concise.
It may use natural contractions in conversation. It will avoid canned AI
phrases, theatrical roleplay, excessive headings, repeated summaries, fake
quotations, and claims that David personally authored or approved the answer.
The skill gives a David-flavoured answer. It does not impersonate David.

The skill remains read-only. It can inspect evidence, but it does not install,
configure, edit, or run an extension on the caller's behalf. It can recommend the
exact next action when the caller asks for operational help.

This is one vertical slice and one delivery unit. The skill, routing prompt,
focused resource contract tests, package README update, root profile
documentation update, and feature documents share one branch and publication
boundary.

## Boundaries and no-gos

- Cover the complete public Pi package suite in this repository, not every
  project David has authored.
- Keep `ask-david` manually invoked with `disable-model-invocation: true`. Route
  `/ask-david` to that skill without duplicating the skill contract in the
  prompt.
- Add it to the existing Productivity package. Do not create a runtime extension
  or a new production package.
- Keep the package independently installable. Do not depend on private root
  agents, this monorepo's paths, unavailable tools, or sibling packages.
- Do not duplicate all package documentation inside the skill. Point the agent
  to available authoritative evidence.
- Do not claim access to private chat history, personal memory, private intent,
  or unpublished opinions.
- Do not answer unsupported questions as if the answer came from David.
- Do not turn the skill into a general engineering oracle, implementation flow,
  mutation tool, or support ticket system.
- Reshape if reliable package identification requires a runtime index or if the
  skill cannot remain useful when installed independently.

## Decision-changing research and risks

The current `ask-matt` source uses `disable-model-invocation: true` and routes
callers through Matt Pocock's repository-specific skills. It does not define a
Matt persona. `ask-david` will reuse only the useful manual-entry concept and
will use an original support and voice contract.

The main risk is false authority. A fluent David-style answer can look like a
personal statement even when evidence is missing. Transparent authorship,
source-first reasoning, exact uncertainty, and a prohibition on invented intent
are required behavior.

A second risk is package independence. The Productivity package cannot assume
that another package or this source repository is installed. The skill must use
what the caller's environment exposes and request a package name, version, link,
or excerpt when authoritative evidence is unavailable.

## Review evidence

- **Applicability:** not applicable. The pitch does not propose Go source, a Go
  module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns the support boundary, voice contract, package placement,
authorship safeguards, evidence order, test contract, and final verification.
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
- **AC-002 — Complete suite scope:** The skill accepts a caller's question about
  any public package resource in David's Pi suite and identifies the relevant
  package or asks one focused clarification.
- **AC-003 — Evidence-first answer:** The skill tells the agent to use available
  target instructions, package README, manifest, source contract, and public
  documentation in a defined order, with exact version and evidence gaps.
- **AC-004 — David-flavoured voice:** Answers lead with a direct recommendation,
  stay pragmatic and concise, preserve exact technical terms, and avoid canned
  AI phrasing and excessive structure.
- **AC-005 — Transparent authorship:** The skill never claims to be David or to
  express David's personal approval, memory, private intent, or unpublished
  opinion.
- **AC-006 — Read-only boundary:** The skill answers and recommends next actions
  without changing files, installing packages, running setup, or mutating
  extension state.
- **AC-007 — Independent package delivery:** Productivity package tests, packed
  skill and prompt contents, README, root profile documentation, source smoke,
  and required repository checks include the new resources without adding
  runtime dependencies or duplicate registrations.
