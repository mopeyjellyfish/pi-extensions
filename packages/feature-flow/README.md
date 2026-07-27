# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` is an independent, skill-only Pi package for
shaping a canonical feature pitch, automatically reviewing a vertical TDD plan
set, and delivering it serially with deterministic artifact and Git checks. It
does not register an extension, agent, service, or runtime dependency.

## Skill

- `feature-pitch` guides repository research, user interviews, shaping, fresh
  review, and complete-pitch human acceptance.
- `feature-plan` creates the complete serial vertical TDD plan set, validates it,
  and runs fresh whole-set review without a human plan gate.
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

All flows require compatible `subagent` and `subagent_wait` tools, the builtin
`worker` and `reviewer` roles, and the `question` companion. Build also requires
Worktrunk and todo, plus any LSP or web companion required by the reviewed
plans. Each flow fails closed before its side effects when a required capability
is unavailable.

## Install

From a clone of this repository:

```sh
pi install "$(pwd)/packages/feature-flow"
```

Invoke `feature-pitch`, then `feature-plan`, then `feature-build`. Canonical
pitches live at `docs/features/<feature>/pitch.md`; plans live at
`docs/features/<feature>/plans/<NNN-slice>.md`.
