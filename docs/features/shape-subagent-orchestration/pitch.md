---
status: accepted
---

# Shape: Subagent orchestration

## Executive summary

The `shape` skill will use Pi subagents as focused, read-only specialists during
research and independent review. The controlling Shape agent will remain the
sole writer. The controlling agent owns synthesis and routine orchestration
decisions within the human-approved scope.

Shape will discover the live agent inventory before its first delegation. Shape
will use an adaptive fan-out of no more than three specialists for each stage.
Shape will parallelize only independent topics and will synthesize all findings
before writing artifacts or changing code.

## Problem

The current skill delegates some research and asks for independent reviews. The
skill does not define how to select agents, bound parallel work, preserve
read-only behavior, or handle unavailable roles and failed runs.

The vague contract can underuse available specialists. The contract can also
cause fixed agent swarms, duplicated research, accidental edits, or review steps
that are not truly independent. The workflow needs enough orchestration guidance to use
Pi effectively without becoming a workflow engine.

## Appetite

This is a small change with an appetite of about one day. Change the existing
skill, focused tests, and package README only.

Keep these quality floors:

- Preserve Worktrunk isolation, the sole-writer rule, and all human approval
  gates.
- Preserve the prohibition on inferred commit, remote, deployment, publication,
  and cleanup authority.
- Keep `pitch.md` and `plan.md` as the only required durable feature artifacts.
- Keep specialist assignments read-only through explicit no-edit instructions.
- Keep the package free of a production extension and new runtime dependencies.

Stop and reshape the work if reliable orchestration requires a new extension,
custom agent, capability ceiling, or durable machine state.

## Research and prior art

The repository already limits parallelism to read-only research, review, or QA
and keeps one writer. The feature-flow package is intentionally a skill-only
package with two durable Markdown artifacts.

The installed `pi-subagents` 0.38.0 guidance recommends a parent-owned workflow:
small fresh-context fan-outs for independent analysis, one writer for each
worktree, asynchronous launches, dependency-driven waits, and parent synthesis.
The guidance also states that selecting a read-only role does not enforce tool
safety. Each Shape assignment must therefore prohibit project and source file
edits.
See the primary
[`pi-subagents` skill guidance](https://github.com/nicobailon/pi-subagents/tree/main/skills/pi-subagents).

Pi loads skills on demand from `SKILL.md`. This change needs instructions and
verification, not runtime scaffolding. See the primary
[Pi Skills documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md).

A fixed swarm was rejected because it would increase cost and synthesis work for
narrow features. Unbounded delegation was also rejected because it would make
the workflow less predictable and testable.

## Solution

Before its first delegation, Shape will list the live agents once. Shape will
prefer these roles when they are available:

- Use `scout` for focused repository context.
- Use `researcher` for material external facts, current primary documentation,
  standards, and compatibility.
- Use `context-builder` only when broad scope needs a comprehensive handoff.
- Use `reviewer` for an independent pitch, plan, or slice-diff review.

Shape can use an equivalent discovered role when a preferred role is absent.
Shape must not invent a role that is not in the live inventory.

For each research stage, Shape will choose zero to three distinct specialist
angles. Shape will add an angle only when uncertainty, scope, or risk makes the
angle useful. Shape will stop when the evidence is sufficient.

Each required review stage will use one to three distinct specialist angles. A
single reviewer is the default. Shape will add an angle only when the angle
addresses a separate material risk. Only independent angles can run in
parallel.

Every specialist assignment will:

- use fresh context.
- identify the exact brief, artifact, diff, or question to inspect.
- require evidence, source links or file references, gaps, and decision
  implications.
- prohibit project and source file edits.
- escalate human-owned product, scope, architecture, and safety decisions.

Shape will launch independent specialist work asynchronously. The controlling
agent will continue useful local inspection or preparation. The controlling
agent will wait on the returned run identifier only when the results block
synthesis. The controlling agent will not poll or sleep while waiting.

The controlling Shape agent will synthesize findings after each fan-out. Raw
subagent output will not become required feature state. Shape will use a saved
output only when the output size or a real handoff need justifies it.

Repository research will start with direct inspection of load-bearing sources.
Shape will then use a local specialist when a separate code-path, test, risk, or
history angle can reduce uncertainty. External research will use a specialist
only when current external evidence is material.

The completed pitch, completed plan, and each completed slice diff will receive
a fresh-context independent specialist review. Shape can add up to two more
review angles when the angles address distinct material risks. The controlling
agent will classify findings as blockers, fixes to make now, optional work, or
rejected work. The controlling agent will re-review only after a material fix.

If the `subagent` tool or a suitable research role is unavailable, the
controlling agent can do the research and record the gap. If the `subagent` tool
or a suitable independent reviewer is unavailable, Shape will stop at the
affected pitch, plan, or slice gate. Shape will not replace the required
independent review with self-review.

If a child fails, Shape will inspect the child status and available output.
Shape can retry once with a narrower task when the missing evidence is material.
Shape can continue without that angle only when the remaining evidence is
sufficient and the failed angle is not a required independent review.

## Fixed decisions

- The controlling Shape agent is the sole writer for the active worktree.
- Specialist subagents are advisory and receive explicit no-edit instructions.
- Shape lists the live agent inventory before its first delegation.
- Shape uses preferred roles with equivalent discovered-role fallbacks.
- Each research stage uses an adaptive fan-out of zero to three specialists.
- Each required review uses one to three specialists.
- Only distinct independent topics can run concurrently.
- Advisory launches use fresh context and asynchronous execution.
- Shape waits on the returned run identifier only when results block synthesis.
- The controlling agent synthesizes all specialist output and owns routine
  orchestration decisions within the human-approved scope.
- Research can degrade to the controlling agent when the `subagent` tool or a
  suitable role is unavailable.
- Required independent review cannot degrade to self-review.
- Human pitch approval and material-change reapproval remain explicit gates.
- No commit, remote, publication, deployment, destructive, or cleanup authority
  is inferred.
- Add no production extension, custom agent, runtime dependency, or durable
  orchestration state.

## Rabbit holes

- Do not add fixed research or review rosters. Narrow features do not need a
  ceremonial swarm.
- Do not copy the complete `pi-subagents` manual into Shape. Keep only the
  routing rules that affect this workflow.
- Do not add Shape-specific agents, chains, capability ceilings, watchdog
  settings, schedulers, or lifecycle schemas.
- Do not persist raw research for every feature. Synthesize decision-relevant
  evidence into the pitch or plan.
- Do not delegate implementation. The approved scope keeps the controlling
  Shape agent as the sole writer.
- Do not mandate repeated review rounds after a clean review.

## No-gos

- No parallel or overlapping writers in the active worktree.
- No specialist edits to project files, source files, pitch, or plan.
- No invented agent names or assumed agent availability.
- No fixed or unbounded fan-out.
- No self-review substituted for a required independent review.
- No polling loops, sleep-based waiting, or waiting for unrelated session work.
- No weakening of Worktrunk, human approval, material-change, or delivery
  authority gates.
- No new package dependency, production extension, custom agent, machine state,
  or required durable artifact.

## Acceptance criteria

- **AC-001 — Live discovery:** Shape lists the live agent inventory once before
  its first delegation and never invents an unavailable role.
- **AC-002 — Adaptive research:** Shape starts with repository truth and uses up
  to three distinct read-only specialists only when uncertainty, scope, or risk
  justifies them.
- **AC-003 — Material external evidence:** Shape delegates current external
  research when that evidence is material and skips it when it is not.
- **AC-004 — Safe orchestration:** Advisory work uses fresh context, explicit
  no-edit assignments, asynchronous launches, independent parallel topics, and
  dependency-driven waits on the returned run identifier.
- **AC-005 — Parent synthesis:** The controlling Shape agent remains the sole
  writer and synthesizes specialist evidence before decisions or edits.
- **AC-006 — Independent review:** The completed pitch, plan, and each slice diff
  receive one to three fresh independent specialist reviews. Shape stops when
  the `subagent` tool or a required reviewer is unavailable.
- **AC-007 — Bounded failure handling:** Shape inspects failed work, retries a
  narrower task at most once when material, and records research gaps without
  weakening review gates.
- **AC-008 — Preserved authority:** Shape preserves the initial human brief pass
  before Worktrunk, human base selection, post-research decision pass, complete
  pitch display and approval, and material-change reapproval. Shape never
  infers authority to commit, push, open a pull request, merge, publish, deploy,
  perform destructive cleanup, or remove a worktree.
- **AC-009 — Narrow package change:** Focused tests and the README describe the
  orchestration contract without adding an extension, custom agent, dependency,
  or durable workflow artifact.
