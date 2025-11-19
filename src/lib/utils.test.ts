import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('должен объединять классы', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('должен игнорировать falsy значения', () => {
      const result = cn('class1', false, 'class2', null, undefined, 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('должен работать с условными классами', () => {
      const isActive = true
      const isDisabled = false
      const result = cn('base', isActive && 'active', isDisabled && 'disabled')
      expect(result).toBe('base active')
    })

    it('должен мержить tailwind классы без конфликтов', () => {
      // tailwind-merge должен разрешать конфликты
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('должен возвращать пустую строку для пустого ввода', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })
})
