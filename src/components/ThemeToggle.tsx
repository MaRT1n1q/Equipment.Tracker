import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useEffect } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'

const THEME_STORAGE_KEY = 'theme'

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full border border-border bg-muted/40 hover:bg-muted/60 transition-colors"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  )
}
