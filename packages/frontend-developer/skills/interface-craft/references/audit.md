# Audit

Modified from Impeccable 4.1.1 at `56f44523f76efdcec813e67b38ee550e49b16f48` under Apache-2.0.

## Scope

Measure accessibility, responsive behavior, theming, user-facing performance, and implementation-integrity risk without silently fixing it.

## Diagnose

Inspect semantics, labels, keyboard and focus paths, contrast, reduced motion, touch targets, overflow, zoom, long content, theme tokens, loading cost, runtime errors, and repeated shortcuts.

## Evidence

Record reproducible steps, affected route/state/viewport, measurement or standard, user impact, severity, likely cause, and false-positive checks.

## Guardrails

Do not claim WCAG, performance, responsive, or visual acceptance from source inspection alone. Do not optimize without a baseline or recommend unavailable tooling as completed proof.

## Handoff

Map verified findings to focused operations and offer `implement` or `developing-changes` only when requested. Keep evaluation and mutation as separate decisions.

## Completion

The audit is prioritized, reproducible, includes positive findings, names systemic patterns, and reports unavailable evidence honestly.
