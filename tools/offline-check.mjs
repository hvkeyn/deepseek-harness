// Detect whether this machine can reach the internet and which local model
// servers answer, then print the routing plan the `offline-mode` skill follows.
//
//   node tools/offline-check.mjs
//
// Always exits 0; the printed `mode` decides the plan.
const LOCAL_ENDPOINTS = [
  { name: 'ollama', url: 'http://127.0.0.1:11434/api/tags', models: body => (body.models ?? []).map(model => model.name) },
  { name: 'lm-studio', url: 'http://127.0.0.1:1234/v1/models', models: body => (body.data ?? []).map(model => model.id) },
  { name: 'llama.cpp', url: 'http://127.0.0.1:8080/v1/models', models: body => (body.data ?? []).map(model => model.id) },
  { name: 'vllm', url: 'http://127.0.0.1:8000/v1/models', models: body => (body.data ?? []).map(model => model.id) },
]

const INTERNET_PROBES = [
  'https://registry.npmjs.org/-/ping',
  'https://github.com',
]

async function probe(url, timeoutMs) {
  const started = Date.now()
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'dsh-offline-check' },
    })
    const body = await response.text()
    return { ok: response.ok, status: response.status, body, ms: Date.now() - started }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), ms: Date.now() - started }
  }
}

const internet = []
for (const url of INTERNET_PROBES) {
  const result = await probe(url, 2500)
  internet.push({ url, reachable: result.ok, status: result.status ?? null, ms: result.ms })
}

const locals = []
for (const endpoint of LOCAL_ENDPOINTS) {
  const result = await probe(endpoint.url, 1500)
  if (!result.ok) continue
  let models = []
  try {
    models = endpoint.models(JSON.parse(result.body))
  } catch {
    // A server that answers without JSON is still up; report it without models.
  }
  locals.push({ server: endpoint.name, models })
}

const online = internet.some(entry => entry.reachable)
const mode = online ? (locals.length > 0 ? 'hybrid' : 'online') : (locals.length > 0 ? 'local-only' : 'offline')

console.log(`mode: ${mode}`)
for (const entry of internet) {
  console.log(`  internet ${entry.url}: ${entry.reachable ? `ok ${entry.status} ${entry.ms}ms` : 'unreachable'}`)
}
if (locals.length === 0) console.log('  local models: none answering')
for (const local of locals) {
  console.log(`  local ${local.server}: ${local.models.length > 0 ? local.models.join(', ') : 'server up, no model listed'}`)
}

const plan = {
  'online': 'Use the remote API for reasoning; keep local retrieval for project facts.',
  'hybrid': 'Route mechanical steps (extract, rename, format, classify) to the local model and reasoning to the API.',
  'local-only': 'Use the local model for everything; keep prompts small, prefer tools over recall, and validate every structured output.',
  'offline': 'No model endpoint answers: answer from the local corpus and tool output only, or start a local server before continuing.',
}
console.log(`plan: ${plan[mode]}`)
