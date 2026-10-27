---
name: deep-read
description: "Use this when a code change or bug requires understanding a module properly: entry points, ownership, data flow, and tests, before editing anything."
---

# Read a codebase deeply before changing it

Use this when the task is to understand how something works, or when a fix needs more than a local patch.

1. Locate the entry points with `glob` and `grep`, not by opening files at random: find `export`, `apply`, route registrations, and the package's `package.json` scripts.
2. Read the entry file and the module README in full with `read`; list the services, events, and files it touches. Write the path in a `todo_write` item so the trail survives a long session.
3. Follow one flow end to end: caller → service → storage or transport → observable result. Note the ownership boundary and who disposes what.
4. Check the tests that pin the behavior (`grep` for the function name in `tests/`); a test that does not exist is a gap worth naming.
5. Write the understanding back in three parts: what it does, how it does it, and what would break it. Cite file paths with line numbers. Do not edit code in this step.
