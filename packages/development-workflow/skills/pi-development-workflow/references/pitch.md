# Shape the pitch

Turn a raw idea, missing capability, or defect into an agreed `specs/<change>/spec.md` through four shaping passes.

## 1. Set boundaries

Define the **Problem** before choosing the interface or implementation. A problem may be:

- behavior that fails or works differently from the intended outcome;
- friction, risk, cost, or a workaround in the status quo;
- a valuable **missing capability** that does not exist yet.

Use one specific story: who encounters the situation, what they try to achieve, what happens today, and why the gap matters. Include evidence of demand and separate the motivating outcome from a preferred solution.

Define **Appetite** as an **agent-effort envelope**. State how much breadth, novelty, integration, research, migration, and operational hardening the idea is worth. Identify cuttable scope and keep quality, safety, security, accessibility, and compatibility floors fixed. Before Pitch approval, record the ledger's **mandatory wall-clock backstop** as an `Nh`, `Nd`, or `Nw` duration. The backstop drives timer warnings and circuit commands; it is not the appetite itself.

## 2. Rough out the elements

Describe the macro **Solution**: affordances, system boundaries, data or control flows, and observable Acceptance Signals. Use a breadboard, state/sequence sketch, or fat-marker diagram when it clarifies the concept. Stay abstract enough to leave implementation discretion while concrete enough that an agent can derive integrated behavior.

## 3. De-risk the concept

List **Rabbit Holes** that could consume the effort envelope: technical unknowns, migrations, edge cases, policy decisions, integration traps, or accidental generality. Patch, constrain, spike, simplify, cut, or explicitly escalate each.

Declare **No-Gos**: adjacent features, platforms, use cases, refactors, or generalized solutions that are intentionally excluded.

## 4. Write and grill the pitch

Use exactly five sections:

1. **Problem**
2. **Appetite**
3. **Solution**, with observable **Acceptance Signals**
4. **Rabbit Holes**
5. **No-Gos**

Grill the draft with `pi-design-grill`. Prefer Question-tool batches of 2–4 independent decisions, offer recommended answers when evidence supports them, and resolve dependent branches in order.

The pitch is ready for explicit user agreement only when it is rough, solved, and bounded:

- **Rough:** communicates the approach without prescribing every implementation detail.
- **Solved:** macro elements connect and known rabbit holes are patched or explicitly escalated.
- **Bounded:** the effort appetite, cuttable scope, and no-gos make the concept finite.
- **Buildable:** an implementing agent can derive the first demonstrable vertical slice without inventing product behavior.

Record only stable IDs in frontmatter. Do not add status, progress, owner, completion flags, or checklists; `development_workflow` is the sole mutable authority. After the user agrees with the pitch and the model requests the transition, ask the user to approve it with `/dev-workflow approve pitch`.

Shape Up references: [principles](https://basecamp.com/shapeup/1.1-chapter-02), [set boundaries](https://basecamp.com/shapeup/1.2-chapter-03), [find the elements](https://basecamp.com/shapeup/1.3-chapter-04), [risks and rabbit holes](https://basecamp.com/shapeup/1.4-chapter-05), and [write the pitch](https://basecamp.com/shapeup/1.5-chapter-06).
