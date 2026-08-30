---
status: accepted
---

# Shape: Test effectiveness and performance discovery in `/improve`

## Problem and evidence

`/improve` can accept a test surface as its scope. It can also report a candidate's expected test effect. However, test discovery is only a short architecture guideline. The flow does not require a test specialist lane, compare branch and base CI evidence, or separate suite-wide cost from specific hot test cases.

A useful test review must protect two outcomes:

- Tests detect plausible wrong behavior through stable public seams and independent expected values.
- Tests give fast, clear, and reliable feedback locally and in CI.

Optimizing only duration can weaken defect detection. Adding tests without checking falsifiability can increase suite cost without increasing confidence. A single local run also does not explain CI performance.

The current Engineering package already has relevant methods. `test-driven-development` defines falsifiable tests, independent expected values, public seams, and narrow red-green proof. The installed `go` skill defines Go test patterns and current toolchain behavior. `/improve` must use these methods as constraints instead of replacing them with generic test advice.

The current adaptive quick start asks for focus and outcome only when no specific area is supplied. It does not let the caller select improvement depth in the same initial question. A caller who omits the leading level token silently receives `medium`, even when the rest of the intake is interactive.

## Proposed solution

Make test effectiveness and test performance first-class `/improve` discovery concerns. Keep the existing command shape and improvement-depth behavior.

Make the initial intake resolve every missing request dimension in one `question` tool call. Ask up to three separate single-select questions:

1. **What improvement depth should this review use?** Ask this when the request has no explicit leading `low`, `medium`, `high`, or `max` token. Offer the four existing levels with concise appetite descriptions and mark `medium` as the recommended default.
2. **Where should this review focus?** Keep the existing evidence-backed Focus choices. Ask only when the caller did not supply a specific scope or `find improvements`.
3. **What should this review prepare for?** Keep the existing Work now, Prepare issues, Both, and Report only choices. Ask only when the caller did not supply an outcome.

Run the initial `question` call whenever any of the three dimensions is unanswered, including a scope-only request with no explicit level or outcome. Perform lightweight orientation when the Focus question will be asked or when the caller requests agent-led `find improvements`. A request that already supplies a specific scope needs no orientation only to ask for missing level or outcome. Do not repeat a dimension that the request already answered. If `question` is unavailable, use `medium` for an unanswered improvement depth and present the other missing choices in conversation. If the user skips or cancels the intake, stop before discovery without re-prompting or silently selecting missing values. Keep the optional leading level grammar, normalization, scope rules, and reserved-token escape compatible. Update the empty prompt expansion to request the adaptive intake instead of preselecting `medium` before the question.

Test analysis remains part of normal `/improve` discovery. Do not add a test mode, command variant, or separate user-facing test toggle. An explicit test request is an ordinary scope. For broader scopes, repository evidence decides whether the adaptive test lane runs.

Use an adaptive dedicated test-analysis lane inside the normal discovery flow:

- For an explicit test, CI, coverage, flake, or test-performance scope, use one bounded read-only test-analysis subagent when that capability exists.
- At `low`, the direct parent remains the default. An explicit test-related scope establishes the specific evidence gap that permits the one bounded test lane. That lane consumes the single `low` support slot.
- At `medium`, `high`, and `max`, the test lane consumes one slot from the selected improvement-depth support budget.
- For a broader scope, start the lane only when orientation finds material test-quality or test-cost evidence.
- Do not add hidden fan-out. If no subagent capability exists, record reduced coverage and use the direct parent fallback.
- The lane returns observations, measurements, source references, and evidence gaps only. It does not propose or rank candidates, select architecture, start implementation, or orchestrate another child. The parent authors every recommendation and report field.

The parent resolves target-repository rules and applicable skills before the handoff. For test work, resolve and apply `test-driven-development` as a test-effectiveness method. For Go source, modules, Go CLIs, or Go-specific test work, apply target-repository standards first, then the installed `go` skill, then `cobra-viper` only when Cobra or Viper commands, flags, or CLI configuration are in scope, then `test-driven-development`, then generic guidance. Command testing is part of command scope. Send these constraints to every capable test lane. A lane that cannot load an applicable language skill returns evidence only and makes no language-specific claim. Official toolchain documentation can support a mechanism, but it does not replace repository evidence or applicable skill constraints for a candidate. The parent omits a language-specific candidate when neither the installed skill nor bounded target-repository standards support it.

Assess test effectiveness through repository evidence. Map accepted behavior and public seams to existing tests. Check whether each important test can fail for a plausible wrong implementation and whether its expected value is independent. Identify tautological assertions, mock-call-only tests, private-helper coupling, missing boundary and error behavior, nondeterministic waits, weak failure isolation, and gaps at real process, filesystem, network, provider, concurrency, or UI boundaries. Treat coverage as one signal, not proof of effectiveness. Do not recommend more tests only to increase a percentage.

Assess performance at two levels:

1. **Holistic suite view.** Map test commands, CI workflows, packages, shards, setup, cache use, retries, artifacts, and total test steps. Separate queue, setup, test execution, artifact upload, and teardown time when the evidence permits it.
2. **Specific hot cases.** Rank slow, flaky, repeated, highly contended, or high-allocation packages, test files, tests, subtests, benchmarks, or fixtures. Use test-level timing only when logs, structured events, or artifacts provide it. Do not infer a hot test from a slow job alone. Parallel test and subtest elapsed values can overlap, so never sum them as suite wall-clock duration.

When the user provides a branch and base branch, or the repository exposes a verified current branch and pull-request base, compare recent comparable CI runs. Use the same workflow, job or matrix, runner class, event type, relevant workflow revision, and cache conditions when practical. Report the exact refs and SHAs, run URLs or identifiers, sample size, timing level, range or distribution, and important confounders. Do not compare incompatible runs or claim a regression from one noisy observation. If CI evidence is unavailable, stale, retained for too short a period, or permission-restricted, state the gap and continue with bounded repository evidence.

Keep the CI contract provider-neutral. Detect available read-only provider capability and prefer that provider's official API, CLI, logs, and artifacts. Add a first-class GitHub Actions path that can use authenticated read-only `gh run list`, `gh run view`, `gh run download`, `gh pr checks`, and REST `GET` requests when available. Listing, viewing, and downloading are discovery actions. Never dispatch, rerun, cancel, approve, or edit a workflow from `/improve`. Before deeper discovery or any artifact download, the parent creates the unique OS temporary directory that the report run will use. Give every download an explicit destination in a non-served child of that directory. Remove downloaded artifacts immediately after extracting the bounded evidence. Helper shutdown is a cleanup backstop. Do not expose private logs or artifact content in a report.

Use local test, benchmark, profile, trace, race, repetition, shuffle, coverage, or structured-output commands only when the command is bounded and non-destructive. A repository-documented test command is permitted by default after inspecting its definition, unless instructions prohibit execution or the command can affect external systems. If safety is unclear, ask before running it. Record each command, cache state, runtime, instrumentation, repetition, shuffle seed, race or coverage mode, and parallelism when these conditions affect interpretation. Do not automatically run integration or end-to-end tests that can mutate external systems. For timing, bypass result caching with the tool's documented control or label cached data as unsuitable. Do not delete caches. For Go, use documented `go test` and standard-library mechanisms supported by the installed `go` skill or official Go toolchain documentation, such as JSON events, benchmarks, profiles, coverage, fuzzing, race detection, repetition, shuffle, and `testing/synctest`, only when applicable to the repository's Go version and the question under review. Record a skill-coverage gap when official Go documentation supplies a mechanism that the installed skill does not cover. If the repository uses a Go version newer than the installed `go` skill covers, consult official Go release notes and record the gap.

Apply a primary-source research policy. Use sources in this order:

1. target-repository instructions, code, tests, CI configuration, run evidence, and dependency versions
2. official language, standard-library, toolchain, and CI-provider documentation
3. canonical maintainer documentation, repositories, release notes, and issue discussions for the exact dependency version, including Go team and spf13 sources where applicable
4. secondary sources only when primary sources do not answer the question, with the source type and uncertainty stated

External research requires an available read-only research capability plus target network, privacy, and source-disclosure permission. Test lanes and bounded external lookups draw from one shared support-action budget: one slot for `low`, two for `medium`, four for `high`, and declared bounded waves within the host budget for `max`. One test lane or one bounded external lookup consumes one slot. Therefore, an explicit `low` test scope uses its only slot for the test lane and performs no external lookup. It reuses allowed authoritative sources already present in installed skills or target-repository material and records any remaining source gap. AskClaude remains the existing separate second-opinion allowance, not an extra research budget.

Every external recommendation must cite the source and connect it to repository evidence. If a decision-changing external claim cannot be checked against an allowed primary source, omit the recommendation and record the evidence gap. Do not copy a pattern only because it is common, appears in a blog, or exists in another codebase.

For each test candidate, add these report fields:

- effectiveness risk and the plausible wrong behavior that current tests miss or cannot detect
- suite-level performance evidence and the timing boundary
- specific hot cases with measured evidence or an explicit evidence gap
- branch/base CI comparison with comparability limits
- reliability, failure-isolation, and maintenance effects
- applicable target-language and TDD constraints
- primary sources and repository evidence
- expected defect-detection effect, performance effect, tradeoffs, route, and proof needed

Rank test candidates with the existing evidence, leverage, locality, risk, reversibility, and coordination rules. A fast but weaker suite is not an improvement. A stronger but materially slower suite must state the cost and why it is acceptable. The report can recommend no test change when evidence does not support one.

Deliver the feature as one Engineering package delivery unit with two dependent vertical slices:

1. `/improve` resolves missing improvement depth in the adaptive initial intake, selects an adaptive read-only test-analysis lane, and applies TDD, language, and primary-source constraints.
2. The same lane and candidate model add holistic suite evidence, specific hot cases, and comparable branch/base CI performance without remote mutation.

Slice 2 depends on slice 1 for lane selection, evidence ownership, source constraints, and report synthesis. Both slices change the same skill, report contract, documentation, and focused resource tests. Separate publication would create overlapping guidance and an incomplete test-improvement route. The pitch and plan share one implementation delivery unit.

## Boundaries and no-gos

- Change only the Engineering prompt, `improve-codebase-architecture` skill and report contract, Engineering README, focused Engineering resource tests, and feature documents.
- Keep the Engineering package independently installable and repository-neutral.
- Keep the current `/improve` argument grammar, four improvement depths, Focus choices, Outcome choices, report lifecycle, candidate triage, and workflow routes compatible. Replace only the silent `medium` selection with the missing-dimension intake and its unavailable-question fallback.
- Do not add a production extension, CI client, provider SDK, test parser runtime, or new package dependency.
- Do not change the `go`, `cobra-viper`, or `test-driven-development` skills in this delivery unit. `/improve` resolves and applies them by installed name.
- Do not require GitHub Actions. Other CI providers can supply equivalent first-party read-only evidence.
- Do not trigger or mutate CI, trackers, pull requests, branches, or repositories during discovery.
- Do not expose private CI logs, artifact content, credentials, local absolute paths, or repository-confidential source material in remote research prompts or issue drafts.
- Do not treat coverage, test count, file size, elapsed job time, or one benchmark result as sufficient evidence by itself.
- Do not optimize test speed by deleting behavior protection, merging unrelated cases, weakening assertions, increasing nondeterminism, or mocking owned behavior.
- Do not claim exhaustive suite coverage outside the declared scan and available CI retention window.
- Return to Shape if implementation needs a runtime integration, new dependency, CI write operation, changed `/improve` authority, or changes to the Go or TDD skill contracts.

## Decision-changing research and risks

- Official Go documentation exposes structured test events and elapsed values through `go test -json` and `test2json`: <https://go.dev/cmd/test2json/>.
- The official `go test` reference defines cache, repetition, shuffle, benchmark, coverage, fuzz, race, profile, and trace controls: <https://go.dev/cmd/go/>.
- The standard `testing` package defines tests, subtests, benchmarks, fuzz targets, and current version-specific APIs: <https://pkg.go.dev/testing>.
- Official Go diagnostics, fuzzing, and race guidance support evidence-based profiling and reliability analysis: <https://go.dev/doc/diagnostics>, <https://go.dev/doc/security/fuzz/>, and <https://go.dev/doc/articles/race_detector>.
- GitHub's official CLI and API documentation supports read-only branch run listing, job and step inspection, log viewing, and artifact download: <https://cli.github.com/manual/gh_run_list>, <https://cli.github.com/manual/gh_run_view>, <https://cli.github.com/manual/gh_run_download>, and <https://docs.github.com/en/rest/actions/workflow-jobs>.
- The `question` tool supports multiple separate choice questions in one call. The intake can ask improvement depth, Focus, and Outcome without adding a runtime parser or another interaction round.
- CI wall-clock duration can include queue, setup, cache, test, upload, and teardown time. The report must name its timing boundary.
- Branch and base workflows can differ. A comparison without workflow, matrix, runner, event, and revision checks can create a false regression claim.
- CI data can be absent because of retention, permissions, skipped jobs, or a branch with no runs. Missing CI evidence reduces confidence but does not justify invented local measurements.
- Some local tests and benchmarks mutate external systems. Repository policy and bounded command inspection must precede execution.
- First-party documentation can describe a tool but cannot prove a repository-specific improvement. Every recommendation still needs local evidence.

## Review evidence

- **Applicability:** Go-targeted guidance. The pitch changes how `/improve` analyzes future Go and Go CLI tests, resolves the installed `go` and applicable `cobra-viper` skills, selects Go toolchain evidence, and constrains test recommendations.
- **Fixed document:** `docs/features/improve-test-analysis/pitch.md` draft before approval.
- **Status:** Approved. The final replacement fixed-document Go specification review found no blocking issue. The parent resolved its non-blocking mechanism-versus-candidate wording question and preserved the existing agent-led `find improvements` orientation.
- **Invalidation:** The review remains valid because the post-review wording only made the reviewed precedence distinction explicit and preserved existing orientation behavior. Any later material change to Go, Cobra/Viper, or TDD precedence, initial intake, the test-analysis lane, CI comparison behavior, boundaries, implementation authority, or acceptance criteria requires a replacement review.

## Authority

The parent owns test-improvement semantics, evidence standards, lane selection, candidate ranking, and workflow routing. Approved delivery can change the named Engineering package resources, focused tests, README, and feature documents on `feat/improve-test-analysis`.

The caller prefers accept-all implementation. This preference is not implementation authority until complete-plan approval. Pitch approval authorizes the bounded pitch commit and planning handoff. It does not authorize implementation, CI mutation, push, pull request publication, merge, release, deployment, destructive cleanup, or unrelated changes.

## Observable acceptance criteria

- **AC-001 — First-class test scope:** `/improve` treats test effectiveness and test performance as normal first-class discovery outcomes. It adds no test mode, command variant, or user-facing test toggle. An explicit test request is an ordinary scope.
- **AC-002 — Initial improvement-depth choice:** When the request has no explicit leading level, the initial `question` call asks the user to select `low`, `medium`, `high`, or `max`, with concise appetite descriptions and `medium` as the recommended default.
- **AC-003 — Missing-dimension intake:** One initial `question` call runs whenever any dimension is unanswered and asks only those dimensions. It can contain separate Improvement depth, Focus, and Outcome questions. Explicit level, scope, `find improvements`, or outcome input is authoritative and is not repeated. Lightweight orientation runs when the Focus question is present or agent-led `find improvements` must select an evidence-backed focus. A specific-scope request needs no orientation only to ask for missing level or outcome.
- **AC-004 — Compatible fallback:** The optional leading-level grammar, case normalization, scope rules, and reserved-token escape remain compatible. If `question` is unavailable, an unanswered level falls back to `medium`, and other unanswered choices use the existing conversational fallback. If the user skips or cancels, `/improve` stops before discovery without re-prompting or selecting missing values.
- **AC-005 — Adaptive test lane:** An explicit test-related scope uses one bounded read-only test-analysis subagent when available. At `low`, the parent stays the default, the explicit test scope establishes the permitted evidence gap, and the lane consumes the one support slot. At other improvement depths, it consumes one support slot. A broader scope uses the lane only after material test evidence. The lane returns evidence only, the parent authors recommendations, and unavailable subagents have an honest direct-parent fallback.
- **AC-006 — Effectiveness evidence:** Test candidates assess public behavior, plausible wrong implementations, independent expected values, boundary coverage, reliability, failure isolation, and harmful coupling. Coverage and test count are signals, not proof.
- **AC-007 — Holistic and specific analysis:** The report separates suite-level commands, CI stages, packages, shards, setup, caches, and retries from measured hot packages, files, tests, subtests, benchmarks, and fixtures.
- **AC-008 — Comparable CI evidence:** Given a branch and base, `/improve` compares only compatible recent runs and reports refs, SHAs, run identifiers, sample size, timing boundary, observed distribution, and confounders. Missing or incompatible data is an explicit evidence gap.
- **AC-009 — Read-only CI:** `/improve` detects provider capability and uses read-only official APIs, CLIs, logs, and artifacts. The GitHub path supports read-only `gh` and REST inspection. Before any download, the parent creates the report run's unique OS temporary directory. Every artifact uses an explicit non-served child destination and is removed after evidence extraction. `/improve` never dispatches, reruns, cancels, approves, or edits CI.
- **AC-010 — Safe local evidence:** Bounded non-destructive repository-documented test commands are permitted after definition inspection unless repository policy prohibits them or external effects are possible. Unclear safety requires a question. The report records commands, cache and instrumentation conditions, and does not automatically run tests that can mutate external systems.
- **AC-011 — Go, Cobra/Viper, and TDD routing:** Test analysis resolves `test-driven-development`. Go test analysis applies target-repository standards, then installed `go`, then applicable `cobra-viper` when Cobra or Viper commands, flags, or CLI configuration are in scope, then `test-driven-development`, then generic guidance. Command testing is command scope. Applicable Go mechanisms can come from the installed skill or official Go documentation. Every capable lane receives those constraints. Newer Go versions and official mechanisms absent from the installed skill require a recorded skill-coverage gap. Unavailable methods and reduced coverage are explicit.
- **AC-012 — Primary-source research:** External test recommendations prefer official toolchain, standard-library, CI-provider, and canonical dependency-maintainer sources. Test lanes and external lookups share the selected improvement-depth support budget. An explicit `low` test scope has no external lookup after its lane. Each recommendation cites its source and connects it to repository evidence. Unsupported claims are omitted as evidence gaps. Secondary sources are labeled and used only when primary sources do not answer the question.
- **AC-013 — Balanced ranking:** Each test candidate states expected defect-detection and performance effects, tradeoffs, reversibility, proof, and route. `/improve` does not rank a faster but weaker suite as an improvement.
- **AC-014 — Report contract:** The Blueprint Ledger displays effectiveness risk, suite timing boundary, hot cases, branch/base comparison, reliability and maintenance effects, applicable skill constraints, primary sources, evidence gaps, and expected proof.
- **AC-015 — Compatible authority:** Discovery remains read-only. Existing report lifecycle, terminal decisions, route approvals, and unavailable-capability fallbacks remain compatible.
- **AC-016 — Independent package:** The Engineering package gains no extension, provider SDK, runtime parser, or package dependency and does not assume repository-local agents or tools.
- **AC-017 — Focused proof:** Markdown resource-contract tests prove missing-dimension intake, explicit-input suppression, `medium` fallback, lane selection and budget instructions, fallback behavior, effectiveness checks, holistic and hot-case separation, comparable CI rules, read-only GitHub behavior, temporary artifact cleanup, safe local-command limits, Go, Cobra/Viper, and TDD precedence, source hierarchy, report fields, balanced ranking, and preserved `/improve` authority. No new runtime orchestration is introduced or implied.
- **AC-018 — Documentation:** The Engineering README explains the initial level choice, when the test lane runs, what it measures, how branch/base CI evidence is compared, how Go and TDD guidance applies, and why first-party sources and repository evidence are both required.
- **AC-019 — Completion checks:** The focused Engineering tests, source smoke, and `npm run check` pass against the final worktree. Manual `/reload` acceptance confirms the updated `/improve` prompt and skill load without duplicate resources or stale behavior.
