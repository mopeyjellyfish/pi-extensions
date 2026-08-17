# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent skill-and-prompt package. It
provides `developing-changes`, `implement`, `/just-do-it`, and optional focused
skills for TDD, design, debugging, domain language, review, and architecture
discovery. It has no extension or
runtime dependency.

The root profile loads complete Engineering resources. It uses the installed
Worker profile for standard, plan-less, and accepted hard work, then the
installed Reviewer profile for formal read-only fixed-point review. A fixed
agent being unavailable falls back to the direct parent. A higher-capability need requires a `question` with evidence, expected benefit,
and a bounded task before explicit human approval; difficulty alone never
selects that role. `/debug` starts its skill in a dedicated worktree and uses the `question`
tool for focused intake:

```text
parent plan -> fresh Worker -> parent verification -> fresh Reviewer -> Worker reverify or pause
```

Both provider handoffs start with fresh context. Before any write, every
mutation-capable skill requires an isolated linked worktree and never edits the
main-branch checkout. `implement` reuses the task worktree that contains the
accepted pitch and plan, or creates one for a plan-less bounded request when
safe worktree tooling is available. Direct diagnosis, TDD, and domain-modeling
work applies the same guard. When safe tooling is unavailable, the skill stops
before writing and asks the human to provide a worktree.

The parent supplies durable pitch and plan paths plus the exact slice instead
of copying the conversation. The parent stays responsible for synthesis, final
diff inspection, and verification. An independent installation without the
root agent profiles uses the direct parent; it does not automatically provide
companion extensions, agents, tools, or skills.

`developing-changes` uses an impact-and-uncertainty decision: a mechanical
low-risk request goes to `/just-do-it`; one clear coherent outcome can implement
now; a reported broken, failing, or slow behavior with an unresolved cause goes
to `diagnosing-bugs`; coordinated clear work plans first; uncertain,
hard-to-reverse, or risky work Shapes then plans. A confirmed bug outcome then
goes to `implement`. It uses uncertainty, reversibility, risk, affected
boundaries, and coordination cost, not file count alone. It asks one focused
question only at a material boundary.

`/just-do-it <request>` sets up the worktree first and immediately gives one
fresh Worker the explicit mechanical scope and objective before-and-after
check. It stops and returns to the router for ambiguity, behavior design,
security or migration risk, or scope expansion. Invocation grants bounded
implementation, `commit`, and `open-pr` delivery after verification for its
named branch only; it never grants merge, deployment, release, plain force
push, cleanup, or unrelated changes. The parent inspects the diff and evidence;
an independent installation falls back to the direct parent.

For a complete accepted plan, `implement` consumes slices in dependency order
without replanning and uses only planned parallel lanes with isolated worktrees
and sole writers. Accept-all requires whole-plan approval and otherwise defaults
to checkpointed implementation; accepted accept-all authority applies only to
the named accepted plan. An accept-all plan runs every named delivery unit
through tests, required gates, fixed formal review, commit, and authorized
publication in dependency order without routine Accept and publish or Continue
questions. It pauses and returns control to the human for setup, test, check,
commit, or publication failure; material review findings; material forecast
variance; or a change to accepted scope, delivery boundaries, dependencies, or
authority. It never authorizes merge, release, deployment, destructive cleanup,
or unrelated work. A fresh worktree receives the repository-defined runtime and
dependency setup before its first test or build; setup failures remain separate
from behavioral red proof. Its executor loads and follows
`test-driven-development` for behavioral work and `diagnosing-bugs` for
unresolved failures; its formal reviewer loads and follows `code-review`. A
serial delivery unit reuses one writer and worktree. Its validation ladder is
focused slice proof, affected-boundary checks, integration proof, and stable
delivery-unit required gates. Evidence is reused only while its covered surface
is unchanged; every required full gate runs once at the stable boundary. One
fixed formal review occurs there. Every material revision returns to the same
writer, who reruns invalidated evidence and completes the required final gate.
For an accepted accept-all plan, pause and return control to the human before
resolving any material finding. Delegation must provide a critical-path,
parent-context, or independent-evidence benefit. Bounded one-unit routes do not
gain forecast overhead. For checkpointed plans, pause and report material
coordination variance against an accepted forecast when one exists, or against
the bounded request when none does; seek fresh approval only when delivery
boundaries or authority change. For an accepted accept-all plan, every material
forecast variance returns control to the human, even when delivery boundaries
and authority do not change. Fresh approval is required only when those
boundaries or authority change. For checkpointed plans, the explicit **Accept
and publish** action invokes `commit` and `open-pr` without a second mutation
prompt. For accepted accept-all plans, those same steps follow successful
evidence and fixed review without a routine question. When a checkpointed
complete accepted plan's current unit is accepted and committed, and any
authorized publication has completed and another unit remains, the parent
summarizes progress and the next planned unit's observable outcome, dependencies
and readiness, intended proof and checks, and remaining plan progress. The
`question` tool offers exactly **Continue**, **Review next unit**, and
**Discuss**. If `question` is unavailable or the human cancels, the parent
presents the same three choices in conversation, waits, and does not start the
next unit. An accepted accept-all plan continues to the next ready unit in
dependency order without a routine question only after successful tests,
required gates, fixed review, commit, and authorized publication. Continue
starts the next ready delivery unit or planned ready lane set in accepted
dependency order without replanning; Review next unit pauses to review it
against the accepted pitch and plan without duplicating the completed unit's
fixed formal review; Discuss pauses for questions or potential changes. Scope,
delivery boundaries, dependencies, or authority changes return through planning
and approval before implementation resumes. After Review next unit or Discuss
finishes without an accepted plan change, control returns to the same checkpoint.
Repeat until no planned delivery units remain, then report plan completion.
Plan-less requests and single-unit plans do not receive a next-unit prompt.
Planned stacks require `gh stack`; unavailable delivery tools fail closed while
preserving local work and recovery evidence.

For an accepted `parallel-ready` slice, the human can request an isolated
worker worktree. The direct parent integrates and verifies the result. When the
root profile supplies `todo`, the parent uses it only for compact progress
visibility.

Install the complete independent package from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/engineering
```

`/improve` uses `improve-codebase-architecture` to rank evidence-backed
architecture-deepening opportunities. It asks the human to select a candidate,
then hands the selection to Shape and planning; it does not edit production
code.

`code-review` evaluates the accepted pitch and plan plus repository Standards.
It loads only the applicable TypeScript, React, Go, or SQL guide from its
`references/` directory; target-repository standards always win. `codebase-design`
includes the complete adapted deep-module method, its dependency-deepening and
alternative-interface references, and explicit testability guidance. Its
alternative-interface flow keeps architecture judgment in the parent and
prevents ordinary child agents from orchestrating fanout.

The focused implementation, TDD, `codebase-design`, `code-review`, debugging, and
architecture-discovery methods use MIT-licensed guidance from [mattpocock/skills](https://github.com/mattpocock/skills)
at the commits recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
The debugging skill preserves its pinned upstream source before its documented
Pi-specific additions. `codebase-design` and `code-review` adapt their pinned
sources into the local design and review flows.
