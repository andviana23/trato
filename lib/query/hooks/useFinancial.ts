/**
 * Hooks Customizados para Sistema Financeiro
 * 
 * Este arquivo fornece hooks React Query para operações financeiras,
 * incluindo cache automático, sincronização e gerenciamento de estado.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query/queryClient';
import { 
  getDREData,
  getDREComparison,
  getFinancialSummary,
  getCashFlow,
  getProfitabilityAnalysis,
  validateFinancialData,
  type Period,
  type DREData,
  type DREComparisonData,
  type FinancialSummary,
  type CashFlowData,
  type ProfitabilityData,
  type DataValidationResult
} from '@/app/actions/reports';

/**
 * Hook para buscar dados do DRE
 */
export function useDREData(period: Period, unidade_id?: string, include_audit_trail?: boolean) {
  return useQuery({
    queryKey: ['financial', 'dre', period, unidade_id, include_audit_trail],
    queryFn: () => getDREData({ period, unidade_id, include_audit_trail }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    enabled: !!period.from && !!period.to,
  });
}

/**
 * Hook para comparação de DRE entre períodos
 */
export function useDREComparison(periods: { current: Period; previous: Period }, unidade_id?: string) {
  return useQuery({
    queryKey: ['financial', 'dre-comparison', periods, unidade_id],
    queryFn: () => getDREComparison({ periods, unidade_id }),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled: !!periods.current && !!periods.previous,
  });
}

/**
 * Hook para resumo financeiro
 */
export function useFinancialSummary(period: Period, unidade_id?: string) {
  return useQuery({
    queryKey: ['financial', 'summary', period, unidade_id],
    queryFn: () => getFinancialSummary({ period, unidade_id }),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!period.from && !!period.to,
  });
}

/**
 * Hook para fluxo de caixa
 */
export function useCashFlow(period: Period, unidade_id?: string) {
  return useQuery({
    queryKey: ['financial', 'cash-flow', period, unidade_id],
    queryFn: () => getCashFlow({ period, unidade_id }),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    enabled: !!period.from && !!period.to,
  });
}

/**
 * Hook para análise de lucratividade
 */
export function useProfitabilityAnalysis(period: Period, unidade_id?: string) {
  return useQuery({
    queryKey: ['financial', 'profitability', period, unidade_id],
    queryFn: () => getProfitabilityAnalysis({ period, unidade_id }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos
    enabled: !!period.from && !!period.to,
  });
}

/**
 * Hook para validação de dados financeiros
 */
export function useFinancialValidation(period: Period, unidade_id?: string, include_detailed_audit?: boolean) {
  return useQuery({
    queryKey: ['financial', 'validation', period, unidade_id, include_detailed_audit],
    queryFn: () => validateFinancialData({ period, unidade_id, include_detailed_audit }),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!period.from && !!period.to,
  });
}

/**
 * Hook para exportação de relatório DRE
 */
export function useExportDRE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ period, unidade_id, format }: { period: Period; unidade_id?: string; format: 'csv' | 'json' }) =>
      getDREData({ period, unidade_id, include_audit_trail: true }).then(result => {
        if (result.success && result.data) {
          // Aqui você implementaria a lógica de exportação
          return { success: true, data: result.data };
        }
        throw new Error(result.error || 'Falha ao exportar DRE');
      }),
    onSuccess: () => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
    onError: (error) => {
      console.error('Erro ao exportar DRE:', error);
    },
  });
}

/**
 * Hook para prefetch de dados financeiros
 */
export function usePrefetchFinancialData() {
  const queryClient = useQueryClient();

  const prefetchDRE = (period: Period, unidade_id?: string) => {
    queryClient.prefetchQuery({
      queryKey: ['financial', 'dre', period, unidade_id, false],
      queryFn: () => getDREData({ period, unidade_id, include_audit_trail: false }),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchSummary = (period: Period, unidade_id?: string) => {
    queryClient.prefetchQuery({
      queryKey: ['financial', 'summary', period, unidade_id],
      queryFn: () => getFinancialSummary({ period, unidade_id }),
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetchDRE, prefetchSummary };
}
