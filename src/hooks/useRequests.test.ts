import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRequestsQuery, useRequestActions } from './useRequests'
import { createQueryWrapper } from '../test/queryWrapper'
import { createMockPaginatedResponse, createMockRequest } from '../test/factories'

describe('useRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useRequestsQuery', () => {
    it('должен загружать заявки', async () => {
      const mockRequests = [createMockRequest({ id: 1 }), createMockRequest({ id: 2 })]
      const mockResponse = createMockPaginatedResponse(mockRequests)

      vi.mocked(window.electronAPI.getRequests).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const { result } = renderHook(() => useRequestsQuery({ page: 1, pageSize: 25 }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(window.electronAPI.getRequests).toHaveBeenCalledWith({ page: 1, pageSize: 25 })
    })

    it('должен обрабатывать ошибку загрузки', async () => {
      vi.mocked(window.electronAPI.getRequests).mockResolvedValue({
        success: false,
        error: 'Ошибка загрузки',
      })

      const { result } = renderHook(() => useRequestsQuery({ page: 1, pageSize: 25 }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeTruthy()
    })

    it('должен использовать placeholderData для предотвращения мерцания', async () => {
      const mockRequests = [createMockRequest()]
      const mockResponse = createMockPaginatedResponse(mockRequests)

      vi.mocked(window.electronAPI.getRequests).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const { result, rerender } = renderHook(({ params }) => useRequestsQuery(params), {
        wrapper: createQueryWrapper(),
        initialProps: { params: { page: 1, pageSize: 25 } },
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Изменяем параметры
      rerender({ params: { page: 2, pageSize: 25 } })

      // Placeholder data должен сохранить предыдущие данные
      expect(result.current.data).toBeDefined()
    })
  })

  describe('useRequestActions', () => {
    it('должен создавать заявку', async () => {
      vi.mocked(window.electronAPI.createRequest).mockResolvedValue({
        success: true,
        id: 1,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      const requestData = {
        employee_name: 'Тест',
        login: 'test',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      await result.current.createRequest(requestData)

      expect(window.electronAPI.createRequest).toHaveBeenCalledWith(requestData)
    })

    it('должен обрабатывать ошибку создания заявки', async () => {
      vi.mocked(window.electronAPI.createRequest).mockResolvedValue({
        success: false,
        error: 'Ошибка создания',
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      const requestData = {
        employee_name: 'Тест',
        login: 'test',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      await expect(result.current.createRequest(requestData)).rejects.toThrow()
    })

    it('должен обновлять заявку', async () => {
      vi.mocked(window.electronAPI.updateRequest).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      const updateData = {
        employee_name: 'Обновлено',
        login: 'updated',
        equipment_items: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      }

      await result.current.updateRequest({ id: 1, data: updateData })

      expect(window.electronAPI.updateRequest).toHaveBeenCalledWith(1, updateData)
    })

    it('должен удалять заявку', async () => {
      const deletedRequest = createMockRequest({ id: 1 })
      vi.mocked(window.electronAPI.deleteRequest).mockResolvedValue({
        success: true,
        data: deletedRequest,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      const deleted = await result.current.deleteRequest(1)

      expect(window.electronAPI.deleteRequest).toHaveBeenCalledWith(1)
      expect(deleted).toEqual(deletedRequest)
    })

    it('должен переключать статус issued', async () => {
      vi.mocked(window.electronAPI.updateIssued).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      await result.current.toggleIssued({ id: 1, value: true })

      expect(window.electronAPI.updateIssued).toHaveBeenCalledWith(1, true)
    })

    it('должен планировать сдачу оборудования', async () => {
      vi.mocked(window.electronAPI.scheduleRequestReturn).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      const returnData = {
        due_date: '2024-12-31',
        equipment: 'Ноутбук',
      }

      await result.current.scheduleReturn({ id: 1, data: returnData })

      expect(window.electronAPI.scheduleRequestReturn).toHaveBeenCalledWith(1, returnData)
    })

    it('должен отмечать завершение сдачи оборудования', async () => {
      vi.mocked(window.electronAPI.completeRequestReturn).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      await result.current.completeReturn({ id: 1, value: true })

      expect(window.electronAPI.completeRequestReturn).toHaveBeenCalledWith(1, true)
    })

    it('должен отменять сдачу оборудования', async () => {
      vi.mocked(window.electronAPI.cancelRequestReturn).mockResolvedValue({
        success: true,
      })

      const { result } = renderHook(() => useRequestActions(), {
        wrapper: createQueryWrapper(),
      })

      await result.current.cancelReturn(1)

      expect(window.electronAPI.cancelRequestReturn).toHaveBeenCalledWith(1)
    })
  })
})
