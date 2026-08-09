# Plan: Release readiness

Resume by inspecting Git, then work the first unchecked slice. Reorder, rewrite,
split, merge, or delete pending slices when implementation teaches something
new.

When the `todo` tool is available, derive checked/total progress and the first
unchecked slice from this plan. Reconcile one rolling `Shape release-readiness:`
item. Keep `plan.md` authoritative and preserve unrelated todos.

## [x] 001 — Correct release policy and guidance

### Outcome

New packages use the documented `0.1.0` first version, and maintainers have
complete install and publication guidance.

### Pitch trace

[Release foundation](pitch.md#release-foundation), AC-001, and AC-002.

### Implementation

On `feat/release-readiness`, add the Release Please initial-version contract and
its validator regression test. Add the missing GitHub package row. Document the
small, medium, and large install profiles and the manual npm publication gate.
Keep the accepted pitch and this plan in the same atomic commit.

### Validation

Run the release tooling tests, package validator, and Markdown checks. Run
`npm run check` after the final edit. Review the complete diff independently.
Validate the Conventional Commit message, commit, push, and open the first pull
request against `main`.

### Done when

The policy test fails without the configuration fix and passes with it. The
README matches all 12 production packages. The first stack pull request is open
and its branch contains one validated commit.

## [x] 002 — Show one integrated powerline prompt

### Outcome

The Pi TUI shows the complete status line as the prompt's top divider, the
editable prompt below it, and a curved bottom divider.

### Pitch trace

[Prompt layout](pitch.md#prompt-layout), AC-003, and AC-004.

### Implementation

Create `feat/status-line-prompt` from the first stack branch. Add the smallest
failing status-line tests for editor and footer registration, rendering, width
reduction, and shutdown cleanup. First verify whether Pi 0.84 supports safe
composition with a previously configured editor. If public wrapping is
supported, test it. Otherwise, test and document the last-writer-wins editor
limit. Do not build an adapter or use a private API. Use Pi's supported custom
editor and footer APIs. Preserve all current sections, prompt behavior, event
subscriptions, and compatibility limits. Update the package README.

### Validation

Run the status-line tests and typecheck. Start deterministic Pi from this
worktree. Confirm the integrated component in a live terminal, run `/reload`,
and confirm that the component returns once without duplicate content or stale
state. Run source smoke and `npm run check` after the final edit. Obtain
independent review. Validate the Conventional Commit message, commit, push, and
open the second pull request against `feat/release-readiness`.

### Done when

The live terminal matches the accepted three-part layout. All current sections
remain available. Prompt editing and reload work. The second stack pull request
is open with one validated commit.

## [x] 003 — Let users select the advisor model

### Outcome

The on-demand advisor inherits the parent model by default and accepts supported
per-run or persistent user model configuration.

### Pitch trace

[Configurable on-demand advisor](pitch.md#configurable-on-demand-advisor), AC-005,
and AC-006.

### Implementation

Create `feat/configurable-advisor` from the second stack branch. First change
the advisor expectations in `test/tooling/subagents.test.ts` and observe the
focused test fail. Remove the advisor's pinned model and thinking effort. Keep
oracle pinned to Sol/max. Update `AGENTS.md`, the root README, and aggregate
agent tests. Include an Opus example without making Anthropic a requirement. Do
not add automatic advisor execution.

### Validation

Run the aggregate agent tests and package validator. Start deterministic Pi
with the documented companion version:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e npm:pi-subagents@0.43.0 \
  -e .
```

Confirm advisor discovery and inherited model precedence, run `/reload`, and
confirm the same behavior without duplicate agents. Run `npm run check` after
the final edit and obtain independent review. Validate the Conventional Commit
message, commit, push, and open the third pull request against
`feat/status-line-prompt`.

### Done when

Tests prove that advisor frontmatter leaves model selection open and oracle
remains pinned. Documentation shows persistent and per-run configuration. The
third stack pull request is open with one validated commit.

## [ ] 004 — Tell the agent to use Simple English

### Outcome

Installing the Simple English package tells the agent to use pragmatic
Simplified Technical English for human-facing prose without losing technical
information.

### Pitch trace

[Agent output guidance](pitch.md#agent-output-guidance), AC-007, and AC-008.

### Implementation

Create `feat/automatic-simple-english` from the third stack branch. Add one
extension entrypoint that chains concise guidance during `before_agent_start`.
Convert the manifest to a skill-and-extension package with the required peer,
keywords, source files, typecheck, README, tests, and synchronized root lockfile.
Preserve exact technical content and do not post-process output.

### Validation

First add a focused failing test for prompt chaining and protected content.
Test interactive and non-interactive contexts, registration, chaining with an
existing system prompt, and reload-safe factory behavior. Start deterministic
Pi with `-e packages/simple-english`, exercise one human-facing reply, run
`/reload`, and confirm that the guidance remains active once. Run the package
test, typecheck, packed and source smoke, security check, and `npm run check`
after the final edit. Obtain independent review. Validate the Conventional
Commit message, commit, push, and open the fourth pull request against
`feat/configurable-advisor`.

### Done when

The installed package changes agent instructions, not completed output. Tests
prove that technical detail remains protected. The fourth stack pull request is
open with one validated commit.

## [ ] 005 — Split changes into safe Conventional Commits

### Outcome

The Conventional Commit skill can plan and create approved, dependency-ordered,
atomic commits from a mixed unstaged worktree.

### Pitch trace

[Atomic Conventional Commits](pitch.md#atomic-conventional-commits), AC-009,
AC-010, AC-011, AC-012, and AC-013.

### Implementation

Create `feat/atomic-commit-splitting` from the fourth stack branch. First add
failing safety-contract assertions to the Git Conventions tests. Extend the
existing skill with the empty-index gate, complete-worktree inventory, explicit
path or hunk units, overlap and cycle rejection, shared-lockfile grouping,
approval gates, staged-tree attestation, normal commit behavior, and mismatch
stop rules. Update the package README and focused contract tests. Do not add a
runtime extension or new Git tools.

### Validation

Run the package tests and use a disposable repository to exercise clean splits,
unrelated unstaged changes, a non-empty index, partially staged files, shared
lockfiles, invalid dependency plans, and Conventional Commit validation. Add a
case where validation changes the staged tree before commit and confirm the
workflow stops. Add a commit-hook case that changes the committed tree and
confirm the workflow reports the commit hash, stops, and performs no repair.

Start deterministic Pi with `-e packages/git-conventions`, exercise the split
workflow guidance, run `/reload`, and confirm that the skill remains available
once. Run `npm run check` after the final edit, obtain final independent review,
and inspect the complete five-branch range. Validate the final Conventional
Commit message, commit, push, and open the fifth pull request against
`feat/automatic-simple-english`.

### Done when

The skill stops before unsafe index changes, creates only authorized logical
units, and validates each exact staged tree and message. All required checks
pass. Five ordered pull requests are open without merge or publication.
