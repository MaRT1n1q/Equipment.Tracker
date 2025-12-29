import { useState, useEffect, useCallback } from 'react'
import { changelog, getChangelogSinceVersion, type ChangelogEntry } from '../changelog'

const LAST_SEEN_VERSION_KEY = 'equipment-tracker:last-seen-version'

export function useChangelog() {
  const [newChanges, setNewChanges] = useState<ChangelogEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // В режиме разработки всегда показываем changelog для тестирования
    if (import.meta.env.DEV) {
      // Показываем последнюю версию из changelog
      if (changelog.length > 0) {
        setNewChanges(changelog.slice(0, 1))
        setIsOpen(true)
      }
      return
    }

    // Проверяем, доступен ли electronAPI
    if (!window.electronAPI?.getAppVersion) {
      return
    }

    try {
      // Получаем текущую версию приложения
      const currentVersion = window.electronAPI.getAppVersion() || '0.0.0'

      // Получаем последнюю просмотренную версию из localStorage
      const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY)

      // Если версия не сохранена (первый запуск), сохраняем текущую и не показываем окно
      if (!lastSeenVersion) {
        localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion)
        return
      }

      // Если версии совпадают, ничего не показываем
      if (lastSeenVersion === currentVersion) {
        return
      }

      // Получаем изменения с последней просмотренной версии
      const changes = getChangelogSinceVersion(lastSeenVersion)

      if (changes.length > 0) {
        setNewChanges(changes)
        setIsOpen(true)
      } else {
        // Если нет записей в changelog для новой версии, просто обновляем сохранённую версию
        localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion)
      }
    } catch (error) {
      console.error('Error in useChangelog:', error)
    }
  }, [])

  const dismissChangelog = useCallback(() => {
    // В режиме разработки не сохраняем версию, чтобы окно показывалось каждый раз
    if (!import.meta.env.DEV && window.electronAPI?.getAppVersion) {
      try {
        const currentVersion = window.electronAPI.getAppVersion() || '0.0.0'
        localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion)
      } catch (error) {
        console.error('Error saving version:', error)
      }
    }
    setIsOpen(false)
  }, [])

  return {
    newChanges,
    isOpen,
    dismissChangelog,
  }
}
