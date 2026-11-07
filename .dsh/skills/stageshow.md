---
name: stageshow
description: "Use this when a faux product UI, feature card, bento, phone mockup, or cursor demo must look real in one HTML page."
---

# Stage a product UI

Use this when the user wants a screenshot-like product shot: a feature card, a bento grid, a phone mockup, a cursor demo. One page, one stage, no kit.

1. Fix the frame before designing: the aspect and size (a 16:9 hero, a 4:3 card, a 390×844 phone), the one hero element, and the 3–7 real strings that carry the story. Placeholder lorem is a failed stage.
2. Build it as one self-contained HTML file with inline CSS (`write`), system fonts only. No React, no Node, no CDN, no screenshot library.
3. Compose on a hard crop: the hero fills the frame, secondary rows are cut at the edge on purpose, and nothing floats in dead space. One accent colour; the surface is a real product surface, not a gradient poster.
4. Add exactly one causal motion: a cursor that moves to the button it clicks, a card that lifts from the element that opened it, a notification that slides from the edge that produced it. Nothing else animates.
5. Check the frame in a real browser: `pwsh` with Playwright (installed in this repo) at the target viewport, screenshot to a file, then `read_image` it. Look for clipped text, a wrong hierarchy, or a cursor landing on nothing.
6. Report the file, the viewport, the screenshot path, and what the stage claims. A stage that needs an explanation is not finished.

Adapted from CEditNeuro's `stageshow` (benjitaylor/skills), rewritten for this harness.
