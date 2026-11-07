---
name: agent-autoloop
description: "Use this when a background agent loop must run on a PC with rules, approvals, and durable events, not as a one-shot session."
---

# Run a supervised agent loop

Use this when work should continue on its own: a nightly check, a watch-and-fix loop, a queue of tasks. This is a supervised loop, not an autonomous daemon.

1. Define the loop before starting it: the trigger (interval, new commit, failing test), one unit of work per iteration, the stop condition (success, N failures, time budget), and who is told. A loop without a stop condition is not started.
2. Prefer the platform's own scheduling: `schedule_create` for time-based runs, `job_output` for a long command, `subagent` for one bounded iteration. Do not invent a daemon when a scheduled session does what the task needs.
3. Each iteration must be independent and idempotent: read the state it needs, make one change, verify it, write a log line. A crashed iteration must be safe to repeat.
4. Approvals: destructive actions (delete, push, publish, spend) stay manual. The loop may prepare a diff and stop; it does not merge on its own.
5. Durable events: append to a log the iteration number, the action, the check result, and the next step. On restart, resume from the log instead of guessing.
6. Watch the cost: bound iterations, cap output size, and stop on the same failure twice — a loop that retries the same error burns the budget for nothing.
7. Report: the trigger, iterations run, successes and failures, the log path, and the current state. Never report a loop as healthy without its last iteration's evidence.

Upstream reference: CEditNeuro's `agent-autoloop` (KKKKhazix/agent-autoloop, MIT); that Node 24 kernel is not required here.
