---
description: Inspect an app surface, research competitors, iterate on a design board, and hand the selected direction to planning.
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
6. **Hand off to planning.** After explicit visual selection, pass the accepted
   direction, evidence, feedback, constraints, and unmet proof to
   `planning-changes`. That skill owns the complete implementation plan and its
   approval. Visual selection and this prompt do not authorize implementation.

Use only available capabilities. Report unavailable skills, tools, and visual
proof honestly, without claiming they ran or installing replacements. If
`question` is unavailable, ask directly in conversation and state the limitation.
Without inspectable images or a verified board, keep the visual gate incomplete.
If `planning-changes` is unavailable, return the selected design context and the
unmet planning handoff, not a substitute plan.

Requested surface and task:

$ARGUMENTS
