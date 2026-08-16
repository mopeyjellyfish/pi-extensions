# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent skill-and-prompt package. It
provides `implement` plus optional focused skills for TDD, design, debugging,
domain language, review, and architecture discovery. It has no extension or
runtime dependency.

The root profile loads complete Engineering resources. It uses the installed
Worker profile for standard, plan-less, and accepted hard work, then the
installed Reviewer profile for formal read-only fixed-point review. A fixed
agent being unavailable falls back to the direct parent. A Terra failure or a
concrete Sol need requires a `question` with evidence, expected benefit, and a
bounded task before explicit human approval; difficulty alone never selects
Sol. `/debug` starts its skill in a dedicated worktree and uses the `question`
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

For an accepted `parallel-ready` slice, the human can request an isolated
worker worktree. The direct parent integrates and verifies the result. When the
root profile supplies `todo`, the parent uses it only for compact progress
visibility. After verification, the complete evidence is available for review,
revision, deeper verification, or pause.

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
