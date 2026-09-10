# Third-party notices

## mattpocock/skills

Source: <https://github.com/mattpocock/skills>

Pinned commits:

- `8b78b531ab965735c5dc74f6f7a219e1e37326df` for the adapted files below;
- `068b6e0c62393147daf03530149cdce209c93da8` for the verbatim debugging
  resources below, and the adapted code-review and architecture-improvement
  resources;
- `ee8bae40062cd6b435073368ed0c540f48c35862` for the adapted codebase-design
  resources below.

Files and pinned sources:

- `skills/implement/SKILL.md`, adapted from
  <https://github.com/mattpocock/skills/blob/8b78b531ab965735c5dc74f6f7a219e1e37326df/skills/engineering/implement/SKILL.md>
- `skills/test-driven-development/SKILL.md`, adapted from
  <https://github.com/mattpocock/skills/blob/8b78b531ab965735c5dc74f6f7a219e1e37326df/skills/engineering/tdd/SKILL.md>
- `skills/codebase-design/SKILL.md`, adapted from
  <https://github.com/mattpocock/skills/blob/ee8bae40062cd6b435073368ed0c540f48c35862/skills/engineering/codebase-design/SKILL.md>
- `skills/codebase-design/DEEPENING.md`, adapted from
  <https://github.com/mattpocock/skills/blob/ee8bae40062cd6b435073368ed0c540f48c35862/skills/engineering/codebase-design/DEEPENING.md>
- `skills/codebase-design/DESIGN-IT-TWICE.md`, adapted from
  <https://github.com/mattpocock/skills/blob/ee8bae40062cd6b435073368ed0c540f48c35862/skills/engineering/codebase-design/DESIGN-IT-TWICE.md>
- `skills/code-review/SKILL.md`, from
  <https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/code-review/SKILL.md>,
  adapted into the single-reviewer pitch-and-plan flow
- `skills/improve-codebase-architecture/SKILL.md`, adapted from
  <https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/improve-codebase-architecture/SKILL.md>
- `skills/diagnosing-bugs/SKILL.md`, verbatim from
  <https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/diagnosing-bugs/SKILL.md>,
  followed by Pi-specific worktree, structured-intake, and human-in-the-loop
  additions;
- `skills/diagnosing-bugs/scripts/hitl-loop.template.sh`, verbatim from
  <https://github.com/mattpocock/skills/blob/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh>
- `skills/improve-codebase-architecture/HTML-REPORT.md`, adapted from
  <https://github.com/mattpocock/skills/blob/321658273cb1d20b76026717d027d505790106d4/skills/engineering/improve-codebase-architecture/HTML-REPORT.md>.

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Anthropic Claude Code code-review plugin

Source: <https://github.com/anthropics/claude-code/blob/db8834ba1d72e9a26fba30ac85f3bc4316bb0689/plugins/code-review/commands/code-review.md>

Pinned commit: `db8834ba1d72e9a26fba30ac85f3bc4316bb0689`

Source content SHA-256:
`2b0837c5ec0b2e75f8ba4565bdafd76fa916b0dc146608c5733af7ba5802012c`

Modified resources:

- `prompts/code-review.md`;
- `skills/code-review/SKILL.md`.

These resources adapt the upstream review, high-signal filtering, and opt-in
GitHub comment behavior for Pi. The modifications add a fixed review boundary,
five evidence lenses, target-repository and language-method routing, one
confidence scorer, local-only repair behavior, and Pi role and authority rules.
They remove Claude-specific branding, telemetry, and model routing.

The adapted resources are modified from the upstream source. They are available
under Apache License 2.0. The complete Apache License 2.0 text follows the MIT
license in `LICENSE`.
