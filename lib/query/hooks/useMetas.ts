/**
 * Hooks Customizados para Metas
 * 
 * Este arquivo fornece hooks React Query para operações com metas,
 * incluindo cache automático, sincronização e gerenciamento de estado.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query/queryClient';
import { 
  createMeta, 
  updateMeta, 
  searchMetas, 
  getMetaProgress, 
  calculateBonus,
  type CreateMetaInput,
  type UpdateMetaInput,
  type SearchMetasInput,
  type Meta,
  type MetaWithProgress
} from '@/app/actions/metas';

/**
 * Hook para buscar lista de metas
 */
export function useMetas(filters: SearchMetasInput = {}) {
  return useQuery({
    queryKey: queryKeys.metas.list(filters),
    queryFn: () => searchMetas(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar uma meta específica
 */
export function useMeta(id: string) {
  return useQuery({
    queryKey: queryKeys.metas.detail(id),
    queryFn: () => getMetaProgress(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para buscar progresso de uma meta
 */
export function useMetaProgress(id: string) {
  return useQuery({
    queryKey: queryKeys.metas.progress(id),
    queryFn: () => getMetaProgress(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para calcular bônus de uma meta
 */
export function useMetaBonus(id: string) {
  return useQuery({
    queryKey: queryKeys.metas.bonus(id),
    queryFn: () => calculateBonus(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para criar uma nova meta
 */
export function useCreateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMetaInput) => createMeta(input),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidar listas de metas
        invalidateQueries.metasList();
        
        // Adicionar a nova meta ao cache
        queryClient.setQueryData(
          queryKeys.metas.detail(data.data.id),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao criar meta:', error);
    },
  });
}

/**
 * Hook para atualizar uma meta
 */
export function useUpdateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMetaInput) => updateMeta(input),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar a meta específica e listas
        invalidateQueries.meta(variables.metaId);
        invalidateQueries.metasList();
        
        // Atualizar o cache da meta
        queryClient.setQueryData(
          queryKeys.metas.detail(variables.metaId),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar meta:', error);
    },
  });
}

/**
 * Hook para buscar metas com filtros avançados
 */
export function useMetasWithFilters(filters: SearchMetasInput) {
  return useQuery({
    queryKey: queryKeys.metas.list(filters),
    queryFn: () => searchMetas(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
    enabled: Object.keys(filters).length > 0,
  });
}

/**
 * Hook para buscar metas por unidade
 */
export function useMetasByUnit(unidadeId: string) {
  return useMetasWithFilters({ unidadeId });
}

/**
 * Hook para buscar metas por status
 */
export function useMetasByStatus(status: string) {
  return useMetasWithFilters({ status: status as any });
}

/**
 * Hook para buscar metas por período
 */
export function useMetasByPeriod(startDate: string, endDate: string) {
  return useMetasWithFilters({ startDate, endDate });
}
