/**
 * SSE-клиент для real-time обновлений.
 *
 * Устанавливает long-lived соединение с /api/v1/events (Server-Sent Events).
 * При получении события об изменении данных — инвалидирует соответствующие
 * запросы в React Query, что вызывает автоматический refetch.
 *
 * Соединение автоматически восстанавливается при разрыве (EventSource built-in).
 * При 401 (сессия истекла) — останавливается, возобновляется после нового логина.
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthSession } from './auth'
import { API_BASE } from './apiClient'

// Типы событий (должны совпадать с backend events.Event)
export type EntityType = 'request' | 'employee_exit' | 'template' | 'template_file' | 'instruction'

export interface ServerEvent {
  entity_type: EntityType
  entity_id: number
  action: 'created' | 'updated' | 'deleted' | 'restored'
  actor_id: string
  actor_login: string
  timestamp: string
}

// Маппинг типа сущности → query keys для инвалидации
const ENTITY_TO_QUERY_KEYS: Record<EntityType, string[][]> = {
  request: [['requests'], ['requestSummary']],
  employee_exit: [['employeeExits'], ['employeeExitSummary']],
  template: [['templates'], ['templateFiles']],
  template_file: [['templates'], ['templateFiles']],
  instruction: [['instructions'], ['instructionAttachments']],
}

/**
 * Хук для подписки на SSE-события.
 * Автоматически подключается при наличии авторизации и отключается при logout.
 */
export function useRealtimeEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const session = getAuthSession()
    if (!session?.accessToken) {
      return
    }

    // EventSource не поддерживает кастомные заголовки, поэтому передаём токен
    // через query-параметр. Backend auth middleware проверяет Authorization,
    // но для SSE мы добавим поддержку ?token= в middleware (см. ниже).
    // Альтернатива: использовать fetch + ReadableStream, но EventSource проще
    // и имеет встроенный reconnect.
    const url = `${API_BASE}/api/v1/events?token=${encodeURIComponent(session.accessToken)}`
    const eventSource = new EventSource(url)

    const handleEvent = (type: EntityType) => (e: MessageEvent) => {
      try {
        JSON.parse(e.data) as ServerEvent
        const queryKeys = ENTITY_TO_QUERY_KEYS[type] || []
        queryKeys.forEach((keyPath) => {
          queryClient.invalidateQueries({ queryKey: keyPath })
        })
      } catch {
        // игнорируем ошибки парсинга
      }
    }

    // Подписка на типизированные события (event: <entity_type>)
    eventSource.addEventListener('request', handleEvent('request'))
    eventSource.addEventListener('employee_exit', handleEvent('employee_exit'))
    eventSource.addEventListener('template', handleEvent('template'))
    eventSource.addEventListener('template_file', handleEvent('template_file'))
    eventSource.addEventListener('instruction', handleEvent('instruction'))

    eventSource.onerror = () => {
      // EventSource автоматически переподключится.
      // Если сессия истекла — getAuthSession вернёт null после clearAuthSession,
      // и при следующем 401 apiClient вызовет auth:logout.
    }

    return () => {
      eventSource.close()
    }
  }, [queryClient])
}
