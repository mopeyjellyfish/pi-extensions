# Evidence-based audit

Report findings before summaries. A finding includes severity, observable consequence, location, evidence, and the smallest correction.

Check repository truth first: nearest guidance, package manifest, public API, tests, runtime versions, and release rules. Then inspect:

- behavior that contradicts the pitch or slice outcome;
- silent fallback, stale state, races, partial mutation, and unbounded output;
- missing cancellation or lifecycle cleanup;
- dependency, package, trust, credential, and remote-action boundaries;
- tests coupled only to private helpers rather than public chains;
- documentation that promises behavior the implementation does not provide.

Distinguish a blocker from a signal. Formatting, function size, duplication, and named best practices matter when they create concrete risk. They are not automatic rejection criteria.

If no findings remain, say so and list residual risks and checks not run. Never claim manual, provider, remote, or deployment verification without performing it.
