# Evidence-based audit

Report findings before summaries. A finding includes severity, observable consequence, location, evidence, and the smallest correction.

Check repository truth first: nearest guidance, package manifest, public API, tests, runtime versions, and release rules. Then inspect:

- behavior that contradicts the pitch or slice outcome;
- change amplification, shallow modules, leaked design decisions, and avoidable error states;
- ambiguous or overly generic names that make domain contracts difficult to search;
- unbounded diagnostics, machine-consumed logs without stable fields, and errors missing received-versus-expected context;
- silent fallback, stale state, races, partial mutation, and unbounded output;
- missing cancellation or lifecycle cleanup;
- dependency, package, trust, credential, and remote-action boundaries;
- tests coupled only to private helpers rather than public chains;
- documentation that promises behavior the implementation does not provide.

Distinguish a blocker from a signal. Formatting, function size, duplication, named best practices, and any numeric score matter only when they expose concrete risk. They are not automatic rejection criteria. Apply the Boy Scout Rule only to small verified cleanup in touched code; do not reward scope expansion.

Use [the development philosophy](../../pi-development-workflow/references/philosophy.md) to interpret Single Responsibility as cohesion by reason for change, prefer deep modules and information hiding over tiny shallow functions, and assess agent operability without inventing token or quality thresholds.

If no findings remain, say so and list residual risks and checks not run. Never claim manual, provider, remote, or deployment verification without performing it.
