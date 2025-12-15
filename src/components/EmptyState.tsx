import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

type Tone = 'primary' | 'warning'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  tone?: Tone
  actions?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'primary',
  actions,
  className,
}: EmptyStateProps) {
  const toneClasses =
    tone === 'warning'
      ? {
          bubble: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]',
        }
      : {
          bubble: 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]',
        }

  return (
    <div className={cn('text-center py-14 px-4 animate-fade-in', className)}>
      <div
        className={cn(
          'mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-2xl',
          toneClasses.bubble
        )}
      >
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      ) : null}
      {actions ? <div className="mt-6 flex justify-center">{actions}</div> : null}
    </div>
  )
}
