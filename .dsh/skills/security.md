---
name: security
description: "Use this when the task touches keys, logins, accounts, or another application's data."
---

# Handle secrets and other apps safely

Use this when the task touches keys, logins, accounts, or another application's data.

1. Never write a token, password, API key, or private certificate into a file, a skill, a commit, or the chat. Refer to credentials by name and let the user provide them at run time.
2. Read files a task genuinely needs — the shell can — but do not paste their secrets into output; quote the shape of the value, not the value.
3. Do not invent permissions, scopes, or configuration you did not observe. If a step needs a right the environment does not have, say which one and stop.
4. A failed host, command, or login is not retried unchanged: report the failure with the exact message and one next action.
5. Before finishing, check that the change did not add a secret to the repository: search the diff for key-shaped strings.
