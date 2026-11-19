---
name: reelmimic
description: "Use this when a reference video must become a new 2D animation in its style: measure the timing and palette, then rebuild the motion as your own HTML/CSS/SVG scene."
---

# Mimic a video's style as a 2D animation

Use this when the user points at a video and wants a **new** animation in that style — not a copy of its frames. With `rea-video` for measurement and `cinecode` for rendering.

1. Measure the reference first, with `rea-video`: duration, cuts, the beat map, the palette (3–5 colours with their roles), line weight, and whether the motion is snappy, eased, or stepped. Write those numbers down; "like the video" is not a measurement.
2. Lock one style before animating: **vector**, **watercolour**, **crayon**, **pixel**, **paper cut-out**, **whiteboard**, or **anime cel**. One style only; mixing two is a failed draft. Say which one in the answer.
3. Write one self-contained HTML file (`write`) with inline CSS/SVG/Canvas: a stage sized to the target aspect, a deterministic timeline driven by elapsed time, system fonts only, and no external assets.
4. Rebuild **your own** subject in that style — the client's product, their character, their data. Copy the rhythm and palette, never a frame, logo, or character from the reference.
5. Render with a real browser: `pwsh` Playwright samples frames at the requested fps, `ffmpeg` (when installed) muxes them. If `ffmpeg` is absent, deliver the frame set plus the HTML and say the MP4 was not produced.
6. Verify: duration, fps, resolution, frame count, palette match against the measured reference, and that the first two seconds carry the hook. Play the result once.
7. Report the style, the measured facts, the file, the numbers, and what was deliberately not copied.

Adapted from CEditNeuro's `reelmimic` (edenfunf/reelmimic, MIT); the upstream Node/FFmpeg studio is not a dependency.
