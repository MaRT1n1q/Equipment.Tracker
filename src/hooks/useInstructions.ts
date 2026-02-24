import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInstructionData,
  UpdateInstructionData,
  MoveInstructionData,
  ReorderInstructionsData,
  Instruction,
  InstructionTreeNode,
} from '../types/ipc'
import { toast } from 'sonner'

// Проверка доступности API
const isApiAvailable = () => typeof window !== 'undefined' && !!window.electronAPI

// Построение древовидной структуры из плоского списка
function buildTree(instructions: Instruction[]): InstructionTreeNode[] {
  const map = new Map<number, InstructionTreeNode>()
  const roots: InstructionTreeNode[] = []

  // Создаём карту всех элементов
  for (const instruction of instructions) {
    map.set(instruction.id, { ...instruction, children: [] })
  }

  // Распределяем по родителям
  for (const instruction of instructions) {
    const node = map.get(instruction.id)!
    if (instruction.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(instruction.parent_id)
      if (parent) {
        parent.children.push(node)
      } else {
        // Если родитель не найден, добавляем в корень
        roots.push(node)
      }
    }
  }

  // Сортируем детей по sort_order
  const sortChildren = (nodes: InstructionTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildren(node.children)
      }
    }
  }

  sortChildren(roots)
  return roots
}

// Получить все ID из дерева (для раскрытия всех)
export function getAllTreeIds(tree: InstructionTreeNode[]): number[] {
  const ids: number[] = []
  const collect = (nodes: InstructionTreeNode[]) => {
    for (const node of nodes) {
      ids.push(node.id)
      if (node.children.length > 0) {
        collect(node.children)
      }
    }
  }
  collect(tree)
  return ids
}

// Получить все ID папок из дерева
export function getAllFolderIds(tree: InstructionTreeNode[]): number[] {
  const ids: number[] = []
  const collect = (nodes: InstructionTreeNode[]) => {
    for (const node of nodes) {
      if (node.is_folder === 1) {
        ids.push(node.id)
      }
      if (node.children.length > 0) {
        collect(node.children)
      }
    }
  }
  collect(tree)
  return ids
}

// Получить путь (хлебные крошки) к инструкции
export function getInstructionPath(
  tree: InstructionTreeNode[],
  targetId: number
): InstructionTreeNode[] {
  const path: InstructionTreeNode[] = []

  const findPath = (nodes: InstructionTreeNode[], currentPath: InstructionTreeNode[]): boolean => {
    for (const node of nodes) {
      const newPath = [...currentPath, node]
      if (node.id === targetId) {
        path.push(...newPath)
        return true
      }
      if (node.children.length > 0 && findPath(node.children, newPath)) {
        return true
      }
    }
    return false
  }

  findPath(tree, [])
  return path
}

export function useInstructions() {
  const queryClient = useQueryClient()

  const {
    data: flatData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['instructions'],
    queryFn: async () => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.getInstructions()
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось загрузить инструкции')
      }
      return response.data
    },
  })

  // Вычисляем древовидную структуру из плоских данных
  const treeData = flatData ? buildTree(flatData) : []

  const createInstruction = useMutation({
    mutationFn: async (data: CreateInstructionData) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.createInstruction(data)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось создать инструкцию')
      }
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFolder = response.data?.is_folder === 1
      toast.success(isFolder ? 'Папка создана' : 'Инструкция создана')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка создания')
    },
  })

  const updateInstruction = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateInstructionData }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.updateInstruction(id, data)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось обновить инструкцию')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      toast.success('Изменения сохранены')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка сохранения')
    },
  })

  const moveInstruction = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MoveInstructionData }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.moveInstruction(id, data)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось переместить')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка перемещения')
    },
  })

  const reorderInstructions = useMutation({
    mutationFn: async (data: ReorderInstructionsData) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.reorderInstructions(data)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось изменить порядок')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка изменения порядка')
    },
  })

  const deleteInstruction = useMutation({
    mutationFn: async (id: number) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.deleteInstruction(id)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось удалить')
      }
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFolder = response.data?.is_folder === 1
      toast.success(isFolder ? 'Папка удалена' : 'Инструкция удалена')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления')
    },
  })

  const duplicateInstruction = useMutation({
    mutationFn: async (id: number) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.duplicateInstruction(id)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось дублировать')
      }
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFolder = response.data?.is_folder === 1
      toast.success(isFolder ? 'Папка скопирована' : 'Инструкция скопирована')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка копирования')
    },
  })

  const toggleFavorite = useMutation({
    mutationFn: async (id: number) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.toggleInstructionFavorite(id)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось обновить избранное')
      }
      return response
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFavorite = response.data?.is_favorite === 1
      toast.success(isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления избранного')
    },
  })

  const updateTags = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.updateInstructionTags(id, tags)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось обновить теги')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      queryClient.invalidateQueries({ queryKey: ['instruction-tags'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления тегов')
    },
  })

  return {
    // Данные
    instructions: flatData ?? [],
    tree: treeData,
    isLoading,
    isError,
    error,

    // Методы
    refetch,
    createInstruction,
    updateInstruction,
    moveInstruction,
    reorderInstructions,
    deleteInstruction,
    duplicateInstruction,
    toggleFavorite,
    updateTags,
  }
}

// Хук для получения одной инструкции
export function useInstruction(id: number | null) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['instruction', id],
    queryFn: async () => {
      if (!isApiAvailable() || id === null) {
        return null
      }
      const response = await window.electronAPI.getInstruction(id)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось загрузить инструкцию')
      }
      return response.data
    },
    enabled: id !== null,
  })

  return {
    instruction: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  }
}

// Хук для получения всех тегов
export function useInstructionTags() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['instruction-tags'],
    queryFn: async () => {
      if (!isApiAvailable()) {
        return []
      }
      const response = await window.electronAPI.getAllInstructionTags()
      if (!response.success || !response.data) {
        return []
      }
      return response.data
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['instruction-tags'] })
  }

  return {
    tags: data ?? [],
    isLoading,
    refetch,
    invalidate,
  }
}

// Хук для работы с вложениями инструкции
export function useInstructionAttachments(instructionId: number | null) {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['instruction-attachments', instructionId],
    queryFn: async () => {
      if (!isApiAvailable() || instructionId === null) {
        return []
      }
      const response = await window.electronAPI.getInstructionAttachments(instructionId)
      if (!response.success || !response.data) {
        return []
      }
      return response.data
    },
    enabled: instructionId !== null,
  })

  const addAttachment = useMutation({
    mutationFn: async (filePath: string) => {
      if (!isApiAvailable() || instructionId === null) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.addInstructionAttachment(instructionId, filePath)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось добавить вложение')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-attachments', instructionId] })
      toast.success('Файл прикреплён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка добавления файла')
    },
  })

  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: number) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const response = await window.electronAPI.deleteInstructionAttachment(attachmentId)
      if (!response.success) {
        throw new Error(response.error || 'Не удалось удалить вложение')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-attachments', instructionId] })
      toast.success('Файл удалён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления файла')
    },
  })

  const openAttachment = async (attachmentId: number) => {
    if (!isApiAvailable()) return
    const response = await window.electronAPI.openInstructionAttachment(attachmentId)
    if (!response.success) {
      toast.error(response.error || 'Не удалось открыть файл')
    }
  }

  const getAttachmentPreview = useCallback(async (attachmentId: number) => {
    if (!isApiAvailable()) return null
    return window.electronAPI.getInstructionAttachmentPreview(attachmentId)
  }, [])

  const selectAndAddFile = async () => {
    if (!isApiAvailable()) return
    const response = await window.electronAPI.selectInstructionAttachmentFile()
    if (response.success && response.data) {
      addAttachment.mutate(response.data)
    }
  }

  return {
    attachments: data ?? [],
    isLoading,
    refetch,
    addAttachment,
    deleteAttachment,
    openAttachment,
    getAttachmentPreview,
    selectAndAddFile,
  }
}
