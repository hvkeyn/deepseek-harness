// Composer dock listing the skills this Session actually applied — from a /name
// gesture or automatic attachment. Each skill is a coloured chip so the applied
// set reads at a glance; a long set collapses into a +N chip.

import { useEffect, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './AttachedSkills.module.css'

/** Business face: the applied skill names of the current Session. */
export interface AttachedSkillsInjected {
  /** Read the skills applied so far. */
  readonly load: () => Promise<{ names: readonly string[] }>
}

/** Full component props: locale seat plus the injected loader. */
export type AttachedSkillsProps = PropsLocale<'skill'> & AttachedSkillsInjected

/** Refetch cadence while the composer is mounted, in milliseconds. */
const REFRESH_MS = 2_500

/** How many chips fit before the rest collapse into a counter. */
const VISIBLE_CHIPS = 5

/**
 * Render the applied-skill chips.
 * @param props - locale copy and the loader.
 * @returns the chip row, or null when nothing was applied.
 */
export function AttachedSkills({ t, load }: AttachedSkillsProps) {
  const [names, setNames] = useState<readonly string[]>([])

  useEffect(() => {
    let active = true
    const read = async (): Promise<void> => {
      try {
        const value = await load()
        if (active) setNames(value.names)
      } catch {
        // The dock is informational: a failed read keeps the last list.
      }
    }
    void read()
    const timer = setInterval(() => { void read() }, REFRESH_MS)
    return () => { active = false; clearInterval(timer) }
  }, [load])

  if (names.length === 0) return null
  const visible = names.slice(0, VISIBLE_CHIPS)
  const hidden = names.length - visible.length
  return (
    <div className={css.dock} title={`${t('active.title')}: ${names.join(', ')}`}>
      <span className={css.label}>{t('active.title')}</span>
      {visible.map((name, index) => (
        <span key={name} className={`${css.chip} ${index % 5 === 0 ? css.c0 : index % 5 === 1 ? css.c1 : index % 5 === 2 ? css.c2 : index % 5 === 3 ? css.c3 : css.c4}`}>{name}</span>
      ))}
      {hidden <= 0 ? null : <span className={css.chipMore}>{t('active.more').replace('{count}', String(hidden))}</span>}
    </div>
  )
}
