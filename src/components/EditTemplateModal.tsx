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
import type { Template } from '../types/ipc'

interface EditTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
}

export function EditTemplateModal({ open, onOpenChange, template }: EditTemplateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [contentError, setContentError] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { updateTemplate, isUpdating } = useTemplates()

  useEffect(() => {
    if (open && template) {
      setTitle(template.title)
      setContent(template.content)
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open, template])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTitleError(false)
    setContentError(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!template) return

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

    updateTemplate(
      { id: template.id, data: { title: trimmedTitle, content: trimmedContent } },
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
          <DialogTitle>Редактировать шаблон</DialogTitle>
          <DialogDescription>Измените название или содержимое шаблона</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-template-title">
                Название шаблона <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-template-title"
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
              <Label htmlFor="edit-template-content">
                Содержимое <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-template-content"
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
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isUpdating}>
              Отмена
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
