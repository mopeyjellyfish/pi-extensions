# Use cases

Use these patterns after you preserve exact technical content.

## Documentation

Classify explanations as descriptive text. Classify tutorials, how-to guides,
and procedures as procedural text. A document can contain both forms, but each
passage must have one clear purpose.

Keep headings direct. Put prerequisites before instructions. Put evidence beside
claims. Use the same term for the same component throughout the document.

## Pitches and plans

Write pitch narrative as descriptive text. State the problem, appetite, proposed
solution, fixed decisions, risks, exclusions, and measurable acceptance
criteria. Do not hide uncertainty with confident filler.

Write plan instructions as procedural text. Put work in execution order. Give
each item one observable outcome and an objective completion condition.

Preserve required headings, frontmatter, checkboxes, identifiers, and normative
contract words.

## Error messages and CLI output

State what failed. State the cause when it is known. End with the action that the
user can take.

Do not use jokes, apologies, or vague advice. Preserve quoted provider and system
errors exactly.

## Runbooks and procedures

Put prerequisites first. Use one command or action in each step. Put conditions
and warnings before the related action. State the expected result when the next
step depends on it.

## Incident reports

Use simple past for completed events. Give exact times, scope, impact, cause, and
recovery facts when they are known. Separate confirmed facts from open
questions.

## Commit messages and PR descriptions

Use the repository's required format. State the observable change before
implementation detail. Keep validation evidence specific. Do not change command
names, paths, issue references, or required templates.

## Agent instructions

Treat instructions for an agent as procedural text. Give one instruction in each
sentence. Put conditions before actions. State authority limits explicitly.
Preserve tool names and exact command syntax.

## User communication

Lead with the answer, result, or decision. Give only the context needed to act.
Ask one clear question for each unresolved decision. Keep normal conversation
natural when rigid technical style adds no value.

## Where not to force the style

Do not rewrite code, legal quotations, source quotations, logs, poetry, marketing
voice, or established interface terms. Do not shorten text when the shorter form
removes a safety condition, tradeoff, or technical boundary.
