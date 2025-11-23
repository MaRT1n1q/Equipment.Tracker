import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcut, type KeyboardShortcut } from './useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    // Очищаем все обработчики событий
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('должен вызывать callback при нажатии указанной комбинации клавиш', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    // Симулируем нажатие Ctrl+N
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Cmd на Mac (meta)', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 's', metaKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Shift модификатором', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'f', shiftKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'f',
      shiftKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Alt модификатором', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 't', altKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 't',
      altKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('должен работать с комбинацией из нескольких модификаторов', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'k', ctrlKey: true, shiftKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('не должен вызывать callback, если модификаторы не совпадают', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    // Только N без Ctrl
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('не должен вызывать callback для неправильной клавиши', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    // Ctrl+M вместо Ctrl+N
    const event = new KeyboardEvent('keydown', {
      key: 'm',
      ctrlKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('должен очищать обработчик при размонтировании', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useKeyboardShortcut(shortcut, callback))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()
  })

  it('должен обновлять callback при изменении', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }

    const { rerender } = renderHook(({ cb }) => useKeyboardShortcut(shortcut, cb), {
      initialProps: { cb: callback1 },
    })

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).not.toHaveBeenCalled()

    callback1.mockClear()

    rerender({ cb: callback2 })

    window.dispatchEvent(event)
    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('должен работать с заглавными и строчными буквами одинаково', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const eventLower = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    })

    window.dispatchEvent(eventLower)
    expect(callback).toHaveBeenCalledTimes(1)

    const eventUpper = new KeyboardEvent('keydown', {
      key: 'N',
      ctrlKey: true,
      bubbles: true,
    })

    window.dispatchEvent(eventUpper)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('должен работать с функциональными клавишами', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'F5' }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'F5',
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('должен работать с Escape клавишей', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'Escape' }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('должен предотвращать действие по умолчанию по умолчанию', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 's', ctrlKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback))

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalled()
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('должен отключаться через опцию enabled', () => {
    const callback = vi.fn()
    const shortcut: KeyboardShortcut = { key: 'n', ctrlKey: true }

    renderHook(() => useKeyboardShortcut(shortcut, callback, [], { enabled: false }))

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })
})
