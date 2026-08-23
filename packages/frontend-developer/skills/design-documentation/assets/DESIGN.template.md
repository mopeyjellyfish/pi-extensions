---
version: alpha
name: Project design system
description: One-line product-specific visual thesis
omitted: []
colors:
  primary: "#000000"
typography:
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
spacing:
  sm: "8px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
---

# Design system

Remove example tokens that are not verified or accepted. Frontmatter tokens are
normative; prose explains when and why to apply them.

## Overview

State the product-specific visual thesis, intended feel, hierarchy, and durable
constraints.

## Colors

Describe each verified color role and application rule without redefining its
frontmatter value.

## Typography

Describe type roles, hierarchy, measure, wrapping, and supported fallbacks.

## Layout

Describe grid, spacing rhythm, density, containers, breakpoints, and responsive
reordering.

## Elevation & Depth

Describe the one accepted depth strategy and when elevation communicates state.

## Shapes

Describe radius, borders, clipping, and recurring form language.

## Components

Document repeated or signature components, their measurements, states, and
accessibility behavior.

## Do's and Don'ts

Record concrete, evidence-backed application rules and product-specific
anti-patterns.
