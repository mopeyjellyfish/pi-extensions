# Artifact and helper contract

The canonical pitch is `docs/features/<feature>/pitch.md`; plans live in its
`plans/` directory. A pitch uses `feature-flow-pitch/v2` and exactly five
second-level sections: `Problem`, `Solution`, `Rabbit holes`, `No-gos`, and
`Acceptance criteria`. It is an evergreen product definition: estimates and
delivery decomposition belong to later planning, while acceptance criteria
provide plan traceability. Use the templates shipped with `feature-pitch` and
`feature-plan`. The package helper provides:

```text
node scripts/feature-flow.mjs validate-pitch <pitch-path>
node scripts/feature-flow.mjs validate-plans <pitch-path> <plans-dir>
node scripts/feature-flow.mjs status <pitch-path> <plans-dir>
node scripts/feature-flow.mjs pitch <pitch-path> <draft|ready|accepted> [--revise]
node scripts/feature-flow.mjs plans <pitch-path> <plans-dir> <draft|reviewed> [--revise <plan-path> ...]
```

Commands return bounded JSON on standard output on success. Failures return
bounded JSON on standard error, identify the path and reason, exit nonzero, and
do not leave partial ordinary write failures. `status` always reports bounded
Git and artifact readiness facts. `pitch` and `plans` change only lifecycle
frontmatter; explicit revision returns increment the affected artifact revision
after validating the complete prospective set.

The helper owns syntax, canonical paths, lifecycle facts, serial dependencies,
AC coverage, and requested transitions. Parent, worker, reviewer, and human
reasoning own content quality, blocking decisions, review, and acceptance.
