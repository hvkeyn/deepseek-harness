/** Skills management tab: list local skills, toggle them, add and remove files. */

import { useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillAdminEntry } from './api.ts'
import css from './SkillsSettingsTab.module.css'

/** Business face injected by the registrant: Remote calls, not React wiring. */
export interface SkillsSettingsTabInjected {
  /** Read the catalog, including skills withheld from the model. */
  readonly list: () => Promise<readonly SkillAdminEntry[]>
  /** Withhold or restore one skill without deleting its file. */
  readonly setEnabled: (name: string, enabled: boolean) => Promise<void>
  /** Write a new user skill file. */
  readonly create: (name: string, content: string) => Promise<void>
  /** Delete a user skill file. */
  readonly remove: (name: string) => Promise<void>
}

/** Full component props: runtime share, locale seat, and the injected face. */
export type SkillsSettingsTabProps =
  PropsRuntime<'settings.plugins.tab'> & PropsLocale<'settings.skills'> & SkillsSettingsTabInjected

/** Name accepted by the local skill contract. */
const NAME = /^[a-z][a-z0-9-]{1,39}$/u

/**
 * Render the skills tab.
 * @param props - composed slot props and the Remote-backed actions.
 * @returns the tab element tree.
 */
export function SkillsSettingsTab({ t, list, setEnabled, create, remove }: SkillsSettingsTabProps) {
  const [skills, setSkills] = useState<readonly SkillAdminEntry[] | undefined>(undefined)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async (): Promise<void> => {
    try {
      setSkills(await list())
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }
  // Loading the catalog is the tab's one effect; toggles and adds refresh on demand.
  useEffect(() => {
    let active = true
    void list()
      .then((entries) => { if (active) setSkills(entries) })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : String(failure))
      })
    return () => { active = false }
  }, [list])

  const toggle = async (entry: SkillAdminEntry, enabled: boolean): Promise<void> => {
    setError('')
    try {
      await setEnabled(entry.name, enabled)
      await refresh()
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : t('toggleFailed'))
    }
  }

  const submit = async (): Promise<void> => {
    setError('')
    if (!NAME.test(name) || content.trim() === '') {
      setError(t('invalidName'))
      return
    }
    setBusy(true)
    try {
      await create(name, content)
      setName('')
      setContent('')
      await refresh()
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : t('saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const drop = async (entry: SkillAdminEntry): Promise<void> => {
    setError('')
    try {
      await remove(entry.name)
      await refresh()
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : t('removeFailed'))
    }
  }

  return (
    <section className={css.tab} aria-label={t('title')}>
      <header className={css.header}>
        <h2 className={css.title}>{t('title')}</h2>
        <p className={css.description}>{t('description')}</p>
      </header>
      {error === '' ? null : <p className={css.error} role="alert">{error}</p>}
      {skills === undefined
        ? <p className={css.empty}>{t('adding')}</p>
        : skills.length === 0
          ? <p className={css.empty}>{t('noSkills')}</p>
          : (
            <ul className={css.list}>
              {skills.map(skill => (
                <li key={skill.name} className={css.row}>
                  <div className={css.rowText}>
                    <span className={css.name}>{skill.name}</span>
                    <span className={css.summary}>{skill.description}</span>
                    {skill.path === undefined ? null : <span className={css.path}>{skill.path}</span>}
                  </div>
                  <Switch checked={skill.enabled} label={t('enabled')} onChange={(next) => { void toggle(skill, next) }} />
                  <button type="button" className={css.remove} title={t('removeTitle')} onClick={() => { void drop(skill) }}>
                    {t('remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}
      <form className={css.form} onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <h3 className={css.formTitle}>{t('addTitle')}</h3>
        <input className={css.input} value={name} placeholder={t('addName')} aria-label={t('addName')}
          onChange={(event) => { setName(event.target.value) }} />
        <textarea className={css.textarea} value={content} placeholder={t('addContent')} aria-label={t('addContent')}
          rows={6} onChange={(event) => { setContent(event.target.value) }} />
        <button type="submit" className={css.add} disabled={busy}>
          {busy ? t('adding') : t('add')}
        </button>
      </form>
    </section>
  )
}
