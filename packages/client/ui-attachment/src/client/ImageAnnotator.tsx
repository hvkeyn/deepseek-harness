/** Full-screen pen overlay for an attached image: mark what the model must look at. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { appendPoint, drawStrokes, PEN_COLORS, PEN_WIDTHS, undoStroke, type PenStroke } from './annotate.ts'
import type { AnnotatorLabels } from './labels.ts'
import css from './ImageAnnotator.module.css'

/** Props for the image annotation overlay. */
export interface ImageAnnotatorProps {
  /** Object URL of the image being marked. */
  readonly src: string
  /** Original file name, used for the annotated copy. */
  readonly name: string
  /** Translated labels for every control. */
  readonly labels: AnnotatorLabels
  /** Close without producing a file. */
  readonly onCancel: () => void
  /** Hand the flattened PNG back to the composer. */
  readonly onSave: (file: File) => void
}

/**
 * Render a pen overlay over one image and return the marked copy.
 * @param props - image source, copy name, labels, and callbacks.
 * @returns the overlay element.
 */
export function ImageAnnotator({ src, name, labels, onCancel, onSave }: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [strokes, setStrokes] = useState<readonly PenStroke[]>([])
  const [color, setColor] = useState<string>(PEN_COLORS[0])
  const [width, setWidth] = useState<number>(PEN_WIDTHS[1])
  const [drawing, setDrawing] = useState(false)
  const [failure, setFailure] = useState('')

  const redraw = useCallback((next: readonly PenStroke[]) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas === null || context === undefined || context === null) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    drawStrokes(context, next)
  }, [])

  useEffect(() => { redraw(strokes) }, [redraw, strokes])

  const toIntrinsic = (event: React.PointerEvent<HTMLCanvasElement>): { x: number, y: number } => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  // Annotated copies are always PNGs from the visible canvas; when nothing was
  // drawn the original bytes are reused so the attachment keeps its format.
  const save = (): void => {
    const canvas = canvasRef.current
    if (canvas !== null && strokes.length > 0) {
      canvas.toBlob((blob) => {
        if (blob === null) {
          setFailure(labels.failed)
          return
        }
        const stem = name.replace(/\.[^.]+$/u, '')
        onSave(new File([blob], `${stem}-annotated.png`, { type: 'image/png' }))
      }, 'image/png')
      return
    }
    void fetch(src)
      .then(response => response.blob())
      .then(blob => { onSave(new File([blob], name, { type: blob.type || 'image/png' })) })
      .catch(() => { setFailure(labels.failed) })
  }

  return (
    <div className={css.backdrop} role="dialog" aria-modal="true" aria-label={labels.title}>
      <div className={css.panel}>
        <header className={css.header}>
          <div className={css.heading}>
            <span className={css.title}>{labels.title}</span>
            <span className={css.hint}>{labels.hint}</span>
          </div>
          <div className={css.tools}>
            {PEN_COLORS.map(ink => (
              <button key={ink} type="button" className={ink === color ? css.swatchActive : css.swatch}
                style={{ background: ink }} aria-label={labels.color} aria-pressed={ink === color}
                onClick={() => { setColor(ink) }} />
            ))}
            {PEN_WIDTHS.map(size => (
              <button key={size} type="button" className={size === width ? css.widthActive : css.width}
                aria-label={labels.size} aria-pressed={size === width} onClick={() => { setWidth(size) }}>
                {size}
              </button>
            ))}
            <button type="button" className={css.tool} disabled={strokes.length === 0}
              onClick={() => { setStrokes(undoStroke(strokes)) }}>{labels.undo}</button>
            <button type="button" className={css.tool} disabled={strokes.length === 0}
              onClick={() => { setStrokes([]) }}>{labels.clear}</button>
          </div>
        </header>
        <div className={css.stage}>
          <img ref={imageRef} className={css.image} src={src} alt={name} draggable={false}
            onLoad={(event) => {
              const canvas = canvasRef.current
              if (canvas === null) return
              canvas.width = event.currentTarget.naturalWidth
              canvas.height = event.currentTarget.naturalHeight
              redraw(strokes)
            }} />
          <canvas
            ref={canvasRef}
            className={css.canvas}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setDrawing(true)
              setStrokes(current => appendPoint(current, toIntrinsic(event), { color, width }, false))
            }}
            onPointerMove={(event) => {
              if (!drawing) return
              setStrokes(current => appendPoint(current, toIntrinsic(event), { color, width }, true))
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId)
              setDrawing(false)
            }}
          />
        </div>
        {failure === '' ? null : <p className={css.error} role="alert">{failure}</p>}
        <footer className={css.footer}>
          <button type="button" className={css.secondary} onClick={onCancel}>{labels.cancel}</button>
          <button type="button" className={css.primary} onClick={save}>{labels.save}</button>
        </footer>
      </div>
    </div>
  )
}
