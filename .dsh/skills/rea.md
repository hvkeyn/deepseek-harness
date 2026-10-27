---
name: rea
description: "Use this when a binary, an Electron or JavaScript application, firmware, or a shipped format must be understood down to code and evidence with REA 6.8.0."
---

# Reverse engineer a target with REA

Use this when the user asks how a feature works below the source level: a desktop application, an Electron bundle, a binary, firmware, or a shipped format.

1. Establish the target and the question: an absolute path, the feature, and what evidence would answer it. Do not start analysis without a path.
2. Check that REA exists: `pwsh` with `rea --version`, else `npx -y rea-agents@6.8.0 --version`. Install only when the user agrees: `npm install --global rea-agents@6.8.0` (Node 22+). When the `mcp__rea__*` tools are visible instead, they come from a configured MCP server and are preferred over shell commands.
3. Start with the narrowest read. For a JavaScript or Electron application: `rea analyze-javascript-application "<abs path>" --json` and keep the evidence paths. For a native function: `rea analyze_function <target> --detail complete --evidence_output <file>` and cite the file.
4. Work from evidence only: quote the address, offset, or module that supports a claim. Mark a guess as a guess. When a provider is missing (Ghidra, JADX), say which one and stop instead of installing it silently.
5. Report in layers: what the target does, the mechanism that does it, the evidence location, and the confidence. A summary without evidence is not a result.
6. Ask before any step that writes outside the workspace, spawns a GUI tool, or uploads the target anywhere.
