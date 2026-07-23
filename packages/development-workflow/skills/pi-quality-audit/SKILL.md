---
name: pi-quality-audit
description: Audit software changes against repository-specific correctness, maintainability, security, operational, release, and verification evidence without arbitrary numeric gates.
---

# Pi Quality Audit

Read [references/audit.md](references/audit.md), the approved pitch/slices, repository guidance, and the actual diff.

Review evidence, not style preference:

1. intent and acceptance-signal compliance;
2. correctness, failure behavior, cancellation, and state restoration;
3. maintainability and package boundaries;
4. security, credentials, trust, and untrusted-input handling;
5. operations, compatibility, release metadata, and artifact hygiene;
6. focused, regression, and required repository checks.

Classify findings by consequence and cite the exact file/behavior. Clean Code metrics, function length, best-current-practice comparisons, and complexity are useful signals, not universal gates. Never invent a numeric quality score.

Prefer one fresh Sol high read-only reviewer via pi-subagents for the active slice and affected diff. Add another only for a distinct risk domain. If unavailable, audit sequentially and label the result reduced assurance. One Terra worker owns fixes. Rerun affected checks after every accepted fix and record only bounded claims/references in `development_workflow`. Follow the development workflow's model-routing reference for exact model, context, and escalation rules.
