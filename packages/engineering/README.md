# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent skill-and-prompt package. It
provides `developing-changes`, `implement`, `/just-do-it`, and optional focused
skills for TDD, design, debugging, domain language, review, and architecture
discovery. It has no extension or
runtime dependency.

The root profile loads complete Engineering resources. It uses the installed
Worker profile for standard, plan-less, and accepted hard work, configured QA
for failed-command diagnosis, browser evidence, or ambiguous acceptance, and
Reviewer for risk-selected formal review. A fixed agent being unavailable falls
back to the direct parent. A higher-capability need requires a `question` with
evidence, expected benefit, and a bounded task before explicit human approval;
difficulty alone never selects that role. `/debug` starts its skill in a
dedicated worktree and uses the `question` tool for focused intake:

```text
parent -> bounded Worker -> frozen diff -> [deterministic gates or QA || Reviewer]
```

The Worker owns one vertical change, focused behavioral proof, and local static
checks. Parent finalization owns the named repository gates and assurance
selection. Exact green-path commands run deterministically without a QA model.
When QA and formal review are both selected, they run in parallel on one frozen
diff: QA owns executable evidence and Reviewer owns intent and Standards. The
parent joins their results into one repair packet. Progressing repairs rerun only
invalidated evidence and do not repeat unchanged review.

All configured child handoffs start with fresh context. Fixed Worker launches are
foreground launches that omit per-run mode, model, and thinking fields so the
agent profile remains authoritative. When Pi supplies that capability through
its `subagent` tool, the skills provide the direct argument contract without
making the independent package depend on that extension. Before any write,
every mutation-capable skill requires an isolated linked worktree and never
edits the main-branch checkout. `implement` reuses the task worktree that
contains the accepted pitch and plan, or creates one for a plan-less bounded request when
safe worktree tooling is available. Direct diagnosis, TDD, and domain-modeling
work applies the same guard. When safe tooling is unavailable, the skill stops
before writing and asks the human to provide a worktree.

In a fresh worktree, repository-defined runtime and dependency setup occurs
before the first test unless valid parent-supplied setup evidence covers the
unchanged runtime selectors and dependency inputs.

The parent supplies durable Intent sources: target-project context, every named
pitch, plan, request, and later user decisions, plus the exact slice, not a
conversation transcript. It confirms the Business reason from evidence or asks
the human to confirm it, then records it in the implementation spec and Worker
handoff. The parent stays responsible for synthesis, final diff inspection, and
verification.
An independent installation without the root agent profiles uses the direct
parent; it does not automatically provide companion extensions, agents, tools,
or skills.

`developing-changes` uses an impact-and-uncertainty decision. A small, bounded
fix during active work goes to `/just-do-it` when the requested outcome, local
cause, and objective check are clear. This includes obvious breakage, cleanup,
and local behavior corrections. A coherent standalone outcome uses `implement`.
A reported failure with an unresolved cause goes to `diagnosing-bugs`.
Coordinated clear work plans first. Uncertain, hard-to-reverse, or risky work
Shapes then plans. The router uses uncertainty, reversibility, risk, affected
boundaries, and coordination cost, not file count alone. It asks one focused
question only at a material boundary. Accepted material UI evidence and selected
installed frontend methods continue into `implement`. Bounded mechanical UI work
remains direct.

`/just-do-it <request>` reuses the current safe task worktree and branch, or sets
up an isolated task worktree before repository reads. The direct parent fixes
the bounded problem immediately and uses one fresh Worker only when broad
repetition saves critical-path time or parent context. The route permits one
bounded inspection pass for obvious local breakage. It stops for broad diagnosis,
product decisions, security or migration risk, dependency changes, irreversible
actions, or scope expansion.

The route runs focused verification and parent diff inspection. It does not run
independent QA, a Reviewer, or formal review. Successful verification authorizes
the named fix to be committed and pushed on the current branch without another
approval prompt. It does not open a pull request unless the user asks. It never
grants merge, deployment, release, plain force push, worktree cleanup,
destructive actions, or unrelated changes.

For a complete accepted plan, `implement` follows the accepted dependency graph
without replanning. Planned independent ready delivery units can run concurrently
in separate worktrees with sole writers, non-overlapping ownership, and named
integration points. Dependent units stay in order. When concurrent execution is
unavailable, implementation serializes the work without changing the accepted
pull-request topology. Accept-all requires whole-plan approval and otherwise
defaults to checkpointed implementation. A serial delivery unit reuses one
writer and worktree. Its validation ladder is focused slice proof,
affected-boundary checks, integration proof, and one stable-boundary required
gate run against the final frozen diff.

Implementation selects assurance from concrete risk. Mechanical,
documentation, and reversible metadata work uses direct focused evidence.
Material public behavior, lifecycle, state, concurrency, provider, dependency,
cross-boundary, security, migration, or irreversible work selects proportionate
QA or review. When both are needed, Pi uses one `runs.all` workflow for fresh
read-only QA and Reviewer children on the same frozen-tree identifier. QA does
not broaden the named commands; Reviewer does not run them. Hosts without
concurrent children preserve the role split sequentially.

Behavioral `implement` work loads `test-driven-development`; an unresolved
failure loads `diagnosing-bugs` before implementation. Missing methods use the
documented direct-parent proof fallback.

The TDD and review methods treat tautological tests as harmful. Expected values
must be independent of the implementation under test. Each test must fail for a
plausible wrong implementation.

After a joined failure, the retained Worker receives one prioritized packet.
The writer reruns focused invalidated evidence, then the parent or selected QA
runs invalidated required gates and the final complete gate once. The parent
verifies repaired review findings without a second full review unless
architecture or accepted scope changed. Matching setup evidence is reused only
while runtime selectors and dependency inputs remain unchanged. Matching final
evidence records the exact tested tree, command definitions, setup fingerprint,
base `HEAD`, and approved path set for publication reuse.

Accept-all pauses for setup, test, check, commit, publication, material review,
or forecast variance. It never authorizes merge, release, deployment,
destructive cleanup, or unrelated work. Delegation must provide a critical-path,
parent-context, or independent-evidence benefit. Bounded one-unit routes do not
gain forecast overhead.

Every direct bounded implementation request and accepted plan authorizes its
named task branch and delivery unit to commit, push, and open or update a ready
pull request by default. Publication follows tests, required gates,
risk-selected assurance, accepted repairs, and invalidated evidence. `implement`
composes installed `commit` and `open-pr`; an independent installation that lacks
either preserves local evidence, reports the unmet method, and stops with a
recovery action. `local-only`, `no push`, or `no PR` allows a local commit but
prevents `open-pr` and every remote mutation. `no commit` prevents every
publication action. Publication never includes merge, release, deployment,
cleanup, branch deletion, plain force push, or unrelated changes.

For checkpointed plans, report material coordination variance against the
accepted forecast. Seek fresh approval only when delivery boundaries or
authority change.
Independent delivery units can run in parallel and publish as sibling standalone
pull requests; sequential dependency chains publish as ordered GitHub stacks. A
mixed plan preserves each independent lane and dependent chain. Every accepted
unit uses `open-pr`, while only sequential chains require `gh stack`.

Checkpointed implementation has no final publication prompt. After the current
delivery unit is committed and published, the parent summarizes the next planned
unit's outcome, dependencies, proof, checks, and remaining progress. It offers
**Continue**, **Review next unit**, and **Discuss** only before starting that
unit. Review or discussion returns to the same checkpoint when the accepted plan
does not change.

Accepted accept-all continues in dependency order after successful evidence, any
selected review, commit, and publication. Scope, delivery boundaries,
dependencies, or authority changes return through planning and approval. Repeat
until the remaining units are complete, then report plan completion. Plan-less
requests and single-unit plans do not receive a next-unit prompt. Planned stacks
require `gh stack`; unavailable delivery tools fail closed while preserving
local work and recovery evidence.

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
`references/` directory; target-repository standards always win. For Go source,
modules, Go CLIs, or Go-specific work, every Engineering direct entry resolves
installed `go`; it resolves `cobra-viper` only for commands, flags, or CLI
configuration. Toolchain evidence alone does not activate either. An independent
installation records an unavailable companion as an unmet method and uses bounded
target-repository Go standards instead of claiming it loaded. Formal reviewers
use target-repository instructions and module contracts first, installed Go and
applicable Cobra/Viper standards second, and `references/go.md` questions last;
only practical, non-tool-duplicate findings are reported. Worker preloads both
Go skills, and fixed-diff handoffs explicitly send `Review mode: fixed-diff
code`. `codebase-design` includes the complete adapted deep-module method, its
dependency-deepening and alternative-interface references, and explicit
testability guidance. For Go work, its precedence is target-repository standards
first, then installed `go` and applicable `cobra-viper`; generic design guidance
contributes evidence, depth, locality, and leverage without overriding them. Its
alternative-interface flow keeps architecture judgment in the parent and prevents
ordinary child agents from orchestrating fanout.

The focused implementation, TDD, `codebase-design`, `code-review`, debugging, and
architecture-discovery methods use MIT-licensed guidance from [mattpocock/skills](https://github.com/mattpocock/skills)
at the commits recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
The debugging skill preserves its pinned upstream source before its documented
Pi-specific additions. `codebase-design` and `code-review` adapt their pinned
sources into the local design and review flows.
