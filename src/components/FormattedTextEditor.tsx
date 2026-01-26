import { useRef, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Link,
  Minus,
  CheckSquare,
} from 'lucide-react'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '../lib/utils'

interface FormattedTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  id?: string
}

interface FormatAction {
  icon: React.ElementType
  label: string
  prefix: string
  suffix: string
  multiline?: boolean
  blockPrefix?: string
}

const formatActions: FormatAction[] = [
  { icon: Bold, label: 'Жирный (Ctrl+B)', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'Курсив (Ctrl+I)', prefix: '*', suffix: '*' },
  { icon: Underline, label: 'Подчёркнутый', prefix: '__', suffix: '__' },
  { icon: Strikethrough, label: 'Зачёркнутый', prefix: '~~', suffix: '~~' },
  { icon: Code, label: 'Код', prefix: '`', suffix: '`' },
]

const blockActions: FormatAction[] = [
  { icon: Heading1, label: 'Заголовок 1', prefix: '', suffix: '', blockPrefix: '# ' },
  { icon: Heading2, label: 'Заголовок 2', prefix: '', suffix: '', blockPrefix: '## ' },
  { icon: Heading3, label: 'Заголовок 3', prefix: '', suffix: '', blockPrefix: '### ' },
  { icon: Quote, label: 'Цитата', prefix: '', suffix: '', blockPrefix: '> ' },
  { icon: List, label: 'Маркированный список', prefix: '', suffix: '', blockPrefix: '- ' },
  { icon: ListOrdered, label: 'Нумерованный список', prefix: '', suffix: '', blockPrefix: '1. ' },
  { icon: CheckSquare, label: 'Чек-лист', prefix: '', suffix: '', blockPrefix: '- [ ] ' },
  { icon: Minus, label: 'Разделитель', prefix: '', suffix: '', blockPrefix: '\n---\n' },
]

export function FormattedTextEditor({
  value,
  onChange,
  placeholder = 'Текст инструкции...',
  rows = 12,
  className,
  id,
}: FormattedTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = useCallback(
    (action: FormatAction) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)

      let newText: string
      let newCursorPos: number

      if (action.blockPrefix) {
        // Для блочных элементов
        if (action.blockPrefix === '\n---\n') {
          // Разделитель вставляется как есть
          newText = value.substring(0, start) + action.blockPrefix + value.substring(end)
          newCursorPos = start + action.blockPrefix.length
        } else {
          // Находим начало текущей строки
          const lineStart = value.lastIndexOf('\n', start - 1) + 1
          const beforeLine = value.substring(0, lineStart)
          const currentLine = value.substring(lineStart, end)
          const afterSelection = value.substring(end)

          // Если выделено несколько строк, добавляем префикс к каждой
          if (selectedText.includes('\n')) {
            const lines = selectedText.split('\n')
            const formattedLines = lines.map((line, index) => {
              // Для нумерованного списка увеличиваем номер
              if (action.blockPrefix === '1. ') {
                return `${index + 1}. ${line}`
              }
              return action.blockPrefix + line
            })
            newText = beforeLine + formattedLines.join('\n') + afterSelection
            newCursorPos = beforeLine.length + formattedLines.join('\n').length
          } else {
            // Одна строка
            newText = beforeLine + action.blockPrefix + currentLine + afterSelection
            newCursorPos = beforeLine.length + action.blockPrefix.length + currentLine.length
          }
        }
      } else {
        // Для инлайн форматирования
        if (selectedText) {
          // Есть выделение — оборачиваем
          newText =
            value.substring(0, start) +
            action.prefix +
            selectedText +
            action.suffix +
            value.substring(end)
          newCursorPos = start + action.prefix.length + selectedText.length + action.suffix.length
        } else {
          // Нет выделения — вставляем маркеры и ставим курсор между ними
          newText = value.substring(0, start) + action.prefix + action.suffix + value.substring(end)
          newCursorPos = start + action.prefix.length
        }
      }

      onChange(newText)

      // Восстанавливаем фокус и позицию курсора
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [value, onChange]
  )

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const linkText = selectedText || 'текст ссылки'
    const linkFormat = `[${linkText}](url)`

    const newText = value.substring(0, start) + linkFormat + value.substring(end)

    onChange(newText)

    setTimeout(() => {
      textarea.focus()
      // Выделяем "url" для удобной замены
      const urlStart = start + linkText.length + 3
      const urlEnd = urlStart + 3
      textarea.setSelectionRange(urlStart, urlEnd)
    }, 0)
  }, [value, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            insertFormat(formatActions[0]) // Bold
            break
          case 'i':
            e.preventDefault()
            insertFormat(formatActions[1]) // Italic
            break
          case 'k':
            e.preventDefault()
            insertLink()
            break
        }
      }
    },
    [insertFormat, insertLink]
  )

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center gap-0.5 p-1 rounded-lg border border-border bg-muted/30">
          {/* Inline formatting */}
          {formatActions.map((action) => (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertFormat(action)}
                >
                  <action.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={insertLink}
              >
                <Link className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Ссылка (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Block formatting */}
          {blockActions.map((action) => (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertFormat(action)}
                >
                  <action.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={cn('resize-none font-mono text-sm', className)}
      />

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Поддерживается Markdown: **жирный**, *курсив*, `код`, [ссылка](url)
      </p>
    </div>
  )
}
