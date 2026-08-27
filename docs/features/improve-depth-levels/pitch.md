---
status: accepted
---

# Shape: Appetite-aware architecture improvement depth

## Problem and evidence

`/improve` accepts an optional scope and performs one bounded architecture scan. It does not let the caller state how local, broad, or exhaustive the scan should be.

The same flow currently covers two different needs:

- small, independent improvements that can become parallel delivery lanes
- broad architecture work that needs Shape and coordinated planning

The caller also needs to scope discovery by a module, package, vertical feature slice, cross-cutting pattern, or test surface. Test improvements must use the target language's established patterns. For Go work, the installed `go` skill must guide package, interface, implementation, and test recommendations.

Without an explicit appetite, `/improve` can scan too broadly for a quick-win request or too narrowly for an overarching architecture request. Its current handoff also sends every selected candidate to Shape and planning, even when one bounded candidate has clear intent and can safely enter `implement`.

## Proposed solution

Add an **improvement depth** to `/improve` and `improve-codebase-architecture`. The accepted values are `low`, `medium`, `high`, and `max`. Improvement depth is the caller's appetite for discovery coverage and change impact. It is not the `codebase-design` term **Depth**, a model thinking level, implementation authority, or a requirement to invent work of that size. Keep **Depth** for its existing interface-leverage meaning. Never abbreviate the new term to "depth" in the `/improve` prompt or skill.

Use this command shape:

```text
/improve [low|medium|high|max] [optional scope]
```

Keep existing calls valid. For non-empty input, the prompt passes its natural-language arguments unchanged. Match an exact leading level token without regard to letter case, then normalize it to lowercase. A level-only call such as `/improve high` uses `high` improvement depth and infers a bounded scope that fits that appetite. If the first token is not recognized, use `medium` and treat all arguments as scope. To use a scope that starts with a reserved token, give an explicit level first. For example, `/improve medium low latency path` uses `low latency path` as the scope. Keep the empty-argument default sentence and update it to request `medium` improvement depth with an inferred bounded scope. A scope can name a module, package, subsystem, vertical feature slice, architecture pattern, test surface, pain point, or change-history area.

Treat the selected level as:

| Level    | Discovery and impact appetite                                                                                                                                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `low`    | Inspect one localized area, its immediate callers, its nearest tests, and limited relevant history. Report up to three independent, reversible quick wins. Exclude public-contract changes, migrations, and cross-package redesign.                                                                                 |
| `medium` | Inspect one focused module, package, subsystem, or vertical slice, including direct dependencies, callers, tests, and relevant history. Find coherent bounded improvements. This is the default.                                                                                                                    |
| `high`   | Inspect a broad module, package, vertical slice, or pattern across adjacent modules. Cover the declared scope thoroughly, compare material alternatives, and include architecture decisions, risks, and coordination needs.                                                                                         |
| `max`    | Inspect a repository-wide or explicitly large pattern as exhaustively as practical. Inventory the declared coverage and exclusions. Include cross-package effects, dependencies between candidates, migration needs, and staged architecture options. Never claim exhaustive coverage beyond the declared boundary. |

The level is an upper bound on acceptable impact and a minimum expectation for discovery thoroughness. Evidence can justify a smaller candidate than the requested level. The skill must not force a candidate to match the appetite. It can report that no supported improvement was found.

For each candidate, keep the current evidence-backed architecture fields and add:

- the selected improvement depth
- the scanned scope, coverage, and exclusions
- the expected change impact and reversibility
- candidate dependencies, overlap, and integration points
- the target-language improvement pattern
- the recommended workflow route and its reason

Test-focused discovery is valid architecture improvement work when it improves the test surface, maintenance locality, or defect detection. Consolidate similar tests only when the cases exercise the same behavior with shared setup and assertions. Preserve clear case names and isolated failure evidence. Use the target language's normal pattern instead of applying a generic deduplication rule.

For Go source, modules, or Go-specific recommendations, resolve and follow the installed `go` skill before evaluating candidates. Apply target-repository standards first. Table-driven subtests remain the Go default from the installed `go` skill. Merge existing separate tests into one table only when they exercise the same behavior with shared setup and assertions. The installed `go` skill decides any unclear Go test-pattern case. Do not create speculative interface types, layer packages, generated mocks, or abstractions to satisfy generic architecture advice. If the `go` skill is unavailable in an independent installation, record the unmet method and use the existing bounded direct-parent fallback without claiming that the skill loaded.

Present no more than three top candidates in the decision question, plus a no-change option. Permit multiple selection only when the report marks the candidates independent and the question states that no-change is exclusive. Use single selection when candidates overlap or depend on each other. If the `question` tool is unavailable, present the same bounded report and selection rules in conversation.

After selection, route by accepted intent, risk, and coordination cost. Improvement depth informs the route but does not replace `developing-changes`:

1. Send one clear, bounded candidate to `implement`.
2. Send multiple independent clear candidates to `planning-changes`. Planning can mark them `parallel-ready` only after it proves separate ownership, isolated worktrees, non-overlapping changes, and named integration points.
3. Send clear coordinated or dependent work to `planning-changes`.
4. Send unresolved, hard-to-reverse, cross-cutting, migration, or major architecture work to Shape, then planning after pitch approval.

If a selected route skill is unavailable, return the same self-contained candidate brief to the direct parent. Name the intended route and state that implementation has not started. Do not assume an independent Engineering install includes `implement`, `planning-changes`, Shape, or the `question` tool.

`/improve` remains a read-only discovery route. Candidate selection authorizes only the next workflow handoff. It does not authorize production edits, worker launches, commits, publication, or worktree cleanup.

Deliver this as one Engineering package delivery unit with two behavior slices:

1. The prompt and skill accept the four improvement depths, default to `medium`, separate scope from appetite, and report bounded coverage.
2. Candidate selection supports safe multi-selection, language-aware test guidance, mandatory Go routing for Go work, and proportionate handoff to `implement`, planning, or Shape.

The pitch and plan share the implementation delivery unit. They have no independent merge value.

## Boundaries and no-gos

- Change only the Engineering skill, `/improve` prompt, package README, and focused resource tests, plus feature documents.
- Keep the package independently installable and repository-neutral.
- Do not add an extension, runtime argument parser, orchestration engine, issue-tracker integration, or repository-specific path.
- Keep the existing pinned upstream attribution in `THIRD_PARTY_NOTICES.md` unchanged.
- Do not couple improvement depth to model thinking levels, subagent models, file count, or a fixed token budget.
- Do not let `/improve` edit production code or start implementation directly.
- Do not mark selected work as parallel only because its improvement depth is `low`.
- Do not force broad findings when evidence supports only local work.
- Do not treat syntax-only test duplication as architecture evidence.
- Do not weaken Shape or complete-plan approval for material work.

## Decision-changing research and risks

- `codebase-design` already uses **Depth** for interface leverage. Keep that existing meaning and label it explicitly where both terms occur. The new user-facing concept must always use **improvement depth** or **appetite**.
- Pi prompt templates pass positional and aggregate arguments but do not validate enum values. For non-empty input, the prompt passes `${ARGUMENTS}` unchanged. Its existing `${ARGUMENTS:-...}` default remains and explicitly supplies `medium` improvement depth for an empty call. The skill recognizes an optional case-insensitive leading level without a new runtime extension.
- The `question` tool permits at most four options. Three candidates plus one no-change option keeps the selection bounded.
- Parallel work is safe only after planning proves non-overlap and separate worktree ownership. A multi-select decision alone is insufficient.
- A `max` scan can become unbounded. The report must declare coverage, exclusions, and evidence gaps instead of claiming complete repository knowledge.
- Go guidance can conflict with generic deep-module vocabulary. Target-repository standards and the installed `go` skill keep precedence for Go-specific package, interface type, fake, and test decisions.

## Review evidence

- **Applicability:** Go-targeted guidance. The pitch changes Go-specific routing and test-improvement guidance for future Go work.
- **Fixed document:** `docs/features/improve-depth-levels/pitch.md` draft before approval.
- **Status:** Approved. The final replacement fixed-document Go specification review found no blocking issues or material questions.
- **Invalidation:** The review remains valid because only its status evidence changed after approval. Any later change to the improvement-depth contract, Go routing, proposed workflow routes, boundaries, authority, or acceptance criteria requires a replacement review.

## Authority

The parent owns improvement-depth semantics, candidate selection rules, and workflow routing. Approved delivery can change the named Engineering package resources, focused tests, README, and feature documents on `feat/improve-depth-levels`.

The caller prefers accept-all implementation. This preference is not implementation authority until the complete plan is approved. Pitch approval authorizes the bounded pitch commit and planning handoff. It does not authorize implementation, push, pull request publication, merge, release, deployment, destructive cleanup, or unrelated changes.

## Observable acceptance criteria

- **AC-001 — Four levels:** `/improve` and `improve-codebase-architecture` define `low`, `medium`, `high`, and `max` as improvement-depth values for discovery coverage and acceptable impact. The prompt argument hint shows the optional level and scope.
- **AC-002 — Compatible default:** `/improve <scope>` remains valid and defaults to `medium` when the first token is not a recognized level. An exact leading level token is reserved without regard to letter case and normalizes to lowercase. A caller can prefix `medium` to preserve a scope that starts with `low`, `medium`, `high`, or `max`.
- **AC-003 — Independent scope:** The caller can combine a level with a module, package, subsystem, vertical feature slice, architecture pattern, test surface, pain point, or change-history scope. A bare `/improve` requests `medium` improvement depth and an inferred bounded scope. A level-only call uses that level and infers a scope that fits its appetite.
- **AC-004 — Bounded evidence:** Every report states its selected level, scanned scope, coverage, exclusions, evidence strength, impact, reversibility, overlap, and recommended route.
- **AC-005 — Honest appetite:** A level does not force a finding. The report can return smaller supported work or no candidate, and `max` never claims coverage outside its declared boundary.
- **AC-006 — Safe quick wins:** `low` reports no more than three independent, reversible candidates and excludes public-contract changes, migrations, and cross-package redesign.
- **AC-007 — Safe selection:** The question offers at most three candidates plus no-change. It permits multi-selection only for candidates proven independent and treats no-change as exclusive.
- **AC-008 — Proportionate handoff:** One clear bounded candidate can enter `implement`. Multiple independent candidates enter planning for possible `parallel-ready` lanes. Coordinated clear work enters planning. Unresolved or material architecture work enters Shape, then planning after approval. If a route skill is unavailable, `/improve` returns a self-contained candidate brief, names the intended route, and states that implementation has not started.
- **AC-009 — Parallel safety:** No selected candidate starts a writer directly. Planning must prove isolated worktrees, sole ownership, non-overlap, dependencies, and integration points before parallel implementation.
- **AC-010 — Language-aware tests:** Test candidates use the target language's established patterns and consolidate cases only when behavior, setup, and assertions genuinely align.
- **AC-011 — Go authority:** Go source, modules, and Go-specific recommendations resolve and follow the installed `go` skill, after target-repository standards, before generic architecture guidance. Table-driven subtests remain the Go default. Existing tests are merged into one table only when they share behavior, setup, and assertions, with clear case failures. The installed `go` skill decides unclear Go test-pattern cases.
- **AC-012 — Read-only discovery:** `/improve` does not edit production code, start workers, commit, publish, or bypass Shape and plan approval.
- **AC-013 — Independent package:** The Engineering package remains repository-neutral and independently installable without a new extension or runtime dependency.
- **AC-014 — Focused proof:** Resource tests prove the argument hint and prompt expansion, the empty-call `medium` default, level-only calls, case normalization, leading-level recognition and escape, all four levels, scope handling, report fields, selection limits and fallback, unavailable route handling, the improvement-depth vocabulary distinction, Go and test guidance, workflow routing, and the no-direct-edit contract.
- **AC-015 — Documentation:** The Engineering README explains improvement depth, scope examples, multi-select quick wins, route selection, and Go precedence.
- **AC-016 — Completion checks:** The focused Engineering tests and `npm run check` pass against the final worktree.
