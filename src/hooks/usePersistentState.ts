import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

type Serializer<T> = (value: T) => string

type Deserializer<T> = (value: string) => T

interface UsePersistentStateOptions<T> {
  serializer?: Serializer<T>
  deserializer?: Deserializer<T>
  enabled?: boolean
}

const isBrowser = typeof window !== 'undefined'

function getStoredValue<T>(key: string, initialValue: T, deserializer: Deserializer<T>): T {
  if (!isBrowser) {
    return initialValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (rawValue === null) {
      return initialValue
    }

    return deserializer(rawValue)
  } catch (error) {
    console.warn(`Failed to read persistent state for key "${key}"`, error)
    return initialValue
  }
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options?: UsePersistentStateOptions<T>
): [T, Dispatch<SetStateAction<T>>] {
  const enabled = options?.enabled ?? true

  // Сохраняем initialValue в ref, чтобы избежать бесконечного цикла
  const initialValueRef = useRef(initialValue)

  const defaultSerializer = useCallback<Serializer<T>>((value) => JSON.stringify(value), [])
  const defaultDeserializer = useCallback<Deserializer<T>>((value) => JSON.parse(value) as T, [])

  const serializerRef = useRef<Serializer<T>>(options?.serializer ?? defaultSerializer)
  const deserializerRef = useRef<Deserializer<T>>(options?.deserializer ?? defaultDeserializer)

  useEffect(() => {
    serializerRef.current = options?.serializer ?? defaultSerializer
  }, [defaultSerializer, options?.serializer])

  useEffect(() => {
    deserializerRef.current = options?.deserializer ?? defaultDeserializer
  }, [defaultDeserializer, options?.deserializer])

  // Инициализация состояния - читаем из localStorage только один раз
  const [state, setState] = useState<T>(() =>
    getStoredValue(key, initialValueRef.current, deserializerRef.current)
  )

  // Синхронизация с другими вкладками через storage event
  useEffect(() => {
    if (!enabled || !isBrowser) {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) {
        return
      }

      setState((prev) => {
        if (event.newValue === null) {
          return initialValueRef.current
        }

        try {
          return deserializerRef.current(event.newValue)
        } catch (error) {
          console.warn(`Failed to sync persistent state for key "${key}"`, error)
          return prev
        }
      })
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [enabled, key])

  const setPersistentState = useCallback<Dispatch<SetStateAction<T>>>(
    (valueOrUpdater) => {
      setState((previous) => {
        const nextValue =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (prevState: T) => T)(previous)
            : valueOrUpdater

        if (enabled && isBrowser) {
          try {
            window.localStorage.setItem(key, serializerRef.current(nextValue))
          } catch (error) {
            console.warn(`Failed to persist state for key "${key}"`, error)
          }
        }

        return nextValue
      })
    },
    [enabled, key]
  )

  return [state, setPersistentState]
}
