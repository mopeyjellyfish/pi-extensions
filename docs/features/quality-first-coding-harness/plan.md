# Plan: Quality-first coding harness

Resume by inspecting Git, then work the first unchecked slice. Reorder, rewrite,
split, merge, or delete pending slices when implementation teaches something
new.

When the `todo` tool is available, derive checked/total progress and the first
unchecked slice from this plan. Reconcile one rolling
`Shape quality-first-coding-harness:` item. Keep `plan.md` authoritative and
preserve unrelated todos.

## [x] 001 — Route ordinary coding work through one quality-first contract

### Outcome

A project that installs the Git aggregate and `pi-subagents` can use natural
requests or `/develop` for implementation, fixes, debugging, and QA. The parent
selects the smallest safe route, retains decisions and final verification, and
uses one retained writer plus fresh review for noisy or non-trivial work.

### Pitch trace

- [Solution](pitch.md#solution)
- [Fixed decisions](pitch.md#fixed-decisions)
- AC-001 through AC-014

### Implementation

Add the `developing-changes` skill, `/develop` prompt, and companion-install
guidance to `packages/engineering/`. Compose the existing Shape and diagnosis
skills instead of repeating their full workflows. Put repair routing in
`developing-changes` and Shape.

Update `agents/worker.md` and `agents/qa.md` only for material-delta handoffs
and selective durable QA records. Update Shape so the parent transfers one
exclusive active writer lease for a non-tiny slice, sends routine findings back
to that retained writer, and repeats the full pitch gate after a material intent
change.

Update `README.md`, `packages/engineering/README.md`, and
`packages/feature-flow/README.md`. Update
`packages/engineering/test/resources.test.ts`,
`packages/feature-flow/test/resources.test.ts`, and
`test/tooling/subagents.test.ts` for the changed public contracts.

Keep `agents/reviewer.md` unchanged. Add no production runtime extension,
router model, task graph, custom compaction, or Luna-first implementation path.

### Validation

- Run `npm test -- --run packages/engineering/test/resources.test.ts packages/feature-flow/test/resources.test.ts test/tooling/subagents.test.ts`.
- Run a fresh Sol `high` review against the accepted pitch and full slice diff.
- Apply accepted routine fixes through the same retained writer and rerun the
  affected focused tests.
- Run the standalone negative prerequisite check with this source-only session:

  ```sh
  npm exec -- pi \
    --no-extensions \
    --no-skills \
    --no-prompt-templates \
    --no-themes \
    --no-context-files \
    -e packages/engineering
  ```

  Invoke `/develop` and confirm it reports that the Git aggregate and
  `pi-subagents` companion are required.

- Start the deterministic full-harness session with the validated companion:

  ```sh
  npm exec -- pi \
    --no-extensions \
    --no-skills \
    --no-prompt-templates \
    --no-themes \
    --no-context-files \
    -e npm:pi-subagents@0.43.0 \
    -e .
  ```

  Confirm the changed skill, prompts, and agents load without conflict.

- Run the focused automated test before `/reload`. Reload while Pi is idle.
- Exercise these five routes after reload and record each observed route, agent
  model and thinking effort, writer-lease owner and transfers, reviewer or QA
  behavior, check result, context or token totals when available, quality
  failures, and residual risks in
  `/tmp/quality-first-coding-harness-acceptance.md`:

  | Route           | Prompt shape                                               | Expected result                                                                                                                               |
  | --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
  | Shape           | A new user-visible feature with unresolved product choices | Routes to Shape before implementation. The parent keeps decisions and the writer lease remains with the parent during shaping.                |
  | Debug           | A reproducible shared-path defect                          | Applies `diagnosing-bugs`, then selects direct or retained implementation and requires fresh formal review when non-trivial.                  |
  | One-shot QA     | Validate one bounded changed path                          | Uses Luna `medium`, returns evidence without `docs/qa/`, and does not replace formal review.                                                  |
  | Tiny direct     | One sequential low-risk edit with a focused check          | Parent implements directly without delegation overhead.                                                                                       |
  | Retained writer | A noisy multi-step change with a routine failed check      | Uses the configured Sol writer, gives it the exclusive writer lease, resumes the same run for routine repair, then uses a fresh Sol reviewer. |

- Run `npm run smoke:source`, then `npm run check`.
- Inspect the final diff for package, release, dependency, and artifact hygiene.
- Validate the proposed Conventional Commit with
  `npm run commits:check -- --edit <file>`, commit the checked tree, push the
  authorized branch, and open the pull request. Verify its title, body, base, head, and checks.
  Include the live acceptance evidence and residual risks in the pull request.

### Done when

The accepted pitch criteria hold. Focused tests and required checks pass. Live
reload acceptance shows all five routes without duplicate registrations, stale
state, or a weakened quality gate. A fresh reviewer has no blockers or fixes
worth doing now. The slice checkbox and pitch remain synchronized with the final
implementation. The validated commit is pushed and the pull request states
checks, live evidence, and residual risks without changing release metadata or
changelogs.
