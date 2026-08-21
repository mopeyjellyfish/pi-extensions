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
- Let content constraints drive breakpoints. Test narrow, intermediate, and wide layouts.
- Respect reduced motion, zoom, text expansion, contrast, and pointer-independent controls.
- Prefer existing tokens and components; justify every new asset and client-side dependency.
