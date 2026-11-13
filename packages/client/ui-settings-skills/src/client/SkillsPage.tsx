/** Scrollable page wrapper for the Skills main panel. */

import type { SkillsSettingsTabProps } from './SkillsSettingsTab.tsx'
import { SkillsSettingsTab } from './SkillsSettingsTab.tsx'
import css from './SkillsPage.module.css'

/**
 * Render the skills management surface as a main panel page.
 * @param props - the tab's composed props.
 * @returns the page element.
 */
export function SkillsPage(props: SkillsSettingsTabProps) {
  return (
    <div className={css.page}>
      <SkillsSettingsTab {...props} />
    </div>
  )
}
