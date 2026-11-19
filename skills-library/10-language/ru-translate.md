# Translate into Russian

Use this when the user wants a text translated into Russian, or Russian text polished: an article, a book, a game, or a program. Switch it off when the task is not translation.

Do not stop before the state file says pass. A filled file is not a finished translation. The Russian must read as a person wrote it.

1. Write `.ceditneuro/translate/state.md` and update it after every batch: kind, source paths, level, the next batch, and pass yes or no. While pass is no, do that next batch in this same run. Do not ask the user to continue. Do not end the turn with a plan. Do not jump back to the first line. A failed tool is not retried with the same arguments.
2. Do not overwrite the original. Write Russian beside it, in a ru folder or a name ending in .ru. A game or a program adds a Russian slot and does not replace English, Japanese, or Korean.
3. Before the first batch, write a canon note: who speaks to whom, ты or вы for each addressee, one Russian word per term, and what stays as printed (person names, formulas, code names, URLs, hex colors, format tags). For a speaker with many lines, add three voice notes.
4. Translate in order, about forty lines or one chapter, with the previous and next line in view. Keep tags as they are: newline codes, {0}, %s, %d, and backslash color codes. Do not finish a sentence the source cut off. Do not add a plot event, a citation, or a brand.
5. One source meaning stays one Russian word, inflected. Two Russian names for one term is a hole. One Russian sentence on two different source lines is a hole. Fix that class across the file, then check the level again. Do not retranslate the whole work.
6. On each batch, read the source beside the Russian. Fail a line when a fact changed, the word is the wrong sense, a person would not say it, the voice or gender is wrong, the neighbors do not connect, a tag moved, or the line does the wrong job. Awkward but grammatical still fails.
7. After the source language is gone, still fix English word order, «свою руку» when the source did not contrast possession, a verb turned into a noun to save space, and a jump between ты and вы. Cut a stamp, not the fact: смесь гордости и страха, едва слышным шёпотом, маяк надежды, осуществить, важно отметить. Do not move a scene or change an ending to sound human. Ellipsis is …. A dash in speech is —. Quotes are « » and inner quotes are „ “. Use ё.
8. A stiff line gets three new Russian versions. Keep the one a person would say that still matches the source. Do not keep the first draft because it is close.
9. Climb in the same run. Do not say done at P0, P1, or P2.
P0. Tags match. No leftover sentence in the source language.
P1. One address form per person. Gender matches the speaker and the person spoken to. «ты нашли» is wrong. After a digit, раз or раза matches the number, never раз(а). An adjective matches its noun.
P2. A button is a short imperative: Начать, Продолжить, Сохранить, Выйти. Options is Настройки. Controls is Управление. A setting label is a noun. Do not pad a button to sound literary.
P3. The line is speech or clear prose, not a gloss. Check the whole dialogue, not a short sample. Three versions on every stiff line.
P4. Book or game: retell from the original, then from the Russian. Article: one sentence of the claim, checked against the source. Fix a hole, then retell again.
P5. Read three samples from the start, the middle, and the end. If one fails, fix that kind through the file and read three new samples.
P6. Game or program: search the Russian files for a user-visible sentence still in the source language. The search is done only when it is empty. Do not ask for a screenshot. Do not say a screen was checked.
10. Article. Keep authors, years, formulas, units, figure numbers, and the citation as printed. Translate the argument, the abstract, and the captions. The reference list stays a bibliography. Pass is P5.
11. Book. Chapters in order, and do not stop between them. The translation is a file. reader_note is only a margin note. Pass is P5.
12. Game. Dialogue is a chain. A button is an order. A settings screen is neutral. A nameplate is not the word inside the line. Casual speech to the player is ты. A system line with no character stays neutral. Wait as a guard is Защита. Wait as skip is Ждать. Escape is Побег. End Turn is Конец хода. Do not translate sprite ids, file names, or hex colors. Add the menu item Русский. Pass is P6.
13. Program. Translate strings a person sees, in the locale file. Translate a comment only when asked. Do not rename a function, a variable, or a key. A placeholder stays where it is. Run a test the project already has. A failed command stays failed. Pass is P6.
14. When the state file says pass, call use_skill name=ru-translate scope=app on=false.
