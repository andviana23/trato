'use client';

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: ReactNode;
  props?: Record<string, any>;
}

export function LazyComponent({ 
  component, 
  fallback = <DefaultFallback />, 
  props = {} 
}: LazyComponentProps) {
  const LazyComponent = React.lazy(component);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

function DefaultFallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// Componentes específicos para lazy loading
export const LazyQueueDashboard = React.lazy(() => import('@/components/QueueDashboard'));
export const LazyBarberQueueTest = React.lazy(() => import('@/components/BarberQueueTest'));
export const LazyComissaoBarbeiroCard = React.lazy(() => import('@/components/ComissaoBarbeiroCard'));
export const LazyComissaoResumoCard = React.lazy(() => import('@/components/ComissaoResumoCard'));
export const LazyBonificacaoMetas = React.lazy(() => import('@/components/BonificacaoMetas'));

// Wrapper para componentes lazy com Suspense
export function withSuspense<T extends object>(
  Component: React.LazyExoticComponent<ComponentType<T>>,
  fallback?: ReactNode
) {
  return function SuspenseWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
