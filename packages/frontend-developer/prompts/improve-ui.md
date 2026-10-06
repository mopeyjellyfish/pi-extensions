---
description: Inspect an app surface, research competitors, iterate on a design board, and choose Shape and plan or direct planning.
argument-hint: "<app surface and user task> [constraints or references]"
---

Improve the named app surface through visual review and human selection, then
planning. Do not implement the app or expand into a product-wide redesign.
Marketing sites are outside this workflow.

Load the named installed skills and follow their contracts in this order:

1. **View the current UI.** Read target repository instructions and inspect the
   named surface and user task. Use `frontend-design` to classify scope without
   implementation or a routing loop. Use `visual-validation` to capture and
   inspect current UI images and record evidence limits.
2. **Research competitors.** Use `interface-research` to compare the same task
   across competitors in the app space, adjacent products, and platform conventions.
3. **Find UX/UI improvements.** Combine current UI and research evidence with
   read-only `interface-craft` **critique** and **audit**, then `interface-design`
   for original visual directions. Use `react-best-practices` only for React,
   `react-native-skills` only for React Native or Expo, and
   `react-view-transitions` only for applicable React view-transition work.
   Defer all source edits and implementation loops.
4. **Combine into a design board.** Inspect proposed direction images themselves.
   Present image-backed directions with `design_board` using `interface-design`'s
   board contract. Verify the board is reachable and share its URL before feedback.
5. **Iterate with the human.** Collect selection and notes through `question`.
   If feedback is ambiguous, ask direct, decision-changing follow-up questions
   through `question` rather than guess. Revise the directions, inspect revised
   images, update and verify the board, and request feedback again. Continue until
   the user explicitly selects a direction or stops. Silence or cancellation is
   not selection.
6. **Choose the delivery route.** After explicit visual selection, use `question`
   in the terminal to offer **Shape and plan** or **Plan directly**. Cancellation
   or silence starts neither route. Create one self-contained handoff with the
   accepted direction, inspected image evidence, user notes, current-state and
   research evidence, constraints, accessibility and responsive requirements,
   unmet proof, and selected operation context.
   - **Shape and plan** resolves `shape` by its installed name and passes that
     handoff without repeating visual selection. Shape synthesizes the pitch and
     seeks approval, then invokes `planning-changes` with accepted intent.
   - **Plan directly** passes the same handoff to `planning-changes` for
     already-settled intent. That skill owns the complete delivery plan and its
     separate approval.

Visual selection and route choice do not approve a pitch or plan or authorize
implementation. Browser and design-board controls never authorize Shape,
planning, implementation, tracker mutation, or publication.

Use only available capabilities. Report unavailable skills, tools, and visual
proof honestly, without claiming they ran or installing replacements. If
`question` is unavailable, ask directly in conversation and state the limitation.
Without inspectable images or a verified board, keep the visual gate incomplete.
If the chosen `shape` or `planning-changes` capability is unavailable, return the
complete selected design handoff and name that unmet capability. Do not claim
that the transition ran or substitute another route. If planning is unavailable
after pitch approval, include the accepted pitch in the returned handoff.

Requested surface and task:

$ARGUMENTS
