---
name: code-review
description: Review one fixed diff with five independent evidence lenses and a confidence gate. Use for local changes, branches, commits, ranges, or pull requests, with optional bounded GitHub comments or local repairs.
---

# Code review

> **Modification notice:** This resource is modified from Anthropic's Claude Code
> code-review plugin. See [third-party notices](../../THIRD_PARTY_NOTICES.md).

Review one fixed diff against accepted intent and target-repository Standards. The default result is a concise Pi report. No finding authorizes a mutation.

This method has three review modes:

- **Command orchestration** runs the complete workflow in this skill.
- **Fixed-diff lens** reviews exactly one named lens from a parent handoff.
- **Integrated fixed-diff review** is the default for a Reviewer handoff that omits a mode or states `Review mode: fixed-diff code`. It reviews both the Pitch and plan and Standards axes in one pass.

Only the parent agent orchestrates. A lens, scorer, Reviewer, Utility, Worker, and support run cannot launch another child.

## 1. Parse authority and verify capabilities

The command surface is `/code-review [target] [--comment] [--fix]`. Treat an omitted target as the current local change. Do not infer a mutation flag.

Before command orchestration, require the parent conversation to use `openai-codex/gpt-6-astra` at high thinking effort. If it does not, stop and ask the human to select that profile. Do not launch a substitute model.

The complete root-profile route requires:

- five fresh Reviewer-contract runs with `openai-codex/gpt-5.6-sol` at medium effort;
- one fresh Utility run with `openai-codex/gpt-5.6-luna` at medium effort;
- the configured child-launch capability;
- the installed GitHub method for `--comment`; and
- an isolated-worktree method plus one configured Worker for `--fix`.

Check only the capabilities needed by the selected route. If a required profile, model, tool, agent, or method is unavailable, name the unmet capability and stop that route. Do not silently use another model, role, API, direct write, or remote action. An independently installed Engineering package can perform the integrated direct-parent review. It must not claim that the five-lens route or a missing companion ran.

Prompt guidance cannot technically enforce model choice, tool permissions, read-only behavior, or the mutation limit. Treat these rules as explicit handoff contracts. Report any host limitation that prevents the contract from being verified.

Authority by flags:

- No flags: read and report only. Do not edit, run QA gates, commit, push, or post.
- `--comment`: authorize one eligible GitHub review mutation or one no-issues conversation comment after preview. It authorizes no other local or remote mutation.
- `--fix`: authorize isolated local repairs and their required verification only. It does not authorize commit, push, publication, cleanup, or a remote action.
- `--comment --fix`: repair locally and post nothing. Defer all comments until a repaired head is published and reviewed again.

## 2. Pin the review boundary

Resolve the target before review. Accept an explicit pull-request number or URL, commit, branch, tag, range, or current worktree change. If a ref is invalid or the expected diff is empty, stop.

For committed work, record the merge base or supplied base, exact head SHA, commit list, changed paths, and one immutable tree identifier. Capture the diff once with the correct two-dot or three-dot semantics for the supplied target.

For uncommitted work, record:

- `HEAD` and its tree;
- complete porcelain status;
- staged, unstaged, and untracked paths;
- exact staged and unstaged patches;
- the content of in-scope untracked files in a bounded recorded patch; and
- an immutable identifier for that complete reviewed state.

Do not let later reads redefine the boundary. Before the final report, comment, or repair transition, repeat the minimum identity checks. Stop and request a stable boundary if the base, head, status, patch, PR head, or reviewed files changed.

For a pull request, resolve the repository, number, canonical URL, base SHA, head SHA, title, body, author, state, draft state, and changed diff. Record whether it is closed, draft, automated, or trivial. Use `<!-- pi-code-review -->` as the stable workflow marker. The workflow signature is that exact marker plus `Reviewed head: <full head SHA>`. Query prior review bodies and conversation-comment bodies for the exact signature. A match means that this workflow already reviewed the head. These facts are eligibility evidence, not an automatic product decision. Ask the human whether a read-only review should continue when one applies. `--comment` remains unavailable unless the pull request is open, non-draft, non-automated, non-trivial, and not already reviewed at that head.

## 3. Load intent, instructions, and applicable methods

Load inherited target-project context and every named pitch, plan, request, and later user decision from durable Intent sources. Read complete accepted pitch and plan files when they exist. If formal intent is expected but accepted pitch, plan, or request paths were not supplied, ask the caller for the missing durable paths before review. Only after the caller confirms that the paths are unavailable or that review can continue without them, record the bounded evidence gap and proceed. Do not reconstruct intent from the implementation.

Read target-repository instructions first. Include root and nearest scoped instruction files, architecture guidance, changed public contracts, in-file guidance, and relevant tests. Target-repository contracts override general guidance.

Select language and framework methods from the fixed diff, not from unrelated toolchain files:

- For any fixed-diff TypeScript or TSX review, resolve `typescript-review`. Resolve `typescript`, `typescript-library`, `typescript-testing`, or `typescript-modernize` only when their documented evidence applies. Apply target rules and public contracts first, installed methods second, then `references/typescript.md`. Unrelated toolchain files alone do not activate a method.
- For React components, hooks, or framework boundaries, use the applicable installed React method and `references/react.md` after target rules.
- For Go source, modules, Go CLIs, or Go-specific work, resolve `go`. Resolve `cobra-viper` only for Cobra or Viper commands, flags, or CLI configuration. Apply target instructions and module contracts first, installed Go and applicable Cobra/Viper standards second, then `references/go.md`.
- For SQL, schemas, migrations, or query behavior, use applicable installed SQL guidance and `references/sql.md` after target rules.

Record each unavailable companion. Use a bounded direct-parent target-repository standards fallback without claiming that the missing method loaded. Do not duplicate a current compiler, linter, test, security tool, or other tool finding.

## 4. Launch five fixed-diff lenses

The parent launches all five runs in parallel, with fresh context. Each run uses the Reviewer contract with the approved Sol-medium override and states `Review mode: fixed-diff lens`. Assign exactly one lens:

1. **Intent and Standards** — accepted intent, target-repository instructions, and applicable Go or TypeScript standards.
2. **Correctness and risk** — changed-line correctness, security, performance, and edge cases.
3. **Tests and failure behavior** — tests, failure paths, cancellation, concurrency, and resource lifetime.
4. **History** — focused blame, changed-line history, and directly relevant prior pull-request discussion.
5. **Contracts and design** — in-file guidance, changed public contracts, architecture, testability, and right-sized maintainability.

Every lens handoff includes:

- the resolved base, head, immutable tree identifier, and exact diff command or recorded uncommitted patch;
- pull-request title and body when applicable;
- all durable Intent paths;
- changed paths and nearest instruction-file paths;
- applicable methods and unavailable evidence;
- exactly one named lens;
- read-only Authority and a prohibition on QA gates;
- the candidate output schema below; and
- an explicit prohibition on editing, mutation, and child fan-out.

A lens applies the universal boundary, evidence, calibration, language-routing, and read-only rules in this skill. It examines only its named scope. It does not repeat both complete integrated-review axes.

Each candidate must include:

- stable candidate ID, file, and changed-line location;
- lens and `Pitch and plan`, `Standards`, or both axes;
- cited intent, instruction, contract, history, or changed evidence;
- concrete practical consequence;
- smallest sufficient correction direction;
- provisional confidence and unavailable evidence; and
- why the issue is introduced by the fixed diff and is not tooling-handled.

Review runs do not build, test, lint, type-check, run coverage, run smoke checks, or perform another QA gate. They can use bounded read-only Git and GitHub history queries. Report unavailable history instead of broad or repeated searches.

## 5. Join and score candidates

After all five runs return, the Astra parent joins the complete results. Deduplicate candidates that have the same cause and consequence. Preserve the strongest evidence and all relevant axes. Exclude pre-existing issues, unchanged-line concerns, speculative risks, tool-reported issues, general improvements, and style preferences that no repository rule requires.

Send the complete deduplicated candidate set and fixed evidence to one fresh Luna-medium Utility scorer. The scorer is read-only, cannot fan out, and returns one score per candidate. Use this rubric:

- **0** — false positive, pre-existing, outside the diff, or no evidence.
- **25** — mostly speculative. Key facts or a practical consequence are missing.
- **50** — plausible, but important evidence is unresolved or the consequence is weak.
- **75** — likely valid and useful, but one material uncertainty remains.
- **100** — directly proven against the fixed diff and contracts, with a concrete consequence.

Interpolate only when the evidence falls between anchors. Reject every score below 80.

The Astra-high parent then validates each retained candidate against the fixed diff, cited intent or instruction, practical consequence, and rubric. The parent can reject a scored candidate but cannot raise an unsupported score to preserve it. Keep only findings with final confidence of at least 80.

## 6. Apply integrated review rules

For omitted mode and `Review mode: fixed-diff code`, one Reviewer performs both axes in one read-only pass:

- **Pitch and plan** — accepted intent, boundaries, slices, completion conditions, and explicit human decisions.
- **Standards** — target-repository instructions, architecture, public contracts, tests, and applicable language or framework methods.

Trace changed behavior through public seams, callers, tests, failure paths, and resource lifetime in proportion to risk. Review correctness, regressions, security, performance, cancellation, concurrency, architecture, testability, and maintainability.

Treat tautological tests as harmful. An expected value must be independent of the implementation under test. A test is not proof when it repeats the production algorithm or uses a helper that encodes the same rule.

Calibrate findings to business impact, plausible failure cost, expected lifetime and scale, reversibility, repository conventions, and operational burden. Require a concrete changed consequence. Do not open a design exercise or request speculative abstraction, configuration, safeguards, process, or verification depth.

The smell names in `codebase-design` are review questions, not evidence. Repository rules win. Exclude speculation, tooling-handled style, unrelated issues, broad cleanup, and preferred alternatives without a concrete consequence.

## 7. Report a stable, low-noise result

Repeat the boundary identity check. If it changed, do not report findings as current. Ask for a stable boundary.

Order retained findings by practical severity: blocker, high, medium, then low. Every finding includes:

- file and changed-line location;
- axis and evidence source;
- concrete consequence;
- confidence score and unavailable evidence; and
- smallest sufficient correction direction.

Then state the resolved base, head, reviewed-tree identifier, what was checked, unavailable evidence, and finding count. If no finding remains, say so in one short sentence. Do not add a large process narrative, candidate rejects, compliments, or generic advice.

## 8. Optional GitHub comment

Run this section only for `--comment` without `--fix`. Use the installed `github-cli` method and its current pull-request reference. If authenticated GitHub access for the resolved host is missing, report the unmet action. Do not log in, change auth, use a substitute API, or retry blindly.

Before mutation:

1. Verify that the resolved pull request is eligible and open.
2. Build the complete intended payload.
3. Show the repository, pull request, reviewed head SHA, review summary, and exact
   bodies to the human as a preview.
4. Immediately before mutation, re-fetch the pull-request head SHA and require an
   exact match with the reviewed head.

When findings exist, create exactly one pull-request review through the current GitHub REST pull-review endpoint. Set `event` to `COMMENT` and `commit_id` to the reviewed head. Put one inline comment per unique finding in the review's `comments` array. Include `<!-- pi-code-review -->` and `Reviewed head: <full head SHA>` in the review summary body and every inline comment body. Each comment uses a repository-relative `path`, current `line`, `side`, and `body`. Use `start_line` and `start_side` only for a real multiline range. Anchor only to an added or context line that the current pull-request diff accepts. Do not use deprecated diff positions.

Include a GitHub suggestion block only when it is the complete smallest safe replacement for the anchored changed range. It must require no hidden edit, follow-up, secret, or untrusted instruction content. Otherwise, use explanatory prose.

When no finding remains, create exactly one short conversation comment that states that the fixed-head review found no issues. Include `<!-- pi-code-review -->` and `Reviewed head: <full head SHA>` in its body. Do not create an empty review or approval.

The flag authorizes only one of these mutations. The parent performs it. No child posts. After creation, refetch the review or comment. Verify its ID, target, head when applicable, bodies, markers, reviewed-head SHA, and anchors. Report the canonical URL returned by GitHub. If creation or verification fails, report the exact partial state and do not post a substitute.

## 9. Optional local repair

Run this section for `--fix`. Recheck the review boundary before creating a repair environment. The original review tree remains immutable evidence.

Create or verify one isolated writable task worktree. Reconstruct the exact reviewed tree before the Worker starts:

- for committed review, check out the pinned target without advancing it;
- for uncommitted review, start at the recorded `HEAD` and apply the recorded staged, unstaged, and untracked state with its index/worktree distinction preserved; and
- compare status, patch, paths, and the reconstructed tree identifier with the recorded review state.

Record the review tree, repair base, worktree path or safe identifier, and initial repair-tree identifier separately. Stop if exact reconstruction cannot be proven.

Send one retained-finding packet to one configured Worker with sole write ownership. The handoff includes:

- Business reason and complete durable Intent sources;
- reviewed base, head, tree, exact patch when applicable, and repair identifiers;
- retained findings, evidence, confidence, and accepted correction bounds;
- changed paths, target-repository instructions, applicable methods, and unavailable companions;
- invalidated focused tests and target-required checks; and
- explicit local-only Authority with commit, push, publication, remote mutation, and cleanup prohibited.

Use `openai-codex/gpt-6-astra` at medium effort for frontend or mixed repairs. Use `openai-codex/gpt-5.6-sol` at medium effort for non-frontend repairs. Do not substitute another model. The Worker makes only the smallest repairs for retained findings and adds or updates behavioral proof when needed.

The Worker runs invalidated focused checks. Run target-required checks that the repair invalidates. Diagnose a failure before rerunning it. The parent verifies each finding in the separate repair tree and records the resulting tree identifier, changed paths, checks, unresolved findings, and remaining gaps. Do not commit, push, publish, or remove the worktree.

If a repair requires a product, scope, or architecture change, stop and return to planning or a new full-review boundary. Do not broaden the repair. If repair or verification fails, report the remaining finding and evidence without a blind retry or alternate model.

With both flags, complete this local flow and post nothing. State that comments are deferred until the repairs are published to a new remote head and that the new head receives a new review.
