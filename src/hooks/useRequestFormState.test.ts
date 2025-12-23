import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRequestFormState } from './useRequestFormState'

describe('useRequestFormState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('должен инициализироваться пустыми значениями', () => {
    const { result } = renderHook(() => useRequestFormState())

    expect(result.current.employeeName).toBe('')
    expect(result.current.login).toBe('')
    expect(result.current.sdNumber).toBe('')
    expect(result.current.notes).toBe('')
    expect(result.current.equipmentItems).toHaveLength(1)
  })

  it('должен инициализироваться из опций', () => {
    const { result } = renderHook(() =>
      useRequestFormState({
        employeeName: 'Иванов Иван Иванович',
        login: 'ivanov',
        sdNumber: 'SD-12345',
        notes: 'Тестовые заметки',
        equipmentItems: [
          {
            equipment_name: 'Ноутбук',
            serial_number: 'SN123',
            quantity: 1,
          },
        ],
      })
    )

    expect(result.current.employeeName).toBe('Иванов Иван Иванович')
    expect(result.current.login).toBe('ivanov')
    expect(result.current.sdNumber).toBe('SD-12345')
    expect(result.current.notes).toBe('Тестовые заметки')
    expect(result.current.equipmentItems).toHaveLength(1)
    expect(result.current.equipmentItems[0].equipment_name).toBe('Ноутбук')
  })

  it('должен обновлять employeeName', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeName('Петров Петр')
    })

    expect(result.current.employeeName).toBe('Петров Петр')
  })

  it('должен обновлять login', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setLogin('petrov')
    })

    expect(result.current.login).toBe('petrov')
  })

  it('должен обновлять sdNumber', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setSdNumber('SD-54321')
    })

    expect(result.current.sdNumber).toBe('SD-54321')
  })

  it('должен обновлять notes', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setNotes('Новые заметки')
    })

    expect(result.current.notes).toBe('Новые заметки')
  })

  it('должен добавлять позицию оборудования', () => {
    const { result } = renderHook(() => useRequestFormState())

    const initialLength = result.current.equipmentItems.length

    act(() => {
      result.current.addEquipmentItem()
    })

    expect(result.current.equipmentItems).toHaveLength(initialLength + 1)
    expect(result.current.equipmentItems[initialLength]).toEqual({
      equipment_name: '',
      serial_number: '',
      quantity: 1,
    })
  })

  it('должен обновлять позицию оборудования', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.updateEquipmentItem(0, 'equipment_name', 'Монитор')
      result.current.updateEquipmentItem(0, 'serial_number', 'MON-001')
      result.current.updateEquipmentItem(0, 'quantity', 2)
    })

    expect(result.current.equipmentItems[0]).toEqual({
      equipment_name: 'Монитор',
      serial_number: 'MON-001',
      quantity: 2,
    })
  })

  it('должен удалять позицию оборудования', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.addEquipmentItem()
      result.current.addEquipmentItem()
    })

    const initialLength = result.current.equipmentItems.length
    expect(initialLength).toBeGreaterThan(1)

    act(() => {
      result.current.removeEquipmentItem(0)
    })

    expect(result.current.equipmentItems).toHaveLength(initialLength - 1)
  })

  it('не должен удалять последнюю позицию оборудования', () => {
    const { result } = renderHook(() => useRequestFormState())

    // По умолчанию есть одна позиция
    expect(result.current.equipmentItems).toHaveLength(1)

    act(() => {
      result.current.removeEquipmentItem(0)
    })

    // Все еще должна быть одна позиция
    expect(result.current.equipmentItems).toHaveLength(1)
  })

  it('должен обрезать пробелы в payload', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeName('  Иванов Иван  ')
      result.current.setLogin('  ivanov  ')
      result.current.setSdNumber('  SD-123  ')
      result.current.setNotes('  Заметки  ')
    })

    const payload = result.current.payload

    expect(payload.employee_name).toBe('Иванов Иван')
    expect(payload.login).toBe('ivanov')
    expect(payload.sd_number).toBe('SD-123')
    expect(payload.notes).toBe('Заметки')
  })

  it('должен конвертировать пустые строки в undefined для опциональных полей', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeName('Тест')
      result.current.setLogin('test')
      result.current.setSdNumber('')
      result.current.setNotes('')
    })

    const payload = result.current.payload

    expect(payload.sd_number).toBeUndefined()
    expect(payload.notes).toBeUndefined()
  })

  it('должен иметь флаг hasIncompleteEquipmentItems для незаполненных позиций', () => {
    const { result } = renderHook(() => useRequestFormState())

    // Изначально есть пустая позиция
    expect(result.current.hasIncompleteEquipmentItems).toBe(true)

    act(() => {
      result.current.updateEquipmentItem(0, 'equipment_name', 'Ноутбук')
      result.current.updateEquipmentItem(0, 'serial_number', 'SN-001')
    })

    expect(result.current.hasIncompleteEquipmentItems).toBe(false)
  })

  it('должен сбрасывать форму', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeName('Иванов')
      result.current.setLogin('ivanov')
      result.current.setSdNumber('SD-123')
      result.current.setNotes('Заметки')
      result.current.addEquipmentItem()
    })

    act(() => {
      result.current.resetForm()
    })

    expect(result.current.employeeName).toBe('')
    expect(result.current.login).toBe('')
    expect(result.current.sdNumber).toBe('')
    expect(result.current.notes).toBe('')
    expect(result.current.equipmentItems).toHaveLength(1)
  })

  it('должен сбрасывать форму с новыми опциями', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeName('Старое имя')
      result.current.setLogin('old_login')
    })

    act(() => {
      result.current.resetForm({
        employeeName: 'Новое имя',
        login: 'new_login',
      })
    })

    expect(result.current.employeeName).toBe('Новое имя')
    expect(result.current.login).toBe('new_login')
  })

  it('должен корректно обрабатывать quantity как число', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.updateEquipmentItem(0, 'quantity', 5)
    })

    const payload = result.current.payload

    expect(payload.equipment_items[0].quantity).toBe(5)
    expect(typeof payload.equipment_items[0].quantity).toBe('number')
  })

  it('должен корректно обрабатывать quantity при строковом вводе', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.updateEquipmentItem(0, 'quantity', '10')
    })

    const payload = result.current.payload

    expect(payload.equipment_items[0].quantity).toBe(10)
    expect(typeof payload.equipment_items[0].quantity).toBe('number')
  })

  it('должен сохранять несколько позиций оборудования', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.updateEquipmentItem(0, 'equipment_name', 'Ноутбук')
      result.current.updateEquipmentItem(0, 'serial_number', 'SN-001')

      result.current.addEquipmentItem()
      result.current.updateEquipmentItem(1, 'equipment_name', 'Мышь')
      result.current.updateEquipmentItem(1, 'serial_number', 'SN-002')

      result.current.addEquipmentItem()
      result.current.updateEquipmentItem(2, 'equipment_name', 'Клавиатура')
      result.current.updateEquipmentItem(2, 'serial_number', 'SN-003')
    })

    expect(result.current.equipmentItems).toHaveLength(3)

    const payload = result.current.payload
    expect(payload.equipment_items).toHaveLength(3)
  })

  it('должен корректно инициализировать errors', () => {
    const { result } = renderHook(() => useRequestFormState())

    expect(result.current.employeeNameError).toBe(false)
    expect(result.current.loginError).toBe(false)
  })

  it('должен обновлять errors', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeNameError(true)
      result.current.setLoginError(true)
    })

    expect(result.current.employeeNameError).toBe(true)
    expect(result.current.loginError).toBe(true)
  })

  it('должен сбрасывать errors при resetForm', () => {
    const { result } = renderHook(() => useRequestFormState())

    act(() => {
      result.current.setEmployeeNameError(true)
      result.current.setLoginError(true)
    })

    act(() => {
      result.current.resetForm()
    })

    expect(result.current.employeeNameError).toBe(false)
    expect(result.current.loginError).toBe(false)
  })
})
