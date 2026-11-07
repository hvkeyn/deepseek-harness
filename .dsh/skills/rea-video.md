---
name: rea-video
description: "Use this when a reference video must be taken apart shot by shot and rebuilt or documented."
---

# Take a video apart

Use this when the user points at a video and wants its structure: a reference ad to remake, a style to copy, a scene breakdown, or shot timings.

1. Establish the source honestly: a local file path or a URL the user owns. Do not download a DRM, paid, or login-only video; stop and say so.
2. Extract facts with `pwsh` and `ffprobe`/`ffmpeg` when present: duration, fps, resolution, codec, and one contact sheet of frames per second of runtime (a 5×5 tile is enough). Without ffmpeg, take screenshots through the browser and mark the analysis as sampled.
3. Build a shot table: `#`, start–end, duration, shot size, camera move, subject, action, light, and the transition into the next shot. A shot changes when the camera cuts, not when the subject moves.
4. Name the beats: hook (0–2 s), setup, turn, payoff, end card. The hook is a claim about what keeps a viewer; write down the evidence from the frames.
5. Write `storyboard.md` with the table plus one line per shot about what to keep and what to change for the user's version; write `plan.md` with the rebuild order and the assets it needs.
6. Report: the source, the technical facts, the shot count and average length, the beats, and the files written. Do not claim audio analysis you did not run.

Adapted from CEditNeuro's `rea-video`; the upstream REA-Video CLI extras are not a dependency.
