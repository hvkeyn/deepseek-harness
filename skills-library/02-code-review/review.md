# Review a change

Use this before saying a code change works.

1. git_diff the files you changed. Quote the important hunk, not the whole diff.
2. Run one check that would fail if the change were wrong: a test, a command, or reading the file back.
3. Say what you checked and what you did not run.
4. A failed command stays failed. Do not run it again unchanged.
