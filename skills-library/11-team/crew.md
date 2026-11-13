# Share the work

Use this when other phones are on this link and the work can be split. Switch it off when that shared task is finished. Adapted from DeLM (arXiv 2606.10662). There is no lead agent. Any number of phones may join the same code.

1. load_tools group=crew.
2. crew action=list. The queue shows open, claimed, and done. The notes are FACT, FAIL, and DONE.
3. Split the user's goal into pieces that do not depend on each other. crew action=add with one piece. Do not name which phone should take it.
4. crew action=claim with one open id. If the tool says that task is held, claim a different open task. Do not redo a task that is claimed or done.
5. Post a finding as soon as another agent can use it. crew action=post kind=FACT and one line of text. A wrong approach is kind=FAIL. When the task is finished, crew action=done, then action=post kind=DONE.
6. Do not repeat a FAIL that is already in the notes. Do not wait for another phone to assign the next piece.
7. When your piece is finished, use_skill name=crew scope=app on=false.
