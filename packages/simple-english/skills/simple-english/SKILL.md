---
name: simple-english
description: >-
  Write or revise documentation and human communication with pragmatic
  ASD-STE100 Simplified Technical English. Use for pitches, plans, READMEs,
  runbooks, procedures, error messages, release notes, incident reports, API
  guides, agent instructions, PR text, or requests for clear, unambiguous,
  readable, translation-friendly, or non-native-reader-friendly English.
---

# Simple English

Write clear technical English that a reader can understand in one pass. Apply
practical ASD-STE100 principles without removing necessary technical terms.

## Modes

Use **Pragmatic** mode by default. Keep established domain words, product names,
and exact technical contracts.

Use **Strict** mode only when the user explicitly requests ASD-STE100 or STE
compliance. Explain that full compliance requires the official standard and
official dictionary. This skill cannot certify compliance.

## Protect exact content

Do not rewrite these items:

- code blocks and inline code;
- identifiers, commands, flags, paths, and URLs;
- product names, API names, configuration keys, and protocol terms;
- quoted errors, log lines, source quotations, and citations;
- required headings, frontmatter fields, checkbox syntax, and normative contract
  words.

If clear prose conflicts with technical accuracy, keep the accurate text.

## Workflow

1. Identify the audience and the action or knowledge that they need.
2. Classify each passage as procedural or descriptive.
3. Select one term for each important concept.
4. Draft or revise the text with the rules below.
5. Run the checklist in `references/checklist.md`.
6. Return the revised text without a style lecture unless the user requests one.

## Shared rules

- Use one word for one meaning in the same document.
- Use common, concrete words when they are accurate.
- Define an uncommon technical term at its first useful occurrence.
- Use active voice when the actor matters.
- Use simple present, simple past, or simple future when possible.
- Do not use contractions in formal technical documents.
- Remove filler, decorative transitions, repeated conclusions, and unsupported
  claims.
- Replace vague pronouns when more than one noun can be the reference.
- Keep parallel items in the same grammatical form.
- Use a vertical list when a sentence contains several conditions or items.
- Do not use a semicolon. Use two sentences or a list.

## Procedural text

Procedural text tells the reader what to do. Plans, runbooks, and task steps are
usually procedural.

- Use an imperative verb for an instruction.
- Put a condition before the instruction: "If the test fails, stop the release."
- Put one instruction in each sentence.
- Keep each sentence at 20 words or fewer when practical.
- Put a warning before the action that creates the risk.
- State the expected result when the result is not obvious.
- Keep necessary steps in execution order.

## Descriptive text

Descriptive text explains a problem, system, decision, or result. Pitches,
architecture notes, and reports are usually descriptive.

- State one new fact in each sentence.
- Keep each sentence at 25 words or fewer when practical.
- Keep one topic in each paragraph.
- Keep each paragraph at six sentences or fewer.
- State the actor, behavior, boundary, and effect when they are material.
- Put evidence next to the claim that it supports.

## Pitches and plans

For a feature pitch, treat the narrative as descriptive text. Keep decisions,
constraints, risks, evidence, and acceptance criteria specific and measurable.

For a feature plan, treat instructions as procedural text. Keep supporting
context descriptive. Start each plan item with an observable outcome, then state
the minimum implementation and verification work.

Do not simplify away uncertainty, tradeoffs, safety boundaries, or acceptance
criteria. Clarity must preserve meaning.

## Human communication

Apply Pragmatic mode to issue text, pull request text, review comments, status
updates, and user-facing explanations when clarity is important.

Lead with the result or decision. State the reason next. End with the required
action or unresolved question. Do not make a short conversational reply formal
or mechanical when plain wording is already clear.

See `references/use-cases.md` for focused patterns.

## Check mode

When the user asks for a review, report only material clarity problems. For each
problem, show:

1. the original text;
2. the applicable rule from this skill;
3. a clear rewrite.

Do not report a protected technical token as a prose violation.

## Final check

Before delivery, confirm these facts:

- The meaning and technical contracts did not change.
- Each passage has the correct procedural or descriptive form.
- Important concepts use consistent terms.
- Conditions occur before instructions.
- Long sentences and paragraphs are split where practical.
- Protected content is unchanged.

For a detailed pass, use `references/checklist.md`.
