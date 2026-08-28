---
status: accepted
---

# Plan: Live architecture improvement report

Complete this delivery plan before implementation. It covers the full accepted
pitch in `docs/features/improve-html-report/pitch.md`.

## Review evidence

- **Applicability:** Go-targeted guidance. The plan changes future Go discovery,
  lane, second-opinion, and route briefs without proposing Go source, a Go
  module, or a Go CLI.
- **Fixed document:** `docs/features/improve-html-report/plan.md` at SHA-256
  `1b19d87f683d59b38cfb33c7be03d8a8cf7054f79df768556c8bf3c960087a2b`.
- **Status:** Approved. The replacement review found no issues or questions. Two
  advisory post-review edits only added an assertion for the existing negative
  Go trigger and an earlier lint command; they do not change reviewed intent.
- **Invalidation:** A change to the proposed solution, delivery boundary,
  authority, Go or Cobra/Viper routing, or acceptance criteria requires one
  replacement review. Wording-only, proof-strengthening, and review-evidence
  edits do not.

## Execution mode

Use **accept-all implementation** after whole-plan approval. Approval authorizes
bounded implementation, verification, commits, and later pull-request
publication for this named plan on `feat/improve-html-report`. It does not
authorize merge, release, deployment, destructive cleanup, issue creation in a
target repository, or unrelated work. Pause for a material forecast variance,
new security or privacy risk, changed delivery boundary, or changed authority.
Only a delivery-boundary or authority change requires fresh approval.

## Delivery topology

| Delivery unit | Topology        | Stack position | Branch                     | Pull request base           | Dependencies                  | Checks                                                                                                                                     | Ownership                                                                                                                              | Integration point                                                     | CI fan-out     | Cascade cost                                                                                                                 |
| ------------- | --------------- | -------------- | -------------------------- | --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1             | dependent stack | 2/2            | `feat/improve-html-report` | `feat/improve-depth-levels` | PR #108 and commit `f2b2348b` | focused Engineering tests; helper integration tests; source and packed smoke; `npm run check`; manual Pi reload; browser visual validation | one serial writer in `/Users/david/code/personal/pi-extensions.feat-improve-html-report`; parent owns synthesis and final verification | updated Engineering package loaded alone and through the root profile | 1 pull request | medium: a base-branch change to the same skill, prompt, tests, or README can invalidate all focused and integration evidence |

This plan has one delivery unit, one task branch, and one stacked pull request.
The pitch and plan share the implementation publication boundary because they
have no independent merge value. Do not create more branches or pull requests
for the four serial slices. Publish with `open-pr` against
`feat/improve-depth-levels`; do not merge or restack PR #108.

## Critical path, dependencies, and lanes

The critical path is:

1. Verify the task worktree, Node and Go selectors, lockfile fingerprint, and
   package dependency setup.
2. Add the tested sibling report guide and package-resource contract.
3. Add the tested loopback report helper and live-reload lifecycle.
4. Integrate adaptive discovery, report generation, triage, tracker drafts, and
   route handoffs in the skill and prompt.
5. Document the public behavior and complete real Pi and browser acceptance.
6. Freeze the diff, run selected QA and formal review concurrently, apply one
   joined repair packet if needed, then rerun invalidated proof and final gates.
7. Commit the stable delivery unit and publish its one stacked pull request.

Use one active implementation lane. The guide, helper, skill, tests, README, and
notice share package contracts and final acceptance, so parallel writers would
add conflict without independent merge value. Read-only QA and Reviewer lanes
can run concurrently only after the implementation diff is frozen. The parent
integrates their evidence and remains the architecture and acceptance owner.

Setup must use `.nvmrc`, `.gvmrc`, and the root lockfile:

```sh
nvm use
source "$HOME/.gvm/scripts/gvm"
source .gvmrc
npm ci --ignore-scripts
```

Record a setup fingerprint from `.nvmrc`, `.gvmrc`, and `package-lock.json`.
Reuse setup only while that fingerprint and inherited tools match. A setup
failure is not a red test and must be diagnosed separately.

### Critical-path forecast

- **Active writer lanes:** 1 serial lane.
- **Delivery units / pull requests:** 1 / 1, stacked on PR #108.
- **Integration points:** the installed `improve-codebase-architecture` skill,
  its sibling `HTML-REPORT.md`, the report-server CLI, `/improve`, and the packed
  Engineering package.
- **Expensive gates:** `npm run check`, source and packed smoke, a deterministic
  Pi reload session, and desktop/mobile/print browser validation.
- **Likely cascade cost:** medium if PR #108 changes the same package resources;
  low for changes outside the Engineering package.

### Invalidation map

- A change to `HTML-REPORT.md` invalidates its resource assertions, packed-file
  proof, real report generation, and all visual evidence derived from it.
- A change to the report helper invalidates helper unit/integration tests, live
  reload, lifecycle, fallback, and browser integration evidence.
- A change to `SKILL.md` or `prompts/improve.md` invalidates architecture-route
  resource tests and manual `/improve` acceptance. A Go-routing change also
  invalidates the fixed-document plan review if it changes this plan's contract.
- A change to the embedded report-data or candidate-ID contract invalidates
  helper integration, resume-by-ID, report update, and tracker-draft proof.
- README or notice-only edits invalidate documentation lint, attribution checks,
  package tests, and packed smoke, but not helper behavior unless they expose a
  contract mismatch.
- Any final repair reruns the narrow proof for its slice and every downstream
  integration proof. Any production-resource or helper change after the frozen
  gate reruns `npm run check`, source smoke, packed smoke, and the affected
  manual acceptance.
- A rebase that changes the base versions of the Engineering skill, prompt,
  tests, package scripts, or command definitions invalidates all reused focused
  and stable-unit evidence.

Pause if implementation needs a production extension, persistent non-temp state,
a package dependency, a non-loopback server, browser-side mutation authority,
more than one writer, or a second delivery unit.

## [ ] 001 — Ship the Blueprint Ledger report teaching guide

### Outcome and requirement trace

The independently installable Engineering package contains one sibling
`HTML-REPORT.md` that teaches an agent to generate the accepted Blueprint Ledger
report. `SKILL.md` links to it with a relative Markdown link and does not duplicate
its rendering rules. The guide follows the upstream two-file teaching pattern
while preserving the accepted local editorial design, security, accessibility,
and decision-state additions.

Trace: AC-006, AC-010 through AC-015, AC-021, and AC-022.

### Seam and files

Public seam: package resource resolution from
`skills/improve-codebase-architecture/SKILL.md` to
`skills/improve-codebase-architecture/HTML-REPORT.md`.

Likely files:

- `packages/engineering/skills/improve-codebase-architecture/HTML-REPORT.md`
- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/test/resources.test.ts`
- `packages/engineering/THIRD_PARTY_NOTICES.md`

The guide must contain:

- a complete semantic `<!doctype html>` scaffold and required report-data block;
- exact, verified, version-pinned Tailwind browser and Mermaid ESM CDN URLs;
- strict Mermaid configuration, escaped untrusted text, no-referrer requests,
  and a readable no-CDN semantic fallback;
- the Blueprint Ledger header, coverage rail, persistent candidate index,
  filters, editorial candidate article, top recommendation, and terminal handoff;
- stable candidate IDs, report revision, decision status, second-opinion status,
  and recoverable structured data;
- system-default light/dark behavior, pre-paint override, visible focus, WCAG 2.2
  AA contrast, reduced motion, narrow layout, text alternatives, and print rules;
- Mermaid only for graph-shaped dependencies, call flows, and sequences;
  hand-built HTML, CSS, and inline SVG for module depth, mass, cross-sections,
  and collapse views; and
- generating, partial, complete, report-only, awaiting decision, action started,
  issue draft pending, won't do, deepening, no-finding, CDN failure, server
  failure, and stale-report states.

Do not add a repository-wide `DESIGN.md`.

### Dependencies

Accepted pitch and Blueprint Ledger interface evidence. No prior implementation
slice.

### Execution lane and ownership

`serial`. One writer owns the listed files in the active task worktree. The
parent supplies accepted design evidence and reviews the generated guide.

Use `frontend-development` for the accepted report contract and
`codebase-design` vocabulary for modules, interfaces, seams, Depth, locality,
and leverage. Do not use `react-interface`; this is not a React surface.

### Red proof

First extend `resources.test.ts` so the focused test fails because:

- the packed package does not contain `HTML-REPORT.md`;
- `SKILL.md` does not link to it;
- the guide does not contain the full scaffold, exact pinned CDN imports,
  structured report data, mixed diagram taxonomy, accessibility, print, failure,
  and decision-state guidance; and
- the notice does not attribute the pinned upstream `HTML-REPORT.md` source at
  commit `321658273cb1d20b76026717d027d505790106d4`.

The red proof is the intended assertion failure, not a setup or network failure.

### Green proof and checks

Add the minimum complete guide, link, and notice update. Run Prettier on the guide
before finalizing semantic resource assertions; do not make tests depend on
embedded-code whitespace that Prettier can change. Verify:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
```

Also extract the guide's canonical HTML scaffold to an OS temp file and inspect
it without committing the artifact. Confirm that graph and architecture-specific
visual methods both appear. A guide or scaffold edit invalidates this slice's
focused and visual proof.

### Atomic commit and pull request

Atomic commit: `feat(pi-engineering): add architecture report guide`.

Delivery unit 1. Do not publish yet. The pull-request base remains
`feat/improve-depth-levels`, stack position 2/2.

### Done when

- The focused resource test fails for the intended missing resource, then passes.
- The package dry run contains `HTML-REPORT.md`.
- The guide is self-contained, repository-neutral, linked once, and attributed.
- Tailwind and Mermaid have distinct, proportionate roles; Mermaid is not the
  default for every visual.

## [ ] 002 — Serve one live report with a bounded Node helper

### Outcome and requirement trace

A package-owned Node CLI starts and stops one loopback-only report server. It
serves only the named HTML report at an unguessable route, injects a same-origin
live-reload client into the served response, reports startup state as bounded
JSON, reloads an open page after an atomic report update, and stops idempotently
or at a fixed maximum lifetime. The report file remains directly readable when
Node or serving is unavailable.

Trace: AC-007 through AC-009, AC-013, AC-015, AC-021, and AC-023.

### Seam and files

Public CLI seam:

```text
node report-server.js start --report <absolute-html-path> --state <absolute-state-path> --max-age-ms <bounded-ms>
node report-server.js stop --state <absolute-state-path>
```

`start` writes the complete mode-0600 state file and prints the same one bounded
JSON record to standard output as its only normal output. The record contains
the report path, live URL, expiry, and state path. The helper is a CLI resource,
not extension output. It then leaves a detached child that owns the server.

`stop` uses a separate shutdown secret from the state file and never kills an
unverified PID. A missing process or stale state is a successful idempotent stop.
An unreachable live process returns a bounded failure, preserves the state, and
states the known expiry; it never claims cleanup. The two-hour default maximum
lifetime is residual safety, not a substitute for confirmed `/reload` cleanup.
Tests can use a shorter bounded lifetime.

HTTP seam:

- one tokenized report route;
- one tokenized same-origin event route using server-sent events;
- a private shutdown route authenticated from the state file;
- `Cache-Control: no-store`, `Referrer-Policy: no-referrer`,
  `X-Content-Type-Options: nosniff`, correct content types, and 404 for every
  other route; and
- no directory listing, arbitrary file parameter, remote bind, or browser
  mutation endpoint.

Use periodic file-stat checks behind the SSE route instead of platform-specific
file-watch semantics. Inject only the relative EventSource reload snippet into
the HTTP response. Do not modify the standalone HTML file to make live reload
work.

Likely files:

- `packages/engineering/skills/improve-codebase-architecture/scripts/report-server.js`
- `packages/engineering/test/report-server.test.ts`
- `packages/engineering/test/resources.test.ts`

### Dependencies

Slice 001 defines the HTML and report-data contract. The helper must not parse or
rewrite candidate evidence.

### Execution lane and ownership

`serial`. The same sole writer continues in the active task worktree. Do not run
a helper test concurrently with another writer or manual report server.

### Red proof

Add focused integration tests before the helper. They must fail because the CLI
does not exist. Cover:

- absolute-path and argument validation, paths with spaces, bounded errors, and
  no secret leakage;
- one bounded startup JSON record on standard output and mode-0600 state;
- loopback bind, token route, exact report response, security headers, and 404s;
- an SSE reload event after an atomic report replacement;
- no partial response during replacement;
- idempotent stop, stale-state cleanup, unreachable-process honesty, and
  automatic expiry;
- cancellation and test cleanup so no child process survives the test;
- preserving the readable HTML path when startup fails; and
- the packed package contains `scripts/report-server.js`.

### Green proof and checks

Implement the smallest Node-built-in-only CLI and pass:

```sh
npm test -- --run packages/engineering/test/report-server.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
npm run lint
```

Inspect process and temp-state cleanup after the focused test. The test must not
use the network beyond loopback and must not depend on CDN availability. A helper
or CLI-contract edit invalidates every test and later live-reload acceptance in
this slice.

### Atomic commit and pull request

Atomic commit: `feat(pi-engineering): serve live architecture reports`.

Delivery unit 1. Do not publish yet.

### Done when

- The intended missing-CLI red proof and minimum green implementation are recorded.
- Start, reload, stop, expiry, stale state, and fallback paths pass deterministically.
- The package dry run contains `scripts/report-server.js`.
- Only the selected report and event stream are reachable.
- The standalone file remains usable without the server.

## [ ] 003 — Guide adaptive discovery, report breadth, and terminal triage

### Outcome and requirement trace

`/improve` uses the accepted depth and explicit-breadth rules, asks one adaptive
two-question quick start when no area is supplied, generates and serves the live
report, and keeps every authoritative Action, Track, Won't do, Deepen, and custom
decision in the terminal. It uses proportionate read-only support, one bounded
AskClaude second opinion where permitted, target-repository and Go precedence,
capability-aware pane routing, and queued tracker drafts with one exact-set batch
confirmation.

Trace: AC-001 through AC-005, AC-016 through AC-021, AC-025, and AC-026.

### Seam and files

Public seams:

- `/improve [low|medium|high|max] [optional scope or outcome]`;
- `improve-codebase-architecture/SKILL.md`;
- the `question` tool's focus, outcome, and per-candidate terminal questions;
- installed tracker and Herdr-or-equivalent capability detection;
- route briefs for `implement`, planning, or Shape; and
- the report path, stable candidate IDs, decision state, and queued issue drafts.

Likely files:

- `packages/engineering/skills/improve-codebase-architecture/SKILL.md`
- `packages/engineering/prompts/improve.md`
- `packages/engineering/test/resources.test.ts`

The skill must state the negative Go trigger explicitly: unrelated `go.mod` or
toolchain evidence alone does not activate Go guidance. For applicable Go work,
target-repository standards and installed `go` precede generic findings and all
lane, AskClaude, and route briefs; `cobra-viper` remains conditional on commands,
flags, or CLI configuration.

Generate every initial report and update through an atomic write: write complete
HTML to a sibling temp file, flush and close it, then rename it over the report
path. Never stream partial HTML into the served path. Before resuming by candidate
ID, verify that the report artifact still exists and contains recoverable data.
If OS cleanup removed it, regenerate the report in a new unique temp directory,
return the new path and URL, and never claim the old URL remains live.

### Dependencies

Slices 001 and 002. The skill must use their relative package resources without
assuming this monorepo, a named private agent, a tracker, AskClaude, or another
package exists in a target repository.

### Execution lane and ownership

`serial`. The same sole writer owns the skill, prompt, and focused tests in the
active task worktree. The parent owns architecture judgment and route synthesis.
Ordinary child agents remain read-only evidence lanes and do not orchestrate.

### Red proof

Extend the focused resource and prompt-expansion tests before changing the skill.
The intended failures must cover:

- empty-scope orientation and one `question` call with unresolved Focus and
  Outcome questions only;
- up to three evidence-named focus choices plus whole repository and the built-in
  custom response;
- Work now, Prepare issues, Both, and Report only breadth and stop/resume rules;
- truthful detected, choose-tracker, draft-only, pane, and current-session labels;
- `low`, `medium`, `high`, and `max` support-lane bounds and honest reduced
  coverage;
- one high/max AskClaude call, disclosure skip, fixed initial report, no second
  Deepen call, and not-rechecked state;
- unrelated `go.mod` or toolchain evidence alone does not activate Go guidance;
  target-repository, installed `go`, and conditional Cobra/Viper precedence
  applies in every applicable brief; each capable lane loads `go`; a lane that
  cannot load it returns evidence only and makes no Go-specific recommendation;
  unavailable `go` records the unmet method and uses bounded target-repository
  Go standards; if neither source exists, the report names the unsupported
  method and omits the Go-specific candidate;
- stable candidate IDs, complete evidence, exhaustive and max-only evidence,
  report path/URL, and server fallback;
- mirrored Action, Track, Won't do, Deepen, and custom direction behavior;
- Action routing, Herdr-or-equivalent pane use, current-session fallback,
  isolated writer worktrees, and independence proof before parallel work;
- complete self-contained tracker drafts, queue-only Track selection, one exact
  bounded batch approval, reconfirmation after changes, and no local temp path in
  remote text;
- no mutation authority from quick-start or browser controls;
- atomic temp-write-and-rename for every initial report and update; and
- missing-artifact detection, regeneration at a new unique path and URL, and no
  stale-URL claim before candidate-ID resume.

Update prompt expansion expectations so empty `/improve` uses `medium` depth but
asks the adaptive quick start instead of silently inferring a scope. Scoped and
level-only argument behavior must remain compatible.

### Green proof and checks

Implement the minimum complete skill and prompt guidance, then pass:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
```

Review the skill as a production resource for unrelated target repositories. It
must not contain this monorepo's paths, package assumptions, agent names other
than capability examples accepted by the pitch, or unsupported tracker commands.
Confirm that a generated update uses the documented atomic replacement and that
missing-artifact resume produces a new path. A skill, prompt, route, breadth,
report-write, stale-artifact, or Go-guidance change invalidates this slice's
focused proof and downstream manual acceptance.

### Atomic commit and pull request

Atomic commit: `feat(pi-engineering): guide live report triage`.

Delivery unit 1. Do not publish yet.

### Done when

- The focused resource and prompt tests record the intended red, then pass.
- Every accepted depth, breadth, quick-start, report, triage, tracker, route,
  fallback, and language-precedence state is explicit and deterministic.
- Report only stops after opening the report; later candidate-ID triage remains
  recoverable.
- No workflow selection silently starts work or creates an issue.

## [ ] 004 — Document and validate the complete installed experience

### Outcome and requirement trace

The Engineering README explains the public `/improve` flow and its trust and
capability boundaries. Source and packed installations load the skill, guide,
and helper once. A deterministic Pi session proves adaptive intake, report
creation, live update, terminal authority, and reload safety. Browser evidence
proves the accepted Blueprint Ledger at desktop, mobile, print, light, dark,
keyboard, reduced-motion, CDN-failure, and no-finding states.

Trace: AC-001 through AC-026, with direct live completion proof for depth,
breadth, AskClaude, Go routing, AC-022, AC-023, and AC-024.

### Seam and files

Likely files:

- `packages/engineering/README.md`
- `packages/engineering/THIRD_PARTY_NOTICES.md`
- `packages/engineering/test/resources.test.ts`
- prior slice files only when acceptance exposes a defect

Public documentation must cover:

- adaptive Focus and Outcome intake and breadth mapping;
- the live URL plus standalone temp path and bounded helper lifetime;
- system theme and manual override;
- Tailwind and Mermaid CDN trust and repository-policy disablement;
- mixed Mermaid and hand-built architecture visuals;
- terminal-only Action and tracker authority;
- Report only, candidate-ID resume, queued issue drafts, and one batch approval;
- Herdr-or-equivalent pane routing and current-session fallback; and
- Go, conditional Cobra/Viper, AskClaude, tracker, Node, CDN, and server fallbacks.

### Dependencies

Slices 001 through 003 and a frozen implementation diff.

### Execution lane and ownership

`serial` for documentation and any repairs. After the diff is frozen, run one
read-only QA lane and one read-only Reviewer lane concurrently. QA owns executable
and browser gates. Reviewer uses `code-review` against the accepted pitch and
plan and does not rerun QA commands. The parent joins findings into one repair
packet and permits at most one serial repair owner at a time.

Use `frontend-development` for final interface implementation guidance and
`visual-validation` for browser proof and the mismatch ledger. Use the accepted
Blueprint Ledger evidence in the pitch. Do not create `DESIGN.md` and do not use
`react-interface`.

### Red proof

Before documentation changes, extend resource assertions for the new README and
notice behavior and record their intended failure. Before browser acceptance,
record a mismatch ledger from the first generated report. It must list each
observed difference from the accepted direction, likely cause, priority, and
recheck target. A screenshot alone is not proof.

### Green proof and checks

Run focused and package checks first:

```sh
npm test -- --run packages/engineering/test/resources.test.ts
npm test -- --run packages/engineering/test/report-server.test.ts
npm --workspace @mopeyjellyfish/pi-engineering test
```

Then run source and packed package smoke:

```sh
npm run smoke:source
npm run smoke:packed
```

For deterministic live Pi acceptance, start Pi from this worktree with only the
Engineering package loaded:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/engineering
```

After reviewing the trust prompt:

1. Confirm the expected skill, prompt, sibling guide, and helper load without
   duplicate registrations or conflict diagnostics.
2. Run the focused automated tests before reload.
3. Enter `/reload` while Pi is idle.
4. Invoke `/improve` with no arguments. Confirm the two adaptive questions,
   evidence-named focus choices, capability-aware Outcome labels, and no mutation.
5. Choose a bounded focus and Report only. Confirm medium depth, level-default
   breadth, one temp HTML path, one loopback URL, and no automatic triage.
6. Invoke a scoped high-depth issue-triage request. Confirm all supported findings,
   fixed candidate IDs, one permitted or honestly skipped AskClaude opinion, and
   one candidate terminal question at a time. Queue a draft but do not approve
   remote creation.
7. Change one candidate decision. Confirm the same URL reloads at a higher report
   revision and unchanged candidate IDs remain stable.
8. Stop the helper twice and confirm idempotent cleanup. Also exercise the
   standalone-path fallback with serving disabled. Treat an unreachable helper
   as a failed cleanup with an honest expiry, not as success; diagnose it before
   acceptance instead of signaling an unverified PID.
9. Confirm reload or shutdown leaves no stale helper beyond the bounded process
   explicitly retained for Report only; let that process expire or stop it.

Use `playwright_browser` against the live URL. Keep screenshots, print output,
and the mismatch ledger in the OS temp directory. Verify:

- desktop at 1440×900, narrow mobile at 390×844, and print media;
- system-default theme plus light and dark overrides before paint;
- keyboard traversal, visible focus, accessible names, text alternatives, and
  reduced motion;
- one graph-shaped Mermaid example and one hand-built HTML/CSS/SVG architecture
  example without generic dashboard styling;
- live revision update and stable index position;
- blocked Tailwind and Mermaid requests with readable semantic content;
- complete, no-finding, issue-pending, won't-do, and deepening states; and
- no browser control that starts work or creates an issue.

Resolve every high- and medium-priority mismatch and rerun its target. Record any
accepted low-priority residual mismatch explicitly.

Freeze the diff. Run selected QA and formal Reviewer concurrently, repair only
practical findings, then run the full stable-unit gate on the final tree:

```sh
npm run check
npm run smoke:source
npm run smoke:packed
git diff --check
git status --short
```

Inspect the final diff for package independence, release attribution, dependency,
security, lifecycle, generated-artifact, session, temp-file, and credential
hygiene. Do not commit screenshots, report HTML, state files, processes, package
archives, sessions, trust state, or tracker drafts.

### Atomic commit and pull request

Atomic commit: `docs(pi-engineering): document live architecture reports` for
README and notice work. Acceptance repairs join the smallest owning prior commit
or use one additional scoped fix commit when they are independently coherent.

Delivery unit 1. After final verification, use `open-pr` to publish the branch as
stack position 2/2 with base `feat/improve-depth-levels`. Use a Conventional
Commit pull-request title. Do not merge, release, deploy, or create target tracker
issues.

### Done when

- Focused tests, package tests, source smoke, packed smoke, and `npm run check`
  pass on the final tree.
- Manual `/reload` proves the edited package resources load once and the new flow
  is active.
- Desktop, mobile, print, theme, accessibility, live update, mixed visual,
  CDN-failure, fallback, and no-finding evidence satisfies the mismatch ledger.
- The final diff contains only intended source, test, guide, and documentation
  files; the worktree contains no generated or runtime artifacts.
- QA and formal review have no unresolved practical finding.
- The branch is ready for one bounded stacked pull request against
  `feat/improve-depth-levels`.
