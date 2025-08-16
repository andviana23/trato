"use client";

import { useState, useEffect, useCallback } from 'react';
import { getFailedJobs, retryFailedJob } from '../queueService';

// ============================================================================
// TIPOS PARA MONITORAMENTO DAS FILAS
// ============================================================================

export interface FailedJob {
  id: string;
  name: string;
  data: any;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
}

export interface ActiveJob {
  id: string;
  name: string;
  data: any;
  timestamp: number;
  processedOn?: number;
  progress?: number;
}

export interface QueueMonitoringState {
  failedJobs: Record<string, FailedJob[]>;
  activeJobs: Record<string, ActiveJob[]>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ============================================================================
// HOOK PRINCIPAL PARA MONITORAMENTO
// ============================================================================

export function useQueueMonitoring(refreshInterval = 3000) {
  const [state, setState] = useState<QueueMonitoringState>({
    failedJobs: {},
    activeJobs: {},
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [isMonitoring, setIsMonitoring] = useState(true);

  // Função para buscar jobs falhados
  const fetchFailedJobs = useCallback(async () => {
    try {
      const queueNames = ['notifications', 'reports', 'cleanup', 'sync'];
      const failedJobsData: Record<string, FailedJob[]> = {};

      for (const queueName of queueNames) {
        try {
          const jobs = await getFailedJobs(queueName, 20);
          failedJobsData[queueName] = jobs.map(job => ({
            id: job.id!,
            name: job.name,
            data: job.data,
            failedReason: job.failedReason || 'Erro desconhecido',
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
          }));
        } catch (error) {
          console.error(`Erro ao buscar jobs falhados da fila ${queueName}:`, error);
          failedJobsData[queueName] = [];
        }
      }

      setState(prev => ({
        ...prev,
        failedJobs: failedJobsData,
        error: null,
        lastUpdated: new Date(),
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // Função para buscar jobs ativos
  const fetchActiveJobs = useCallback(async () => {
    try {
      // TODO: Implementar busca de jobs ativos
      // Por enquanto, simulamos dados vazios
      const activeJobsData: Record<string, ActiveJob[]> = {
        notifications: [],
        reports: [],
        cleanup: [],
        sync: [],
      };

      setState(prev => ({
        ...prev,
        activeJobs: activeJobsData,
        error: null,
        lastUpdated: new Date(),
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // Função para buscar todos os dados
  const fetchAllData = useCallback(async () => {
    if (!isMonitoring) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      await Promise.all([
        fetchFailedJobs(),
        fetchActiveJobs(),
      ]);

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
    }
  }, [fetchFailedJobs, fetchActiveJobs, isMonitoring]);

  // Função para retry de um job falhado
  const retryJob = useCallback(async (queueName: string, jobId: string) => {
    try {
      await retryFailedJob(queueName, jobId);
      
      // Atualizar a lista após retry
      await fetchFailedJobs();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [fetchFailedJobs]);

  // Função para retry de todos os jobs falhados de uma fila
  const retryAllJobs = useCallback(async (queueName: string) => {
    try {
      const failedJobs = state.failedJobs[queueName] || [];
      const results = await Promise.allSettled(
        failedJobs.map(job => retryFailedJob(queueName, job.id))
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      // Atualizar a lista após retry
      await fetchFailedJobs();

      return { success: true, successCount, failureCount };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [state.failedJobs, fetchFailedJobs]);

  // Função para pausar monitoramento
  const pauseMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Função para retomar monitoramento
  const resumeMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  // Função para limpar jobs falhados antigos
  const clearOldFailedJobs = useCallback(async (queueName: string, olderThanHours = 24) => {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const oldJobs = (state.failedJobs[queueName] || []).filter(
        job => job.timestamp < cutoffTime
      );

      // TODO: Implementar limpeza de jobs antigos
      console.log(`[Queue] Limpando ${oldJobs.length} jobs antigos da fila ${queueName}`);

      // Atualizar a lista após limpeza
      await fetchFailedJobs();

      return { success: true, clearedCount: oldJobs.length };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [state.failedJobs, fetchFailedJobs]);

  // Buscar dados iniciais
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Configurar atualização automática
  useEffect(() => {
    if (!isMonitoring || refreshInterval <= 0) return;

    const interval = setInterval(fetchAllData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchAllData, isMonitoring, refreshInterval]);

  // Cálculos derivados
  const totalFailedJobs = Object.values(state.failedJobs).reduce(
    (total, jobs) => total + jobs.length, 0
  );

  const totalActiveJobs = Object.values(state.activeJobs).reduce(
    (total, jobs) => total + jobs.length, 0
  );

  const failedJobsByQueue = Object.entries(state.failedJobs).map(([queueName, jobs]) => ({
    queueName,
    count: jobs.length,
    jobs,
  }));

  const activeJobsByQueue = Object.entries(state.activeJobs).map(([queueName, jobs]) => ({
    queueName,
    count: jobs.length,
    jobs,
  }));

  // Agrupar jobs por tipo de erro
  const failedJobsByError = Object.values(state.failedJobs)
    .flat()
    .reduce((acc, job) => {
      const errorType = categorizeError(job.failedReason);
      if (!acc[errorType]) acc[errorType] = [];
      acc[errorType].push(job);
      return acc;
    }, {} as Record<string, FailedJob[]>);

  return {
    ...state,
    totalFailedJobs,
    totalActiveJobs,
    failedJobsByQueue,
    activeJobsByQueue,
    failedJobsByError,
    isMonitoring,
    retryJob,
    retryAllJobs,
    pauseMonitoring,
    resumeMonitoring,
    clearOldFailedJobs,
    refresh: fetchAllData,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function categorizeError(errorMessage: string): string {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('timeout') || message.includes('time out')) return 'timeout';
  if (message.includes('network') || message.includes('connection')) return 'network';
  if (message.includes('validation') || message.includes('invalid')) return 'validation';
  if (message.includes('permission') || message.includes('unauthorized')) return 'permission';
  if (message.includes('not found') || message.includes('404')) return 'not_found';
  if (message.includes('rate limit') || message.includes('too many')) return 'rate_limit';
  
  return 'other';
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

// Hook para monitoramento de uma fila específica
export function useSpecificQueueMonitoring(
  queueName: string, 
  refreshInterval = 3000
) {
  const { 
    failedJobs, 
    activeJobs, 
    loading, 
    error, 
    lastUpdated,
    retryJob,
    retryAllJobs,
    clearOldFailedJobs,
    refresh 
  } = useQueueMonitoring(refreshInterval);

  return {
    failedJobs: failedJobs[queueName] || [],
    activeJobs: activeJobs[queueName] || [],
    loading,
    error,
    lastUpdated,
    retryJob: (jobId: string) => retryJob(queueName, jobId),
    retryAllJobs: () => retryAllJobs(queueName),
    clearOldFailedJobs: (olderThanHours?: number) => clearOldFailedJobs(queueName, olderThanHours),
    refresh,
  };
}

// Hook para monitoramento de notificações
export function useNotificationQueueMonitoring(refreshInterval = 3000) {
  return useSpecificQueueMonitoring('notifications', refreshInterval);
}

// Hook para monitoramento de relatórios
export function useReportQueueMonitoring(refreshInterval = 3000) {
  return useSpecificQueueMonitoring('reports', refreshInterval);
}

// Hook para monitoramento de limpeza
export function useCleanupQueueMonitoring(refreshInterval = 3000) {
  return useSpecificQueueMonitoring('cleanup', refreshInterval);
}

// Hook para monitoramento de sincronização
export function useSyncQueueMonitoring(refreshInterval = 3000) {
  return useSpecificQueueMonitoring('sync', refreshInterval);
}

// Hook para monitoramento de jobs falhados apenas
export function useFailedJobsMonitoring(refreshInterval = 5000) {
  const { 
    failedJobs, 
    loading, 
    error, 
    lastUpdated,
    totalFailedJobs,
    failedJobsByQueue,
    failedJobsByError,
    retryJob,
    retryAllJobs,
    clearOldFailedJobs,
    refresh 
  } = useQueueMonitoring(refreshInterval);

  return {
    failedJobs,
    loading,
    error,
    lastUpdated,
    totalFailedJobs,
    failedJobsByQueue,
    failedJobsByError,
    retryJob,
    retryAllJobs,
    clearOldFailedJobs,
    refresh,
  };
}

// Hook para monitoramento de jobs ativos apenas
export function useActiveJobsMonitoring(refreshInterval = 2000) {
  const { 
    activeJobs, 
    loading, 
    error, 
    lastUpdated,
    totalActiveJobs,
    activeJobsByQueue,
    refresh 
  } = useQueueMonitoring(refreshInterval);

  return {
    activeJobs,
    loading,
    error,
    lastUpdated,
    totalActiveJobs,
    activeJobsByQueue,
    refresh,
  };
}
