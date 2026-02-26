import { Skeleton } from './ui/skeleton'

export function RequestsSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* SearchAndFilters Skeleton */}
      <div className="surface-section space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-12 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-6" />
                </th>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-36" />
                </th>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-28" />
                </th>
                <th className="text-left p-4">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="text-center p-4">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </th>
                <th className="text-center p-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="p-4">
                    <Skeleton className="h-4 w-6" />
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-36" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}
