// Validate the local skill corpus against the DeepSeek Harness skill contract.
//
// Checks: kebab-case name, size limit, a `Use this` trigger line, balanced code
// fences, no obvious secrets, and tool names that this harness actually exposes
// (a skill naming another agent's tool is reported as needing adaptation).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOTS = ['.dsh/skills', 'skills-library']
const KNOWN_TOOLS = new Set([
  'read', 'write', 'edit', 'glob', 'grep', 'pwsh', 'skill', 'todo_write', 'subagent',
  'web_search', 'web_fetch', 'workflow', 'present', 'load_workspace_dependencies',
  'schedule_create', 'schedule_list', 'schedule_update', 'schedule_delete', 'ask_user_question',
  'create_goal', 'get_goal', 'update_goal', 'job_output', 'job_list', 'job_kill',
  'read_image', 'list_agents', 'send_message', 'interrupt_agent', 'exit_plan_mode',
  'get_goal', 'office', 'office-docx', 'office-pptx', 'office-xlsx', 'office-render',
  'office-export-pdf', 'office-recalculate',
])
const NAME = /^[a-z][a-z0-9-]{1,39}$/
const FOREIGN_TOOLS = new Set(['read_file', 'write_file', 'edit_file', 'run_command', 'read_dump', 'capture_dump', 'net_audit', 'load_tools', 'use_skill', 'git_diff', 'git_status', 'http_request', 'save_skill', 'delete_skill', 'render_video', 'edit_video', 'analyze_function'])
const DOCS = new Set(['ADAPTING', 'ATTRIBUTION', 'CATALOG', 'CHECKLIST', 'INDEX', 'README'])
const SECRET = /(sk-[a-z0-9]{20,}|ghp_[a-z0-9]{20,}|xox[bap]-|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i

function files(root) {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.md') && !DOCS.has(entry.name.replace(/\.md$/, ''))) out.push(full)
    }
  }
  try { walk(root) } catch { /* root absent is fine */ }
  return out
}

const problems = []
const toolGaps = new Map()
let total = 0
for (const root of ROOTS) {
  for (const file of files(root)) {
    const name = file.split(/[\\/]/).pop().replace(/\.md$/, '')
    const text = readFileSync(file, 'utf8')
    total += 1
    const report = (reason) => problems.push(`${relative(process.cwd(), file)}: ${reason}`)
    if (!NAME.test(name)) report('name is not kebab-case (a-z, 0-9, hyphen, starts with a letter)')
    if (Buffer.byteLength(text, 'utf8') > 12_000) report(`size ${Buffer.byteLength(text, 'utf8')} exceeds 12000 bytes`)
    if (!/^\s*Use this /m.test(text)) report('no "Use this …" trigger line')
    const fences = (text.match(/^```/gm) ?? []).length
    if (fences % 2 !== 0) report('unbalanced code fences')
    if (SECRET.test(text)) report('looks like it contains a secret')
    for (const match of text.matchAll(/`([a-z][a-z0-9_-]{2,})`/g)) {
      const token = match[1]
      if (!FOREIGN_TOOLS.has(token) || KNOWN_TOOLS.has(token)) continue
      {
        const key = `${name}: ${token}`
        toolGaps.set(key, (toolGaps.get(key) ?? 0) + 1)
      }
    }
  }
}

console.log(`checked ${total} skill file(s)`)
if (problems.length === 0) console.log('contract: all files pass')
else { console.log(`contract: ${problems.length} problem(s)`); for (const problem of problems) console.log(`  ${problem}`) }
if (toolGaps.size > 0) {
  console.log(`adaptation: ${toolGaps.size} tool reference(s) name tools this harness does not expose`)
  for (const key of [...toolGaps.keys()].slice(0, 25)) console.log(`  ${key}`)
}
process.exitCode = problems.length === 0 ? 0 : 1
