// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SkillsSettingsTab, type SkillsSettingsTabInjected, type SkillsSettingsTabProps } from '../src/client/SkillsSettingsTab.tsx'
import { en } from '../src/client/locales.ts'

const t = (key: keyof typeof en): string => en[key]

afterEach(cleanup)

function renderTab(overrides: Partial<SkillsSettingsTabInjected> = {}) {
  const list = vi.fn(async () => ([
    { name: 'review', description: 'Check a change before claiming it works', path: 'C:/home/.dsh/skills/review.md', enabled: true },
    { name: 'learn', description: 'Teach a subject', enabled: false },
  ]))
  const setEnabled = vi.fn(async () => {})
  const create = vi.fn(async () => {})
  const remove = vi.fn(async () => {})
  const props = { t, list, setEnabled, create, remove, ...overrides }
  render(<SkillsSettingsTab {...props as unknown as SkillsSettingsTabProps} />)
  return { list, setEnabled, create, remove }
}

describe('SkillsSettingsTab', () => {
  it('lists the catalog with enablement and the file path', async () => {
    renderTab()
    await waitFor(() => { expect(screen.getByText('review')).toBeDefined() })
    expect(screen.getByText('learn')).toBeDefined()
    expect(screen.getByText('C:/home/.dsh/skills/review.md')).toBeDefined()
    expect(screen.getAllByRole('switch', { name: en.enabled })).toHaveLength(2)
  })

  it('toggles a skill and reloads the catalog', async () => {
    const { setEnabled, list } = renderTab()
    await waitFor(() => { expect(screen.getByText('review')).toBeDefined() })
    list.mockClear()
    const [first] = screen.getAllByRole('switch')
    fireEvent.click(first!)
    await waitFor(() => { expect(setEnabled).toHaveBeenCalledWith('review', false) })
    await waitFor(() => { expect(list).toHaveBeenCalledTimes(1) })
  })

  it('adds a skill and rejects a malformed name', async () => {
    const { create } = renderTab()
    await waitFor(() => { expect(screen.getByText('review')).toBeDefined() })
    const name = screen.getByLabelText(en.addName)
    const content = screen.getByLabelText(en.addContent)
    fireEvent.change(name, { target: { value: 'Bad Name' } })
    fireEvent.change(content, { target: { value: '# X' } })
    fireEvent.click(screen.getByRole('button', { name: en.add }))
    expect(create).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(en.invalidName)

    fireEvent.change(name, { target: { value: 'plan' } })
    fireEvent.click(screen.getByRole('button', { name: en.add }))
    await waitFor(() => { expect(create).toHaveBeenCalledWith('plan', '# X') })
  })

  it('removes a skill file', async () => {
    const { remove } = renderTab()
    await waitFor(() => { expect(screen.getByText('review')).toBeDefined() })
    fireEvent.click(screen.getAllByRole('button', { name: en.remove })[1]!)
    await waitFor(() => { expect(remove).toHaveBeenCalledWith('learn') })
  })
})
