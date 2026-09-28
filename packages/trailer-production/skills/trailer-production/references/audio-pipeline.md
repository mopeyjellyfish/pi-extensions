# Audio pipeline

Read this file before you produce voice-over, music, sound effects, or the mix.
The approval gates in `SKILL.md` still apply to every model and voice.

An agent usually cannot listen. Measure every audio claim with an objective
check, then give the user short files to hear at each approval point.

## Voice-over

### Cast the narrator

1. Write a short reference passage in the trailer's tone. Make it about 15 s
   long.
2. If the approved model can design a voice from a description, generate
   several candidates of the passage from the approved description.
3. Score each candidate: an exact transcript from speech recognition, pitch,
   pace, and loudness. Drop candidates that fail the transcript.
4. Play the best few to the user as labelled previews. The user picks the
   voice. Save the chosen reference audio, its text, and the settings.

### Generate lines with takes

1. Keep a line table: line ID, the text sent to the voice model, and the text
   you expect back from speech recognition. They can differ. For example, the
   model may need "ninety nine" where the script says "99".
2. Generate every line from the saved reference voice. Make several takes per
   line, such as six.
3. Pick the best take on objective measures: an exact transcript, a
   naturalness score, speaker similarity to the reference, and pace against the
   line's time slot.
4. Let the user hear the picked takes and override any pick.

To change one line later, regenerate only that line, re-place the voice-over,
regenerate the cue module (see `story-and-timing.md`), and remix.

### Place and treat the voice

- Place each take at its start time in the timing map. Split long lines into
  phrases when a phrase must land on a picture change.
- Write the placed voice to its own stem.
- Process the voice with a clear chain: high-pass, gentle equalisation,
  compression, and a short plate reverb. Keep it dry enough to stay clear.

## Music

1. Write the music brief from the timing map: tempo, key, sections, hits,
   risers, silence gaps, and the instrument palette. Add negative directions,
   such as "no vocals" or "no cliché sounds".
2. Generate many candidates with the approved local model at the trailer
   tempo. Check the model's peak memory before you load it. Choose a smaller
   variant if the full bundle cannot fit the machine.
3. Analyse each candidate: tempo, beat grid offset, loudness curve, section
   shape, dynamics, vocals, true peak, and clipping. Rank them with a written,
   documented score.
4. Map the best candidates per beat: level, low-band energy, and onset strength
   on the grid. Find the transient-accurate downbeat offset, because an onset
   envelope peaks after the attack begins.
5. Conform the music to the edit. Build an edit decision list at bar level:
   which source bar plays at which trailer bar, with equal-power crossfades and
   gain. Put structural hits exactly on the map's hits.
6. Let the user hear the conformed score against a rough picture before you
   mix.

## Sound effects

### Build a library

- Synthesise effects locally with fixed seeds, so a rebuild is bit-identical.
  Add licensed foley recordings for real-world sounds and keep their licences.
- Tune tonal effects to the score's key and tempo.
- Keep a manifest for the library. For each file record the category, a
  description, the loop flag, the licence, and two calibrated values:
  - **Hit point:** seconds into the file where the perceived impact lands. Use
    the transient onset for impacts and clicks, the file end for risers and
    reverse swells, and the loudest window for whooshes.
  - **Mix hint:** a starting gain for the category against the music bed.
- Check the library objectively: level, loudness, spectrum, hit timing, and
  loop seams.

### Declare effects beside the picture

- Each scene declares the sounds that its visuals cause:
  `sfx(name, t, { gain, pan, dur, fade, rate })`. `t` is the time where the
  hit point must land. For a riser into a drop, pass the drop time.
- Follow the on-screen position with pan. Vary repeated clicks slightly with
  rate.
- Export all declared events to one file. The mix reads that file.
- Let the music own the big structural hits. Reinforce them only with low
  booms or hits at reduced gain.
- Use sound to sell motion, not to fill every gap.

## Mix

- Build the master from the voice stem, the conformed music, and the declared
  effects. Keep every stem so any layer can be rebalanced.
- Duck the music under the voice with a side-chain.
- Glue the bus lightly. Use a true-peak limiter. Normalise to the destination's
  current loudness target and true-peak limit. Do not solve mix problems with
  the limiter alone.
- Write a high-quality master (for example, 48 kHz 24-bit) and an encoded copy
  for the live player.

## Check the mix objectively

- Transcribe the final master with speech recognition. Every voice-over line
  must come back exactly. A missing word means the voice is masked.
- Plot short-term loudness of each stem over time with the voice windows
  marked. Report the voice-to-background ratio inside each line.
- Measure integrated loudness, true peak, and clipping on the final file.
- Then ask the user to listen on speakers and on headphones.
