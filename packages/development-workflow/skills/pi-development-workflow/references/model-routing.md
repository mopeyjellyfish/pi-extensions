# Route models by role

The main chat agent is the sole orchestrator and decision authority. It owns the user conversation, approves every delegation contract, synthesizes child results, and decides whether the workflow continues. Subagents do not launch their own workflow or silently make product, architecture, scope, or shipping decisions.

When pi-subagents and the OpenAI Codex GPT-5.6 models are available, explicitly select every child model and effort. Never let a child inherit the orchestrator's Sol model accidentally. Pi accepts the effort as a model suffix, for example `openai-codex/gpt-5.6-terra:medium`. If a named model is unavailable, inspect the current registry and ask the user to approve an equivalent tier; do not silently fall back to the expensive parent model.

## Preferred profile

| Role                     | Default dispatch                    | Context                                  | Escalation                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main orchestrator        | `openai-codex/gpt-5.6-sol:high`     | Parent session                           | The user may select Sol xhigh for ambiguous shaping, architecture, conflicting review evidence, or exceptional synthesis.                                                                                                                                                                                    |
| Scout                    | `openai-codex/gpt-5.6-luna:low`     | Fresh                                    | Rerun with `openai-codex/gpt-5.6-terra:low` when ownership is unclear, behavior crosses packages, repository evidence conflicts, or the first pass reports incomplete confidence.                                                                                                                            |
| Pitch/spec/slice planner | `openai-codex/gpt-5.6-sol:high`     | Fresh                                    | Use Sol xhigh for ambiguous shaping, architecture, conflicting requirements, security, concurrency, migrations, or repeated worker failure that suggests the plan is wrong. The planner writes for a Terra worker, not for itself.                                                                           |
| Worker                   | `openai-codex/gpt-5.6-terra:medium` | Fresh per slice                          | Use Terra high for difficult but bounded implementation. If the Sol planner or Oracle has explicitly revalidated a sound plan and frontier judgment remains inseparable from implementation, use `openai-codex/gpt-5.6-sol:medium`. Do not use Terra xhigh as a substitute for replanning or Sol capability. |
| Reviewer                 | `openai-codex/gpt-5.6-sol:high`     | Fresh                                    | Use one reviewer per slice. Add another reviewer only for a genuinely distinct risk domain that the first review contract cannot cover.                                                                                                                                                                      |
| Oracle                   | `openai-codex/gpt-5.6-sol:high`     | Forked                                   | Invoke only for decision drift, hidden contradictions, or trajectory uncertainty. Use Sol xhigh for architecture, conflicting requirements or prior decisions, security, concurrency, migrations, unresolved reviewer disagreement, or repeated worker failure.                                              |
| Fix worker               | Same worker ladder                  | Resume for narrow fixes; otherwise fresh | Keep Terra at or below high. If an accepted finding exposes a plan gap, return to Sol planning; use Sol medium only for a sound plan whose fix still needs frontier judgment.                                                                                                                                |

## Worker-effort rubric

The orchestrator selects and records the worker effort before dispatch:

- **Terra low:** a narrow mechanical edit, the exact seam is already known, no product or architecture interpretation is needed, and deterministic verification exists;
- **Terra medium by default:** ordinary vertical-slice implementation, multi-file changes with understood boundaries, TDD, tool recovery, and routine integration work;
- **Terra high** (`openai-codex/gpt-5.6-terra:high`): subtle state or lifecycle behavior, concurrency, security, migrations, difficult debugging, broad contracts, material ambiguity inside Agent Discretion, or a failed medium attempt;
- **Sol medium, exceptionally:** the Sol planner or Oracle has revalidated the plan, but frontier instruction-following or judgment remains inseparable from implementation. Use `openai-codex/gpt-5.6-sol:medium` rather than spending xhigh reasoning on Terra.

Do not use Terra xhigh for ordinary or failed implementation. When Terra high exposes a conceptual gap, return to the Sol high/xhigh planner or Oracle, repair the plan, and retry Terra. Promote the worker to Sol medium only when the plan is sound and the implementation itself needs the stronger model.

Escalation changes execution depth, not authority. A high-effort worker must still stop for the workflow's product, architecture, appetite, No-Go, risk, backstop, and authorization boundaries.

## Context and handoffs

Fresh children receive only the approved pitch, active slice, direct contracts, smallest relevant repository neighborhood, and explicit validation contract. Do not fork the full parent transcript into scouts, planners, workers, or reviewers. Oracle is the exception because its Sol reasoning audits inherited decisions and drift. Planner and Oracle are intentionally expensive but comparatively short, high-leverage calls; the long, output-heavy implementation remains on Terra except for the explicit Sol medium worker fallback.

Keep handoffs compact and preferably file-backed:

- scouts return relevant entry points, seams, risks, and confidence gaps;
- planners return a rough, solved, bounded pitch/spec or an executable vertical slice with RED, minimum GREEN, verification, and escalation boundaries;
- workers return changed files, checks with outcomes, evidence, surprises, and decisions needing the orchestrator;
- the single reviewer reads the active slice and affected diff once, then reports both pitch/slice compliance and correctness, maintainability, verification, and material risk findings.

“Review the active slice” is a relevance boundary, not a line-count limit. The reviewer follows affected contracts and dependencies when correctness requires it. The main orchestrator synthesizes every child result and remains responsible for the final diff and workflow transition.

## Basis

OpenAI's current guidance describes Sol as the frontier tier, Terra as the intelligence/cost balance, and Luna as the efficient high-volume tier. It recommends medium effort as the balanced starting point, low for latency- and cost-sensitive execution, high or xhigh when representative evaluations show a quality gain, and max only for the hardest quality-first API workloads. This workflow targets the reasoning levels exposed by the active Pi model registry and does not assume the API's maximum context is available through Pi.

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning)
- [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
