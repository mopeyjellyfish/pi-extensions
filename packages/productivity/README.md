# pi-productivity

`@mopeyjellyfish/pi-productivity` provides small, dependency-free Pi resources
for human-and-agent communication:

- `writing-for-agents` helps write skills, `AGENTS.md` instructions, plans,
  handoffs, and other agent-facing documents with clear evidence and low
  navigation load.
- `/ask-david <question or situation>` checks available prompt entry points
  before Agent Skills. It recommends the exact `/prompt` when one fits. If no
  prompt fits, it recommends one specific Agent Skill. It gives source-backed
  package usage help second, in a concise David-flavoured voice without claiming
  to be David or to express David's personal approval.
- `/wait-what` re-pitches a message through missing context, problem, current
  state, proposal or tradeoff, and the next human decision.

Use the nearest `CONTEXT.md` vocabulary when one exists. The resources preserve
exact technical content and prune duplicated or stale instructions. They apply
the target repository's instructions and vocabulary, not this source
repository's paths or tools. This is a skills-and-prompts package only; it has
no extension or runtime dependency, does not automatically install companion
extensions, agents, or tools, and remains independently installable.

The writing approach is original and concise, with MIT-licensed inspiration
from [mattpocock/skills](https://github.com/mattpocock/skills).

## Install

```text
pi install npm:@mopeyjellyfish/pi-productivity
```
