import { useEffect, useMemo, useState } from 'react'
import { Copy, Minus, Package, Square, X } from 'lucide-react'
import { cn } from '../lib/utils'

const TITLEBAR_HEIGHT_CLASS = 'h-10'

export function WindowTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const isMac = useMemo(() => /Mac/i.test(navigator.platform), [])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const api = window.electronAPI
    if (!api?.getWindowState) {
      return
    }

    void api.getWindowState().then((response) => {
      if (response?.success && response.data) {
        setIsMaximized(Boolean(response.data.isMaximized))
      }
    })

    if (api.onWindowStateChanged) {
      unsubscribe = api.onWindowStateChanged((payload) => {
        setIsMaximized(Boolean(payload.isMaximized))
      })
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  const MaximizeIcon = useMemo(() => (isMaximized ? Copy : Square), [isMaximized])

  const handleMinimize = async () => {
    await window.electronAPI?.minimizeWindow?.()
  }

  const handleToggleMaximize = async () => {
    const response = await window.electronAPI?.toggleMaximizeWindow?.()
    if (response?.success && response.data) {
      setIsMaximized(Boolean(response.data.isMaximized))
    }
  }

  const handleClose = async () => {
    await window.electronAPI?.closeWindow?.()
  }

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-3 select-none',
        TITLEBAR_HEIGHT_CLASS
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className={cn('flex items-center gap-2 pl-1', isMac && 'pl-20')}>
        <div className="icon-bubble icon-bubble--soft h-7 w-7">
          <Package className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground">Equipment</div>
          <div className="text-[10px] text-muted-foreground -mt-0.5">Tracker</div>
        </div>
      </div>

      {!isMac && (
        <div
          className="flex items-stretch"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={handleMinimize}
            aria-label="Свернуть"
            className="flex w-12 items-center justify-center text-muted-foreground hover:bg-muted/40 hover:text-foreground focus:outline-none"
          >
            <Minus className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleMaximize}
            aria-label={isMaximized ? 'Восстановить' : 'Развернуть'}
            className="flex w-12 items-center justify-center text-muted-foreground hover:bg-muted/40 hover:text-foreground focus:outline-none"
          >
            <MaximizeIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть"
            className="flex w-12 items-center justify-center text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  )
}
