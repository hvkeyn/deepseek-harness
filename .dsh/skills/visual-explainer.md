---
name: visual-explainer
description: "Use this when a system, architecture, diff, plan, comparison, or data set needs a designed HTML explanation, not one box diagram."
---

# Explain with a designed page

Use this when words are not enough and a diagram is not enough: an architecture, a migration plan, a comparison, a data set, a project recap.

1. Start from the answer, not the layout: the first viewport states the claim in one sentence, and every figure below supports it. If you cannot write the claim, you are not ready to design.
2. Choose the figures that carry the claim: a layered map for a system, a before/after for a migration, a sorted bar for a comparison, a timeline for a plan, a table when the reader must look up a value. One claim per figure; a figure that shows two things is two figures.
3. Figures lead, words label. Keep captions to a line, put units and sources on the figure, and never let a paragraph repeat the picture.
4. Build one self-contained HTML file (`write`) with inline CSS and system fonts: paper surface, one accent, a readable measure (~72 characters), and print-safe contrast. No kit, no CDN, no script needed for a static explanation.
5. Verify in the browser: load the file with `pwsh` Playwright at the target width, screenshot it, `read_image` it, and fix clipped labels, overlapping arrows, or a figure that reads as decoration.
6. Report the file, the claim, the figures, and what the page deliberately omits.

Upstream reference: CEditNeuro's `visual-explainer` (nicobailon/visual-explainer, MIT), rewritten for this harness.
