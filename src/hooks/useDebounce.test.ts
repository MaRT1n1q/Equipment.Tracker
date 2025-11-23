import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('должен возвращать начальное значение сразу', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('должен задерживать обновление значения', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })

    // Значение еще не должно измениться
    expect(result.current).toBe('initial')

    // Прокручиваем время вперед
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })

  it('должен сбрасывать таймер при множественных обновлениях', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    rerender({ value: 'update1', delay: 500 })
    vi.advanceTimersByTime(250)

    rerender({ value: 'update2', delay: 500 })
    vi.advanceTimersByTime(250)

    // Все еще должно быть начальное значение
    expect(result.current).toBe('initial')

    rerender({ value: 'final', delay: 500 })
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe('final')
    })
  })

  it('должен работать с разными задержками', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 1000 },
    })

    rerender({ value: 'updated', delay: 1000 })

    vi.advanceTimersByTime(500)
    expect(result.current).toBe('initial')

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })

  it('должен работать с числовыми значениями', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 300 },
    })

    expect(result.current).toBe(0)

    rerender({ value: 42, delay: 300 })
    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(result.current).toBe(42)
    })
  })

  it('должен работать с объектами', async () => {
    const obj1 = { name: 'test1' }
    const obj2 = { name: 'test2' }

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: obj1, delay: 200 },
    })

    expect(result.current).toBe(obj1)

    rerender({ value: obj2, delay: 200 })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      expect(result.current).toBe(obj2)
    })
  })

  it('должен очищать таймер при размонтировании', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = renderHook(() => useDebounce('test', 500))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('должен обрабатывать нулевую задержку', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 0 },
    })

    rerender({ value: 'updated', delay: 0 })
    vi.advanceTimersByTime(0)

    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })
})
