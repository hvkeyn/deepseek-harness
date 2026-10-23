// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { AttachedSkills, type AttachedSkillsInjected } from '../src/client/AttachedSkills.tsx'
import { en } from '../src/client/locales.ts'

const t = ((key: string): string => (en as Record<string, string>)[key] ?? key) as TranslateNS<'skill'>

afterEach(cleanup)

function renderDock(overrides: Partial<AttachedSkillsInjected> = {}) {
  const load = vi.fn(async () => ({ names: ['review', 'research'] }))
  render(<AttachedSkills t={t} load={load} {...overrides} />)
  return { load }
}

describe('AttachedSkills', () => {
  it('shows the applied skills as chips', async () => {
    renderDock()
    await waitFor(() => { expect(screen.getByText('review')).toBeDefined() })
    expect(screen.getByText('research')).toBeDefined()
    expect(screen.getByText(en['active.title'])).toBeDefined()
  })

  it('collapses a long list into a counter chip', async () => {
    const load = vi.fn(async () => ({ names: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }))
    render(<AttachedSkills t={t} load={load} />)
    await waitFor(() => { expect(screen.getByText('+2')).toBeDefined() })
  })

  it('stays hidden when nothing was applied', async () => {
    const load = vi.fn(async () => ({ names: [] }))
    render(<AttachedSkills t={t} load={load} />)
    await waitFor(() => { expect(load).toHaveBeenCalled() })
    expect(screen.queryByText(en['active.title'])).toBeNull()
  })
})
