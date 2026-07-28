# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` is an independent, skill-only Pi package for
shaping a canonical evergreen product pitch, automatically reviewing a vertical
TDD plan set, and delivering it serially with deterministic artifact and Git
checks. It does not register an extension, ship agent definitions or custom
agents, or add a service or runtime dependency.

## Skill

- `feature-pitch` starts from the user's prompt, learns what context and code can
  answer, then asks only pointed unresolved product decisions before writing the
  smallest useful five-heading `feature-flow-pitch/v2` artifact. It runs fresh
  adversarial review and retains one complete-pitch human acceptance gate.
  Pitches contain no delivery decomposition or estimates.
- `feature-plan` starts decomposition only after that evergreen pitch is
  accepted, creates the complete serial vertical TDD plan set, validates it, and
  runs fresh whole-set review without a human plan gate.
- `feature-build` gates side effects on helper readiness, routes one slice at a
  time through fresh-context Red/Green/Refactor and adversarial review, and
  returns bounded AC evidence before any pre-authorized source-control action.

The skills delegate mechanical artifact validation, bounded Git facts, plan
readiness, direct dependencies, literal AC coverage, and narrow status/revision
transitions to the shipped Node-standard-library helper. Multi-plan transitions
restore earlier successful writes when an ordinary write fails. A process or
host crash can still interrupt the multi-file transition because filesystems do
not provide atomic multi-file writes. Parent, writer, and reviewer reasoning
retain semantic quality, scope, verticality, feasibility, TDD quality, blocker
resolution, and pitch-level classification.

## Requirements

All flows require compatible `subagent` and `subagent_wait` tools, compatible
named `worker` and `reviewer` roles, and the `question` companion. The worker is
the sole writer; the reviewer operates read-only. Either role may be Pi's
builtin or an existing project/user override, and a compatible override must not
be rejected merely because of its discovery scope. This package ships no agent
definitions or custom agents. Pitch additionally uses a fresh read-only builtin
`scout` for repository evidence and builtin `researcher` only when external
evidence is materially needed. Build also requires Worktrunk and todo, plus any
LSP or web companion required by the reviewed plans. Each flow fails closed
before its side effects when a required capability is unavailable.

## Install

From a clone of this repository:

```sh
pi install "$(pwd)/packages/feature-flow"
```

Invoke `feature-pitch`, then `feature-plan`, then `feature-build`. Canonical
pitches live at `docs/features/<feature>/pitch.md`; plans live at
`docs/features/<feature>/plans/<NNN-slice>.md`.
