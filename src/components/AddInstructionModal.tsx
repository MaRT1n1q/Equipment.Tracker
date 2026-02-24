import { useState, useEffect } from 'react'
import { FolderPlus, FilePlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { FormattedTextEditor } from './FormattedTextEditor'
import { useInstructions } from '../hooks/useInstructions'

interface AddInstructionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentId: number | null
  isFolder: boolean
}

export function AddInstructionModal({
  open,
  onOpenChange,
  parentId,
  isFolder,
}: AddInstructionModalProps) {
  const { createInstruction } = useInstructions()

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

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      setTitle('')
      setContent('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await createInstruction.mutateAsync({
        parent_id: parentId,
        title: title.trim(),
        content: isFolder ? '' : content.trim(),
        is_folder: isFolder,
        tags: [],
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const Icon = isFolder ? FolderPlus : FilePlus
  const titleText = isFolder ? 'Новая папка' : 'Новая инструкция'

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
              <Icon className="w-5 h-5" />
              {titleText}
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
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFolder ? 'Название папки' : 'Название инструкции'}
              autoFocus
            />
          </div>

          {!isFolder && (
            <div className="space-y-2">
              <Label htmlFor="content">Содержимое</Label>
              <FormattedTextEditor
                id="content"
                value={content}
                onChange={setContent}
                placeholder="Текст инструкции..."
                rows={8}
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
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
