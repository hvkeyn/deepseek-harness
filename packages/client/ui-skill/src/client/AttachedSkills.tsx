// Composer dock reading of the skills the session carries automatically. The
// block is silent unless Auto-attach skills is on and at least one skill is
// enabled, so the dock never competes with the composer for empty state.

import { useEffect, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './AttachedSkills.module.css'

/** Business face: the enabled skill names behind automatic attachment. */
export interface AttachedSkillsInjected {
  /** Read the automatic-attachment state and the enabled skill names. */
  readonly load: () => Promise<{ autoAttach: boolean, names: readonly string[] }>
}

/** Full component props: locale seat plus the injected loader. */
export type AttachedSkillsProps = PropsLocale<'skill'> & AttachedSkillsInjected

/**
 * Render the attached-skill names above the composer.
 * @param props - locale copy and the loader.
 * @returns the chip row, or null when attachment is off or empty.
 */
export function AttachedSkills({ t, load }: AttachedSkillsProps) {
  const [state, setState] = useState<{ autoAttach: boolean, names: readonly string[] }>({ autoAttach: false, names: [] })

  useEffect(() => {
    let active = true
    void load()
      .then((value) => { if (active) setState(value) })
      .catch(() => {
        // The dock is informational; a failed read leaves it hidden.
        if (active) setState({ autoAttach: false, names: [] })
      })
    return () => { active = false }
  }, [load])

  if (!state.autoAttach || state.names.length === 0) return null
  return (
    <div className={css.dock} title={t('attached.title')}>
      <span className={css.label}>{t('attached.title')}</span>
      <span className={css.names}>{state.names.join(' · ')}</span>
    </div>
  )
}
