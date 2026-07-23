# Agent-native Shape Up philosophy

This workflow adapts Shape Up for a coding agent. It preserves shaping, appetite, a bounded pitch, risk reduction, and integrated slices. It does not simulate a company process or turn meetings into slash commands.

## Remove ceremonies, preserve decisions

Preserve these Shape Up mechanics:

- shape a raw idea until it is **rough, solved, and bounded**;
- make a human commitment about why the problem is worth investment before expanding the solution;
- research decisive unknowns and patch rabbit holes before committing to Build;
- express the bet as a five-part pitch: Problem, Appetite, Solution, Rabbit Holes, and No-Gos;
- build one integrated, demonstrable slice before broadening the implementation.

This workflow then adapts execution for agents: begin with repository research before interviewing, express capacity as a qualitative agent-investment envelope, and vary scope while keeping correctness, safety, compatibility, accessibility, and verification floors fixed.

The betting table, fixed staffing model, six-week cycle, cool-down period, and hill charts are Shape Up company-process mechanics we do **not copy**. Separately, this workflow adds no stand-ups or handoff meetings; those are generic ceremonies, not Shape Up practices. Human involvement is limited to product decisions the agent cannot own: agreeing to the pitch and first slice map, resolving consequential ambiguity, and authorizing external or destructive actions. Research, shaping, later-slice planning, implementation, verification, and review are execution work, not ceremonies.

This is an adaptation of Ryan Singer's [Shape Up](https://basecamp.com/shapeup), especially [Principles of Shaping](https://basecamp.com/shapeup/1.1-chapter-02), [Set Boundaries](https://basecamp.com/shapeup/1.2-chapter-03), [Risks and Rabbit Holes](https://basecamp.com/shapeup/1.4-chapter-05), [Get One Piece Done](https://basecamp.com/shapeup/3.2-chapter-11), and [Map the Scopes](https://basecamp.com/shapeup/3.3-chapter-12). Singer's betting and staffing practices describe Basecamp; the reduced-ceremony agent mapping is ours.

## Make research change the pitch

Research belongs inside shaping, not after approval and not as a detached report.

1. Every workflow starts with repository truth: instructions, current behavior, public contracts, tests, types, constraints, history, and prior decisions.
2. Reproduce or probe behavior when observation is cheaper and safer than inference.
3. Separate facts answerable by code, documentation, experiments, or primary external sources from decisions only the user can make.
4. Investigate external facts only when they could change the problem, appetite, solution elements, rabbit holes, no-gos, acceptance signals, or slice order.
5. Prefer a bounded spike or prototype when reading cannot discriminate between plausible designs.
6. Summarize conclusions, citations, and implications in the pitch's Research Basis. Link a bounded artifact under `research/` only when useful evidence cannot stay concise. Do not paste raw search results or transcripts into durable context.
7. If an investigation neither changes nor confirms a pitch boundary, discard it from durable artifacts.

A credible pitch shows what repository reading established, what further research taught us, and what each finding changed or confirmed. Research that merely accumulates links has not reduced shaping risk.

## Make Appetite agent-operable

Shape Up defines Appetite as a fixed-time value decision made before a solution is estimated. This workflow deliberately diverges for coding agents: the human still decides why the problem deserves investment and what valuable outcome justifies it, while the execution boundary is a qualitative envelope the agent can act on. A separate wall-clock backstop detects stale work; it is not renamed as Appetite.

- bound the context surface and unfamiliar domains it may load;
- bound the depth of behavioral, integration, migration, and operational change;
- identify unknowns it may resolve and discoveries that force reshaping;
- name the validation and independent-assurance burden;
- separate the smallest valuable outcome, optional breadth, cut order, and stop conditions;
- keep correctness, safety, security, accessibility, compatibility, maintainability, and fresh verification fixed.

This hybrid preserves human opportunity-cost judgment without pretending model turns, tokens, elapsed time, or file counts are portable effort estimates. The difference from Singer's fixed-time implementation is explicit rather than presented as original Shape Up semantics.

## Build vertical and context-efficient

A vertical slice crosses the real layers required for one observable behavior. It is not “write models,” “finish the backend,” “add tests,” or another horizontal phase.

For each slice:

- identify one public behavior and its correct verification seam;
- load only the repository context needed for that behavior and its immediate contracts;
- observe RED before production implementation, make the smallest coherent change for GREEN, then refactor;
- prefer a narrow end-to-end path over speculative shared infrastructure;
- keep one writer and use parallel agents for bounded research or independent review;
- update `plan.md` as a compact slice index, not an exhaustive task inventory;
- store mutable state and bounded evidence in the ledger instead of replaying conversation history;
- continue to the next well-scoped slice when the current one is demonstrable, verified, and reviewable; stop the autonomous Build only when an approved boundary, material risk, fixed floor, backstop, or authorization gate requires the human.

This follows Shape Up's integrated slices while adapting Superpowers' [test-driven development](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/test-driven-development/SKILL.md), [subagent-driven development](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/subagent-driven-development/SKILL.md), and [fresh verification](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/verification-before-completion/SKILL.md). Matt Pocock's pinned [diagnosing-bugs](https://github.com/mattpocock/skills/blob/d574778f94cf620fcc8ce741584093bc650a61d3/skills/engineering/diagnosing-bugs/SKILL.md) similarly emphasizes a fast reproduction loop, ranked hypotheses, discriminating instrumentation, and regression proof.

## Treat the pitch as the human-agent contract

The pitch states intent and boundaries; the ledger records mutable status; tests and verification prove behavior. Do not mix those authorities.

Specification-driven development reinforces the value of a durable human-agent contract. GitHub's [Spec Kit](https://github.com/github/spec-kit) separates specification, planning, tasks, and implementation. Jarosław Wąsowski's 2026 practitioner article argues for BDD as a specification technique, but it is not a 2024 academic source and it does not make Gherkin universally necessary: [SDD Writing Specifications for AI](https://medium.com/@wasowski.jarek/sdd-writing-specifications-for-ai-bdd-as-the-missing-link-spec-driven-development-ad1b540b7f75).

Use concrete examples and observable acceptance signals in every pitch. Use BDD/Gherkin **only when** scenario structure clarifies business rules, branching outcomes, or boundary cases better than concise prose and tests. Never add Gherkin as ceremony, duplicate the same requirement across files, or treat generated scenarios as proof of correctness.

Business Complexity Points can be an optional questioning lens for functional complexity before implementation, based on CI&T's [Business Complexity Points](https://ciandt.com/us/en-us/complexitypoints). This workflow does not use BCP as an effort estimate, universal scoring system, quality gate, or replacement for the agent-investment appetite. This workflow deliberately avoids a mandatory numeric complexity or quality threshold.

## Engineer for humans and agents

Classical code quality still applies, with agent-specific constraints layered on top.

### Cohesion and continuous care

From Robert C. Martin's _Clean Code_ first edition (2008):

- apply the **Single Responsibility Principle** as cohesion by reason for change, not “every function must be tiny”; Martin's later clarification is [The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html);
- apply the [Boy Scout Rule](https://www.informit.com/articles/article.aspx?p=1235624&seqNum=6) only to small, behavior-preserving cleanup in touched code; it never authorizes unrelated refactoring;
- use intention-revealing names and the F.I.R.S.T. test heuristic—Fast, Independent, Repeatable, Self-Validating, and Timely—while judging tests by behavior and diagnostic value.

### Deep interfaces, hidden complexity

John Ousterhout's [A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/book.php) counters the shallow-module failure mode:

- prefer **deep modules** that hide substantial coherent behavior behind small interfaces;
- use **information hiding** so callers do not absorb internal decisions;
- minimize change amplification, cognitive load, dependencies, and unknown unknowns;
- define avoidable **errors out of existence** by choosing clearer semantics, without suppressing genuine failures.

Small functions are useful when they reveal intent, but line count is not the design objective. A forest of shallow wrappers can increase interface complexity.

### Agent-operable code and diagnostics

Fabio Akita's practitioner article [Clean Code for AI Agents](https://akitaonrails.com/en/2026/04/20/clean-code-for-ai-agents/) recommends:

- stable, distinctive, **grep-friendly** domain names so targeted search finds the right contract;
- bounded files, tool output, logs, and test failures;
- structured JSON for machine-consumed diagnostic or observability logs, with readable human-facing CLI output;
- context-rich failures that identify the operation, received value, and expected shape.

This workflow additionally asks for a safe next step when known and stores compact ledger evidence instead of raw logs. Those are our adaptations. Akita's guidance is a practitioner recommendation, not a measured guarantee; do not turn its naming heuristics or token observations into universal numeric gates.

## Source map and attribution boundaries

| Source                                                                                                                                                                                | Supported contribution                                                                       | Workflow adaptation                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Martin, _Clean Code_ (2008)                                                                                                                                                           | Cohesion, intention-revealing names, Boy Scout Rule, F.I.R.S.T. tests                        | Local clarity and behavior-facing tests, without tiny-function dogma                                                |
| Ousterhout, _A Philosophy of Software Design_ (2018; 2nd ed. 2021)                                                                                                                    | Deep modules, information hiding, complexity reduction, errors out of existence              | Small public Pi surfaces with lifecycle and state complexity hidden behind them                                     |
| Singer, _Shape Up_ (2019)                                                                                                                                                             | Rough/solved/bounded shaping, appetite, rabbit holes, pitches, integrated scopes             | Preserve pitch and slices; omit betting, fixed staffing, cycles, cool-down, and hill charts                         |
| Karpathy, [context engineering](https://x.com/karpathy/status/1937902205765607626) (2025) and [agent guidance](https://x.com/karpathy/status/2015883857489522876) (2026)              | Context construction, plan mode, measurable success criteria, test-first loops, close review | Orchestrate bounded tool calls and reviewers; do not infer endorsement of autonomous swarms                         |
| Superpowers v6.1.1 and Pocock skills v1.1.0 (2026 snapshots)                                                                                                                          | Explicit skills, TDD, disciplined debugging, bounded delegation, fresh verification          | Progressive skill references and evidence-backed gates                                                              |
| Spec Kit (2025) and Wąsowski's practitioner series (2026)                                                                                                                             | Specs as durable agent inputs; scenario-oriented clarification                               | Pitch as contract; Gherkin only where scenarios reduce ambiguity                                                    |
| CI&T BCP (created in 2015; later AI/open-source iterations)                                                                                                                           | Functional-complexity analysis of requirements                                               | Optional shaping questions; this workflow does not use it for effort or quality scoring                             |
| Akita (2026)                                                                                                                                                                          | Searchable names, structured diagnostics, context economy                                    | Agent-operable repositories and bounded evidence                                                                    |
| OpenAI, [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model) and [reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning) (2026) | Sol/Terra/Luna workload tiers and task-sensitive reasoning effort                            | Explicit cost-aware role routing; medium is the baseline and higher effort needs a risk or measured-quality trigger |

The example chronology that groups Karpathy under 2023–24 and “Wasowski/BCP” under 2024 is not supported by the primary sources reviewed. Do not repeat those dates. Wąsowski's located AI-era SDD series is from 2026, Karpathy's directly relevant posts are from 2025–26, and CI&T traces BCP from 2015 through later AI and open-source iterations. Attribute prescriptions to their authors; label this workflow's synthesis as our adaptation.
