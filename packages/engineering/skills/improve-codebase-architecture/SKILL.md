---
name: improve-codebase-architecture
description: >-
  Discover and rank evidence-backed architecture improvements without editing
  production code.
---

# Improve codebase architecture

Use this read-only method to discover architecture improvements, not to start an
implementation loop. An **improvement depth** is the caller's appetite for
discovery coverage and acceptable impact. It is not `codebase-design` **Depth**,
a model thinking level, or implementation authority.

## Interpret the improvement request

Accept an initial request in this form:

```text
[low|medium|high|max] [optional scope]
```

Recognize an exact leading level token without regard to letter case. Normalize
the token to lowercase. The accepted improvement depths are `low`, `medium`,
`high`, and `max`.

If the first token is not a level, use the default `medium` improvement depth
and treat all arguments as scope. A level-only request uses that improvement
depth and infers a bounded scope that fits the appetite. To use a scope that
starts with a reserved token, give an explicit level first. For example,
`medium low latency path` uses `low latency path` as the scope. For an empty
request, use `medium` improvement depth and infer a bounded scope.

The scope can name a module, package, subsystem, vertical feature slice,
architecture pattern, test surface, pain point, or change-history area. Do not
force a finding to match the requested appetite. Evidence can support smaller
work or no supported improvement.

| Improvement depth | Discovery and impact appetite                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `low`             | Inspect one localized area, immediate callers, nearest tests, and limited relevant history. Report at most three independent, reversible quick wins. Exclude public-contract changes, migrations, and cross-package redesign.                            |
| `medium`          | Inspect one focused module, package, subsystem, or vertical slice with direct dependencies, callers, tests, and relevant history. Find coherent bounded improvements.                                                                                    |
| `high`            | Inspect a broad module, package, vertical slice, or pattern across adjacent modules. Compare material alternatives and include architecture decisions, risks, and coordination needs.                                                                    |
| `max`             | Inspect a repository-wide or explicitly large pattern as thoroughly as practical. Declare coverage and exclusions. Include cross-package effects, dependencies, migration needs, and staged options. Never claim coverage outside the declared boundary. |

Do not edit production code directly. Do not assume an issue tracker, companion
skill, remote asset, desktop application, or repository-specific path is
available.

## Discover the current shape

1. Read target-repository instructions, nearest domain context, and applicable
   architecture decisions. Record absent or unclear decisions as uncertainty.
2. Make one optional bounded Researcher handoff for a hot-spot and caller scan
   only when that role is available. Give it a scope, time or file boundary, and
   required evidence. The direct parent performs the same bounded scan when
   Researcher is unavailable.
3. Find concrete hot spots: repeated changes, callers coordinating internal
   steps, duplication that changes together, unstable external boundaries,
   error-prone test setup, or scattered policy. Read relevant callers, tests,
   and change history when available. File length or a principle name alone is
   not evidence.
4. Apply the `codebase-design` vocabulary as evidence, not as a mandate. Look
   for a deeper **module** with a smaller **interface**, a real **seam** or
   **adapter**, and improved **Depth**, locality, leverage, and test surface.
   Reject speculative seams, forwarding-only layers, and syntax-only
   deduplication.

## Report ranked candidates

Present a concise ranked report. For every candidate include:

- selected improvement depth; scanned scope; declared coverage and exclusions;
- current friction and evidence, with involved files and relevant callers or tests;
- proposed deeper module and interface boundary; expected locality and leverage,
  plus the expected test effect and target-language improvement pattern;
- applicable architecture decision conflicts or uncertainty; evidence strength
  (strong, moderate, or weak) and why;
- expected change impact and reversibility; candidate dependencies, overlap, and
  integration points; and
- recommended workflow route and its reason, plus a simple before/after diagram
  when it clarifies responsibility or call paths.

Keep observations separate from proposals. Rank by evidence strength, expected
leverage, locality improvement, delivery risk, reversibility, and coordination
cost. A `max` report states evidence gaps and never claims exhaustive coverage
beyond its declared boundary.

## Select and route

Use the `question` tool to offer at most three top candidates plus a no-change
option. State that no-change is exclusive. Permit multiple selection only when
the report proves the candidates independent; use single selection when they
overlap or depend on each other. If the tool is unavailable, present the same
bounded report and selection rules in conversation. Do not choose architecture,
product scope, or implementation on the human's behalf.

After selection, use accepted intent, risk, and coordination cost. Improvement
depth informs the route but does not replace `developing-changes`:

1. Send one clear, bounded candidate to `implement`.
2. Send multiple independent clear candidates to `planning-changes`, which can
   mark them `parallel-ready` only after proving separate ownership, isolated
   worktrees, non-overlapping changes, and named integration points.
3. Send clear coordinated or dependent candidates to `planning-changes`.
4. Send unresolved, hard-to-reverse, cross-cutting, migration, or major
   architecture work to Shape, then planning after pitch approval.

If a selected route skill is unavailable, return the same self-contained
candidate brief to the direct parent. Name the intended route and state that
implementation has not started. If Shape is unavailable, return the same brief
to the direct parent and state that implementation has not started. This skill
never starts workers, creates a branch, edits production code, commits, or
publishes.

## Test-surface guidance

Test-focused discovery is valid architecture work when it improves maintenance
locality or defect detection. Consolidate tests only when they exercise the
same behavior with shared setup and assertions. Preserve clear case names and
isolated failure evidence. Use the target language's established pattern rather
than a generic deduplication rule.

## Go routing

For Go source, a Go module, a Go CLI, or Go-specific work, target-repository
standards remain first. Then resolve and follow the installed `go` skill by its
installed name before generic architecture guidance. Table-driven subtests
remain the Go default. Merge separate tests into one table only when they share
behavior, setup, and assertions while retaining clear case failures. The
installed `go` skill decides unclear Go test-pattern cases. Do not recommend
speculative interface types, layer packages, generated mocks, or abstractions
merely to satisfy generic architecture advice.

Resolve `cobra-viper` only when Cobra or Viper commands, flags, or CLI
configuration are in scope. Unrelated Go toolchain evidence does not activate
either method. If a companion skill is unavailable, record the unmet method
and have the direct parent use bounded target-repository Go standards without
claiming the skill loaded.
