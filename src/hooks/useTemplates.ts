import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateTemplateData, Template, UpdateTemplateData } from '../types/ipc'
import { toast } from 'sonner'
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  reorderTemplates,
} from '../lib/api/templates'

// Стабильная ссылка — не создаёт новый [] при каждом рендере
const EMPTY_TEMPLATES: Template[] = []

export function useTemplates() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      return createTemplate(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Шаблон создан')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка создания шаблона')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTemplateData }) => {
      await updateTemplate(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Шаблон обновлён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления шаблона')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteTemplate(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Шаблон удалён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления шаблона')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (order: number[]) => {
      await reorderTemplates(order)
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
    templates: data ?? EMPTY_TEMPLATES,
    isLoading,
    isError,
    error,
    refetch,
    createTemplate: createMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    reorderTemplates: reorderMutation.mutateAsync,
    copyToClipboard,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  }
}
