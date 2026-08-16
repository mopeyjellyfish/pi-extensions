---
name: code-review
description: Review a fixed diff in one read-only pass against the accepted pitch and plan plus repository Standards. Use for branches, pull requests, work-in-progress changes, or a review from a supplied fixed point.
---

# Code review

Review one fixed diff on two explicit axes:

- **Pitch and plan** — does the change satisfy accepted product intent,
  boundaries, slices, completion conditions, and explicit human decisions?
- **Standards** — does the change follow target-repository instructions,
  architecture decisions, engineering contracts, and applicable idiomatic
  language or framework guidance?

Use one reviewer for both axes in one read-only pass. Do not spawn subagents or
require external issue-tracker setup. Without a dedicated Reviewer profile, use
one read-only reviewer or the direct parent.

## 1. Pin the review boundary

Resolve the fixed point supplied by the user or handoff: a commit, merge base,
branch, tag, pull request head, or recorded worktree diff. State it before
reviewing. For committed work, capture the three-dot diff against the merge base
and the commit list once:

```bash
git diff <fixed-point>...HEAD
git log <fixed-point>..HEAD --oneline
```

For uncommitted work, record the exact status, diff, and HEAD used for the pass.
If the ref does not resolve, the expected diff is empty, or the worktree changes
during review, stop and ask for a stable boundary instead of reviewing a moving
target.

## 2. Read the pitch and plan

The accepted pitch and accepted plan are the primary intent sources. Read their
paths from the handoff or ask for them when the review is expected to follow a
formal feature flow. Include later explicit user decisions that changed the
accepted outcome.

A bounded request, confirmed bug outcome, issue, or user-supplied intent is the
fallback only when no formal pitch and plan exist. For a missing pitch or plan,
state the gap as unavailable evidence; do not reconstruct intent from the
implementation.

For the **Pitch and plan** axis, check:

- requested behavior that is missing or only partially implemented;
- behavior, dependencies, or cleanup outside the accepted scope;
- implementation that appears to satisfy a requirement but has the wrong
  observable result;
- slice completion conditions and required evidence that are absent; and
- conflicts with explicit human decisions or stated no-gos.

Cite the pitch, plan, request, or decision used for every finding on this axis.

## 3. Read repository Standards and applicable references

Read only the target-repository sources needed to judge the diff: `AGENTS.md`,
contribution and architecture guidance, nearest domain context, changed public
contracts, and relevant tests. Repository instructions and explicit project
standards always override general guidance.

Inspect the fixed diff for changed languages and frameworks, then load only the
applicable guides from `references/`:

- `references/typescript.md` for TypeScript and typed JavaScript;
- `references/react.md` for React components, hooks, and framework boundaries;
- `references/go.md` for Go;
- `references/sql.md` for SQL, schemas, migrations, and query behavior.

Use imports, manifests, file extensions, and changed runtime boundaries as
evidence of applicability. Do not load every reference by default. Treat each
reference as review questions, not universal violations. Do not report style or
static findings already enforced by current tooling.

## 4. Apply the smell baseline

Use this baseline only as labeled judgment calls. A documented repository rule
wins, and a smell name is never evidence by itself.

- **Mysterious Name** — a function, variable, or type whose name does not reveal
  what it does or holds. Rename it; if no honest name emerges, the design is
  unclear.
- **Duplicated Code** — logic that encodes the same current rule appears in more
  than one changed location and must change together. Extract the shared rule.
- **Feature Envy** — a method reaches into another module's data more than its
  own. Move behavior toward the data it uses.
- **Data Clumps** — the same fields or parameters repeatedly travel together.
  Give the domain concept one type where evidence supports it.
- **Primitive Obsession** — a primitive stands in for a domain concept with
  invariants or behavior. Give the concept a focused type.
- **Repeated Switches** — the same branch on the same kind recurs. Centralize the
  policy or use one dispatch model.
- **Shotgun Surgery** — one rule change requires scattered edits. Gather the
  rule behind one useful module interface.
- **Divergent Change** — one module changes for unrelated reasons. Separate the
  responsibilities at an evidence-backed seam.
- **Speculative Generality** — abstractions, parameters, or hooks serve no
  accepted need. Delete or inline them until a real variation exists.
- **Message Chains** — callers navigate internal object structure. Hide the walk
  behind the module that owns it.
- **Middle Man** — a module mainly forwards calls without hiding complexity.
  Remove it and call the useful module directly.
- **Refused Bequest** — an implementation inherits a contract it mostly ignores.
  Prefer composition or a smaller interface.

## 5. Review both axes in one pass

Trace changed behavior through callers, tests, failure paths, and public seams in
proportion to risk. Review correctness, regression, security, performance, edge
cases, falsifiable tests, architecture, testability, and maintainability. Apply
`codebase-design` vocabulary when module shape or a test seam changed.

Keep observations separate from findings. Tool-enforced style, unsupported
speculation, broad cleanup outside the diff, and a preferred alternative without
a concrete consequence are not findings.

## 6. Report actionable findings

Order material findings by blocker, high, medium, then low. Every finding must
include:

- file and location;
- **Pitch and plan**, **Standards**, or both axes;
- cited requirement, repository rule, reference question, or changed evidence;
- concrete consequence;
- confidence and unavailable evidence; and
- the smallest useful correction direction without making the edit.

Then summarize what was checked, what could not be checked, and the finding
count by axis. If no material finding remains, say so plainly. No finding
authorizes edits, commits, pushes, or other mutations.
