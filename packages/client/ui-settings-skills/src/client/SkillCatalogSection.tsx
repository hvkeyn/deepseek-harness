// Remote skill catalog: list published skills, show what is installed, install or
// refresh one file, and update everything outdated in one pass. The section loads
// itself when the tab opens, so the list is never an empty placeholder.

import { useEffect, useMemo, useState } from 'react'
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
  /** Published file size in bytes, when known. */
  readonly bytes?: number
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
  /** Called after a successful install so the local list can refresh. */
  readonly onInstalled?: () => void
  /** Translate one key of the `settings.skills` namespace. */
  readonly t: TranslateNS<'settings.skills'>
}

/**
 * Render the catalog rows with their install state and live progress.
 * @param props - catalog actions and copy.
 * @returns the catalog section.
 */
export function SkillCatalogSection({ loadCatalog, install, onInstalled, t }: SkillCatalogSectionProps) {
  const [catalog, setCatalog] = useState<CatalogSnapshot | undefined>(undefined)
  const [busy, setBusy] = useState<'load' | string | undefined>(undefined)
  const [queue, setQueue] = useState<{ done: number, total: number } | undefined>(undefined)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')

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

  // The tab shows a live catalog by default; a manual refresh still re-reads it.
  useEffect(() => {
    let active = true
    void loadCatalog()
      .then((value) => { if (active) setCatalog(value) })
      .catch((error: unknown) => {
        if (active) setFailure(error instanceof Error ? error.message : t('catalog.failed'))
      })
    return () => { active = false }
  }, [loadCatalog, t])

  const stateOf = (skill: CatalogSkill): 'new' | 'current' | 'update' => {
    const installed = catalog?.installed.find(entry => entry.name === skill.name)
    if (installed === undefined) return 'new'
    return installed.sha256 === skill.sha256 ? 'current' : 'update'
  }

  const installOne = async (name: string): Promise<boolean> => {
    setBusy(name)
    setFailure('')
    setNotice(t('catalog.installing').replace('{name}', name))
    try {
      await install(name)
      await refresh()
      onInstalled?.()
      setNotice(t('catalog.done').replace('{name}', name))
      return true
    } catch (error: unknown) {
      setNotice('')
      setFailure(error instanceof Error ? error.message : t('catalog.failed'))
      return false
    } finally { setBusy(undefined) }
  }

  const outdated = useMemo(() => (catalog?.skills ?? []).filter(skill => stateOf(skill) === 'update'), [catalog])

  const updateAll = async (): Promise<void> => {
    const targets = outdated.map(skill => skill.name)
    if (targets.length === 0) return
    setQueue({ done: 0, total: targets.length })
    for (const [index, name] of targets.entries()) {
      const ok = await installOne(name)
      setQueue({ done: index + 1, total: targets.length })
      if (!ok) break
    }
    setQueue(undefined)
  }

  const rows = useMemo(() => {
    const all = catalog?.skills ?? []
    const needle = query.trim().toLowerCase()
    const filtered = needle === ''
      ? all
      : all.filter(skill => skill.name.includes(needle) || skill.description.toLowerCase().includes(needle))
    const rank = (skill: CatalogSkill): number => ({ update: 0, new: 1, current: 2 })[stateOf(skill)]
    return [...filtered].sort((left, right) => rank(left) - rank(right) || left.name.localeCompare(right.name))
  }, [catalog, query])

  const installedCount = catalog?.installed.length ?? 0
  const total = catalog?.skills.length ?? 0

  return (
    <section className={css.section} aria-label={t('catalog.title')}>
      <div className={css.header}>
        <div className={css.heading}>
          <h3 className={css.title}>{t('catalog.title')}</h3>
          {catalog === undefined
            ? <span className={css.counts}>{t('catalog.loading')}</span>
            : (
              <span className={css.counts}>
                {t('catalog.counts').replace('{installed}', String(installedCount)).replace('{total}', String(total))}
                {outdated.length === 0 ? '' : ` · ${t('catalog.updates').replace('{count}', String(outdated.length))}`}
              </span>
            )}
        </div>
        <div className={css.actions}>
          {outdated.length === 0 ? null : (
            <button type="button" className={css.primary} disabled={busy !== undefined} onClick={() => { void updateAll() }}>
              {queue === undefined
                ? t('catalog.updateAll')
                : t('catalog.updatingAll').replace('{done}', String(queue.done)).replace('{total}', String(queue.total))}
            </button>
          )}
          <button type="button" className={css.action} disabled={busy !== undefined} onClick={() => { void refresh() }}>
            {busy === 'load' ? t('catalog.loading') : t('catalog.reload')}
          </button>
        </div>
      </div>

      {queue === undefined ? null : (
        <div className={css.bar} role="progressbar" aria-valuemin={0} aria-valuemax={queue.total} aria-valuenow={queue.done}
          aria-label={t('catalog.updateAll')}>
          <span className={css.barFill} style={{ width: `${String(Math.round((queue.done / queue.total) * 100))}%` }} />
        </div>
      )}
      {busy === undefined || queue !== undefined ? null : (
        <div className={css.bar} role="progressbar" aria-label={t('catalog.loading')}><span className={css.barSweep} /></div>
      )}

      {failure === '' ? null : <p className={css.error} role="alert">{failure}</p>}
      {notice === '' ? null : <p className={css.notice} role="status">{notice}</p>}

      {catalog === undefined
        ? <p className={css.hint}>{t('catalog.hint')}</p>
        : total === 0
          ? <p className={css.hint}>{t('catalog.empty')}</p>
          : (
            <>
              <input className={css.search} value={query} placeholder={t('catalog.search')} aria-label={t('catalog.search')}
                onChange={(event) => { setQuery(event.target.value) }} />
              {rows.length === 0
                ? <p className={css.hint}>{t('catalog.noMatch')}</p>
                : (
                  <ul className={css.list}>
                    {rows.map((skill) => {
                      const state = stateOf(skill)
                      const installing = busy === skill.name
                      return (
                        <li key={skill.name} className={css.card}>
                          <div className={css.text}>
                            <div className={css.line}>
                              <span className={css.name}>{skill.name}</span>
                              {skill.version === '' ? null : <span className={css.version}>{skill.version}</span>}
                              {skill.bytes === undefined ? null : <span className={css.size}>{`${String(Math.max(1, Math.round(skill.bytes / 1024)))} KB`}</span>}
                            </div>
                            <span className={css.description}>{skill.description}</span>
                            <span className={state === 'update' ? css.stateUpdate : state === 'current' ? css.stateCurrent : css.stateNew}>
                              {state === 'update' ? t('catalog.updateAvailable') : state === 'current' ? t('catalog.installed') : t('catalog.notInstalled')}
                            </span>
                          </div>
                          <button type="button"
                            className={state === 'current' ? css.installed : css.action}
                            disabled={busy !== undefined || state === 'current'}
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
            </>
          )}
    </section>
  )
}
