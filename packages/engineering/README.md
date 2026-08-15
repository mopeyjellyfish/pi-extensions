# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent, skill-and-prompt-only Pi
package. It provides a quality-first coding workflow plus narrow guidance for
public-seam TDD, codebase design, diagnosing bugs, modeling domain language,
and reviewing changes. It has no extension, runtime
dependency, or Pi peer dependency.

The skills use the nearest `CONTEXT.md` for repository language. This
repository's root context file records its canonical terms. Review is
read-only unless a caller explicitly authorizes edits.

The focused implementation, TDD, codebase-design, and diagnosis methods
selectively adapt MIT-licensed guidance from
[mattpocock/skills](https://github.com/mattpocock/skills) at a pinned commit.
Issue-tracker, setup, router, report, interview, and similar scaffolding was not
ported. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the adapted
file list and complete license.

## Prompts

- `/develop [change request]`
- `/implement [approved slice, bounded request, or confirmed bug outcome]`
- `/diagnose [bug report]`
- `/model-domain [domain or change]`
- `/review-change [fixed point or change]`

Install the package with Pi's normal package installation command. Its narrow
skills remain independently usable. Direct parent implementation needs no agent
package. Retained execution, QA, and requested independent review require the
matching Git aggregate agent and `pi-subagents`:

```sh
pi install npm:pi-subagents
pi install git:github.com/mopeyjellyfish/pi-extensions
```

Natural implementation, bug, validation, QA, and review requests can match
`developing-changes`. This flow uses `/implement` as the only implementation
command:

```mermaid
flowchart TD
    Request[Engineering request] --> Develop["/develop"]
    Develop -->|Unresolved intent| Shape[Shape]
    Shape --> Plan[planning-changes]
    Develop -->|Accepted non-trivial intent| Plan
    Develop -->|Accepted slice or bounded change| Implement["/implement"]
    Plan --> Implement
    Implement --> Method{Change type}
    Method -->|Behavior| TDD[TDD]
    Method -->|Bug| Diagnose[diagnosing-bugs]
    Method -->|Refactor or documentation| Validate[Focused validation]
    TDD --> Checks[Focused and static checks]
    Diagnose --> Checks
    Validate --> Checks
    Checks --> Suite[Final required suite]
    Suite --> Signals[Test and lint signals]
    Signals --> ReviewGate{Review requested or required?}
    ReviewGate -->|Yes| Review[Spec and Standards review]
    Review -->|Routine finding| Repair[Same-writer repair]
    Repair --> Checks
    Review -->|Accepted| Closure{Approved Shape slice?}
    ReviewGate -->|No| Closure
    Closure -->|Yes| Close[Parent closes slice]
    Closure -->|No| Commit[Conventional Commit if authorized]
    Close --> Commit
    Commit --> PR[Update existing pull request]
```

Unresolved product intent goes to Shape. Accepted non-trivial intent goes to
`planning-changes`. Accepted slices and bounded changes go to `implement`.
Small fixes can enter `implement` directly.

Implement sends every approved Shape slice to one fresh Sol `medium` worker.
Sol `high` is reserved for named security, data-loss, concurrency, lifecycle,
migration, API, protocol, architecture, nondeterministic, or expensive-validation
risks. Direct parent implementation is only for a bounded non-Shape request.

Implement composes TDD for behavioral work or focused validation for
non-behavioral work. The worker checks its result against the complete slice and
reports focused test, lint, static-check, integrated-path, and final-suite
signals. These signals do not wait for human approval.

Workers use the 30-minute runtime default without hard turn or tool-count
budgets. Interactive parents rely on asynchronous completion notifications
instead of blocking on `subagent_wait`. An aborted wait does not prove that its
child failed. The parent checks lifecycle once and consumes existing output
before it considers a retry.

Shape does not review individual slices. The human reviews the pull request and
requests one final code review when needed. Repository instructions can still
require formal review. One reviewer covers both Spec and Standards axes in one
bounded pass over the complete feature diff. It uses current test and lint
evidence instead of rerunning credible checks. Material routine findings return
to one worker once for repair, then affected checks run again. The parent does
not review that repair again unless the human asks.

The parent verifies every route. For an approved Shape plan slice, the parent
also applies Shape's closure gate and updates the plan checkbox. A direct bounded
request needs no worker lease return or plan edit. With explicit authority, the
parent then creates one Conventional Commit and pushes it to the existing pull
request.

The focused skills own their methods. Shape owns product intent and plan
closure. Planning owns vertical slices. `test-driven-development` owns
public-seam red and green evidence. `codebase-design` owns deep modules, stable
seams, and evidence-based responsibility. `diagnosing-bugs` owns the observable
root-cause loop. `domain-modeling` owns shared terms and concrete scenarios.
`reviewing-changes` owns fixed-point Spec and Standards review. There is no
`engineering-practices` skill.

A bounded non-Shape request that is sequential, low-risk, locally understandable,
and cheap to validate can stay in the parent through `/implement` and follows
the same verification contract. Behavioral code uses public-seam red and green evidence. Pure
refactors and non-behavioral work use applicable tests or focused validation
instead of manufactured failures. QA-only work uses a fresh read-only QA agent.
One-shot QA returns evidence without repository records unless records are
requested, reusable, or needed for comparison. QA does not add a review gate.

The private repository aggregate also discovers this package's `skills/` and
`prompts/` directories.
