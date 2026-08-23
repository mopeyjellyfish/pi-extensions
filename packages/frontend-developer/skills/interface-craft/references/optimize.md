# Optimize

Modified from Impeccable 4.1.1 at `56f44523f76efdcec813e67b38ee550e49b16f48` under Apache-2.0.

## Scope

Improve a measured user-facing loading, rendering, interaction, animation, or network bottleneck.

## Diagnose

Define the slow workflow, affected users and devices, baseline metric, measurement conditions, perceptual impact, and likely dominant cause before proposing a change.

## Evidence

Record comparable before/after LCP, INP, CLS, frame time, bundle or asset size, request cost, render count, or task latency as applicable, plus functional and accessibility regression checks.

## Guardrails

Do not optimize without measurement, chase scores unrelated to the task, memoize by reflex, lazy-load above-fold essentials, degrade accessibility, or trade correctness for a synthetic benchmark.

## Handoff

Fix the largest verified cause first and define the measurement rerun. Delegate implementation to `implement` or `developing-changes` when available.

## Completion

Comparable evidence shows a meaningful user-facing improvement, no regression, and an honest inconclusive result when noise or unavailable tooling prevents a claim.
