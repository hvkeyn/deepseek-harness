---
name: systematic-debugging
description: "Use this when a failure is longer than one line and a patch must wait for an established cause."
---

# Debug systematically

Use this when something fails and the cause is not obvious from one command: a test that passes alone, a build that breaks on CI, or a behavior that appears intermittently.

1. Reproduce on purpose: run the failing command with `pwsh`, copy the exact error line, and write down the environment (branch, version, platform). A failure you cannot reproduce is not yet a bug you can fix.
2. State one hypothesis at a time, naming the component and the evidence that would confirm it. Write it as a `todo_write` item so a long session does not lose it.
3. Test the hypothesis with one read (`read`, `grep`) or one command (`pwsh`). If it is disproved, record that and form the next one; do not patch on a guess.
4. Reduce before fixing: shrink the failing case until it still fails, then fix the smallest cause. After the fix, run the same reduced case and the original one.
5. Report: the exact failure, the hypothesis that held, the evidence, the fix, and the checks that now pass. Keep any earlier hypothesis that turned out wrong in the report — it explains why the obvious answer was not the cause.
