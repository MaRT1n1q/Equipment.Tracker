import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistentState } from './usePersistentState'

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('должен использовать начальное значение, если в localStorage ничего нет', () => {
    const { result } = renderHook(() => usePersistentState('test-key', 'initial'))

    expect(result.current[0]).toBe('initial')
    expect(localStorage.getItem('test-key')).toBe('initial')
  })

  it('должен сохранять значение в localStorage при изменении', () => {
    const { result } = renderHook(() => usePersistentState('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('test-key')).toBe('updated')
  })

  it('должен восстанавливать значение из localStorage при монтировании', () => {
    localStorage.setItem('test-key', 'stored-value')

    const { result } = renderHook(() => usePersistentState('test-key', 'initial'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('должен использовать пользовательский serializer', () => {
    const { result } = renderHook(() =>
      usePersistentState('test-key', 42, {
        serializer: (value) => JSON.stringify({ number: value }),
        deserializer: (value) => JSON.parse(value).number,
      })
    )

    act(() => {
      result.current[1](100)
    })

    expect(result.current[0]).toBe(100)
    expect(localStorage.getItem('test-key')).toBe('{"number":100}')
  })

  it('должен использовать пользовательский deserializer', () => {
    localStorage.setItem('test-key', '{"number":200}')

    const { result } = renderHook(() =>
      usePersistentState('test-key', 0, {
        serializer: (value) => JSON.stringify({ number: value }),
        deserializer: (value) => JSON.parse(value).number,
      })
    )

    expect(result.current[0]).toBe(200)
  })

  it('должен работать с boolean значениями', () => {
    const { result } = renderHook(() =>
      usePersistentState('test-bool', false, {
        serializer: (value) => (value ? 'true' : 'false'),
        deserializer: (value) => value === 'true',
      })
    )

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
    expect(localStorage.getItem('test-bool')).toBe('true')
  })

  it('должен работать с объектами через JSON', () => {
    const initialObj = { name: 'test', count: 0 }

    const { result } = renderHook(() =>
      usePersistentState('test-obj', initialObj, {
        serializer: JSON.stringify,
        deserializer: JSON.parse,
      })
    )

    expect(result.current[0]).toEqual(initialObj)

    const updatedObj = { name: 'updated', count: 5 }
    act(() => {
      result.current[1](updatedObj)
    })

    expect(result.current[0]).toEqual(updatedObj)
    expect(JSON.parse(localStorage.getItem('test-obj')!)).toEqual(updatedObj)
  })

  it('должен поддерживать функциональное обновление', () => {
    const { result } = renderHook(() => usePersistentState('test-counter', '0'))

    act(() => {
      result.current[1]((prev) => String(Number(prev) + 1))
    })

    expect(result.current[0]).toBe('1')

    act(() => {
      result.current[1]((prev) => String(Number(prev) + 1))
    })

    expect(result.current[0]).toBe('2')
  })

  it('должен обрабатывать невалидные данные из localStorage', () => {
    localStorage.setItem('test-key', 'invalid-json')

    const { result } = renderHook(() =>
      usePersistentState(
        'test-key',
        { default: true },
        {
          serializer: JSON.stringify,
          deserializer: (value) => {
            try {
              return JSON.parse(value)
            } catch {
              return { default: true }
            }
          },
        }
      )
    )

    // Должен вернуться к значению по умолчанию
    expect(result.current[0]).toEqual({ default: true })
  })

  it('должен работать с разными ключами независимо', () => {
    const { result: result1 } = renderHook(() => usePersistentState('key1', 'value1'))
    const { result: result2 } = renderHook(() => usePersistentState('key2', 'value2'))

    expect(result1.current[0]).toBe('value1')
    expect(result2.current[0]).toBe('value2')

    act(() => {
      result1.current[1]('updated1')
    })

    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('value2')
  })

  it('должен сохранять значение при повторном монтировании', () => {
    const { result: result1, unmount } = renderHook(() => usePersistentState('test-key', 'initial'))

    act(() => {
      result1.current[1]('persisted')
    })

    unmount()

    const { result: result2 } = renderHook(() => usePersistentState('test-key', 'initial'))

    expect(result2.current[0]).toBe('persisted')
  })

  it('должен обрабатывать ошибки localStorage gracefully', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage full')
    })

    const { result } = renderHook(() => usePersistentState('test-key', 'initial'))

    // Не должно упасть при попытке сохранения
    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    setItemSpy.mockRestore()
  })
})
