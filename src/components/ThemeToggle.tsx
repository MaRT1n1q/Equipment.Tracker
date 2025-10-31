import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { cn } from '../lib/utils'

const THEME_STORAGE_KEY = 'theme'

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

type ThemeToggleVariant = 'full' | 'compact'

interface ThemeToggleProps {
  variant?: ThemeToggleVariant
  className?: string
}

export function ThemeToggle({ variant = 'full', className }: ThemeToggleProps) {
  const [theme, setTheme] = usePersistentState<'light' | 'dark'>(
    THEME_STORAGE_KEY,
    getPreferredTheme(),
    {
      serializer: (value) => value,
      deserializer: (value) => (value === 'dark' ? 'dark' : 'light'),
    }
  )

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }

  const trackBaseClasses = variant === 'full' ? 'h-10 w-20' : 'h-10 w-10'

  const knobBaseClasses =
    variant === 'full'
      ? { size: 'h-8 w-8', translate: isDark ? 'translate-x-[2.5rem]' : 'translate-x-0' }
      : { size: 'h-8 w-8', translate: 'translate-x-0' }

  // Compact вариант - простая кнопка
  if (variant === 'compact') {
    return (
      <button
        type="button"
        role="button"
        aria-label="Переключить тему"
        onClick={toggleTheme}
        className={cn(
          'group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-all duration-300 ease-in-out',
          'hover:scale-110 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isDark
            ? 'border-primary/30 bg-gradient-to-br from-slate-800 to-slate-900 shadow-md shadow-primary/20'
            : 'border-border/40 bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm',
          trackBaseClasses,
          className
        )}
      >
        <span className="sr-only">Переключить тему</span>
        {isDark ? (
          <Moon className="h-5 w-5 text-blue-400 transition-all duration-300" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500 transition-all duration-300" />
        )}
      </button>
    )
  }

  // Full вариант - слайдер
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Переключить тему"
      onClick={toggleTheme}
      className={cn(
        'group relative inline-flex cursor-pointer items-center overflow-hidden rounded-full border transition-all duration-300 ease-in-out',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isDark
          ? 'border-primary/30 bg-gradient-to-r from-slate-800 to-slate-900 shadow-md shadow-primary/20'
          : 'border-border/40 bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm',
        trackBaseClasses,
        className
      )}
    >
      <span className="sr-only">Переключить тему</span>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <Sun
          className={cn(
            'h-5 w-5 transition-all duration-300',
            isDark ? 'opacity-30 scale-90' : 'opacity-100 scale-100 text-amber-500'
          )}
        />
        <Moon
          className={cn(
            'h-5 w-5 transition-all duration-300',
            isDark ? 'opacity-100 scale-100 text-blue-400' : 'opacity-30 scale-90'
          )}
        />
      </span>
      <span
        className={cn(
          'absolute left-1 top-1/2 -translate-y-1/2 -translate-x-1 flex items-center justify-center rounded-full transition-all duration-300 ease-in-out',
          'shadow-lg ring-1 group-hover:shadow-xl',
          isDark
            ? 'bg-slate-800 ring-primary/40 shadow-primary/30'
            : 'bg-white ring-border/50 shadow-slate-300',
          knobBaseClasses.size,
          knobBaseClasses.translate
        )}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-blue-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  )
}
