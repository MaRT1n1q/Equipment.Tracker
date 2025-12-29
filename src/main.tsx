import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppBootstrap } from './components/AppBootstrap'
import './index.css'

// ─────────────────────────────────────────────────────────────────────────────
// Pre-render fatal error handling
// Catches errors that occur before React mounts (e.g. during module init or
// synchronous state initialization in first render).
// ─────────────────────────────────────────────────────────────────────────────

function showPreRenderError(message: string, details?: string) {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,sans-serif;background:#0a0a0b;color:#fafafa;">
        <div style="max-width:32rem;width:100%;background:#18181b;border-radius:0.75rem;padding:1.5rem;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          <h1 style="margin:0 0 0.75rem;font-size:1.125rem;font-weight:600;">Ошибка при запуске приложения</h1>
          <p style="margin:0 0 1rem;font-size:0.875rem;color:#a1a1aa;">Приложение не смогло корректно загрузиться. Это может произойти после обновления. Нажмите кнопку ниже — ваши данные (заявки, выходы) сохранятся.</p>
          <div style="background:#27272a;border-radius:0.5rem;padding:0.75rem;font-size:0.875rem;margin-bottom:1rem;">
            <p style="margin:0;font-weight:500;">Сообщение:</p>
            <p style="margin:0.25rem 0 0;color:#a1a1aa;white-space:pre-wrap;word-break:break-word;">${message}</p>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button onclick="localStorage.clear();sessionStorage.clear();location.reload();" style="height:2.5rem;padding:0 1rem;background:#3b82f6;color:#fff;border:none;border-radius:0.375rem;font-size:0.875rem;font-weight:500;cursor:pointer;">Сбросить настройки и перезагрузить</button>
            <button onclick="location.reload();" style="height:2.5rem;padding:0 1rem;background:#27272a;color:#fafafa;border:1px solid #3f3f46;border-radius:0.375rem;font-size:0.875rem;font-weight:500;cursor:pointer;">Просто перезагрузить</button>
          </div>
          <p style="margin:1rem 0 0;font-size:0.75rem;color:#71717a;">💡 Сброс настроек очищает только черновики форм и фильтры. База данных с заявками и выходами сотрудников не удаляется.</p>
          ${details ? `<details style="margin-top:0.75rem;"><summary style="cursor:pointer;font-size:0.875rem;color:#a1a1aa;">Технические детали</summary><pre style="margin:0.5rem 0 0;max-height:14rem;overflow:auto;background:#09090b;border-radius:0.5rem;padding:0.75rem;font-size:0.75rem;color:#a1a1aa;white-space:pre-wrap;">${details}</pre></details>` : ''}
        </div>
      </div>
    `
  }
}

// Set up global error handlers BEFORE React renders
window.addEventListener('error', (event) => {
  console.error('Global error (pre-render or uncaught):', event.error ?? event.message)
  const message =
    event.error instanceof Error ? event.error.message : event.message || 'Неизвестная ошибка'
  const details = event.error instanceof Error ? event.error.stack : undefined
  showPreRenderError(message, details)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection (pre-render):', event.reason)
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason)
  const details = event.reason instanceof Error ? event.reason.stack : undefined
  showPreRenderError(message, details)
})

// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppBootstrap />
      </QueryClientProvider>
    </StrictMode>
  )
} catch (error) {
  console.error('Failed to render application:', error)
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
  const details = error instanceof Error ? error.stack : undefined
  showPreRenderError(message, details)
}
