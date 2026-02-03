import { describe, it, expect } from 'vitest'
import {
  parseExitEquipmentList,
  formatExitEquipmentList,
  createEmptyExitEquipmentItem,
  type ExitEquipmentItem,
} from './employeeExitEquipment'

describe('employeeExitEquipment', () => {
  describe('parseExitEquipmentList', () => {
    it('должен парсить JSON формат с name и serial', () => {
      const input = '[{"name":"Ноутбук","serial":"SN123"},{"name":"Мышь","serial":"SN456"}]'
      const result = parseExitEquipmentList(input)
      expect(result).toEqual([
        { name: 'Ноутбук', serial: 'SN123', status: 'in_stock' },
        { name: 'Мышь', serial: 'SN456', status: 'in_stock' },
      ])
    })

    it('должен парсить JSON формат с status', () => {
      const input =
        '[{"name":"Ноутбук","serial":"SN123","status":"issued"},{"name":"Мышь","serial":"SN456","status":"ordered"}]'
      const result = parseExitEquipmentList(input)
      expect(result).toEqual([
        { name: 'Ноутбук', serial: 'SN123', status: 'issued' },
        { name: 'Мышь', serial: 'SN456', status: 'ordered' },
      ])
    })

    it('должен парсить старый формат (построчный)', () => {
      const input = 'Ноутбук\nМышь\nКлавиатура'
      const result = parseExitEquipmentList(input)
      expect(result).toEqual([
        { name: 'Ноутбук', serial: '', status: 'in_stock' },
        { name: 'Мышь', serial: '', status: 'in_stock' },
        { name: 'Клавиатура', serial: '', status: 'in_stock' },
      ])
    })

    it('должен возвращать пустой массив для null/undefined', () => {
      expect(parseExitEquipmentList(null)).toEqual([])
      expect(parseExitEquipmentList(undefined)).toEqual([])
    })

    it('должен возвращать пустой массив для пустой строки', () => {
      expect(parseExitEquipmentList('')).toEqual([])
      expect(parseExitEquipmentList('   ')).toEqual([])
    })

    it('должен обрезать пробелы в элементах', () => {
      const input = '  Ноутбук  \n  Мышь  \n  Клавиатура  '
      const result = parseExitEquipmentList(input)
      expect(result).toEqual([
        { name: 'Ноутбук', serial: '', status: 'in_stock' },
        { name: 'Мышь', serial: '', status: 'in_stock' },
        { name: 'Клавиатура', serial: '', status: 'in_stock' },
      ])
    })

    it('должен фильтровать пустые строки', () => {
      const input = 'Ноутбук\n\n\nМышь\n\nКлавиатура'
      const result = parseExitEquipmentList(input)
      expect(result).toEqual([
        { name: 'Ноутбук', serial: '', status: 'in_stock' },
        { name: 'Мышь', serial: '', status: 'in_stock' },
        { name: 'Клавиатура', serial: '', status: 'in_stock' },
      ])
    })
  })

  describe('formatExitEquipmentList', () => {
    it('должен форматировать массив в JSON с status', () => {
      const items: ExitEquipmentItem[] = [
        { name: 'Ноутбук', serial: 'SN123', status: 'in_stock' },
        { name: 'Мышь', serial: 'SN456', status: 'issued' },
      ]
      const result = formatExitEquipmentList(items)
      expect(result).toBe(
        '[{"name":"Ноутбук","serial":"SN123","status":"in_stock"},{"name":"Мышь","serial":"SN456","status":"issued"}]'
      )
    })

    it('должен возвращать пустую строку для пустого массива', () => {
      expect(formatExitEquipmentList([])).toBe('')
    })

    it('должен фильтровать элементы без name или serial', () => {
      const items: ExitEquipmentItem[] = [
        { name: 'Ноутбук', serial: 'SN123', status: 'in_stock' },
        { name: '', serial: '', status: 'in_stock' },
        { name: 'Мышь', serial: '', status: 'ordered' },
        { name: '', serial: 'SN456', status: 'in_stock' },
      ]
      const result = formatExitEquipmentList(items)
      expect(result).toBe('[{"name":"Ноутбук","serial":"SN123","status":"in_stock"}]')
    })

    it('должен обрезать пробелы', () => {
      const items: ExitEquipmentItem[] = [
        { name: '  Ноутбук  ', serial: '  SN123  ', status: 'in_stock' },
      ]
      const result = formatExitEquipmentList(items)
      expect(result).toBe('[{"name":"Ноутбук","serial":"SN123","status":"in_stock"}]')
    })
  })

  describe('createEmptyExitEquipmentItem', () => {
    it('должен создавать пустой элемент со статусом in_stock', () => {
      const result = createEmptyExitEquipmentItem()
      expect(result).toEqual({ name: '', serial: '', status: 'in_stock' })
    })
  })
})
