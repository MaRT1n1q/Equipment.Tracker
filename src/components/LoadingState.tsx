import { cn } from '../lib/utils'

interface LoadingStateProps {
  className?: string
  label?: string
  size?: 'sm' | 'md'
}

export function LoadingState({ className, label = 'Загрузка…', size = 'md' }: LoadingStateProps) {
  const spinnerClasses = size === 'sm' ? 'h-8 w-8 border-2' : 'h-12 w-12 border-4'

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-[hsl(var(--primary)/0.2)] border-t-[hsl(var(--primary))]',
          spinnerClasses
        )}
      />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )
}
