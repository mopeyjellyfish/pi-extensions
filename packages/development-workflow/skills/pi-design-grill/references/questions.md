# Design-grill question bank

Select the smallest relevant set, respect decision dependencies, and ask independent questions in batches of 2–4. For each structured question, offer concrete options and mark a recommended answer when repository evidence supports one.

## Research basis

Complete this pass before asking the user product questions.

- Which repository instructions govern the change?
- What do the current code paths, public contracts, tests, types, configuration, history, and prior decisions establish?
- Can the current behavior be reproduced or observed at a narrower public seam?
- Which facts remain material and unanswerable from repository truth?
- Which bounded primary-source prior-art pass was performed by default? If it was not applicable, why can external precedent not affect the pitch? If unavailable, what was attempted, what limitation occurred, and what uncertainty remains?
- Does the evidence support adopting, extending, composing, building, or retaining the current route?
- What did each finding confirm or change in the pitch?
- Is every durable research artifact decision-focused, linked from the pitch, and small enough to avoid carrying raw transcripts forward?

## Problem and demand

A problem is not limited to something broken. It can be behavior that does not work as intended, an inefficient or risky status quo, or a missing capability that does not exist yet.

- Who needs this, and in what specific story or situation?
- Is the motivating gap a failure, friction, risk, workaround, or missing capability?
- What happens today, including when the desired behavior does not exist yet?
- Why is the status quo worth changing for these users now?
- What evidence, observed workaround, request pattern, or strategic need demonstrates demand?
- What solution has already been smuggled into the problem statement, and what underlying outcome does it serve?
- Which users or situations are explicitly not motivating this work?

## Outcome and acceptance

- What observable outcome would make the user say the problem is solved?
- What changes for the user, operator, or dependent system?
- Which examples distinguish correct behavior from a superficially plausible result?
- Which failure modes, empty states, permissions, or recovery paths are part of the outcome?
- What must remain unchanged for compatibility or trust?

## Appetite

Keep the Shape Up name, but treat appetite as a qualitative **agent-investment** decision—not a calendar estimate, token budget, or generic small/medium/large label.

- What repository, package, subsystem, contract, and domain context must the agent understand?
- How deep is the change: which behavior, state, integration, migration, compatibility, or operational boundaries must it cross?
- Which unknowns or bounded spikes may the agent resolve autonomously, and which discoveries require reshaping?
- What decisive examples, test matrices, environments, migrations, security checks, or external acceptance create the validation burden?
- What review independence, observability, rollback, documentation, and hardening define adequate assurance?
- What is the smallest valuable integrated outcome, which breadth is optional, and what should be cut first?
- Which discoveries or boundary expansions are explicit stop conditions?
- Which correctness, safety, security, accessibility, compatibility, maintainability, and verification floors are fixed?
- What separate wall-clock backstop should detect stale work without pretending to measure agent effort?

## Solution elements and flows

- Which product outcomes, behavioral rules, and architectural boundaries are fixed?
- Which local implementation decisions may the agent make without returning to the user?
- What existing seams and conventions should be reused?
- What are the macro elements, affordances, boundaries, and data flows?
- How does a user enter, move through, recover from, and complete the core flow?
- Which existing system seams or conventions should the solution reuse?
- What must be true across UI, API, persistence, process, and operational boundaries?
- Can a breadboard, sequence, state sketch, or fat-marker diagram remove ambiguity without prescribing implementation?
- Where is the solution too vague to hand to an implementing agent?
- Where is it over-specified and stealing implementation discretion?

## Simplicity and blocker calibration

- Does this behavior need to exist, or is the need speculative?
- Which existing repository helper, type, contract, or pattern already solves part of it?
- Can the standard library, native platform, database constraint, or an installed dependency replace custom code?
- Which abstraction has one implementation, configuration has one value, wrapper hides nothing, or file exists only “for later”?
- What can be deleted, merged, or kept local without weakening an acceptance signal or fixed floor?
- Which complexity is genuinely required by correctness, security, accessibility, compatibility, data-loss prevention, or explicitly accepted behavior?
- Is a claimed blocker truly preventing safe progress, or is it a recoverable failure, implementation detail, uncertainty, or ordinary complexity? What is the smallest user-owned decision actually needed?

## Constraints and decision dependencies

- Which decision must be resolved before later questions become meaningful?
- Which decisions are independent enough to ask in the same Question-tool batch?
- Who has authority over product behavior, compatibility, security, data, or rollout choices?
- What repository, platform, provider, or release constraints shape the answer?
- Which assumption would invalidate the most downstream work if wrong?

## Rabbit holes and no-gos

- Which technical unknown, edge case, migration, dependency, or policy choice could consume the agent investment?
- What evidence makes each risk credible, and what would its failure look like?
- What narrow patch, constraint, proof, spike, cut, or escalation contains each risk?
- What observable tripwire must stop execution and return the pitch for reshaping?
- Which requirement should be simplified or cut rather than solved generally?
- Which tempting adjacent feature, cleanup, platform, or generalized solution is explicitly excluded?
- Which investment dimension does each exclusion protect, and what future evidence could justify reconsidering it?
- What could make a vertical slice look complete while leaving the real integration unproven?

## Pitch readiness

- Does one specific story make the problem or missing capability understandable?
- Can the solution be judged against that problem rather than taste?
- Is the approach rough enough to leave room, solved enough to build, and bounded enough to finish?
- Can an agent derive the first demonstrable vertical slice without inventing product decisions?
- Are unresolved decisions explicit, owned by the user, and blocked from accidental approval?

End each batch with resolved decisions, changed assumptions, and remaining blockers. End the grill with a compact pitch-readiness summary, not a numeric score.

Method influences: Basecamp's [Shape Up shaping chapters](https://basecamp.com/shapeup/1.1-chapter-02), Matt Pocock's [grilling skill](https://github.com/mattpocock/skills/blob/d574778f94cf620fcc8ce741584093bc650a61d3/skills/productivity/grilling/SKILL.md), the MIT-licensed [Karpathy Guidelines](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md), and [Ponytail's minimum-solution ladder](https://github.com/DietrichGebert/ponytail).
