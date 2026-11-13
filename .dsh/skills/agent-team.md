---
name: agent-team
description: "Use this when a task needs more than one independent pass, a risky change needs a reviewer, or the user asks for a team or a double check."
---

# Work as a team

Use this when independent parts can run in parallel: research on two questions, a review beside a test pass, or a risky change that needs a second reader. A single local edit stays a single agent.

1. Split the work by independence, not by size: one helper per question that can be answered without the other's result. Two helpers reading the same file is one helper.
2. Use `subagent` (fresh context) for a self-contained task and `subagent_fork` when the helper must see this conversation. Give each one the goal, the entry path, and what to return; never a vague "look at the repo".
3. At most three read-only helpers at once. Only the main agent writes files. A helper that must edit gets an explicit, disjoint file set and reports the diff.
4. Ask for evidence: the file and line, the command and its output, the check that ran. A helper's claim is a lead until you re-run the check that matters.
5. Merge by fact: keep the strongest evidence per claim, drop duplicates, and name what was not examined. A disagreement between helpers is reported, not averaged.
6. For a repeating multi-step orchestration, use the `workflow` tool instead of hand-rolling turns; for one or two delegations, plain `subagent` calls are cheaper.
7. Stop the team when the pieces are done; do not keep helpers idle or use them to double-check a command you already ran.

Upstream reference: CEditNeuro's `agent-team` (starter).
