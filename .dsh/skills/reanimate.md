---
name: reanimate
description: "Use this when an animation, hover, loader, transition, or 3D scene seen in a GIF, video, or live site must be rebuilt in the project."
---

# Rebuild an animation from a reference

Use this when the user points at motion and says "make it like this": a landing-page hover, a loader, a page transition, a 3D tilt.

1. Fix the scope and the fidelity bar: which element animates, what triggers it, what duration, and whether the result must be a pixel match or only the feel. Ask when the reference is ambiguous.
2. Collect evidence in a table: source (URL, file, timestamp), the element, the trigger, the observed duration and easing, and what it looks like at start, middle, and end. Frames beat adjectives; capture them with the browser or `ffmpeg` when available.
3. Write `spec.md` with one row per motion: trigger → property → from → to → duration → easing → repeat. A row you cannot observe is marked as a guess.
4. Build with the cheapest adequate technique: CSS transitions/keyframes for transform and opacity, Canvas for many particles, WebGL only when the reference is genuinely 3D. Respect `prefers-reduced-motion` and keep the static state usable.
5. Compare: render the rebuilt page at the same viewport, capture the same moments, and list the residuals (timing off by X ms, colour a shade off) instead of declaring a match.
6. Report the file, the spec path, the comparison frames, and the residuals that remain.

Upstream reference: CEditNeuro's `reanimate` (NiazMorshed2007/reanimate, MIT), rewritten for the browser tools in this harness.
