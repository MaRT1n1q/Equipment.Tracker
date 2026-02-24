import { useMemo } from 'react'
import { cn } from '../lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  searchTerm?: string
  onInternalLinkClick?: (instructionId: number) => void
}

// Экранирование HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Подсветка поискового термина в финальном HTML
function highlightSearchInHtml(html: string, searchTerm?: string): string {
  if (!searchTerm?.trim()) return html

  const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedSearch})`, 'gi')

  // Подсвечиваем только текст вне HTML-тегов
  return html.replace(/>([^<]+)</g, (_match, text) => {
    const highlighted = text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</mark>'
    )
    return `>${highlighted}<`
  })
}

// Парсинг инлайн-элементов
function parseInline(text: string): string {
  let result = escapeHtml(text)

  // Жирный текст **text** или __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Курсив *text* или _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  result = result.replace(/(?<![_\w])_([^_]+)_(?![_\w])/g, '<em>$1</em>')

  // Зачёркнутый ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Инлайн код `code`
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>'
  )

  // Ссылки [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary hover:underline inline-flex items-center gap-1 markdown-link" data-href="$2">$1<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>'
  )

  // Внутренние ссылки [[id:название]] или [[id]]
  result = result.replace(
    /\[\[(\d+)(?::([^\]]+))?\]\]/g,
    '<a href="#" class="text-primary hover:underline internal-link" data-instruction-id="$1">$2$1</a>'
  )
  // Исправляем отображение внутренней ссылки - убираем ID если есть название
  result = result.replace(/data-instruction-id="(\d+)">([^<]+)\1</g, 'data-instruction-id="$1">$2<')

  // Автоматические ссылки для URL
  result = result.replace(
    /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" class="text-primary hover:underline inline-flex items-center gap-1 markdown-link" data-href="$1">$1<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>'
  )

  return result
}

// Парсинг строки списка
function parseListItem(
  line: string
): { type: 'ul' | 'ol' | 'checkbox'; content: string; checked?: boolean } | null {
  // Чекбокс
  const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/)
  if (checkboxMatch) {
    return {
      type: 'checkbox',
      content: checkboxMatch[2],
      checked: checkboxMatch[1].toLowerCase() === 'x',
    }
  }

  // Маркированный список
  const ulMatch = line.match(/^[-*]\s+(.*)$/)
  if (ulMatch) {
    return { type: 'ul', content: ulMatch[1] }
  }

  // Нумерованный список
  const olMatch = line.match(/^\d+\.\s+(.*)$/)
  if (olMatch) {
    return { type: 'ol', content: olMatch[1] }
  }

  return null
}

export function MarkdownRenderer({
  content,
  className,
  searchTerm,
  onInternalLinkClick,
}: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return ''

    const lines = content.split('\n')
    const result: string[] = []
    let inList: 'ul' | 'ol' | 'checkbox' | null = null
    let listItems: string[] = []

    const closeList = () => {
      if (inList && listItems.length > 0) {
        if (inList === 'checkbox') {
          result.push(`<ul class="space-y-1 my-2">${listItems.join('')}</ul>`)
        } else if (inList === 'ul') {
          result.push(`<ul class="list-disc list-inside space-y-1 my-2">${listItems.join('')}</ul>`)
        } else {
          result.push(
            `<ol class="list-decimal list-inside space-y-1 my-2">${listItems.join('')}</ol>`
          )
        }
        listItems = []
        inList = null
      }
    }

    for (const line of lines) {
      // Пустая строка
      if (line.trim() === '') {
        closeList()
        result.push('<br />')
        continue
      }

      // Разделитель --- / *** / ___
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        closeList()
        result.push('<hr class="my-4 border-border" />')
        continue
      }

      // Заголовки
      const h1Match = line.match(/^#\s+(.*)$/)
      if (h1Match) {
        closeList()
        result.push(`<h1 class="text-2xl font-bold mt-4 mb-2">${parseInline(h1Match[1])}</h1>`)
        continue
      }

      const h2Match = line.match(/^##\s+(.*)$/)
      if (h2Match) {
        closeList()
        result.push(`<h2 class="text-xl font-semibold mt-3 mb-2">${parseInline(h2Match[1])}</h2>`)
        continue
      }

      const h3Match = line.match(/^###\s+(.*)$/)
      if (h3Match) {
        closeList()
        result.push(`<h3 class="text-lg font-medium mt-2 mb-1">${parseInline(h3Match[1])}</h3>`)
        continue
      }

      // Цитата
      const quoteMatch = line.match(/^>\s*(.*)$/)
      if (quoteMatch) {
        closeList()
        result.push(
          `<blockquote class="border-l-4 border-primary/40 pl-4 py-1 my-2 text-muted-foreground italic">${parseInline(quoteMatch[1])}</blockquote>`
        )
        continue
      }

      // Списки
      const listItem = parseListItem(line)
      if (listItem) {
        if (inList !== listItem.type) {
          closeList()
          inList = listItem.type
        }

        if (listItem.type === 'checkbox') {
          const checkedClass = listItem.checked ? 'line-through text-muted-foreground' : ''
          const checkboxIcon = listItem.checked
            ? '<svg class="w-4 h-4 text-primary inline mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>'
            : '<svg class="w-4 h-4 text-muted-foreground inline mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
          listItems.push(
            `<li class="flex items-start ${checkedClass}">${checkboxIcon}<span>${parseInline(listItem.content)}</span></li>`
          )
        } else {
          listItems.push(`<li>${parseInline(listItem.content)}</li>`)
        }
        continue
      }

      // Обычный текст
      closeList()
      result.push(`<p class="my-1">${parseInline(line)}</p>`)
    }

    closeList()

    // Применяем подсветку поиска к финальному HTML
    return highlightSearchInHtml(result.join(''), searchTerm)
  }, [content, searchTerm])

  // Обработчик кликов по ссылкам
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement

    // Проверяем внутреннюю ссылку
    const internalLink = target.closest('.internal-link') as HTMLAnchorElement | null
    if (internalLink) {
      e.preventDefault()
      const instructionId = internalLink.dataset.instructionId
      if (instructionId && onInternalLinkClick) {
        onInternalLinkClick(parseInt(instructionId, 10))
      }
      return
    }

    // Проверяем внешнюю ссылку
    const link = target.closest('.markdown-link') as HTMLAnchorElement | null
    if (link) {
      e.preventDefault()
      const href = link.dataset.href || link.getAttribute('href')
      if (href) {
        window.electronAPI?.openExternal(href)
      }
    }
  }

  if (!content) {
    return (
      <div className={cn('text-muted-foreground text-center py-8', className)}>
        Инструкция пуста
      </div>
    )
  }

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
