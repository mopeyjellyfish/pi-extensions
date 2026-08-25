---
name: improve-codebase-architecture
description: >-
  Discover and rank evidence-backed architecture improvements without editing
  production code.
---

# Improve codebase architecture

Use this method to discover architecture improvements, not to start an
implementation loop. Accept an optional module, subsystem, pain point, or
change-history scope. If no scope is supplied, scan a bounded representative
area and state that boundary.

Do not edit production code directly. Do not assume an issue tracker, a
companion skill, remote assets, desktop applications, or repository-specific
paths are available.

## Discover the current shape

1. Read the target repository instructions. Read the nearest domain context and
   architecture decisions that apply to the scope. Record an absent or unclear
   decision as uncertainty; do not invent one.
2. Make one optional bounded Researcher handoff for a hot-spot and caller scan
   when that role is available. Give it a scope, a time or file boundary, and
   required evidence. The direct parent performs the same bounded scan when
   Researcher is unavailable.
3. Use the scan to find concrete hot spots: repeated changes, callers that
   coordinate internal steps, duplication that must change together, unstable
   external boundaries, error-prone test setup, or scattered policy. Read the
   relevant callers, tests, and change history when available. File length or a
   principle name alone is not evidence.
4. Apply the `codebase-design` vocabulary. Look for a deeper **module** with a
   smaller **interface**, evidence for a real **seam** or **adapter**, and
   improved **depth**, **locality**, **leverage**, and **test surface**. Reject
   speculative seams, forwarding-only layers, and syntax-only deduplication.

## Report ranked candidates

Present a concise ranked report. For every candidate include:

- current friction and evidence, with involved files and relevant callers or
  tests;
- the proposed deeper module and its interface boundary;
- expected locality and leverage, plus the expected test effect;
- applicable architecture decision conflicts or uncertainty;
- evidence strength (strong, moderate, or weak) and why; and
- a simple before/after diagram where it makes the changed responsibility or
  call path easier to understand.

Rank candidates by evidence strength, expected leverage, locality improvement,
and delivery risk. Keep observations separate from proposals. Do not present a
candidate as required when its evidence is weak.

## Select and hand off

Use the `question` tool to ask the human which ranked candidate, if any, to
select. Include a no-change option. If the tool is unavailable, show the full
report in conversation and ask the same focused choice. Do not choose
architecture, product scope, or implementation on the human's behalf.

For a selected candidate, hand the evidence, proposed boundary, decision
conflicts, and diagram to Shape and planning. Shape decides whether to form an
accepted pitch and plan. If Shape is unavailable, return the same
self-contained candidate brief to the parent and state that implementation has
not started. This skill stops after that handoff; it does not edit production
code, create a branch, or implement the candidate.

## Go routing

When work has Go source, a Go module, a Go CLI, or Go-specific work, resolve
`go` by its installed name and follow it. Resolve `cobra-viper` only when Cobra
or Viper commands, flags, or CLI configuration are in scope. Unrelated Go
toolchain evidence alone does not activate either method. If a companion skill
is unavailable, record the unmet method and have the direct parent use bounded
target-repository Go standards without pretending the skill loaded.
