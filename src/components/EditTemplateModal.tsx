import { useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, File, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
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
import { useTemplateFiles } from '../hooks/useTemplateFiles'
import type { Template, TemplateFile } from '../types/ipc'
import { cn } from '../lib/utils'

interface EditTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📄'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦'
  if (mimeType.includes('text')) return '📝'
  return '📎'
}

interface FileItemProps {
  file: TemplateFile
  onDownload: (fileId: number) => void
  onOpen: (fileId: number) => void
  onDelete: (fileId: number) => void
  isDeleting: boolean
}

function FileItem({ file, onDownload, onOpen, onDelete, isDeleting }: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 transition-colors',
        isHovered && 'bg-muted/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-xl">{getFileIcon(file.mime_type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate" title={file.original_name}>
          {file.original_name}
        </p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onOpen(file.id)}
          title="Открыть"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDownload(file.id)}
          title="Скачать"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-600"
          onClick={() => onDelete(file.id)}
          disabled={isDeleting}
          title="Удалить"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function EditTemplateModal({ open, onOpenChange, template }: EditTemplateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [contentError, setContentError] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { updateTemplate, isUpdating } = useTemplates()
  const {
    files,
    isLoading: isLoadingFiles,
    uploadFiles,
    isUploading,
    downloadFile,
    openFile,
    deleteFile,
    isDeleting,
  } = useTemplateFiles(template?.id || null)

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

  const handleUploadFiles = () => {
    if (template) {
      uploadFiles.mutate(template.id)
    }
  }

  const handleDownloadFile = (fileId: number) => {
    downloadFile.mutate(fileId)
  }

  const handleOpenFile = (fileId: number) => {
    openFile.mutate(fileId)
  }

  const handleDeleteFile = (fileId: number) => {
    if (window.confirm('Удалить этот файл?')) {
      deleteFile.mutate(fileId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать шаблон</DialogTitle>
          <DialogDescription>Измените название, содержимое или файлы шаблона</DialogDescription>
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
                rows={8}
              />
            </div>

            {/* Секция файлов */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Прикреплённые файлы
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadFiles}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Добавить файлы
                </Button>
              </div>

              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Загрузка файлов...
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg border border-dashed border-border/60 bg-muted/20">
                  <File className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Нет прикреплённых файлов</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Добавьте любые файлы к этому шаблону
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onDownload={handleDownloadFile}
                      onOpen={handleOpenFile}
                      onDelete={handleDeleteFile}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              )}
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
