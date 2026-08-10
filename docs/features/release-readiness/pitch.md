---
status: accepted
---

# Shape: Release readiness

## Executive summary

Prepare the independent Pi packages for their first releases and improve the
main interactive workflow. Deliver six small, stacked pull requests. Keep each
change inside its owning package or root aggregate boundary.

The stack will fix the initial release version, move the existing status line
above the prompt, make the on-demand advisor model configurable, tell the agent
to use pragmatic Simplified Technical English, extend the Conventional Commit
skill with safe atomic splitting, and guide stacked pull request publication.

## Problem

The repository documents `0.1.0` as the first package release, but the current
Release Please configuration generates `1.0.0`. The root README also omits the
GitHub package and does not explain suitable install profiles for projects of
different sizes.

The status line contains useful model, project, Git, context, cost, subagent,
and todo sections. However, `packages/status-line/src/index.ts` installs it
below the input through `setFooter()`. The requested terminal layout puts this
information above the prompt and keeps the editable prompt on the next line.

The root `advisor` definition pins Sol at maximum thinking. This prevents the
normal persistent `subagents.agentOverrides.advisor` configuration from
selecting a user-preferred model. The advisor remains on demand because an
every-turn maximum-effort review would add unwanted cost and latency.

The Simple English package gives the model an optional skill. Installation does
not currently tell the model to use pragmatic Simplified Technical English for
all human-facing replies. The user wants clear language without changing or
removing technical information.

The Conventional Commit skill validates one logical staged unit. It does not
define how to inspect a mixed worktree, propose independent units, reject an
unsafe split, and commit approved units in dependency order.

## Appetite

Use existing Pi APIs, Git commands, package patterns, and release tooling. Keep
all current status-line sections. Preserve package independence, cancellation,
reload cleanup, non-interactive behavior, and exact technical content.

Stop and reshape the work if a requested behavior requires a private Pi API,
post-processes model output, weakens commit authority, or cannot pass the
repository checks.

## Research and prior art

Pi 0.84 supports widgets above the editor, custom footers, custom editors, and
custom tool rendering. The accepted layout uses a custom editor and footer as
one prompt component. `ReadonlyFooterDataProvider` is available only through
`setFooter()`. The status line uses it for unrelated extension statuses and Git
fallback, not session data.

Oh My Pi shows a prompt-adjacent powerline, an on-demand or continuous advisor,
kernel tool callbacks, Debug Adapter Protocol support, rich rendering, and
atomic commit splitting. Only the prompt layout and commit workflow are in this
feature. See <https://omp.sh/>.

`pi-subagents` already supports per-run model selection and persistent
`subagents.agentOverrides`. The root advisor can use this supported behavior if
its frontmatter does not pin a model or thinking effort.

Git already supplies the required inspection and identity operations. The
commit skill can use status, diffs, explicit path or hunk staging, and
`git write-tree`. New Git abstraction tools are not necessary.

## Solution

### Release foundation

Set the Release Please initial version to `0.1.0`. Add a validator regression
test. Update the root package table and document manual npm publication.
Document these recommended install profiles without bundling the companions:

- small: selected repository packages only;
- medium: the private Git aggregate plus separately installed `pi-subagents`;
- large: the medium profile plus separately installed `context-mode`, required
  language servers, and Worktrunk when linked worktrees are used.

### Prompt layout

Render one integrated prompt component. Put the current status-line fields in
the top divider, put the editable prompt directly below them, and use the
required custom-footer row as the curved bottom divider. Keep the custom-footer
provider so the top divider can include unrelated extension statuses and Git
fallback.

Use Pi's supported custom-editor API and preserve default prompt input,
keybindings, multiline behavior, paste handling, and abort behavior. Compose
with a previously configured editor when Pi's public API permits safe wrapping.
Document the existing last-writer-wins footer limit and the new custom-editor
compatibility limit. Remove editor and footer registrations during shutdown and
reload. The live check must show one visual component with no duplicate divider
or status content.

### Configurable on-demand advisor

Keep `advisor` on demand. Remove its pinned model and thinking effort so it
inherits the parent model by default. Update `AGENTS.md`, the root README, and
the aggregate agent tests to reserve pinned Sol/max for `oracle`. Document
persistent and per-run examples for selecting Opus or another compatible model.

### Agent output guidance

Convert the Simple English skill-only package into a skill-and-extension
package. Add `src/index.ts`, `tsconfig.json`, extension manifest metadata, the
`pi-extension` keyword, the Pi peer dependency, type checking, README updates,
focused tests, and the synchronized root lockfile change.

On each agent turn, append concise pragmatic output guidance to the chained
system prompt. Tell the model to preserve code, commands, identifiers, paths,
URLs, quotations, normative words, uncertainty, and technical detail. Do not
rewrite completed model output. Test `before_agent_start` prompt chaining in
interactive and non-interactive modes.

### Atomic Conventional Commits

Extend the existing skill. It will inspect the complete worktree, propose
non-overlapping logical units, identify dependency order, and request approval
before staging or committing. It will use only explicit paths or approved
hunks.

Atomic splitting starts only with an empty Git index. If any change is already
staged, or a file has both staged and unstaged hunks, preserve the state and
stop. Ask the user to finish the existing staged unit or change the index
explicitly. Never reset, unstage, or rewrite pre-existing index state. Unrelated
unstaged changes can remain outside an approved unit.

Exclude lockfiles from semantic grouping. If several changed manifests share
one lockfile, keep those dependency metadata changes in one unit. Split them
only when the user explicitly approves sequential lockfile regeneration and
validation for each intermediate commit.

Before each normal `git commit`, record the staged tree with `git write-tree`,
run required checks and message validation, then require a second
`git write-tree` result to match. Do not use `git commit-tree` or bypass hooks and
signing. After commit, compare `HEAD^{tree}` with the validated tree.

This comparison detects rather than prevents a hook or external process from
changing the index before normal `git commit` acquires its lock. If the trees
differ, report the commit hash and mismatch, then stop. Do not amend, reset,
revert, replace, or continue without new user authority.

Stop before staging if units overlap or dependencies form an unresolved cycle.
Stop before commit if validation changes the staged tree. Preserve explicit
authority for every commit, push, and pull request.

### Delivery stack

Create six stacked pull requests in this order:

1. release policy and documentation;
2. status-line prompt layout;
3. configurable advisor;
4. automatic Simple English guidance;
5. atomic Conventional Commit splitting;
6. stacked pull request workflow guidance.

Each pull request will contain one validated Conventional Commit. Each pull
request will target the branch immediately below it. The work will not merge or
publish releases.

## Fixed decisions

- Use six small stacked pull requests.
- Keep all current status-line sections.
- Render the status fields as the top divider of one integrated prompt component.
- Preserve default prompt editing behavior through Pi's supported custom-editor
  API.
- Use the custom-footer provider row as the curved bottom divider.
- Preserve and document the exclusive footer and custom-editor compatibility
  limits.
- Keep the advisor on demand.
- Make the advisor inherit the parent model by default.
- Let users select Opus or another model through supported subagent settings.
- Tell the model how to write. Do not post-process its output.
- Preserve all technical information and protected technical text.
- Use standard Git commands and normal `git commit` for commit splitting.
- Start atomic splitting only with an empty index. Preserve and stop on any
  pre-existing staged or partially staged state.
- Group dependency metadata that shares one lockfile unless sequential lockfile
  regeneration is explicitly approved.
- Require explicit approval before each staged unit is committed.
- Keep Worktrunk responsible for worktrees and use `gh stack` for the GitHub
  stack relationship.
- Verify adjacent branch ancestry, one unique commit per pull request, and
  generated pull request metadata before review.
- The user authorizes local commits, pushes, opening or updating the six pull
  requests, and force-with-lease updates to these six reviewed stack branches.
- The user does not authorize merge, npm publication, release publication, tag
  creation, or worktree removal.

## Rabbit holes

- Do not copy the complete Oh My Pi editor or build a theme system.
- Do not add an every-turn advisor service.
- Do not add Python or Bun kernels.
- Do not add debugger support.
- Do not redesign file-edit, LSP, todo, question, or subagent rendering.
- Do not add proprietary Git overview, diff, or hunk tools.
- Do not automate npm publication in this feature.

## No-gos

- No private Pi APIs.
- No silent model fallback or provider requirement for the advisor.
- No rewriting code or exact technical content for language style.
- No `git add -A` or `git add .` in the commit workflow.
- No commit without explicit user authority.
- No force-push outside the six reviewed stack branches. No merge, tag, release,
  publication, or destructive cleanup.
- No unrelated package refactor.

## Acceptance criteria

- **AC-001 — Correct first version:** New `0.0.0` packages generate a documented
  `0.1.0` first release policy, and a regression test protects the setting.
- **AC-002 — Complete release guidance:** The root README lists all production
  packages and explains install profiles and manual npm publication.
- **AC-003 — Prompt layout:** A live Pi TUI shows one integrated component with
  the complete status line as its top divider, the editable prompt below it, and
  a curved bottom divider. Width reduction remains correct and content is not
  duplicated.
- **AC-004 — Lifecycle safety:** Reload and shutdown remove stale status-line UI
  registrations and reconstruct current state without duplication.
- **AC-005 — Configurable advisor:** The advisor inherits the parent model by
  default and supports documented persistent and per-run model selection.
- **AC-006 — On-demand cost boundary:** No advisor runs automatically on each
  main-agent turn.
- **AC-007 — Clear agent replies:** Installing Simple English tells the model to
  use pragmatic Simplified Technical English for human-facing prose without
  losing technical information.
- **AC-008 — Protected technical content:** Automatic language guidance preserves
  exact code, identifiers, commands, paths, URLs, quotations, and normative
  contract words.
- **AC-009 — Safe split plan:** The commit skill proposes non-overlapping logical
  units and stops before staging when the plan has an unresolved overlap or
  dependency cycle.
- **AC-010 — Staged-tree attestation:** Each approved commit records matching
  staged trees before and after validation and uses normal `git commit`. If
  `HEAD^{tree}` differs after commit, the workflow reports the mismatch and
  stops without automatic history repair.
- **AC-011 — Conventional messages:** Every created commit uses a validated,
  repository-aware Conventional Commit message.
- **AC-012 — Stack delivery:** Six atomic commits are pushed as six ordered,
  stacked pull requests without merge or publication.
- **AC-013 — Repository checks:** Focused tests and `npm run check` pass after the
  final change.
