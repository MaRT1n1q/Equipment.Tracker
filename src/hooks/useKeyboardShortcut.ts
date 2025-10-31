import { type DependencyList, useEffect, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

interface UseKeyboardShortcutOptions {
  preventDefault?: boolean
  enabled?: boolean
}

function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut) {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
  if (!keyMatches) {
    return false
  }

  if (shortcut.ctrlKey && !(event.ctrlKey || event.metaKey)) {
    return false
  }

  if (shortcut.metaKey && !event.metaKey) {
    return false
  }

  if (shortcut.shiftKey && !event.shiftKey) {
    return false
  }

  if (shortcut.altKey && !event.altKey) {
    return false
  }

  return true
}

export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  handler: (event: KeyboardEvent) => void,
  _deps: DependencyList = [],
  options?: UseKeyboardShortcutOptions
) {
  const { preventDefault = true, enabled = true } = options ?? {}

  void _deps

  const handlerRef = useRef(handler)
  const shortcutRef = useRef(shortcut)
  const preventDefaultRef = useRef(preventDefault)

  handlerRef.current = handler
  shortcutRef.current = shortcut
  preventDefaultRef.current = preventDefault

  useEffect(() => {
    if (!enabled) {
      return
    }

    const listener = (event: KeyboardEvent) => {
      if (!matchesShortcut(event, shortcutRef.current)) {
        return
      }

      if (preventDefaultRef.current) {
        event.preventDefault()
      }

      handlerRef.current(event)
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [enabled])
}
