import { Skeleton } from './ui/skeleton'

export function TemplatesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in duration-300">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <div className="rounded-xl bg-muted/10 p-3 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
