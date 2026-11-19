// Scan files for API-key-shaped strings without printing the secret.
//
//   node tools/scan-secrets.mjs <path...>
//
// Streams each file in chunks with an overlap so a match cannot be split;
// prints the file, the byte offset, the kind, and a masked preview.
import { createReadStream, statSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const PATTERNS = [
  { kind: 'sk-key', regex: /(^|[^A-Za-z0-9_-])(sk-[A-Za-z0-9]{24,})/g, preview: match => `${match.slice(0, 6)}…${match.slice(-4)}` },
  { kind: 'env-assignment', regex: /(DEEPSEEK_API_KEY\s*=\s*)([A-Za-z0-9_-]{16,})/g, preview: match => `DEEPSEEK_API_KEY=…${match.slice(-4)}` },
  { kind: 'bearer-header', regex: /(Bearer\s+)([A-Za-z0-9._-]{24,})/g, preview: match => `Bearer …${match.slice(-4)}` },
]

function filesOf(path) {
  const stat = statSync(path)
  if (!stat.isDirectory()) return [path]
  const out = []
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name)
    if (entry.isDirectory()) out.push(...filesOf(full))
    else out.push(full)
  }
  return out
}

const OVERLAP = 64
const CHUNK = 1 << 20

async function scanFile(path) {
  const findings = []
  let carry = ''
  let offset = 0
  const stream = createReadStream(path, { highWaterMark: CHUNK })
  for await (const chunk of stream) {
    const text = carry + chunk.toString('latin1')
    for (const pattern of PATTERNS) {
      for (const match of text.matchAll(pattern.regex)) {
        findings.push({ offset: offset + (match.index ?? 0), kind: pattern.kind, preview: pattern.preview(match[2] ?? match[0]) })
      }
    }
    carry = text.slice(-OVERLAP)
    offset += chunk.length
  }
  return findings
}

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.log('usage: node tools/scan-secrets.mjs <path...>')
  process.exit(2)
}

let scanned = 0
let hits = 0
for (const target of targets) {
  for (const file of filesOf(target)) {
    scanned += 1
    let findings
    try {
      findings = await scanFile(file)
    } catch (error) {
      console.log(`skip ${file}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    for (const finding of findings) {
      hits += 1
      console.log(`HIT ${file} @${finding.offset} ${finding.kind} ${finding.preview}`)
    }
  }
}
console.log(`scanned ${scanned} file(s); ${hits} finding(s)`)
