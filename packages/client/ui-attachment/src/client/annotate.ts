/** Pure pen-stroke model for the composer image annotator. */

/** One continuous pointer stroke in intrinsic image coordinates. */
export interface PenStroke {
  /** CSS colour of the ink. */
  readonly color: string
  /** Line width in intrinsic pixels. */
  readonly width: number
  /** Points in draw order, at least one. */
  readonly points: readonly { readonly x: number, readonly y: number }[]
}

/** Ink choices offered by the toolbar. */
export const PEN_COLORS = ['#ff3b30', '#ffd60a', '#32d74b'] as const

/** Width choices offered by the toolbar, in intrinsic pixels. */
export const PEN_WIDTHS = [4, 8, 16] as const

/**
 * Append one point, starting a stroke when the current one is finished.
 * @param strokes - committed strokes.
 * @param point - pointer position in intrinsic coordinates.
 * @param pen - colour and width for a new stroke.
 * @param open - whether the last stroke is still being drawn.
 * @returns the next stroke list.
 */
export function appendPoint(
  strokes: readonly PenStroke[],
  point: { readonly x: number, readonly y: number },
  pen: { readonly color: string, readonly width: number },
  open: boolean,
): PenStroke[] {
  if (!open || strokes.length === 0) return [...strokes, { ...pen, points: [point] }]
  const last = strokes[strokes.length - 1]!
  return [...strokes.slice(0, -1), { ...last, points: [...last.points, point] }]
}

/**
 * Remove the newest stroke.
 * @param strokes - committed strokes.
 * @returns the strokes without the last one.
 */
export function undoStroke(strokes: readonly PenStroke[]): PenStroke[] {
  return strokes.slice(0, -1)
}

/**
 * Draw every stroke on a 2D context sized to the intrinsic image.
 * @param context - destination canvas context.
 * @param strokes - strokes to draw.
 */
export function drawStrokes(
  context: CanvasRenderingContext2D,
  strokes: readonly PenStroke[],
): void {
  context.lineCap = 'round'
  context.lineJoin = 'round'
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue
    context.strokeStyle = stroke.color
    context.lineWidth = stroke.width
    context.beginPath()
    const [first, ...rest] = stroke.points
    context.moveTo(first!.x, first!.y)
    for (const point of rest) context.lineTo(point.x, point.y)
    if (rest.length === 0) context.lineTo(first!.x + 0.01, first!.y)
    context.stroke()
  }
}
