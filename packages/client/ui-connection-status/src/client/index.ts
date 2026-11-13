/** Session header chip reporting the Harness link state. */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { ConnectionStatus } from './ConnectionStatus.tsx'
import { en, zh, type ConnectionStatusKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Connection chip copy. */
    'connectionStatus': ConnectionStatusKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'connectionStatus'

/** Services the chip reads: slots and the locale seat. */
export const inject = ['slots', 'locale']

/**
 * Register the connection chip in the session header.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-connection-status: dictionaries')
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'connection-status',
    order: 40,
    locale: NS,
  }, ConnectionStatus))
}
