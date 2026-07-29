# Slice 001 evaluation

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

Dogfood all route failures in a disposable repository, then route successfully
with Worktrunk. Natural trigger sampling and deterministic Pi reload remain
manual acceptance work; do not commit provider responses.
