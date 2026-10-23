// Remote skill catalog: list published skills, show what is installed, and
// install or refresh one file. Kept apart from the tab so the list stays small.

import { useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import css from './SkillCatalogSection.module.css'

/** One skill as the catalog section shows it. */
export interface CatalogSkill {
  /** Kebab-case identifier. */
  readonly name: string
  /** Published version. */
  readonly version: string
  /** SHA-256 of the published file. */
  readonly sha256: string
  /** Localized summary resolved for the current language. */
  readonly description: string
}

/** Catalog snapshot plus the hashes of the installed files. */
export interface CatalogSnapshot {
  /** Published skills. */
  readonly skills: readonly CatalogSkill[]
  /** Installed names with their file hash. */
  readonly installed: readonly { readonly name: string, readonly sha256: string }[]
}

/** Catalog section actions and copy. */
export interface SkillCatalogSectionProps {
  /** Read the published catalog. */
  readonly loadCatalog: () => Promise<CatalogSnapshot>
  /** Install or refresh one skill. */
  readonly install: (name: string) => Promise<void>
  /** Translate one key of the `settings.skills` namespace. */
  readonly t: TranslateNS<'settings.skills'>
}

/**
 * Render the catalog rows with their install state.
 * @param props - catalog actions and copy.
 * @returns the catalog section.
 */
export function SkillCatalogSection({ loadCatalog, install, t }: SkillCatalogSectionProps) {
  const [catalog, setCatalog] = useState<CatalogSnapshot | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (action: () => Promise<void>): Promise<void> => {
    setError('')
    setBusy(true)
    try { await action() } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : t('catalog.failed'))
    } finally { setBusy(false) }
  }

  const refresh = async (): Promise<void> => { await run(async () => { setCatalog(await loadCatalog()) }) }

  return (
    <section className={css.section} aria-label={t('catalog.title')}>
      <div className={css.header}>
        <h3 className={css.title}>{t('catalog.title')}</h3>
        <button type="button" className={css.action} disabled={busy} onClick={() => { void refresh() }}>
          {catalog === undefined ? t('catalog.load') : t('catalog.reload')}
        </button>
      </div>
      {error === '' ? null : <p className={css.error} role="alert">{error}</p>}
      {catalog === undefined
        ? <p className={css.hint}>{t('catalog.hint')}</p>
        : catalog.skills.length === 0
          ? <p className={css.hint}>{t('catalog.empty')}</p>
          : (
            <ul className={css.list}>
              {catalog.skills.map((skill) => {
                const installed = catalog.installed.find(entry => entry.name === skill.name)
                const state = installed === undefined
                  ? 'new'
                  : installed.sha256 === skill.sha256 ? 'current' : 'update'
                return (
                  <li key={skill.name} className={css.row}>
                    <div className={css.text}>
                      <span className={css.name}>{skill.name}</span>
                      <span className={css.description}>{skill.description}</span>
                      <span className={css.state}>
                        {state === 'current' ? t('catalog.installed') : state === 'update' ? t('catalog.updateAvailable') : t('catalog.notInstalled')}
                      </span>
                    </div>
                    <button type="button" className={css.action} disabled={busy || state === 'current'}
                      onClick={() => { void run(async () => { await install(skill.name); const next = await loadCatalog(); setCatalog(next) }) }}>
                      {state === 'update' ? t('catalog.update') : state === 'current' ? t('catalog.installed') : t('catalog.install')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
    </section>
  )
}
