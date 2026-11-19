---
name: unbrowse
description: "Use this when a website should be called through its own HTTP API instead of driving a browser, or a missing route has to be learned."
---

# Call the site, don't drive it

Use this when a page's data or action is really an HTTP call: a dashboard, a search, an upload, a status page. Driving a browser is the fallback.

1. Find the real route before automating pixels: open DevTools' Network panel (or run the page through Playwright and log requests) and record the method, URL, headers that matter, and the request body for the action the user wants.
2. Prove the route from the shell: `pwsh curl.exe -sS -D -` with the same method and body, plus the auth the user already has (a cookie or a token they provide). Check the status line before the body.
3. Respect the service: no scraping behind a login without the user's own session, no rotation of IPs or user agents, no retry storm. A `401`/`403`/`429` is an answer — stop and report it.
4. Make writes idempotent: a stable idempotency key, or a read-back that proves the effect. A `200` with a changed resource and a `200` with no change are different results.
5. If no route exists, say so: then the options are the site's public API, the user's export, or the browser path — in that order. Never attempt to bypass authentication or a paywall.
6. Never write a key into a file, a prompt, a command line, or a log. Refer to a credential by name and let the user supply it at run time.
7. Report: the route, the request, the status, the effect verified, and the parts of the page that were not covered.

Upstream reference: CEditNeuro's `unbrowse`; the `unbrowse` CLI is optional here, not required.
