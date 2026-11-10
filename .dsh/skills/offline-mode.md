---
name: offline-mode
description: "Use this when the machine has no internet or an unstable link, or when the work must run on a local model: plan the offline route, use the local corpus, and keep output quality without the web."
---

# Work without the internet

Use this when the network is down, the machine is air-gapped, the user asks for an offline session, or the model runs locally. The goal is not to apologise for the missing web: it is to route every step to what still works and to be explicit about what stays unverified.

1. **Detect before planning.** Run `node tools/offline-check.mjs`. It reports `online`, `hybrid`, `local-only`, or `offline`, and lists the local servers that answer (Ollama `:11434`, LM Studio `:1234`, llama.cpp `:8080`, vLLM `:8000`). Do not guess the mode.
2. **Route by task shape.** Mechanical steps — extract, rename, classify, format, short summaries — go to the smallest local model that answers. Reasoning, long planning, and code review go to the larger model, or to the API when it is reachable. In `hybrid`, say which step used which model.
3. **Replace the web with the local corpus.** `glob`, `grep`, `read`, the project docs, and earlier sessions are the knowledge base. Quote the file and line you used. Never invent a URL, a version, or a fact that used to come from a search; mark it `unverified` instead.
4. **Prefer tools over recall.** Count with `pwsh`, validate JSON with a parser, check a regex by running it, run the test that proves the change. A small model's memory is the least reliable component in the room; the filesystem and the compiler are not.
5. **Constrain structured output.** For JSON, a fixed set of labels, or a shell command, ask for that exact shape and validate the answer with a program. Grammar-constrained decoding measurably lifts small local models (NVIDIA measured a mean pass rate of 62.5% → 75.2% over 13 models, with the largest gain on the smallest model, and a small regression on complex shell constructs), so use schemas and re-ask with the parser error when validation fails.
6. **Two-pass quality.** Draft with the model, then check with a program: tests, a typecheck, a schema, or a second read. Fix what the check found; never ship a draft that no program confirmed.
7. **Keep it fast.** Bound the context: `grep` before reading, read a file range instead of the whole file, cap tool output, and reuse the same prompt prefix across turns so the local KV cache stays warm. On CPU-only machines prefer a Q4-class quantisation, a small context, and one task per call.
8. **Fail honestly.** If no endpoint answers in `offline`, answer from files and tools only and say so. If the API is unreachable mid-run, stop retrying the same call, switch to the local route, and report the switch. A failed call is never retried unchanged.
9. **Report** the mode, the model used per step, the checks that ran, and what stayed unverified.

Background: the routing and context advice follows the hybrid-routing and agent-adaptability literature ([Switchboard](https://zenodo.org/records/20789935), [Contextual Engineering](https://zenodo.org/records/18005435)); the constrained-decoding numbers come from [NVIDIA's small-model Bash study](https://developer.nvidia.com/blog/improving-bash-generation-in-small-language-models-with-grammar-constrained-decoding/).
