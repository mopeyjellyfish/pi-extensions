# Review loop

Read this file before you review picture or sound. An agent cannot watch a
video in real time or listen to audio. It must review with stills and
measurements, and it must hand real-time viewing to the user. Never claim that
you watched or listened.

## Review picture with stills

- Keep a stills tool that renders JPEG frames at given times.
- Keep a contact-sheet tool that renders a time range at a fixed step and tiles
  the frames into one image.
- For every beat, look at the start, the middle, and the end. Look at a few
  frames on each side of every transition.
- Apply one test to each still: would this frame survive a pause in a
  professional trailer? Check composition, legibility, alignment, depth,
  light, and truthfulness.
- Fix, rebuild, and look again. Iterate until every still passes.

## Review motion without watching

Stills do not show timing or smoothness. Also:

- run the determinism check and the live speed check (see
  `cinematic-engine.md`);
- render short test segments with motion blur to check fast movement;
- check that accents land on the cue times: a still at a word's start time must
  show the accent.

## Review sound without listening

Use the objective checks in `audio-pipeline.md`: exact transcripts of takes and
of the master, voice-to-background ratio per line, loudness and true peak,
effect hit timing, and loop seams.

## Hand real-time review to the user

At the rough cut and the final cut, give the user the local files and ask them
to:

1. watch the whole trailer in real time with sound;
2. watch it again muted, to check the captions and the picture alone;
3. listen once without picture, to check the voice and the mix;
4. report every problem with a time code.

Treat the user's notes as the real-time review. Fix, re-render the affected
range, and repeat the checks on the final files.

## Report progress with pictures

When you work autonomously for a long time, report at each milestone: what is
done, what is next, and a small contact sheet of the newest frames. Include the
honest state of anything that is not finished.
