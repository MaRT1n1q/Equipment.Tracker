import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useTemplateFiles(templateId: number | null) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templateFiles', templateId],
    queryFn: async () => {
      if (!templateId) return []
      const response = await window.electronAPI.getTemplateFiles(templateId)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось загрузить файлы')
      }
      return response.data
    },
    enabled: !!templateId,
  })

  const uploadFiles = useMutation({
    mutationFn: async (tid: number) => {
      const response = await window.electronAPI.uploadTemplateFilesDialog(tid)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось загрузить файлы')
      }
      return response.data || []
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

  const uploadFilesByPaths = useMutation({
    mutationFn: async ({ tid, paths }: { tid: number; paths: string[] }) => {
      const response = await window.electronAPI.uploadTemplateFilesByPaths(tid, paths)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось загрузить файлы')
      }
      return response.data || []
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
    mutationFn: async (fileId: number) => {
      const response = await window.electronAPI.downloadTemplateFile(fileId)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось скачать файл')
      }
      return response.data
    },
    onSuccess: (data) => {
      if (data?.path) {
        toast.success('Файл сохранён')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка скачивания файла')
    },
  })

  const openFile = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await window.electronAPI.openTemplateFile(fileId)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось открыть файл')
      }
      return response
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка открытия файла')
    },
  })

  const deleteFile = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await window.electronAPI.deleteTemplateFile(fileId)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось удалить файл')
      }
      return response.data
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
    files: data || [],
    isLoading,
    isError,
    refetch,
    uploadFiles,
    uploadFilesByPaths,
    isUploading: uploadFiles.isPending || uploadFilesByPaths.isPending,
    downloadFile,
    isDownloading: downloadFile.isPending,
    openFile,
    isOpening: openFile.isPending,
    deleteFile,
    isDeleting: deleteFile.isPending,
  }
}

export function useTemplateFileCounts() {
  const { data, isLoading } = useQuery({
    queryKey: ['templateFileCounts'],
    queryFn: async () => {
      const response = await window.electronAPI.getTemplateFileCounts()
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось получить данные')
      }
      return response.data
    },
  })

  return {
    fileCounts: data || {},
    isLoading,
  }
}
