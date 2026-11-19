# Understand anything

Use this when a repository, a subsystem, or a documentation or wiki tree must be understood as a whole: its architecture, files, symbols, dependencies, layers, a guided reading order, or the impact of a change. For one document use deep-read; for a visual tour of a diff use diff-tour; for a binary and its hidden logic use reverse-engineering.

This is the phone adaptation of Understand Anything (MIT, github.com/Egonex-AI/Understand-Anything). The original is a Claude Code plugin: a Node and pnpm pipeline with tree-sitter, five analysis agents, and a React dashboard. Do not install Node, pnpm, the plugin, or its viewer on this phone. Build a smaller, evidence-based knowledge graph and a static visual page with the tools already here. The original desktop viewer can be used later on a PC if the graph matches its schema.

## What you produce

- `.ua/knowledge-graph.json`, or `.understand-anything/knowledge-graph.json` when that directory already exists. Keep the legacy directory when present; do not migrate it silently.
- `.ua/understand.html`: a self-contained, static dashboard (no script) with layers, a map, node summaries, edges, and the guided tour.
- A compact `layout` card in the chat with the project, counts, layers, core nodes, and the first tour step.
- Optional `.ua/diff-overlay.json` for a change-impact view.

Never write generated files into a source folder. Keep `intermediate/` and `diff-overlay.json` local; the graph itself may be committed by the user.

## Budget and scope

1. Resolve the project root. Use the open project unless the user names a path. Read `git_status` and, if git is installed, `run_command git rev-parse HEAD` for the commit hash.
2. Respect `.understandignore`, `.gitignore`, and the user's exclusions. Always skip `.git`, `build`, `dist`, `node_modules`, `.gradle`, `vendor`, generated code, caches, `.env`, keys, credentials, and customer data. A sensitive config is named by its key, never by its value.
3. Bound the work: at most 300 files and 1,500 nodes on this phone. If the repository is larger, analyze the requested folder or the top-level architecture first and say what was skipped. Do not read every file to make the graph look complete.
4. Use `glob` and `list_dir` for the inventory, `read_file` for a manifest or a source file, `grep` for imports and symbols, and `run_command command -v ctags` to see whether a symbol index exists. With ctags, use its tags; without it, extract with targeted `grep` patterns and say the structure is sampled, not parsed.
5. Do not build, test, install, or execute the analyzed project. This is a read-only pass unless the user asks for a command.

## Graph schema

Write one JSON object:

```
{
  "project": {"name": "...", "description": "...", "languages": ["..."], "frameworks": ["..."], "analyzedAt": "2026-10-24T00:00:00Z", "gitCommitHash": "..."},
  "nodes": [
    {"id": "file:src/auth.ts", "type": "file", "name": "src/auth.ts", "filePath": "src/auth.ts", "summary": "...", "tags": ["auth"], "complexity": "medium"},
    {"id": "function:src/auth.ts:login", "type": "function", "name": "login", "filePath": "src/auth.ts", "summary": "...", "tags": ["auth", "entry"], "complexity": "low"}
  ],
  "edges": [
    {"source": "file:src/server.ts", "target": "file:src/auth.ts", "type": "imports", "direction": "outbound", "weight": 1},
    {"source": "function:src/auth.ts:login", "target": "class:src/db.ts:Users", "type": "calls", "direction": "outbound", "weight": 1}
  ],
  "layers": [
    {"id": "layer:api", "name": "API", "description": "HTTP entry points", "nodeIds": ["file:src/server.ts"]}
  ],
  "tour": [
    {"order": 1, "title": "Start at the entry point", "description": "...", "nodeIds": ["file:src/server.ts"]}
  ]
}
```

- Node types: `file`, `function`, `class`, `module`, `concept`, `config`, `document`, `service`, `table`, `endpoint`, `pipeline`, `schema`, `resource`, `domain`, `flow`, `step`, `article`, `entity`, `topic`, `claim`, `source`.
- Edge types: `imports`, `contains`, `calls`, `depends_on`, `configures`, `documents`, `deploys`, `triggers`, `contains_flow`, `flow_step`, `related`, `cites`.
- IDs are stable and type-prefixed: `file:path`, `function:path:name`, `class:path:name`, `config:path`, `article:path`. A name with a space or a colon is normalized, not invented.
- `summary` says what the node does in plain language, from the source you read. `tags` are a few search words. `complexity` is `low`, `medium`, or `high`.
- `layers` cover the whole graph; each node belongs to at most one layer. Use `API`, `Service`, `Data`, `UI`, `Utility`, `Config`, `Docs`; add a layer only when the code supports it.
- `tour` is 5 to 10 steps in reading order, each with node IDs and why the reader is there. It is a lesson, not a file list.

Every edge endpoint must exist in `nodes`. No duplicate node IDs. No edge to a file you did not inventory. If a relation is a guess, write `depends_on` with the summary saying it is inferred, or leave it out; do not invent an `imports` edge.

## Build the graph

1. Inventory. Find manifests (`package.json`, `build.gradle.kts`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`) and the top-level source directories. Record languages and frameworks from the manifests, not from file extensions alone.
2. Files. For each file in budget, add a `file` node: path, one-line purpose, tags, complexity. Skip a file whose purpose you cannot tell; do not summarize a filename as if it were code.
3. Symbols. For the core files, add `function`, `class`, and `module` nodes from `ctags` or targeted `grep`. Add `contains` edges from file to symbol. Add `imports` and `calls` only where the source or the index supports them.
4. Non-code. Add `config`, `document`, `service`, `table`, `endpoint`, `pipeline`, and `schema` nodes for manifests, routes, migrations, deployment files, and docs. Add `configures`, `deploys`, and `documents` edges.
5. Layers. Group by role: entry and routes in `API`, business rules in `Service`, repositories and migrations in `Data`, screens and components in `UI`, shared helpers in `Utility`, environment in `Config`, docs in `Docs`.
6. Tour. Start at the entry point, then configuration, then the core flow, then data, then UI, then tests. Each step names the nodes and one sentence of why. A reader should be able to follow the tour without opening the whole repository.
7. Validate. Read the JSON back with `read_file`; if Python is installed, `run_command python3 -m json.tool .ua/knowledge-graph.json` and check the counts. Check edge endpoints, duplicate IDs, and that every `filePath` exists. Report the count of files read, nodes, edges, layers, and steps.
8. Freshness. Put the current commit hash in `project.gitCommitHash`. On a later question, compare it with `git rev-parse HEAD`; if the repository changed, warn that the graph may be stale and offer an incremental pass over the changed files. Do not pretend the graph is current.

## The static dashboard

Write `.ua/understand.html` with `write_file` and open it with `open_file` (call `load_tools group=device` first if it is not loaded). The app preview runs no script, so use HTML, CSS, and inline SVG only; anchors and `<details>` work.

The page order:

1. Header: project name, description, commit, counts, languages, and a legend for layers.
2. Architecture map: a static SVG or CSS grid with one box per layer and arrows for the main `imports`, `calls`, and `depends_on` edges. Show at most 12 core nodes; the full graph stays in JSON.
3. Layers: each layer with its nodes, a one-line description, and links to the node sections.
4. Nodes: grouped by type, with name, file path, summary, tags, complexity, and incoming/outgoing edges. Use `<details>` for the edge list of a large node.
5. Tour: the ordered steps with node links and why. This is the onboarding path.
6. Gaps: files skipped, language coverage, sampled structure, and what was not run.

Keep it readable on a phone: `max-width: 920px`, 16px body, one column, `pre` for code or paths, and a layer color that is not the only signal (name and icon text too). Use white paper, `#1c1b1f` ink, `#5f6368` muted, `#0b6bcb` accent, `#d0d7de` rule. Do not include a secret, a token, or a customer value.

The chat card is a summary, not the page. Call `layout` with inline HTML: project, counts, the layers, the five most central nodes, the first tour step, and `Full map: .ua/understand.html`. Keep it under 12,000 characters and use no script or event handler.

## Use the graph

- Explain a file or symbol: find its node and source, then its incoming and outgoing edges. Answer with its layer, role, what contains it, what calls it, what it calls, and the data flow. Read the source before explaining; the graph is an index, not proof.
- Answer a question: search node names, summaries, and tags with `grep`; take the matching nodes and their one-hop edges; then read the relevant source. If nothing matches, say so and offer related tags. Do not answer from the graph alone when the question needs behavior.
- Diff impact: get changed files from `git_diff` or `git diff --name-only`; find their nodes, then one-hop upstream and downstream nodes and the layers they touch. Rank risk by complexity and cross-layer edges. Write `.ua/diff-overlay.json` with changed and affected IDs if the user wants the overlay. For the visual review, use `use_skill diff-tour`.
- Onboard: use the tour, then explain each step with the graph and source. Offer a shorter five-step path for a newcomer.
- Domain view: when the user asks for business logic, add `domain`, `flow`, and `step` nodes from routes, handlers, jobs, and docs; connect with `contains_flow` and `flow_step`. Do not invent a domain the code does not show.
- Knowledge base: for a wiki, read `index.md` and its wikilinks; add `article`, `entity`, `topic`, `claim`, and `source` nodes; connect `cites` and `related`. No code execution.

## Quality and safety

- A summary is written from a file you read, not from its name. A structural edge is from an import, a call, or a manifest. Mark inferred behavior in the summary.
- A graph of 300 files is a map, not the whole repository. Say what was skipped and how the structure was extracted.
- Do not read or copy a secret, a private key, a cookie, or customer data. Name the field and its location only.
- Do not install Node, pnpm, the original plugin, tree-sitter, or the viewer on this phone. If the user has a PC with the original plugin, the JSON can be exported there; the phone page is the local visual.
- When the task is only one file, use `deep-read`. When it is a change's visual tour, use `diff-tour`. When it is a hostile binary, use `reverse-engineering`. This skill is for understanding a codebase or knowledge base as a system.

## Output order

1. `layout` card in the chat.
2. `.ua/understand.html` written and opened.
3. `.ua/knowledge-graph.json` written and validated.
4. A short report: files read vs skipped, nodes, edges, layers, tour steps, commit, gaps, and the next question the graph can answer.
