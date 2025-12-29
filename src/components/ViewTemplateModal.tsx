import { useCallback, useState } from 'react'
import { Check, Copy, Download, ExternalLink, File, Loader2, Paperclip } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { useTemplateFiles } from '../hooks/useTemplateFiles'
import type { Template, TemplateFile } from '../types/ipc'
import { cn } from '../lib/utils'
import { toast } from 'sonner'

interface ViewTemplateModalProps {
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

interface ViewFileItemProps {
  file: TemplateFile
  onDownload: (fileId: number) => void
  onOpen: (fileId: number) => void
}

function ViewFileItem({ file, onDownload, onOpen }: ViewFileItemProps) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
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
      </div>
    </div>
  )
}

export function ViewTemplateModal({ open, onOpenChange, template }: ViewTemplateModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  const {
    files,
    isLoading: isLoadingFiles,
    downloadFile,
    openFile,
  } = useTemplateFiles(template?.id || null)

  const handleCopy = useCallback(async () => {
    if (!template) return

    try {
      await navigator.clipboard.writeText(template.content)
      setIsCopied(true)
      toast.success('Скопировано в буфер обмена')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }, [template])

  const handleDownloadFile = (fileId: number) => {
    downloadFile.mutate(fileId)
  }

  const handleOpenFile = (fileId: number) => {
    openFile.mutate(fileId)
  }

  const handleDownloadAll = async () => {
    for (const file of files) {
      downloadFile.mutate(file.id)
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{template.title}</DialogTitle>
          <DialogDescription>Просмотр шаблона и прикреплённых файлов</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Содержимое шаблона */}
          <div className="space-y-2">
            <div className="relative rounded-xl border border-border/60 bg-muted/20 p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {template.content}
              </pre>
            </div>
          </div>

          {/* Секция файлов */}
          {(files.length > 0 || isLoadingFiles) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  Прикреплённые файлы ({files.length})
                </span>
                {files.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Скачать все
                  </Button>
                )}
              </div>

              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Загрузка файлов...
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {files.map((file) => (
                    <ViewFileItem
                      key={file.id}
                      file={file}
                      onDownload={handleDownloadFile}
                      onOpen={handleOpenFile}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Пустое состояние файлов */}
          {!isLoadingFiles && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 text-center rounded-lg border border-dashed border-border/40 bg-muted/10">
              <File className="h-6 w-6 text-muted-foreground/40 mb-1" />
              <p className="text-xs text-muted-foreground/60">Нет прикреплённых файлов</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            className={cn('gap-2 transition-all', isCopied && 'bg-green-600 hover:bg-green-600')}
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Копировать текст
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
