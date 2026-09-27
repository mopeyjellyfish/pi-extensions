# Story and timing

Read this file before you write the script. A trailer feels cinematic when
picture, voice, and music obey one clock. Design that clock first.

## Write for the audience without naming them

- List what the audience cares about. For example, a buyer may care about time
  to market, proof, control, cost, and scale.
- Show each item on screen as evidence: a number, a product state, or a
  result. Do not name the audience in copy or voice-over.
- Separate the subject from the example. A platform trailer can use one hero
  example, but the story must stay about the platform.
- Write a tone line with two or three references, such as "premium product
  film crossed with a game trailer". Use the references for pace and contrast
  only. Do not copy their shots, copy, or music.

## Build the edit timing map before the script

Choose a tempo and a bar grid. At 120 BPM, one beat is 0.5 s and one 4/4 bar
is 2.0 s, so section edges fall on whole seconds. Put every section, every
structural hit, and every voice-over line on this grid.

Record the map as a table in the creative brief:

| Time (s) | Bars | Section | Picture | Music |
| -------- | ---- | ------- | ------- | ----- |
| 0–14     | 1–7  | Hook    | ...     | ...   |

A proven arc for a 90–120 s product trailer:

1. **Hook:** a quiet, dark open. State the old problem in one or two short
   lines.
2. **Turn:** a riser that peaks exactly on a bar line. The product appears.
3. **Build:** show how the product works. Use a steady pulse.
4. **Pre-drop:** a whoosh, a reverse swell, then a short silence gap. Silence
   makes the next hit land.
5. **Drop:** the hero moment at full energy. Cut on beats.
6. **Breakdown:** pads and a ticking pulse for proof, numbers, and trust.
7. **Second build and drop:** scale and breadth. Use a fast montage that cuts
   on beats.
8. **Stabs:** one word or one short claim per hit, with sparse sound between.
9. **End card:** the final big hit, logo build, tagline, and call to action.
   Let the chord ring out.

Adapt the arc to the brief. Keep the grid.

## Write voice-over to the map

- Give each line a target start time in the map. Start lines just after a
  hit, not on it.
- Keep lines short. About 12 lines fit a 98 s trailer with room for music.
- Leave the drops and the stabs to music and sound unless a line is essential.
- End with one short super (on-screen line) that states the call to action.

## Sync picture to the real voice and music

Never hard-code the time of a spoken word or a music hit in scene code.

1. After the voice-over takes are final, get word timestamps from a speech
   recognition model.
2. Generate one cue module from the timestamps. It holds the tempo, the
   structural hits, and each line with its words and times.
3. Scenes read `line(id)`, `word(id, text)`, `hits`, `beat`, and `bar` from
   that module. Give scenes a `snap(t)` helper for cuts that must land on the
   grid.
4. Lead a visual accent on a spoken word by 0.05–0.10 s. The eye must see the
   accent as the ear hears the word.

When a voice-over take or the music changes, regenerate the cue module. The
picture then re-times itself.
