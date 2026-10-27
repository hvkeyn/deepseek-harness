---
name: diff-tour
description: "Use this when a review must walk a change: what the diff does, which callers it reaches, and which check proves it."
---

# Walk a change as a tour

Use this when the user asks to review a diff, a branch, or a pull request, and wants the reasoning rather than a list of files.

1. Read the change, not the summary: `pwsh` with `git status --short`, `git diff --stat`, then `git diff -- <path>` for each file that matters. Quote the hunk that carries the behavior.
2. For every changed function, find the callers with `grep` and say whether they still hold: arguments, ownership, cancellation, error paths. A change is not local until its callers agree.
3. Separate behavior from mechanics: a rename, a moved file, or a formatting change gets one line; a changed contract gets its own paragraph with the old and the new guarantee.
4. Name the check that proves the change: a focused test, a typecheck, or a command. Run it with `pwsh` and report the exact result. If nothing proves it, say so — a review without evidence is an opinion.
5. Close with what you did not examine, and why. Do not claim the change is correct beyond the checks that ran.
