import { FileText, Edit, Copy, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { toast } from 'sonner'
import type { InstructionTreeNode } from '../types/ipc'

interface ViewInstructionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instruction: InstructionTreeNode | null
  onEdit: () => void
}

export function ViewInstructionModal({
  open,
  onOpenChange,
  instruction,
  onEdit,
}: ViewInstructionModalProps) {
  if (!instruction) return null

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(instruction.content)
      toast.success('Скопировано в буфер обмена')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  // Простой парсинг ссылок в тексте
  const renderContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
            onClick={(e) => {
              e.preventDefault()
              window.electronAPI?.openExternal(part)
            }}
          >
            {part}
            <ExternalLink className="w-3 h-3" />
          </a>
        )
      }
      return part
    })
  }

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instruction.updated_at))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{instruction.title}</span>
          </DialogTitle>
          <div className="text-xs text-muted-foreground mt-1">Обновлено: {formattedDate}</div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {instruction.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0 m-0 border-0">
                {renderContent(instruction.content)}
              </pre>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-8">Инструкция пуста</div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyContent}>
              <Copy className="w-4 h-4 mr-2" />
              Копировать
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
            <Button onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
