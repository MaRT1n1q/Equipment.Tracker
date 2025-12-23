import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Очистка после каждого теста
afterEach(() => {
  cleanup()
})

beforeEach(() => {
  localStorage.clear()
})

// Mock Electron API для тестов
;(global as any).window = {
  ...window,
  electronAPI: {
    getRequests: vi.fn(),
    addRequest: vi.fn(),
    updateRequest: vi.fn(),
    deleteRequest: vi.fn(),
    restoreRequest: vi.fn(),
    getEmployeeExits: vi.fn(),
    addEmployeeExit: vi.fn(),
    updateEmployeeExit: vi.fn(),
    deleteEmployeeExit: vi.fn(),
    restoreEmployeeExit: vi.fn(),
    exportEmployeeExits: vi.fn(),
    createBackup: vi.fn(),
    restoreBackup: vi.fn(),
    getTemplates: vi.fn(),
    addTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    onUpdateStatus: vi.fn(),
    removeUpdateStatusListener: vi.fn(),
  },
}
