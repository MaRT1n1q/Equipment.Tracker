/**
 * Кросс-вкладочная синхронизация кэша React Query через BroadcastChannel.
 *
 * Когда в одной вкладке происходит мутация (create/update/delete),
 * broadcast оповещает остальные вкладки инвалидировать те же queryKey.
 */

const CHANNEL_NAME = 'equipment-tracker:query-sync'

export type SyncMessage = {
  type: 'invalidate'
  keys: string[]
}

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

/** Отправить сигнал инвалидации другим вкладкам */
export function broadcastInvalidation(keys: string[]): void {
  try {
    getChannel()?.postMessage({ type: 'invalidate', keys } satisfies SyncMessage)
  } catch {
    // BroadcastChannel может не быть доступен в некоторых окружениях
  }
}

/** Подписаться на входящие сигналы инвалидации */
export function onQuerySync(handler: (keys: string[]) => void): () => void {
  const ch = getChannel()
  if (!ch) return () => {}

  const listener = (event: MessageEvent<SyncMessage>) => {
    if (event.data?.type === 'invalidate' && Array.isArray(event.data.keys)) {
      handler(event.data.keys)
    }
  }

  ch.addEventListener('message', listener)
  return () => ch.removeEventListener('message', listener)
}
