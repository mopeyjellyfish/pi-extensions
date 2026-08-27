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

1. **Just do it** — a small, bounded correction during active work. The request,
   local cause, and objective check are clear. Use `just-do-it`.
2. **Implement now** — a coherent standalone behavior, confirmed bug outcome,
   refactor, documentation, or metadata outcome with clear intent. Use
   `implement`.
3. **Diagnose first** — a reported broken, failing, or slow behavior with an
   unresolved cause. Use `diagnosing-bugs`, then route its confirmed bug outcome
   to `implement`.
4. **Plan first** — clear accepted intent spanning multiple outcomes, packages,
   commits, pull requests, or coordinated boundaries. Use `planning-changes`.
5. **Shape then plan** — unresolved product intent, material solution tradeoffs,
   major or hard-to-reverse behavior, or security, privacy, or migration risk.
   Use `shape`, then `planning-changes` after acceptance.

Use `just-do-it` for a small, bounded fix during active work when the requested outcome and objective check are clear. This route can include obvious breakage, cleanup, or a local behavior correction. It verifies, commits, and pushes without review. Do not require broad repetition or route it through `implement` only because behavior is involved.

Ask one focused question only when a material boundary ambiguity prevents safe
classification. Otherwise select the lightest route and let that skill own its
method. A read-only change review uses `code-review`. One bounded delivery unit has no
forecast or topology overhead; use the lightest route that preserves its
objective proof.

Route selection does not mandate an assurance agent. Calibrate assurance by
concrete risk and invalidation: objective low-risk work uses deterministic
focused evidence and parent diff inspection, while material public behavior,
lifecycle, state, concurrency, dependency, cross-boundary, security, migration,
or irreversible work selects proportionate independent QA or review. Exact
commands use a deterministic green path; reserve model QA for diagnosis, browser
evidence, or ambiguous acceptance.

For bounded material UI work with accepted frontend evidence, route the accepted
design evidence, selected frontend methods, and proof obligation to `implement`.
Keep bounded mechanical UI edits direct when their objective check is sufficient.
If `implement` or the selected frontend methods are unavailable, the direct-parent
fallback preserves the accepted evidence and records the unmet implementation or
proof honestly.

The direct parent owns the user conversation, route choice, synthesis, final
diff inspection, verification, and approval. Do not require a subagent package:
each route retains its direct-parent fallback. If `shape` or
`planning-changes` is unavailable, the direct parent performs the equivalent
inline: write and accept a short pitch for unresolved intent, then write an
ordered slice plan before implementation.

## Go routing

When work has Go source, a Go module, a Go CLI, or Go-specific work, resolve
`go` by its installed name and follow it. Resolve `cobra-viper` only when Cobra
or Viper commands, flags, or CLI configuration are in scope. Unrelated Go
toolchain evidence alone does not activate either method. If a companion skill
is unavailable, record the unmet method and have the direct parent use bounded
target-repository Go standards without pretending the skill loaded.
