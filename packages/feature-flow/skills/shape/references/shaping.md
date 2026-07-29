# Shaping and acceptance

## Research before questions

Read repository truth first: applicable instructions, manifests, product and
architecture documentation, current code and tests, history, and nearby prior
art. Let those sources answer factual questions instead of asking the user to
repeat them.

Research external prior art only when a current unknown can materially change
the pitch. Prefer primary sources such as official specifications,
documentation, standards, and original research. Keep a source only with the
conclusion it supports and the implication for this feature; discard search
transcripts and irrelevant evidence.

Ask unresolved decisions in adaptive batches, normally up to four related
questions. Each question includes a recommendation, material tradeoffs, and a
concrete example when useful. Continue repository or external research between
batches when an answer exposes a new unknown. Stop when no unresolved answer can
materially change the pitch. Express appetite qualitatively through scope
control, quality floors, acceptable cuts, and stop/reshape conditions rather
than invented time estimates.

## Show uncertain interactions

When visual or interaction uncertainty is material, use the target
application's existing development path or the smallest useful prototype. Give
the user a URL and ask decisions against the running artifact. Create
`prototypes/` or `assets/` only for source or evidence that is actually used;
never create empty directories or retain generated dependencies, build output,
or throwaway captures.

Use Mermaid in `pitch.md` for useful flows, states, sequences, architecture, or
boundaries. Linked prototypes, images, and source are illustrative evidence.
Embed every exact normative API, schema, protocol, behavior, and constraint in
the pitch so the accepted document is self-contained.

## Write the complete pitch

Use the pitch template as a starting shape, not a fixed-heading ceiling. Add,
remove, split, rename, or reorder headings to communicate the feature clearly.
Cover the following when material:

- the motivating outcome, repository evidence, and why it matters;
- qualitative appetite, quality floors, scope cuts, and reshape conditions;
- decision-relevant research and primary-source implications;
- alternatives considered and why the recommendation wins;
- user experience, system/data behavior, Mermaid diagrams, and normative
  contracts;
- accessibility, security, privacy, compatibility, migration, operational, and
  dependency boundaries;
- non-negotiables, agent discretion, contained rabbit holes, and no-gos;
- observable acceptance criteria; and
- the local banking policy and the separate authorization boundaries for
  remote, destructive, publication, deployment, or cleanup actions.

Do not pad immaterial sections. Do not omit material cross-functional behavior
because the template lacks a heading.

## Review once, approve once

After all material decisions are resolved, send the complete draft to a
separate read-only reviewer. The reviewer challenges value, evidence,
completeness, feasibility, simplicity, contradictions, accessibility, security,
privacy, compatibility, boundaries, and unresolved risks. The sole writer fixes
routine findings and requests read-only re-review until blocker-free; routine
review/fix/re-review creates no extra human gate. A finding that changes a
material decision returns to the shaping questions.

Only after blocker-free review, run `validate-pitch <feature>` and retain its
`prospective_sha256`, then ask exactly one stable whole-pitch approval question
for that acceptance attempt using the current question-tool contract. The
question must attach the exact current `pitch.md` document bytes as Markdown,
offer explicit `accept` and `revise` options, and never split approval across
sections or substitute a summary or link.

If the result redirects for clarification, follow the current continuation
contract: address the clarification and re-present the semantically unchanged
whole-pitch question with stable question and option IDs. If that discussion
changes any pitch byte or material decision, return to shaping, blocker-free
review, and fresh prospective validation instead. A revision also returns to
shaping. Only an explicit `accept` result authorizes
`accept <feature> <prospective-sha256>`, using the hash retained for the exact
document that was shown. Immediately run `verify <feature>` after acceptance.
Product quality, research synthesis, materiality, and the approval decision
remain with the parent, reviewer, and user—not the helper.

## Material change after acceptance

Stop planning or Build when a discovery changes accepted intent. Run `verify`
first, then `repitch <feature>`. The helper preserves the accepted bytes and
used plans under their numbered archive paths, advances the pitch number,
creates a complete draft from the prior decisions, clears current slice state,
and leaves code and commits untouched. Incorporate the proposed change, ask
only newly material questions, then repeat complete review and whole-pitch
acceptance. Never edit the accepted file in place.
