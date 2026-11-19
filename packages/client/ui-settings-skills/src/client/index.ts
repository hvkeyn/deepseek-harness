/** Skills management tab registered into the Plugins settings section. */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { SkillsSettingsTab, type SkillsSettingsTabInjected } from './SkillsSettingsTab.tsx'
import { SkillsPage } from './SkillsPage.tsx'
import type { CatalogSnapshot } from './SkillCatalogSection.tsx'
import { SkillsPanelIcon } from './SkillsPanelIcon.tsx'
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

  const language = (): 'ru' | 'zh' | 'en' => {
    const tag = (navigator.language || 'en').toLowerCase()
    return tag.startsWith('ru') ? 'ru' : tag.startsWith('zh') ? 'zh' : 'en'
  }
  const loadCatalog = async (): Promise<CatalogSnapshot> => {
    const value = await unwrap(() => ctx.remote.skills.fetchCatalog({}))
    const current = language()
    return {
      installed: value.installed,
      skills: value.skills.map(skill => ({
        name: skill.name,
        version: skill.version,
        sha256: skill.sha256,
        ...skill.bytes === undefined ? {} : { bytes: skill.bytes },
        description: (current === 'ru' ? skill.description.ru : current === 'zh' ? skill.description.zh : undefined)
          ?? skill.description.en,
      })),
    }
  }
  const installSkill = async (name: string): Promise<void> => { await unwrap(() => ctx.remote.skills.installSkill({ name })) }

  const actions: SkillsSettingsTabInjected = {
    list: async () => {
      const value = await unwrap(() => ctx.remote.skills.listAdmin({}))
      return { skills: value.skills as readonly SkillAdminEntry[], autoAttach: value.autoAttach }
    },
    setAutoAttach: async (enabled) => { await unwrap(() => ctx.remote.skills.setAutoAttach({ enabled })) },
    setEnabled: async (name, enabled) => { await unwrap(() => ctx.remote.skills.setEnabled({ name, enabled })) },
    create: async (name, content) => { await unwrap(() => ctx.remote.skills.create({ name, content })) },
    remove: async (name) => { await unwrap(() => ctx.remote.skills.removeSkill({ name })) },
    importSkill: async (path) => {
      const value = await unwrap(() => ctx.remote.skills.importSkill({ path }))
      return { imported: value.imported.map(entry => entry.name), skipped: value.skipped }
    },
    loadCatalog,
    install: installSkill,
  }

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'skills',
    order: 20,
    label: () => t('tab'),
    locale: NS,
    inject: (): SkillsSettingsTabInjected => actions,
  }, SkillsSettingsTab))

  // The same management surface as a first-class page in the left panel, so a
  // skill is toggled without opening Settings. Order 5 places it between Plugins
  // (0) and Automation tasks (10).
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: 'skills' as MainPanelId,
    locale: NS,
    inject: (): SkillsSettingsTabInjected => actions,
  }, SkillsPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: 'skills' as MainPanelId,
    order: 5,
    label: () => t('tab'),
    locale: NS,
  }, SkillsPanelIcon))
}