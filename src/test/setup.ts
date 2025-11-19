import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Очистка после каждого теста
afterEach(() => {
  cleanup()
})

// Mock Electron API для тестов
;(global as any).window.electronAPI = {
  // Requests
  getRequests: vi.fn(),
  getRequestSummary: vi.fn(),
  createRequest: vi.fn(),
  updateRequest: vi.fn(),
  deleteRequest: vi.fn(),
  restoreRequest: vi.fn(),
  updateIssued: vi.fn(),
  scheduleRequestReturn: vi.fn(),
  completeRequestReturn: vi.fn(),
  cancelRequestReturn: vi.fn(),

  // Employee Exits
  getEmployeeExits: vi.fn(),
  getEmployeeExitSummary: vi.fn(),
  createEmployeeExit: vi.fn(),
  updateEmployeeExit: vi.fn(),
  deleteEmployeeExit: vi.fn(),
  restoreEmployeeExit: vi.fn(),
  updateExitCompleted: vi.fn(),
  exportEmployeeExits: vi.fn(),

  // Templates
  getTemplates: vi.fn(),
  addTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  reorderTemplates: vi.fn(),

  // Backup
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),

  // Updater
  onUpdateStatus: vi.fn(),
  removeUpdateStatusListener: vi.fn(),
}
