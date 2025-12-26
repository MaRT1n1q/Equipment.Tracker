import { useCallback, useMemo, useRef, useState } from 'react'
import type { EquipmentItem } from '../types/ipc'
import { usePersistentState } from './usePersistentState'

const createEmptyEquipmentItem = (): EquipmentItem => ({
  equipment_name: '',
  serial_number: '',
  quantity: 1,
})

interface UseRequestFormStateOptions {
  employeeName?: string
  login?: string
  sdNumber?: string | null
  deliveryUrl?: string | null
  notes?: string
  equipmentItems?: EquipmentItem[]
  persistKey?: string
}

interface RequestFormState {
  employeeName: string
  login: string
  sdNumber: string
  deliveryUrl: string
  notes: string
  equipmentItems: EquipmentItem[]
}

const REQUEST_FORM_TRANSIENT_KEY = 'equipment-tracker:request-form:transient'

const createStateFromOptions = (options?: UseRequestFormStateOptions): RequestFormState => ({
  employeeName: options?.employeeName ?? '',
  login: options?.login ?? '',
  sdNumber: options?.sdNumber ?? '',
  deliveryUrl: options?.deliveryUrl ?? '',
  notes: options?.notes ?? '',
  equipmentItems:
    options?.equipmentItems && options.equipmentItems.length > 0
      ? options.equipmentItems.map((item) => ({ ...item }))
      : [createEmptyEquipmentItem()],
})

export function useRequestFormState(options?: UseRequestFormStateOptions) {
  const persistKey = options?.persistKey ?? REQUEST_FORM_TRANSIENT_KEY
  const initialStateRef = useRef<RequestFormState | null>(null)

  if (initialStateRef.current === null) {
    initialStateRef.current = createStateFromOptions(options)
  }

  const initialState = initialStateRef.current

  const [formState, setFormState] = usePersistentState<RequestFormState>(persistKey, initialState, {
    enabled: Boolean(options?.persistKey),
    deserializer: (value) => {
      try {
        const parsed = JSON.parse(value) as Partial<RequestFormState>
        return {
          employeeName: typeof parsed.employeeName === 'string' ? parsed.employeeName : '',
          login: typeof parsed.login === 'string' ? parsed.login : '',
          sdNumber: typeof parsed.sdNumber === 'string' ? parsed.sdNumber : '',
          deliveryUrl: typeof parsed.deliveryUrl === 'string' ? parsed.deliveryUrl : '',
          notes: typeof parsed.notes === 'string' ? parsed.notes : '',
          equipmentItems:
            parsed.equipmentItems && parsed.equipmentItems.length > 0
              ? parsed.equipmentItems.map((item) => ({ ...item }))
              : [createEmptyEquipmentItem()],
        }
      } catch (error) {
        console.warn('Failed to deserialize request form state', error)
        return createStateFromOptions()
      }
    },
  })
  const [employeeNameError, setEmployeeNameError] = useState(false)
  const [loginError, setLoginError] = useState(false)

  const setEmployeeName = useCallback(
    (value: string) => {
      setFormState((state) => ({ ...state, employeeName: value }))
    },
    [setFormState]
  )

  const setLogin = useCallback(
    (value: string) => {
      setFormState((state) => ({ ...state, login: value }))
    },
    [setFormState]
  )

  const setSdNumber = useCallback(
    (value: string) => {
      setFormState((state) => ({ ...state, sdNumber: value }))
    },
    [setFormState]
  )

  const setDeliveryUrl = useCallback(
    (value: string) => {
      setFormState((state) => ({ ...state, deliveryUrl: value }))
    },
    [setFormState]
  )

  const setNotes = useCallback(
    (value: string) => {
      setFormState((state) => ({ ...state, notes: value }))
    },
    [setFormState]
  )

  const setEquipmentItems = useCallback(
    (updater: (items: EquipmentItem[]) => EquipmentItem[]) => {
      setFormState((state) => ({ ...state, equipmentItems: updater(state.equipmentItems) }))
    },
    [setFormState]
  )

  const resetForm = useCallback(
    (nextOptions?: UseRequestFormStateOptions) => {
      const nextState = createStateFromOptions(nextOptions)
      setFormState(nextState)
      initialStateRef.current = nextState
      setEmployeeNameError(false)
      setLoginError(false)
    },
    [setFormState]
  )

  const addEquipmentItem = useCallback(() => {
    setEquipmentItems((items) => [...items, createEmptyEquipmentItem()])
  }, [setEquipmentItems])

  const removeEquipmentItem = useCallback(
    (index: number) => {
      setEquipmentItems((items) => {
        if (items.length <= 1) {
          return items
        }

        return items.filter((_, itemIndex) => itemIndex !== index)
      })
    },
    [setEquipmentItems]
  )

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
    [setEquipmentItems]
  )

  const hasIncompleteEquipmentItems = useMemo(
    () =>
      formState.equipmentItems.some(
        (item) => !item.equipment_name.trim() || !item.serial_number.trim()
      ),
    [formState.equipmentItems]
  )

  const payload = useMemo(
    () => ({
      employee_name: formState.employeeName.trim(),
      login: formState.login.trim(),
      sd_number: formState.sdNumber.trim() ? formState.sdNumber.trim() : undefined,
      delivery_url: formState.deliveryUrl.trim() ? formState.deliveryUrl.trim() : undefined,
      notes: formState.notes.trim() || undefined,
      equipment_items: formState.equipmentItems,
    }),
    [formState]
  )

  return {
    employeeName: formState.employeeName,
    setEmployeeName,
    employeeNameError,
    setEmployeeNameError,
    login: formState.login,
    setLogin,
    loginError,
    setLoginError,
    sdNumber: formState.sdNumber,
    setSdNumber,
    deliveryUrl: formState.deliveryUrl,
    setDeliveryUrl,
    notes: formState.notes,
    setNotes,
    equipmentItems: formState.equipmentItems,
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
    hasIncompleteEquipmentItems,
    resetForm,
    payload,
  }
}

export { createEmptyEquipmentItem }
