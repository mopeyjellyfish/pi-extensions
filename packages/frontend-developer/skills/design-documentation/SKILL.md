---
name: design-documentation
description: Create, document, extract, refresh, merge, or reconcile a portable DESIGN.md from accepted direction or verified interface evidence.
---

# Design documentation

Create one durable, portable `DESIGN.md` at the target repository root. Read
repository instructions, verified product behavior, existing UI, tokens,
components, supplied evidence, and the existing file first. Repository
instructions and verified behavior outrank the document.

## Select the mode

- **Scan mode:** use implemented tokens, repeated components, representative
  states, and rendered evidence. Record only observed reusable decisions.
- **Seed mode:** use an explicitly accepted visual direction before
  implementation. Record settled invariants and honest unresolved placeholders;
  do not fabricate tokens or components.
- **Merge/refresh mode:** show the existing file, identify conflicts and drift,
  preserve unknown existing content where possible, and propose refresh, merge,
  or replacement. No silent overwrite.

## Build the proposal

Use the [canonical template](assets/DESIGN.template.md). Frontmatter tokens are
normative; prose explains application and rationale. Include only applicable
canonical sections in their defined order. Preserve the target's canonical CSS
value format and established token names. Do not invent values, components,
claims, or product behavior. Record unresolved decisions explicitly.

Scan mode inspects CSS properties, theme and token files, shared components,
global styles, responsive rules, and representative computed styles when an
installed browser capability is available. Seed mode leaves unsettled
measurements unresolved. Merge/refresh mode does not discard unknown sections
or incompatible evidence without a human decision.

## Approval and write

Present the complete proposal before writing. When the structured question
capability is available, attach the full document with `format: "md"` and use
`presentation: "fullscreen"` for formal approval. Offer approve and write,
revise, deepen, and cancel choices. Otherwise show the complete proposal in the
conversation and request the same explicit decision.

Explicit human approval is required before the workflow can create, replace, or
materially rewrite the file. Agent discovery, a missing file, silence, skip, or cancellation is not
approval. After approval, write only the root `DESIGN.md`, report the evidence
used and unresolved decisions, and never create a separate method-owned memory
file.

## Completion

Confirm the written document matches the approved proposal, canonical section
order, repository evidence, and accepted direction. Report any evidence or
validation that was unavailable. Offer a later refresh when implementation
settles provisional seed decisions.
