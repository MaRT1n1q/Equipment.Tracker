import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Очистка после каждого теста
afterEach(() => {
  cleanup()
})

// Mock Electron API для тестов
;(global as any).window = {
  electronAPI: {
    getAppVersion: vi.fn().mockReturnValue('0.0.0-test'),
    getWindowState: vi.fn(),
    minimizeWindow: vi.fn(),
    toggleMaximizeWindow: vi.fn(),
    closeWindow: vi.fn(),
    onWindowStateChanged: vi.fn().mockReturnValue(() => {}),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    onUpdateStatus: vi.fn().mockReturnValue(() => {}),
    openExternal: vi.fn(),
  },
}
