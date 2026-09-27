# Cinematic JavaScript engine

Read this file when the trailer uses time-based JavaScript animation. The
engine must play live in a browser and also export frame-exact video from the
same code.

## Make every frame a pure function of time

- Expose one entry point per scene: `render(t, localT, ctx)`. `t` is global
  seconds. A scene runs while its `[t0, t1)` window contains `t`. Let
  neighbouring windows overlap for transitions.
- Produce the same picture for the same `t`, whatever frames came before and
  in any order. Seeking backwards must work.
- In `render`, do not use `Math.random`, `Date`, `performance.now`, timers, CSS
  transitions or animations, `<video>`, or any asynchronous work. Use seeded
  helpers such as `rng(seed)`, `hash1`, `noise1`, and a slow `drift`.
- Build all DOM once in `build(root, ctx)`. In `render`, only write cached
  styles, transforms, opacity, and text. Never create or remove DOM in
  `render`.
- Redraw canvases completely in `render`. Size a full-stage canvas to the stage
  size times the output pixel scale.
- Author in fixed stage units, such as 1920×1080. Scale the stage to the
  viewport. Export larger sizes with a device pixel scale, not a new layout.
- Keep global post effects in one place: flash, vignette, grain, letterbox,
  and fade to black. Scenes set these values per frame.
- Load every image and font before the first frame. Wait for
  `document.fonts.ready`.

## Give the player a real clock

- The live player follows the audio clock of the final mix, not a frame
  counter.
- Provide keyboard control: play and pause, seek, full screen, and restart.
- Accept `?t=<seconds>` to start at a time and `?captions` to show captions.
- Expose `seek(t)` on `window` for the exporter and the review tools.

## Hold the look to a launch-film standard

- **Nothing is static.** Every shot has a slow camera drift, such as a scale
  of 1.00 to 1.04 and a few pixels of parallax, even when it holds.
- **Ease with intent.** Use an exponential ease-out or a spring. Use linear
  motion only for constant camera drift. Stagger groups by 40–80 ms.
- **Build depth.** Use 3D-transformed planes, soft shadows, and blurred back
  layers with a sharp foreground.
- **Use restrained light.** Add glows in the brand accent, light sweeps across
  hero type, and subtle bloom from blurred duplicate layers with a screen blend.
- **Set type for the screen.** Hero lines are large, heavy, and tightly
  tracked. Labels are small, uppercase, and widely tracked. Numbers use a
  monospaced face with tabular figures.
- **Stay true to the product.** Take the palette and type from the product's
  own tokens. Recreate product UI from the product's real components and
  styles, or from truthful captures. Do not invent features.
- **Stay legible.** Keep important text at 13 px or more at the 1× stage size.
- **Flash with care.** Avoid unsafe flashing and rapid full-screen changes.

## Use the product's own art

- Prefer the product's real art, screenshots, and marks over generated
  stand-ins. Record each one in the asset ledger.
- If source art is smaller than the master resolution, upscale it with a
  verified local upscaler and record the step. An upscaler does not add real
  detail. Do not present upscaled detail as product capability.

## Avoid known browser traps

- Under CSS `perspective`, Chromium can rasterize DOM layers at 1×. Lay out the
  3D group at `zoom: 2` and counter-scale the camera, or render that layer to a
  canvas.
- A data-URL or new `src` swap decodes asynchronously. The exporter can capture
  the old or an empty image. Draw swapped images to a canvas, or preload every
  state and toggle visibility.
- Set `decoding = "sync"` on images that appear mid-shot.
- Two motion-blur sub-samples double-expose fast UI movement. Use at least four
  (see `render-pipeline.md`).
- GPU compositing can differ by one least significant bit between runs. Compare
  frames with a small tolerance.

## Check determinism and speed

- **Determinism:** render a set of sample times in time order, then in a
  shuffled order after a far seek. Compare the pixels with a tolerance (for
  example, more than 3 levels on more than 50 pixels is a real difference).
  Fix every difference before export.
- **Live speed:** step the timeline at the live frame rate and time seek plus
  paint for each scene. Keep every scene inside the frame budget, or live
  playback will stutter even when the export is clean.

## Author scenes with a written contract

Keep a short scene guide in the project. It states the render contract, the
timing helpers, the look rules, the sound event call, and the preview commands.
Every scene author, human or agent, reads it first.
