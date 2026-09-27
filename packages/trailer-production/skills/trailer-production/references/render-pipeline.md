# Render pipeline

Read this file before you export video from a JavaScript trailer. The exporter
must produce frames that match the live player exactly.

## Capture frames from the live code

1. Serve the built trailer over a local HTTP server. Some browser features do
   not work from `file://`.
2. Start several headless browser workers. Give each worker one contiguous
   chunk of the timeline.
3. In each worker, set the viewport to the stage size and the device pixel
   scale to the output scale. For example, a 1920×1080 stage at scale 2 gives
   3840×2160 frames.
4. For each output frame, call `seek(t)`, wait for the frame to paint, and
   take a screenshot.
5. Pipe the screenshots straight into the encoder. Do not write frames to disk.
6. Join the chunks without re-encoding. Then mux the final audio master.

## Add real motion blur

- Render several sub-frames per output frame, spread across an open shutter
  and centred on the frame time. Average them into one frame.
- Use at least four sub-frames. Two sub-frames double-expose fast UI movement.
- A shutter of about 0.4 of the frame interval (144°) looks natural at 60 fps.
- Motion blur multiplies render time by the sub-frame count. Test it on a short
  segment first.

## Encode for quality and compatibility

Use these as starting points. Check them against the destination and the
verified encoder:

- H.264 with a slow preset and film tuning, in `yuv420p` pixel format. Start
  the constant rate factor near 14 for the master and near 16 for sharing
  copies.
- BT.709 colour primaries, transfer, and matrix tags.
- AAC at 320 kb/s from the audio master.
- Fast-start metadata for web playback.

## Make a complete delivery set

- **Master:** the highest resolution and frame rate the brief and machine
  allow.
- **Sharing copy:** 1080p at the same frame rate.
- **Captioned copy:** captions burned in, for feeds that autoplay muted. Keep
  the separate caption file as well.
- **Posters:** two or three stills from the master at strong frames, such as
  the hero moment and the end card.
- **Live version:** the web build that plays in a browser against the audio
  master.

## Make the project rebuildable

Write a README in the output directory. It lists every deliverable and the
exact commands, in order, to rebuild each layer:

1. build the web bundle;
2. export the declared sound events;
3. mix the audio;
4. render the master and each copy.

Also document the partial paths: how to change one voice-over line, how to
swap the music, and how to re-render one time range. Record runtime and model
versions next to the commands.
