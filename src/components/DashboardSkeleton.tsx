import { Skeleton } from './ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header card with search */}
      <div className="rounded-3xl border border-border/60 bg-card/90 px-6 py-6 shadow-sm">
        {/* PageHeader skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        {/* Search bar */}
        <div className="mt-5">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Calendar section */}
      <div className="rounded-2xl border border-border/60 bg-card/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
        {/* Calendar grid */}
        <div className="p-4 space-y-3">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded" />
            ))}
          </div>
          {/* Calendar rows */}
          {[...Array(5)].map((_, row) => (
            <div key={row} className="grid grid-cols-7 gap-1">
              {[...Array(7)].map((_, col) => (
                <Skeleton key={col} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Requests Stats Section */}
      <div className="surface-section space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-9 w-12" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Employee Exit Stats Section */}
      <div className="surface-section space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-44" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-9 w-12" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
