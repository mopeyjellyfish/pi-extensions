# Adapt

Modified from Impeccable 4.1.1 at `56f44523f76efdcec813e67b38ee550e49b16f48` under Apache-2.0.

## Scope

Adapt a web interface to viewport, container, pointer, keyboard, touch, zoom, locale, content, or capability constraints.

## Diagnose

Map the task priority at narrow, intermediate, and wide sizes; container contexts; text expansion; safe areas; virtual keyboards; touch targets; hover absence; orientation; and DOM versus visual order.

## Evidence

Exercise named targets with long and missing content, 200% zoom, keyboard and touch paths, localization expansion, overlays, overflow, focus, and supported themes.

## Guardrails

Do not equate adaptation with shrinking, hide primary actions, reorder visually while leaving focus order wrong, rely on device sniffing, or replace native platform behavior without need.

## Handoff

Define what reflows, reorders, collapses, scrolls, or remains fixed and prefer container-aware existing primitives. Delegate behavioral implementation to `implement` or `developing-changes` when available.

## Completion

The focal task and content hierarchy remain usable at every named target, with input, focus, overflow, and unavailable-device proof reported honestly.
