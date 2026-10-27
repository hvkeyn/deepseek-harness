/** Session-addressed, cold-readable skill catalog Remote and its management surface. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-preset-registry/types'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import type { SkillRegistry } from '@deepseek-ai/dsh-skill'
import { isUserInvocable } from '@deepseek-ai/dsh-skill'
import { SessionQueryError } from '@deepseek-ai/dsh-session-query'
import { SessionSeq } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-working-directory'
import type { ScopeKey } from '@deepseek-ai/dsh-scope'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, join, relative, isAbsolute, resolve } from 'node:path'
import { homedir } from 'node:os'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {
  SkillAdminListRequest, SkillAdminValue, SkillAutoAttachRequest, SkillAutoAttachValue, SkillCatalogEntry, SkillCatalogValue, SkillCreateRequest,
  SkillImportRequest, SkillImportValue, SkillInstallRequest, SkillInstallValue, SkillListRequest, SkillListValue, SkillMutationValue,
  SkillRemoveRequest, SkillToggleRequest,
} from './types.ts'

/** Skill name accepted by the local skill contract. */
const SKILL_NAME = /^[a-z][a-z0-9-]{1,39}$/u

/** One skill file may not exceed the local contract's size. */
const MAX_SKILL_BYTES = 12_000

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host owner of the Session-addressed `skills` Remote namespace. */
    sessionSkillCatalog: SessionSkillCatalog
  }
}

/** Host service backing `ctx.remote.skills` without activating a cold Agent. */
export class SessionSkillCatalog extends TypertRemoteService {
  static inject = ['agents', 'sessionQuery', 'typert', 'workingDirectory']

  /** @param ctx - Host context carrying Session reads and optional skill/preset services. */
  constructor(ctx: Context) {
    super(ctx, 'sessionSkillCatalog', { namespace: 'skills' })
  }

  /**
   * List the user-invocable skills visible to one Session composition.
   * @param request - Session identity whose cwd and preset select the catalog view.
   * @param signal - caller lifetime carried by the Remote transport; admitted catalog reads retain their existing completion semantics.
   * @returns user-invocable skill metadata without loading skill bodies.
   * @throws RemoteError when the Session cannot be inspected or no registry can serve it.
   */
  @Remote
  async list(request: SkillListRequest, signal: AbortSignal): Promise<SkillListValue> {
    const target = await this.targetFor(request.sessionId, signal)
    this.applyStoredDisabled(target.registry)
    try {
      const skills = (await target.registry.list({ cwd: target.cwd, scope: target.scope })).filter(isUserInvocable)
      return {
        skills: skills.map(skill => ({
          name: skill.name,
          ...skill.path === undefined ? {} : { path: skill.path },
          description: skill.description,
          ...skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse },
          modelInvocable: skill.invocation.modelInvocable,
        })),
      }
    } catch (error: unknown) {
      throw new RemoteError('gateway/internal', `skill listing failed: ${String(error)}`, {})
    }
  }

  /**
   * List every catalog skill with its enablement, including the withheld ones.
   * @param request - Session identity whose composition selects the registry.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns catalog entries and the withheld names.
   */
  @Remote
  async listAdmin(request: SkillAdminListRequest, signal: AbortSignal): Promise<SkillAdminValue> {
    const target = await this.targetFor(request.sessionId, signal)
    try {
      const disabled = this.readDisabled()
    target.registry.setDisabled(disabled)
    const skills = await target.registry.list({ cwd: target.cwd, scope: target.scope, includeDisabled: true })
      // Files in the user root are listed even when no provider in this
      // composition scans it: the panel must show what it can install.
      const listed = new Map<string, { name: string, description: string, path?: string }>()
      for (const skill of skills) {
        listed.set(skill.name, {
          name: skill.name,
          description: skill.description,
          ...skill.path === undefined ? {} : { path: skill.path },
        })
      }
      for (const file of this.installedSkills()) {
        if (listed.has(file.name)) continue
        listed.set(file.name, {
          name: file.name,
          description: skillSummary(readFileSync(this.userSkillPath(file.name), 'utf8')),
          path: this.userSkillPath(file.name),
        })
      }
      return {
        disabled,
        autoAttach: this.readAutoAttach(),
        skills: [...listed.values()]
          .sort((left, right) => left.name.localeCompare(right.name))
          .map(skill => ({ ...skill, enabled: !disabled.includes(skill.name) })),
      }
    } finally {
      await target.release?.()
    }
  }

  /**
   * Turn automatic attachment of enabled skills on or off. In automatic mode a
   * Session receives the instructions of every enabled skill without a manual
   * `/name` or a `skill` tool call; the setting is shared by every workspace.
   * @param request - desired state; the Session is optional for the global setting.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the stored state and the withheld names.
   */
  @Remote
  async setAutoAttach(request: SkillAutoAttachRequest, signal: AbortSignal): Promise<SkillAutoAttachValue> {
    const target = await this.targetFor(request.sessionId, signal)
    this.writeSettings(target.registry, { autoAttach: request.enabled })
    return { autoAttach: request.enabled, disabled: this.readDisabled() }
  }

  /**
   * Withhold or restore one skill. The file stays in place, so the same call
   * reverses itself; the withheld set is stored beside the user's skill root.
   * @param request - Session identity, skill name, and the desired state.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the withheld names after the change.
   * @throws RemoteError for an unknown session or an invalid name.
   */
  @Remote
  async setEnabled(request: SkillToggleRequest, signal: AbortSignal): Promise<SkillMutationValue> {
    if (!SKILL_NAME.test(request.name)) {
      throw new RemoteError('gateway/bad-request', `invalid skill name "${request.name}"`, {})
    }
    const target = await this.targetFor(request.sessionId, signal)
    const disabled = new Set(this.readDisabled())
    if (request.enabled) disabled.delete(request.name)
    else disabled.add(request.name)
    this.writeSettings(target.registry, { disabled: [...disabled] })
    return { disabled: [...disabled] }
  }

  /**
   * Write a new user skill from Markdown into `<dshHome>/skills`.
   * @param request - Session identity, kebab-case name, and Markdown body.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the written path and the withheld names.
   * @throws RemoteError for an invalid name, an oversized body, or an existing file.
   */
  @Remote
  async create(request: SkillCreateRequest, signal: AbortSignal): Promise<SkillMutationValue> {
    if (signal.aborted) throw new RemoteError('gateway/cancelled', 'skill creation was cancelled', {})
    if (!SKILL_NAME.test(request.name)) {
      throw new RemoteError('gateway/bad-request', `invalid skill name "${request.name}"`, {})
    }
    if (request.content.trim() === '') {
      throw new RemoteError('gateway/bad-request', 'skill content is empty', {})
    }
    if (Buffer.byteLength(request.content, 'utf8') > MAX_SKILL_BYTES) {
      throw new RemoteError('gateway/bad-request', `skill content exceeds ${String(MAX_SKILL_BYTES)} bytes`, {})
    }
    const path = this.userSkillPath(request.name)
    if (existsSync(path)) {
      throw new RemoteError('gateway/bad-request', `skill "${request.name}" already exists`, {})
    }
    mkdirSync(join(this.dshHome(), 'skills'), { recursive: true })
    writeFileSync(path, request.content, 'utf8')
    const disabled = this.readDisabled()
    return { path, disabled }
  }

  /**
   * Delete one user skill file. Only files under `<dshHome>/skills` are removed;
   * project skills belong to their repository and are refused.
   * @param request - Session identity and skill name.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the deleted path and the withheld names.
   * @throws RemoteError when the skill is unknown or lives outside the user root.
   */
  @Remote
  async removeSkill(request: SkillRemoveRequest, signal: AbortSignal): Promise<SkillMutationValue> {
    if (!SKILL_NAME.test(request.name)) {
      throw new RemoteError('gateway/bad-request', `invalid skill name "${request.name}"`, {})
    }
    const target = await this.targetFor(request.sessionId, signal)
    const skills = await target.registry.list({ cwd: target.cwd, scope: target.scope, includeDisabled: true })
    const match = skills.find(skill => skill.name === request.name)
    const userPath = this.userSkillPath(request.name)
    const path = match?.path ?? (existsSync(userPath) ? userPath : undefined)
    if (path === undefined) {
      throw new RemoteError('gateway/bad-request', `skill "${request.name}" has no file to remove`, {})
    }
    if (!this.isUserSkillPath(path)) {
      throw new RemoteError('gateway/bad-request',
        `skill "${request.name}" is not in the user skill root`, {})
    }
    rmSync(path, { force: true })
    const disabled = this.readDisabled().filter(name => name !== request.name)
    this.writeSettings(target.registry, { disabled })
    return { path, disabled }
  }

  /**
   * List the skills this Session actually applied: names carried by a
   * `skill-invocation` context, from a `/name` gesture or automatic attachment.
   * @param request - Session whose log is read.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns applied skill names in first-use order.
   */
  @Remote
  async activeSkills(request: SkillListRequest, signal: AbortSignal): Promise<{ names: readonly string[] }> {
    const live = this.ctx.agents.get(request.sessionId)
    if (live === undefined) return { names: [] }
    const names: string[] = []
    const seen = new Set<string>()
    for (let index = 0; index < live.session.seq; index += 1) {
      if (signal.aborted) break
      const event = live.session.eventAt(SessionSeq(index))
      if (event?.type !== 'user/message') continue
      const source = event.data.source
      if (source.kind !== 'skill-invocation' || seen.has(source.name)) continue
      seen.add(source.name)
      names.push(source.name)
    }
    return { names }
  }

  /**
   * Read the published skill catalog and hash the locally installed files, so a
   * client can show what is installed and what has an update.
   * @param request - optional Session; the catalog is the same for every Session.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns catalog entries and the installed name/hash pairs.
   * @throws RemoteError when the index cannot be fetched or parsed.
   */
  @Remote
  async fetchCatalog(_request: SkillAdminListRequest, signal: AbortSignal): Promise<SkillCatalogValue> {
    const source = skillsIndexUrl()
    const response = await fetch(source, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      throw new RemoteError('gateway/internal', `skill catalog request failed: ${String(response.status)}`, {})
    }
    return { source, skills: parseCatalog(await response.json()), installed: this.installedSkills() }
  }

  /**
   * Install or refresh one catalog skill into `<dshHome>/skills`.
   * @param request - catalog skill name.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns the written path and its hash.
   * @throws RemoteError for an invalid name, a missing catalog entry, a bad hash, or a failed download.
   */
  @Remote
  async installSkill(request: SkillInstallRequest, signal: AbortSignal): Promise<SkillInstallValue> {
    if (!SKILL_NAME.test(request.name)) {
      throw new RemoteError('gateway/bad-request', `invalid skill name "${request.name}"`, {})
    }
    const source = skillsIndexUrl()
    const response = await fetch(source, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      throw new RemoteError('gateway/internal', `skill catalog request failed: ${String(response.status)}`, {})
    }
    const entry = parseCatalog(await response.json()).find(skill => skill.name === request.name)
    if (entry === undefined) {
      throw new RemoteError('gateway/bad-request', `skill "${request.name}" is not in the catalog`, {})
    }
    const file = await fetch(entry.url, { signal })
    if (!file.ok) {
      throw new RemoteError('gateway/internal', `skill download failed: ${String(file.status)}`, {})
    }
    const text = await file.text()
    const hash = createHash('sha256').update(text, 'utf8').digest('hex')
    if (hash !== entry.sha256.toLowerCase()) {
      throw new RemoteError('gateway/internal', `skill "${request.name}" failed its hash check`, {})
    }
    mkdirSync(join(this.dshHome(), 'skills'), { recursive: true })
    const path = this.userSkillPath(request.name)
    writeFileSync(path, text, 'utf8')
    return { name: request.name, path, sha256: hash }
  }

  /**
   * Import local skill files into `<dshHome>/skills`.
   *
   * A directory contributes every `.md` file directly inside it; a single file is
   * imported on its own. A file without frontmatter receives one derived from its
   * first `Use this …` line, because the provider ignores a skill without a name
   * and a description.
   * @param request - a file or directory path, with `~` expanded to the user profile.
   * @returns the written skills and the files left alone with their reasons.
   * @throws RemoteError for an empty or unreadable path.
   */
  @Remote
  async importSkill(request: SkillImportRequest, signal: AbortSignal): Promise<SkillImportValue> {
    void signal
    const requested = request.path.trim()
    if (requested === '') {
      throw new RemoteError('gateway/bad-request', 'skill import path is empty', {})
    }
    const expanded = requested.startsWith('~') ? join(homedir(), requested.slice(1)) : requested
    const source = resolve(expanded)
    let isDirectory: boolean
    try {
      isDirectory = statSync(source).isDirectory()
    } catch {
      throw new RemoteError('gateway/bad-request', `skill import path is unreadable: ${source}`, {})
    }
    const files = isDirectory
      ? readdirSync(source).filter(file => file.endsWith('.md')).sort().map(file => join(source, file))
      : [source]
    const imported: { name: string, path: string }[] = []
    const skipped: { file: string, reason: string }[] = []
    for (const file of files) {
      if (!file.toLowerCase().endsWith('.md')) {
        skipped.push({ file, reason: 'not a markdown file' })
        continue
      }
      const name = basename(file).replace(/\.md$/iu, '')
      if (!SKILL_NAME.test(name)) {
        skipped.push({ file, reason: 'name is not lowercase a-z, 0-9, and hyphens' })
        continue
      }
      let text: string
      try {
        text = readFileSync(file, 'utf8')
      } catch {
        skipped.push({ file, reason: 'unreadable' })
        continue
      }
      const body = text.startsWith('---') ? text : `${derivedFrontmatter(name, text)}\n${text}`
      mkdirSync(join(this.dshHome(), 'skills'), { recursive: true })
      const target = this.userSkillPath(name)
      writeFileSync(target, body, 'utf8')
      imported.push({ name, path: target })
    }
    return { imported, skipped }
  }

  /** @returns installed user skills with the hash of each file on disk. */
  private installedSkills(): { name: string, sha256: string }[] {
    const root = join(this.dshHome(), 'skills')
    let names: string[]
    try {
      names = readdirSync(root).filter(file => file.endsWith('.md'))
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      this.ctx.logger.warn(`skills: installed list is unreadable: ${String(error)}`)
      return []
    }
    return names
      .map(file => file.slice(0, -3))
      .filter(name => SKILL_NAME.test(name))
      .map(name => ({
        name,
        sha256: createHash('sha256').update(readFileSync(this.userSkillPath(name), 'utf8'), 'utf8').digest('hex'),
      }))
  }

  private dshHome(): string {
    return resolveDshHome()
  }

  private userSkillPath(name: string): string {
    return join(this.dshHome(), 'skills', `${name}.md`)
  }

  private isUserSkillPath(path: string): boolean {
    const root = join(this.dshHome(), 'skills')
    const relativePath = relative(root, path)
    return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath)
  }

  /** Read the stored enablement document; a missing file is the normal first run. */
  private readSettings(): { disabled: string[], autoAttach: boolean } {
    try {
      const parsed: unknown = JSON.parse(readFileSync(join(this.dshHome(), 'skills.json'), 'utf8'))
      if (typeof parsed !== 'object' || parsed === null) return { disabled: [], autoAttach: false }
      const value = (parsed as { disabled?: unknown }).disabled
      const disabled = Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string') : []
      return { disabled, autoAttach: (parsed as { autoAttach?: unknown }).autoAttach === true }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.ctx.logger.warn(`skills: stored settings are unreadable: ${String(error)}`)
      }
      return { disabled: [], autoAttach: false }
    }
  }

  private readDisabled(): string[] {
    return this.readSettings().disabled
  }

  private readAutoAttach(): boolean {
    return this.readSettings().autoAttach
  }

  private applyStoredDisabled(registry: SkillRegistry): void {
    registry.setDisabled(this.readDisabled())
  }

  /** Merge one setting into the stored document and apply the enablement it carries. */
  private writeSettings(registry: SkillRegistry, patch: { disabled?: readonly string[], autoAttach?: boolean }): void {
    const current = this.readSettings()
    const next = {
      disabled: patch.disabled === undefined ? current.disabled : [...new Set(patch.disabled)],
      autoAttach: patch.autoAttach === undefined ? current.autoAttach : patch.autoAttach,
    }
    mkdirSync(this.dshHome(), { recursive: true })
    writeFileSync(join(this.dshHome(), 'skills.json'), `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    registry.setDisabled(next.disabled)
  }

  /**
   * Resolve the registry a Session composition reads: its live preset layer when
   * the Agent exists, otherwise a standing preset scope, otherwise the host layer.
   * @param sessionId - Session whose cwd and preset select the registry.
   * @param signal - caller lifetime carried by the Remote transport.
   * @returns registry, workspace cwd, and the optional scope key.
   */
  private async targetFor(
    sessionId: SessionId | undefined, signal: AbortSignal,
  ): Promise<{ registry: SkillRegistry, cwd: string, scope: ScopeKey | undefined, release?: () => Promise<void> }> {
    if (sessionId === undefined) {
      const registry = this.ctx.get('skills')
      if (registry === undefined) {
        throw new RemoteError('gateway/internal', 'skill registry is absent from the host composition', {})
      }
      // Presets own local discovery: the host layer alone lists bundled skills
      // only, so a management read without a Session resolves the standing
      // default preset and merges its layer.
      const lease = await this.scopeFor(undefined)
      return {
        registry,
        cwd: this.ctx.workingDirectory.defaultDirectory,
        scope: lease?.key,
        ...lease === undefined ? {} : { release: async () => { await lease[Symbol.asyncDispose]() } },
      }
    }
    let cwd: string
    let agentPreset: string | undefined
    try {
      using observation = await this.ctx.sessionQuery.observeSession(sessionId)
      if (observation.projections === undefined) {
        throw new Error('skill catalog requires a projected Session observation')
      }
      cwd = observation.projections.values.workingDirectory
        ?? observation.header.cwd
        ?? this.ctx.workingDirectory.defaultDirectory
      agentPreset = observation.projections.values.agentPreset ?? undefined
      const live = this.ctx.agents.get(sessionId)
      if (live !== undefined) cwd = await this.ctx.workingDirectory.ensure(live, signal)
    } catch (error: unknown) {
      if (error instanceof SessionQueryError
        && error.code === 'SESSION_QUERY_SESSION_NOT_FOUND') {
        throw new RemoteError('session/not-found', `session "${sessionId}" not found`, { sessionId })
      }
      throw new RemoteError(
        'gateway/internal',
        `session "${sessionId}" could not be inspected: ${String(error)}`,
        {},
      )
    }

    const live = this.ctx.agents.get(sessionId)
    const presets = this.ctx.get('agentPresets')
    const scoped = live === undefined ? undefined : presets?.serviceFor(live, 'skills')
    const registry = scoped ?? this.ctx.get('skills')
    if (registry === undefined) {
      throw new RemoteError(
        'gateway/internal',
        'skill registry is absent: neither this session\'s agent preset nor the host composition mounts @deepseek-ai/dsh-skill',
        {},
      )
    }

    const lease = live === undefined ? await this.scopeFor(agentPreset) : undefined
    return { registry, cwd, scope: live ?? lease?.key }
  }

  /** Resolve a live or standing preset scope without creating an Agent. */
  private async scopeFor(
    agentPreset: string | undefined,
  ): Promise<({ key: ScopeKey } & AsyncDisposable) | undefined> {
    const presets = this.ctx.get('agentPresets')
    if (presets === undefined) return undefined
    try {
      return await presets.acquireScope(agentPreset)
    } catch {
      // An unknown or unusable recorded preset falls back to the global registry.
      return undefined
    }
  }
}

/**
 * Read a one-line summary from a skill file: its "Use this" line, else the first
 * non-empty line, capped for the list row.
 * @param text - Markdown body of the skill.
 * @returns the summary line.
 */
function skillSummary(text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '')
  const summary = lines.find(line => line.startsWith('Use this')) ?? lines[0] ?? ''
  return summary.length <= 240 ? summary : `${summary.slice(0, 237)}...`
}

/** Where a deployment reads its skill catalog from. */
const DEFAULT_SKILLS_INDEX_URL = 'https://github.com/hvkeyn/deepseek-harness/releases/download/skills-v1/skills-index.json'

/**
 * Build the frontmatter a foreign skill file is missing.
 * @param name - skill name taken from the file name.
 * @param text - file body whose trigger line becomes the description.
 * @returns a YAML frontmatter block with a JSON-quoted description.
 */
function derivedFrontmatter(name: string, text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '')
  const trigger = lines.find(line => /^use this\b/iu.test(line)) ?? lines.find(line => !line.startsWith('#')) ?? name
  const description = trigger.length <= 200 ? trigger : `${trigger.slice(0, 197)}...`
  return `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n`
}

/** @returns the configured catalog index URL. */
function skillsIndexUrl(): string {
  return process.env.DSH_SKILLS_INDEX_URL ?? DEFAULT_SKILLS_INDEX_URL
}

/**
 * Read the catalog document, rejecting a malformed one at the network boundary.
 * @param parsed - JSON body of the catalog index.
 * @returns the validated entries.
 * @throws RemoteError when the document is not a catalog.
 */
function parseCatalog(parsed: unknown): SkillCatalogEntry[] {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new RemoteError('gateway/internal', 'skill catalog is not an object', {})
  }
  const skills = (parsed as { skills?: unknown }).skills
  if (!Array.isArray(skills)) {
    throw new RemoteError('gateway/internal', 'skill catalog has no skills array', {})
  }
  return skills.map((raw) => {
    const value = raw as { name?: unknown, version?: unknown, url?: unknown, sha256?: unknown, bytes?: unknown, description?: unknown }
    if (typeof value.name !== 'string' || typeof value.url !== 'string' || typeof value.sha256 !== 'string') {
      throw new RemoteError('gateway/internal', 'skill catalog entry is malformed', {})
    }
    const description = value.description as { en?: unknown, ru?: unknown, zh?: unknown } | undefined
    return {
      name: value.name,
      version: typeof value.version === 'string' ? value.version : '',
      url: value.url,
      sha256: value.sha256,
      ...typeof value.bytes === 'number' ? { bytes: value.bytes } : {},
      description: {
        en: typeof description?.en === 'string' ? description.en : '',
        ...typeof description?.ru === 'string' ? { ru: description.ru } : {},
        ...typeof description?.zh === 'string' ? { zh: description.zh } : {},
      },
    }
  })
}

export default SessionSkillCatalog
