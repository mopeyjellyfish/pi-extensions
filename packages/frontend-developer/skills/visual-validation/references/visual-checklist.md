# Visual evidence checklist

Create a matrix before capture. Each row names the route, exact viewport,
application state, interaction used to reach it, reference evidence, and proof
status. Include narrow, intermediate, and wide widths when layout behavior can
change between the accepted mobile and desktop references.

For every row, inspect hierarchy, composition, typography, color, spacing,
assets, clipping, overflow, loading, empty, error, focus, hover, and disabled
states. Exercise keyboard order and focus return, reduced motion, zoom or text
expansion, console errors, failed requests, and accessible names where relevant.

Record each mismatch as: severity, observed evidence, accepted expectation,
likely shared cause, affected rows, and named recheck target. Fix shared tokens,
layout rules, or state ownership before local pixel offsets. Recapture only the
invalidated rows, then run the complete matrix once after the UI freezes.
