# ASCII studio

Use this when the user asks for ASCII art, a text banner, a shark or ocean scene, a terminal animation, a retro screen, or an ASCII video. The reference is ascii-sharks (MIT): fish and sharks drawn as monospace cells on a dark canvas. The bundled shark and ocean templates are adapted from it and remain MIT; do not copy other code or assets.

## Static picture

Call `ascii_art`:

- `subject=shark`, `ocean`, `fish`, or `scene`;
- `subject=text` with `text=HELLO` for a block-letter banner;
- `frames=2` to `8` for a short loop of shifted frames.

The tool returns a compact html card; include it unchanged. Keep one idea per card, max 100 columns, and no emoji-only picture. A banner is uppercase A–Z, 0–9, spaces, `- _ ! ?`; a longer line is split into two banners.

The card already wraps the art in a dark monospace panel; do not put it inside another `layout` block. Do not invent a second scene to fill space.

## ASCII video

When the user asks for a video, a clip, a reel, an animation, or “ролик”, make an **ASCII animation**, not normal footage.

1. Write `ascii.html` with inline CSS and JavaScript. Use a `<pre>` stage, monospace font, dark background, and one accent (white, amber, or green).
2. Build 6–12 seconds at 12–24 frames per second. A frame is a full text grid; the player swaps frames on a timer. Keep the grid 80×30 or 100×36; scale with CSS, not with a huge character count.
3. Animate one thing: a shark crossing, a school turning, a radar sweep, a typing banner, or a packet moving through an ASCII network. Do not animate every cell.
4. Add a title frame, the loop, and an end card with the caption. No audio unless the user asks for sound.
5. `load_tools group=video`, then `render_video` the HTML to `ascii.mp4` (720p or 1080p, 16:9). Save the frame list as `ascii-frames.txt` so the result is reproducible.
6. Open the HTML with `open_file` (group `device`) if the user wants to preview it in a browser. A chooser is normal; choose a browser.
7. Check the result: `read_file` the HTML, run `render_video`, then report the path, duration, dimensions, and that the picture is ASCII. Do not say “rendered” before the tool returns success.

If the user only mentions a video in passing, ask one short question: “ASCII animation or normal video?” If they want ASCII, proceed. If they want normal footage, use the `hyperframes` skill instead.

## Style

- Paper-black terminal, `#0b0f0c` background, `#d8ffd0` or `#ffd27a` ink; one accent.
- Monospace only; no proportional font, no ligatures, no emoji as the main shape.
- Use characters with similar width: ` .:-=+*#%@` for shading, `/\|_-` for lines, `oO0` for eyes or bubbles.
- Leave a margin; do not let a shark touch the frame edge unless it is exiting.
- A shark is a silhouette with a dorsal fin, tail, and one eye; a fish is a small dash or `><>`; water is a repeated wave line, not random noise.
- Keep the caption outside the art: one sentence, plain language.

## Quality

- The art must be readable at phone width. If a line wraps, cut the scene or split it into two frames.
- A video must have a duration, a resolution, a frame count, and a path. “A nice animation” is not a result.
- No copyrighted character, logo, or copied ascii-sharks frame.
- No external image, font, package, or CDN. The HTML is self-contained.
- If `render_video` fails, report the exact error and keep the HTML; do not silently switch to a still image.

## Output order

1. `ascii_art` block, or the `ascii.html` preview.
2. For a video: `render_video` result with path and duration.
3. One caption and one next step (loop longer, change ink, or add a title).
