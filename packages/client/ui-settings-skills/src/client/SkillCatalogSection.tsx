// Remote skill catalog: list published skills, show what is installed, and
// install or refresh one file. Every action reports its progress in place, so a
// download never looks like a dead button.

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
 * Render the catalog rows with their install state and live progress.
 * @param props - catalog actions and copy.
 * @returns the catalog section.
 */
export function SkillCatalogSection({ loadCatalog, install, t }: SkillCatalogSectionProps) {
  const [catalog, setCatalog] = useState<CatalogSnapshot | undefined>(undefined)
  const [busy, setBusy] = useState<'load' | string | undefined>(undefined)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = async (): Promise<CatalogSnapshot | undefined> => {
    setBusy('load')
    setFailure('')
    try {
      const value = await loadCatalog()
      setCatalog(value)
      return value
    } catch (error: unknown) {
      setFailure(error instanceof Error ? error.message : t('catalog.failed'))
      return undefined
    } finally { setBusy(undefined) }
  }

  const installOne = async (name: string): Promise<void> => {
    setBusy(name)
    setFailure('')
    setNotice(t('catalog.installing').replace('{name}', name))
    try {
      await install(name)
      await refresh()
      setNotice(t('catalog.done').replace('{name}', name))
    } catch (error: unknown) {
      setNotice('')
      setFailure(error instanceof Error ? error.message : t('catalog.failed'))
    } finally { setBusy(undefined) }
  }

  return (
    <section className={css.section} aria-label={t('catalog.title')}>
      <div className={css.header}>
        <h3 className={css.title}>{t('catalog.title')}</h3>
        <button type="button" className={css.action} disabled={busy !== undefined} onClick={() => { void refresh() }}>
          {busy === 'load' ? t('catalog.loading') : catalog === undefined ? t('catalog.load') : t('catalog.reload')}
        </button>
      </div>
      {failure === '' ? null : <p className={css.error} role="alert">{failure}</p>}
      {notice === '' ? null : <p className={css.notice} role="status">{notice}</p>}
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
                const installing = busy === skill.name
                return (
                  <li key={skill.name} className={css.row}>
                    <div className={css.text}>
                      <span className={css.name}>{skill.name}</span>
                      <span className={css.description}>{skill.description}</span>
                      <span className={css.state}>
                        {installing
                          ? t('catalog.installing').replace('{name}', skill.name)
                          : state === 'current' ? t('catalog.installed') : state === 'update' ? t('catalog.updateAvailable') : t('catalog.notInstalled')}
                      </span>
                    </div>
                    <button type="button" className={css.action} disabled={busy !== undefined || state === 'current'}
                      onClick={() => { void installOne(skill.name) }}>
                      {installing
                        ? t('catalog.loading')
                        : state === 'update' ? t('catalog.update') : state === 'current' ? t('catalog.installed') : t('catalog.install')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
    </section>
  )
}
