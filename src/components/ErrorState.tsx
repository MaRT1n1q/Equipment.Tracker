import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  actions?: ReactNode
  className?: string
}

export function ErrorState({
  title,
  description = 'Повторите попытку. Если ошибка сохраняется, проверьте журнал приложения.',
  onRetry,
  retryLabel = 'Повторить попытку',
  actions,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center',
        className
      )}
    >
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">{actions}</div>
      ) : onRetry ? (
        <Button onClick={onRetry} variant="outline">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
