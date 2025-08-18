'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: '',
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

// Componentes específicos para casos comuns
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 1, className, lastLineWidth = '60%' }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height="1rem"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  lines?: number;
}> = ({ 
  className, 
  showImage = true, 
  showTitle = true, 
  showDescription = true, 
  lines = 3 
}) => {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {showImage && (
        <Skeleton
          variant="rectangular"
          height="200px"
          width="100%"
          className="mb-4"
        />
      )}
      
      {showTitle && (
        <Skeleton
          variant="text"
          height="1.5rem"
          width="80%"
        />
      )}
      
      {showDescription && (
        <SkeletonText lines={lines} />
      )}
    </div>
  );
};

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4, 
  className, 
  showHeader = true 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {showHeader && (
        <div className="flex space-x-2">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              variant="text"
              height="1.5rem"
              width={`${100 / columns}%`}
            />
          ))}
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              height="1rem"
              width={`${100 / columns}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
    />
  );
};

export const SkeletonButton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid';
  className?: string;
}> = ({ size = 'md', variant = 'solid', className }) => {
  const sizeClasses = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
    lg: 'h-12 px-6',
  };
  
  const variantClasses = {
    outline: 'border border-neutral-300 dark:border-neutral-600',
    solid: '',
  };
  
  return (
    <Skeleton
      variant="rectangular"
      className={cn(
        'rounded-md',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
};

export default Skeleton;
