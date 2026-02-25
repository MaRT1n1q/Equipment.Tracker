import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchTemplateFiles,
  uploadTemplateFiles,
  downloadTemplateFile,
  openTemplateFile,
  getTemplateFilePreview,
  deleteTemplateFile,
  fetchTemplateFileCounts,
} from '../lib/api/templateFiles'
import type { TemplateFile, TemplateFilePreview } from '../types/ipc'

// Стабильная ссылка — не вызывает лишних ре-рендеров при data === undefined
const EMPTY_FILES: TemplateFile[] = []

export function useTemplateFiles(templateId: number | null) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templateFiles', templateId],
    queryFn: async (): Promise<TemplateFile[]> => {
      if (!templateId) return []
      return fetchTemplateFiles(templateId)
    },
    enabled: !!templateId,
  })

  /** Загрузить файлы через File[] (из <input type="file"> или drag-and-drop) */
  const uploadFiles = useMutation({
    mutationFn: async ({ tid, files }: { tid: number; files: File[] }) => {
      return uploadTemplateFiles(tid, files)
    },
    onSuccess: (files) => {
      if (files.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['templateFiles', templateId] })
        queryClient.invalidateQueries({ queryKey: ['templateFileCounts'] })
        toast.success(`Загружено файлов: ${files.length}`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка загрузки файлов')
    },
  })

  const downloadFile = useMutation({
    mutationFn: async ({ fileId, originalName }: { fileId: number; originalName: string }) => {
      await downloadTemplateFile(fileId, originalName)
    },
    onSuccess: () => {
      toast.success('Файл сохранён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка скачивания файла')
    },
  })

  const openFile = useMutation({
    mutationFn: async (fileId: number) => {
      await openTemplateFile(fileId)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка открытия файла')
    },
  })

  const getFilePreview = useMutation({
    mutationFn: async ({
      fileId,
      originalName,
      mimeType,
    }: {
      fileId: number
      originalName: string
      mimeType: string
    }): Promise<TemplateFilePreview> => {
      return getTemplateFilePreview(fileId, originalName, mimeType)
    },
  })

  const deleteFile = useMutation({
    mutationFn: async (fileId: number) => {
      await deleteTemplateFile(fileId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateFiles', templateId] })
      queryClient.invalidateQueries({ queryKey: ['templateFileCounts'] })
      toast.success('Файл удалён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления файла')
    },
  })

  return {
    files: data ?? EMPTY_FILES,
    isLoading,
    isError,
    refetch,
    uploadFiles,
    isUploading: uploadFiles.isPending,
    downloadFile,
    isDownloading: downloadFile.isPending,
    openFile,
    isOpening: openFile.isPending,
    getFilePreview,
    isPreviewLoading: getFilePreview.isPending,
    deleteFile,
    isDeleting: deleteFile.isPending,
  }
}

export function useTemplateFileCounts() {
  const { data, isLoading } = useQuery({
    queryKey: ['templateFileCounts'],
    queryFn: async (): Promise<Record<number, number>> => {
      return fetchTemplateFileCounts()
    },
  })

  return {
    fileCounts: data || {},
    isLoading,
  }
}
