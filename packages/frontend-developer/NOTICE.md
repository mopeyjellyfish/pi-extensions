# Third-Party Notices

This package includes modified interface-craft references derived from
Impeccable under the terms of Apache-2.0.

## Impeccable interface craft references

The modified `skills/interface-craft/references/*.md` files adapt Impeccable
4.1.1 at commit `56f44523f76efdcec813e67b38ee550e49b16f48`.

**Original work:** <https://github.com/pbakaus/impeccable>
**Original license:** Apache-2.0
**Copyright:** Copyright 2025 Paul Bakaus

## Reproduced upstream notice

Impeccable's upstream notice records that its `skill/reference/ios.md` and
`skill/reference/android.md` files are distilled from ehmo's
`platform-design-skills`, under MIT. This package retains that upstream notice
for provenance, but it does not redistribute those native-platform files.

**Original work:** <https://github.com/ehmo/platform-design-skills>
**Original license:** MIT
**Author:** ehmo

## Vercel React skills

The following files are vendored from `vercel-labs/agent-skills` commit
`063bee94c3f4df8453406c830b0a7df0f2860278`:

- `skills/react-best-practices` (including `rules/`)
- `skills/react-native-skills` (including `rules/`)
- `skills/react-view-transitions` (including `references/`)

Every listed upstream file is byte-identical except each discovered `SKILL.md`,
whose `name` changes and which appends Local integration. The local
`skills/react-best-practices/references/implementation.md` is package work, not
an upstream file.

Each vendored `SKILL.md` frontmatter declares MIT. The pinned `agent-skills`
repository has no separate root LICENSE or copyright string.

**Original work:** <https://github.com/vercel-labs/agent-skills>
**Original license:** MIT, declared by each vendored `SKILL.md`

## Vercel portable audit guidance

The portable additions to `skills/interface-craft/references/audit.md` are
informed by `vercel-labs/web-interface-guidelines` commit
`e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`. They do not include that project's
live-fetch workflow or Vercel-specific copywriting preferences.

**Original work:** <https://github.com/vercel-labs/web-interface-guidelines>
**Original license:** MIT
**Copyright:** Copyright (c) 2025 Vercel Labs

### Reproduced MIT notice for web-interface-guidelines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
