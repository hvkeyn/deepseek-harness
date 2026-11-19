# Find the cause before the fix

Use this when something fails: a test, a build, a crash, or behavior the user did not expect. Switch it off when the task is not a failure.

Do not stop, and do not ask to continue, until debug_case says pass. A guess is not a cause. A change that hides the symptom is not a fix.

1. Call load_tools group=debug. Call debug_case action=open with the symptom in one sentence and the steps that should show it.
2. Reproduce. Run the check the user saw fail: a test the project already has, run_command, or read_file of the error. Call debug_case action=reproduce with that check and result=fail. If it does not fail, stop. Do not invent a fix for a failure you did not see. If it fails only sometimes, result=flaky, find the condition, and reproduce again. Do not guess.
3. Facts before theories. git_diff for what changed. read_file the stack frame. grep the bad value back to the line that created it. Each one is debug_case action=fact with source set to the tool and the path. Quote the line. Do not invent a line number.
4. One hypothesis: debug_case action=hypothesis. Then one smallest check, action=test with that id and result=supports or rules-out. A ruled-out idea is not patched. A new idea is a new hypothesis. Do not change two things in one test.
5. The cause is one sentence, action=cause, and only after a test supports it. Say where the bad value starts, not only where it crashes.
6. The fix is the smallest edit of that cause. No extra cleanup. action=fix names that one edit.
7. Run the same check that failed. action=verify with that same check. result=pass is the only way the case says pass. A different check does not count. If it still fails, return to the facts. After three failed fixes the tool stops you: question the design with the user, and do not try a fourth patch.
8. Say what you ran and what you did not run. A failed command stays failed. Then use_skill review, and use_skill name=systematic-debugging scope=app on=false.

An Android screen uses android-debug, and the verify check is that same screen, not only a unit test.
