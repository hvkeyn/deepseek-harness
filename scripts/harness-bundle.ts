/**
 * Read, validate, diff, and summarize a harness bundle.
 *
 * A harness bundle is one harness stored as a directory a harness editor may
 * rewrite as a unit: the always-on system prompt, the skills, the subagents,
 * the scripts, and an optional Cordis patch. Harness²
 * (https://github.com/google-research/harness2, Apache-2.0) treats the harness
 * as such an editable tree and gates every proposal through validation; this
 * module ports that surface idea and its safety checks to this repository's
 * shapes. No Harness² code is copied.
 *
 * The surface is deliberately closed: a path outside the allowed components, a
 * credential-shaped file, or a control character is a reported problem rather
 * than an ignored file, so a proposal cannot smuggle state past the bundle.
 */

import { readFile, readdir } from 'node:fs/promises'
import { join, posix, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Manifest fields a bundle may declare. */
export interface HarnessBundleManifest {
  /** Stable lowercase identifier of the harness, for example `legal-review`. */
  readonly name: string
  /** Version of the harness content, independent of the application version. */
  readonly version: string
  /** One sentence describing the harness; optional. */
  readonly description?: string
}

/** One harness surface: its manifest and every editable file by posix path. */
export interface HarnessBundle {
  /** Declared identity of the harness. */
  readonly manifest: HarnessBundleManifest
  /** Editable files by bundle-relative path. */
  readonly files: ReadonlyMap<string, string>
}

/** Paths that differ between two bundles. */
export interface HarnessBundleDiff {
  /** Paths only the newer bundle has, sorted. */
  readonly added: readonly string[]
  /** Paths only the older bundle has, sorted. */
  readonly removed: readonly string[]
  /** Paths both bundles have with different content, sorted. */
  readonly modified: readonly string[]
}

/** Component census of one bundle. */
export interface HarnessBundleSummary {
  /** Number of `skills/<name>/SKILL.md` files. */
  readonly skills: number
  /** Number of `subagents/<name>.md` files. */
  readonly subagents: number
  /** Number of `scripts/<name>.<ext>` files. */
  readonly scripts: number
  /** Whether the bundle carries `cordis.patch.yml`. */
  readonly patch: boolean
  /** Characters every request pays for: the system prompt plus every skill body. */
  readonly alwaysOnCharacters: number
  /** Characters across every editable file. */
  readonly totalCharacters: number
}

/** Every problem found in one candidate bundle, in a stable order. */
export class HarnessBundleViolation extends Error {
  /** Actionable problems, each naming the path or field it concerns. */
  readonly problems: readonly string[]

  /**
   * @param problems - Problems found while validating a bundle.
   */
  constructor(problems: readonly string[]) {
    super(`harness bundle: ${problems.length} problem(s)\n${problems.map(problem => `- ${problem}`).join('\n')}`)
    this.name = 'HarnessBundleViolation'
    this.problems = problems
  }
}

/** Manifest filename. */
const MANIFEST = 'harness.json'
/** Required always-on entry. */
const SYSTEM_PROMPT = 'system-prompt.md'
/** Optional Cordis patch carried beside the components. */
const PATCH = 'cordis.patch.yml'
/** Directory prefixes owned by the surface. */
const SKILLS = 'skills'
const SUBAGENTS = 'subagents'
const SCRIPTS = 'scripts'

const MAX_FILES = 512
const MAX_FILE_CHARACTERS = 262_144
const MAX_TOTAL_CHARACTERS = 1_048_576
const NAME = /^[a-z0-9][a-z0-9_-]*$/u
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u
const SCRIPT = /^[a-z0-9][a-z0-9_-]*\.[a-z]+$/u
const SCRIPT_EXTENSION = /\.(?:ts|mjs|cjs|js|py|sh)$/u
const MANIFEST_FIELDS = new Set(['name', 'version', 'description'])
/** Host files that are noise rather than surface content. */
const IGNORED = new Set(['.DS_Store', 'Thumbs.db'])
/** Credential-shaped paths a harness never carries; their presence is a defect. */
const FORBIDDEN = /(?:^|\/)\.env(?:\.|$)|\.(?:pem|p12|pfx|key|keystore|jks)$|(?:^|\/)id_rsa|(?:^|\/)node_modules(?:\/|$)|(?:^|\/)\.git(?:\/|$)/u

/**
 * Reject values that cannot be a bundle path: absolute, escaping, or Windows-shaped.
 * @param raw - Path as stored in the bundle.
 * @returns The path when it is already normalized, otherwise null.
 */
function normalizePath(raw: string): string | null {
  if (raw.includes('\\')) return null
  const normalized = posix.normalize(raw)
  const escapes = normalized !== raw || normalized.startsWith('/') || normalized.startsWith('../')
  return escapes ? null : normalized
}

/**
 * Check one editable file against the surface rules.
 * @param path - Normalized bundle-relative path.
 * @param content - File text.
 * @param problems - Collector that receives every problem found.
 */
function checkFile(path: string, content: string, problems: string[]): void {
  if (FORBIDDEN.test(path)) {
    problems.push(`${path}: credentials and dependency trees are outside the harness surface`)
    return
  }
  if (content.trim() === '') problems.push(`${path}: file is empty`)
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(content)) problems.push(`${path}: contains a control character`)
  if (path === SYSTEM_PROMPT || path === PATCH) return
  const [directory, ...rest] = path.split('/')
  const relative = rest.join('/')
  if (directory === SKILLS) {
    if (!/^[a-z0-9][a-z0-9_-]*\/SKILL\.md$/u.test(relative)) {
      problems.push(`${path}: skills carry exactly <name>/SKILL.md with a lowercase name`)
    }
    return
  }
  if (directory === SUBAGENTS) {
    if (!/^[a-z0-9][a-z0-9_-]*\.md$/u.test(relative)) {
      problems.push(`${path}: subagents carry exactly <name>.md with a lowercase name`)
    }
    return
  }
  if (directory === SCRIPTS) {
    if (!SCRIPT.test(relative) || !SCRIPT_EXTENSION.test(relative)) {
      problems.push(`${path}: scripts carry exactly <name>.<ts|mjs|cjs|js|py|sh> with a lowercase name`)
    }
    return
  }
  problems.push(`${path}: the surface allows ${SYSTEM_PROMPT}, ${PATCH}, ${SKILLS}/, ${SUBAGENTS}/, and ${SCRIPTS}/ only`)
}

/**
 * Validate a manifest and its files, returning the normalized bundle.
 * @param manifest - Parsed `harness.json` value.
 * @param entries - Candidate files as path/content pairs.
 * @returns The validated bundle.
 * @throws {HarnessBundleViolation} When any surface, size, or credential rule fails.
 */
export function createHarnessBundle(
  manifest: unknown,
  entries: Iterable<readonly [string, string]>,
): HarnessBundle {
  const problems: string[] = []
  const files = new Map<string, string>()
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    problems.push(`${MANIFEST}: must contain an object with name and version`)
  } else {
    const record = manifest as Record<string, unknown>
    for (const field of Object.keys(record)) {
      if (!MANIFEST_FIELDS.has(field)) problems.push(`${MANIFEST}: unknown field ${JSON.stringify(field)}`)
    }
    if (typeof record.name !== 'string' || !NAME.test(record.name)) {
      problems.push(`${MANIFEST}: name must use lowercase letters, digits, "_" or "-"`)
    }
    if (typeof record.version !== 'string' || !VERSION.test(record.version)) {
      problems.push(`${MANIFEST}: version must be a semantic version`)
    }
    if (record.description !== undefined
      && (typeof record.description !== 'string' || record.description.trim() === '')) {
      problems.push(`${MANIFEST}: description must be a non-empty string when present`)
    }
  }
  let total = 0
  for (const [raw, content] of entries) {
    const path = normalizePath(raw)
    if (path === null) {
      problems.push(`${raw}: path must be relative, with no "." or ".." segment and no backslash`)
      continue
    }
    if (files.has(path)) problems.push(`${path}: declared more than once`)
    files.set(path, content)
    total += content.length
    if (content.length > MAX_FILE_CHARACTERS) problems.push(`${path}: exceeds ${MAX_FILE_CHARACTERS} characters`)
  }
  if (files.size > MAX_FILES) problems.push(`bundle: ${files.size} files exceeds the ${MAX_FILES}-file limit`)
  if (total > MAX_TOTAL_CHARACTERS) {
    problems.push(`bundle: ${total} characters exceeds the ${MAX_TOTAL_CHARACTERS}-character limit`)
  }
  if (!files.has(SYSTEM_PROMPT)) problems.push(`bundle: ${SYSTEM_PROMPT} is required`)
  for (const [path, content] of files) checkFile(path, content, problems)
  if (problems.length > 0) throw new HarnessBundleViolation(problems)
  return { manifest: manifest as HarnessBundleManifest, files }
}

/**
 * Read a bundle directory from disk.
 * @param root - Directory holding `harness.json` and the component files.
 * @returns The validated bundle.
 * @throws {HarnessBundleViolation} When the directory or any file breaks the surface rules.
 */
export async function readHarnessBundle(root: string): Promise<HarnessBundle> {
  let manifest: unknown
  try {
    manifest = JSON.parse(await readFile(join(root, MANIFEST), 'utf8'))
  } catch {
    throw new HarnessBundleViolation([`${MANIFEST}: cannot be read as JSON under ${root}`])
  }
  const entries: Array<readonly [string, string]> = []
  const collect = async (directory: string, prefix: string): Promise<void> => {
    for (const entry of await readdir(join(root, directory || '.'), { withFileTypes: true })) {
      if (IGNORED.has(entry.name)) continue
      const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`
      if (entry.isDirectory()) {
        // A forbidden directory is reported as itself rather than walked.
        if (FORBIDDEN.test(`${path}/`)) entries.push([`${path}/`, ''] as const)
        else await collect(path, path)
      } else if (entry.isFile() && path !== MANIFEST) {
        entries.push([path, await readFile(join(root, path), 'utf8')] as const)
      }
    }
  }
  await collect('', '')
  return createHarnessBundle(manifest, entries)
}

/**
 * Compare two bundles by content.
 * @param before - Bundle the comparison starts from.
 * @param after - Bundle to compare against.
 * @returns Sorted added, removed, and modified paths.
 */
export function diffHarnessBundles(before: HarnessBundle, after: HarnessBundle): HarnessBundleDiff {
  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  for (const [path, content] of after.files) {
    const previous = before.files.get(path)
    if (previous === undefined) added.push(path)
    else if (previous !== content) modified.push(path)
  }
  for (const path of before.files.keys()) {
    if (!after.files.has(path)) removed.push(path)
  }
  return { added: added.sort(), removed: removed.sort(), modified: modified.sort() }
}

/**
 * Count the components of one bundle and the always-on text it costs.
 * @param bundle - Validated bundle.
 * @returns The component census and character totals.
 */
export function summarizeHarnessBundle(bundle: HarnessBundle): HarnessBundleSummary {
  let skills = 0
  let subagents = 0
  let scripts = 0
  let patch = false
  let alwaysOn = 0
  let total = 0
  for (const [path, content] of bundle.files) {
    total += content.length
    if (path === PATCH) patch = true
    if (path === SYSTEM_PROMPT) alwaysOn += content.length
    else if (path.startsWith(`${SKILLS}/`)) {
      skills += 1
      alwaysOn += content.length
    } else if (path.startsWith(`${SUBAGENTS}/`)) subagents += 1
    else if (path.startsWith(`${SCRIPTS}/`)) scripts += 1
  }
  return { skills, subagents, scripts, patch, alwaysOnCharacters: alwaysOn, totalCharacters: total }
}

/**
 * Assign anonymous candidate ids so a selector cannot tell which rollout produced a candidate.
 *
 * The shuffle is seeded from the selection identity, so rerunning one selection
 * shows the same ids; sorting the labels first makes the result independent of
 * rollout completion order.
 * @param labels - Rollout labels, such as `base` and `agg1`.
 * @param seed - Stable seed for the shuffle, usually the task id and recursion budget.
 * @returns Anonymous id to label pairs, for example `A` to `agg2`.
 */
export function anonymousCandidateIds(labels: readonly string[], seed: string): ReadonlyMap<string, string> {
  let state = 0x811c9dc5
  for (const character of seed) {
    state ^= character.codePointAt(0) ?? 0
    state = Math.imul(state, 0x01000193) >>> 0
  }
  const ordered = [...labels].sort()
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    const swap = state % (index + 1)
    const held = ordered[index] as string
    ordered[index] = ordered[swap] as string
    ordered[swap] = held
  }
  const ids = new Map<string, string>()
  for (const [index, label] of ordered.entries()) {
    let id = ''
    let remaining = index + 1
    while (remaining > 0) {
      id = String.fromCharCode(65 + ((remaining - 1) % 26)) + id
      remaining = Math.floor((remaining - 1) / 26)
    }
    ids.set(id, label)
  }
  return ids
}

const USAGE = `Usage: harness-bundle <command> [arguments]

  validate <dir>          check one bundle directory and print its census
  diff <before> <after>   list added, removed, and modified files
  summary <dir>           print the component census as JSON

Options: --json    print machine-readable output for validate and diff.`

/**
 * Run the command-line entry point.
 * @param arguments_ - Command and its arguments, without the node and script names.
 * @returns Nothing; failures set the process exit code.
 */
export async function runHarnessBundleCli(arguments_: readonly string[]): Promise<void> {
  const json = arguments_.includes('--json')
  // A standalone `--` is how callers spell "arguments follow"; it is not a command.
  const [command, ...rest] = arguments_.filter(argument => argument !== '--json' && argument !== '--')
  try {
    if (command === 'validate' && rest[0] !== undefined) {
      const bundle = await readHarnessBundle(rest[0])
      const summary = summarizeHarnessBundle(bundle)
      if (json) {
        console.log(JSON.stringify({ manifest: bundle.manifest, summary }))
        return
      }
      const patch = summary.patch ? 'patch' : 'no patch'
      console.log(`${bundle.manifest.name}@${bundle.manifest.version}: ${summary.skills} skill(s), `
        + `${summary.subagents} subagent(s), ${summary.scripts} script(s), ${patch}; `
        + `${summary.alwaysOnCharacters} always-on character(s)`)
      return
    }
    if (command === 'summary' && rest[0] !== undefined) {
      console.log(JSON.stringify(summarizeHarnessBundle(await readHarnessBundle(rest[0]))))
      return
    }
    if (command === 'diff' && rest[0] !== undefined && rest[1] !== undefined) {
      const diff = diffHarnessBundles(await readHarnessBundle(rest[0]), await readHarnessBundle(rest[1]))
      if (json) {
        console.log(JSON.stringify(diff))
        return
      }
      for (const path of diff.added) console.log(`added ${path}`)
      for (const path of diff.removed) console.log(`removed ${path}`)
      for (const path of diff.modified) console.log(`modified ${path}`)
      return
    }
    console.error(USAGE)
    process.exitCode = 2
  } catch (error) {
    if (!(error instanceof HarnessBundleViolation)) throw error
    console.error(error.message)
    process.exitCode = 1
  }
}

const invoked = process.argv[1]
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  await runHarnessBundleCli(process.argv.slice(2))
}
