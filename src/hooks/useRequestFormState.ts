import { useCallback, useMemo, useState } from 'react'
import type { EquipmentItem } from '../types/ipc'

const createEmptyEquipmentItem = (): EquipmentItem => ({
  equipment_name: '',
  serial_number: '',
  quantity: 1,
})

interface UseRequestFormStateOptions {
  employeeName?: string
  login?: string
  notes?: string
  equipmentItems?: EquipmentItem[]
}

export function useRequestFormState(options?: UseRequestFormStateOptions) {
  const [employeeName, setEmployeeName] = useState(options?.employeeName ?? '')
  const [login, setLogin] = useState(options?.login ?? '')
  const [notes, setNotes] = useState(options?.notes ?? '')
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>(() => {
    if (options?.equipmentItems && options.equipmentItems.length > 0) {
      return options.equipmentItems.map((item) => ({ ...item }))
    }

    return [createEmptyEquipmentItem()]
  })
  const [employeeNameError, setEmployeeNameError] = useState(false)
  const [loginError, setLoginError] = useState(false)

  const resetForm = useCallback((nextOptions?: UseRequestFormStateOptions) => {
    setEmployeeName(nextOptions?.employeeName ?? '')
    setLogin(nextOptions?.login ?? '')
    setNotes(nextOptions?.notes ?? '')
    setEquipmentItems(() => {
      if (nextOptions?.equipmentItems && nextOptions.equipmentItems.length > 0) {
        return nextOptions.equipmentItems.map((item) => ({ ...item }))
      }

      return [createEmptyEquipmentItem()]
    })
    setEmployeeNameError(false)
    setLoginError(false)
  }, [])

  const addEquipmentItem = useCallback(() => {
    setEquipmentItems((items) => [...items, createEmptyEquipmentItem()])
  }, [])

  const removeEquipmentItem = useCallback((index: number) => {
    setEquipmentItems((items) => {
      if (items.length <= 1) {
        return items
      }

      return items.filter((_, itemIndex) => itemIndex !== index)
    })
  }, [])

  const updateEquipmentItem = useCallback(
    (index: number, field: keyof EquipmentItem, value: string | number) => {
      setEquipmentItems((items) =>
        items.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: field === 'quantity' ? Number(value) || 1 : value,
              }
            : item
        )
      )
    },
    []
  )

  const hasIncompleteEquipmentItems = useMemo(
    () => equipmentItems.some((item) => !item.equipment_name.trim() || !item.serial_number.trim()),
    [equipmentItems]
  )

  const payload = useMemo(
    () => ({
      employee_name: employeeName.trim(),
      login: login.trim(),
      notes: notes.trim() || undefined,
      equipment_items: equipmentItems,
    }),
    [employeeName, equipmentItems, login, notes]
  )

  return {
    employeeName,
    setEmployeeName,
    employeeNameError,
    setEmployeeNameError,
    login,
    setLogin,
    loginError,
    setLoginError,
    notes,
    setNotes,
    equipmentItems,
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
    hasIncompleteEquipmentItems,
    resetForm,
    payload,
  }
}

export { createEmptyEquipmentItem }
