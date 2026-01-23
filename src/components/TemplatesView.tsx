import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, Edit, GripVertical, Loader2, Paperclip, Plus, Search, Trash2, X } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { Input } from './ui/input'
import type { Template } from '../types/ipc'
import { Button } from './ui/button'
import { useTemplates } from '../hooks/useTemplates'
import { useTemplateFileCounts } from '../hooks/useTemplateFiles'
import { AddTemplateModal } from './AddTemplateModal'
import { EditTemplateModal } from './EditTemplateModal'
import { ViewTemplateModal } from './ViewTemplateModal'
import { cn } from '../lib/utils'
import { PageHeader } from './PageHeader'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

interface SortableTemplateCardProps {
  template: Template
  onView: (template: Template) => void
  onCopy: (template: Template) => void
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
  dateFormatter: Intl.DateTimeFormat
  disableActions: boolean
  fileCount: number
}

interface TemplateCardProps {
  template: Template
  onView: (template: Template) => void
  onCopy: (template: Template) => void
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
  dateFormatter: Intl.DateTimeFormat
  disableActions: boolean
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  fileCount: number
}

function TemplateCard({
  template,
  onView,
  onCopy,
  onEdit,
  onDelete,
  dateFormatter,
  disableActions,
  isDragging = false,
  dragHandleProps,
  fileCount,
}: TemplateCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Не открывать просмотр если клик по кнопкам или drag handle
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    onView(template)
  }

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/70 p-4 shadow-sm ring-1 ring-transparent transition-all duration-200 cursor-pointer',
        isDragging
          ? 'z-10 shadow-brand ring-primary/40 opacity-50'
          : 'hover:-translate-y-0.5 hover:shadow-brand hover:ring-primary/20'
      )}
      onClick={handleCardClick}
    >
      {dragHandleProps && (
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          aria-label="Перетащить"
          {...dragHandleProps}
          disabled={disableActions}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Шаблон
        </span>
        {fileCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Paperclip className="h-3 w-3" />
            {fileCount}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground line-clamp-2">{template.title}</h3>
        <p className="text-xs text-muted-foreground">
          Обновлено {dateFormatter.format(new Date(template.updated_at))}
        </p>
      </div>

      <div className="relative mt-3 flex-1 rounded-xl bg-muted/10 p-3 text-sm text-muted-foreground">
        <p className="max-h-28 overflow-hidden whitespace-pre-wrap pr-1 leading-relaxed">
          {template.content}
        </p>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 gap-2 bg-gradient-primary text-primary-foreground shadow-brand"
          onClick={() => onCopy(template)}
          disabled={disableActions}
        >
          <Copy className="h-4 w-4" />
          Копировать
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9"
          onClick={() => onEdit(template)}
          disabled={disableActions}
          title="Редактировать"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 text-red-600 hover:text-red-600"
          onClick={() => onDelete(template)}
          disabled={disableActions}
          title="Удалить"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function SortableTemplateCard({
  template,
  onView,
  onCopy,
  onEdit,
  onDelete,
  dateFormatter,
  disableActions,
  fileCount,
}: SortableTemplateCardProps) {
  const { isDragging, setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: template.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TemplateCard
        template={template}
        onView={onView}
        onCopy={onCopy}
        onEdit={onEdit}
        onDelete={onDelete}
        dateFormatter={dateFormatter}
        disableActions={disableActions}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        fileCount={fileCount}
      />
    </div>
  )
}

export function TemplatesView() {
  const {
    templates,
    isLoading,
    isError,
    error,
    refetch,
    deleteTemplate,
    copyToClipboard,
    isDeleting,
    reorderTemplates,
    isReordering,
  } = useTemplates()
  const { fileCounts } = useTemplateFileCounts()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null)
  const [orderedTemplates, setOrderedTemplates] = useState<Template[]>([])
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Глобальный поиск Ctrl+F
  useKeyboardShortcut({ key: 'f', ctrlKey: true }, () => {
    searchInputRef.current?.focus()
  })

  // Фильтрация шаблонов по поисковому запросу
  const filteredTemplates = useMemo(() => {
    if (!debouncedSearch.trim()) return orderedTemplates
    const query = debouncedSearch.toLowerCase()
    return orderedTemplates.filter(
      (template) =>
        template.title.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query)
    )
  }, [orderedTemplates, debouncedSearch])

  useEffect(() => {
    setOrderedTemplates([...templates].sort((a, b) => a.sort_order - b.sort_order))
  }, [templates])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    []
  )

  const handleView = (template: Template) => {
    setViewingTemplate(template)
    setIsViewModalOpen(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setIsEditModalOpen(true)
  }

  const handleDelete = (template: Template) => {
    if (window.confirm(`Удалить шаблон "${template.title}"?`)) {
      deleteTemplate(template.id)
    }
  }

  const handleCopy = (template: Template) => {
    copyToClipboard(template.content)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const template = orderedTemplates.find((t) => t.id === active.id)
    setActiveTemplate(template || null)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTemplate(null)

    if (!over || active.id === over.id) {
      return
    }

    const activeId = Number(active.id)
    const overId = Number(over.id)
    const oldIndex = orderedTemplates.findIndex((item) => item.id === activeId)
    const newIndex = orderedTemplates.findIndex((item) => item.id === overId)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const nextOrder = arrayMove(orderedTemplates, oldIndex, newIndex)
    setOrderedTemplates(nextOrder)

    try {
      await reorderTemplates(nextOrder.map((template) => template.id))
    } catch {
      setOrderedTemplates(templates)
    }
  }

  const handleDragCancel = () => {
    setActiveTemplate(null)
  }

  const renderSkeletonCards = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`template-skeleton-${index}`}
          className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-3 w-20 rounded-full bg-muted" />
            <div className="h-6 w-3/4 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 flex-1 rounded bg-muted" />
              <div className="h-9 w-10 rounded bg-muted" />
              <div className="h-9 w-10 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const hasTemplates = orderedTemplates.length > 0
  const disableActions = isDeleting || isReordering

  return (
    <>
      <div className="space-y-6">
        {/* Шапка с поиском */}
        <div className="rounded-3xl border border-border/60 bg-card/90 px-6 py-6 shadow-sm">
          <PageHeader
            className="border-0 bg-transparent px-0 py-0 shadow-none"
            title="Шаблоны"
            description="Подготовленные ответы для типовых запросов — быстро копируйте и редактируйте."
            actions={
              <Button
                size="lg"
                className="gap-2 shadow-brand"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Создать шаблон
              </Button>
            }
          />

          {/* Поиск */}
          {!isLoading && !isError && orderedTemplates.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию и содержимому..."
                  className="h-12 rounded-xl bg-muted/40 pl-9 pr-10 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus:border-[hsl(var(--primary)/0.35)] focus:bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {debouncedSearch.trim()
                    ? `Найдено: ${filteredTemplates.length} из ${orderedTemplates.length}`
                    : `Всего шаблонов: ${orderedTemplates.length}`}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted">F</kbd>
                  <span className="ml-1">— поиск</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          {isLoading ? (
            renderSkeletonCards()
          ) : isError ? (
            <ErrorState
              title="Не удалось загрузить шаблоны"
              description={
                error instanceof Error
                  ? error.message
                  : 'Повторите попытку. Если ошибка сохраняется, проверьте журнал приложения.'
              }
              onRetry={() => refetch()}
              retryLabel="Обновить данные"
            />
          ) : hasTemplates ? (
            <div className="space-y-4">
              {filteredTemplates.length === 0 && debouncedSearch.trim() ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/70 px-6 py-12 text-center">
                  <Search className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-foreground">Ничего не найдено</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    По запросу «{debouncedSearch}» шаблоны не найдены
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-sm text-primary hover:underline"
                  >
                    Сбросить поиск
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 opacity-70" />
                      {debouncedSearch.trim()
                        ? 'Порядок карточек можно изменить, сбросив поиск.'
                        : 'Перетащите карточки, чтобы поменять их порядок.'}
                    </p>
                    {isReordering && (
                      <span className="inline-flex items-center gap-2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Сохраняем порядок…
                      </span>
                    )}
                  </div>

                  <DndContext
                    sensors={debouncedSearch.trim() ? [] : sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext
                      items={filteredTemplates.map((template) => template.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredTemplates.map((template) => (
                          <SortableTemplateCard
                            key={template.id}
                            template={template}
                            onView={handleView}
                            onCopy={handleCopy}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            dateFormatter={dateFormatter}
                            disableActions={disableActions}
                            fileCount={fileCounts[template.id] || 0}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                      {activeTemplate ? (
                        <div className="rotate-3 scale-105 opacity-95">
                          <TemplateCard
                            template={activeTemplate}
                            onView={handleView}
                            onCopy={handleCopy}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            dateFormatter={dateFormatter}
                            disableActions={disableActions}
                            isDragging={true}
                            fileCount={fileCounts[activeTemplate.id] || 0}
                          />
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/60 bg-card/70">
              <EmptyState
                icon={Plus}
                title="Ещё нет шаблонов"
                description="Сохраните часто используемые ответы, чтобы иметь их под рукой и делиться ими в один клик."
                actions={
                  <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Создать первый шаблон
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      <AddTemplateModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <EditTemplateModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        template={editingTemplate}
      />
      <ViewTemplateModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        template={viewingTemplate}
      />
    </>
  )
}
