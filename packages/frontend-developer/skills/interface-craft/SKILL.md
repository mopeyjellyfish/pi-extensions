---
name: interface-craft
description: >-
  First owner for focused polish, audit, layout, clarify, adapt, optimize, bolder,
  quieter, and distill web-interface operations. Use when a request says polish this,
  audit a settings flow, fix a mobile layout, make this calmer, improve onboarding,
  or clarify errors.
---

# Interface craft

Read target repository instructions, observed behavior, incumbent UI, tokens,
and `DESIGN.md` when present. Repository instructions and verified behavior take
precedence. This is web application guidance: it does not substitute for native
platform or marketing-site expertise.

Package-level Apache attribution for adapted guidance is retained in `NOTICE.md`.

## Natural-language operation router

For competitor research alone, load `interface-research`. For an explicit
current-app inspection, competitor comparison, visual selection, and improvement
plan, follow [`/improve-ui`](../../prompts/improve-ui.md). Supply read-only critique
and audit evidence there. Defer polish and live source-edit iteration until a
separate implementation request. Ordinary focused craft requests stay here.

This is a first-class natural-language router, not a compatibility alias. Route
the request to the narrowest applicable reference: **design** for a focused
direction change within an established web product and surface; **extract** for
reusable tokens and patterns; or **document** when someone says “teach me this
design system” or asks to document it. A new app surface, major redesign,
material app direction, or unclear product-wide visual direction requires the
classified material app-interface method instead of this focused operation.
Route an evidence-only evaluation to **critique** (experience and hierarchy) or
**audit** (accessibility, performance, and responsive quality).

Route refinement to **polish**, **bolder**, **quieter**, **distill**, **harden**,
or **onboard**. Route enhancement to **animate**, **colorize**, **typeset**,
**layout**, **delight**, or **overdrive**. Route a problem to **clarify**,
**adapt**, or **optimize**: “settings flow” commonly needs clarify or polish;
“mobile layout” routes to adapt or layout; “make this calmer” routes to quieter;
and “Normalize” routes to polish for local drift or extract for reusable
convergence. Route installed-browser iteration to **live**. Ask once only when
two operations materially overlap.

`/shape` remains the feature pitch lifecycle; interface-craft does not replace
it or add an entrypoint. Evaluation is read-only: critique and audit report
evidence and propose a follow-on operation rather than silently fixing. Bounded
mechanical edits stay direct. For behavioral implementation, follow the target
repository workflow or delegate to its installed implementation capability.

Every operation states observed evidence, requested scope, unmet proof, and a
completion result. Use only target-owned commands and already installed browser,
board, and image capabilities. Do not add runtime helpers, hidden state, or
command ownership to supply unavailable machinery.

## Deliver requested critique or audit improvements

Critique and audit stay read-only. Report evidence and proposed follow-on
operations without starting delivery. Only when the user requests delivery of
those improvements, confirm the chosen scope and offer **Shape and plan** or
**Plan directly** through terminal `question`. If unavailable, ask in
conversation and state the limitation. Silence or cancellation starts neither
route. Within `/improve-ui`, return evidence to that workflow's visual selection
and delivery choice instead of asking a second delivery question here.

Create a self-contained handoff with the selected improvements and operation
context, observed current-state and research evidence, constraints, accessibility
and responsive requirements, and unmet proof. Include any accepted direction,
inspected image evidence, and user notes. Preserve settled visual decisions. If
material visual direction remains unresolved, record the gap for the chosen
workflow rather than claim selection.

- **Shape and plan** resolves installed `shape` and passes the handoff as input,
  not approval. Shape seeks pitch approval, then invokes `planning-changes`.
- **Plan directly** resolves installed `planning-changes` and passes the same
  evidence for already-settled intent. Planning seeks complete-plan approval.

Neither choice authorizes implementation. Browser and design-board controls
never authorize Shape, planning, implementation, tracker mutation, or publication.
If the chosen companion is unavailable, return the complete handoff and name the
unmet `shape` or `planning-changes` capability. Do not substitute another route
or claim it ran. If planning is unavailable after pitch approval, include the
accepted pitch in the handoff.
