---
name: ub-mode
description: "Use this when a feature, bug fix, or refactor must be clean, tested, and maintainable, and the work is longer than a one-line change."
---

# Make it work, then make it right

Use this when a change must survive review: a feature, a bug fix with a real cause, or a refactor. Two phases, in order; do not mix them.

1. **Make it work.** Write one failing test or one reproducing command first (`pwsh`), then the smallest edit that turns it green. No speculative structure, no extra options, no second behavior.
2. **Make it right.** With the behavior pinned by that test, remove duplication, dead branches, and needless state; split names that lie; keep the test unchanged so the refactor is proven.
3. One behavior per commit-sized step; keep the tree green between steps and write down the step in `todo_write` so a long session does not drift.
4. Fix the cause, not the symptom: a defensive check that hides a broken caller is a new bug with better manners.
5. Use the project's own checks. Run the narrow test for the change, then the package suite when a shared contract moved; never install a new framework or tool to get a green.
6. Report: the behavior, the test that now proves it, what was removed, and what remains untested.

Upstream reference: CEditNeuro's `ub-mode` (UB2 practice, adapted).
