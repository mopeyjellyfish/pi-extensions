# Debugging loop and evidence

## Phase 1 — Build a feedback loop

Invest heavily in one tight, deterministic, **red-capable** signal for the exact reported bug. Run it before theorizing.

Prefer, in order of fit:

- a failing unit, integration, or end-to-end behavior test;
- a curl/HTTP, CLI, or fixture script with a precise assertion;
- a headless-browser check of DOM, console, or network behavior;
- replay of a captured request, event, or trace;
- a throwaway harness around the smallest real subsystem;
- a seeded property/fuzz loop, automated bisection, or old/new differential check;
- a structured human-in-the-loop script only when automation is genuinely unavailable.

Tighten speed, specificity, and determinism. For intermittent bugs, raise the reproduction rate with repetition, controlled stress, or narrowed timing. If no loop can be built, list what was tried and ask for the missing access or evidence.

## Phase 2 — Reproduce and minimise

Run the loop and capture the exact symptom the user described. Confirm it repeats reliably enough to diagnose. Remove inputs, callers, configuration, data, and steps **one variable at a time**, rerunning after every cut.

Stop minimising when every remaining element is load-bearing: removing any one makes the loop green. Preserve both the original scenario and the minimal reproducer.

## Phase 3 — Rank falsifiable hypotheses

Generate **3–5 ranked hypotheses** before testing the first plausible idea. For each, write a discriminating prediction:

> If this is the cause, changing or observing X should produce Y; otherwise this hypothesis loses support.

Reject hypotheses that cannot be falsified. Show the ranked set to the user when domain knowledge could cheaply re-order or eliminate candidates, but do not block unattended diagnosis.

## Phase 4 — Instrument discriminating boundaries

Map every probe to a Phase 3 prediction and change **one variable at a time**.

1. Prefer a debugger, REPL, trace, or existing diagnostic surface.
2. Add only targeted logs at boundaries that distinguish hypotheses.
3. Prefix temporary logs uniquely, such as `[DEBUG-a4f2]`, so removal is searchable.
4. Never log everything and grep for a story afterward.

For performance regressions, first capture a repeatable baseline. Prefer profiling, timing harnesses, query plans, resource counters, and version/data bisection over ordinary logs.

## Phase 5 — Fix and prove at the correct seam

A correct regression seam exercises the real bug pattern and causal chain. A shallow test that cannot reproduce that chain is false confidence.

1. Turn the minimal reproducer into a failing regression test at the correct seam.
2. Observe RED for the intended reason.
3. Apply the smallest fix to the proven root cause.
4. Observe GREEN.
5. Rerun the original, un-minimised Phase 1 loop.
6. Run focused and relevant regression verification, then remove temporary instrumentation.

If no correct seam exists, record that as an architectural limitation and provide the strongest deterministic verification available.

## Ledger evidence

Record a compact chain:

- original and minimal reproduction commands/inputs;
- exact observed symptom and impact;
- ranked hypotheses and discriminating predictions;
- probes and the observation that proves root cause;
- regression test name and RED evidence;
- fix and GREEN evidence;
- original-loop, focused, and regression verification;
- review result and residual risk.

Do not paste raw unbounded logs into the workflow ledger. Store safe paths or bounded summaries, and redact credentials and personal data.

If the defect changes the pitch materially, rewind to Pitch rather than smuggling product scope into a bug fix. If it reveals work inside the active slice, add that discovered work to Todo. If the effort envelope is exhausted before the timer, stop and ask the user to cut scope, finish useful verified scope through normal Build approval, rewind, or abandon. Use circuit commands only after the wall-clock backstop expires.

Method influence: Matt Pocock's [diagnosing-bugs skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md), adapted to this repository's RED/GREEN ledger and review gates. Its optional cleanup/post-mortem phase is not required here.
