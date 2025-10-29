import { type DependencyList, useEffect } from 'react'

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
  deps: DependencyList = [],
  options?: UseKeyboardShortcutOptions
) {
  const { preventDefault = true, enabled = true } = options ?? {}

  useEffect(() => {
    if (!enabled) {
      return
    }

    const listener = (event: KeyboardEvent) => {
      if (!matchesShortcut(event, shortcut)) {
        return
      }

      if (preventDefault) {
        event.preventDefault()
      }

      handler(event)
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    preventDefault,
    shortcut.key,
    shortcut.altKey,
    shortcut.ctrlKey,
    shortcut.metaKey,
    shortcut.shiftKey,
    ...deps,
  ])
}
