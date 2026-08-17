---
name: developing-changes
description: >-
  Routes a coding request to the smallest safe engineering workflow by impact
  and uncertainty.
---

# Developing changes

Classify the request by intent uncertainty, whether it is reversible, risk,
affected boundaries, and coordination cost. Do not use file count alone. Choose one
route:

1. **Just do it** — explicit, mechanical, low-risk, broadly repetitive work
   with an objective check. Use `just-do-it`.
2. **Implement now** — a bounded behavior, confirmed bug outcome, refactor,
   documentation, or metadata outcome with clear intent and one coherent result.
   Use `implement`.
3. **Diagnose first** — a reported broken, failing, or slow behavior with an
   unresolved cause. Use `diagnosing-bugs`, then route its confirmed bug outcome
   to `implement`.
4. **Plan first** — clear accepted intent spanning multiple outcomes, packages,
   commits, pull requests, or coordinated boundaries. Use `planning-changes`.
5. **Shape then plan** — unresolved product intent, material solution tradeoffs,
   major or hard-to-reverse behavior, or security, privacy, or migration risk.
   Use `shape`, then `planning-changes` after acceptance.

Ask one focused question only when a material boundary ambiguity prevents safe
classification. Otherwise select the lightest route and let that skill own its
method. A read-only change review uses `code-review`. One bounded delivery unit has no
forecast or topology overhead; use the lightest route that preserves its
objective proof.

The direct parent owns the user conversation, route choice, synthesis, final
diff inspection, verification, and approval. Do not require a subagent package:
each route retains its direct-parent fallback. If `shape` or
`planning-changes` is unavailable, the direct parent performs the equivalent
inline: write and accept a short pitch for unresolved intent, then write an
ordered slice plan before implementation.
