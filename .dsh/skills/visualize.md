---
name: visualize
description: "Use this when a picture, flow, architecture, sequence, timeline, comparison, teardown, exploded view, or quick ASCII sketch must be shown in the chat."
---

# Draw the thing

Use this when a reader must see the object: a flow, an architecture, a sequence, a timeline, a comparison, a part inventory, or an exploded view.

1. Pick the smallest adequate view. ASCII (`ascii-studio`) for a quick shape in a monospace context; one SVG for a real diagram. Do not produce both for the same question.
2. Inventory before drawing: the parts (with real names), the relations (arrow meaning), and the reading order. A drawing with unnamed arrows is a mood.
3. One sheet, one message: title, the figure, and a one-line takeaway. Keep labels horizontal where a reader reads them, and put units on axes.
4. Draw a real SVG (`write`): a paper background, one accent, a hairline grid, and text as `<text>` so it stays selectable. Keep it under ~1200×800 and readable at half size.
5. Show it in the chat by presenting the file, and keep the source next to it (`drawing.svg`). Export PNG/PDF only when a renderer exists; do not fake a conversion.
6. Check the result with `read_image`: overlapping labels, arrows that point at nothing, a legend that repeats the labels, or a figure that needs a paragraph to be understood.
7. Report the file, the message, and what was deliberately left out.

Upstream reference: CEditNeuro's `visualize` (teardown-style views); the `visual_card` chat primitive is replaced by a presented file here.
