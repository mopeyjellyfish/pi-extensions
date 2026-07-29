---
schema: feature-flow-pitch/v2
feature: ai-feature-flow
status: accepted
revision: 13
---

# AI-first feature flow

## Problem

Feature work has repository guidance for authoring, testing, and review, but no
canonical parent-led flow from a shaped product problem through accepted scope,
reviewed implementation plans, and verified delivery. Models also repeat
mechanical parsing, lifecycle, path, Git, dependency, and acceptance-criterion
coverage checks. That wastes reasoning and can produce different answers for
identical artifacts.

Users need an independently installable Pi skill package that keeps product
questions and quality judgments with the parent, human, and fresh specialist
roles while one deterministic helper owns mechanical artifact facts. A user
should invoke `feature-pitch`, `feature-plan`, and `feature-build` in order,
accept the complete pitch once, and be interrupted afterward only by a genuinely
new pitch-level decision.

## Solution

### Product surface and artifacts

Ship `@mopeyjellyfish/pi-feature-flow` as a `0.0.0` skill-only package with
exactly three parent-facing skills and one Node-standard-library helper. It
ships no Pi extension, agent definitions or custom agents, service, database,
daemon, runtime npm dependency, provider selection, or persistent workflow
state.

Canonical pitches live at `docs/features/<feature>/pitch.md`. A pitch uses
`feature-flow-pitch/v2`, contains only `Problem`, `Solution`, `Rabbit holes`,
`No-gos`, and `Acceptance criteria`, and defines the evergreen product rather
than its delivery decomposition. Plans live at
`docs/features/<feature>/plans/<NNN-slice>.md`, pin the accepted pitch revision,
and trace its acceptance criteria.

The package helper exposes only:

- `validate-pitch` for canonical pitch structure and values;
- `validate-plans` for an accepted pitch and its complete plan set;
- `status` for bounded artifact readiness and current Git facts;
- `pitch` for legal `draft`, `ready`, and `accepted` transitions; and
- `plans` for legal whole-set `draft` and `reviewed` transitions.

The helper strictly validates frontmatter, canonical paths, statuses, revisions,
plan filenames, pitch pins, serial plan dependencies, and literal acceptance-
criterion coverage. It emits bounded JSON on success and bounded exact
path/reason errors on failure, validates prospective transitions before writes,
restores earlier ordinary plan writes when a later write fails, and increments a
revision only for an explicit semantic revise transition. It never judges
product quality, scope, review, acceptance, feasibility, plan quality, TDD
quality, implementation, or whether a finding is pitch-level.

### Pitch behavior

The parent preflights required capabilities and inspects helper-reported Git and
artifact facts. A fresh read-only builtin `scout` gathers repository evidence;
a fresh builtin `researcher` is used only when external evidence would
materially reduce uncertainty. The parent then uses its own `question` companion
to grill the user in small decision clusters with recommended answers and
tradeoffs, examples and counterexamples, edge and failure cases, and teach-back.
It challenges breadth, speculative flexibility, abstractions, and optional
behavior, moving cuts into `No-gos` until the smallest useful product solution
is explicit.

The parent does not launch the named `worker` that writes the canonical pitch
or the final named `reviewer` until the user confirms the parent's synthesis
is materially complete and accurate. That confirmation closes discovery; it is
not another approval gate. The reviewer is fresh and read-only and challenges
product value, scope, feasibility, and simplicity. Routine blockers use one
fresh serial fix worker followed by complete validation and another fresh
review.

Only a fresh blocker-free complete pitch transitions to `ready`. The parent
shows the entire pitch through `question` with one choice named `Approve pitch`;
only that choice permits `accepted`. A later semantic pitch edit explicitly
returns it to `draft`, increments its revision, and repeats complete review and
human acceptance.

### Planning and build behavior

Planning starts only after the evergreen pitch is accepted. One fresh named
`worker` creates the smallest complete serial TDD plan set, the helper validates
its deterministic contract, and one fresh read-only named `reviewer` judges
the whole set for scope, feasibility, simplicity, and TDD quality. Routine fixes
and re-review are automatic; only a blocker-free review permits `reviewed`.
Plans have no human approval gate.

Build fails closed unless the helper confirms the accepted pitch and complete
reviewed plan set before Worktrunk, todo, reasoning, or writer side effects and
again from the routed worktree. The parent delivers one reviewed plan at a time
through a fresh named worker's observable Red, smallest Green, and bounded
Refactor, then a fresh read-only named reviewer. Routine blockers use one
fresh serial fix worker, focused revalidation, and another fresh review.

The parent performs deterministic Pi discovery, focused tests, idle reload,
changed-skill dogfood, source smoke, repository and security checks, and bounded
acceptance-criterion evidence. It performs source-control actions only when
already authorized; otherwise it leaves an uncommitted reviewed ready diff.

### Orchestration and decision ownership

Every scout, researcher, worker, fix worker, and reviewer runs in a fresh async
one-item task with explicit routed cwd, progress suppression, concurrency one,
a recorded run ID, and a same-run terminal barrier proving complete lifecycle
and observed process termination. Preflight requires compatible named `worker`
and `reviewer` roles: the worker is the sole writer and the reviewer operates
read-only. Either role may be a Pi builtin or an existing project/user
override; a compatible override is never rejected merely for its discovery
scope. The
package ships no agent definitions or custom agents. Builtin `scout` remains
read-only, and builtin `researcher` remains conditional. Roles are added for
evidence or work rather than headcount, and failed runs never auto-resume or
overlap.

The parent owns every human question and final classification. A new pitch-level
product, scope, architecture, risk, or non-negotiable decision stops for the
user. Changed pitch content restarts revision, complete review, acceptance, and
planning; confirmation that the accepted pitch is unchanged resumes with
bounded parent evidence. Git status, artifact statuses, and monotonic revisions
are the audit trail.

## Rabbit holes

- **Model-owned parsing:** one tested Node-standard-library helper owns
  mechanical parsing, validation, transitions, and bounded Git facts.
- **A Pi extension or service:** a package-shipped script is sufficient and has
  no lifecycle resource.
- **Generic frameworks:** five direct commands cover the fixed workflow; no CLI,
  schema, YAML, scheduler, state-machine, or Git abstraction is needed.
- **Helper-owned judgment:** helper success remains a fact, never semantic
  review or human acceptance.
- **Extra roles:** builtin scout and materially necessary researcher plus the
  compatible named worker and reviewer cover the workflow without package-
  shipped agent definitions, custom agents, or headcount roles.
- **Artifact receipts or project tracking:** Git facts, lifecycle statuses,
  revisions, session todo, and bounded conversation evidence are sufficient.
- **Multiple writers or automatic recovery:** one fresh writer and one fresh
  review at a time keep ownership and failure handling explicit.
- **Automatic publication:** source-control completion remains authorization-
  aware and follows successful checks.

## No-gos

- No production extension, agent definition, custom agent, registered tool,
  service, database, daemon, runtime dependency, or provider/model
  configuration.
- No legacy `feature-flow-pitch/v1` compatibility, alternate pitch headings,
  estimates, or delivery decomposition in the canonical pitch.
- No CLI/schema/YAML framework, generic workflow engine, scheduler, Git
  abstraction, receipt, hash, backlog, progress artifact, or persistent state.
- No model reimplementation of helper parsing, paths, transitions, Git facts,
  plan pins, dependencies, filenames, or acceptance-criterion coverage.
- No helper judgment of semantics, scope, feasibility, review, acceptance, plan
  quality, TDD quality, implementation choices, or pitch-level classification.
- No writer before synthesis confirmation, no parallel writers, no parallel
  plan delivery, and no automatic failed-run recovery.
- No extra pitch approval gate, human plan acceptance, or mandatory final-
  feature question.
- No implementation before complete-pitch acceptance and a complete validated,
  blocker-free reviewed plan set.
- No credentials, destructive cleanup, publication, or unauthorized
  commit/push/merge/pull-request action.

## Acceptance criteria

- **AC-001:** `@mopeyjellyfish/pi-feature-flow` is an independently installable
  `0.0.0` skill package, release-registered and root-discoverable, with exactly
  three skills, one shipped Node-stdlib helper, and no Pi extension, agent
  definitions, custom agents, service, database, CLI framework, or runtime
  dependency.
- **AC-002:** The helper exposes only `validate-pitch`, `validate-plans`,
  `status`, `pitch`, and `plans`; every command emits bounded machine-readable
  output, fails nonzero with exact paths/reasons, and does not decide semantic
  quality or acceptance.
- **AC-003:** Executable helper tests prove `feature-flow-pitch/v2`, its exact
  five headings, exact frontmatter fields, statuses, feature paths, plan
  filenames, bounded Git status/diff summaries, and no mutation on validation
  failure; template tests also prove pitch delivery decomposition and estimates
  are absent.
- **AC-004:** Executable helper tests prove legal pitch/plan transitions,
  status-only stability, explicit-only revision increments, accepted-pitch
  status/revision checks, plan pitch pins, and pitch-revision invalidation.
- **AC-005:** `feature-pitch` uses a fresh builtin scout, conditionally uses the
  builtin researcher, and keeps the parent-owned grilling loop, repository and
  external evidence, smallest-useful-solution shaping, rabbit-hole discovery,
  blocker resolution, and quality review in reasoning while delegating all
  mechanical artifact checks and transitions to the helper.
- **AC-006:** The pitch writer and final reviewer start only after the user
  confirms the parent's synthesis is materially complete and accurate; only a
  fresh blocker-free complete pitch is shown to the human, `accepted` is set
  only after `Approve pitch`, and a later semantic edit increments revision,
  returns to `draft`, and repeats full review/acceptance.
- **AC-007:** `feature-plan` requires a helper-validated evergreen accepted
  pitch, reasons about the complete serial TDD plan set, and uses helper
  validation to enforce unique IDs, canonical filenames, direct serial
  dependencies, matching pitch revision, and literal complete pitch-AC
  coverage.
- **AC-008:** Plans remain automated: deterministic failures are fixed, a fresh
  reasoning reviewer judges the whole set, explicit revise transitions precede
  semantic fixes, and only a blocker-free review authorizes the whole-set
  `reviewed` transition without a human plan gate.
- **AC-009:** `feature-build` runs helper status/readiness checks before
  Worktrunk, todo, or writer side effects, then routes one dependency-ready plan
  at a time through worker Red/Green/Refactor and fresh adversarial review.
- **AC-010:** All three skills preserve parent ownership of pitch-level
  decisions; use compatible capability preflight; accept compatible named
  `worker` sole-writer and named read-only `reviewer` roles whether discovered as
  Pi builtins or existing project/user overrides; and preserve fresh async one-
  item serial runs with item-level progress suppression and verified wait/status terminal barriers
  without overlapping writers, headcount roles, package-shipped agent
  definitions/custom agents, or automatic recovery.
- **AC-011:** A new pitch-level finding always stops for the user; changed pitch
  content restarts review/acceptance and regenerates all plans, while unchanged
  confirmation resumes with bounded evidence. Routine plan/build judgments and
  fixes proceed automatically.
- **AC-012:** Final evidence covers focused tests, deterministic Pi
  discovery/reload/dogfood, source smoke, repository checks, changed files,
  test/review results, residual risks, and authorization-aware source-control
  state without mutating reviewed plans or adding persistent workflow state.
