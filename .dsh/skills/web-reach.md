---
name: web-reach
description: "Use this when answering needs the live web: a current fact, a page's content, an API, or a download that must be verified."
---

# Reach the web deliberately

Use this when an answer depends on something outside the machine: current facts, a specific page, an API response, or a file to download.

1. Decide what must come from the web and what can be reasoned locally. Search only for the first kind.
2. `web_search` for the question, then `web_fetch` the source you will cite. Never cite a snippet you did not open.
3. For an API or a file, use `pwsh` with `curl.exe -sS -D -` so the status line and headers are visible; check the status code before the body. A redirect is not an answer.
4. Keep a note per source: URL, what it states, and when it was published. When two sources disagree, show both and say which one you trust and why.
5. Quote the exact sentence a claim rests on, and link the URL. Mark anything you could not verify as unverified instead of smoothing it over.
6. Respect the site: no scraping behind a login, no retry storm, and stop when a page answers `403` or `429` rather than rotating user agents.
