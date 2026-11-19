---
name: cinecode
description: "Use this when a short film, ad, explainer, or music video must be written in code and rendered to a file."
---

# Write a short film in code

Use this when the deliverable is motion with a soundtrack or a beat: a 6–30 second film, an ad, an explainer, or a music visual.

1. Fix purpose, exact length, aspect, and platform before writing a line: one sentence of intent, `N` seconds, `16:9` or `9:16`, and whether sound is required.
2. Beat sheet first: 3–8 numbered beats with seconds, one lead action per beat, and the hook inside the first two seconds. A beat with two subjects is two beats.
3. Build one self-contained HTML file (`write`): a stage sized to the target viewport, CSS or Canvas animation, and a deterministic timeline driven by elapsed time — no random frames, no external assets.
4. Render with a real browser: `pwsh` Playwright loads the file, samples frames at the target fps into PNGs, then `ffmpeg` (if installed) muxes them to MP4. If `ffmpeg` is missing, deliver the frame set plus the HTML and say the MP4 was not produced.
5. Verify: duration, fps, resolution, frame count, file size, and that the first and last frames match the beat sheet. Play the result once if a player is available.
6. Report the path, the numbers above, and what the film claims. Do not claim a soundtrack you did not mix, a codec you did not encode, or loudness normalisation you did not measure.

Adapted from CEditNeuro's `cinecode` (sarpstar/cinecode, MIT); the upstream six-gate mode and three.js pipeline are not carried over.
