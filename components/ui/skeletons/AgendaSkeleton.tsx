import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AgendaSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar Skeleton */}
      <div className="flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>

      {/* Agenda Grid Skeleton */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full rounded-2xl border bg-background">
          {/* Header Skeleton */}
          <div className="grid border-b p-3" style={{ gridTemplateColumns: '64px repeat(3, minmax(240px,1fr))' }}>
            <Skeleton className="h-4 w-16" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 border-l pl-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          {/* Time Slots Skeleton */}
          <div className="relative" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '64px repeat(3, minmax(240px,1fr))' }}>
              {/* Time Column */}
              <div className="border-r p-2">
                {Array.from({ length: 13 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-end pr-3" style={{ height: '60px' }}>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>

              {/* Resource Columns */}
              {Array.from({ length: 3 }).map((_, colIndex) => (
                <div key={colIndex} className="border-l relative">
                  {/* Event Placeholders */}
                  {Array.from({ length: 4 }).map((_, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="absolute left-2 right-2 rounded-lg border"
                      style={{
                        top: `${(eventIndex * 120) + 60}px`,
                        height: '60px',
                      }}
                    >
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="grid border-t p-2" style={{ gridTemplateColumns: '64px repeat(3, minmax(240px,1fr))' }}>
            <div />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-l pl-3 text-center">
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgendaMobileSkeleton() {
  return (
    <div className="h-screen bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 py-4 space-y-6">
        {Array.from({ length: 3 }).map((_, resourceIndex) => (
          <div key={resourceIndex} className="mb-6">
            {/* Resource Header Skeleton */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>

            {/* Events Skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, eventIndex) => (
                <Card key={eventIndex} className="mb-3">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Time Slots Skeleton */}
            <div className="mt-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, slotIndex) => (
                  <Skeleton key={slotIndex} className="h-8 w-full" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation Indicator Skeleton */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-6 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
      </div>
    </div>
  );
}
