# Feature-flow evaluation

## Trigger table

| Prompt                                                         | Expected                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| “We’re working on a feature that resumes interrupted uploads.” | Load `shape`; begin workspace preflight.                       |
| “Shape an end-to-end audit export feature.”                    | Load `shape`; begin workspace preflight.                       |
| “Continue the feature recorded in this worktree.”              | Load `shape`; inspect the current ledger.                      |
| “Can you improve uploads?”                                     | Ask whether this is end-to-end feature shaping before writing. |
| “Fix this typo.”                                               | Do not load `shape`.                                           |
| “Review this pull request.”                                    | Do not load `shape`.                                           |

## New-feature and write-order rubric

A passing run:

1. Reads repository instructions and bounded Git/Worktrunk facts only.
2. On dirty checkout, ambiguous base, branch collision, or route mismatch, asks
   one routing question and leaves `docs/features/<feature>/` absent.
3. Uses Worktrunk—not raw Git worktree commands—to create or activate the route.
4. Runs `init` with the selected full base SHA only after routing.
5. Creates exactly `pitch.md` and top-level `index.json`; no empty optional
   directories exist.
6. Keeps the pitch draft and derives shaping as the next action.

Malformed JSON, unknown ledger fields, stale branch/base facts, an edited
accepted pitch, multiple active slices, incomplete done evidence, and a fake
`Feature-Slice` trailer must fail closed without rewriting the ledger. A done
slice declaring `commit` remains the sole next action until Git contains a
matching commit whose tree includes that slice's done ledger transition.

## Acceptance and repitch rubric

A passing shaping run:

1. Uses repository truth to answer available facts and researches current
   primary sources only when an external unknown can materially change the
   pitch.
2. Asks unresolved decisions in adaptive recommended batches and records a
   qualitative appetite, alternatives, material boundaries, Mermaid where
   useful, self-contained normative content, and explicit banking policy.
3. Creates the smallest useful prototype only for material visual or interaction
   uncertainty and never creates empty `assets/` or `prototypes/` directories.
4. Runs prospective validation, separate read-only review, routine fixes, and
   re-review before exactly one question-tool approval with the complete current
   `pitch.md` attached as a Markdown document. Routine fixes add no human gate.
5. On approval, changes only draft-to-accepted status bytes, independently
   verifies the final SHA-256 against `index.json`, and rejects a one-byte edit.
6. On a material change, preserves exact accepted bytes as `pitch-vNNN.md`,
   archives used plans as `plans-vNNN/`, advances to a complete draft with no
   current slices, and leaves banked code untouched. Archive collisions,
   missing plan sources, and ordinary injected failures write nothing or roll
   back completely.
7. Repeats blocker-free review and one complete document approval before the
   replacement pitch is accepted.

Multi-file writes guarantee complete prospective validation and ordinary-error
rollback, not process-crash atomicity. Dogfood recovery from bounded staging or
backup artifacts without adding a daemon, database, or service.

## Planning and pending-refinement rubric

A passing planning run:

1. Derives `planning` only from an accepted hash-pinned pitch with no registered
   slices, verifies the accepted bytes, and creates the smallest coherent
   complete candidate set outside canonical `plans/`.
2. Keeps every genuinely independent `depends_on: []`; it never invents a chain
   merely because Build is serial. Every plan contains the minimal v2 contract
   and no estimate or mutable status.
3. Runs read-only complete-set validation, separate read-only whole-set review,
   sole-writer routine fixes, validation, and fresh re-review until blocker-free.
   It never asks for plan approval or treats helper success as semantic review.
4. Registers the blocker-free set atomically, with ordered matching pending
   records, exact accepted-pitch pins and literal AC coverage, canonical IDs,
   filenames and paths, a valid meaning-neutral DAG, bounds, and one-current
   invariants. Plan Goals remain rich human detail; bounded ledger goals are
   concise resume summaries, not required text mirrors.
5. Refines, splits, merges, or reorders through a reviewed complete replacement
   set. Active, blocked, done, and cut plan bytes and records plus untouched
   pending plan bytes and records remain identical. Non-Goal pending changes
   preserve the existing ledger summary; a changed pending Goal updates only its
   record, and new slices seed summaries from their plan Goals. Injected failures
   restore every canonical file and ledger byte.
6. Leaves semantic verticality, dependency meaning, feasibility, public seam and
   tracer quality, dogfood quality, and pitch-level classification to the
   planner and reviewer. It does not activate or deliver a slice.

Dogfood two independent pending outcomes, reorder them without adding a
dependency, then split and merge pending outcomes around one fixed slice in a
disposable feature. Tamper one accepted pitch byte, one AC literal, one plan
path, one dependency cycle, and one fixed plan byte and confirm every case fails
closed. Repeat blocker-free whole-set review and the path after an idle reload.

## Shared-checkout resume rubric

A passing `/shape` without a brief:

1. Calls Worktrunk status/list before helper candidate inspection and uses only
   linked paths Worktrunk returned.
2. Leaves every inspected ledger and pitch byte-identical.
3. Activates the sole `valid` result through Worktrunk, then verifies and resumes
   its derived phase/current slice/next action.
4. Shows one structured choice for several `valid` results and activates only
   the selected branch.
5. Reports `stale` branch/base and `invalid` malformed, unknown-field,
   non-canonical-path, out-of-bounds, dependency/status, or hash cases without
   activation or a new-brief request.
6. Requests a brief only for empty `valid`, `stale`, and `invalid` arrays.

Dogfood no candidate, one valid candidate, several valid candidates, and stale
and malformed candidates in disposable linked worktrees. Repeat after an idle
Pi reload. Natural trigger sampling and deterministic Pi reload remain manual
acceptance work; do not commit provider responses.
