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
