# Pi 1.0 feature adoption delivery plan

Status: Accepted

## Intent

Update the private Pi profile and the affected extension packages to use Pi 1.0 contracts where they improve behavior. Preserve the current GPT Image feature set. Deliver all changes on `feat/pi-1-feature-adoption` in one pull request.

## Accepted decisions

- Keep the six packaged subagent roles as the deployment baseline.
- Disable only `pi-subagents` built-in roles. Continue to allow additional user agents.
- Add a non-mutating profile doctor and versioned settings examples. Do not write to a user's settings from repository code.
- Change Simple English from full prompt replacement to a named structured prompt section.
- Make Question available to the model without adding it to the codemode callable surface.
- Add structured tool results and truthful annotations where they provide a stable contract.
- Keep low-frequency tools directly available until a benchmark proves that changing their exposure improves the profile.
- Keep the extension's GPT Image transport. Pi 1.0 image generation cannot preserve masks, exact sizes, and output formats. Put the transport behind an internal runtime interface so later providers can be added without changing the public tool.
- Keep `gpt-image-2` as the default image model. Add an optional configured image model ID so compatible later GPT Image models do not require a code change.
- Do not add virtual models, classifier routing, `context_with_system`, or a local MCP server without a concrete use case.

## Delivery boundaries

### In scope

- Root private-profile examples, diagnostics, tests, and documentation.
- `simple-english` prompt integration and tests.
- Question exposure metadata and tests.
- Stable `outputSchema` and `structuredContent` contracts for data-oriented tools where the existing result already has a stable data shape.
- Truthful MCP-style annotations for affected tools.
- Frontend Developer image-runtime extraction, configured image model selection, tests, and README changes.
- Source smoke, package checks, deterministic profile load, and manual reload acceptance.

### Out of scope

- Automatic mutation of `~/.pi/agent/settings.json` or other user files.
- Removal of user-defined subagents.
- Replacement of the GPT Image transport with Pi's current image runtime.
- New image providers before there is an authenticated user need and verified provider contract.
- Changing tool exposure only to reduce prompt size without measurements.
- Changes to external packages such as `pi-subagents` or `pi-mcp-adapter`.

## Package and interface contracts

### Private root profile

Add versioned example fragments for the intended settings. The subagent settings must include:

- `disableBuiltins: true`
- compact tool descriptions
- foreground execution by default
- bounded nesting and parallelism
- scheduled runs disabled

The example must not restrict additional user agents. Add an opt-in doctor command that validates a supplied or default user configuration without changing it. The doctor must distinguish required failures from optional recommendations. It must report actionable JSON paths.

### Simple English

Contribute a named section through `event.systemPromptOptions.sections`. Preserve the host prompt and other extension sections. Repeated lifecycle events must not accumulate duplicate content.

### Tool contracts

Use `exposure: "model-only"` for Question. Add annotations only where the statement is true for every action of that tool. Add `outputSchema` only when every successful execution can return matching `structuredContent`; keep human-readable text content for compatibility.

Initial structured-result targets:

- Todo: action, resulting items, and affected item identifiers where applicable.
- Web Search: answer and normalized source data.
- Worktrunk: action result and stable routing or worktree data already returned in details.

Do not force unstable UI state into schemas. Design Board, Playwright, and Question can receive annotations or exposure metadata without a structured result if their result shape is intentionally conversational or action-specific.

### Frontend Developer image runtime

Define one internal runtime boundary for image requests and outputs. Keep OpenAI GPT Image as the first implementation. Preserve:

- generation and edit operations
- reference images
- edit masks
- exact supported sizes
- requested PNG, JPEG, or WebP output
- request cancellation
- bounded error rendering
- authenticated requests through Pi's model registry
- output-path and MIME validation

Extend trusted project configuration with an optional image model ID. Default to `gpt-image-2`. Do not infer or hard-code an unverified future model ID.

## Execution slices

### Slice 1: Private profile contract

1. Add failing tests for settings validation, built-in-role disabling, optional user agents, malformed JSON, and actionable diagnostics.
2. Add the profile doctor and example settings.
3. Add the root command and concise setup documentation.
4. Run the focused tooling test.

Proof: the doctor passes against the versioned example, rejects a fixture with built-ins enabled, and ignores extra user-agent definitions.

### Slice 2: Prompt and tool metadata

1. Add failing Simple English tests that prove the existing prompt and another named section survive.
2. Implement the named structured section.
3. Add registration tests for Question exposure and truthful annotations.
4. Add stable output schemas and structured content for Todo, Web Search, and Worktrunk with package-focused tests.
5. Run each affected workspace test.

Proof: registered metadata matches the intended Pi 1.0 contract, and successful tool calls return schema-valid structured content plus existing readable text.

### Slice 3: Image runtime seam

1. Add failing tests for the runtime boundary, default `gpt-image-2`, configured image model selection, masks, sizes, formats, cancellation, and bounded provider failures.
2. Extract the current transport behind the internal runtime interface without changing the public tool schema.
3. Add optional trusted configuration for the image model ID.
4. Update the package README.
5. Run the Frontend Developer package tests.

Proof: existing GPT Image behavior remains green, and tests show that a configured compatible model ID reaches the request body.

### Slice 4: Integrated verification and acceptance

1. Run formatting and focused tests after the final edit.
2. Run `npm run smoke:source`.
3. Run `npm run check`.
4. Start deterministic Pi from the task worktree with ambient resources disabled.
5. Verify the intended profile resources load once.
6. Run the profile doctor against the current user's settings and report drift without modifying it.
7. While Pi is idle, run `/reload` and exercise Simple English prompt composition, Question availability, one structured-result tool, and image tool registration.
8. Confirm no duplicate registrations or stale lifecycle state.

Proof: commands and manual acceptance evidence refer to the final tree and current worktree.

## Review and repair

Freeze the final diff after integrated checks. Run one fresh-context Astra high Reviewer pass against this plan, repository instructions, Pi 1.0 contracts, and the fixed diff. If executable acceptance needs independent diagnosis, run QA concurrently on the same boundary. Join findings into one repair packet. Use the retained implementation writer for repairs, rerun affected checks, inspect the final diff, and repeat fixed-boundary review only if material behavior changed.

## Commit and pull request plan

Use narrow Conventional Commits on the single task branch. Expected units:

1. `feat(profile): add Pi 1 settings doctor`
2. `feat(pi-simple-english): compose a structured prompt section`
3. `feat: add Pi 1 tool result contracts`
4. `refactor(pi-frontend-developer): add image runtime boundary`
5. `docs: document Pi 1 profile adoption`

Combine or split units only when the final diff gives a clearer atomic history. Push only `feat/pi-1-feature-adoption`. Open one pull request against the verified base branch.

## Risks and controls

- **Structured output drift:** validate every successful result against its declared schema in tests.
- **Prompt duplication:** test repeated lifecycle events and named-section replacement semantics.
- **User-agent removal:** validate only built-in-role disabling; never require an exact total agent count.
- **Image behavior regression:** keep transport behavior tests at the public tool boundary before and after extraction.
- **Credential leakage:** use model-registry authentication, mocked network tests, and bounded error text.
- **Profile-specific coupling:** keep profile diagnostics at the private repository root, not in a production extension package.
- **Pi API mismatch:** compile and run smoke tests against the repository's pinned Pi dependency after dependency setup.

## Approval gate

Implementation starts only after this plan is accepted. Approval covers all slices, commits, final review, push, and one pull request. Any new production behavior outside these boundaries requires another decision.
