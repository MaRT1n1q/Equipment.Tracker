import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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
  Star,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  ChevronLast,
  Paperclip,
  Tag,
  ExternalLink,
  File,
  Image as ImageIcon,
} from 'lucide-react'
import {
  useInstructions,
  useInstructionAttachments,
  getAllFolderIds,
  getInstructionPath,
} from '../hooks/useInstructions'
import { useDebounce } from '../hooks/useDebounce'
import { usePersistentState } from '../hooks/usePersistentState'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { PageHeader } from './PageHeader'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'
import { InstructionsSkeleton } from './InstructionsSkeleton'
import { AddInstructionModal } from './AddInstructionModal'
import { EditInstructionModal } from './EditInstructionModal'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { InstructionTreeNode, Instruction, InstructionAttachment } from '../types/ipc'
import { toast } from 'sonner'

// Минимальная и максимальная ширина левой панели
const MIN_PANEL_WIDTH = 200
const MAX_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = 320

interface TreeNodeProps {
  node: InstructionTreeNode
  level: number
  expandedIds: Set<number>
  selectedId: number | null
  draggedId: number | null
  dropTargetId: number | null
  onToggleExpand: (id: number) => void
  onSelect: (node: InstructionTreeNode) => void
  onEdit: (node: InstructionTreeNode) => void
  onDelete: (node: InstructionTreeNode) => void
  onDuplicate: (node: InstructionTreeNode) => void
  onAddChild: (parentId: number, isFolder: boolean) => void
  onToggleFavorite: (node: InstructionTreeNode) => void
  onDragStart: (id: number) => void
  onDragOver: (id: number) => void
  onDragEnd: () => void
  onDrop: (targetId: number) => void
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
  draggedId,
  dropTargetId,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onAddChild,
  onToggleFavorite,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  searchTerm,
}: TreeNodeProps) {
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const isFolder = node.is_folder === 1
  const hasChildren = node.children.length > 0
  const isFavorite = node.is_favorite === 1
  const isDragging = draggedId === node.id
  const isDropTarget = dropTargetId === node.id && isFolder && draggedId !== node.id

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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.id.toString())
    onDragStart(node.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (isFolder && draggedId !== node.id) {
      e.dataTransfer.dropEffect = 'move'
      onDragOver(node.id)
    }
  }

  const handleDragLeave = () => {
    // handled by parent
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFolder && draggedId !== node.id) {
      onDrop(node.id)
    }
  }

  const handleDragEnd = () => {
    onDragEnd()
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
          'hover:bg-muted/50',
          isSelected && 'bg-primary/10 hover:bg-primary/15',
          isDragging && 'opacity-50',
          isDropTarget && 'ring-2 ring-primary ring-inset bg-primary/5'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        data-tree-node
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        {/* Drag handle */}
        <div className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-50 cursor-grab">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

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
        <div className="w-5 h-5 flex items-center justify-center relative">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500" />
            )
          ) : (
            <FileText className="w-4 h-4 text-blue-500" />
          )}
          {isFavorite && (
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 absolute -top-0.5 -right-0.5" />
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

        {/* Tags indicator */}
        {node.tags.length > 0 && (
          <div className="flex items-center gap-0.5">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{node.tags.length}</span>
          </div>
        )}

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
            <DropdownMenuItem onClick={() => onToggleFavorite(node)}>
              <Star
                className={cn('w-4 h-4 mr-2', isFavorite && 'fill-yellow-500 text-yellow-500')}
              />
              {isFavorite ? 'Убрать из избранного' : 'В избранное'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
              draggedId={draggedId}
              dropTargetId={dropTargetId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onAddChild={onAddChild}
              onToggleFavorite={onToggleFavorite}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
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
  breadcrumbs: InstructionTreeNode[]
  searchTerm: string
  onEdit: () => void
  onNavigate: (id: number) => void
  onToggleFavorite: () => void
}

function InstructionPanel({
  instruction,
  breadcrumbs,
  searchTerm,
  onEdit,
  onNavigate,
  onToggleFavorite,
}: InstructionPanelProps) {
  const { attachments, selectAndAddFile, deleteAttachment, openAttachment, getAttachmentPreview } =
    useInstructionAttachments(instruction?.id ?? null)
  const attachmentPreviewUrlsRef = useRef<Record<number, string>>({})
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<Record<number, string>>({})
  const [previewAttachment, setPreviewAttachment] = useState<InstructionAttachment | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  const isImageAttachment = (attachment: InstructionAttachment) =>
    (attachment.mime_type ?? '').startsWith('image/')

  useEffect(() => {
    attachmentPreviewUrlsRef.current = {}
    setAttachmentPreviewUrls({})
    setPreviewAttachment(null)
    setPreviewImageUrl('')
  }, [instruction?.id])

  useEffect(() => {
    let isCancelled = false

    const loadImagePreviews = async () => {
      const imageAttachments = attachments.filter(
        (attachment) =>
          isImageAttachment(attachment) && !attachmentPreviewUrlsRef.current[attachment.id]
      )

      await Promise.all(
        imageAttachments.map(async (attachment) => {
          attachmentPreviewUrlsRef.current[attachment.id] = 'loading'
          try {
            const preview = await getAttachmentPreview(
              attachment.id,
              attachment.original_name,
              attachment.mime_type
            )
            if (!isCancelled) {
              const dataUrl = preview.data_url
              attachmentPreviewUrlsRef.current[attachment.id] = dataUrl
              setAttachmentPreviewUrls((prev) => ({ ...prev, [attachment.id]: dataUrl }))
            } else {
              delete attachmentPreviewUrlsRef.current[attachment.id]
            }
          } catch {
            delete attachmentPreviewUrlsRef.current[attachment.id]
          }
        })
      )
    }

    if (attachments.length > 0) {
      loadImagePreviews()
    }

    return () => {
      isCancelled = true
    }
  }, [attachments, getAttachmentPreview])

  const handleOpenImagePreview = async (attachment: InstructionAttachment) => {
    if (!isImageAttachment(attachment)) {
      await openAttachment(attachment.id)
      return
    }

    let dataUrl = attachmentPreviewUrls[attachment.id]

    if (!dataUrl) {
      try {
        const preview = await getAttachmentPreview(
          attachment.id,
          attachment.original_name,
          attachment.mime_type
        )
        dataUrl = preview.data_url
        setAttachmentPreviewUrls((prev) => ({ ...prev, [attachment.id]: dataUrl }))
      } catch {
        toast.error('Не удалось загрузить предпросмотр')
        return
      }
    }

    setPreviewAttachment(attachment)
    setPreviewImageUrl(dataUrl)
  }

  const handleCopyContent = async () => {
    if (!instruction) return
    try {
      await navigator.clipboard.writeText(instruction.content)
      toast.success('Скопировано в буфер обмена')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  const formatFileSize = (bytes: number | undefined | null) => {
    if (bytes == null || isNaN(bytes) || bytes < 0) return '—'
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
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
  const isFavorite = instruction.is_favorite === 1

  if (isFolder) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex-shrink-0 px-6 py-2 border-b border-border flex items-center gap-1 text-sm overflow-x-auto">
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && <ChevronLast className="w-3 h-3 text-muted-foreground rotate-180" />}
                <button
                  className="text-muted-foreground hover:text-foreground truncate max-w-[150px]"
                  onClick={() => onNavigate(crumb.id)}
                >
                  {crumb.title}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <Folder className="w-16 h-16 mb-4 text-amber-500 opacity-50" />
          <p className="text-lg font-medium">{instruction.title}</p>
          <p className="text-sm">
            {instruction.children.length > 0
              ? `${instruction.children.length} элементов`
              : 'Пустая папка'}
          </p>
        </div>
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
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2 border-b border-border flex items-center gap-1 text-sm overflow-x-auto">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
              {idx > 0 && <ChevronLast className="w-3 h-3 text-muted-foreground rotate-180" />}
              <button
                className={cn(
                  'truncate max-w-[150px]',
                  idx === breadcrumbs.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onNavigate(crumb.id)}
              >
                {crumb.title}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              {instruction.title}
              {isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Обновлено: {formattedDate}</p>

            {/* Tags */}
            {instruction.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {instruction.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onToggleFavorite} title="Избранное">
              <Star className={cn('w-4 h-4', isFavorite && 'fill-yellow-500 text-yellow-500')} />
            </Button>
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
        <MarkdownRenderer
          content={instruction.content}
          searchTerm={searchTerm}
          onInternalLinkClick={onNavigate}
        />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Вложения ({attachments.length})
            </h3>
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  {isImageAttachment(att) ? (
                    <button
                      type="button"
                      onClick={() => handleOpenImagePreview(att)}
                      className="w-12 h-12 rounded border border-border overflow-hidden bg-muted/30 flex items-center justify-center flex-shrink-0"
                      title="Открыть предпросмотр"
                    >
                      {attachmentPreviewUrls[att.id] ? (
                        <img
                          src={attachmentPreviewUrls[att.id]}
                          alt={att.original_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.original_name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</p>
                  </div>
                  {isImageAttachment(att) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenImagePreview(att)}
                      title="Предпросмотр"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openAttachment(att.id)}
                    title="Открыть"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm('Удалить вложение?')) {
                        deleteAttachment.mutate(att.id)
                      }
                    }}
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add attachment button */}
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={selectAndAddFile}>
            <Paperclip className="w-4 h-4 mr-2" />
            Прикрепить файл
          </Button>
        </div>
      </div>

      <Dialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null)
            setPreviewImageUrl('')
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {previewAttachment?.original_name || 'Предпросмотр изображения'}
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/20 p-3 max-h-[72vh] overflow-auto flex items-center justify-center">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={previewAttachment?.original_name || 'Изображение'}
                className="max-w-full max-h-[68vh] object-contain"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Предпросмотр недоступен</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function InstructionsView() {
  const {
    tree,
    isLoading,
    isError,
    error,
    refetch,
    deleteInstruction,
    duplicateInstruction,
    toggleFavorite,
    moveInstruction,
  } = useInstructions()

  const [searchInput, setSearchInput] = useState('')
  const searchTerm = useDebounce(searchInput, 300)

  // Сохранение состояния в localStorage
  const [expandedIds, setExpandedIds] = usePersistentState<number[]>(
    'equipment-tracker:instructions-expanded',
    []
  )
  const [selectedId, setSelectedId] = usePersistentState<number | null>(
    'equipment-tracker:instructions-selected',
    null
  )
  const [panelWidth, setPanelWidth] = usePersistentState<number>(
    'equipment-tracker:instructions-panel-width',
    DEFAULT_PANEL_WIDTH
  )

  // Drag & Drop state
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)
  const [isRootDropTarget, setIsRootDropTarget] = useState(false)

  // Resizing state
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Модальные окна
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addModalParentId, setAddModalParentId] = useState<number | null>(null)
  const [addModalIsFolder, setAddModalIsFolder] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null)

  // Конвертация в Set для работы с TreeNode
  const expandedIdsSet = useMemo(() => new Set(expandedIds), [expandedIds])

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
    return expandedIdsSet
  }, [expandedIds, expandedIdsSet, searchExpandedIds, searchTerm])

  // Находим выбранную инструкцию
  const selectedInstruction = useMemo(() => {
    if (selectedId === null) return null
    return findNodeById(tree, selectedId)
  }, [tree, selectedId])

  // Вычисляем хлебные крошки
  const breadcrumbs = useMemo(() => {
    if (selectedId === null) return []
    return getInstructionPath(tree, selectedId)
  }, [tree, selectedId])

  // Обработка ресайза панели
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      setPanelWidth(Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setPanelWidth])

  const handleToggleExpand = useCallback(
    (id: number) => {
      setExpandedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((i) => i !== id)
        }
        return [...prev, id]
      })
    },
    [setExpandedIds]
  )

  const handleSelect = useCallback(
    (node: InstructionTreeNode) => {
      setSelectedId(node.id)
    },
    [setSelectedId]
  )

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
        deleteInstruction.mutate({ id: node.id, isFolder: node.is_folder === 1 })
        if (selectedId === node.id) {
          setSelectedId(null)
        }
      }
    },
    [deleteInstruction, selectedId, setSelectedId]
  )

  const handleDuplicate = useCallback(
    (node: InstructionTreeNode) => {
      duplicateInstruction.mutate(node.id)
    },
    [duplicateInstruction]
  )

  const handleAddChild = useCallback(
    (parentId: number, isFolder: boolean) => {
      setAddModalParentId(parentId)
      setAddModalIsFolder(isFolder)
      setIsAddModalOpen(true)
      // Раскрываем родительскую папку
      setExpandedIds((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]))
    },
    [setExpandedIds]
  )

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

  // Drag & Drop handlers
  const handleDragStart = useCallback((id: number) => {
    setDraggedId(id)
  }, [])

  const handleDragOver = useCallback((id: number) => {
    setDropTargetId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDropTargetId(null)
    setIsRootDropTarget(false)
  }, [])

  const handleDrop = useCallback(
    (targetId: number) => {
      if (draggedId === null || draggedId === targetId) return

      const draggedNode = findNodeById(tree, draggedId)
      if (!draggedNode) return

      // Перемещаем инструкцию в новую папку (в конец)
      moveInstruction.mutate({
        id: draggedId,
        data: { parent_id: targetId, sort_order: 999 },
      })

      // Раскрываем целевую папку
      setExpandedIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]))

      setDraggedId(null)
      setDropTargetId(null)
      setIsRootDropTarget(false)
    },
    [draggedId, tree, moveInstruction, setExpandedIds]
  )

  const handleDropToRoot = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsRootDropTarget(false)
      if (draggedId === null) return

      const draggedNode = findNodeById(tree, draggedId)
      if (!draggedNode) return

      // Если элемент уже в корне — ничего не делать
      if (draggedNode.parent_id === null || draggedNode.parent_id === undefined) {
        setDraggedId(null)
        setDropTargetId(null)
        return
      }

      moveInstruction.mutate({
        id: draggedId,
        data: { parent_id: null, sort_order: 999 },
      })

      setDraggedId(null)
      setDropTargetId(null)
    },
    [draggedId, tree, moveInstruction]
  )

  const handleDragOverRoot = useCallback(
    (e: React.DragEvent) => {
      // Разрешаем drop только если тащим что-то и цель не является другим узлом
      if (draggedId === null) return
      // Если курсор над конкретным TreeNode — тот сам обработает
      const target = e.target as HTMLElement
      const isOverNode = target.closest('[data-tree-node]')
      if (isOverNode) {
        setIsRootDropTarget(false)
        return
      }
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsRootDropTarget(true)
      setDropTargetId(null)
    },
    [draggedId]
  )

  const handleDragLeaveRoot = useCallback((e: React.DragEvent) => {
    // Сбрасываем только если выходим за пределы контейнера
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsRootDropTarget(false)
    }
  }, [])

  // Toggle favorite handler
  const handleToggleFavorite = useCallback(
    (node: InstructionTreeNode) => {
      toggleFavorite.mutate(node.id)
    },
    [toggleFavorite]
  )

  // Navigate to instruction (for breadcrumbs and internal links)
  const handleNavigate = useCallback(
    (id: number) => {
      setSelectedId(id)
      // Раскрываем путь до выбранной инструкции
      const path = getInstructionPath(tree, id)
      const idsToExpand = path.slice(0, -1).map((n) => n.id)
      setExpandedIds((prev) => [...new Set([...prev, ...idsToExpand])])
    },
    [tree, setSelectedId, setExpandedIds]
  )

  // Collapse all folders
  const handleCollapseAll = useCallback(() => {
    setExpandedIds([])
  }, [setExpandedIds])

  // Expand all folders
  const handleExpandAll = useCallback(() => {
    const allFolderIds = getAllFolderIds(tree)
    setExpandedIds(allFolderIds)
  }, [tree, setExpandedIds])

  if (isLoading) {
    return <InstructionsSkeleton />
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
    <div className="flex flex-col h-full" ref={containerRef}>
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
      <div className="flex-1 flex min-h-0 mt-4">
        {/* Left panel - Tree */}
        <div
          className="flex-shrink-0 flex flex-col min-h-0 rounded-lg border border-border bg-card/50"
          style={{ width: panelWidth }}
        >
          {/* Search and controls */}
          <div className="flex-shrink-0 p-3 border-b border-border space-y-2">
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
            {/* Collapse/Expand buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCollapseAll}
                title="Свернуть все"
              >
                <ChevronsDownUp className="w-3.5 h-3.5 mr-1" />
                Свернуть
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleExpandAll}
                title="Развернуть все"
              >
                <ChevronsUpDown className="w-3.5 h-3.5 mr-1" />
                Развернуть
              </Button>
            </div>
          </div>

          {/* Tree */}
          <div
            className={cn(
              'flex-1 min-h-0 overflow-auto custom-scrollbar p-2',
              isRootDropTarget && 'ring-2 ring-primary ring-inset rounded-lg bg-primary/5'
            )}
            onDragOver={handleDragOverRoot}
            onDragLeave={handleDragLeaveRoot}
            onDrop={handleDropToRoot}
          >
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
                    draggedId={draggedId}
                    dropTargetId={dropTargetId}
                    onToggleExpand={handleToggleExpand}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onAddChild={handleAddChild}
                    onToggleFavorite={handleToggleFavorite}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div
          className={cn(
            'w-1 mx-1 cursor-col-resize hover:bg-primary/30 transition-colors rounded',
            isResizing && 'bg-primary/50'
          )}
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Right panel - Content */}
        <div className="flex-1 min-w-0 rounded-lg border border-border bg-card/50 flex flex-col">
          <InstructionPanel
            instruction={selectedInstruction}
            breadcrumbs={breadcrumbs}
            searchTerm={searchTerm}
            onEdit={handleEditSelected}
            onNavigate={handleNavigate}
            onToggleFavorite={() => {
              if (selectedInstruction) {
                handleToggleFavorite(selectedInstruction)
              }
            }}
          />
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
