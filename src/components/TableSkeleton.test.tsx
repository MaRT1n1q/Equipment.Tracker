import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TableSkeleton } from './TableSkeleton'

describe('TableSkeleton', () => {
  it('должен рендериться без ошибок', () => {
    const { container } = render(<TableSkeleton />)

    // Проверяем, что компонент отрендерился
    expect(container.firstChild).toBeInTheDocument()
  })

  it('должен рендерить таблицу', () => {
    const { container } = render(<TableSkeleton />)

    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()
  })

  it('должен применять стили анимации', () => {
    const { container } = render(<TableSkeleton />)

    // Проверяем наличие анимированных элементов
    const skeletons = container.querySelectorAll('[class*="animate"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('должен иметь корректную структуру таблицы', () => {
    const { container } = render(<TableSkeleton />)

    const table = container.querySelector('table')
    const thead = table?.querySelector('thead')
    const tbody = table?.querySelector('tbody')

    expect(thead).toBeInTheDocument()
    expect(tbody).toBeInTheDocument()
  })

  it('должен рендерить заголовочные строки', () => {
    const { container } = render(<TableSkeleton />)

    const headerRow = container.querySelector('thead tr')
    expect(headerRow).toBeInTheDocument()

    const headerCells = headerRow?.querySelectorAll('th')
    expect(headerCells && headerCells.length).toBeGreaterThan(0)
  })

  it('должен рендерить строки данных', () => {
    const { container } = render(<TableSkeleton />)

    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows.length).toBe(5) // По умолчанию 5 строк
  })

  it('должен иметь поле поиска skeleton', () => {
    const { container } = render(<TableSkeleton />)

    // Проверяем наличие skeleton для поиска (первый элемент)
    const searchSkeleton = container.querySelector('.h-10')
    expect(searchSkeleton).toBeInTheDocument()
  })

  it('должен иметь фильтры skeleton', () => {
    const { container } = render(<TableSkeleton />)

    // Проверяем наличие skeleton для фильтров
    const filterSkeletons = container.querySelectorAll('.h-8')
    expect(filterSkeletons.length).toBeGreaterThan(0)
  })

  it('должен применять корректные классы стилей', () => {
    const { container } = render(<TableSkeleton />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('space-y-4')
  })
})
