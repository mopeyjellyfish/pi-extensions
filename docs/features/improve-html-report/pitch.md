---
status: accepted
---

# Shape: Live architecture improvement report

## Problem and evidence

`/improve` returns a concise ranked report in the terminal. The report is useful
for a small choice, but it does not provide enough space for an exhaustive
high-depth or max-depth review. It also does not provide one durable decision
surface for later triage prompts.

The current skill limits the immediate choice to three candidates. The caller
can instead need all supported findings for issue triage, or only a few findings
to implement now. The caller's requested outcome must control report breadth.
The selected improvement depth must still control scan coverage, acceptable
impact, and support effort.

The upstream `mattpocock/skills` architecture method now specifies an ephemeral
HTML report with Tailwind and Mermaid from CDNs. It uses strong before-and-after
visuals and keeps the report outside the target repository. The selected local
direction, **Blueprint Ledger**, extends that idea with declared coverage, a
persistent finding index, stable candidate IDs, a decision queue, and an
explicit handoff back to the Pi terminal.

## Proposed solution

Add a live HTML decision report to `improve-codebase-architecture`. Generate one
report in a unique OS temp directory for each `/improve` run. Serve it on a
loopback-only URL and return both the URL and absolute HTML path whenever the
report is created or updated. Reuse that report during later triage prompts.
The browser reloads when the report revision changes.

Ship a sibling `HTML-REPORT.md` inside the skill directory and the smallest
package-owned Node helper needed to serve one report safely. Follow the upstream
teaching split: `SKILL.md` owns discovery, orchestration, decisions, and
lifecycle; `HTML-REPORT.md` owns the complete HTML scaffold, candidate anatomy,
Tailwind usage, diagram-selection grammar, palette and typography, accessible
states, print behavior, safe content rendering, and concise copy rules. Link to
the guide from `SKILL.md` with a relative Markdown link instead of duplicating
its rendering guidance.

Use Node built-ins only for the helper. Bind to `127.0.0.1` on an ephemeral port,
use an unguessable report route, disable directory listing and caching, and
expire the helper after a bounded maximum lifetime. The parent stops it when
triage ends. A missing or unusable Node runtime is a serving failure. For any
serving failure, keep the HTML file and give the user its absolute path.

Tailwind and Mermaid load from pinned CDN URLs. Repository-derived text is
untrusted input. Escape HTML and Mermaid content, use Mermaid's strict security
mode, and keep the semantic report readable when either CDN fails. Target
repository network and privacy rules take precedence. Do not use a CDN when
those rules prohibit it.

The Blueprint Ledger interface has these parts:

- a header with repository, scope, report revision, and live status;
- a keyboard-operable light and dark theme toggle that follows the operating
  system preference until the user selects an override;
- a coverage rail with depth, files, modules or packages, tests, history,
  findings, and explicit exclusions;
- a persistent finding index with stable candidate IDs and route summaries;
- filters for evidence, impact, and intended route;
- one editorial article per candidate with involved files and a focused
  before-and-after visual, followed by vertical **Problem**, **Proposed change**,
  **Expected wins**, and **Delivery notes** sections with enough space for
  evidence and explanation;
- Mermaid diagrams for graph-shaped dependencies, call flows, and sequences,
  mixed with hand-built HTML, CSS, and inline SVG for mass diagrams,
  cross-sections, and module-collapse views;
- a top recommendation;
- a per-candidate decision section that mirrors the candidate's terminal
  options, recommended action route, and detected tracker; and
- a clear message that the user makes authoritative decisions in the terminal.

Use semantic HTML, visible focus, keyboard-operable native controls, WCAG 2.2 AA
contrast, reduced-motion support, useful text alternatives for diagrams, a
stacked mobile layout, and an editorial print layout that removes browser-only
navigation and controls. Avoid repeated helper text, dashboard-style metric
cards, and headings that do not help the reader decide. Default the report to
`prefers-color-scheme`. Apply a user-selected light or dark override before the
page paints, preserve it while the report URL remains active, and update Mermaid
diagrams with the selected theme. Embed structured report data in the same HTML
file so a later prompt can recover findings by candidate ID. Local filters,
theme selection, candidate selection, and copy actions are convenience features
only. They must not start implementation or create issues.

When an `/improve` request does not name a specific area, start with one
lightweight parent-only orientation pass. Read target repository instructions
and bounded topology, history, and test signals. Detect available tracker and
pane-agent capabilities. Do not start support lanes or modify the target
repository during orientation.

Then ask two adaptive, high-signal questions in one `question` tool call. Omit a
question that the request already answered:

1. **Where should this review focus?** Offer up to three repository-specific
   focus choices supported by the orientation evidence, plus the whole declared
   repository. The built-in custom response lets the user name another area.
   Do not show a generic hotspot label without naming its evidence.
2. **What should this review prepare for?** Offer **Work now**, **Prepare
   issues**, **Both**, and **Report only**. Label Work now with the detected
   Herdr or equivalent pane capability, or state that work will remain in the
   current session. Label Prepare issues with the detected Linear, GitHub, Jira,
   or other supported tracker. Use `choose tracker` when more than one tracker
   is plausible and `draft only` when no tracker capability exists.

These answers guide scan focus, report breadth, candidate grouping, and route
recommendations. Work now reports up to three immediate candidates. Prepare
issues and Both report all supported findings inside the declared depth
coverage; Both emphasizes up to three immediate Action candidates. Report only
uses the normal level breadth, opens the report, and stops without starting the
candidate triage loop. The user can later resume by candidate ID or request
triage.

No quick-start answer authorizes implementation, agent writes, or remote issue
creation. Preserve the normal conversational fallback when `question` is
unavailable. Do not ask again for an area or outcome that the user already gave.

Interpret an explicit breadth request before applying level defaults. Examples
include a requested count, “a few to work on now,” “exhaustive,” “all supported
findings,” and “prepare issues.” The explicit request controls the number of
reported candidates inside the declared scan coverage. Without an explicit
breadth request:

- `low` reports up to three localized quick wins;
- `medium` reports a small ranked set of coherent bounded candidates;
- `high` reports all supported findings in its broad declared coverage and
  emphasizes the top three; and
- `max` reports all supported findings plus scanned areas with no supported
  finding, declared exclusions, and evidence gaps.

Scale analysis effort with improvement depth and the host's available support:

- `low` uses the direct parent by default and permits one bounded read-only scan
  only for a specific evidence gap;
- `medium` permits up to two disjoint read-only scans, then the parent coalesces
  the evidence into smaller lifts;
- `high` permits up to four parallel read-only lanes across modules, history,
  tests, or patterns, then the parent synthesizes one report; and
- `max` uses bounded waves of disjoint read-only lanes within the host spawn
  budget and records every lane that could not run.

The parent remains the orchestrator and architecture decision owner. A missing
subagent capability reduces coverage and is recorded. It never causes an
unbounded fallback. For `high` and `max`, use `AskClaude` exactly once per
`/improve` run when it is available to the selected parent and target repository
network, privacy, and source-disclosure rules permit the handoff. Give it the
fixed initial candidate report as a read-only second-opinion task. Record
agreements and disagreements. A later Deepen pass does not call AskClaude again;
mark revised candidate evidence as not rechecked by the second opinion. Skip the
call and record the reason when disclosure rules prohibit it. AskClaude cannot
change scope, implementation authority, repository standards, or Go practice.

For Go source, modules, Go CLIs, or Go-specific work, load and follow the
installed `go` skill before generic architecture guidance, read-only lane
findings, and any Go subagent handoff. Load `cobra-viper` only for Cobra or Viper
commands, flags, or CLI configuration. The parent resolves the applicable Go
constraints first and includes them in every Go lane and second-opinion brief.
Each capable lane also loads the installed `go` skill. A lane that cannot load
it returns evidence only and does not make a Go-specific recommendation.

Target repository standards and the installed Go skills are constraints for all
findings and for the AskClaude second opinion. The parent rejects conflicting
advice instead of blending it into the report. If an applicable Go skill is
unavailable, record the unmet method and use bounded target repository Go
standards. If neither source exists, report the unsupported Go method and do not
publish a Go-specific candidate. Do not claim that an unavailable skill loaded.

After the user reads the report, triage one candidate at a time in report order,
unless the quick-start outcome is Report only, the user stops, or the user names
a subset. A later request can resume triage by candidate ID. Mirror the available
choice in every candidate's report article. For each candidate in an active
triage loop, ask one authoritative terminal question with four explicit options:

1. **Action — `<recommended route>`.** Name and explain the proportionate route:
   `implement`, planning, or Shape then planning. Start that workflow in a new
   pane agent when Herdr or an equivalent pane-capable orchestration surface is
   available. Include the candidate evidence and all resolved language-specific
   constraints in the route brief. The route retains its own approvals. Action
   selection does not bypass Shape approval, whole-plan approval, review, or
   publication gates.
2. **Track — `<detected tracker or draft only>`.** Always show Track. Name the
   detected Linear, GitHub, Jira, or other supported tracker. If no tracker
   capability exists, label the option `Track — draft only`. Prepare a complete
   issue draft from the candidate evidence. Show the exact tracker, project or
   repository, title, body, labels, and candidate grouping before a separate
   remote-creation confirmation.
3. **Won't do.** Record the choice only in the ephemeral report. Do not start
   work, create an issue, write an ADR, or mutate the target repository.
4. **Deepen.** Run another bounded review of the candidate's seam, module
   structure, evidence, or alternatives. Preserve the candidate ID, update the
   report revision, and ask the candidate question again. Each Deepen pass uses
   the remaining analysis and support budget for the selected improvement depth.
   When that budget is exhausted, offer a new explicit depth request instead of
   silently widening the scan or spawning more support.

Use the `question` tool's built-in custom response for **Other** direction. Do
not add a duplicate Other option. Apply the user's direction, update the report,
and re-ask only when a new decision remains. If `question` is unavailable,
present the same options and accept a free-form custom direction in conversation.

For Action, use the candidate's evidence, impact, reversibility, dependencies,
and uncertainty to select the route. Launch a bounded route asynchronously in a
new pane when safe so the parent can continue triage. A writer gets one isolated
worktree. Multiple action routes can run in parallel only after the parent or
planning proves independence, non-overlapping ownership, and integration points.
Coordinated candidates share one planning route. If pane orchestration is
unavailable, use the normal current-session handoff and state the fallback.

For Track, detect target repository instructions, tracker metadata, and an
installed tracker capability before asking the candidate question. Track remains
visible when no capability exists and degrades to draft-only output. If tracker
selection is ambiguous, label the option `Track — choose tracker` and ask the
user after selection instead of guessing. Never put a local temp path in a remote
issue. Remote issue text must contain the evidence needed to understand the
candidate without the report.

Each Track selection queues one complete draft but creates nothing. After the
triage loop ends, or when the user asks to create the queued issues, show the
exact bounded draft set and ask for one batch confirmation. Approval applies
only to that displayed set. A changed draft or target requires a new
confirmation.

After each answer, update the same report path with the decision status and let
the browser reload. Continue until each in-scope candidate has a decision or the
user stops the triage loop.

This feature is one dependent delivery unit on top of
`feat/improve-depth-levels`. The pitch and plan share the implementation pull
request because they have no independent merge value.

### Interface evidence

- **Person and task:** A developer or maintainer has completed an architecture
  scan and must understand evidence, choose work, or prepare tracker issues.
- **Surface mode:** A served local HTML report is the reading and triage surface.
  The Pi terminal is the authoritative decision and mutation surface.
- **Design authority:** Target repository instructions and domain vocabulary
  come first. The package-owned HTML report contract is the durable interface
  authority.
- **Desired feel:** Calm, technical, editorial, and decisive. Use a restrained,
  VS Code-informed editor palette in both themes: neutral canvas and panel
  tones, desaturated blue accents, and muted semantic colors. Avoid neon color,
  glow, decorative saturation, dashboard-card repetition, and superfluous
  helper text. Give evidence the rhythm of a human-readable architecture brief
  that can be printed or shared. The interface must remain readable during
  exhaustive high-depth and max-depth reviews.
- **Focal workflow:** Verify coverage, inspect ranked evidence, compare current
  and proposed architecture, then answer the mirrored terminal question for
  each candidate. The report updates while pane agents, issue drafts, or deeper
  reviews start.
- **Representative states:** Generating, partial update, complete report,
  awaiting decision, action started, issue draft pending, won't do, deepening,
  no supported findings, CDN unavailable, server unavailable, and stale or
  expired temp report.
- **Responsive and accessibility constraints:** Desktop uses the Blueprint
  Ledger index and evidence canvas. Narrow screens stack the index, candidates,
  and decision section. Native controls, keyboard access, focus visibility,
  contrast, text alternatives, reduced motion, and print remain required.
- **Operation needs:** `frontend-design` supplies the accepted direction.
  Implementation uses the normal Engineering TDD and review workflow, followed
  by browser-based visual validation at desktop, mobile, and print sizes.
- **Chosen direction:** Blueprint Ledger, selected from three image-backed
  directions and refined with verified light, dark, editorial, and per-finding
  decision states. Its signature is the live coverage rail joined to stable
  candidate IDs and a mirrored terminal decision section. Candidate evidence
  reads as one vertical editorial article. The report mixes Mermaid for
  graph-shaped relationships with custom HTML, CSS, and SVG for
  architecture-specific visuals.
- **`DESIGN.md` disposition:** Do not create a repository-wide `DESIGN.md`. Keep
  the durable report design contract with the owning skill because the report
  is a package resource used in unrelated target repositories.

## Boundaries and no-gos

- Keep generated reports and server state in the OS temp directory. Do not write
  report artifacts to the target repository.
- Do not turn the Engineering package into a runtime extension for this feature.
- Do not make the browser report an authority boundary. Only terminal approval
  can start work or mutate an issue tracker.
- Do not assume GitHub, a named subagent, `AskClaude`, another package, or an
  issue-tracker capability is installed.
- Do not let ordinary child agents orchestrate fanout or make architecture
  decisions.
- Do not exceed the host spawn budget. Do not claim exhaustive coverage beyond
  the declared scan boundary.
- Do not let AskClaude, read-only lane findings, or generic architecture advice
  override target repository standards, the installed `go` skill, or applicable
  `cobra-viper` guidance. Skip AskClaude when target repository network, privacy,
  or source-disclosure rules prohibit the handoff.
- Do not create remote issues without explicit approval. Do not include local
  absolute paths or confidential report metadata in remote issues.
- Do not add CDN fallbacks that download, vendor, or commit generated assets.
- Do not merge, release, deploy, clean up unrelated worktrees, or change
  repository settings.

Reshape if safe live serving requires a production extension, if tracker
creation cannot preserve explicit mutation approval, or if the report needs
persistent state outside its temp run directory.

## Decision-changing research and risks

- The upstream HTML report and skill were inspected at commit
  `321658273cb1d20b76026717d027d505790106d4`. The local report adapts the
  before-and-after visual grammar and temp-file lifecycle, but adds live serving,
  exhaustive breadth, stable IDs, terminal handoff, and issue triage.
- CDN JavaScript executes in the report page and can read its contents. The user
  accepted Tailwind and Mermaid CDNs. Pinned versions, no-referrer requests,
  strict Mermaid mode, input escaping, and target repository network rules
  reduce but do not remove this trust decision.
- OS cleanup can remove a report between prompts. The skill must detect a missing
  artifact and regenerate it with a new path instead of claiming that the old
  URL remains available.
- Exhaustive reports can become difficult to scan. The coverage rail, filters,
  stable IDs, grouped findings, and top-three emphasis keep the report usable
  without hiding supported findings.
- A live helper can outlive the immediate terminal turn. Loopback binding,
  single-report routing, parent cleanup, and a bounded maximum lifetime limit
  the process and exposure.

## Review evidence

- **Applicability:** Go-targeted. The pitch changes Go-specific discovery,
  subagent, and second-opinion precedence.
- **Fixed document:** `docs/features/improve-html-report/pitch.md` at SHA-256
  `a36788b225170994e36128b9d435b5a407244ecd147d1f9930cb895e3423a513`.
- **Status:** Approved. The final quick-start and report-guide fixed-document Go
  specification review found no issues or questions.
- **Invalidation:** A later change to Go precedence, AskClaude authority, report
  scope, solution boundary, or acceptance criteria requires another replacement
  review.

## Authority

The parent owns product scope, report design, architecture judgment, route
selection, tracker detection, and final synthesis. Pitch approval authorizes one
bounded pitch commit on `feat/improve-html-report` and hands the accepted intent
to planning. Whole-plan approval is required before implementation.

Execution mode preference is accept-all. This preference becomes implementation
authority only after whole-plan approval. No approval authorizes issue creation
in a target repository, merge, release, deployment, destructive cleanup, or
unrelated remote mutation.

## Observable acceptance criteria

- **AC-001 — Request-controlled breadth:** An explicit count, limited-work
  request, exhaustive request, issue-triage request, or quick-start outcome
  controls reported candidate breadth inside the declared improvement-depth
  coverage. Work now reports up to three immediate candidates. Prepare issues
  and Both report all supported findings, with Both emphasizing up to three
  immediate Action candidates. Report only uses the level default.
- **AC-002 — Level defaults:** Without explicit breadth, `low`, `medium`, `high`,
  and `max` use the documented level-appropriate report breadth.
- **AC-003 — Proportionate analysis:** Each depth uses the documented direct-parent
  and bounded read-only support strategy. Missing support reduces and records
  coverage without unbounded fallback.
- **AC-004 — Fixed second opinion:** `high` and `max` use at most one read-only
  `AskClaude` second opinion per `/improve` run when it is available and target
  repository network, privacy, and source-disclosure rules permit it. The report
  records agreements, disagreements, or the skip reason without transferring
  authority. Deepen does not call AskClaude again and marks revised evidence as
  not rechecked.
- **AC-005 — Go precedence:** The parent resolves target repository standards,
  installed `go`, and applicable `cobra-viper` before any Go lane, generic
  advice, or AskClaude handoff. Every brief carries those constraints. A lane
  that cannot load `go` returns evidence only. An unavailable Go skill records
  the unmet method and uses bounded target repository Go standards. If neither
  source exists, the report names the unsupported method and omits a Go-specific
  candidate.
- **AC-006 — Temp report:** Each run creates one self-contained report in a
  unique OS temp directory and does not add a report artifact to the target
  repository.
- **AC-007 — Live local URL:** When serving succeeds, the helper binds only to
  `127.0.0.1`, serves one unguessable report route, and returns the live URL and
  absolute HTML path.
- **AC-008 — Live updates:** Updating a report preserves unchanged candidate IDs,
  records per-candidate decision status, increments the revision, keeps the URL
  and path, and causes an open browser to reload.
- **AC-009 — Bounded lifecycle:** The parent can stop the helper idempotently.
  The helper also stops after a bounded maximum lifetime. Missing or unusable
  Node and any serving failure preserve a readable HTML file and report its
  path.
- **AC-010 — Blueprint Ledger:** The report implements the accepted coverage
  rail, system-aware light and dark themes, restrained editor-like palette,
  persistent index, vertical editorial candidate articles, mixed Mermaid and
  hand-built visuals, top recommendation, mirrored per-candidate decisions, and
  terminal handoff.
- **AC-011 — Complete evidence:** Every candidate includes the files, callers,
  tests, friction, proposed module and interface, before-and-after view,
  locality, leverage, test effect, impact, reversibility, overlap, integration
  points, decision conflicts, evidence strength, and route reason that apply.
- **AC-012 — Exhaustive evidence:** An exhaustive report lists every supported
  finding in its declared coverage. A max report also lists scanned areas with
  no supported finding, exclusions, and evidence gaps.
- **AC-013 — Recoverable report data:** The HTML embeds structured report data
  with stable candidate IDs and decision status so later prompts can recover
  the report state from its absolute path.
- **AC-014 — Accessible report:** The report remains usable with keyboard-only
  input, narrow screens, reduced motion, printing, and unavailable CDN scripts.
  The theme toggle has an accessible name, both themes meet contrast targets,
  diagrams have useful text alternatives, and print output removes interactive
  chrome without removing report evidence.
- **AC-015 — Safe external content:** The report uses pinned Tailwind and Mermaid
  CDN resources, no-referrer requests, strict Mermaid mode, and escaped
  repository-derived content. Target repository network rules can disable CDN
  use.
- **AC-016 — Per-candidate terminal authority:** Each candidate article mirrors
  Action, Track, Won't do, and Deepen options. An active triage loop asks one
  matching terminal question per candidate. Report only stops after opening the
  report; a later request can resume by candidate ID. The `question` tool's
  built-in custom response supplies Other direction. Browser controls cannot
  start work or create issues.
- **AC-017 — Action routing:** Action names and explains the proportionate
  `implement`, planning, or Shape route. Its brief includes candidate evidence
  and resolved language-specific constraints. It starts a bounded pane agent
  through Herdr or an equivalent capability when available, without bypassing
  route approvals. The fallback uses the current session. Parallel writers
  require proven independence and isolated worktrees.
- **AC-018 — Tracker triage:** Track is always available. It names the detected
  Linear, GitHub, Jira, or other supported tracker, or states `draft only`, then
  queues a self-contained issue draft without creating it. After triage, one
  explicit confirmation applies only to the exact displayed bounded draft set;
  changed drafts or targets require a new confirmation.
- **AC-019 — Tracker fallback:** Ambiguous tracker selection is labeled and asks
  the user after Track selection. An unavailable tracker capability returns
  complete issue drafts. Remote issue text never depends on a local report path.
- **AC-020 — Guided non-action paths:** Won't do performs no repository or
  tracker mutation. Deepen consumes the remaining selected-depth analysis and
  support budget, updates the same candidate, and asks again. Exhausted budget
  requires a new explicit depth request. A custom direction is applied without
  guessing. No-finding, partial-coverage, missing support, unavailable Go skill,
  skipped AskClaude, expired report, CDN failure, and server failure states
  remain useful and honest.
- **AC-021 — Independent package:** The Engineering package works without another
  local package, named agent, `AskClaude`, or tracker skill. Conditional
  capabilities use explicit fallbacks.
- **AC-022 — Attribution and documentation:** The skill ships and links its
  sibling `HTML-REPORT.md` teaching guide. The owning README, resource tests, and
  third-party notice document the live report, depth effort, triage paths, CDN
  trust, and pinned upstream source.
- **AC-023 — Verification:** Focused tests cover report guidance and helper
  behavior. Source and packed smoke checks pass. Manual Pi reload acceptance
  proves the updated skill and report resources load once without stale state.
- **AC-024 — Visual validation:** Desktop, mobile, and print browser checks
  verify the accepted Blueprint Ledger editorial hierarchy, system-default
  theme, light and dark overrides, live update, keyboard path, mixed diagram
  treatment, per-candidate decision mirror, CDN-failure readability, and
  no-finding state.
- **AC-025 — Adaptive quick start:** If no specific area is requested, one
  bounded parent-only orientation detects supported focus evidence, tracker
  capability, and pane-agent capability without writes or support lanes. One
  terminal prompt then asks the unresolved focus and outcome questions with the
  documented options. Capability labels distinguish detected tracker, choose
  tracker, and draft-only states, and detected pane support from current-session
  fallback.
- **AC-026 — Quick-start authority:** Focus and outcome answers guide discovery,
  breadth, grouping, and recommendations. They never authorize implementation,
  agent writes, or issue creation. Already answered questions are not repeated,
  and the conversational fallback preserves the same choices.
