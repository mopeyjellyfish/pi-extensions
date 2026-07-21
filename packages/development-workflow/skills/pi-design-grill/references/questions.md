# Design-grill question bank

Select the smallest relevant set, respect decision dependencies, and ask independent questions in batches of 2–4. For each structured question, offer concrete options and mark a recommended answer when repository evidence supports one.

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

Treat appetite primarily as an **agent effort** decision, not a duration estimate.

- How much implementation breadth, novelty, and cross-boundary coordination is this idea worth?
- How much research, prototyping, migration, or operational hardening is justified?
- Which unknowns are acceptable inside the effort envelope, and which require shaping first?
- What is the smallest valuable version an agent could deliver as an integrated slice?
- Which scope may be cut while preserving the core value?
- Which safety, quality, security, accessibility, and compatibility floors are fixed?
- What mandatory wall-clock backstop should guard the build without confusing timer duration for the appetite itself?

## Solution elements and flows

- What are the macro elements, affordances, boundaries, and data flows?
- How does a user enter, move through, recover from, and complete the core flow?
- Which existing system seams or conventions should the solution reuse?
- What must be true across UI, API, persistence, process, and operational boundaries?
- Can a breadboard, sequence, state sketch, or fat-marker diagram remove ambiguity without prescribing implementation?
- Where is the solution too vague to hand to an implementing agent?
- Where is it over-specified and stealing implementation discretion?

## Constraints and decision dependencies

- Which decision must be resolved before later questions become meaningful?
- Which decisions are independent enough to ask in the same Question-tool batch?
- Who has authority over product behavior, compatibility, security, data, or rollout choices?
- What repository, platform, provider, or release constraints shape the answer?
- Which assumption would invalidate the most downstream work if wrong?

## Rabbit holes and no-gos

- Which technical unknown, edge case, migration, dependency, or policy choice could consume the agent effort appetite?
- What narrow patch, constraint, proof, or spike contains each risk?
- Which requirement should be simplified or cut rather than solved generally?
- Which tempting adjacent feature, cleanup, platform, or use case is explicitly excluded?
- What could make a vertical slice look complete while leaving the real integration unproven?

## Pitch readiness

- Does one specific story make the problem or missing capability understandable?
- Can the solution be judged against that problem rather than taste?
- Is the approach rough enough to leave room, solved enough to build, and bounded enough to finish?
- Can an agent derive the first demonstrable vertical slice without inventing product decisions?
- Are unresolved decisions explicit, owned by the user, and blocked from accidental approval?

End each batch with resolved decisions, changed assumptions, and remaining blockers. End the grill with a compact pitch-readiness summary, not a numeric score.

Method influences: Basecamp's [Shape Up shaping chapters](https://basecamp.com/shapeup/1.1-chapter-02) and Matt Pocock's [grilling skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md).
