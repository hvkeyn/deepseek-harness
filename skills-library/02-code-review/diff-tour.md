# Diff tour

Use this when a branch, commit, pull request, working-tree diff, or a change the agent just wrote must be explained visually, reviewed, or handed to someone who will own it. A one-line fix is review; a tour is for a change whose why is not obvious from the diff.

## Read before you draw

1. Collect the change. `git_status` for the branch and dirty files. `git_diff` for the working tree or the index. For a branch or a commit, `run_command git diff BASE..HEAD` and `run_command git log -1 BASE..HEAD` when git is installed; if it is not, tour the working-tree diff and say so. Record the real base and head refs.
2. Read around every hunk with `read_file`. Read the unchanged files on the path: the caller, the schema, the test, the config. Do not explain a function you did not read, and do not quote a line you did not see.
3. Say the purpose in one sentence: who has a problem, what changes for them. Then name the three promises the old code kept that this change must not break.
4. Map the files: core, mechanical, test, config, docs. A changed line in a mechanical file gets a quick look; the core file gets the tour. Include unchanged files that are part of the flow.
5. If the diff is over 30,000 characters or 20 files, split it into chapters and say what was skipped. Do not dump a whole file.

## Build the tour data

The portable format is diff-tour v1 (MIT, github.com/init-co-jp/diff-tour). A saved tour is one JSON object:

```
{
  "version": 1,
  "title": "What this change is for",
  "base": "main",
  "head": "feature/x",
  "chapters": [
    {"title": "The change", "steps": [
      {"title": "Two commits, one feature", "blocks": [
        {"target": true},
        {"quote": "the commit message, as a claim to check"},
        {"p": "Who has the problem and what changes.", "basis": "fact"}
      ]}
    ]}
  ]
}
```

Every step has a title and a non-empty `blocks`. Every block has exactly one kind:

- `p` with optional `basis`; `quote`; `list`; `pre`; `table` with `head` and `rows`.
- `code` with `file`, `lines` as two line numbers, optional `show` as two numbers, optional `note`, optional `marks` of `line` and `text`. `at` is `base` or `head`; default `head`.
- `diff` with `file` and optional `hunks` as indexes.
- `snippet` for code that is not in the repository; its `label` must say it is an example, and `lang` is optional.
- `schema` with `migrations`, optional `tables` and `focus`; `rows` with `label`, `head`, `data`, optional `tag` and `added`.
- `flow` with `nodes`: `label`, optional `kind` (`same`, `changed`, `new`, `external`), optional `note`, optional `next`, optional `start`.
- `timeline` with `lanes` (1 to 4) and `events`: `lane`, optional `to`, `text`, optional `mark` (`ok`, `bad`, `note`).
- `files` with `roles`: `file`, `role` (`core`, `mechanical`, `test`, `config`, `docs`), optional `note`.
- `target: true` only on the first step that names the change.

`basis` is only on `p`: `fact` (verified by code, tests, or commit messages), `inferred` (read from the structure), `opinion` (a senior view). Use the same words in the visual page: **Verified**, **From the code**, **Senior view**.

A question step sets `question: true` and its blocks only ask; the next step answers. Do not put `asks` on the question step or the step before it; the question wording must not reveal the answer. After the answer, the next chapter moves on.

Check every file and line before you save: `read_file` the range, `grep` the symbol, `git_diff` the hunk. The real `tour` checks refs when it plays the JSON; a wrong line is worse than no line. If the change is uncommitted, the JSON has no real head: keep the visual page and do not fake a ref. A saved JSON is for a committed branch or commit.

## Draw the chat card

Call `layout` with a compact HTML card; the tool wraps it and returns a fenced block that must be reproduced unchanged. The card is the visual summary in the chat, not the whole tour. Keep it under 12,000 characters and use inline styles only, with no script and no event handler. A useful card has:

- the tour title, `base → head`, and the one-sentence purpose;
- the chapters with step counts;
- file chips with the role (core, mechanical, test), at most eight;
- one flow row: boxes with arrows drawn with text or simple table cells, including one unchanged box;
- the top three findings with `must`, `suggestion`, or `nit`;
- the line `Full tour: tour.html`.

LayoutCard draws on white. Use `#1c1b1f` for ink, `#5f6368` for muted, `#0b6bcb` for accent, `#d0d7de` for a rule. No remote font, image, or script.

## Write tour.html

Write one self-contained `tour.html` in the project with `write_file`, then open it with `open_file` (call `load_tools group=device` first if it is not loaded). The page is the full visual tour; the app preview runs no script, so use HTML and CSS only. Anchors and `<details>` work.

The page order:

1. Header: title, `base → head`, purpose, and a legend for **Verified**, **From the code**, **Senior view**.
2. Contents: links to each chapter and step. Use `id` on every step.
3. Each chapter: a short lead, then each step with a number, title, prose, code or diff, marks, and one visual (flow, timeline, table, schema, or file map).
4. A question step: the question is visible; the answer is inside `<details><summary>Think first</summary>...</details>` on the next step, so the reader can answer before opening it.
5. Findings: a table with severity (`must`, `suggestion`, `nit`), the finding, and the evidence line. Then what looks risky but is fine and why, what is done well, and whether the change makes the codebase better.
6. Footer: what was not read or not run, and one line of confidence.

Style that works on the phone preview:

```
body{max-width:920px;margin:0 auto;padding:24px;background:#fff;color:#1c1b1f;font:16px/1.55 system-ui,sans-serif}
h1{font-size:28px;line-height:1.2} h2{margin-top:32px;border-bottom:1px solid #d0d7de;padding-bottom:6px}
.step{border-left:3px solid #d0d7de;padding:8px 16px;margin:20px 0}
pre{background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:12px;overflow:auto;font:13px/1.5 ui-monospace,monospace}
.add{background:#e6ffec;color:#116329}.del{background:#ffebe9;color:#82071e}
.chip{display:inline-block;border:1px solid #d0d7de;border-radius:999px;padding:2px 9px;margin:3px 4px 3px 0;font-size:13px}
.flow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}
.box{border:1px solid #d0d7de;border-radius:6px;padding:8px 10px;background:#fafbfc}
.changed{border-color:#0b6bcb}.new{border-color:#116329}.external{background:#f6f8fa}
.badge{font-size:12px;border-radius:4px;padding:1px 6px;background:#eef2f6;color:#5f6368}
.must{color:#b42318;font-weight:600}.suggestion{color:#9a6700}.nit{color:#5f6368}
```

Show focused code, not a whole file: the hunk plus two lines of context, with line numbers and marks. Mark a removed line as `del`, an added line as `add`, and label unchanged code `unchanged`. A code block that is not in the repository gets a visible **Example** label. A diff line must come from `git_diff`, not from memory.

Do not read `.env`, credentials, ignored files, or anything outside the project for a tour. Do not copy a secret into the page; name the field and its location only.

## Senior questions

The tour exists to show how a senior reads the change. For each chapter, ask and answer:

- What promise did the old code keep, and does the new code keep it?
- What happens on a failure, a retry, a double click, or two requests at once?
- Can it be rolled out and rolled back safely?
- Who can call it, and with what input? What is the trust boundary?
- What happens at 100 times the data or a slow dependency?
- Is the next change easier or harder after this one?
- Would the tests fail if the code broke? Name the test that covers each promise; if none, say so.

Findings are `must` (blocks the change), `suggestion` (worth doing), or `nit` (style). Say what looks risky but is fine and why. Say what is done well. End with whether the change makes the codebase better overall.

## Verify and report

- Every file, line, symbol, and test in the tour was read in this run. A failed command stays failed; do not rerun it unchanged.
- Do not claim a test passed unless you ran it. Say what was not run.
- If the tour JSON cannot be checked, keep the HTML and say the JSON is unverified.
- The final message names the base and head, the chapters, the top findings, what was not read, and how to play the JSON on a computer with `tour tour.json`.
- This phone does not install Go, the diff-tour TUI, or a terminal renderer. The HTML page and the chat card are the visual tour here; the JSON is for a PC that already has `tour`.

## Output order

1. `layout` card in the chat.
2. `write_file` `tour.html`, then `open_file` it.
3. `write_file` `tour.json` when the base and head are real refs.
4. A short report: base, head, chapters, findings, gaps, and the PC command.
