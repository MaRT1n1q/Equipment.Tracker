import type { EquipmentStatus } from '../types/ipc'

export interface ExitEquipmentItem {
  name: string
  serial: string
  status?: EquipmentStatus
}

export const createEmptyExitEquipmentItem = (): ExitEquipmentItem => ({
  name: '',
  serial: '',
  status: 'in_stock',
})

export function parseExitEquipmentList(rawList: string | null | undefined): ExitEquipmentItem[] {
  if (!rawList) {
    return []
  }

  const trimmed = rawList.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            name: typeof item?.name === 'string' ? item.name.trim() : '',
            serial: typeof item?.serial === 'string' ? item.serial.trim() : '',
            status: (item?.status as EquipmentStatus) || 'in_stock',
          }))
          .filter((item) => item.name || item.serial)
      }
    } catch (error) {
      console.warn('Не удалось разобрать equipment_list как JSON:', error)
    }
  }

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, serial: '', status: 'in_stock' as EquipmentStatus }))
}

export function formatExitEquipmentList(items: ExitEquipmentItem[]): string {
  const normalized = items
    .map((item) => ({
      name: item.name.trim(),
      serial: item.serial.trim(),
      status: item.status || 'in_stock',
    }))
    .filter((item) => item.name && item.serial)

  if (normalized.length === 0) {
    return ''
  }

  return JSON.stringify(normalized)
}

export function stringifyExitEquipmentItems(items: ExitEquipmentItem[]): string {
  return items.map((item) => (item.serial ? `${item.name} — ${item.serial}` : item.name)).join('\n')
}

// Обновляет статус оборудования в списке по индексу
export function updateExitEquipmentStatus(
  items: ExitEquipmentItem[],
  index: number,
  status: EquipmentStatus
): ExitEquipmentItem[] {
  return items.map((item, i) => (i === index ? { ...item, status } : item))
}

// Устанавливает статус "issued" для всех элементов
export function markAllEquipmentAsIssued(items: ExitEquipmentItem[]): ExitEquipmentItem[] {
  return items.map((item) => ({ ...item, status: 'issued' as EquipmentStatus }))
}
