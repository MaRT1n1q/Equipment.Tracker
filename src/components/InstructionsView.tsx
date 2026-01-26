import { useState, useCallback, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  FolderPlus,
  FilePlus,
  X,
  BookOpen,
} from 'lucide-react'
import { useInstructions } from '../hooks/useInstructions'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { PageHeader } from './PageHeader'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'
import { AddInstructionModal } from './AddInstructionModal'
import { EditInstructionModal } from './EditInstructionModal'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { InstructionTreeNode, Instruction } from '../types/ipc'
import { toast } from 'sonner'

interface TreeNodeProps {
  node: InstructionTreeNode
  level: number
  expandedIds: Set<number>
  selectedId: number | null
  onToggleExpand: (id: number) => void
  onSelect: (node: InstructionTreeNode) => void
  onEdit: (node: InstructionTreeNode) => void
  onDelete: (node: InstructionTreeNode) => void
  onDuplicate: (node: InstructionTreeNode) => void
  onAddChild: (parentId: number, isFolder: boolean) => void
  searchTerm: string
}

function highlightMatch(text: string, search: string): React.ReactNode {
  if (!search.trim()) return text

  const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

  return parts.map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function TreeNode({
  node,
  level,
  expandedIds,
  selectedId,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onAddChild,
  searchTerm,
}: TreeNodeProps) {
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const isFolder = node.is_folder === 1
  const hasChildren = node.children.length > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      onToggleExpand(node.id)
    }
  }

  const handleClick = () => {
    onSelect(node)
  }

  const handleDoubleClick = () => {
    if (isFolder) {
      onToggleExpand(node.id)
    } else {
      onSelect(node)
    }
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
          'hover:bg-muted/50',
          isSelected && 'bg-primary/10 hover:bg-primary/15'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Expand/Collapse arrow */}
        <button
          className={cn(
            'w-5 h-5 flex items-center justify-center rounded hover:bg-muted',
            !isFolder && 'invisible'
          )}
          onClick={handleToggle}
        >
          {isFolder &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ))}
        </button>

        {/* Icon */}
        <div className="w-5 h-5 flex items-center justify-center">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500" />
            )
          ) : (
            <FileText className="w-4 h-4 text-blue-500" />
          )}
        </div>

        {/* Title */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            isSelected ? 'text-foreground font-medium' : 'text-foreground/80'
          )}
        >
          {highlightMatch(node.title, searchTerm)}
        </span>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(node)}>
              <Copy className="w-4 h-4 mr-2" />
              Дублировать
            </DropdownMenuItem>
            {isFolder && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAddChild(node.id, true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Добавить папку
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(node.id, false)}>
                  <FilePlus className="w-4 h-4 mr-2" />
                  Добавить инструкцию
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(node)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isFolder && isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onAddChild={onAddChild}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Рекурсивный поиск в дереве
function filterTree(nodes: InstructionTreeNode[], searchTerm: string): InstructionTreeNode[] {
  if (!searchTerm.trim()) return nodes

  const search = searchTerm.toLowerCase()

  const filterNode = (node: InstructionTreeNode): InstructionTreeNode | null => {
    const matchesTitle = node.title.toLowerCase().includes(search)
    const matchesContent = node.content.toLowerCase().includes(search)

    // Рекурсивно фильтруем детей
    const filteredChildren = node.children
      .map(filterNode)
      .filter((n): n is InstructionTreeNode => n !== null)

    // Показываем узел если он соответствует поиску или у него есть соответствующие дети
    if (matchesTitle || matchesContent || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }

    return null
  }

  return nodes.map(filterNode).filter((n): n is InstructionTreeNode => n !== null)
}

// Собираем все ID которые нужно раскрыть при поиске
function getExpandedIdsForSearch(nodes: InstructionTreeNode[], searchTerm: string): Set<number> {
  const ids = new Set<number>()

  if (!searchTerm.trim()) return ids

  const search = searchTerm.toLowerCase()

  const collectIds = (node: InstructionTreeNode, ancestorIds: number[]) => {
    const matchesTitle = node.title.toLowerCase().includes(search)
    const matchesContent = node.content.toLowerCase().includes(search)
    const isFolder = node.is_folder === 1

    // Если дочерний элемент соответствует поиску, раскрываем всех предков
    if (matchesTitle || matchesContent) {
      for (const id of ancestorIds) {
        ids.add(id)
      }
    }

    // Рекурсивно обрабатываем детей
    const newAncestors = isFolder ? [...ancestorIds, node.id] : ancestorIds
    for (const child of node.children) {
      collectIds(child, newAncestors)
    }
  }

  for (const node of nodes) {
    collectIds(node, [])
  }

  return ids
}

// Находим узел по ID в дереве
function findNodeById(nodes: InstructionTreeNode[], id: number): InstructionTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

// Панель просмотра инструкции
interface InstructionPanelProps {
  instruction: InstructionTreeNode | null
  onEdit: () => void
}

function InstructionPanel({ instruction, onEdit }: InstructionPanelProps) {
  const handleCopyContent = async () => {
    if (!instruction) return
    try {
      await navigator.clipboard.writeText(instruction.content)
      toast.success('Скопировано в буфер обмена')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  if (!instruction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Выберите инструкцию</p>
        <p className="text-sm">Кликните на инструкцию в дереве слева для просмотра</p>
      </div>
    )
  }

  const isFolder = instruction.is_folder === 1

  if (isFolder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <Folder className="w-16 h-16 mb-4 text-amber-500 opacity-50" />
        <p className="text-lg font-medium">{instruction.title}</p>
        <p className="text-sm">
          {instruction.children.length > 0
            ? `${instruction.children.length} элементов`
            : 'Пустая папка'}
        </p>
      </div>
    )
  }

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instruction.updated_at))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              {instruction.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Обновлено: {formattedDate}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleCopyContent}>
              <Copy className="w-4 h-4 mr-2" />
              Копировать
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-6">
        <MarkdownRenderer content={instruction.content} />
      </div>
    </div>
  )
}

export function InstructionsView() {
  const { tree, isLoading, isError, error, refetch, deleteInstruction, duplicateInstruction } =
    useInstructions()

  const [searchInput, setSearchInput] = useState('')
  const searchTerm = useDebounce(searchInput, 300)

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Модальные окна
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addModalParentId, setAddModalParentId] = useState<number | null>(null)
  const [addModalIsFolder, setAddModalIsFolder] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null)

  // Фильтрация дерева по поиску
  const filteredTree = useMemo(() => filterTree(tree, searchTerm), [tree, searchTerm])

  // Автоматически раскрываем папки при поиске
  const searchExpandedIds = useMemo(
    () => getExpandedIdsForSearch(tree, searchTerm),
    [tree, searchTerm]
  )

  const effectiveExpandedIds = useMemo(() => {
    if (searchTerm.trim()) {
      return new Set([...expandedIds, ...searchExpandedIds])
    }
    return expandedIds
  }, [expandedIds, searchExpandedIds, searchTerm])

  // Находим выбранную инструкцию
  const selectedInstruction = useMemo(() => {
    if (selectedId === null) return null
    return findNodeById(tree, selectedId)
  }, [tree, selectedId])

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback((node: InstructionTreeNode) => {
    setSelectedId(node.id)
  }, [])

  const handleEdit = useCallback((node: InstructionTreeNode) => {
    setEditingInstruction(node)
    setIsEditModalOpen(true)
  }, [])

  const handleDelete = useCallback(
    (node: InstructionTreeNode) => {
      const isFolder = node.is_folder === 1
      const message = isFolder
        ? `Удалить папку "${node.title}" и всё её содержимое?`
        : `Удалить инструкцию "${node.title}"?`

      if (window.confirm(message)) {
        deleteInstruction.mutate(node.id)
        if (selectedId === node.id) {
          setSelectedId(null)
        }
      }
    },
    [deleteInstruction, selectedId]
  )

  const handleDuplicate = useCallback(
    (node: InstructionTreeNode) => {
      duplicateInstruction.mutate(node.id)
    },
    [duplicateInstruction]
  )

  const handleAddChild = useCallback((parentId: number, isFolder: boolean) => {
    setAddModalParentId(parentId)
    setAddModalIsFolder(isFolder)
    setIsAddModalOpen(true)
    // Раскрываем родительскую папку
    setExpandedIds((prev) => new Set([...prev, parentId]))
  }, [])

  const handleAddRoot = useCallback((isFolder: boolean) => {
    setAddModalParentId(null)
    setAddModalIsFolder(isFolder)
    setIsAddModalOpen(true)
  }, [])

  const handleClearSearch = () => {
    setSearchInput('')
  }

  const handleEditSelected = useCallback(() => {
    if (selectedInstruction) {
      handleEdit(selectedInstruction)
    }
  }, [selectedInstruction, handleEdit])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Инструкции" description="База знаний и документация" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Инструкции" description="База знаний и документация" />
        <ErrorState
          title="Ошибка загрузки"
          description={error instanceof Error ? error.message : 'Не удалось загрузить инструкции'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Инструкции"
        description="База знаний и документация"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Создать
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddRoot(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Новая папка
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddRoot(false)}>
                <FilePlus className="w-4 h-4 mr-2" />
                Новая инструкция
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Two-panel layout */}
      <div className="flex-1 flex gap-4 min-h-0 mt-4">
        {/* Left panel - Tree */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0 rounded-lg border border-border bg-card/50">
          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск..."
                className="pl-9 pr-9 h-9"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-2">
            {filteredTree.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={searchTerm ? 'Ничего не найдено' : 'Нет инструкций'}
                description={searchTerm ? 'Попробуйте изменить запрос' : 'Создайте первую папку'}
                actions={
                  !searchTerm ? (
                    <Button size="sm" onClick={() => handleAddRoot(true)}>
                      Создать
                    </Button>
                  ) : undefined
                }
                className="py-8"
              />
            ) : (
              <div className="space-y-0.5">
                {filteredTree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    expandedIds={effectiveExpandedIds}
                    selectedId={selectedId}
                    onToggleExpand={handleToggleExpand}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onAddChild={handleAddChild}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Content */}
        <div className="flex-1 min-w-0 rounded-lg border border-border bg-card/50 flex flex-col">
          <InstructionPanel instruction={selectedInstruction} onEdit={handleEditSelected} />
        </div>
      </div>

      {/* Modals */}
      <AddInstructionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        parentId={addModalParentId}
        isFolder={addModalIsFolder}
      />

      <EditInstructionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        instruction={editingInstruction}
      />
    </div>
  )
}
