import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInstructionData,
  UpdateInstructionData,
  MoveInstructionData,
  ReorderInstructionsData,
  Instruction,
  InstructionAttachment,
  InstructionTreeNode,
} from '../types/ipc'
import { toast } from 'sonner'
import {
  fetchInstructions,
  fetchInstruction,
  createInstruction,
  updateInstruction,
  moveInstruction,
  reorderInstructions,
  deleteInstruction,
  duplicateInstruction,
  toggleFavoriteInstruction,
  setInstructionTags,
  fetchAllInstructionTags,
  fetchInstructionAttachments,
  addInstructionAttachment,
  deleteInstructionAttachment,
  getInstructionAttachmentPreview,
  openInstructionAttachment,
  downloadInstructionAttachment,
} from '../lib/api/instructions'

// Стабильные ссылки на пустые массивы — не вызывают лишних ре-рендеров
const EMPTY_STRINGS: string[] = []
const EMPTY_ATTACHMENTS: InstructionAttachment[] = []

// Построение древовидной структуры из плоского списка
function buildTree(instructions: Instruction[]): InstructionTreeNode[] {
  const map = new Map<number, InstructionTreeNode>()
  const roots: InstructionTreeNode[] = []

  for (const instruction of instructions) {
    map.set(instruction.id, { ...instruction, children: [] })
  }

  for (const instruction of instructions) {
    const node = map.get(instruction.id)!
    if (instruction.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(instruction.parent_id)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }

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
    queryFn: fetchInstructions,
  })

  const treeData = flatData ? buildTree(flatData) : []

  const createMutation = useMutation({
    mutationFn: async (data: CreateInstructionData) => {
      return createInstruction(data)
    },
    onSuccess: (instruction) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFolder = instruction?.is_folder === 1
      toast.success(isFolder ? 'Папка создана' : 'Инструкция создана')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка создания')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateInstructionData }) => {
      return updateInstruction(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      toast.success('Изменения сохранены')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка сохранения')
    },
  })

  const moveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MoveInstructionData }) => {
      await moveInstruction(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка перемещения')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (data: ReorderInstructionsData) => {
      await reorderInstructions(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка изменения порядка')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: number; isFolder: boolean }) => {
      await deleteInstruction(id)
    },
    onSuccess: (_, { isFolder }) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      toast.success(isFolder ? 'Папка удалена' : 'Инструкция удалена')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления')
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      return duplicateInstruction(id)
    },
    onSuccess: (instruction) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFolder = instruction?.is_folder === 1
      toast.success(isFolder ? 'Папка скопирована' : 'Инструкция скопирована')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка копирования')
    },
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      return toggleFavoriteInstruction(id)
    },
    onSuccess: (instruction) => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] })
      const isFavorite = instruction?.is_favorite === 1
      toast.success(isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления избранного')
    },
  })

  const updateTagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      await setInstructionTags(id, tags)
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
    instructions: flatData ?? [],
    tree: treeData,
    isLoading,
    isError,
    error,
    refetch,
    createInstruction: createMutation,
    updateInstruction: updateMutation,
    moveInstruction: moveMutation,
    reorderInstructions: reorderMutation,
    deleteInstruction: deleteMutation,
    duplicateInstruction: duplicateMutation,
    toggleFavorite: toggleFavoriteMutation,
    updateTags: updateTagsMutation,
  }
}

export function useInstruction(id: number | null) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['instruction', id],
    queryFn: async () => {
      if (id === null) return null
      return fetchInstruction(id)
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

export function useInstructionTags() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['instruction-tags'],
    queryFn: fetchAllInstructionTags,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['instruction-tags'] })
  }

  return {
    tags: data ?? EMPTY_STRINGS,
    isLoading,
    refetch,
    invalidate,
  }
}

export function useInstructionAttachments(instructionId: number | null) {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['instruction-attachments', instructionId],
    queryFn: async () => {
      if (instructionId === null) return []
      return fetchInstructionAttachments(instructionId)
    },
    enabled: instructionId !== null,
  })

  const addAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (instructionId === null) throw new Error('ID инструкции не указан')
      return addInstructionAttachment(instructionId, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction-attachments', instructionId] })
      toast.success('Файл прикреплён')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка добавления файла')
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      await deleteInstructionAttachment(attachmentId)
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
    try {
      await openInstructionAttachment(attachmentId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось открыть файл')
    }
  }

  const getAttachmentPreview = useCallback(
    async (attachmentId: number, originalName: string, mimeType: string) => {
      return getInstructionAttachmentPreview(attachmentId, originalName, mimeType)
    },
    []
  )

  /**
   * Открывает браузерный диалог выбора файла и прикрепляет выбранный файл.
   * В веб-режиме только, отличается от Electron-диалога.
   */
  const selectAndAddFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        addAttachmentMutation.mutate(file)
      }
    }
    input.click()
  }

  return {
    attachments: data ?? EMPTY_ATTACHMENTS,
    isLoading,
    refetch,
    addAttachment: addAttachmentMutation,
    deleteAttachment: deleteAttachmentMutation,
    openAttachment,
    getAttachmentPreview,
    selectAndAddFile,
    downloadAttachment: downloadInstructionAttachment,
  }
}
