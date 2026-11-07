// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendPoint, drawStrokes, undoStroke, type PenStroke } from '../src/client/annotate.ts'
import { ImageAnnotator, type ImageAnnotatorProps } from '../src/client/ImageAnnotator.tsx'
import type { AnnotatorLabels } from '../src/client/labels.ts'

const labels: AnnotatorLabels = {
  title: 'Mark up the image',
  hint: 'Circle what matters',
  color: 'Pen colour',
  size: 'Pen width',
  undo: 'Undo',
  clear: 'Clear',
  cancel: 'Cancel',
  save: 'Save markup',
  failed: 'Could not produce the marked image.',
}

afterEach(cleanup)

describe('pen strokes', () => {
  it('starts a new stroke when the previous one is closed', () => {
    const first = appendPoint([], { x: 1, y: 1 }, { color: '#f00', width: 4 }, false)
    const second = appendPoint(first, { x: 2, y: 2 }, { color: '#f00', width: 4 }, false)
    expect(second).toHaveLength(2)
    expect(second[0]!.points).toHaveLength(1)
  })

  it('extends the open stroke and undoes it as a whole', () => {
    let strokes = appendPoint([], { x: 1, y: 1 }, { color: '#0f0', width: 8 }, false)
    strokes = appendPoint(strokes, { x: 5, y: 5 }, { color: '#0f0', width: 8 }, true)
    expect(strokes[0]!.points).toHaveLength(2)
    expect(undoStroke(strokes)).toHaveLength(0)
  })

  it('draws one path per stroke with its own colour and width', () => {
    const calls: string[] = []
    const context = {
      lineCap: '', lineJoin: '', strokeStyle: '', lineWidth: 0,
      beginPath: () => { calls.push('begin') },
      moveTo: () => { calls.push('move') },
      lineTo: () => { calls.push('line') },
      stroke: () => { calls.push('stroke') },
    } as unknown as CanvasRenderingContext2D
    const strokes: PenStroke[] = [{ color: '#00f', width: 16, points: [{ x: 0, y: 0 }, { x: 3, y: 4 }] }]
    drawStrokes(context, strokes)
    expect(calls).toEqual(['begin', 'move', 'line', 'stroke'])
    expect(context.strokeStyle).toBe('#00f')
    expect(context.lineWidth).toBe(16)
  })
})

describe('ImageAnnotator', () => {
  const props = (overrides: Partial<ImageAnnotatorProps> = {}): ImageAnnotatorProps => ({
    src: 'blob:original',
    name: 'photo.png',
    labels,
    onCancel: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  })

  it('cancels without producing a file', () => {
    const onCancel = vi.fn()
    render(<ImageAnnotator {...props({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('reuses the original bytes when nothing was drawn', async () => {
    const onSave = vi.fn()
    const blob = new Blob(['png'], { type: 'image/png' })
    vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => blob })))
    render(<ImageAnnotator {...props({ onSave })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save markup' }))
    await waitFor(() => { expect(onSave).toHaveBeenCalledOnce() })
    const file = onSave.mock.calls[0]![0] as File
    expect(file.name).toBe('photo.png')
    expect(file.type).toBe('image/png')
    vi.unstubAllGlobals()
  })
})
