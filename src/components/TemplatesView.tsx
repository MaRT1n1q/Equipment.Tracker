import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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
import { Copy, Edit, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react'
import type { Template } from '../types/ipc'
import { Button } from './ui/button'
import { useTemplates } from '../hooks/useTemplates'
import { AddTemplateModal } from './AddTemplateModal'
import { EditTemplateModal } from './EditTemplateModal'
import { cn } from '../lib/utils'

interface SortableTemplateCardProps {
  template: Template
  onCopy: (template: Template) => void
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
  dateFormatter: Intl.DateTimeFormat
  disableActions: boolean
}

interface TemplateCardProps {
  template: Template
  onCopy: (template: Template) => void
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
  dateFormatter: Intl.DateTimeFormat
  disableActions: boolean
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

function TemplateCard({
  template,
  onCopy,
  onEdit,
  onDelete,
  dateFormatter,
  disableActions,
  isDragging = false,
  dragHandleProps,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/70 p-4 shadow-sm ring-1 ring-transparent transition-all duration-200',
        isDragging
          ? 'z-10 shadow-brand ring-primary/40 opacity-50'
          : 'hover:-translate-y-0.5 hover:shadow-brand hover:ring-primary/20'
      )}
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
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Шаблон
      </span>
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
  onCopy,
  onEdit,
  onDelete,
  dateFormatter,
  disableActions,
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
        onCopy={onCopy}
        onEdit={onEdit}
        onDelete={onDelete}
        dateFormatter={dateFormatter}
        disableActions={disableActions}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export function TemplatesView() {
  const {
    templates,
    isLoading,
    deleteTemplate,
    copyToClipboard,
    isDeleting,
    reorderTemplates,
    isReordering,
  } = useTemplates()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [orderedTemplates, setOrderedTemplates] = useState<Template[]>([])
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

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
        <div className="rounded-3xl border border-border/60 bg-card/90 px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Оборудование
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                Шаблоны
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Подготовленные ответы для типовых запросов — быстро копируйте и редактируйте.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 shadow-brand"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Создать шаблон
            </Button>
          </div>
        </div>

        <div>
          {isLoading ? (
            renderSkeletonCards()
          ) : hasTemplates ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 opacity-70" />
                  Перетащите карточки, чтобы поменять их порядок.
                </p>
                {isReordering && (
                  <span className="inline-flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохраняем порядок…
                  </span>
                )}
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={orderedTemplates.map((template) => template.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {orderedTemplates.map((template) => (
                      <SortableTemplateCard
                        key={template.id}
                        template={template}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        dateFormatter={dateFormatter}
                        disableActions={disableActions}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeTemplate ? (
                    <div className="rotate-3 scale-105 opacity-95">
                      <TemplateCard
                        template={activeTemplate}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        dateFormatter={dateFormatter}
                        disableActions={disableActions}
                        isDragging={true}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/70 px-8 py-16 text-center">
              <div className="mb-4 rounded-full bg-gradient-primary/20 p-4 text-primary">
                <Plus className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Ещё нет шаблонов</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Сохраните часто используемые ответы, чтобы иметь их под рукой и делиться ими в один
                клик.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Создать первый шаблон
              </Button>
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
    </>
  )
}
