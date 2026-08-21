---
name: image-generation
description: Generate or edit a GPT Image 2 mock-up artifact when compatible credentials are available.
---

# Image generation

Use `image_generation` only for a useful mock-up artifact, with a bounded prompt
and explicit output path. The tool uses a separately billed OpenAI Platform API
credential resolved by Pi. A ChatGPT or Codex subscription is not sufficient.
Before any provider request, use Pi's `question` tool when available to obtain
explicit consent for privacy exposure and separate billing; use one concise
conversational fallback only when it is unavailable. A cancellation or decline
is not consent: make no request.

If compatible credentials or trusted configuration are absent, make no request:
report the credential requirement and continue with supplied mock-ups or design
evidence. Inspect the saved artifact's format and requested dimensions before
using it in `frontend-design`; pixels remain evidence, not product behavior.
