import { describe, it, expect } from 'vitest'

describe('Date Utilities', () => {
  describe('ISO date formatting', () => {
    it('должен парсить ISO дату', () => {
      const isoString = '2024-12-31T23:59:59.000Z'
      const date = new Date(isoString)

      expect(date).toBeInstanceOf(Date)
      expect(date.toISOString()).toBe(isoString)
    })

    it('должен создавать ISO строку из даты', () => {
      const date = new Date(2024, 11, 31, 0, 0, 0, 0) // Месяцы с 0
      const isoString = date.toISOString()

      expect(isoString).toContain('2024-12-31')
    })

    it('должен сравнивать даты корректно', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-12-31')

      expect(date1 < date2).toBe(true)
      expect(date2 > date1).toBe(true)
    })

    it('должен определять сегодняшнюю дату', () => {
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]

      expect(todayString).toMatch(/\d{4}-\d{2}-\d{2}/)
    })

    it('должен получать начало месяца', () => {
      const now = new Date(2024, 5, 15) // 15 июня 2024
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      expect(monthStart.getDate()).toBe(1)
      expect(monthStart.getMonth()).toBe(5)
      expect(monthStart.getFullYear()).toBe(2024)
    })

    it('должен определять дату в прошлом', () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      expect(yesterday < now).toBe(true)
    })

    it('должен определять дату в будущем', () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(tomorrow > now).toBe(true)
    })

    it('должен форматировать дату в YYYY-MM-DD', () => {
      const date = new Date('2024-05-15T10:30:00.000Z')
      const formatted = date.toISOString().split('T')[0]

      expect(formatted).toBe('2024-05-15')
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('должен парсить дату из строки YYYY-MM-DD', () => {
      const dateString = '2024-12-31'
      const date = new Date(dateString)

      expect(date).toBeInstanceOf(Date)
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(11) // Декабрь (месяцы с 0)
      expect(date.getDate()).toBe(31)
    })

    it('должен валидировать формат даты', () => {
      const validDate = '2024-12-31'
      const invalidDate1 = '31-12-2024'
      const invalidDate2 = '2024/12/31'

      const regex = /^\d{4}-\d{2}-\d{2}$/

      expect(regex.test(validDate)).toBe(true)
      expect(regex.test(invalidDate1)).toBe(false)
      expect(regex.test(invalidDate2)).toBe(false)
    })
  })

  describe('Date comparisons', () => {
    it('должен определять просроченную дату', () => {
      const now = new Date()
      const pastDate = new Date(now)
      pastDate.setDate(pastDate.getDate() - 7)

      const isOverdue = pastDate < now
      expect(isOverdue).toBe(true)
    })

    it('должен определять предстоящую дату', () => {
      const now = new Date()
      const futureDate = new Date(now)
      futureDate.setDate(futureDate.getDate() + 7)

      const isUpcoming = futureDate > now
      expect(isUpcoming).toBe(true)
    })

    it('должен проверять равенство дат по дню', () => {
      const date1 = new Date('2024-12-31T10:00:00')
      const date2 = new Date('2024-12-31T15:00:00')

      const sameDay =
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()

      expect(sameDay).toBe(true)
    })

    it('должен вычислять разницу в днях', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-08')

      const diffTime = Math.abs(date2.getTime() - date1.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      expect(diffDays).toBe(7)
    })
  })

  describe('Month operations', () => {
    it('должен получать первый день месяца', () => {
      const date = new Date(2024, 5, 15)
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)

      expect(firstDay.getDate()).toBe(1)
    })

    it('должен получать последний день месяца', () => {
      const date = new Date(2024, 5, 15) // Июнь
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      expect(lastDay.getDate()).toBe(30) // Июнь имеет 30 дней
    })

    it('должен определять високосный год', () => {
      const lastDayFeb2024 = new Date(2024, 2, 0) // Последний день февраля 2024

      expect(lastDayFeb2024.getDate()).toBe(29)
    })

    it('должен определять не високосный год', () => {
      const lastDayFeb2023 = new Date(2023, 2, 0) // Последний день февраля 2023

      expect(lastDayFeb2023.getDate()).toBe(28)
    })
  })
})
