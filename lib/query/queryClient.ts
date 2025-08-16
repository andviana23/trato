/**
 * Configuração do Cliente React Query
 * 
 * Este arquivo configura o cliente React Query com:
 * - Configurações de cache otimizadas
 * - Retry automático para falhas
 * - Stale time configurável
 * - Garbage collection automático
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados ficam "frescos" (não precisam ser refetched)
      staleTime: 5 * 60 * 1000, // 5 minutos
      
      // Tempo que os dados ficam em cache
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      
      // Número de tentativas em caso de falha
      retry: (failureCount, error) => {
        // Não tentar novamente para erros 4xx (erros do cliente)
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500) {
            return false;
          }
        }
        
        // Máximo de 3 tentativas para erros 5xx
        return failureCount < 3;
      },
      
      // Delay entre tentativas (exponencial backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch automático quando a janela ganha foco
      refetchOnWindowFocus: true,
      
      // Refetch automático quando reconecta à internet
      refetchOnReconnect: true,
      
      // Refetch automático quando sai do modo offline
      refetchOnMount: true,
      
      // Não refetch automaticamente em background
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Número de tentativas para mutações
      retry: 1,
      
      // Retry delay para mutações
      retryDelay: 1000,
    },
  },
});

/**
 * Configurações específicas para diferentes tipos de dados
 */
export const queryKeys = {
  // Metas
  metas: {
    all: ['metas'] as const,
    lists: () => [...queryKeys.metas.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.metas.lists(), filters] as const,
    details: () => [...queryKeys.metas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.metas.details(), id] as const,
    progress: (id: string) => [...queryKeys.metas.all, 'progress', id] as const,
    bonus: (id: string) => [...queryKeys.metas.all, 'bonus', id] as const,
  },
  
  // Agendamentos
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    conflicts: () => [...queryKeys.appointments.all, 'conflicts'] as const,
  },
  
  // Clientes
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    search: (query: string) => [...queryKeys.clients.all, 'search', query] as const,
  },
  
  // Fila
  queue: {
    all: ['queue'] as const,
    lists: () => [...queryKeys.queue.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.queue.lists(), filters] as const,
    stats: () => [...queryKeys.queue.all, 'stats'] as const,
    position: (id: string) => [...queryKeys.queue.all, 'position', id] as const,
  },
  
  // Pagamentos
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    reports: () => [...queryKeys.payments.all, 'reports'] as const,
  },
  
  // Usuários
  users: {
    all: ['users'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
    permissions: () => [...queryKeys.users.all, 'permissions'] as const,
  },
  
  // Unidades
  units: {
    all: ['units'] as const,
    lists: () => [...queryKeys.units.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.units.lists(), filters] as const,
    details: () => [...queryKeys.units.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.units.details(), id] as const,
  },
} as const;

/**
 * Funções utilitárias para invalidação de cache
 */
export const invalidateQueries = {
  // Invalidar todas as metas
  metas: () => queryClient.invalidateQueries({ queryKey: queryKeys.metas.all }),
  
  // Invalidar uma meta específica
  meta: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.metas.detail(id) }),
  
  // Invalidar todas as listas de metas
  metasList: () => queryClient.invalidateQueries({ queryKey: queryKeys.metas.lists() }),
  
  // Invalidar todos os agendamentos
  appointments: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  
  // Invalidar um agendamento específico
  appointment: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(id) }),
  
  // Invalidar todas as listas de agendamentos
  appointmentsList: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() }),
  
  // Invalidar todos os clientes
  clients: () => queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
  
  // Invalidar um cliente específico
  client: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) }),
  
  // Invalidar todas as listas de clientes
  clientsList: () => queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() }),
  
  // Invalidar toda a fila
  queue: () => queryClient.invalidateQueries({ queryKey: queryKeys.queue.all }),
  
  // Invalidar estatísticas da fila
  queueStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.queue.stats() }),
  
  // Invalidar todos os pagamentos
  payments: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
  
  // Invalidar um pagamento específico
  payment: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(id) }),
  
  // Invalidar todas as listas de pagamentos
  paymentsList: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() }),
} as const;
