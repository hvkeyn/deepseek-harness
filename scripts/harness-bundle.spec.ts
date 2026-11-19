import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HarnessBundleViolation,
  anonymousCandidateIds,
  createHarnessBundle,
  diffHarnessBundles,
  readHarnessBundle,
  summarizeHarnessBundle,
} from './harness-bundle.ts'

const roots: string[] = []

afterEach(async () => {
  vi.restoreAllMocks()
  process.exitCode = undefined
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

const MANIFEST = { name: 'legal-review', version: '1.0.0' }

async function bundleRoot(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-harness-bundle-'))
  roots.push(root)
  const manifest = files['harness.json'] ?? JSON.stringify(MANIFEST)
  await writeFile(join(root, 'harness.json'), manifest)
  for (const [path, content] of Object.entries(files)) {
    if (path === 'harness.json') continue
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), content)
  }
  return root
}

function problemsOf(run: () => unknown): readonly string[] {
  try {
    run()
  } catch (error) {
    if (error instanceof HarnessBundleViolation) return error.problems
    throw error
  }
  throw new Error('expected a HarnessBundleViolation')
}

describe('harness bundle surface', () => {
  it('counts components and the always-on text they cost', () => {
    const bundle = createHarnessBundle(MANIFEST, [
      ['system-prompt.md', 'Work carefully.'],
      ['skills/doc-review/SKILL.md', 'Review the document.'],
      ['subagents/fact-check.md', 'Check every claim.'],
      ['scripts/check_totals.py', 'print(1)'],
      ['cordis.patch.yml', '- insert: []'],
    ])
    expect(summarizeHarnessBundle(bundle)).toEqual({
      skills: 1,
      subagents: 1,
      scripts: 1,
      patch: true,
      alwaysOnCharacters: 'Work carefully.'.length + 'Review the document.'.length,
      totalCharacters: 'Work carefully.'.length + 'Review the document.'.length
        + 'Check every claim.'.length + 'print(1)'.length + '- insert: []'.length,
    })
  })

  it('rejects a bundle without the always-on system prompt', () => {
    const problems = problemsOf(() => createHarnessBundle(MANIFEST, [['subagents/fact-check.md', 'x']]))
    expect(problems).toContain('bundle: system-prompt.md is required')
  })

  it('rejects manifest defects together', () => {
    const problems = problemsOf(() => createHarnessBundle(
      { name: 'Legal Review', version: 'v1', extra: true },
      [['system-prompt.md', 'Work.']],
    ))
    expect(problems).toEqual(expect.arrayContaining([
      'harness.json: unknown field "extra"',
      'harness.json: name must use lowercase letters, digits, "_" or "-"',
      'harness.json: version must be a semantic version',
    ]))
  })

  it('rejects paths that escape the bundle or are not posix', () => {
    const problems = problemsOf(() => createHarnessBundle(MANIFEST, [
      ['system-prompt.md', 'Work.'],
      ['../outside.md', 'x'],
      ['skills\\doc-review\\SKILL.md', 'x'],
      ['./system-prompt.md', 'Work.'],
    ]))
    expect(problems).toContain('../outside.md: path must be relative, with no "." or ".." segment and no backslash')
    expect(problems).toContain('skills\\doc-review\\SKILL.md: path must be relative, with no "." or ".." segment and no backslash')
    expect(problems).toContain('./system-prompt.md: path must be relative, with no "." or ".." segment and no backslash')
  })

  it('rejects credentials and dependency trees on the surface', () => {
    const problems = problemsOf(() => createHarnessBundle(MANIFEST, [
      ['system-prompt.md', 'Work.'],
      ['.env.local', 'DSH_API_KEY=secret'],
      ['id_rsa', 'key'],
      ['node_modules/left-pad/index.js', 'x'],
    ]))
    expect(problems).toEqual(expect.arrayContaining([
      '.env.local: credentials and dependency trees are outside the harness surface',
      'id_rsa: credentials and dependency trees are outside the harness surface',
      'node_modules/left-pad/index.js: credentials and dependency trees are outside the harness surface',
    ]))
  })

  it('rejects off-surface components, empty files, and control characters', () => {
    const problems = problemsOf(() => createHarnessBundle(MANIFEST, [
      ['system-prompt.md', 'Work.'],
      ['notes.md', 'x'],
      ['subagents/fact-check.txt', 'x'],
      ['skills/doc-review/README.md', 'x'],
      ['scripts/check_totals.rs', 'x'],
      ['subagents/empty.md', '   '],
      ['subagents/control.md', 'a\u0007b'],
    ]))
    expect(problems).toEqual(expect.arrayContaining([
      'notes.md: the surface allows system-prompt.md, cordis.patch.yml, skills/, subagents/, and scripts/ only',
      'subagents/fact-check.txt: subagents carry exactly <name>.md with a lowercase name',
      'skills/doc-review/README.md: skills carry exactly <name>/SKILL.md with a lowercase name',
      'scripts/check_totals.rs: scripts carry exactly <name>.<ts|mjs|cjs|js|py|sh> with a lowercase name',
      'subagents/empty.md: file is empty',
      'subagents/control.md: contains a control character',
    ]))
  })

  it('rejects a file above the per-file limit', () => {
    const problems = problemsOf(() => createHarnessBundle(MANIFEST, [['system-prompt.md', 'x'.repeat(262_145)]]))
    expect(problems).toContain('system-prompt.md: exceeds 262144 characters')
  })

  it('reads a bundle directory and reports a forbidden file inside it', async () => {
    const root = await bundleRoot({ 'system-prompt.md': 'Work.', 'skills/doc-review/SKILL.md': 'Review.' })
    const bundle = await readHarnessBundle(root)
    expect([...bundle.files.keys()].sort()).toEqual(['skills/doc-review/SKILL.md', 'system-prompt.md'])

    const secret = await bundleRoot({ 'system-prompt.md': 'Work.', '.env': 'DSH_API_KEY=secret' })
    await expect(readHarnessBundle(secret)).rejects.toThrow(/credentials and dependency trees/u)

    const missing = await bundleRoot({ 'system-prompt.md': 'Work.' })
    await rm(join(missing, 'harness.json'))
    await expect(readHarnessBundle(missing)).rejects.toThrow(/harness\.json: cannot be read as JSON/u)
  })

  it('diffs two bundles in a stable order', () => {
    const before = createHarnessBundle(MANIFEST, [
      ['system-prompt.md', 'Work.'],
      ['skills/old/SKILL.md', 'Old.'],
      ['subagents/kept.md', 'Kept.'],
    ])
    const after = createHarnessBundle(MANIFEST, [
      ['system-prompt.md', 'Work carefully.'],
      ['skills/new/SKILL.md', 'New.'],
      ['subagents/kept.md', 'Kept.'],
    ])
    expect(diffHarnessBundles(before, after)).toEqual({
      added: ['skills/new/SKILL.md'],
      removed: ['skills/old/SKILL.md'],
      modified: ['system-prompt.md'],
    })
  })
})

describe('anonymous candidate ids', () => {
  it('is stable for one selection identity and independent of label order', () => {
    const labels = ['base', 'agg1', 'agg2', 'agg3']
    const first = anonymousCandidateIds(labels, 'task-1|agg|2')
    const second = anonymousCandidateIds([...labels].reverse(), 'task-1|agg|2')
    expect([...first.entries()]).toEqual([...second.entries()])
    expect([...first.values()].sort()).toEqual([...labels].sort())
  })

  it('uses the same id set for a different seed', () => {
    const labels = ['base', 'agg1', 'agg2']
    const one = [...anonymousCandidateIds(labels, 'a').keys()].sort()
    const other = [...anonymousCandidateIds(labels, 'b').keys()].sort()
    expect(one).toEqual(other)
    expect(one).toEqual(['A', 'B', 'C'])
  })

  it('continues past Z with two-letter ids', () => {
    const labels = Array.from({ length: 28 }, (_, index) => `c${String(index)}`)
    const ids = [...anonymousCandidateIds(labels, 'seed').keys()]
    expect(ids).toHaveLength(28)
    expect(ids).toContain('AA')
    expect(new Set(ids).size).toBe(28)
  })
})
