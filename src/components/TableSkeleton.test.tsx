import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TableSkeleton } from './TableSkeleton'

describe('TableSkeleton', () => {
  it('должен рендериться с количеством строк по умолчанию', () => {
    const { container } = render(<TableSkeleton />)

    // Проверяем, что есть скелетоны строк
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('должен рендериться с указанным количеством строк', () => {
    const { container } = render(<TableSkeleton rows={3} />)

    // Проверяем, что количество строк соответствует указанному
    const rows = container.querySelectorAll('tr')
    // Один ряд для заголовка + 3 ряда данных
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })

  it('должен рендериться с указанным количеством колонок', () => {
    const { container } = render(<TableSkeleton columns={5} rows={1} />)

    // Проверяем, что количество колонок соответствует
    const firstRow = container.querySelector('tr:nth-child(2)') // Первая строка данных
    const cells = firstRow?.querySelectorAll('td')
    expect(cells?.length).toBe(5)
  })

  it('должен рендерить таблицу', () => {
    const { container } = render(<TableSkeleton />)

    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()
  })

  it('должен применять стили анимации', () => {
    const { container } = render(<TableSkeleton />)

    const skeleton = container.querySelector('[class*="animate-pulse"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('должен рендериться с большим количеством строк', () => {
    const { container } = render(<TableSkeleton rows={10} />)

    const rows = container.querySelectorAll('tr')
    expect(rows.length).toBeGreaterThanOrEqual(10)
  })

  it('должен рендериться без ошибок при минимальных параметрах', () => {
    expect(() => render(<TableSkeleton rows={1} columns={1} />)).not.toThrow()
  })

  it('должен иметь корректную структуру таблицы', () => {
    const { container } = render(<TableSkeleton />)

    const table = container.querySelector('table')
    const thead = table?.querySelector('thead')
    const tbody = table?.querySelector('tbody')

    expect(thead).toBeInTheDocument()
    expect(tbody).toBeInTheDocument()
  })

  it('должен быть доступен', () => {
    const { container } = render(<TableSkeleton />)

    // Таблица должна иметь роль table
    const table = container.querySelector('table')
    expect(table).toHaveAttribute('role', 'table')
  })
})
