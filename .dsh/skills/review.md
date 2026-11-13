---
name: review
description: "Use this when the user asks you to confirm a change works, or before you say so yourself."
---

# Review before claiming a change works

Use this when the user asks you to confirm a change works, or before you say so yourself.

1. Read what actually changed: run `git diff` (or `git status` for untracked files) and quote the important hunk instead of summarizing it from memory.
2. Run the narrowest check that would fail if the change were wrong — a focused test, a typecheck, or a real command against the built artifact.
3. Report what you checked, what you did not check, and any command that is still red. A failed command stays failed: do not rerun it unchanged and call it green.
4. If you could not run the check, say which one and why; do not substitute an opinion for a result.
