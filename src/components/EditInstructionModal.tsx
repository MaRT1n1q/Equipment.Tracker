import { useState, useEffect } from 'react'
import { Edit, Folder, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { useInstructions } from '../hooks/useInstructions'
import type { Instruction } from '../types/ipc'

interface EditInstructionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instruction: Instruction | null
}

export function EditInstructionModal({
  open,
  onOpenChange,
  instruction,
}: EditInstructionModalProps) {
  const { updateInstruction } = useInstructions()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Заполняем форму при открытии
  useEffect(() => {
    if (open && instruction) {
      setTitle(instruction.title)
      setContent(instruction.content)
    }
  }, [open, instruction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instruction || !title.trim()) return

    setIsSubmitting(true)
    try {
      await updateInstruction.mutateAsync({
        id: instruction.id,
        data: {
          title: title.trim(),
          content: instruction.is_folder === 1 ? undefined : content.trim(),
        },
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!instruction) return null

  const isFolder = instruction.is_folder === 1
  const Icon = isFolder ? Folder : FileText

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Редактирование
            <Icon className="w-4 h-4 text-muted-foreground" />
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Название</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFolder ? 'Название папки' : 'Название инструкции'}
              autoFocus
            />
          </div>

          {!isFolder && (
            <div className="space-y-2">
              <Label htmlFor="edit-content">Содержимое</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Текст инструкции..."
                rows={12}
                className="resize-none font-mono text-sm"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
