---
name: image-generation
description: Generate or edit a GPT Image 2 mock-up artifact when compatible credentials are available.
---

# Image generation

Use `image_generation` only for a useful mock-up artifact, with a bounded prompt
and explicit output path. The tool uses existing `openai-codex` subscription OAuth resolved by Pi.
Platform API keys are not supported; use Pi `/login` for `openai-codex`.
The tool automatically finds a compatible Codex registry model with usable OAuth.
The conversation can use another provider or have no selected model. Image
configuration is optional. Trusted `.pi/image-generation.json` takes precedence
over `~/.pi/agent/image-generation.json`. Explicit configuration never falls back
to automatic selection. Fix or remove invalid configuration at the reported path.
Before the first provider request in a pass, state its explicit bound and use
Pi's `question` tool when available to obtain explicit consent for privacy
exposure and subscription quota use. Use one concise conversational fallback only when
the tool is unavailable. Consent authorizes only the stated pass. A cancellation
or decline is not consent: make no request. Further provider work, including
refinement, requires a new bound and consent.

If compatible OAuth is unavailable or explicit configuration fails, make no request:
report the tool's login or configuration guidance and continue with normal UI design, supplied
mock-ups, or other design evidence without claiming generated evidence. Inspect
the saved artifact's format and requested dimensions before using it in
`frontend-design`; pixels remain evidence, not product behavior.

For material design review, each generated artifact is image-backed direction
evidence for `design_board`; inspect it before presentation. If generation is
unavailable, declined, or fails, continue normal UI design without claiming
generated evidence.

The versioned Codex native transport produces PNG only. Reference edits accept
PNG, JPEG, and WebP inputs; masks and other output formats are unsupported.
Size defaults to `auto`; valid exact dimensions are forwarded unchanged and
checked before saving, but live custom-size backend acceptance is unverified.
There is no Platform fallback or automatic request retry.
