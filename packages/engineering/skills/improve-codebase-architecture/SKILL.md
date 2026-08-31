---
name: improve-codebase-architecture
description: >-
  Discover and rank evidence-backed architecture improvements without editing
  production code.
---

# Improve codebase architecture

Use this method to discover architecture improvements and present one temporary
decision report. An **improvement depth** is the caller's appetite for discovery
coverage and acceptable impact. It is not `codebase-design` **Depth**, a model
thinking level, or implementation authority.

Discovery and report generation remain read-only. Only an explicit terminal
Action can start a named delivery workflow, and that workflow retains its own
Shape, plan, review, and publication approvals. Browser controls never start
implementation, agent writes, or issue creation.

## Interpret the improvement request

Accept an initial request in this form:

```text
[low|medium|high|max] [optional scope or outcome]
```

Recognize an exact leading level token without regard to letter case. Normalize
the token to lowercase. The accepted improvement depths are `low`, `medium`,
`high`, and `max`.

If the first token is not a level, use the default `medium` improvement depth
and treat all arguments as the request. To use a scope that starts with a
reserved token, give an explicit level first. For example, `medium low latency
path` uses `low latency path` as the scope. An empty or level-only request has no
specific area and uses the adaptive quick start instead of silently inferring a
scope. Treat `find improvements` as explicit agent-led discovery, not as the
literal name of a repository area.

The optional scope can name a module, package, subsystem, vertical feature
slice, architecture pattern, test surface, pain point, or change-history area.
Do not force a finding to match the requested appetite. Evidence can support
smaller work or no supported improvement.

| Improvement depth | Discovery and impact appetite                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `low`             | Inspect one localized area, immediate callers, nearest tests, and limited relevant history. Report at most three independent, reversible quick wins. Exclude public-contract changes, migrations, and cross-package redesign.                            |
| `medium`          | Inspect one focused module, package, subsystem, or vertical slice with direct dependencies, callers, tests, and relevant history. Find coherent bounded improvements.                                                                                    |
| `high`            | Inspect a broad module, package, vertical slice, or pattern across adjacent modules. Compare material alternatives and include architecture decisions, risks, and coordination needs.                                                                    |
| `max`             | Inspect a repository-wide or explicitly large pattern as thoroughly as practical. Declare coverage and exclusions. Include cross-package effects, dependencies, migration needs, and staged options. Never claim coverage outside the declared boundary. |

Do not assume an issue tracker, companion skill, remote asset, desktop
application, pane agent, or repository-specific path is available.

## Ask the adaptive quick start

When the request does not name a specific area, or asks to find improvements,
do one lightweight parent-only orientation. Read target-repository instructions
and bounded topology, history, and test signals. Detect tracker and
Herdr-or-equivalent pane capability. Do not write, start support lanes, or make
an architecture recommendation yet.

Use one `question` tool call and ask only questions the request did not answer:

1. **Where should this review focus?** Offer **Find improvements**, up to two
   repository-specific focus choices supported by named orientation evidence,
   and the whole declared repository. Find improvements lets the parent choose
   a level-appropriate, evidence-backed focus: one localized area for `low`, one
   focused module or slice for `medium`, a broad module or pattern for `high`,
   and the declared repository as thoroughly as practical for `max`. State the
   chosen focus and coverage before deeper discovery. The built-in custom
   response lets the user name another area. Do not show an unsupported generic
   hotspot.
2. **What should this review prepare for?** Offer **Work now**, **Prepare
   issues**, **Both**, and **Report only**. Label Work now with detected pane
   support or `current session`. Label Prepare issues with the detected Linear,
   GitHub, Jira, or other supported tracker; use `choose tracker` when ambiguous
   and `draft only` when no tracker capability exists.

If the user already said find improvements, do not repeat the Focus question;
apply the same level-appropriate agent-led discovery. A user-supplied specific
area is authoritative: do not ask the Focus question and do not broaden beyond
that area unless the user explicitly requests broader coverage. Improvement
depth controls thoroughness inside that focus.

If the `question` tool is unavailable, present the same choices in conversation.
Do not repeat an area or outcome the user already supplied. Quick-start answers
guide scope, breadth, grouping, and recommendations; they grant no mutation
authority.

## Resolve language and repository constraints

Read target-repository instructions, nearest domain context, and applicable
architecture decisions. Record absent or unclear decisions as uncertainty.

For Go source, a Go module, a Go CLI, or Go-specific work, target-repository
standards remain first. Resolve `go` by its installed name; the installed `go`
skill comes next, before generic guidance, read-only support, AskClaude, or route
briefs.
Resolve `cobra-viper` only for Cobra or Viper commands, flags, or CLI
configuration. Unrelated toolchain evidence alone does not activate either
method. A bare `go.mod` alone is such evidence.

The parent resolves applicable Go constraints before any handoff and includes
them in every lane, second-opinion, and Action brief. Each capable lane also
loads `go`. A lane that cannot load it returns evidence only and makes no
Go-specific recommendation. If `go` is unavailable, record the unmet method and
use bounded target-repository Go standards. If neither source exists, name the
unsupported method and omit the Go-specific candidate. Never claim that an
unavailable skill loaded. Reject generic or second-opinion advice that conflicts
with these constraints.

For Go test work, table-driven subtests remain the default only when cases share
the same behavior, setup, and assertions while retaining clear case failures.
The installed `go` skill decides unclear test-pattern cases. Do not recommend
speculative interface types, layer packages, generated mocks, or abstractions to
satisfy generic architecture advice.

## Discover the current shape

Find concrete hot spots: repeated changes, callers coordinating internal steps,
duplication that changes together, unstable external seams, error-prone test
setup, or scattered policy. Read relevant callers, tests, and change history
when available. File length or a principle name alone is not evidence.

Apply `codebase-design` vocabulary as evidence, not as a mandate. Look for a
deeper **module** with a smaller **interface**, a real **seam** or **adapter**,
and improved **Depth**, locality, leverage, and test surface. Reject speculative
seams, forwarding-only layers, and syntax-only deduplication.

Use proportionate bounded read-only support:

- `low` uses the direct parent by default and permits one bounded scan only for
  a specific evidence gap;
- `medium` permits up to two disjoint scans;
- `high` permits up to four disjoint lanes across modules, history, tests, or
  patterns; and
- `max` permits bounded waves of disjoint lanes inside the host spawn budget and
  records every lane that could not run.

The parent remains the orchestrator and architecture owner. Ordinary children
return evidence only and do not orchestrate. Missing support reduces and records
coverage; it never causes unbounded fallback.

## Determine report breadth

Interpret an explicit breadth request before level defaults. A requested count,
“a few to work on now,” “exhaustive,” “all supported findings,” “prepare
issues,” or a quick-start outcome controls breadth inside declared coverage:

- Work now reports up to three immediate candidates;
- Prepare issues and Both report all supported findings; Both emphasizes up to
  three immediate Action candidates; and
- Report only uses the normal level breadth, opens the report, and stops without
  automatic candidate triage. A later request can resume by candidate ID.

Without explicit breadth, `low` reports up to three localized quick wins,
`medium` reports a small ranked set, `high` reports all supported findings and
emphasizes the top three, and `max` reports all supported findings plus scanned
areas with no supported finding, exclusions, and evidence gaps.

For every candidate record:

- selected improvement depth, scanned scope, declared coverage, and exclusions;
- current friction and evidence, with involved files, callers, tests, and
  relevant history;
- proposed deeper module and interface, plus a focused before-and-after visual;
- expected locality, leverage, Depth, test effect, and target-language pattern;
- architecture-decision conflicts or uncertainty, evidence strength and reason;
- expected impact, reversibility, dependencies, overlap, and integration points;
  and
- recommended route and reason.

Keep observations separate from proposals. Rank by evidence strength, leverage,
locality, delivery risk, reversibility, and coordination cost. Never claim
exhaustive coverage beyond the declared scan boundary.

For `high` and `max`, call AskClaude at most once per `/improve` run when it is
available and target-repository network, privacy, and source-disclosure rules
permit the handoff. Give it the fixed initial candidate report as a read-only
second opinion. Record agreement, disagreement, or the skip reason. AskClaude
cannot change scope, authority, repository standards, or Go practice. Deepen
does not call AskClaude again and marks revised evidence as not rechecked.

## Generate and serve the Blueprint Ledger

Read [HTML-REPORT.md](HTML-REPORT.md) before rendering. It is the package-owned
scaffold, diagram, style, accessibility, and copy contract. Use Mermaid only for
graph-shaped relationships. Use hand-built HTML, CSS, and inline SVG for module
Depth, mass, cross-sections, and collapse views.

Create one unique OS temp directory with one HTML report and one server-state
path. Embed recoverable structured data with the coverage, report revision,
stable candidate IDs, decision status, and second-opinion status. Preserve IDs
across updates.

Write the initial report and every update atomically: write complete HTML to a
sibling temporary file, flush and close it, then rename it over the report path.
Never stream partial HTML into the served path.

Resolve `scripts/report-server.js` relative to this skill. When Node and target
policy permit, start it with absolute paths:

```text
node report-server.js start --report <absolute-html-path> --state <absolute-state-path> --max-age-ms <bounded-ms>
```

Omit `--max-age-ms` to use the two-hour default. If an explicit shorter lifetime
is useful, pass an integer from `100` through `7200000` milliseconds. Never pass
a longer value.

Return its live loopback URL and the absolute standalone HTML path. When a
browser-opening capability is available and policy permits it, open the URL;
otherwise provide the URL for the user to open. A missing Node runtime or any
serving failure preserves the readable HTML file and returns its path.

Keep the same path and URL while updating an active report. Before resuming by
candidate ID, verify that the artifact exists and contains recoverable data. If
OS cleanup removed the artifact, regenerate the report in a new unique temp
directory and return the new path and URL. Never claim the old URL remains live.

## Triage candidates in the terminal

Unless the outcome is Report only or the user stops, process one candidate at a
time in report order or in the named subset. Mirror these choices in the
candidate article. Ask one authoritative terminal question with four options:

1. **Action — `<recommended route>`.** Explain and start the proportionate
   `implement`, `planning-changes`, or Shape then planning workflow. Include the
   complete candidate evidence and resolved language constraints. Use a new
   bounded pane when a Herdr-or-equivalent capability exists; otherwise use a
   current-session handoff. The route retains its own approvals.
2. **Track — `<tracker, choose tracker, or draft only>`.** Prepare and queue a
   complete issue draft. Show the tracker, project or repository, title, body,
   labels, priority, route status, grouping, and privacy state. Create nothing
   yet.
3. **Won't do.** Record only the ephemeral report decision. Do not start work,
   create an issue, or write an ADR.
4. **Deepen.** Spend only the remaining selected-depth analysis and support
   budget on the same seam, evidence, or alternatives. Preserve the candidate
   ID, increment the report revision, mark revised evidence not rechecked by
   AskClaude, and ask again. If the budget is exhausted, offer a new explicit
   depth request instead of silently widening.

Use the `question` tool's built-in custom response for Other direction; do not
add a duplicate Other option. If the tool is unavailable, present the same four
options and accept a free-form custom direction in conversation.

For Action, use evidence, impact, reversibility, dependencies, and uncertainty.
One clear bounded candidate routes to `implement`. Multiple independent clear
candidates or coordinated dependent candidates route to `planning-changes`.
Unresolved, hard-to-reverse, cross-cutting, migration, or major architecture
work routes to Shape, then planning after pitch approval. If a route skill or
pane capability is unavailable, return the same self-contained brief to the
direct parent and state the fallback.

Every writer requires an isolated worktree. Start multiple Action routes in
parallel only after the parent or planning proves independence, non-overlapping
ownership, and named integration points. Coordinated candidates share one plan.

Track always remains available. Load and follow `ticket-workflow` for resolved
tracker policy and issue creation. Do not duplicate provider policy here. Detect
target instructions, tracker metadata, and installed capability before the
candidate question. If selection is ambiguous, ask the user after Track
selection instead of guessing. If no tracker capability exists, produce
draft-only output. Remote text must be self-contained and must not include the
local report path or confidential report metadata.

Each Track selection queues one complete draft. `ticket-workflow` classifies it
from the repository-first policy and records the resolved target, taxonomy,
route, grouping, and privacy state before the existing exact displayed draft-set
confirmation. After triage ends, or when the user asks to create queued issues,
show that exact bounded draft set and ask for one batch confirmation. Approval
applies only to that displayed set. A changed draft or target requires a new confirmation.

After every answer, atomically update the same report, preserve unchanged IDs,
increment the revision, and let the browser reload. Stop the helper idempotently
when active triage ends unless the user asks to keep reading. Report only can
retain the helper until explicit stop or its bounded maximum lifetime.

Discovery and report generation never create a branch, edit target production
code, commit, publish, or mutate a tracker. Only the terminal Action and the
separate exact-set tracker confirmation can authorize their bounded next steps.

## Test-surface guidance

Test-focused discovery is valid architecture work when it improves maintenance
locality or defect detection. Consolidate tests only when they exercise the
same behavior with shared setup and assertions. Preserve clear case names and
isolated failure evidence. Use the target language's established pattern rather
than a generic deduplication rule.
