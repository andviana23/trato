/**
 * Hook para buscar clientes
 * 
 * Este hook é usado para busca e autocomplete de clientes
 * na interface de agendamentos.
 */

import { useQuery } from '@tanstack/react-query';
import { getClients } from '@/app/actions/clients';

/**
 * Hook para buscar lista de clientes
 */
export function useClients(filters: {
  unidadeId?: string;
  search?: string;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['clients', 'list', filters],
    queryFn: () => getClients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    enabled: !!filters.unidadeId,
  });
}

/**
 * Hook para buscar um cliente específico
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', 'detail', id],
    queryFn: () => getClients({ id }),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled: !!id,
  });
}

/**
 * Hook para busca de clientes com autocomplete
 */
export function useClientSearch(searchQuery: string, unidadeId?: string) {
  return useQuery({
    queryKey: ['clients', 'search', searchQuery, unidadeId],
    queryFn: () => getClients({
      unidadeId,
      search: searchQuery,
      limit: 10,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: searchQuery.length >= 2 && !!unidadeId,
  });
}
