// Composer dock that shows a skill at the moment it is applied, then lets it sink
// into a small counter instead of hanging under the chat forever. A skill applied
// again reappears; the counter opens the full list on demand.

import { useEffect, useMemo, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './AttachedSkills.module.css'

/** One applied skill with the log position of its latest invocation. */
export interface AppliedSkill {
  readonly name: string
  /** Session sequence of the latest invocation; a change means it was applied again. */
  readonly seq: number
}

/** Business face: the applied skills of the current Session. */
export interface AttachedSkillsInjected {
  /** Read the skills applied so far. */
  readonly load: () => Promise<{ entries: readonly AppliedSkill[] }>
}

/** Full component props: locale seat plus the injected loader. */
export type AttachedSkillsProps = PropsLocale<'skill'> & AttachedSkillsInjected

/** Refetch cadence while the composer is mounted, in milliseconds. */
const REFRESH_MS = 2_500

/** How long a freshly applied skill stays visible, in milliseconds. */
const RECENT_MS = 120_000

/** How many chips fit before the rest collapse into a counter. */
const VISIBLE_CHIPS = 5

/**
 * Render the applied-skill chips: recent ones only, with an on-demand list.
 * @param props - locale copy and the loader.
 * @returns the chip row, or null when the Session applied nothing yet.
 */
export function AttachedSkills({ t, load }: AttachedSkillsProps) {
  const [entries, setEntries] = useState<readonly AppliedSkill[]>([])
  const [recent, setRecent] = useState<ReadonlyMap<string, number>>(new Map())
  const [expanded, setExpanded] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    const read = async (): Promise<void> => {
      try {
        const value = await load()
        if (!active) return
        const at = Date.now()
        setEntries(value.entries)
        setNow(at)
        setRecent((previous) => {
          const next = new Map(previous)
          for (const entry of value.entries) {
            if (previous.get(entry.name) === entry.seq) continue
            // A new invocation (first or repeated) starts its visible window.
            next.set(entry.name, at)
          }
          return next
        })
      } catch {
        // The dock is informational: a failed read keeps the last list.
      }
    }
    void read()
    const timer = setInterval(() => { void read() }, REFRESH_MS)
    return () => { active = false; clearInterval(timer) }
  }, [load])

  const fresh = useMemo(
    () => entries
      .filter(entry => now - (recent.get(entry.name) ?? 0) < RECENT_MS)
      .sort((left, right) => (recent.get(right.name) ?? 0) - (recent.get(left.name) ?? 0)),
    [entries, now, recent],
  )

  if (entries.length === 0) return null

  if (fresh.length === 0 && !expanded) {
    return (
      <div className={css.dock}>
        <button type="button" className={css.toggle} title={`${t('active.title')}: ${entries.map(entry => entry.name).join(', ')}`}
          onClick={() => { setExpanded(true) }}>
          {t('active.show').replace('{count}', String(entries.length))}
        </button>
      </div>
    )
  }

  const names = (expanded ? entries.map(entry => entry.name) : fresh.map(entry => entry.name))
  const visible = names.slice(0, VISIBLE_CHIPS)
  const hidden = names.length - visible.length
  return (
    <div className={css.dock} title={`${t('active.title')}: ${names.join(', ')}`}>
      <span className={css.label}>{t('active.title')}</span>
      {visible.map((name, index) => (
        <span key={name} className={`${css.chip} ${index % 5 === 0 ? css.c0 : index % 5 === 1 ? css.c1 : index % 5 === 2 ? css.c2 : index % 5 === 3 ? css.c3 : css.c4}`}>{name}</span>
      ))}
      {hidden <= 0 ? null : <span className={css.chipMore}>{t('active.more').replace('{count}', String(hidden))}</span>}
      {!expanded && names.length > 0 ? (
        <button type="button" className={css.toggle} title={t('active.collapse')} onClick={() => { setExpanded(true) }}>
          {t('active.show').replace('{count}', String(entries.length))}
        </button>
      ) : null}
      {expanded ? (
        <button type="button" className={css.toggle} onClick={() => { setExpanded(false) }}>{t('active.collapse')}</button>
      ) : null}
    </div>
  )
}
