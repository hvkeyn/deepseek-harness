/** Session-addressed, cold-readable skill catalog Remote and its management surface. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-preset-registry/types'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import type { SkillRegistry } from '@deepseek-ai/dsh-skill'
import { isUserInvocable } from '@deepseek-ai/dsh-skill'
import { SessionQueryError } from '@deepseek-ai/dsh-session-query'
import type {} from '@deepseek-ai/dsh-working-directory'
import type { ScopeKey } from '@deepseek-ai/dsh-scope'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, isAbsolute } from 'node:path'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {
  SkillAdminListRequest, SkillAdminValue, SkillCreateRequest, SkillListRequest, SkillListValue, SkillMutationValue,
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
    const disabled = this.readDisabled()
    target.registry.setDisabled(disabled)
    const skills = await target.registry.list({ cwd: target.cwd, scope: target.scope, includeDisabled: true })
    return {
      disabled,
      skills: skills.map(skill => ({
        name: skill.name,
        description: skill.description,
        ...skill.path === undefined ? {} : { path: skill.path },
        enabled: !disabled.includes(skill.name),
      })),
    }
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
    this.writeDisabled(target.registry, [...disabled])
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
  async remove(request: SkillRemoveRequest, signal: AbortSignal): Promise<SkillMutationValue> {
    if (!SKILL_NAME.test(request.name)) {
      throw new RemoteError('gateway/bad-request', `invalid skill name "${request.name}"`, {})
    }
    const target = await this.targetFor(request.sessionId, signal)
    const skills = await target.registry.list({ cwd: target.cwd, scope: target.scope, includeDisabled: true })
    const match = skills.find(skill => skill.name === request.name)
    const path = match?.path
    if (path === undefined) {
      throw new RemoteError('gateway/bad-request', `skill "${request.name}" has no file to remove`, {})
    }
    if (!this.isUserSkillPath(path)) {
      throw new RemoteError('gateway/bad-request',
        `skill "${request.name}" is not in the user skill root`, {})
    }
    rmSync(path, { force: true })
    const disabled = this.readDisabled().filter(name => name !== request.name)
    this.writeDisabled(target.registry, disabled)
    return { path, disabled }
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

  private readDisabled(): string[] {
    try {
      const parsed: unknown = JSON.parse(readFileSync(join(this.dshHome(), 'skills.json'), 'utf8'))
      if (typeof parsed !== 'object' || parsed === null) return []
      const value = (parsed as { disabled?: unknown }).disabled
      return Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string') : []
    } catch (error: unknown) {
      // A missing file is the normal first run; anything else is worth a diagnostic.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.ctx.logger.warn(`skills: stored enablement is unreadable: ${String(error)}`)
      }
      return []
    }
  }

  private applyStoredDisabled(registry: SkillRegistry): void {
    registry.setDisabled(this.readDisabled())
  }

  private writeDisabled(registry: SkillRegistry, names: readonly string[]): void {
    mkdirSync(this.dshHome(), { recursive: true })
    writeFileSync(join(this.dshHome(), 'skills.json'), `${JSON.stringify({ disabled: [...new Set(names)] }, null, 2)}\n`, 'utf8')
    registry.setDisabled(names)
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
  ): Promise<{ registry: SkillRegistry, cwd: string, scope: ScopeKey | undefined }> {
    if (sessionId === undefined) {
      const registry = this.ctx.get('skills')
      if (registry === undefined) {
        throw new RemoteError('gateway/internal', 'skill registry is absent from the host composition', {})
      }
      return { registry, cwd: this.ctx.workingDirectory.defaultDirectory, scope: undefined }
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

export default SessionSkillCatalog
