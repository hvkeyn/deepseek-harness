/** Header chip that reports whether the Harness link is healthy, slow, or down. */

import { useEffect, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './ConnectionStatus.module.css'

/** One measurement outcome. */
type Mode = 'checking' | 'online' | 'slow' | 'offline'

/** Round-trip above this threshold counts as a slow link. */
const SLOW_MS = 1500

/** How often the chip re-measures the link. */
const INTERVAL_MS = 30_000

/** Composed props: only the locale seat. */
export type ConnectionStatusProps = PropsLocale<'connectionStatus'>

/**
 * Render the connection chip.
 * @param props - locale seat.
 * @returns the chip element.
 */
export function ConnectionStatus({ t }: ConnectionStatusProps) {
  const [mode, setMode] = useState<Mode>('checking')

  useEffect(() => {
    let active = true
    const measure = async (): Promise<void> => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (active) setMode('offline')
        return
      }
      const started = performance.now()
      try {
        const response = await fetch(`${location.origin}/`, { method: 'HEAD', cache: 'no-store' })
        const elapsed = performance.now() - started
        if (!active) return
        setMode(!response.ok ? 'offline' : elapsed > SLOW_MS ? 'slow' : 'online')
      } catch {
        if (active) setMode('offline')
      }
    }
    void measure()
    const timer = window.setInterval(() => { void measure() }, INTERVAL_MS)
    const onChange = (): void => { void measure() }
    window.addEventListener('online', onChange)
    window.addEventListener('offline', onChange)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('online', onChange)
      window.removeEventListener('offline', onChange)
    }
  }, [])

  return (
    <span className={css.chip} title={t(`tip.${mode}`)} data-mode={mode}>
      <span className={css.dot} aria-hidden="true" />
      <span className={css.label}>{t(`label.${mode}`)}</span>
    </span>
  )
}
