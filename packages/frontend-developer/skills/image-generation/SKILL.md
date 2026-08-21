---
name: image-generation
description: Generate or edit a GPT Image 2 mock-up artifact when compatible credentials are available.
---

# Image generation

Use `image_generation` only for a useful mock-up artifact, with a bounded prompt
and explicit output path. The tool uses a separately billed OpenAI Platform API
credential resolved by Pi. A ChatGPT or Codex subscription is not sufficient.
Input images and masks are uploaded to the provider, so confirm privacy and cost
before use.

If compatible credentials or trusted configuration are absent, make no request:
report the credential requirement and continue with supplied mock-ups or design
evidence. Inspect a saved artifact before using it in `frontend-design`; pixels
remain evidence, not product behavior.
