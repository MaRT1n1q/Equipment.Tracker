import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcut, type KeyboardShortcut } from './useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  let mockHandler: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockHandler = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('должен вызывать обработчик при нажатии клавиши', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(event)
  })

  it('не должен вызывать обработчик для неправильной клавиши', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', ctrlKey: true }))

    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('должен работать с Ctrl+Key', () => {
    const shortcut: KeyboardShortcut = { key: 'f', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Cmd+Key на Mac (metaKey)', () => {
    const shortcut: KeyboardShortcut = { key: 'f', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    // На Mac, ctrlKey в shortcut должен принимать metaKey
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', metaKey: true }))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Shift+Key', () => {
    const shortcut: KeyboardShortcut = { key: 's', shiftKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', shiftKey: true }))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Alt+Key', () => {
    const shortcut: KeyboardShortcut = { key: 'a', altKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', altKey: true }))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('должен работать с комбинацией модификаторов', () => {
    const shortcut: KeyboardShortcut = { key: 't', ctrlKey: true, shiftKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', ctrlKey: true, shiftKey: true }))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('не должен вызывать обработчик без модификаторов если они требуются', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))

    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('должен предотвращать действие по умолчанию', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('не должен предотвращать действие по умолчанию если preventDefault=false', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler, [], { preventDefault: false }))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
    expect(mockHandler).toHaveBeenCalled()
  })

  it('не должен работать когда enabled=false', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler, [], { enabled: false }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))

    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('должен переключаться между enabled состояниями', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    const { rerender } = renderHook(
      ({ enabled }) => useKeyboardShortcut(shortcut, mockHandler, [], { enabled }),
      {
        initialProps: { enabled: false },
      }
    )

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    expect(mockHandler).not.toHaveBeenCalled()

    rerender({ enabled: true })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('должен удалять обработчик при размонтировании', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    const { unmount } = renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    unmount()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))

    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('должен быть нечувствителен к регистру клавиш', () => {
    const shortcut: KeyboardShortcut = { key: 'N', ctrlKey: true }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    expect(mockHandler).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'N', ctrlKey: true }))
    expect(mockHandler).toHaveBeenCalledTimes(2)
  })

  it('должен обновлять обработчик без пересоздания слушателя', () => {
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    const { rerender } = renderHook(({ handler }) => useKeyboardShortcut(shortcut, handler), {
      initialProps: { handler: handler1 },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    expect(handler1).toHaveBeenCalledTimes(1)

    rerender({ handler: handler2 })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('должен работать только с клавишей без модификаторов', () => {
    const shortcut: KeyboardShortcut = { key: 'Escape' }
    renderHook(() => useKeyboardShortcut(shortcut, mockHandler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })
})
