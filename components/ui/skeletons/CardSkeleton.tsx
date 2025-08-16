import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
  showHeader?: boolean;
  showImage?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({ 
  showHeader = true, 
  showImage = false, 
  lines = 3,
  className = "" 
}: CardSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-3/4" />
          {lines > 1 && <Skeleton className="h-4 w-1/2" />}
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {showImage && <Skeleton className="h-32 w-full" />}
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function CardGridSkeleton({ 
  cards = 6, 
  columns = 3,
  className = "" 
}: { 
  cards?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-4 ${className}`}>
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader className="text-center">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-full mt-6" />
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
