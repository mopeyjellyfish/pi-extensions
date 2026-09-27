# pi-trailer-production

`@mopeyjellyfish/pi-trailer-production` provides a reusable Agent Skill and a
`/trailer` prompt for planning and producing original product, game, site, and
software trailers. The workflow covers the brief, script, storyboard, captions,
asset provenance, motion, audio, renders, and manual audiovisual quality checks.

The media pipeline defaults to local generation and rendering, but this does not
guarantee fully local agent processing. Before reading project or reference
content, the workflow identifies whether agent/model inference is local, remote,
or unknown. Remote models can receive prompts and tool results, including file
contents and screenshots produced by local tools. When the user requires that
content stay on-device, a remote or unknown session must stop before reading it
and move to a verified local-model, local-agent session. Otherwise, remote access
requires bounded consent for the specific content and destination/provider. The
workflow also warns that content already supplied to a session may already have
been sent and cannot be retroactively isolated.

Production stays in an isolated output directory and treats reference material
as read-only. Local media is the default. The first brief asks about preferred
existing models, services, and tools, whether to propose installing a missing
model, and how long an approved preference should persist. Suitable local or
user-provided models are preferred. Downloads and network installation are
never automatic. Approved weights use the model runtime's standard reusable
user cache outside project directories, with a pinned version and integrity
check, so later matching projects can reuse them without another download.

Users may record revocable, scoped consent for an exact model/version, voice,
provider, input data classes, rights basis, project scope, destination, and cost
limits. The workflow records the scope, date, and revocation path in an approved
local non-secret note and reuses it only while the full scope matches. It still
checks availability, terms, and rights each run and asks again after a material
change. It never relies on conversational memory or silently extends consent to
a new project or data category. Every off-device media transfer requires either
matching recorded consent or new explicit approval. Final delivery includes
editable source and local master and viewing files; publishing is never
automatic.

The brief offers an optional question for brand assets, approved company facts,
hero imagery, and intro clips. The user may skip it. After TTS approval, the
agent provides local voice previews, collects feedback, and waits for a voice
selection before final narration. With consent and model support, it can save
the selected voice settings in a reusable local library for consistent future
projects, without storing credentials or claiming a one-off clip is a reusable
voice model.

This text-only package adds no extension, model, media tool, provider,
credential, or runtime dependency. After the privacy gate and user
authorization, the skill can inspect only relevant model configuration from a
read-only reference project. It separately verifies voice TTS, music, and
sound-effect capabilities and discovers alternatives only for missing or
unsuitable capabilities.

## Install

```text
pi install npm:@mopeyjellyfish/pi-trailer-production
```

## Use

Start the guided workflow with a goal or existing brief:

```text
/trailer Create a 45-second launch trailer for this application.
```

Pi may also load the skill when a request matches its routing description. To
load it directly:

```text
/skill:trailer-production
```

Review the package before installation. The workflow can direct an agent to read
project files, run installed media tools, and create files inside the approved
output directory.
