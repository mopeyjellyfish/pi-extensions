---
status: accepted
---

# Shape: Fixed cross-provider agent profile

## Executive summary

Replace the root profile's three current child agents with six fixed, role-specific agents that use OpenAI and Claude subscription capacity deliberately:

| Agent        | Model                         | Thinking | Role                                                                        |
| ------------ | ----------------------------- | -------- | --------------------------------------------------------------------------- |
| `worker`     | `openai-codex/gpt-5.6-terra`  | medium   | Sole implementation writer in its assigned worktree                         |
| `researcher` | `openai-codex/gpt-5.6-luna`   | low      | Read-only repository, official-documentation, and web research              |
| `qa`         | `openai-codex/gpt-5.6-luna`   | medium   | Read-only reproduction and quality evidence through Bash and Playwright     |
| `reviewer`   | `claude-bridge/claude-opus-5` | medium   | Independent fixed-diff code review                                          |
| `git`        | `openai-codex/gpt-5.6-terra`  | medium   | Local Git operations, conflict repair, commits, rebases, and bounded pushes |
| `utility`    | `openai-codex/gpt-5.6-luna`   | medium   | Read-only bounded work that does not fit Researcher or QA                   |

Each profile pins its model and thinking level and has no model fallback. The human keeps selecting Fable or Sol for the interactive parent. Shape and planning continue to use that selected parent for judgment, while bounded discovery can move to Researcher. No configured Sol child remains. A Sol escalation must pause, explain why Terra is insufficient, and ask the human whether to use Sol.

The root install also exposes the complete Engineering and Productivity resource packages. Engineering gains one maintained `code-review` skill, a fuller `codebase-design` method, an architecture-improvement skill launched by `/improve`, and safe merge-conflict guidance. The imported Matt Pocock material remains pinned and attributed.

## Problem

The recommended root profile currently installs `terra-worker`, `sol-worker`, and `fable-reviewer`. The implementation skill automatically routes hard or failed work to Sol. This makes expensive model use a repository policy rather than a visible human decision. It also concentrates normal review and orchestration on Fable or Sol even when Luna, Terra, and a separate Claude review can do the bounded work well.

The current root install exposes only selected Engineering skills and no Productivity resources. Child profiles set `inheritSkills: false` without selecting role-specific skills. A worker therefore does not receive the package's TDD and codebase-design methods, and the reviewer does not receive its review method.

The Engineering package already has useful local review and codebase-design guidance, but the upstream skills now contain material that is not fully represented locally. The package lacks an architecture-improvement entry point. Git Conventions supports safe rebasing but lacks a complete conflict-resolution method, so conflict handling must be rediscovered or retaught.

Finally, the root `AGENTS.md` describes this repository's development discipline but does not state strongly enough that its production resources are installed into unrelated repositories. A resource must therefore be repository-neutral and must not assume this repository's skills, extensions, paths, package names, or domain are present in the target Pi session.

## Appetite

This is a root-profile, Markdown-resource, documentation, attribution, and contract-test change. Keep the six agent profiles fixed and narrow. Do not add a runtime orchestration service, automatic settings writer, model fallback, billing logic, or repository-specific production resource.

Quality floors:

- Pin every child model and thinking level in version-controlled agent frontmatter.
- Keep one writer per worktree; Researcher, QA, Reviewer, and Utility remain non-writing roles.
- Give each agent only the tools and selected skills needed for its role.
- Keep the interactive parent responsible for product, architecture, Shape, planning, synthesis, and escalation decisions.
- Use Luna for cheap bounded support, Terra for normal code and Git work, and Opus for independent review.
- Never consume Sol through an automatic child route.
- Preserve package independence and packed-install behavior.
- Preserve upstream MIT attribution and existing debugging attribution.
- Keep Git pushes bounded and recoverable.

If the pinned Pi, `pi-subagents`, or `pi-claude-bridge` contract cannot load one of the exact selected models or private skill paths, stop and reshape rather than silently substitute another model.

## Research and prior art

The pinned `pi-subagents` 0.50.0 contract supports explicit agent `model`, `thinking`, tool allowlists, selected `skills`, invocation-private `skillPath`, and `acceptanceRole`. It also ships built-in agents. Its `disableBuiltins` setting is user or project configuration; installing this package must not rewrite that setting. The root documentation must therefore provide the one-time setting needed for an exact six-agent catalog.

The pinned `pi-claude-bridge` 0.7.0 registry exposes `claude-bridge/claude-opus-5` and maps it to Claude Code's one-million-context Opus 5 model. AskClaude is available only while the active parent uses a non-bridge provider. A Sol parent can call AskClaude; a Fable parent cannot recursively call the Claude bridge. The profile must document this instead of promising AskClaude in every parent session.

The requested upstream Engineering sources use the pinned commits recorded in the Engineering third-party notice:

- [`code-review`](https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/code-review/SKILL.md) supplies the basis for a fixed-point review against accepted pitch and plan and repository Standards, plus a concrete smell baseline.
- [`codebase-design`](https://github.com/mattpocock/skills/blob/ee8bae40062cd6b435073368ed0c540f48c35862/skills/engineering/codebase-design/SKILL.md) supplies consistent deep-module vocabulary and design checks.
- [`improve-codebase-architecture`](https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/improve-codebase-architecture/SKILL.md) supplies a hot-spot-led architecture scan and ranked deepening opportunities.
- [`resolving-merge-conflicts`](https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/resolving-merge-conflicts/SKILL.md) supplies intent-preserving conflict resolution and post-resolution checks.

The upstream repository is MIT licensed. `packages/engineering/THIRD_PARTY_NOTICES.md` already records this commit for adapted Engineering material and the complete license, but its file inventory must be updated for every new or renamed resource. Git Conventions also needs the applicable notice when it receives adapted conflict-resolution text.

## Solution

### Fixed agent catalog

Delete `sol-worker`, replace `terra-worker` with `worker`, and replace `fable-reviewer` with `reviewer`. Add `researcher`, `qa`, `git`, and `utility`. Keep all six profiles in the root `agents/` directory so the recommended Git install loads them through `pi.subagents.agents`.

Use fresh child context and inherited repository instructions for all six profiles. Do not inherit the parent's whole skill catalog. Select role skills through private `skillPath` entries so a child gets the method it needs without depending on ambient installation order.

- **Worker:** read, search, Bash, edit, write, and owned browser automation. Supply TDD, codebase design, diagnosis, domain modeling, and agent-writing guidance. It implements an exact task as sole writer and does not make product or architecture decisions.
- **Researcher:** read, search, bounded Bash, and `web_search`; no edit or write. It prefers repository truth and official primary sources, reports concise evidence with paths or URLs, and does not turn research into implementation.
- **QA:** read, search, Bash, and `playwright_browser`; no edit or write. It may run tests and create only unavoidable tool/runtime output outside production sources. It reproduces behavior, records exact steps and evidence, and closes its browser session.
- **Reviewer:** read, search, and bounded Bash for a fixed diff; no edit, write, or browser. It applies the one `code-review` skill and reports evidence-backed correctness, regression, security, performance, edge-case, test, architecture, and maintainability findings by severity.
- **Git:** read, search, Bash, edit, and write for Git-owned changes such as conflict resolution. It receives Conventional Commit, rebase, conflict-resolution, GitHub, and Worktrunk guidance. It may push the current non-default task branch to `origin`. After a rebase it may use `--force-with-lease` only after recording and checking the expected remote state. It never pushes a default or protected branch, tags, another remote, or an unleased force update without explicit human approval.
- **Utility:** read, search, bounded Bash, and `web_search`; no edit or write. It handles a clearly bounded support task that does not fit Researcher or QA. The parent asks the human when routing remains ambiguous.

Do not configure fallback models. A `subagents.defaultModel` is unnecessary and does not override explicit agent frontmatter in pinned `pi-subagents`; do not use a per-run model override without the accepted explicit approval. Document `subagents.disableBuiltins: true` as required to hide `pi-subagents` built-ins and obtain exactly these six visible agents.

### Parent routing and Sol control

The interactive parent remains user-selected. Fable and Sol are both supported; the repository does not overwrite Pi's parent defaults.

Shape and planning keep judgment in the parent. They may call Researcher once for bounded repository mapping, official-source research, or concise context gathering when this avoids expensive parent exploration. They do not delegate product decisions, pitch synthesis, slice design, or approval handling.

Implementation uses Worker for standard work. QA may reproduce a failure or provide independent execution evidence, but it never replaces Worker or Reviewer. Reviewer evaluates the completed fixed diff. Git performs a separately bounded delivery or history operation.

Remove automatic Terra-to-Sol routing. When Terra cannot meet completion conditions, or the task has a concrete hard constraint that requires Sol, the parent must use `question` to state the evidence, expected benefit, and bounded Sol task. The human may approve a one-off Sol run or choose to continue in a Sol parent session. No Sol run starts from silence, a difficulty label alone, or a hidden fallback.

Use AskClaude as an optional read-only second opinion when the selected parent is OpenAI and a Claude perspective is useful before formal review. When the parent is Fable, AskClaude is unavailable by design; use the fixed Opus Reviewer only at the review boundary. Do not add redundant Claude calls merely to use both providers.

### One code-review skill

Rename the maintained review method from `reviewing-changes` to `code-review`; remove the old skill and update `/review-change` and all references. Adapt the pinned upstream method into one Pi-native flow. The later review-integration decision supersedes the original source-preservation approach so the method can use accepted pitch and plan terminology directly and load applicable language references without contradictory upstream fanout instructions.

The integrated method resolves the upstream assumptions for this profile:

- one Opus Reviewer performs both Pitch and plan and Standards axes in one read-only pass because an ordinary child is not an orchestrator;
- accepted pitch and plan are the primary intent sources, with a bounded request, confirmed bug outcome, issue, or user-supplied intent used only when no formal pitch and plan exist;
- repository instructions and nearest engineering contracts are the Standards sources;
- the final result is severity-ranked for action while retaining an explicit axis on each finding;
- correctness, regression, security, performance, edge cases, falsifiable tests, architecture, and maintainability are required review areas;
- tool-enforced style and unsupported speculation are not findings;
- every material finding names its file, location, evidence, consequence, axis, and confidence;
- no finding authorizes edits.

Contract tests pin the integrated axes, fixed-diff method, risk areas, applicable language references, and attribution. There is only one `code-review` skill and one review command to maintain.

### Codebase design and architecture improvement

Expand the existing `codebase-design` skill with the useful current upstream vocabulary and checks while preserving the stronger local rules against speculative seams, forwarding layers, and syntax-only deduplication. Worker and Reviewer both receive this skill. Planning uses its vocabulary when a slice changes module shape; code review checks whether changed interfaces provide depth, locality, testability, and evidence for any new seam.

Add one `improve-codebase-architecture` skill and an `/improve` prompt. Keep it repository-neutral and remove dependencies on upstream issue-tracker setup, a separate grilling skill, remote HTML assets, or assumed desktop open commands.

The flow is:

1. Accept an optional module, subsystem, pain point, or change-history scope.
2. Read the nearest domain context and architecture decisions.
3. Use Researcher for one bounded hot-spot and caller scan when available; otherwise scan in the parent.
4. Apply `codebase-design` to identify evidence-backed deepening opportunities.
5. Present a concise ranked report with current friction, involved files, proposed deeper module, expected locality and leverage, test effect, decision conflicts, strength, and a simple before/after diagram where useful.
6. Ask which candidate, if any, the human wants to pursue.
7. Hand the selected candidate to Shape and planning. Do not edit production code directly from the scan.

This makes `/improve` a safe architecture-discovery command rather than a second implementation loop.

### Conflict-resolution support

Add one `resolving-merge-conflicts` skill to Git Conventions, incorporating the pinned upstream sequence and strengthening it with existing local Git safety:

- require an in-progress merge or rebase and inspect its recorded state;
- recover both intents from commits, pull requests, issues, tests, and accepted local intent;
- resolve each hunk without inventing behavior;
- ask when intents are incompatible or required evidence is unavailable;
- run repository-required focused and completion checks;
- continue the existing merge or rebase only after checks pass;
- preserve abort as a human-selected recovery option rather than adopting upstream's unconditional “never abort” rule;
- apply the bounded push and leased-force-push policy after successful completion.

The Git agent receives this skill together with `git-rebase-base` and `conventional-commit`, so normal conflict work does not require repeated Git instruction.

### Root install and repository-neutral contract

Change the private root profile to load complete Engineering and Productivity skill and prompt directories. Keep each production package independently installable; do not add a production “agents” package or a settings-writing extension.

Update root documentation with:

- the six-agent table and fixed levels;
- the `disableBuiltins: true` user setting needed for an exact catalog;
- required OpenAI Codex and Claude Code sign-in;
- Fable/Sol parent selection and the AskClaude provider limitation;
- no fallback and explicit Sol escalation behavior;
- Git push and leased-force-push limits;
- the Engineering and Productivity resources included by the root install.

Strengthen root `AGENTS.md` so repository authors and delegated agents know that production resources execute in other repositories. Skills, prompts, extensions, and agent profiles must be generic, must use the target repository's instructions and vocabulary, and must not assume this monorepo's own resources become available merely because they exist in this checkout.

## Fixed decisions

- Deliver on `feat/fixed-agent-profile` in the current linked worktree.
- The installed package-agent catalog contains exactly six named agents: Worker, Researcher, QA, Reviewer, Git, and Utility.
- Worker and Git use Terra medium; Researcher uses Luna low; QA and Utility use Luna medium; Reviewer uses Opus 5 medium.
- Every child profile pins its own model and thinking level and has no fallback.
- The human selects Fable or Sol for the parent; installation does not overwrite parent model settings.
- Remove the configured Sol worker and automatic Sol escalation.
- Any Sol child use requires a focused question and explicit approval.
- The root Git install is the curated profile boundary; no new production agents package is added.
- Exact six-agent visibility requires the documented `disableBuiltins: true` setting; installation does not mutate user settings.
- QA and Utility have no edit or write tools. QA may run Bash and Playwright.
- Git may push the current non-default task branch. A post-rebase force update must use `--force-with-lease`; default/protected branches, tags, other remotes, and unleased force pushes require explicit approval.
- Keep one integrated `code-review` skill adapted from the pinned source. It uses Pitch and plan plus Standards in one Opus Reviewer pass and loads only applicable language references.
- `/improve` reports architecture candidates and hands a selected candidate to Shape; it does not implement directly.
- Engineering and Productivity resources are included in the root profile and remain independently installable packages.
- Upstream material is pinned to commit `068b6e0c62393147daf03530149cdce209c93da8` and attributed under MIT.
- Local edits and verification are authorized. Commits, pushes, pull requests, merges, releases, publication, deployment, and worktree removal for this repository are not authorized by this pitch.

## Rabbit holes

- Building a new orchestration runtime or dynamic model router.
- Estimating subscription quotas or automatically switching providers near a limit.
- Keeping hidden Sol, Fable, or package-builtin fallbacks “just in case.”
- Giving every child every installed skill or tool.
- Turning Researcher or Utility into another writer.
- Running duplicate Claude review and AskClaude calls without a distinct question.
- Mirroring upstream issue-tracker, grilling, HTML-report, or desktop-opening scaffolding.
- Adding a second review skill, review command, or implementation loop.
- Making production resources aware of this monorepo's package layout.

## No-gos

- Do not write `~/.pi/agent/settings.json`, project Pi settings, credentials, or bridge configuration during installation.
- Do not silently override a child model or thinking level per run.
- Do not silently retry Terra work with Sol or another model.
- Do not expose edit/write to Researcher, QA, Reviewer, or Utility.
- Do not allow parallel writers in one worktree.
- Do not let a child make product, architecture, scope, or approval decisions.
- Do not use ordinary child agents as orchestrators.
- Do not push a default/protected branch, tags, another remote, or use plain `--force` by default.
- Do not copy upstream material without the complete MIT notice and pinned source.
- Do not keep both `reviewing-changes` and `code-review`.
- Do not make `/improve` write production code or bypass Shape approval.
- Do not assume resources available in this repository are installed in a target repository.

## Acceptance criteria

- **AC-001 — Six fixed agents:** The root profile loads exactly `worker`, `researcher`, `qa`, `reviewer`, `git`, and `utility`, with the models and thinking levels in the accepted table.
- **AC-002 — No hidden substitution:** Every profile has no fallback, and no workflow silently overrides its model or thinking level.
- **AC-003 — Controlled Sol:** `sol-worker` and automatic Sol escalation are removed; every proposed Sol child run requires a justified `question` and explicit approval.
- **AC-004 — Correct role authority:** Worker is the normal implementation writer; Researcher, QA, Reviewer, and Utility cannot edit; Git can edit only for Git-owned work and follows the bounded push policy.
- **AC-005 — Efficient parent flow:** Shape and planning retain parent judgment but can use one bounded Researcher handoff; QA, Reviewer, Git, and Utility are invoked only for their distinct evidence or delivery roles.
- **AC-006 — Cross-provider use:** Normal implementation uses OpenAI Terra/Luna while formal review uses Claude Opus; documentation accurately explains Fable/Sol parent choice and AskClaude's non-bridge-only availability.
- **AC-007 — Exact catalog setup:** Root documentation gives a tested `disableBuiltins: true` configuration and does not claim installation can mutate user settings.
- **AC-008 — Agent skills:** Each child receives only named private skills and tools needed for its role; it does not depend on all target repositories having this monorepo's catalog.
- **AC-009 — One review skill:** `reviewing-changes` is removed, `code-review` is the only review method, and its integrated Pitch-and-plan and Standards flow produces actionable single-reviewer findings across applicable language references and all required risk areas.
- **AC-010 — Design in delivery:** Worker, planning, and Reviewer apply the expanded `codebase-design` vocabulary where module shape changes, without turning it into a speculative abstraction checklist.
- **AC-011 — Improve command:** `/improve` discovers and ranks evidence-backed architecture opportunities, asks the human to select one, and routes the choice to Shape without editing production code.
- **AC-012 — Git conflict support:** The Git agent can resolve and verify in-progress merge or rebase conflicts using the installed commit, rebase, conflict, GitHub, and Worktrunk skills.
- **AC-013 — Safe push:** Git can push a current non-default task branch and can use verified `--force-with-lease` after rebase, while forbidden destinations and unleased force remain approval-gated.
- **AC-014 — Root resources:** The recommended root install exposes complete Engineering and Productivity skills and prompts while both packages still pass independent packed-install checks.
- **AC-015 — Repository neutrality:** Root `AGENTS.md` explicitly prohibits production resources that assume this monorepo, its paths, its package names, or its locally available skills and extensions.
- **AC-016 — Attribution:** Every copied or adapted upstream resource is listed with its pinned commit and complete MIT notice; existing debugging source preservation remains tested.
- **AC-017 — Verification:** Focused agent/resource contract tests, package tests, source and packed smoke tests, and `npm run check` pass against the final worktree.
