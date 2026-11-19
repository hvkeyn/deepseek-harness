// Add YAML frontmatter (name + description) to local skills that lack it.
//
// The provider ignores a skill file without `name` and `description`, so a skill
// copied from another agent stays invisible until it carries both. The body is
// kept byte-for-byte; the description comes from the skill's `Use this` line.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = '.dsh/skills'
const NAME = /^[a-z][a-z0-9-]{1,39}$/

function descriptionOf(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const trigger = lines.find(line => /^Use this /i.test(line)) ?? lines.find(line => !line.startsWith('#')) ?? ''
  const one = trigger.replace(/\s+/g, ' ')
  return one.length <= 200 ? one : `${one.slice(0, 197)}...`
}

let added = 0
for (const file of readdirSync(ROOT).filter(entry => entry.endsWith('.md'))) {
  const name = file.replace(/\.md$/, '')
  if (!NAME.test(name)) { console.log(`skip ${file}: invalid name`); continue }
  const path = join(ROOT, file)
  const raw = readFileSync(path, 'utf8')
  if (raw.startsWith('---')) continue
  const frontmatter = `---\nname: ${name}\ndescription: ${JSON.stringify(descriptionOf(raw))}\n---\n\n`
  writeFileSync(path, frontmatter + raw, 'utf8')
  added += 1
  console.log(`frontmatter added: ${name}`)
}
console.log(`updated ${added} file(s)`)
