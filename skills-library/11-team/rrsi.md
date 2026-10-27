# Harness self-improvement

Use this when the user asks the agent to improve its own prompts, skills, tools, memory, or control notes. The model stays as it is. Only the harness around it changes. The measurement is the Doctor report. That report reads tool failures and the same problem showing up again in the chats and texts. A score you invent does not count.

1. Ask the user to press Doctor if status has no report. load_tools group=harness. harness_rrsi action=status. Quote the repeated failures from the tools, the chats, and the texts, the budget, and whether this report is the baseline or a new measurement.
2. One hypothesis names one component and one failure printed in the baseline report: prompt, control_flow, config, output_plumbing, context_mgmt, client_tool, skill, memory, or subagent. Do not bundle more edits than the budget. Name the kind of failure, not one sentence from a chat.
3. harness_rrsi action=screen on the draft. If it says leak, rewrite. A draft that names one task, one chat, one expected answer, a hidden test, or a benchmark suite is a leak. That is overfitting. Reject it.
4. Change the harness. Let a run finish. Ask the user to press Doctor again. Then harness_rrsi action=judge. Do not pass a score. Judge reads the new Doctor report, including the chats and texts. Save the draft only when the tool says admissible. A reject is final for that hypothesis.
5. A component listed under prune is removed: delete_skill or drop that note. Do not add it back in the same round. A stall line means the next edit goes on an untried component.
6. The model weights are not trained. Do not claim a benchmark number this phone did not measure. When the harness edit is done, use_skill name=rrsi scope=app on=false.
