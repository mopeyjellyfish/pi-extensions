# Repository context

- **package** — independently installable directory under `packages/`.
- **aggregate** — private root Pi manifest that discovers package resources.
- **extension** — production TypeScript Pi runtime resource.
- **skill** — Markdown guidance Pi loads for agent behavior.
- **prompt template** — Markdown command template that expands `ARGUMENTS`.
- **parent agent** — agent that owns orchestration and final decisions.
- **subagent** — delegated agent with a bounded task.
- **run** — one delegated execution with its own result.
- **session** — one Pi conversation and lifecycle.
- **worktree** — one Git checkout and working directory.
- **pitch** — agreed problem, appetite, solution, and boundaries.
- **plan** — ordered implementation slices derived from a pitch.
- **slice** — one observable vertical outcome in a plan.
- **gate** — required approval or verification before proceeding.
- **evidence** — observable output supporting a claim or decision.
- **thinking effort** — the model reasoning level selected for a run.
