import { Skeleton } from './ui/skeleton'

export function InstructionsSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* PageHeader Skeleton */}
      <div className="flex items-start justify-between gap-4 px-0 py-4 border-b border-border/40 mb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex min-h-0 gap-2">
        {/* Left panel - Tree */}
        <div
          className="flex-shrink-0 flex flex-col min-h-0 rounded-lg border border-border bg-card/50"
          style={{ width: 320 }}
        >
          {/* Search + controls */}
          <div className="flex-shrink-0 p-3 border-b border-border space-y-2">
            <Skeleton className="h-9 w-full rounded-md" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          </div>

          {/* Tree items */}
          <div className="flex-1 overflow-hidden p-2 space-y-0.5">
            {/* Root folder */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            {/* Children of folder 1 */}
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-md"
              style={{ paddingLeft: '1.5rem' }}
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-md"
              style={{ paddingLeft: '1.5rem' }}
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-md"
              style={{ paddingLeft: '1.5rem' }}
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>

            {/* Root folder 2 */}
            <div className="mt-1 flex items-center gap-2 px-2 py-1.5 rounded-md">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-md"
              style={{ paddingLeft: '1.5rem' }}
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-md"
              style={{ paddingLeft: '1.5rem' }}
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>

            {/* Root item (no folder) */}
            <div className="mt-1 flex items-center gap-2 px-2 py-1.5 rounded-md">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
          </div>
        </div>

        {/* Resize divider placeholder */}
        <div className="w-1 mx-0" />

        {/* Right panel - Content */}
        <div className="flex-1 min-w-0 rounded-lg border border-border bg-card/50 flex flex-col p-5 space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>

          {/* Title + actions */}
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="h-8 w-72 rounded" />
            <div className="flex gap-1.5">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </div>

          {/* Content lines */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <div className="pt-2 space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="pt-2 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
