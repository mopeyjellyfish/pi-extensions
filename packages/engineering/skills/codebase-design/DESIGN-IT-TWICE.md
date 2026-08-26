# Design It Twice

When the user wants to explore alternative interfaces for a chosen deepening candidate, use this design exercise. Based on "Design It Twice" (Ousterhout) — your first idea is unlikely to be the best.

Uses the vocabulary in [SKILL.md](SKILL.md) — **module**, **interface**, **seam**, **adapter**, **leverage**.

## Process

### 1. Frame the problem space

The selected parent writes a user-facing explanation of the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy
- The dependencies it would rely on, and which category they fall into (see [DEEPENING.md](DEEPENING.md))
- A rough illustrative code sketch to ground the constraints — not a proposal, just a way to make the constraints concrete

### 2. Develop genuinely different interfaces

An ordinary child is not an orchestrator. The selected parent retains architecture judgment and develops the alternatives directly, or asks one bounded child to return several alternatives for the parent to assess. No alternative authorizes implementation.

Use genuinely different constraints for each interface rather than small variations on one idea:

- Minimize the interface — aim for 1–3 entry points and maximize leverage per entry point.
- Maximize flexibility — support many use cases and extension.
- Optimize for the most common caller — make the default case trivial.
- When applicable, design around ports and adapters for cross-seam dependencies.

Before presenting Go alternatives, discard generic repositories and services,
layer-named packages, and up-front interfaces rejected by installed `go` or
applicable `cobra-viper` guidance. Compare only idiomatic Go candidates, using
this method for evidence, depth, locality, and leverage.

For each interface, provide:

1. Interface: types, methods, parameters, invariants, ordering, and error modes
2. Usage example showing how callers use it
3. What the implementation hides behind the seam
4. Dependency strategy and adapters (see [DEEPENING.md](DEEPENING.md))
5. Trade-offs: where leverage is high and where it is thin

Use the [SKILL.md](SKILL.md) vocabulary and the target repository's domain vocabulary consistently.

### 3. Present and compare

Present designs sequentially so the user can absorb each one, then compare them in prose. Contrast **depth** (leverage at the interface), **locality** (where change concentrates), and **seam placement**.

Give a recommendation: identify the strongest design and why. If elements from different designs combine well, recommend a hybrid. Be opinionated — the user wants a strong read, not a menu.
