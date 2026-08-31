# Type safety

## Decision

Find type escapes that can turn untrusted or uncertain values into false facts:
`any`, unchecked assertions, non-null claims, unsafe casts, and declarations
that promise more than runtime code proves. Prefer a parser, guard,
discriminated union, or accurate signature. Treat typed linting as an executable
backstop, not a substitute for this design review.

## Procedure

Inspect the installed version and selected typescript-eslint presets before
assuming membership changes over time. Useful typed rule families include
`no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, and
`no-unsafe-return`; promise rules include `no-floating-promises` and
`no-misused-promises`; model checks include `no-unnecessary-condition`,
`no-unnecessary-type-assertion`, and `switch-exhaustiveness-check`.

## Failure modes

Do not freeze a preset list or report a rule that the repository does not
install. A cast after parsing, an `any` flowing through a public return, or an
optional field used as required can break at runtime despite green lint. Avoid
reporting tool output verbatim: state the path, consequence, and safer boundary
or model. Conversely, do not demand guards for values already trusted by a
well-defined internal contract.
