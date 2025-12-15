import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateTemplateData, UpdateTemplateData } from '../types/ipc'
import { toast } from 'sonner'

export function useTemplates() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await window.electronAPI.getTemplates()
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось загрузить шаблоны')
      }
      return response.data
    },
  })

  const createTemplate = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const response = await window.electronAPI.createTemplate(data)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось создать шаблон')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Шаблон создан')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка создания шаблона')
    },
  })

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTemplateData }) => {
      const response = await window.electronAPI.updateTemplate(id, data)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось обновить шаблон')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Шаблон обновлён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления шаблона')
    },
  })

  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      const response = await window.electronAPI.deleteTemplate(id)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось удалить шаблон')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Шаблон удалён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления шаблона')
    },
  })

  const reorderTemplates = useMutation({
    mutationFn: async (order: number[]) => {
      const response = await window.electronAPI.reorderTemplates(order)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось обновить порядок шаблонов')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка изменения порядка')
    },
  })

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Скопировано в буфер обмена')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  return {
    templates: data || [],
    isLoading,
    isError,
    error,
    refetch,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    reorderTemplates: reorderTemplates.mutateAsync,
    copyToClipboard,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
    isReordering: reorderTemplates.isPending,
  }
}
