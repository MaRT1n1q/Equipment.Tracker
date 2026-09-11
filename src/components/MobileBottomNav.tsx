import { NAV_ITEMS, type AppView } from '../lib/navigation'
import { cn } from '../lib/utils'

interface MobileBottomNavProps {
  currentView: AppView
  onViewChange: (view: AppView) => void
  role?: string
}

/**
 * Нижняя панель навигации для мобильных устройств.
 * Показывается только на маленьких экранах (см. App.tsx).
 */
export function MobileBottomNav({ currentView, onViewChange, role }: MobileBottomNavProps) {
  const isAdmin = role === 'admin'
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Основная навигация"
    >
      <div className="flex w-full items-stretch justify-around">
        {items.map((item) => {
          const isActive = currentView === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('h-5 w-5', isActive && 'scale-110 transition-transform')} />
              <span
                className={cn(
                  'max-w-full truncate px-1 text-[10px] font-medium leading-tight',
                  isActive && 'font-semibold'
                )}
              >
                {item.shortLabel}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
