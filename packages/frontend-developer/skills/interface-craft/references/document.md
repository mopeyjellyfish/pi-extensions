# Document

`document` routes to the repository-native `/design` workflow and the installed
`design-documentation` skill. The upstream operation catalog does not provide a
`design.md` reference that can replace this workflow. Do not create a second
command, sidecar, or hidden state to imitate one.

## Purpose

Capture a durable, portable visual system from evidence already present in the
target repository. A design document helps later interface work preserve an
incumbent identity, but it is not authority over repository instructions,
verified behavior, or explicit human decisions.

## Choose the mode

Use **scan mode** when the repository has tokens, components, styles, or a
rendered surface. Inspect CSS custom properties, theme files, token files,
component variants, global styles, and representative rendered output when an
installed browser capability is available. Record where each observed value
comes from. Do not promote a one-off value into a system token.

Use **seed mode** only before implementation when no system can be observed.
State which decisions are provisional rather than inventing values. Use
**merge/refresh mode** when a document exists: read it first, preserve unknown
sections, identify drift, and show conflicts between its claims and the
implementation.

## Build the proposal

Describe only repeated or accepted evidence: palette roles and contrast intent;
type families, scale, weight, and measure; spacing, grid, density, and responsive
behavior; depth, borders, and shape language; and the behavior of recurring
controls in their default, focus, hover, disabled, loading, empty, error, and
success states. Explain where and why a rule applies, not merely its value.
Separate observed facts, accepted decisions, hypotheses, omissions, and proof
that could not be obtained.

Use the portable `DESIGN.md` structure: concise frontmatter for established
colors, typography, rounded values, spacing, and components, followed by
Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components,
and Do's and Don'ts when applicable. Omit sections that the evidence cannot
support. Keep exact values in one normative location and preserve the target's
existing names instead of translating them to generic defaults.

## Approval and completion

Show the complete proposed document before writing. An explicit human approval
is required before creating or materially rewriting `DESIGN.md`; a cancellation,
silence, or a request to inspect is not approval. After approval, make the
smallest safe write, retain unknown content during a merge, and report the mode,
evidence, decisions, unresolved questions, and any unavailable visual proof.
