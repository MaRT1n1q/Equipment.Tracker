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
