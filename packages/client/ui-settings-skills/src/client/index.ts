/** Skills management tab registered into the Plugins settings section. */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { SkillsSettingsTab, type SkillsSettingsTabInjected } from './SkillsSettingsTab.tsx'
import { en, zh, type SkillsLocaleKey } from './locales.ts'
import type { SkillAdminEntry } from './api.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Skills management tab copy. */
    'settings.skills': SkillsLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.skills'

/** Services required by the Settings registration and the generated Remote face. */
export const inject = ['slots', 'locale', 'remote', 'remote.skills']

/** Unwrap one Remote result, turning a failure into a thrown error for the tab. */
async function unwrap<T>(
  run: () => Promise<{ ok: true, value: T } | { ok: false, error: { code: string, message: string } }>,
): Promise<T> {
  const result = await run()
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return result.value
}

/** Contribute the Skills tab to the Plugins settings section. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-settings-skills: dictionaries')
  const t = ctx.locale.bind(NS)

  const actions: SkillsSettingsTabInjected = {
    list: async () => {
      const value = await unwrap(() => ctx.remote.skills.listAdmin({}))
      return value.skills as readonly SkillAdminEntry[]
    },
    setEnabled: async (name, enabled) => { await unwrap(() => ctx.remote.skills.setEnabled({ name, enabled })) },
    create: async (name, content) => { await unwrap(() => ctx.remote.skills.create({ name, content })) },
    remove: async (name) => { await unwrap(() => ctx.remote.skills.remove({ name })) },
  }

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'skills',
    order: 20,
    label: () => t('tab'),
    locale: NS,
    inject: (): SkillsSettingsTabInjected => actions,
  }, SkillsSettingsTab))
}
