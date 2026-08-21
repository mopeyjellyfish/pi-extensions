# Visual evidence checklist

Create a matrix before capture. Each row names the route, exact viewport,
application state, interaction used to reach it, reference evidence, and proof
status. Include narrow, intermediate, and wide widths when layout behavior can
change between the accepted mobile and desktop references.

For every row, inspect hierarchy, composition, typography, color, spacing,
assets, clipping, overflow, loading, empty, error, focus, hover, and disabled
states. Exercise keyboard order and focus return, reduced motion, zoom or text
expansion, console errors, failed requests, and accessible names where relevant.

- Include RTL and localized text expansion, forced-colors or high-contrast,
  coarse pointer/touch targets, and safe area insets where the product supports
  them. For data visualization, verify labels, tables, patterns, or text
  alternatives communicate meaning without color alone.
- Record performance evidence where relevant: layout shift, explicit image
  dimensions, font loading, and large-data or table rendering behavior.

Record each mismatch as: severity, observed evidence, accepted expectation,
likely shared cause, affected rows, and named recheck target. Fix shared tokens,
layout rules, or state ownership before local pixel offsets. Continue only while
recapture shows evidence progress; stop at a resolved ledger, no progress, or
named unmet proof, then run the complete matrix once after the UI freezes.
