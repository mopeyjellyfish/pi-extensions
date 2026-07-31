# Plan: Shape subagent orchestration

Resume by inspecting Git, then work the first unchecked slice. Reorder, rewrite,
split, merge, or delete pending slices when implementation teaches something
new.

## [x] 001 — Shape uses bounded read-only specialists

### Outcome

A Shape run discovers the live subagent inventory and uses adaptive, read-only
specialists for research and required independent reviews. The controlling
Shape agent remains the sole writer and preserves every human and delivery
authority gate.

### Pitch trace

Implement the accepted pitch sections [Solution](pitch.md#solution),
[Fixed decisions](pitch.md#fixed-decisions), and
[Acceptance criteria](pitch.md#acceptance-criteria), especially AC-001 through
AC-009.

### Implementation

Use `packages/feature-flow/skills/shape/SKILL.md` as the public behavior seam.
First, add focused failing assertions to
`packages/feature-flow/test/resources.test.ts` for live discovery, role routing,
research and review bounds, fresh asynchronous no-edit assignments,
dependency-driven waits, parent synthesis, and failure handling. Add exact
assertions that preserve:

- the initial brief pass before Worktrunk.
- human base selection.
- the post-research decision pass.
- complete-pitch display and approval.
- material-change reapproval.
- the prohibition on inferred commit, push, pull request, merge, publication,
  deployment, destructive cleanup, and worktree-removal authority.

Then make the smallest skill change that satisfies those assertions. Update
`packages/feature-flow/README.md` with the user-visible orchestration and
availability contract. Do not add an extension, custom agent, dependency,
template, or durable artifact.

### Validation

- Run `npm --workspace @mopeyjellyfish/pi-feature-flow test` after the failing
  test and after the implementation.
- Run `npm run smoke:source`.
- Run `npm run check`.
- From this worktree, start the repository-pinned deterministic Pi session with
  the worktree aggregate and the reviewed `pi-subagents` version:

  ```sh
  npm exec -- pi \
    --no-extensions \
    --no-skills \
    --no-prompt-templates \
    --no-themes \
    -e . \
    -e npm:pi-subagents@0.38.0
  ```

- Confirm that `shape` loads without conflicts. List the live subagent inventory
  and select only a returned role. If no suitable role exists, confirm the
  documented research fallback and required-review stop behavior.
- Run the focused test before `/reload`.
- Run `/reload` while Pi is idle.
- Run this non-destructive acceptance scenario: resume
  `shape-subagent-orchestration` for acceptance only. Select exactly one
  local-context research specialist from the returned inventory. Run that
  specialist and one independent plan reviewer, then stop before edits, commits,
  or worktree lifecycle changes.
- Record the returned inventory, selected roles, and launch identifiers in the
  manual acceptance notes. Record `context: "fresh"`, `async: true`, the literal
  instruction `Do not modify project or source files.`, and each
  identifier-scoped wait. Record the controlling-agent synthesis and independent
  review outcome. Confirm that reload caused no duplicate registrations or stale
  state.
- Request a fresh read-only specialist review of the completed slice diff for
  correctness, test quality, simplicity, and preserved authority gates.

### Done when

The focused test fails for the missing orchestration contract and passes after
the implementation. Source smoke and `npm run check` pass. The live reload path
shows the new behavior without conflicts. Independent review has no blockers.
No unrequested dependency, runtime resource, durable artifact, staged file, or
remote action exists.
