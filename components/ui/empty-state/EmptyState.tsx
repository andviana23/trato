'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}) => {
  const baseClasses = 'text-center';
  
  const variantClasses = {
    default: 'py-12',
    minimal: 'py-8',
    card: 'p-8 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700',
  };
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {Icon && (
        <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
          <Icon className="h-full w-full" />
        </div>
      )}
      
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

// Componentes específicos para casos comuns
export const EmptyStateNoData: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ 
  title = 'Nenhum dado encontrado',
  description = 'Não há dados para exibir no momento.',
  action,
  className 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
};

export const EmptyStateNoResults: React.FC<{
  searchTerm?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ 
  searchTerm,
  action,
  className 
}) => {
  const title = searchTerm 
    ? `Nenhum resultado para "${searchTerm}"`
    : 'Nenhum resultado encontrado';
    
  const description = searchTerm
    ? 'Tente ajustar os termos de busca ou usar filtros diferentes.'
    : 'Não foi possível encontrar o que você está procurando.';
  
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
};

export const EmptyStateError: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ 
  title = 'Erro ao carregar dados',
  description = 'Ocorreu um problema ao carregar os dados. Tente novamente.',
  action,
  className 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
};

export const EmptyStateLoading: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({ 
  title = 'Carregando...',
  description = 'Aguarde enquanto carregamos os dados.',
  className 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      className={className}
    />
  );
};

export default EmptyState;
