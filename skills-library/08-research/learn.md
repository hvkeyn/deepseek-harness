# Learn a subject

Use this when the user wants to learn a subject, be taught, or practice until they can explain why something follows. Switch it off when the task is not a lesson. Adapted from Zproger/ConceptLoom (MIT).

The model teaches. learn keeps the question, the score, the notebook, and the place to resume. Do not show an answer, a rationale, or an expected key before the learner answers. Write the lesson in the user's language.

1. load_tools group=learn.
2. Locate. Turn the wish into one observable result. Short checks find what is already secure and where it gets uncertain. A wrong answer is a clue. An admitted gap counts more than a guess.
3. Weave. One route from a secure idea, through the link it needs, to the new idea and the result. Show it and wait for approval. Then learn action=save with phase build and the first next step. Only then teach.
4. Build one link at a time. Why it is needed now. Derive it from what is already secure. Say what it follows from. Then one check.
5. A check is learn action=frame. A choice check has at least two lines of key and label, and one expected key. An open check, free-recall or prediction or debugging or transfer, has one criterion per line. Show only the prompt, the choices, and the escape the tool printed.
6. After the answer, learn action=assess with the token. A choice sends the selected key. An open check sends the response and a verdict of accurate, needs-repair, or knowledge-gap. Pass the session, the concept, and the next step in that same call. accurate is provisional. needs-repair rebuilds that link and checks again. knowledge-gap teaches the gap. The escape key admits a gap.
7. Confidence from 0 to 100 is optional. A high confidence on a wrong answer needs a counterexample.
8. After every learner reply, save before the next explanation or question. On continue, learn action=load first and resume from the saved next step. Do not repeat a secured point.
9. At the start of a resumed lesson, learn action=due. Review a due concept from memory, in a different format, before opening the notebook.
10. learn action=notebook starts the notes. action=note records the goal, a secured link, a result, or a diagram. Do not copy the whole chat.
11. action=diagram or action=map returns a block. Show that block. One diagram, one idea.
12. Check an uncertain fact with http_request or web_search before it enters the route. Quote the page.
13. When the lesson pauses or ends, use_skill name=learn scope=app on=false.
