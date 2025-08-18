/**
 * Hooks Customizados para Fila de Atendimento
 * 
 * Este arquivo fornece hooks React Query para operações com a fila,
 * incluindo cache automático, sincronização e gerenciamento de estado.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query/queryClient';
import { 
  getQueueStatus,
  addToQueue,
  attendNext,
  removeFromQueue,
  updateQueuePosition,
  reorganizeQueue,
  type QueueItemWithDetails,
  type AddToQueueInput,
  type CallNextFromQueueInput,
  type RemoveFromQueueInput,
  type UpdateQueuePositionInput,
} from '@/app/actions/queue';

/**
 * Hook para buscar status da fila
 */
export function useQueue(filters: {
  unidadeId?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: queryKeys.queue.list(filters),
    queryFn: () => getQueueStatus(filters.unidadeId!),
    staleTime: 10 * 1000, // 10 segundos
    gcTime: 1 * 60 * 1000, // 1 minuto
    enabled: !!filters.unidadeId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}

/**
 * Hook para buscar estatísticas da fila
 */
export function useQueueStats(filters: {
  unidadeId?: string;
} = {}) {
  return useQuery({
    queryKey: queryKeys.queue.stats(),
    queryFn: () => getQueueStatus(filters.unidadeId!),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!filters.unidadeId,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });
}

/**
 * Hook para buscar posição específica na fila
 */
export function useQueuePosition(id: string, unidadeId?: string) {
  return useQuery({
    queryKey: queryKeys.queue.position(id),
    queryFn: () => getQueueStatus(unidadeId!),
    staleTime: 10 * 1000, // 10 segundos
    gcTime: 1 * 60 * 1000, // 1 minuto
    enabled: !!unidadeId,
    select: (data) => {
      if (!data.success || !data.data) return null;
      return data.data.find(item => item.id === id);
    },
  });
}

/**
 * Hook para adicionar cliente à fila
 */
export function useAddToQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddToQueueInput) => addToQueue(input),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidar listas da fila
        invalidateQueries.queue();
        invalidateQueries.queueStats();
        
        // Adicionar o novo item ao cache
        queryClient.setQueryData(
          queryKeys.queue.detail(data.data.id),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao adicionar à fila:', error);
    },
  });
}

/**
 * Hook para atender próximo cliente
 */
export function useAttendNext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CallNextFromQueueInput) => attendNext(input),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidar listas da fila
        invalidateQueries.queue();
        invalidateQueries.queueStats();
        
        // Atualizar o cache do item
        queryClient.setQueryData(
          queryKeys.queue.detail(data.data.id),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao atender próximo cliente:', error);
    },
  });
}

/**
 * Hook para remover cliente da fila
 */
export function useRemoveFromQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveFromQueueInput) => removeFromQueue(input),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar listas da fila
        invalidateQueries.queue();
        invalidateQueries.queueStats();
        
        // Remover do cache
        queryClient.removeQueries({
          queryKey: queryKeys.queue.detail(variables.id),
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao remover da fila:', error);
    },
  });
}

/**
 * Hook para atualizar posição na fila
 */
export function useUpdateQueuePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateQueuePositionInput) => updateQueuePosition(input),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar listas da fila
        invalidateQueries.queue();
        invalidateQueries.queueStats();
        
        // Atualizar o cache do item
        queryClient.setQueryData(
          queryKeys.queue.detail(variables.id),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar posição na fila:', error);
    },
  });
}

/**
 * Hook para reorganizar a fila
 */
export function useReorganizeQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (unidadeId: string) => reorganizeQueue(unidadeId),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidar listas da fila
        invalidateQueries.queue();
        invalidateQueries.queueStats();
      }
    },
    onError: (error) => {
      console.error('Erro ao reorganizar fila:', error);
    },
  });
}

/**
 * Hook para buscar fila com filtros avançados
 */
export function useQueueWithFilters(filters: {
  unidadeId?: string;
  status?: string;
  professionalId?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: queryKeys.queue.list(filters),
    queryFn: () => getQueueStatus(filters.unidadeId!),
    staleTime: 10 * 1000, // 10 segundos
    gcTime: 1 * 60 * 1000, // 1 minuto
    enabled: !!filters.unidadeId,
    select: (data) => {
      if (!data.success || !data.data) return [];
      
      let filtered = data.data;
      
      // Filtrar por status
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(item => item.status === filters.status);
      }
      
      // Filtrar por profissional
      if (filters.professionalId && filters.professionalId !== 'all') {
        filtered = filtered.filter(item => item.assignedProfessionalId === filters.professionalId);
      }
      
      // Filtrar por prioridade
      if (filters.priority && filters.priority !== 'all') {
        filtered = filtered.filter(item => item.priority === filters.priority);
      }
      
      // Filtrar por período
      if (filters.startDate && filters.endDate) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= filters.startDate! && itemDate <= filters.endDate!;
        });
      }
      
      return filtered;
    },
  });
}

/**
 * Hook para prefetch de dados da fila
 */
export function usePrefetchQueue() {
  const queryClient = useQueryClient();

  const prefetchQueue = (filters: {
    unidadeId?: string;
    status?: string;
  }) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.queue.list(filters),
      queryFn: () => getQueueStatus(filters.unidadeId!),
      staleTime: 10 * 1000,
    });
  };

  const prefetchQueueStats = (unidadeId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.queue.stats(),
      queryFn: () => getQueueStatus(unidadeId),
      staleTime: 30 * 1000,
    });
  };

  return {
    prefetchQueue,
    prefetchQueueStats,
  };
}
