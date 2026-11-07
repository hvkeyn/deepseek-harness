/** Sidebar footer menu: open the plugin market and start a plugin-creation session. */

import { useEffect, useRef, useState } from 'react'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { IconEllipsisOutlineRegular, MenuSurface } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './EntryMenu.module.css'

/** Actions the menu dispatches. */
export interface EntryMenuFace {
  /** Open the Plugins panel on its market tab. */
  readonly browsePlugins: () => void
  /** Open the plug-in install dialog for a package spec. */
  readonly addPlugin: () => void
  /** Start a session that writes a new plugin. */
  readonly createPlugin: () => void
}

/** Composed props of the footer menu. */
export type EntryMenuProps = PropsLocale<'pluginMarket'> & InjectFace<EntryMenuFace>

/**
 * Render the sidebar footer menu with the three plugin entries.
 * @param props - locale seat and the injected actions.
 * @returns the trigger and, while open, its menu.
 */
export function EntryMenu({ t, browsePlugins, addPlugin, createPlugin }: EntryMenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => { document.removeEventListener('mousedown', close) }
  }, [open])

  return (
    <div className={css.root} ref={root}>
      <button
        type="button"
        className={open ? css.triggerOpen : css.trigger}
        title={t('menu.title')}
        aria-label={t('menu.title')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => { setOpen(value => !value) }}
      >
        <IconEllipsisOutlineRegular size={16} />
      </button>
      {open ? (
        <MenuSurface className={css.menu} role="menu" aria-label={t('menu.title')}>
          <button type="button" role="menuitem" className={css.item}
            onClick={() => { setOpen(false); browsePlugins() }}>
            {t('menu.browse')}
          </button>
          <button type="button" role="menuitem" className={css.item}
            onClick={() => { setOpen(false); addPlugin() }}>
            {t('menu.add')}
          </button>
          <button type="button" role="menuitem" className={css.item}
            onClick={() => { setOpen(false); createPlugin() }}>
            {t('menu.create')}
          </button>
        </MenuSurface>
      ) : null}
    </div>
  )
}
