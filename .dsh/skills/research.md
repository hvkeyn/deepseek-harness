---
name: research
description: "Use this when the user asks for a researched answer: comparisons, current facts, or anything that must cite where it came from."
---

# Research with sources

Use this when the user asks for a researched answer: comparisons, current facts, or anything that must cite where it came from.

1. Restate the question as two or three concrete sub-questions before searching.
2. Run `web_search` for each sub-question; open the most promising results with `web_fetch` instead of trusting snippets.
3. Keep a note per source: URL, what it claims, and how fresh it is. Drop sources that repeat each other.
4. When the sources disagree, say so and show both claims with their links rather than picking silently.
5. Answer with the claim first, then the evidence, then the links. Mark anything you could not verify as unverified.
