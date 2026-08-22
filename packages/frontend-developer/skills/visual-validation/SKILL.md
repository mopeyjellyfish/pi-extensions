---
name: visual-validation
description: Verify a frontend interface with available browser evidence and an explicit mismatch ledger.
---

# Visual validation

Discover the target repository's start command, routes, browser or screenshot
capability, accepted evidence, and command ownership. If browser capability is
absent, return an unmet proof result; do not claim visual acceptance or install
a browser runtime.

Name each route, desktop and mobile viewport, state, interaction, and reference
evidence before capture. Exercise relevant keyboard and focus paths,
reduced-motion behavior, console and runtime errors, and content overflow.
Compare hierarchy, composition, typography, color, spacing, states, and assets;
a similarity score is not a verdict.

Return a mismatch ledger with severity, evidence, likely cause, and recheck
target. Iterate on shared causes while new evidence shows progress; stop when
the ledger is resolved, evidence stops improving, or an unmet proof is named —
never use an arbitrary pass count. Clean up browser resources under the target
repository's command ownership.

When a material design board links a target-owned live site, verify that site
separately. Browser captures can provide image-backed board evidence when image
generation is unavailable; an unavailable board, browser, or site remains
unmet proof and never implies approval.

Load [`references/visual-checklist.md`](references/visual-checklist.md) before
capture to define the evidence matrix and mismatch ledger.
