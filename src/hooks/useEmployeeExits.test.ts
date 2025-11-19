import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEmployeeExitsQuery, useEmployeeExitActions } from './useEmployeeExits'
import { createQueryWrapper } from '../test/queryWrapper'
import { createMockPaginatedResponse, createMockEmployeeExit } from '../test/factories'

describe('useEmployeeExits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useEmployeeExitsQuery', () => {
    it('должен загружать выходы сотрудников', async () => {
      const mockExits = [createMockEmployeeExit({ id: 1 }), createMockEmployeeExit({ id: 2 })]
      const mockResponse = createMockPaginatedResponse(mockExits)

      vi.mocked(window.electronAPI.getEmployeeExits).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const { result } = renderHook(() => useEmployeeExitsQuery({ page: 1, pageSize: 25 }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(window.electronAPI.getEmployeeExits).toHaveBeenCalledWith({ page: 1, pageSize: 25 })
    })

    it('должен обрабатывать ошибку загрузки', async () => {
      vi.mocked(window.electronAPI.getEmployeeExits).mockResolvedValue({
        success: false,
        error: 'Ошибка загрузки',
      })

      const { result } = renderHook(() => useEmployeeExitsQuery({ page: 1, pageSize: 25 }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('useEmployeeExitActions', () => {
    it('должен создавать выход сотрудника', async () => {
      vi.mocked(window.electronAPI.createEmployeeExit).mockResolvedValue({
        success: true,
        id: 1,
      })

      const { result } = renderHook(() => useEmployeeExitActions(), {
        wrapper: createQueryWrapper(),
      })

      const exitData = {
        employee_name: 'Тест',
        login: 'test',
        exit_date: '2024-07-15',
        equipment_list: 'Ноутбук',
      }

      await result.current.createEmployeeExit(exitData)

      expect(window.electronAPI.createEmployeeExit).toHaveBeenCalledWith(exitData)
    })

    it('должен обновлять выход сотрудника', async () => {
      vi.mocked(window.electronAPI.updateEmployeeExit).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useEmployeeExitActions(), {
        wrapper: createQueryWrapper(),
      })

      const updateData = {
        employee_name: 'Обновлено',
        login: 'updated',
        exit_date: '2024-07-15',
        equipment_list: 'Ноутбук',
      }

      await result.current.updateEmployeeExit({ id: 1, data: updateData })

      expect(window.electronAPI.updateEmployeeExit).toHaveBeenCalledWith(1, updateData)
    })

    it('должен удалять выход сотрудника', async () => {
      const deletedExit = createMockEmployeeExit({ id: 1 })
      vi.mocked(window.electronAPI.deleteEmployeeExit).mockResolvedValue({
        success: true,
        data: deletedExit,
      })

      const { result } = renderHook(() => useEmployeeExitActions(), {
        wrapper: createQueryWrapper(),
      })

      const deleted = await result.current.deleteEmployeeExit(1)

      expect(window.electronAPI.deleteEmployeeExit).toHaveBeenCalledWith(1)
      expect(deleted).toEqual(deletedExit)
    })

    it('должен переключать статус завершения', async () => {
      vi.mocked(window.electronAPI.updateExitCompleted).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useEmployeeExitActions(), {
        wrapper: createQueryWrapper(),
      })

      await result.current.updateExitCompleted({ id: 1, value: true })

      expect(window.electronAPI.updateExitCompleted).toHaveBeenCalledWith(1, true)
    })
  })
})
