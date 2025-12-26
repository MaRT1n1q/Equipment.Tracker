import { Component, type ReactNode, useEffect, useState } from 'react'
import App from '../App'

type FatalErrorPayload = {
  message: string
  details?: string
}

class AppErrorBoundary extends Component<
  { onError: (payload: FatalErrorPayload) => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    const details = error instanceof Error ? error.stack : undefined
    console.error('Renderer crashed:', error)
    this.props.onError({ message, details })
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

function FatalErrorScreen({ error }: { error: FatalErrorPayload }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-8 py-10">
        <div className="surface-card space-y-3 p-6">
          <h1 className="text-lg font-semibold tracking-tight">Ошибка при запуске приложения</h1>
          <p className="text-sm text-muted-foreground">
            Приложение не смогло корректно загрузиться. Обычно это связано с обновлением или
            повреждёнными локальными данными.
          </p>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            <p className="font-medium">Сообщение:</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
              {error.message}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Перезагрузить
            </button>
          </div>
          {error.details && (
            <details className="pt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Технические детали
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {error.details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export function AppBootstrap() {
  const [fatalError, setFatalError] = useState<FatalErrorPayload | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.error instanceof Error ? event.error.message : event.message
      const details = event.error instanceof Error ? event.error.stack : undefined
      console.error('Unhandled error:', event.error ?? event.message)
      setFatalError({ message: message || 'Неизвестная ошибка', details })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason)
      const details = reason instanceof Error ? reason.stack : undefined
      console.error('Unhandled rejection:', reason)
      setFatalError({ message: message || 'Неизвестная ошибка', details })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (fatalError) {
    return <FatalErrorScreen error={fatalError} />
  }

  return (
    <AppErrorBoundary onError={setFatalError}>
      <App />
    </AppErrorBoundary>
  )
}
