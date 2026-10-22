// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AttachedSkills, type AttachedSkillsInjected } from '../src/client/AttachedSkills.tsx'
import { en } from '../src/client/locales.ts'

const t = (key: keyof typeof en): string => en[key]

afterEach(cleanup)

function renderDock(overrides: Partial<AttachedSkillsInjected> = {}) {
  const load = vi.fn(async () => ({ autoAttach: true, names: ['review', 'research'] }))
  render(<AttachedSkills t={t} load={load} {...overrides} />)
  return { load }
}

describe('AttachedSkills', () => {
  it('lists the enabled skill names when automatic attachment is on', async () => {
    renderDock()
    await waitFor(() => { expect(screen.getByText('review · research')).toBeDefined() })
    expect(screen.getByText(en['attached.title'])).toBeDefined()
  })

  it('stays hidden when attachment is off', async () => {
    const load = vi.fn(async () => ({ autoAttach: false, names: ['review'] }))
    render(<AttachedSkills t={t} load={load} />)
    await waitFor(() => { expect(load).toHaveBeenCalled() })
    expect(screen.queryByText('review')).toBeNull()
  })

  it('stays hidden when the read fails', async () => {
    const load = vi.fn(async (): Promise<{ autoAttach: boolean, names: readonly string[] }> => {
      throw new Error('offline')
    })
    render(<AttachedSkills t={t} load={load} />)
    await waitFor(() => { expect(load).toHaveBeenCalled() })
    expect(screen.queryByText(en['attached.title'])).toBeNull()
  })
})
