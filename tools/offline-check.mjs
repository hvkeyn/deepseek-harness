// Detect the network shape this session runs in and print the routing plan the
// `offline-mode` skill follows: internet reachability, and which model
// endpoints answer (a LAN server, an OpenAI-compatible API, or a local
// runtime). Endpoints come from the environment first, then from the usual
// localhost ports.
//
//   node tools/offline-check.mjs
//
// Always exits 0; the printed `mode` decides the plan.
import { env } from 'node:process'

function endpointFromEnv() {
  const candidates = [
    ['DSH_LLM_BASE_URL', env.DSH_LLM_BASE_URL],
    ['DEEPSEEK_BASE_URL', env.DEEPSEEK_BASE_URL],
    ['OPENAI_BASE_URL', env.OPENAI_BASE_URL],
    ['OLLAMA_HOST', env.OLLAMA_HOST],
  ]
  return candidates.filter(([, value]) => typeof value === 'string' && value !== '')
}

const CONFIGURED = endpointFromEnv().map(([name, value]) => ({ name, base: value.replace(/\/+$/u, '') }))

const LOCAL_ENDPOINTS = [
  { name: 'ollama', base: 'http://127.0.0.1:11434', modelsPath: '/api/tags', models: body => (body.models ?? []).map(model => model.name) },
  { name: 'lm-studio', base: 'http://127.0.0.1:1234', modelsPath: '/v1/models', models: body => (body.data ?? []).map(model => model.id) },
  { name: 'llama.cpp', base: 'http://127.0.0.1:8080', modelsPath: '/v1/models', models: body => (body.data ?? []).map(model => model.id) },
  { name: 'vllm', base: 'http://127.0.0.1:8000', modelsPath: '/v1/models', models: body => (body.data ?? []).map(model => model.id) },
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

const models = []
for (const endpoint of CONFIGURED) {
  const result = await probe(`${endpoint.base}${endpoint.base.endsWith('/v1') ? '/models' : '/v1/models'}`, 2500)
  if (result.ok) {
    let names = []
    try {
      names = (JSON.parse(result.body).data ?? []).map(model => model.id)
    } catch {
      // A server that answers without JSON is still reachable.
    }
    models.push({ name: endpoint.name, base: endpoint.base, models: names, ms: result.ms })
  }
}
for (const endpoint of LOCAL_ENDPOINTS) {
  if (models.some(entry => entry.base === endpoint.base)) continue
  const result = await probe(`${endpoint.base}${endpoint.modelsPath}`, 1500)
  if (!result.ok) continue
  let names = []
  try {
    names = endpoint.models(JSON.parse(result.body))
  } catch {
    // See above: reachable without a model list.
  }
  models.push({ name: endpoint.name, base: endpoint.base, models: names, ms: result.ms })
}

const online = internet.some(entry => entry.reachable)
const hasModel = models.length > 0
const mode = hasModel ? (online ? 'remote-model' : 'model-only') : (online ? 'internet-only' : 'offline')

console.log(`mode: ${mode}`)
for (const entry of internet) {
  console.log(`  internet ${entry.url}: ${entry.reachable ? `ok ${entry.status} ${entry.ms}ms` : 'unreachable'}`)
}
if (!hasModel) console.log('  model endpoints: none answering')
for (const model of models) {
  console.log(`  model ${model.name} ${model.base}: ${model.models.length > 0 ? model.models.join(', ') : 'up, no model listed'} (${model.ms}ms)`)
}

const plan = {
  'remote-model': 'The model endpoint answers; use it for reasoning and keep web access out of the loop unless a step needs current facts.',
  'model-only': 'Only the model endpoint answers: answer from the model and the local corpus; do not call web tools, and mark missing facts unverified.',
  'internet-only': 'The internet answers but no model endpoint does: fix or start the model endpoint before asserting any model-backed result.',
  'offline': 'Nothing answers: work from the local corpus and tools only, and say so in the report.',
}
console.log(`plan: ${plan[mode]}`)
