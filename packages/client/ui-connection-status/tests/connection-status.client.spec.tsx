// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from '../src/client/index.ts'
import { ConnectionStatus, type ConnectionStatusProps } from '../src/client/ConnectionStatus.tsx'
import { en } from '../src/client/locales.ts'

const t: ConnectionStatusProps['t'] = key => (en as Record<string, string>)[key] ?? key

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('ConnectionStatus', () => {
  it('reports online when the Harness answers quickly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })))
    render(<ConnectionStatus t={t} />)
    await waitFor(() => { expect(screen.getByText(en['label.online'])).toBeDefined() })
  })

  it('reports offline when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    render(<ConnectionStatus t={t} />)
    await waitFor(() => { expect(screen.getByText(en['label.offline'])).toBeDefined() })
  })

  it('reports a slow link above the threshold', async () => {
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(5000) })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })))
    render(<ConnectionStatus t={t} />)
    await waitFor(() => { expect(screen.getByText(en['label.slow'])).toBeDefined() })
  })
})
