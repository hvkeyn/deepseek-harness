/** Sidebar icon for the Skills panel: three stacked rows with a spark. */

import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

/**
 * Draw the Skills panel icon.
 * @param props - the sidebar's icon seat, carrying the requested size.
 * @returns the icon element.
 */
export function SkillsPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2.5" width="12" height="3" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="6.75" width="12" height="3" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="11" width="7" height="2.6" rx="1.1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12.6 11.1l.55 1.25 1.25.55-1.25.55-.55 1.25-.55-1.25-1.25-.55 1.25-.55z" fill="currentColor" />
    </svg>
  )
}
