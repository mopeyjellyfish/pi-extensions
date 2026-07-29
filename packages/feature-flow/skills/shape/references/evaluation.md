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
