---
name: react-interface
description: Implement maintainable React behavior from accepted design evidence.
---

# React interface

First inspect the target repository's framework, React version, component
system, styling approach, conventions, and tests. Preserve the target stack.
For a greenfield surface, recommend a React stack only after checking repository
intent. Prefer repository components and tokens before new abstractions.

Implement real behavior with native controls, not a static mock-up. Name the
feature-relevant loading, empty, error, focus, hover, disabled, and responsive
states. Use semantic structure, keyboard behavior, focus management, readable
contrast, reduced motion, content hierarchy, and asset cost as constraints.

Avoid speculative component layers, blanket memoization, framework rewrites,
and styling-library mandates. Use direct parent behavior and the target's own
checks when no general engineering or browser capability is installed.

Load [`references/react.md`](references/react.md) when state ownership,
component seams, responsive behavior, or accessibility proof needs more detail.
