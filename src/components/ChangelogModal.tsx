import { Gift, Rocket, Sparkles, Wrench, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import type { ChangelogEntry, ChangelogSection } from '../changelog'
import { cn } from '../lib/utils'

interface ChangelogModalProps {
  open: boolean
  onClose: () => void
  changes: ChangelogEntry[]
}

const sectionConfig: Record<
  ChangelogSection['type'],
  { label: string; icon: typeof Sparkles; colorClass: string }
> = {
  new: {
    label: 'Новое',
    icon: Sparkles,
    colorClass: 'text-emerald-500 bg-emerald-500/10',
  },
  improved: {
    label: 'Улучшено',
    icon: Rocket,
    colorClass: 'text-blue-500 bg-blue-500/10',
  },
  fixed: {
    label: 'Исправлено',
    icon: Wrench,
    colorClass: 'text-amber-500 bg-amber-500/10',
  },
  removed: {
    label: 'Удалено',
    icon: Trash2,
    colorClass: 'text-red-500 bg-red-500/10',
  },
}

function ChangelogSection({ section }: { section: ChangelogSection }) {
  const config = sectionConfig[section.type]
  const Icon = config.icon

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          config.colorClass
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </div>
      <ul className="space-y-1.5 pl-1">
        {section.items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChangelogVersionBlock({ entry }: { entry: ChangelogEntry }) {
  const formattedDate = new Date(entry.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {entry.title || `Версия ${entry.version}`}
          </h3>
          <p className="text-xs text-muted-foreground">
            v{entry.version} • {formattedDate}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {entry.sections.map((section, index) => (
          <ChangelogSection key={index} section={section} />
        ))}
      </div>
    </div>
  )
}

export function ChangelogModal({ open, onClose, changes }: ChangelogModalProps) {
  if (changes.length === 0) return null

  const hasMultipleVersions = changes.length > 1

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {hasMultipleVersions ? 'Что нового?' : `Обновление ${changes[0].version}`}
              </DialogTitle>
              <DialogDescription>
                {hasMultipleVersions
                  ? 'Вот что изменилось с момента вашего последнего визита'
                  : 'Приложение обновлено! Вот что нового'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 pr-2 -mr-2">
          <div className="space-y-6">
            {changes.map((entry) => (
              <ChangelogVersionBlock key={entry.version} entry={entry} />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border/50">
          <Button onClick={onClose} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Отлично, понятно!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
