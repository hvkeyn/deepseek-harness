// Convert the imported CEditNeuro skills library into this harness's skill format.
//
// The provider requires YAML frontmatter with `name` and `description`; the
// library stores a plain Markdown body whose first "Use this …" line is the
// trigger. The converter adds the frontmatter, keeps the body byte-for-byte, and
// skips a library skill whose name already exists in the repository's own
// `.dsh/skills` (those are already adapted for this harness).

import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const LIBRARY = 'skills-library'
const LOCAL = '.dsh/skills'
const OUTPUT = 'dist/skills/library'
const SKIP = new Set(['ADAPTING', 'ATTRIBUTION', 'CATALOG', 'CHECKLIST', 'INDEX', 'README'])
const NAME = /^[a-z][a-z0-9-]{1,39}$/

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.endsWith('.md') && !SKIP.has(entry.name.replace(/\.md$/, ''))) out.push(full)
  }
  return out
}

function descriptionOf(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const trigger = lines.find(line => /^Use this /i.test(line)) ?? lines.find(line => !line.startsWith('#')) ?? ''
  const one = trigger.replace(/\s+/g, ' ')
  return one.length <= 200 ? one : `${one.slice(0, 197)}...`
}

const localNames = new Set(existsSync(LOCAL)
  ? readdirSync(LOCAL).filter(file => file.endsWith('.md')).map(file => file.replace(/\.md$/, ''))
  : [])
mkdirSync(OUTPUT, { recursive: true })

const seen = new Set()
const written = []
const skipped = []
for (const file of walk(LIBRARY)) {
  const name = file.split(/[\\/]/).pop().replace(/\.md$/, '')
  if (!NAME.test(name)) { skipped.push(`${name}: invalid name`); continue }
  if (localNames.has(name)) { skipped.push(`${name}: already adapted locally`); continue }
  if (seen.has(name)) { skipped.push(`${name}: duplicate in library`); continue }
  seen.add(name)
  const raw = readFileSync(file, 'utf8')
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  const frontmatter = `---\nname: ${name}\ndescription: ${JSON.stringify(descriptionOf(body))}\n---\n\n`
  const target = join(OUTPUT, `${name}.md`)
  writeFileSync(target, frontmatter + body, 'utf8')
  written.push(name)
}

console.log(`adapted: ${written.length}`)
for (const name of written) console.log(`  ${name}`)
if (skipped.length > 0) { console.log(`skipped: ${skipped.length}`); for (const line of skipped) console.log(`  ${line}`) }
