import { useState, useEffect } from 'react'
import { Edit, Folder, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { FormattedTextEditor } from './FormattedTextEditor'
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
  const [modalWidth, setModalWidth] = useState(1100)
  const [modalHeight, setModalHeight] = useState(760)

  const clampWidth = (value: number) => Math.min(1600, Math.max(720, value))
  const clampHeight = (value: number) => Math.min(980, Math.max(520, value))

  const resizeModal = (widthDelta: number, heightDelta: number) => {
    setModalWidth((current) => clampWidth(current + widthDelta))
    setModalHeight((current) => clampHeight(current + heightDelta))
  }

  const resetModalSize = () => {
    setModalWidth(1100)
    setModalHeight(760)
  }

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
      <DialogContent
        className={
          isFolder ? 'sm:max-w-lg' : 'sm:max-w-none resize overflow-auto min-h-[520px] max-h-[92vh]'
        }
        style={
          isFolder
            ? undefined
            : {
                width: `${modalWidth}px`,
                height: `${modalHeight}px`,
                maxWidth: '96vw',
                maxHeight: '92vh',
              }
        }
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Редактирование
              <Icon className="w-4 h-4 text-muted-foreground" />
            </DialogTitle>

            {!isFolder && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resizeModal(-120, -80)}
                >
                  Меньше
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetModalSize}>
                  Сброс
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resizeModal(120, 80)}
                >
                  Больше
                </Button>
              </div>
            )}
          </div>
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
              <FormattedTextEditor
                id="edit-content"
                value={content}
                onChange={setContent}
                placeholder="Текст инструкции..."
                rows={12}
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
