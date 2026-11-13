# REA: reverse engineering software systems

Use this when a desktop app, native binary, JavaScript or Electron app, .NET assembly, APK, firmware image, packaged Python app, Unity/Godot game, or recorded runtime must be understood as a system: a feature, a protocol, a data format, a build difference, or a behavior. REA 6.8.0 (MIT, morluto/rea) is the reference toolkit. It is not installed on this phone; the local `reverse-engineering` skill is the phone fallback.

## Where REA runs

REA is a local MCP server and CLI. It needs Node.js `^22.23.4 || ^24.22.1 || >=26.12.1` and npm. The supported agents are Claude Code, Codex, Cursor, Gemini CLI, Grok Build, and other MCP clients.

- First setup on the user's own computer: `npx rea-agents@latest setup`. Review the changes, approve the MCP registration, restart the agent.
- Global CLI: `npm install -g rea-agents`, then `rea --help`.
- Update: `rea update`, or refresh setup with `npx rea-agents@latest setup`.
- Node 23 and 25 are not supported. Do not upgrade Node silently; tell the user.
- Deep native analysis uses an existing Hopper, Ghidra, or IDA installation. Static JavaScript and .NET inspection do not require a native engine. Do not install a commercial tool or a cracked copy.
- The phone cannot run this MCP stack. If a user-owned PC is connected, `remote_put` the sample or path and run the CLI with `ssh_exec` on that PC. Do not send the sample to a third-party server.

## Choose the target workflow

| Target | What to inspect | Requirement |
| --- | --- | --- |
| Desktop install | Runtime candidates, support files, component markers, next probes | built-in bounded directory inspection |
| Native binary | Pseudocode, assembly, strings, symbols, calls, references | Hopper, Ghidra, or IDA |
| JavaScript / Electron | Modules, imports, source maps, routes, IPC, native add-ons | Node and npm |
| .NET assembly | Metadata, CIL, native dependencies, build comparison | static only |
| APK | Manifest, classes, decompiled methods, references, signatures, resources | headless JADX and a full JDK; optional Apktool |
| Android device | Packages, processes, logs, dumps, screen, APK/file transfer | caller-supplied adb |
| Go / Rust / Swift | Embedded build identity, modules, dependencies, symbols | built-in static inspection |
| Unity IL2CPP / Godot PCK / PyInstaller / Node SEA | Metadata, archive inventory, entry scripts, bytecode | built-in static decoding |
| GPU / model / WASM / SQLite / firmware | Code objects, model metadata, imports, tables, regions | built-in or caller-supplied tool |
| Website / capture | Page structure, scripts, requests, responses, source locations | Chrome-family browser or HAR/SAZ |
| Process behavior | Terminal output, interactions, exit, filesystem, comparisons | Linux/macOS PTY |

Pick the narrowest workflow that can answer the question. Do not start a native provider for a JavaScript route, and do not use a runtime capture when static files already answer it.

## Evidence protocol

REA returns canonical Evidence, not just prose. Read `normalized_result` for the operation and `evidence_id` for its identity. `raw_result` is a provider-specific representation and may be null. Keep limitations and coverage; they are part of the answer.

- `analyze_function` returns a retained summary by default in 6.8.0. Ask for `detail: "complete"` only when you need the full dossier; use `inspect_analysis_view` to page a summary or a large collection.
- Compare only compatible Evidence. `compare_functions` accepts a complete dossier; a summary is rejected. Use the retained `evidence_id` for a dossier, not the summary.
- A coverage status of `unknown` or `partial` is not equality. Do not turn a missing observation into a negative fact.
- MCP input schemas are compact by default. Set `REA_MCP_INPUT_SCHEMA_PROFILE=full` when a field is ambiguous; do not guess a parameter shape.
- Save large Evidence to a file and project a summary/page; do not paste hundreds of megabytes into the chat.

## Investigation

1. State the feature or behavior, the target build, and the authorization. A lawful sample the user owns or may inspect; no DRM bypass, no stolen license, no third-party system.
2. Fingerprint first: file type, architecture, version, signature, hashes, install layout, runtime. Record what is packed or stripped.
3. Static first: strings, symbols, imports, manifest, routes, source maps, metadata, archive inventory. Do not run an unknown sample on the daily phone.
4. Trace the feature: entry point -> callers/callees -> data -> external boundary. Keep a call path and file/offset references.
5. Use dynamic capture only in an isolated environment and only when static evidence is insufficient. Do not contact a live command server or replay credentials.
6. Reconstruct: pseudocode, data structures, protocol messages, constants, state machine, test vector. Reimplement in a small harness and test it.
7. Report evidence, unknowns, limitations, and the smallest next probe. A decompiler output is not source code.

## 6.8.0 specifics

- Agent environments can be built from network captures, browser scenarios, or a prompt; derived reads and evidence-gated writes can be served and compared with fresh captures.
- More static formats: GPU code objects, BEAM, Python bytecode, Unity IL2CPP metadata, Godot PCK, PyInstaller, Node.js SEA, devicetree, and more PE/ELF tables.
- Retained summaries and selected fact queries keep a large investigation bounded; complete Evidence remains available.
- Breaking changes to know: `analyze_function` default summary; JSONL metadata record; `environment-serve` serves derived state unless `--replay-only`; MCP schemas compact by default; Node 23/25 unsupported.
- Use the release tag `rea-agents-6.8.0` when pinning; do not mix output from an older version without saying so.

## Quality and safety

- Every claim gets an Evidence location, a function/offset, or a test vector. Unknown stays unknown.
- A suspicious string is not a backdoor; a trigger and an action path are.
- No live C2, no credential replay, no exploitation, no bypass of a license or paywall.
- Keep the sample outside the project and delete it when the investigation is done. Hash the original and every patched copy.
- On this phone, use `reverse-engineering` and local tools; do not install Node, npm, Hopper, Ghidra, or IDA here.
- If a PC is not available, stop at static phone analysis and say so.

## Output

1. Target and authorization.
2. Workflow and tool version (REA 6.8.0, provider).
3. Evidence chain: feature -> function/offset -> observation.
4. Reconstruction and test vector.
5. Unknowns, limitations, and one next probe.
