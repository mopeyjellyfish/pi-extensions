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

When the first token is not a level, treat all arguments as the request and
leave Improvement depth unanswered. To use a scope that starts with a reserved
token, give an explicit level first. For example, `medium low latency path` uses
`low latency path` as the scope. An empty or level-only request has no specific
area and uses the adaptive quick start instead of silently inferring a scope.
Treat `find improvements` as explicit agent-led discovery, not as the literal
name of a repository area.

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

Resolve Improvement depth, Focus, and Outcome before discovery. Use one initial
`question` tool call whenever any dimension is unanswered. Ask separate
single-select questions only for the unanswered dimensions:

1. **What improvement depth should this review use?** Ask when no explicit
   leading level was supplied. Offer `low`, `medium`, `high`, and `max` with the
   appetite descriptions above and recommend `medium`.
2. **Where should this review focus?** Ask when there is no specific scope and
   the user did not request `find improvements`. Offer **Find improvements**, up
   to two repository-specific focus choices supported by named orientation
   evidence, and the whole declared repository. The built-in custom response
   lets the user name another area. Do not show an unsupported generic hotspot.
3. **What should this review prepare for?** Ask when no outcome was supplied.
   Offer **Work now**, **Prepare issues**, **Both**, and **Report only**. Label
   Work now with detected pane support or `current session`. Label Prepare issues
   with the detected Linear, GitHub, Jira, or other supported tracker; use
   `choose tracker` when ambiguous and `draft only` when no tracker capability
   exists.

Do lightweight parent-only orientation when the Focus question will be asked or
when agent-led `find improvements` must choose an evidence-backed focus. Read
target-repository instructions and bounded topology, history, and test signals.
Detect tracker and Herdr-or-equivalent pane capability. Do not write, start
support lanes, or make an architecture recommendation yet. A user-supplied
specific area is authoritative: do not ask Focus or broaden it. A specific scope
that only lacks Improvement depth or Outcome needs no orientation.

Find improvements lets the parent choose a level-appropriate, evidence-backed
focus: one localized area for `low`, one focused module or slice for `medium`, a
broad module or pattern for `high`, and the declared repository as thoroughly as
practical for `max`. State the chosen focus and coverage before deeper discovery.

If `question` is unavailable, use `medium` only for an unanswered Improvement
depth and present other unanswered choices in conversation. Do not repeat an
explicit area or outcome. If the user skips or cancels the intake, stop before
discovery without re-prompting or silently selecting missing values. Quick-start
answers guide scope, breadth, grouping, and recommendations; they grant no
mutation authority.

## Resolve language and repository constraints

Read target-repository instructions, nearest domain context, and applicable
architecture decisions. Record absent or unclear decisions as uncertainty.

For all test work, resolve `test-driven-development` by its installed name and
apply it as the test-effectiveness method. For Go source, a Go module, a Go CLI,
or Go-specific work, apply target-repository standards first, then resolve `go`
by its installed name and apply the installed `go` skill, then `cobra-viper`
only for Cobra or Viper commands, flags, or CLI configuration, then
`test-driven-development`, then generic guidance. Command testing is command
scope. Unrelated toolchain evidence does not activate either Go skill,
including a bare `go.mod`. The installed constraints remain before generic
guidance.

The parent resolves applicable constraints before any handoff and includes them
in every lane, second opinion, and Action brief. Each capable lane loads the
applicable methods. A lane that cannot load an applicable language skill returns
evidence only and makes no language-specific claim. Record an unmet method and
use bounded target-repository Go standards; if neither supports a candidate, omit
it. Official Go documentation can support a mechanism, but does not replace
repository evidence or applicable skill constraints for a candidate. Record a
skill-coverage gap when it supplies a needed mechanism absent from the installed
skill, including a newer repository Go version.

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

Use proportionate bounded read-only support. Test-analysis lanes and external
lookups share one support-action budget. `low` has one slot, but uses the direct
parent by default and permits that slot only for a specific evidence gap;
`medium` has two slots; `high` has four; and `max` uses declared bounded waves
within the host budget. AskClaude remains its separate existing second-opinion
allowance.

Test analysis is normal `/improve` discovery, not a test mode or toggle. An
explicit test request is an ordinary scope and uses one dedicated, bounded,
read-only test-analysis subagent when that capability exists; explicit CI,
coverage, flake, or test-performance scope does the same. At `low`, the direct
parent remains the default, the explicit test scope supplies the required
evidence gap, and the lane fills the sole slot. At other depths it consumes one
slot. For a broader scope, use the lane only after orientation finds material
test quality or cost evidence. The lane is evidence only: it returns
observations, measurements, source references, and evidence gaps. The parent
owns recommendations, ranking, architecture, and report fields. If subagent
capability is unavailable, record reduced coverage and use the bounded
direct-parent fallback.

Each remaining support action is a disjoint bounded scan or external lookup.
External lookup requires read-only capability plus target network, privacy, and
source-disclosure permission. At `low`, an explicit test lane leaves no external
lookup slot.

The parent remains the orchestrator and architecture owner. All ordinary support
children return evidence only and do not orchestrate. Missing support reduces
and records coverage; it never causes unbounded fallback.

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
- current friction and repository evidence, with involved files, callers, tests,
  and relevant history;
- proposed deeper module and interface, plus a focused before-and-after visual;
- expected locality, leverage, Depth, test effect, and target-language pattern;
- architecture-decision conflicts or uncertainty, evidence strength and reason;
- expected impact, reversibility, dependencies, overlap, integration points, and
  recommended route and reason; and
- for a test candidate, effectiveness risk and plausible missed wrong behavior,
  suite timing boundary, measured hot cases or an evidence gap, branch/base CI
  comparison limits, reliability, failure-isolation, and maintenance effects,
  applicable constraints, primary sources, expected defect-detection and
  performance effects, tradeoffs, and proof needed.

Keep observations separate from proposals. Rank by evidence strength, leverage,
locality, delivery risk, reversibility, and coordination cost. Never rank a
faster but weaker suite as an improvement. A stronger but materially slower suite
must state its cost and why it is acceptable. Never claim exhaustive coverage
beyond the declared scan boundary.

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
path. Embed recoverable structured data with coverage, report revision, stable
candidate IDs, decision and second-opinion status, plus each applicable test
candidate's effectiveness risk, suite timing boundary, hot cases, branch/base CI
comparison, reliability, failure-isolation, and maintenance effects, constraints,
sources, evidence gaps, tradeoffs, route, and proof. Preserve IDs across updates.

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

Unless the outcome is Report only or the user stops, identify awaiting candidates
in report order or in the named subset. Never reprocess a decided candidate.
When at least two await a decision, offer this authoritative batch entry:

1. **Action all**
2. **Track all**
3. **Select candidates**
4. **Review individually**

All means every awaiting candidate in the active report or named subset. For
**Select candidates**, use one count-unbounded multi-select Question. Give each
option a stable candidate ID, concise title, and recommended route. Do not add
Next, Submit, Other, or Chat controls as candidate options. This is one
`question` tool call. If the tool is unavailable, cancelled, empty, or rejects
the aggregate selector, make no decision or report revision. Offer the complete
individual or conversational stable-ID fallback.

For a non-empty selection, offer exactly:

1. **Action selected**
2. **Track selected**
3. **Won't do selected**
4. **Review selected individually**

Review individually and Review selected individually use the existing
per-candidate question with these options:

- **Action** — state the recommended delivery route and reason. Ask for
  confirmation, then invoke `implement`, `planning-changes`, or Shape then
  planning. Include the complete candidate evidence and resolved language
  constraints. Use a Herdr-or-equivalent pane only when available; otherwise
  keep the handoff in the current-session. The route retains its own approvals.
- **Track** — prepare one classified issue draft through `ticket-workflow`, then
  request its required exact-set confirmation before remote creation. If no
  tracker is available, return a copyable draft and stop.
- **Won't do** — record only an ephemeral report decision. Do not start work,
  create an issue, or write an ADR.
- **Deepen** — spend the remaining selected-depth analysis on the same seam.
  Preserve the candidate ID, update evidence and ranking, note that the second
  opinion was not rerun, and increment the report revision. Ask the individual
  question again. Deepen is individual-only. If the budget is exhausted, offer
  a new explicit depth request instead of silently widening.

Use the Question tool's built-in custom response for a user-authored direction.
Do not add separate Other or Chat options. If Question is unavailable for an
individual review, present the same four options and accept a free-form custom
direction in conversation.

For Action, use evidence, impact, reversibility, dependencies, and uncertainty.
One clear bounded candidate routes to `implement`. Multiple independent clear
candidates or coordinated dependent candidates route to `planning-changes`.
Unresolved, hard-to-reverse, cross-cutting, migration, or major architecture work
routes to Shape, then planning after pitch approval. A missing route skill or
pane returns the same self-contained brief to the direct parent.

Bulk Action creates one self-contained handoff that records dependencies,
overlap, integration points, uncertainty, and route reasons before it applies
those route rules. Bulk Action never starts a writer and never proves parallel
readiness. Every writer still requires an isolated worktree. Multiple writers can
start only after the parent or planning proves independence, non-overlapping
ownership, and named integration points. Coordinated candidates share one plan.

Track always remains available. Load and follow `ticket-workflow`; do not
duplicate tracker policy here. Detect target instructions, tracker metadata, and
installed capability before the candidate question. If target selection is
ambiguous, ask after Track selection instead of guessing. For one candidate,
classify its target, taxonomy, route, grouping, priority, route status, and
privacy state before the existing exact displayed draft-set confirmation. Track
queues the exact bounded draft set before its batch confirmation. Remote text
must be self-contained and must not include the local report path or confidential
report metadata.

For grouped Track, load `ticket-workflow` and resolve its policy once per target.
Classify each candidate draft with its exact target, taxonomy, route, grouping,
priority, route status, and privacy state. Queue the exact bounded draft set, but
create nothing yet. Show the exact classified draft set. Then require one
separate exact-set batch confirmation for that set and target before remote
creation. A changed draft or target requires a new confirmation. If no supported
tracker can be resolved, return the classified copyable drafts and stop.

After an accepted individual decision, atomically update the same Blueprint
Ledger, mirror the decision on its candidate article, preserve unchanged IDs,
and increment the revision once. After one accepted group decision, atomically
update the same Blueprint Ledger once, mirror the decision on every affected
candidate article, preserve unchanged IDs, and increment the revision once.
Continue with awaiting candidates.

Stop the helper idempotently when triage ends unless the user asks to keep
reading. Report only can retain it until explicit stop or its bounded maximum
lifetime. Browser controls never select candidates, start implementation, or
create issues.

Discovery and report generation never create a branch, edit target production
code, commit, publish, mutate a tracker, or treat a browser control as mutation
authority. Only a terminal Action and the separate exact-set tracker confirmation
can authorize their bounded next steps.

## Test-analysis evidence

Test-focused discovery is normal architecture work. Map accepted behavior and
public seams to existing tests. Assess falsifiability: each important test should
fail for a plausible wrong behavior or implementation and use independent
expected values.
Consolidate tests only when they exercise the same behavior with shared setup and
assertions. Preserve clear case names and isolated failure evidence. Use the
target language's established pattern rather than a generic deduplication rule.
Identify tautological assertions, mock-call-only tests, private-helper coupling,
missing boundary or error behavior, nondeterministic waits, weak failure
isolation, and gaps at real process, filesystem, network, provider, concurrency,
or UI boundaries. Coverage and test count are signals, not proof of
effectiveness. Do not recommend tests merely to increase a percentage.

Separate two performance views. The holistic suite view maps test commands, CI
workflows, packages, shards, setup, cache use, retries, artifacts, and total test
steps. Separate queue, setup, test execution, artifact upload, and teardown time
when evidence permits. Specific hot cases require measured timing or reliability
evidence for packages, files, tests, subtests, benchmarks, fixtures, flakes,
contention, or allocation. Do not infer a hot test from a slow job, and never sum
overlapping parallel test or subtest elapsed values as suite wall-clock duration.

When branch and base refs are provided, or a verified current branch and pull
request base are available, compare only recent compatible CI runs: workflow,
job or matrix, runner class, event type, relevant workflow revision, and cache
conditions. Report exact refs and SHAs, run URL or identifier, sample size,
timing boundary, range or distribution, and confounders. Do not claim a
regression from one noisy observation or incompatible runs; stale, unavailable,
retention-limited, or permission-restricted CI is an explicit evidence gap.

Keep CI discovery provider-neutral and read-only. Prefer an available provider's
official API, CLI, logs, and artifacts. For GitHub Actions, authenticated
read-only `gh run list`, `gh run view`, `gh run download`, `gh pr checks`, and
REST `GET` requests are allowed. Never dispatch, rerun, cancel, approve, or edit
a workflow. Before deeper CI discovery or an artifact download, the parent
creates the report run's unique OS temp directory and uses an explicit non-served
child destination. Remove downloaded artifacts immediately after bounded evidence
extraction; helper shutdown is only a cleanup backstop. Never expose private logs
or artifact content in a report.

Run a local test, benchmark, profile, trace, race, repetition, shuffle, coverage,
or structured-output command only when it is bounded, non-destructive, and
repository-documented after inspecting its definition. Ask before an unclear
external effect; do not automatically run integration or end-to-end tests that
can mutate external systems. Record command, cache state, runtime,
instrumentation, repetition, shuffle seed, race or coverage mode, and parallelism
when relevant. Bypass result caching with the documented control or label cached
data unsuitable for timing; never delete caches to manufacture evidence.

For Go tests, use applicable mechanisms from the installed `go` skill or
official Go toolchain documentation, such as structured JSON events, benchmarks,
profiles, coverage, fuzzing, race detection, repetition, shuffle, and
`testing/synctest`. Confirm that the repository's Go version supports each
mechanism. Record a skill-coverage gap when official documentation supplies a
needed mechanism that the installed skill does not cover. If the repository uses
a newer Go version than the skill covers, consult official Go release notes and
record the gap.

Use primary sources in order: target-repository instructions, code, tests, CI
configuration, run evidence, and dependency versions; official language,
standard-library, toolchain, and CI-provider documentation; canonical maintainer
sources for the exact dependency version, including Go team repositories and
spf13 sources when applicable; then labeled secondary sources only when primary
sources do not answer. Connect every external recommendation to repository
evidence. Omit an unsupported decision-changing claim and record its evidence
gap.
