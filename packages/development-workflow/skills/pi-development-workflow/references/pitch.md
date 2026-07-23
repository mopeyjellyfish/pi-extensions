# Shape the pitch

Turn a raw idea, missing capability, or defect into an agreed `specs/<change>/spec.md`. Discovery is a mandatory first stage; its findings feed four shaping passes.

## 0. Read and research before interviewing

Start with repository truth before asking the user questions or drafting a solution. Read the nearest instructions, current behavior, public interfaces, tests, types, history, dependencies, and existing decisions. Reproduce the behavior or run a bounded probe when observation is more reliable than inference. Then use primary external sources only for material facts the repository cannot answer.

Record fresh `research` evidence in the ledger for every workflow. In the pitch's **Research Basis**, cite the code, tests, documentation, experiments, and external sources that confirm or change the pitch, and state each implication. When a spike, comparison, or diagram is too substantial to summarize, keep a bounded decision-focused artifact under `specs/<change>/research/` and link it from the pitch. Never preserve raw transcripts, unfiltered search results, or notes that do not affect the pitch.

Repository research is mandatory even when external research is unnecessary. Do not ask the user for facts the codebase can answer.

## 1. Set boundaries

Define the **Problem** before choosing the interface or implementation. A problem may be:

- behavior that fails or works differently from the intended outcome;
- friction, risk, cost, or a workaround in the status quo;
- a valuable **missing capability** that does not exist yet.

Use one specific motivating story and connect it to repository reality: who encounters the situation, what they try to achieve, what happens today, which code paths or contracts cause or constrain it, and why the gap matters. Include evidence of demand and separate the desired change from a preferred solution.

Shape Up defines **Appetite** as a human-chosen fixed-time budget that constrains the solution before estimation. This agent-native adaptation preserves the human commitment decision—why this problem is worth investment and what outcome deserves that investment—but expresses execution capacity as a qualitative **agent-investment envelope**. The separate wall-clock backstop handles stale work; neither it nor token use substitutes for the commitment rationale. Make these dimensions concrete:

- **Context surface:** repositories, packages, subsystems, contracts, and unfamiliar domains the agent must understand.
- **Change depth:** boundaries crossed, new integrations, migrations, compatibility surfaces, and operational consequences.
- **Uncertainty allowance:** which unknowns or bounded spikes may be resolved autonomously and which discoveries force reshaping.
- **Validation burden:** decisive examples, test matrices, platforms, migrations, security checks, and external acceptance needed for confidence.
- **Assurance level:** required independent review, observability, rollback, documentation, and hardening.
- **Scope control:** the smallest valuable outcome, optional breadth, cut order, and stop conditions.
- **Fixed floors:** correctness, safety, security, accessibility, compatibility, maintainability, and fresh verification that scope pressure cannot lower.

Before Pitch approval, record the ledger's mandatory wall-clock backstop as an `Nh`, `Nd`, or `Nw` duration. It is only a stale-work circuit breaker; it does not describe agent effort and does not belong in the investment comparison.

A weak appetite says only “two days” or “medium.” A useful appetite first states why the outcome merits investment, then says, for example: understand and change one existing package and its public contract; reuse the current persistence seam; permit one bounded provider spike; require focused, regression, source-smoke, and independent review evidence; cut migration and generalized plugin support first; reshape if a new credential model or cross-package protocol is required; preserve security and compatibility floors.

## 2. Rough out the elements

Describe the macro **Solution**: affordances, reused seams, system boundaries, data or control flows, and observable Acceptance Signals. Distinguish fixed product or architectural decisions from local implementation choices the agent may make. Use a breadboard, state/sequence sketch, or fat-marker diagram when it clarifies the concept. Stay abstract enough to leave implementation discretion while concrete enough that an agent can derive integrated behavior and decisive tests.

## 3. Research and de-risk the concept

Research is shaping work, not a report produced after the pitch. Start with repository behavior, contracts, tests, and prior decisions. Use primary external sources for current facts, and use a bounded spike when an experiment can discriminate between plausible designs faster than more reading.

Every investigation must confirm or change at least one pitch element: Problem evidence, Appetite, Solution, Acceptance Signals, Rabbit Holes, or No-Gos. Summarize the conclusion and citation in the relevant section or a linked contract; do not paste transcripts or raw search output into `spec.md`.

List **Rabbit Holes** that could consume the investment envelope: technical unknowns, migrations, edge cases, policy decisions, integration traps, or accidental generality. For each one, pair evidence and the likely failure mode with a containment, cut, spike, escalation owner, or observable tripwire. A generic risk list is not useful to an implementing agent.

Declare **No-Gos** as executable boundaries: adjacent features, platforms, use cases, refactors, or generalized solutions the agent must not pursue. State which investment dimension the exclusion protects and any condition that would justify reshaping it later.

## 4. Write and grill the pitch

Use exactly five sections:

1. **Problem**
2. **Appetite**
3. **Solution**, with observable **Acceptance Signals**
4. **Rabbit Holes**
5. **No-Gos**

Each section must answer an implementation decision rather than merely describe the idea:

| Section            | What the building agent must learn                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Problem            | What observed behavior or missing capability matters, what repository reality constrains it, and what must change or remain invariant |
| Appetite           | How far autonomous investigation and change may go, what evidence is required, what is cuttable, and when to stop and reshape         |
| Solution           | Which macro route, product rules, seams, and boundaries are fixed versus left to local implementation discretion                      |
| Acceptance Signals | Which observable examples discriminate a correct integrated outcome from a plausible-looking partial result                           |
| Rabbit Holes       | Which credible risks could derail the investment, how each is contained, and what tripwire triggers escalation                        |
| No-Gos             | Which adjacent work, cleanup, platform, or generalization the agent must not pursue                                                   |

Grill the draft with `pi-design-grill`. Prefer repeated Question-tool batches of 2–4 independent decisions, offer recommended answers when evidence supports them, and resolve dependent branches in order. After each batch, show what the user's answers resolved, which assumptions changed, how the pitch changed, and what consequential blocker remains. Continue until the user can review a coherent pitch rather than confronting them with a finished proposal built from guesses.

The pitch is ready for explicit user agreement only when it is rough, solved, and bounded:

- **Rough:** communicates the approach without prescribing every implementation detail.
- **Solved:** macro elements connect and known rabbit holes are patched or explicitly escalated.
- **Bounded:** the agent-investment appetite, cuttable scope, stop conditions, and no-gos make the concept finite without pretending to estimate human time.
- **Buildable:** fixed decisions, implementation discretion, and acceptance signals let an agent derive the first demonstrable vertical slice without inventing product behavior.
- **Evidence-grounded:** the Research Basis cites repository reading for every pitch and targeted external evidence where needed; unknowns and implications remain explicit.

Record only stable IDs in frontmatter. Do not add status, progress, owner, completion flags, or checklists; `development_workflow` is the sole mutable authority. After the user agrees with the pitch and the model requests the transition, ask the user to approve it with `/dev-workflow approve pitch`.

Shape Up references: [principles](https://basecamp.com/shapeup/1.1-chapter-02), [set boundaries](https://basecamp.com/shapeup/1.2-chapter-03), [find the elements](https://basecamp.com/shapeup/1.3-chapter-04), [risks and rabbit holes](https://basecamp.com/shapeup/1.4-chapter-05), and [write the pitch](https://basecamp.com/shapeup/1.5-chapter-06).
