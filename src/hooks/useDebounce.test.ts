import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('должен возвращать начальное значение сразу', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('должен задерживать обновление значения', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })

    expect(result.current).toBe('initial')

    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })

  it('должен сбрасывать таймер при быстрых изменениях', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'first' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'third' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('third')
  })

  it('должен работать с кастомной задержкой', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })

  it('должен работать с разными типами данных', () => {
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      }
    )

    numberRerender({ value: 42 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(numberResult.current).toBe(42)

    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: [1, 2, 3] },
      }
    )

    arrayRerender({ value: [4, 5, 6] })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(arrayResult.current).toEqual([4, 5, 6])
  })

  it('должен очищать таймер при размонтировании', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })
    unmount()

    vi.advanceTimersByTime(300)
    // Не должно быть ошибок при очистке таймера
  })

  it('должен использовать дефолтную задержку 300мс', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })
})
