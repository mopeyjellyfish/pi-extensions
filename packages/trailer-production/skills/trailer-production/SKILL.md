---
name: trailer-production
description: Plan and produce original product, game, website, or software trailers from a structured brief through script, storyboard, motion, voice, sound, render, and manual audiovisual QA. Use for launch videos, teasers, feature trailers, demo reels, and trailer production or revision requests.
---

# Trailer production

Create a polished, truthful trailer without assuming any specific media tool,
model, provider, or companion skill is installed. Follow the target repository's
instructions and vocabulary. Keep the project reproducible, the sources
traceable, and every external data flow approved.

## Set safe production boundaries

1. Before reading target-repository instructions, references, source files,
   attachments, or screenshots, identify the current agent and model data path.
   Determine whether model inference is local, remote, or unknown and which
   provider or destination receives prompts, conversation context, and tool
   results. Tool results can include file contents, images, and screenshots even
   when the file-reading or media tool runs locally.
2. Explain that local media generation or rendering is not the same as fully
   local agent processing. A remote agent or model can still receive content
   returned by local tools.
3. If the user requires that content never leave the device, continue only in a
   verified local-model, local-agent session. If the inference path is remote or
   unknown, stop before reading content and ask the user to switch to such a
   session. Otherwise, before reading content through a remote or unknown path,
   obtain explicit bounded consent that names the specific reference content and
   destination/provider.
4. If the user already supplied content in the current session, disclose that it
   may already have been sent through the current agent or model data path. Never
   claim that switching tools or sessions can retroactively isolate that data.
5. After establishing an acceptable data path, inspect target-repository
   instructions before reading source material or writing files.
6. Treat all reference material as read-only. Do not alter, rename, annotate, or
   generate sidecar files beside references.
7. Agree on one dedicated output directory outside reference directories. Write
   scripts, generated assets, renders, and reports only inside it. Keep reusable
   model caches outside source, reference, and output projects. Stop if this
   isolation cannot be maintained.
8. Default media generation and rendering to local tools. Before any additional
   upload, remote API call, hosted generation, remote render, or other off-device
   transfer, explain exactly what data would leave the device, the
   destination/provider, the purpose, expected cost when known, retention
   uncertainty, and the local alternative. Continue only after explicit bounded
   approval, which may be a matching recorded standing approval as defined
   below.
9. Never read, print, copy, store, or transmit credentials unless an approved
   tool needs its normal credential flow. Use existing secure provider or tool
   authentication. Do not place secrets in prompts, scripts, logs, source files,
   metadata, or deliverables.
10. Do not publish, upload, deploy, post, or send the trailer unless the user
    explicitly requests and approves the exact destination and artifact after
    reviewing the local final files.

Approval applies only to the stated content, destination, action, and data flow.
A declined, cancelled, or ambiguous answer is not approval. A standing approval
does not replace the agent/model privacy gate, which runs first in every new
session before project content is read. After approvals and an accepted
production plan, work autonomously within those bounds. Ask again only when a
new external boundary, rights issue, material creative change, destructive
action, cost, or publication decision appears.

### Reuse explicit preferences without relying on conversation memory

After the privacy gate, make the first brief question whether the user prefers an
existing model, service, or tool; whether a missing model may be proposed for
download and installation; and whether any approved choice should persist for
this production, named project, or another explicit scope. Prefer a suitable
local or user-provided model. If no stored preference and consent exists, ask
rather than infer it.

The user may create a standing, revocable approval for repeated work. It must
name the exact verified model and version or revision, voice when applicable,
provider, permitted input data classes, rights basis, project or production
scope, destination, and cost limits. Record that scope, the consent date, and a
clear revocation path in an explicitly chosen local, non-secret preference or
production note. Never record credentials there. Do not rely on conversational
memory, silently include a new project or data category, or expand any limit.

At every run, verify availability, current terms, and rights. Reuse the recorded
selection and approval without repetitive questions only while the complete
scope still matches. Ask again after revocation or any material change,
including a model version, voice, provider, input data class, rights basis,
project, destination, cost, terms, or data path.

## Build a question-based brief

Use a structured question tool when one is available. Group related choices so
the user can answer efficiently. If no question tool exists, ask the same
questions in one concise numbered message and wait for the answers. Do not treat
silence or defaults as approval for external processing, voice synthesis, rights,
or publication.

Record a brief with:

- objective, call to action, audience, viewing context, and success measure;
- subject and claims that can be demonstrated truthfully;
- target duration, pacing, tone, visual language, and references to use only as
  direction rather than material to copy;
- required features, story beats, product states, platform framing, aspect
  ratios, frame rate, delivery date, and accessibility needs;
- available source material, brand rules, logos, fonts, captures, audio, and the
  ownership or license status of each;
- optional company and product assets: brand kit, logos, approved copy, footage,
  intro or splash clips, screenshots, hero imagery, and company facts. Offer a
  clear "skip" choice. If authorized material is already known, identify it and
  ask whether to use it rather than silently importing it.
- preferred existing models, services, and tools; whether a missing model may be
  proposed for download and installation; and the requested persistence scope;
- spoken language, captions, voice preferences, music direction, sound-effect
  direction, and whether silence is intentional;
- output directory, machine constraints, available time, and desired editable
  and rendered deliverables;
- explicit exclusions, sensitive material, embargoes, and prohibited claims;
- approval owners for concept, script, voice, rough cut, final cut, external
  processing, and publication.

Resolve only decisions that block the next bounded stage. Offer a recommended
choice and its tradeoff instead of asking the user to design the workflow.

For supplied assets or approved company details, confirm access, ownership,
commercial use, release requirements, factual accuracy, and any embargo before
putting them in the shot list. Use an approved intro or splash clip when it helps
the story; do not assume it is mandatory. Keep originals read-only and record
each use in the asset ledger. If the user skips this question, continue with
other authorized evidence and original visuals rather than inventing brand facts.

## Inspect the environment before proposing production

Inspect available local tools, skills, models, runtimes, codecs, storage,
memory, GPU/accelerator support, and existing project conventions. Verify a
capability by inspecting its actual interface or running a safe version/help
check; do not infer support from a tool or model name. Report what is verified,
unknown, or unavailable.

Only after completing the agent/provider privacy gate and obtaining explicit
authorization, inspect a user-supplied reference project's relevant model
configuration, manifests, and model cards. Read no creative material for this
purpose. Distinguish an exact confirmed model and revision from a suggestive
directory name, an unverified model-cache entry, or creative material. Keep the
reference project read-only and do not copy its models or assets into the source
project.

Select each required capability in this order:

1. Use a suitable local or user-provided model, asset, or tool, including an
   exact stored preference whose consent scope still matches.
2. Consider another existing service or tool that the user prefers, subject to
   the local-media default and all privacy, transfer, rights, and cost gates.
3. Treat a model verified from an authorized reference project as a candidate,
   not an automatic selection.
4. Discover current first-party alternatives only when the capability is
   missing or the available candidate is unsuitable.

Compare viable candidates by recency, output quality on a short local test,
license and commercial-use rights, hardware fit, cost, latency, reproducibility,
and privacy. A latest release is a verified option, not automatically the best
choice. Choose the smallest compatible pipeline that can deliver the brief and
prefer existing project tools and editable formats. If a capability is absent,
propose one local alternative and one manual fallback. Do not claim this skill
installed any tool or model.

Evaluate voice TTS, music generation, and sound-effect generation as separate
capabilities. Do not infer that a speech or music model can generate general
sound effects. Use a model for a media type only when first-party documentation
confirms that the exact model and version support it. Otherwise use an original
recording, another verified original or local synthesis path, a licensed local
asset, or a clearly disclosed manual placeholder.

An installed user-provided model needs no download. If a missing capability
requires a model or tool from the network, do not download or install it
automatically. First ask whether the user wants it downloaded and installed,
then obtain explicit approval for the provider and URL, executable code and
model-weight provenance, exact version or revision, integrity hash when
published, license and commercial-use terms, total download bytes, required free
space, hardware and compute needs, installation location, planned outbound
network access, and request metadata. Pin the approved version or revision and
verify its integrity.
Keep approved weights in that model runtime's standard user-level reusable cache
outside source, reference, and output projects, and reuse verified cached
weights in later projects instead of downloading them again. Keep tool installs
in their approved normal location. When strict local processing is required,
use only verified offline or pre-staged resources. Do not overwrite existing
resources destructively, and inspect or otherwise verify executables and scripts
before running them.

## Approve the creative plan before production

Create and present these linked artifacts inside the output directory:

1. **Creative brief:** promise, audience, tone, duration, call to action, factual
   claim sources, constraints, and acceptance criteria.
2. **Script:** timed picture, on-screen copy, voice-over, sound effects, music,
   transitions, and intentional silence. Read it aloud or estimate spoken time.
3. **Storyboard and shot list:** shot IDs, time ranges, source or generation
   method, framing, motion, overlays, transition intent, audio cue, dependencies,
   and fallback.
4. **Caption plan:** verbatim dialogue/voice-over, meaningful sound labels,
   reading speed, safe placement, contrast, and delivery format.
5. **Asset ledger:** source path or origin, creator, creation date when known,
   license, allowed use, attribution, consent/release status, modifications,
   and final shot usage.
6. **Production plan:** tools, data flow, output structure, checkpoints, render
   budget, machine constraints, and fallbacks.

Design original motion, voice-over, sound effects, music, and editing for this
trailer. Use supplied or licensed material only when the brief explicitly calls
for it and the asset ledger proves the needed rights. Do not imitate a living
artist or lift another trailer's sequence, copy, melody, sound design, visual
identity, shots, or assets. References may inform high-level qualities such as
pace or contrast, not copied expression. Mark temporary material clearly and
prevent it from entering a final render.

Obtain approval for the creative brief, script, storyboard, and production plan
before expensive or irreversible production. Track requested revisions and the
approved version rather than overwriting the decision history.

## Gate first voice synthesis and scoped reuse

Before the first voice generation without matching stored consent, propose one
exact high-quality TTS model and version, its provider/runtime, the selected
voice, why it fits, whether execution is local or remote, every permitted text
or reference-audio input data class, the full data path, retention and cost
limits when known, output location, and a local/manual alternative. Verify that
exact model is currently available and compatible. Obtain explicit approval for
the exact model, version, and voice before synthesis, even when the user already
provided and installed it; no download is then required. A generic approval for
“TTS” is insufficient.

The user may make that approval standing, revocable, and scoped under the reuse
rules above. Skip repeated model, service, and voice selection or approval only
when the recorded model/version, voice, provider, permitted input data classes,
rights basis, project scope, destination, cost limits, terms, and data path still
match. Otherwise ask again.

For every run, confirm the voice's current license and commercial-use terms, the
user's right to use any reference voice, and documented consent for cloning or
likeness use. Never clone, impersonate, or synthesize an identifiable person's
voice without clear rights and explicit consent. Keep proof or a ledger
reference with the project. If rights, consent, provider terms, or data flow are
unclear, do not synthesize; use a scratch performance by an authorized speaker,
text cards, or silence.

## Audition and reuse a voice

After voice generation is approved, create short, labeled previews from approved
copy. Give the user local playback files or an available local player. Ask them
to listen and choose, reject, or request changes to pronunciation, pace, tone,
emphasis, and clarity. Iterate within the approved model and data scope; ask
again if a new model, voice, or data flow is needed. Do not treat a preview as
final voice-over until the user accepts it. A previously accepted saved voice
can skip a new voice-selection round when its standing approval still matches.

Offer to save the accepted voice for consistent use in later projects. If the
runtime supports reusable identity, record its voice or preset ID, pinned model
revision, seed, style instructions, pronunciation rules, and settings in a
user-approved local voice library outside source, reference, and output
projects. Save reference audio or a sample only with the needed rights and
consent. Keep credentials out, record license, permitted scope, retention, and
how the user can revoke or remove it. Do not upload a saved voice without
separate approval. If the model only produces a one-off recording, keep the
authorized sample and settings but do not claim the voice can be reproduced.
For a later project, verify that the saved profile and rights still apply and
play a short sample of the new copy before final voice-over production.

## Produce picture and motion

Capture truthful, stable product states. Hide credentials, personal data,
private URLs, notifications, debug details, and unrelated user content before
recording. Use scripted or repeatable interactions where practical. Preserve
clean source captures separately from edits.

Use time-based JavaScript animation when it is requested or when the subject is
software and deterministic UI, typography, diagrams, compositing, responsive
layout, or repeatable timing makes it the best fit. Drive motion from a timeline
or elapsed time, not frame-count side effects. Separate scene data, timing,
layout, and rendering; use deterministic seeds; load assets explicitly; and
respect safe areas and reduced-motion needs. Keep an editable source project and
record the exact render command and runtime versions. Do not force JavaScript
when conventional editing, captured footage, or another verified local tool is
simpler and produces a better result.

For every visual element, preserve aspect ratio, color intent, legibility, and
source provenance. Use purposeful camera and type motion. Avoid motion that
obscures the product, makes claims the source cannot support, or causes flashing
and unsafe rapid patterns.

## Produce and mix original audio

Create or license every voice, sound effect, and music element deliberately.
Keep stems and source files. Record generation settings, prompts, edits, licenses,
and attribution in the asset ledger without secrets. Do not use an asset with
unknown rights in the final cut.

Edit for intelligibility first. Balance dialogue, effects, and music; remove
clipping, accidental noise, clicks, and abrupt tails; use fades and room tone
where needed; and check loudness and true peaks against the selected delivery
platform's current requirements. Do not invent a universal loudness target.
Keep enough headroom for the master and avoid solving mix problems only with a
final limiter.

## Edit, caption, and review

Build the story before polish: hook, evidence, escalation, payoff, and call to
action. Make every shot earn its duration. Keep key copy readable on a normal
viewing device, inside safe areas, and long enough to understand. Check names,
claims, version labels, URLs, legal lines, and calls to action against approved
sources.

Provide accurate captions and a separate editable caption file when the selected
delivery supports one. Include relevant non-speech audio, identify speakers when
needed, and manually check timing, line breaks, spelling, contrast, and occlusion.
Do not rely on automatic transcription as final proof.

At rough-cut and final-cut checkpoints, watch the complete render in real time
with sound, then again muted, and listen once without picture. Also inspect the
first and last frames and representative cuts frame by frame. Record manual QA
results for:

- story clarity, pacing, factual accuracy, continuity, and call to action;
- dropped, duplicated, corrupt, frozen, black, or placeholder frames;
- crop, scaling, safe areas, text legibility, color, banding, and flashing;
- sync, dialogue intelligibility, channel layout, clipping, noise, fades, and
  unexpected silence;
- caption content, timing, placement, and accessibility;
- asset rights, attribution, consent, and removal of temporary assets;
- duration, aspect ratio, resolution, frame rate, codec, pixel format, color
  tags, audio codec, sample rate, channel layout, subtitle tracks, time base,
  file size, and playback on at least one intended player.

Use media inspection tools for metadata and signal checks when available, but do
not substitute automated probes for the manual audiovisual review. Fix and
rerender failed items, then repeat the affected checks on the final artifact.

## Render for the machine and chosen destination

Ask the user to choose delivery resolutions after reporting source limits,
platform needs, render-time and storage estimates, and verified machine
constraints. Never imply that upscaling adds real detail.

Define each preset's exact dimensions, frame rate, master codec, delivery codec,
pixel format, color space, audio format, and quality/bitrate only after checking
the chosen aspect ratio, destination requirements, source quality, and verified
encoder support. Prefer a lossless or visually lossless local master when the
machine and storage support it. Use these resolution tiers as starting points:

- **1080p:** preferred review and broadly compatible delivery render; usually the
  first full-quality validation target.
- **4K:** high-quality master or delivery when source detail, storage, memory,
  encoder support, and render time justify it.
- **8K:** exceptional master or installation deliverable only after explicit user
  choice and a successful short benchmark proves the machine, codec, storage,
  and playback path can sustain it.

Render a short representative segment before costly 4K or 8K work. If the
machine cannot meet the chosen preset reliably, present measured evidence and
ask the user to choose a lower resolution, proxy workflow, longer render budget,
or an explicitly approved remote render with a disclosed data flow. Preserve a
high-quality local master before making compressed viewing copies.

## Deliver locally and close the ledger

Keep final deliverables in the approved local output directory. Provide:

- the editable source project with relative, organized asset links;
- approved script, storyboard/shot list, caption source, and final captions;
- asset provenance and rights ledger, including attribution and consent notes;
- production notes with verified tools, versions, commands, prompts/settings,
  approvals, and external data flows, with no credentials;
- the selected voice and feedback record, with a pointer to any separately
  approved reusable voice profile and its consent scope;
- a high-quality local master plus only the user-selected 1080p, 4K, or 8K
  viewing/delivery renders;
- a manual QA report and machine-readable metadata report for each final file;
- known limitations, unresolved rights or compatibility issues, and the exact
  next decision if publication is desired.

Confirm that source paths resolve from the delivered project and that final files
open locally. Do not publish. Publication is a separate, destination-specific
user decision after local review.
