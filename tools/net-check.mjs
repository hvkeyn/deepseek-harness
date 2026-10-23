// Network reachability check used as the demo application for the net-check skill.
//
// It performs exactly the steps the skill prescribes: resolve the names, test the
// TCP port, then probe the HTTPS endpoints that the update path relies on, and
// prints one line per check with the result and timing.

import { lookup } from 'node:dns/promises'
import { connect } from 'node:net'

const TARGETS = [
  { host: 'github.com', port: 443 },
  { host: 'api.github.com', port: 443 },
]

const URLS = [
  'https://github.com/hvkeyn/deepseek-harness/releases/latest/download/nightly.yml',
  'https://github.com/hvkeyn/deepseek-harness/releases/latest/download/skills-index.json',
]

const results = []

function line(target, step, ok, detail, ms) {
  results.push({ target, step, ok, detail, ms })
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${target.padEnd(26)} ${step.padEnd(10)} ${detail}${ms === undefined ? '' : ` (${ms} ms)`}`)
}

for (const { host, port } of TARGETS) {
  const dnsStart = performance.now()
  try {
    const address = await lookup(host)
    line(host, 'dns', true, address.address, Math.round(performance.now() - dnsStart))
  } catch (error) {
    line(host, 'dns', false, error.code ?? String(error))
    continue
  }

  const tcpStart = performance.now()
  const connected = await new Promise((resolve) => {
    const socket = connect({ host, port })
    socket.setTimeout(8000)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => { resolve(false) })
  })
  line(host, `tcp/${port}`, connected, connected ? 'connected' : 'refused or timed out', Math.round(performance.now() - tcpStart))
}

for (const url of URLS) {
  const started = performance.now()
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) })
    line(new URL(url).pathname.split('/').pop(), 'https', response.ok, `HTTP ${response.status}`, Math.round(performance.now() - started))
  } catch (error) {
    line(new URL(url).pathname.split('/').pop(), 'https', false, error.name ?? String(error), Math.round(performance.now() - started))
  }
}

const failed = results.filter(result => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exitCode = failed.length === 0 ? 0 : 1
