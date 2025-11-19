import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { useTemplates } from '../hooks/useTemplates'

interface AddTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTemplateModal({ open, onOpenChange }: AddTemplateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [contentError, setContentError] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { createTemplate, isCreating } = useTemplates()

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTitleError(false)
    setContentError(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      setTitleError(true)
      return
    }

    if (!trimmedContent) {
      setContentError(true)
      return
    }

    createTemplate(
      { title: trimmedTitle, content: trimmedContent },
      {
        onSuccess: () => {
          resetForm()
          onOpenChange(false)
        },
      }
    )
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Создать шаблон</DialogTitle>
          <DialogDescription>Создайте новый шаблон быстрого ответа</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-title">
                Название шаблона <span className="text-red-500">*</span>
              </Label>
              <Input
                id="template-title"
                ref={firstInputRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setTitleError(false)
                }}
                placeholder="Например: Стандартный ответ по заявке"
                className={titleError ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">
                Содержимое <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="template-content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setContentError(false)
                }}
                placeholder="Введите текст шаблона..."
                className={contentError ? 'border-red-500' : ''}
                rows={10}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isCreating}>
              Отмена
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
