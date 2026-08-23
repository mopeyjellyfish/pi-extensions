---
name: frontend-development
description: Build and verify a frontend change from explicit design evidence.
---

# Frontend development

Start with the target repository's instructions, product behavior, existing UI,
and checks. Use `frontend-design` to route a bounded mechanical edit directly,
`interface-craft` for a focused product-interface operation, or
`interface-design` for non-trivial app-interface work. Treat supplied mock-ups
as evidence, not executable behavior: extract regions, hierarchy, assets,
tokens, states, responsive hypotheses, and ambiguity. Keep controls,
navigation, forms, and meaningful content as native accessible UI.

Choose only methods the request and target technology require.
`interface-design` preserves the target framework and selects an applicable
implementation specialist; use `react-interface` only for an existing React
product or an explicitly accepted React greenfield surface. After a stable UI
change, use `visual-validation` if the target offers browser or screenshot
capability. Continue honestly when a method or optional capability is
unavailable.
