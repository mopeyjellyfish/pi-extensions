# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent skill-and-prompt package. It
provides `implement` plus optional focused skills for TDD, design, debugging,
domain language, and review. It has no extension or runtime dependency.

The root profile loads `implement` and `diagnosing-bugs`. It uses the installed
`terra-worker` profile for standard slices, the installed `sol-worker` profile
for hard or escalated slices, and the installed Fable reviewer for the optional
final review. `/debug` starts the latter skill in a dedicated worktree and uses
the `question` tool for a focused intake; other profiles need those two
resources installed before they can use this workflow:

```text
Fable plan -> fresh Terra worker (Sol when hard or escalated) -> parent verification -> fresh Fable review or pause
```

Both provider handoffs start with fresh context. The parent supplies durable
pitch and plan paths plus the exact slice instead of copying the conversation.
The parent stays responsible for synthesis, final diff inspection, and
verification. An independent installation without the root agent profiles uses
the direct parent.

For an accepted `parallel-ready` slice, the human can request an isolated
worker worktree. The direct parent integrates and verifies the result. When the
root profile supplies `todo`, the parent uses it only for compact progress
visibility. After verification, the complete evidence is available for review,
revision, deeper verification, or pause.

Install the complete independent package from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/engineering
```

The focused implementation, TDD, codebase-design, and debugging methods use
MIT-licensed guidance from [mattpocock/skills](https://github.com/mattpocock/skills)
at the commits recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
The debugging skill preserves its upstream source verbatim before its documented
Pi-specific additions.
