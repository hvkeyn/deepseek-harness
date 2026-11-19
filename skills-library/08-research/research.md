# Research

Use this for a study question, a check of a claim, or building something that has to be measured.

Stay on this one agent. Do not start another agent.

1. Restate the question in the user's language. research_log kind=question.
2. Write one hypothesis that could be wrong. research_log kind=hypothesis.
3. Check it with a project file, one command, or one page. research_log kind=evidence and include the path or URL you actually opened.
4. Say what the check showed. research_log kind=check. A number that no tool printed is unchecked.
5. If the task is to build, change the project, then research_log kind=build.
6. research_report writes the short result: question, what was checked, a markdown table when numbers exist, and what is still open.
7. One scheme is research_figure, a single small SVG.

Do not invent a DOI, a citation, or a measurement. Write the report in the user's language.

Numbers go through calculate. A fact, paper, or DOI goes through reference before it is cited.
open_file shows research/report.pdf to the user when the report is ready.

A chart of measured numbers is research_plot. Send the data; the app draws the SVG.

Studying a page or a scheme: use_skill deep-read. A code change: use_skill review. A failure: use_skill debug. A key or another app: use_skill security.

Deep path. Use this when the question needs several sources: a survey, a comparison, or a claim that has to be checked against pages. A single file or a single measurement stays on the short path.

Do not stop, and do not ask to continue, until research_run says pass. If the chat ends, the next chat calls research_run action=status and continues at the printed step. The sources stay in research/sources.md. Search them with grep before fetching the same page again.

Stay on this one agent. Do not install a research package and do not run pip, npx, or a downloaded program. Do not start another agent.

1. load_tools group=study. research_run action=open with the question copied from the user and tier=light or tier=full. light is a fact, a list, or a comparison. full is an argument that could be wrong. A request for a dissertation is still tier=full on this phone: one report, then stop. Do not promise tens of thousands of words or hundreds of sources.
2. action=plan with the atomic questions separated by |.
3. Each source is action=source with title, locator, quote, and claim. The locator is a URL, a DOI, an arXiv id, or a project path that a tool printed in this run. reference searches wiki, arxiv, and doi. http_request reads one public page and only that page: a ClinicalTrials.gov study, an EDGAR filing, an Open Library book record, or a statistics table. Quote only words that tool returned. A second copy of the same title or the same locator is a reprint and does not count. light stops at 8 independent sources. full stops at 24. Do not fetch past the cap.
4. full only: action=tension names two sources that disagree, or text=none after those two were compared and they agree.
5. action=draft writes the report once, in the user's language. Later changes are action=patch of one exact span. Do not write the report over from scratch.
6. Critics, one at a time, action=critic. light needs name=cite. full also needs name=independence and name=gap. cite asks whether each quoted sentence is in that source. independence asks whether a reprint was counted twice. gap names the one source that would overturn the draft, or says none was found.
7. action=cite for each sentence you attribute: the source id, the sentence, and supports=yes or no. supports=yes is refused when the sentence does not share the quote's words or a number the quote printed. A reprint is not cited as a second witness.
8. action=pass. It refuses while a step is missing, a cited sentence is unsupported, or the independent sources are under 3 for light and 8 for full.
9. research_report copies the finished draft into research/report.md. open_file shows research/report.pdf when that file exists. When pass is printed, use_skill name=research scope=app on=false.

A number goes through calculate. Do not invent a DOI, a citation, or a measurement.

If action=source says the locator was not printed by a tool, stop calling action=source. Do not guess another locator. A reference result of Not found is final for that query.
