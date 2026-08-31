---
name: image-generation
description: Generate or edit a GPT Image 2 mock-up artifact when compatible credentials are available.
---

# Image generation

Use `image_generation` only for a useful mock-up artifact, with a bounded prompt
and explicit output path. The tool uses a separately billed OpenAI Platform API
credential resolved by Pi. A ChatGPT or Codex subscription is not sufficient.
Before the first provider request in a pass, state its explicit bound and use
Pi's `question` tool when available to obtain explicit consent for privacy
exposure and separate billing. Use one concise conversational fallback only when
the tool is unavailable. Consent authorizes only the stated pass. A cancellation
or decline is not consent: make no request. Further provider work, including
refinement, requires a new bound and consent.

If compatible credentials or trusted configuration are absent, make no request:
report the credential requirement and continue with normal UI design, supplied
mock-ups, or other design evidence without claiming generated evidence. Inspect
the saved artifact's format and requested dimensions before using it in
`frontend-design`; pixels remain evidence, not product behavior.

For material design review, each generated artifact is image-backed direction
evidence for `design_board`; inspect it before presentation. If generation is
unavailable, declined, or fails, continue normal UI design without claiming
generated evidence.
