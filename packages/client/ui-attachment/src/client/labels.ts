import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { AttachmentRailLabels } from '../AttachmentRail.tsx'
import type { DropOverlayLabels } from '../DropOverlay.tsx'
import type { FileCardLabels } from '../FileCard.tsx'
import type { ImageLightboxLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { MessageImageLabels } from '../MessageImage.tsx'

/**
 * Resolve original-image lightbox strings from the conversation namespace.
 * @param t - conversation namespace translator.
 * @returns translated lightbox labels.
 */
export function lightboxLabels(t: TranslateNS<'conversation'>): ImageLightboxLabels {
  return { dialog: t('image.preview'), close: t('image.closePreview') }
}

/**
 * Resolve historical message-image strings from the conversation namespace.
 * @param t - conversation namespace translator.
 * @returns translated message-image labels.
 */
export function messageImageLabels(t: TranslateNS<'conversation'>): MessageImageLabels {
  return {
    image: t('image.label'),
    open: t('image.openOriginal'),
    openNamed: label => t('image.openOriginalLabel', { label }),
    loading: t('image.loading'),
    loadFailed: t('image.loadFailed'),
    lightbox: lightboxLabels(t),
  }
}

/**
 * Resolve the document-level drop invitation and its optional limits line.
 * @param t - conversation namespace translator.
 * @param accepting - whether the composer can accept dropped files.
 * @param limits - optional translated count and size values.
 * @returns translated drop-overlay labels.
 */
export function dropOverlayLabels(
  t: TranslateNS<'conversation'>,
  accepting: boolean,
  limits?: { readonly count: number; readonly size: string },
): DropOverlayLabels {
  if (!accepting) return { title: t('attachment.dropBlocked') }
  return {
    title: t('attachment.dropTitle'),
    desc: limits === undefined ? undefined : t('attachment.dropDesc', limits),
  }
}

/**
 * Resolve pending-file card strings from the conversation namespace.
 * @param t - conversation namespace translator.
 * @param name - browser file name interpolated into remove/retry labels.
 * @returns translated file-card labels.
 */
export function fileCardLabels(t: TranslateNS<'conversation'>, name: string): FileCardLabels {
  return {
    label: t('file.pending'),
    remove: t('file.remove', { name }),
    uploading: t('file.uploading'),
    failed: t('file.uploadFailed'),
    retry: t('file.retry', { name }),
  }
}

/**
 * Resolve the mixed draft-attachment rail strings from the conversation namespace.
 * @param t - conversation namespace translator.
 * @returns translated attachment-rail labels.
 */
export function attachmentRailLabels(t: TranslateNS<'conversation'>): AttachmentRailLabels {
  return {
    group: t('attachment.pending'),
    scrollLeft: t('attachment.scrollLeft'),
    scrollRight: t('attachment.scrollRight'),
  }
}

/** Labels for the pen overlay over an attached image. */
export interface AnnotatorLabels {
  /** Dialog title. */
  readonly title: string
  /** One line of guidance under the title. */
  readonly hint: string
  /** Colour swatch group label. */
  readonly color: string
  /** Width button group label. */
  readonly size: string
  /** Remove the newest stroke. */
  readonly undo: string
  /** Remove every stroke. */
  readonly clear: string
  /** Close without saving. */
  readonly cancel: string
  /** Produce the marked copy. */
  readonly save: string
  /** Failure line when the canvas cannot be encoded. */
  readonly failed: string
}

/**
 * Resolve pen-overlay strings from the conversation namespace.
 * @param t - conversation namespace translator.
 * @returns translated annotator labels.
 */
export function annotatorLabels(t: TranslateNS<'conversation'>): AnnotatorLabels {
  return {
    title: t('annotate.title'),
    hint: t('annotate.hint'),
    color: t('annotate.color'),
    size: t('annotate.size'),
    undo: t('annotate.undo'),
    clear: t('annotate.clear'),
    cancel: t('annotate.cancel'),
    save: t('annotate.save'),
    failed: t('annotate.failed'),
  }
}