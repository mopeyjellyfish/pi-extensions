---
description: Re-pitch a message that did not land
argument-hint: "[message or situation to clarify]"
---

Use the `writing-for-agents` skill. Re-pitch the current state in pragmatic
Simplified Technical English. If the `simple-english` skill is available, use
it too; remain useful without it.

Use this structure:

## Missing context

What the reader needs to know or what the earlier message failed to establish.

## Problem

What is unclear, blocked, or at risk. Use the nearest `CONTEXT.md` vocabulary
when present.

## Current state

What is true now. Keep exact paths, identifiers, commands, and other technical
content unchanged.

## Proposal or tradeoff

The smallest useful proposal, including the main tradeoff or rejected option.

## Next human decision

One clear decision the human must make, or say that no decision is needed.

Do not defend the earlier wording. ${ARGUMENTS:-Re-pitch the current message using this structure.}
