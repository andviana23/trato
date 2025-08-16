import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-[264px] bg-[#0f1115] text-white border-r border-white/20 overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-4 w-full">
        {/* Logo Skeleton */}
        <div className="flex items-center gap-3 px-2 py-1">
          <Skeleton className="w-7 h-7 rounded-full bg-white/30" />
          <Skeleton className="h-5 w-16 bg-white/30" />
        </div>

        {/* Search Skeleton */}
        <div className="relative">
          <Skeleton className="h-9 w-full bg-white/20" />
        </div>

        {/* Navigation Items Skeleton */}
        <div className="flex flex-col gap-1 mt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-md">
              <Skeleton className="w-4 h-4 bg-white/30" />
              <Skeleton className="h-4 w-20 bg-white/30" />
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="mt-auto space-y-3">
          <Skeleton className="h-px w-full bg-white/20" />
          <div className="flex flex-col gap-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-md">
                <Skeleton className="w-4 h-4 bg-white/30" />
                <Skeleton className="h-4 w-24 bg-white/30" />
              </div>
            ))}
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full bg-white/30" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20 bg-white/30" />
                <Skeleton className="h-3 w-24 bg-white/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background border-border">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-80" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export function MobileNavigationSkeleton() {
  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-[#0f1115] text-white border-r border-white/20 z-50 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full bg-white/30" />
            <Skeleton className="h-5 w-16 bg-white/30" />
          </div>
          <Skeleton className="h-9 w-9 rounded bg-white/30" />
        </div>

        {/* Unit Info Skeleton */}
        <div className="px-4 py-3 bg-white/10 border-b border-white/20">
          <Skeleton className="h-3 w-20 bg-white/30 mb-1" />
          <Skeleton className="h-4 w-32 bg-white/30" />
        </div>

        {/* Navigation Skeleton */}
        <div className="flex-1 px-4 py-4 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg">
              <Skeleton className="w-5 h-5 bg-white/30" />
              <Skeleton className="h-4 w-24 bg-white/30" />
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="border-t border-white/20 p-4 space-y-4">
          <div className="space-y-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <Skeleton className="w-4 h-4 bg-white/30" />
                <Skeleton className="h-4 w-24 bg-white/30" />
              </div>
            ))}
          </div>
          
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-white/30" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-20 bg-white/30" />
                <Skeleton className="h-3 w-24 bg-white/30" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Skeleton className="w-4 h-4 bg-red-400/30" />
            <Skeleton className="h-4 w-16 bg-red-400/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BreadcrumbSkeleton() {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-24" />
    </nav>
  );
}
