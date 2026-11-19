---
name: offline-mode
description: "Use this when the link is down or unstable, the machine is air-gapped, or the model runs behind a LAN server or an OpenAI-compatible API: plan the route, use the local corpus, and keep output quality without the web."
---

# Work without the public internet

Use this when the network is down, the machine is isolated, or the model is reachable only through a LAN server or a private API. "Offline" here means **the public internet is unavailable**, not that the model runs on this machine: a server in the office, an OpenAI-compatible endpoint, Ollama, LM Studio, llama.cpp, and vLLM all count as reachable model endpoints.

1. **Detect before planning.** Run `node tools/offline-check.mjs`. It reads `DSH_LLM_BASE_URL`, `DEEPSEEK_BASE_URL`, `OPENAI_BASE_URL`, and `OLLAMA_HOST` first, then the usual localhost ports, and prints `remote-model`, `model-only`, `internet-only`, or `offline`. Do not guess the mode.
2. **Route by reachability and task shape, not by location.** Mechanical steps — extract, rename, classify, format, short summaries — go to the smallest endpoint that answers, wherever it runs. Reasoning, long planning, and code review go to the strongest reachable model. Say which endpoint served which step; "local" is not the deciding factor.
3. **Replace the web with the local corpus.** `glob`, `grep`, `read`, the project docs, and earlier sessions are the knowledge base. Quote the file and line you used. Never invent a URL, a version, or a fact that used to come from a search; mark it `unverified` instead.
4. **Prefer tools over recall.** Count with `pwsh`, validate JSON with a parser, check a regex by running it, run the test that proves the change. A model's memory is the least reliable component in the room; the filesystem and the compiler are not.
5. **Constrain structured output.** For JSON, a fixed set of labels, or a shell command, ask for that exact shape and validate the answer with a program. Grammar-constrained decoding measurably lifts small models (NVIDIA measured a mean pass rate of 62.5% → 75.2% over 13 models, the largest gain on the smallest one, a small regression on complex shell constructs), so use schemas and re-ask with the parser error when validation fails.
6. **Two-pass quality.** Draft with the model, then check with a program: tests, a typecheck, a schema, or a second read. Fix what the check found; never ship a draft that no program confirmed.
7. **Keep it fast.** Bound the context: `grep` before reading, read a file range instead of the whole file, cap tool output, and reuse the same prompt prefix across turns so the endpoint's cache stays warm. Over a slow link prefer one task per call and small outputs.
8. **Fail honestly.** In `offline` answer from files and tools only and say so. If the model endpoint drops mid-run, stop retrying the same call, switch to a reachable endpoint, and report the switch. A failed call is never retried unchanged.
9. **Report** the mode, the endpoint and model used per step, the checks that ran, and what stayed unverified.

Background: the routing and context advice follows the hybrid-routing and agent-adaptability literature ([Switchboard](https://zenodo.org/records/20789935), [Contextual Engineering](https://zenodo.org/records/18005435)); the constrained-decoding numbers come from [NVIDIA's small-model Bash study](https://developer.nvidia.com/blog/improving-bash-generation-in-small-language-models-with-grammar-constrained-decoding/).
