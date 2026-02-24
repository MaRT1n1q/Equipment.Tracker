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
      <DialogContent className={isFolder ? 'sm:max-w-lg' : 'sm:max-w-5xl'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {titleText}
          </DialogTitle>
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
