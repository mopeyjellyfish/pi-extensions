# Shape the pitch

Create `specs/<change>/spec.md` with immutable frontmatter and five sections:

1. **Problem:** tell a concrete story showing why the current situation fails.
2. **Appetite:** ask the user for a fixed `Nh`, `Nd`, or `Nw` time box. Scope varies; safety and quality do not.
3. **Solution:** name the shaped elements and flows. Use breadboards or fat-marker sketches when useful. Include observable Acceptance Signals.
4. **Rabbit Holes:** identify appetite-threatening risks and the shaped patch, constraint, or open decision for each.
5. **No-Gos:** state what will not be built.

Grill the pitch before approval. It must be rough, solved, and bounded:

- **Rough:** communicates the approach without prescribing every implementation detail.
- **Solved:** macro elements connect and known rabbit holes are patched or explicitly escalated.
- **Bounded:** appetite and no-gos make the concept finite.

Record only stable IDs in frontmatter. Do not add status, progress, owner, completion flags, or checklists; `development_workflow` is the sole mutable authority. Ask the user to approve the pitch gate with `/dev-workflow approve pitch` only after the model has requested that transition.
