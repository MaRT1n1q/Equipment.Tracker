import { useEffect, useRef, useState } from 'react'
import { Loader2, Paperclip } from 'lucide-react'
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
import { uploadTemplateFiles } from '../lib/api/templateFiles'
import { toast } from 'sonner'

interface AddTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTemplateModal({ open, onOpenChange }: AddTemplateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [contentError, setContentError] = useState(false)
  const [addFilesAfterCreate, setAddFilesAfterCreate] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(null)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    setAddFilesAfterCreate(false)
  }

  const handleSubmit = async (e: React.FormEvent, withFiles = false) => {
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

    setAddFilesAfterCreate(withFiles)

    createTemplate(
      { title: trimmedTitle, content: trimmedContent },
      {
        onSuccess: async (response) => {
          if (withFiles && response?.id) {
            setPendingTemplateId(response.id)
            fileInputRef.current?.click()
            return
          }
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

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = pendingTemplateId
    const fileList = e.target.files
    if (!id || !fileList?.length) {
      setPendingTemplateId(null)
      resetForm()
      onOpenChange(false)
      return
    }
    setIsUploadingFiles(true)
    try {
      const uploaded = await uploadTemplateFiles(id, Array.from(fileList))
      if (uploaded.length > 0) toast.success(`Загружено файлов: ${uploaded.length}`)
    } catch {
      toast.error('Ошибка загрузки файлов')
    } finally {
      setIsUploadingFiles(false)
      setPendingTemplateId(null)
      resetForm()
      onOpenChange(false)
    }
  }

  const isSubmitting = isCreating || isUploadingFiles

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Создать шаблон</DialogTitle>
            <DialogDescription>Создайте новый шаблон быстрого ответа</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, false)}>
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, true)}
                className="gap-2"
              >
                {isUploadingFiles ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка файлов...
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4" />
                    Создать с файлами
                  </>
                )}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isCreating && !addFilesAfterCreate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Создание...
                  </>
                ) : (
                  'Создать'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
