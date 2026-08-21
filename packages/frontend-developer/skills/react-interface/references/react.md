# React implementation reference

## State and seams

- Keep server, URL, form, and local interaction state with their real owner.
- Derive values during render; use effects only to synchronize with external systems.
- Put reusable policy behind a small component or hook interface, not a forwarding layer.
- Test behavior through roles, labels, navigation, and visible state rather than internals.

## Interaction and layout

- Use semantic HTML first; add ARIA only where native semantics are insufficient.
- Define keyboard order, focus entry and return, escape behavior, and error announcement.
- Preserve usable loading, empty, error, disabled, optimistic, and recovery states.
- Let content constraints drive breakpoints. Test narrow, intermediate, and wide layouts, RTL, and localized text expansion.
- Respect reduced motion, zoom, text expansion, contrast, forced-colors or high contrast, and pointer-independent controls.
- Support coarse pointer/touch targets and safe area insets where applicable. Data visualizations need labels, patterns, tables, or text alternatives so color is not the only signal.
- Gather performance evidence where relevant: prevent layout shift with explicit image dimensions, verify font loading, and exercise large-data or table behavior.
- Prefer existing tokens and components; justify every new asset and client-side dependency.
