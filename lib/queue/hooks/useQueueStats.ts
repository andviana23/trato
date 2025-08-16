"use client";

import { useState, useEffect } from 'react';
import { getQueueStats } from '../queueService';

// ============================================================================
// TIPOS PARA ESTATÍSTICAS DAS FILAS
// ============================================================================

export interface QueueStats {
  notifications: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  reports: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  cleanup: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  sync: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
}

export interface QueueStatsState {
  stats: QueueStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ============================================================================
// HOOK PRINCIPAL PARA ESTATÍSTICAS
// ============================================================================

export function useQueueStats(refreshInterval = 5000) {
  const [state, setState] = useState<QueueStatsState>({
    stats: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Função para buscar estatísticas
  const fetchStats = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const stats = await getQueueStats();
      
      setState({
        stats,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lastUpdated: new Date(),
      }));
    }
  };

  // Buscar estatísticas iniciais
  useEffect(() => {
    fetchStats();
  }, []);

  // Configurar atualização automática
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchStats, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Função para atualizar manualmente
  const refresh = () => {
    fetchStats();
  };

  // Função para parar atualizações automáticas
  const pauseAutoRefresh = () => {
    // Implementar lógica para pausar
  };

  // Função para retomar atualizações automáticas
  const resumeAutoRefresh = () => {
    // Implementar lógica para retomar
  };

  // Cálculos derivados
  const totalJobs = state.stats ? {
    waiting: Object.values(state.stats).reduce((sum, queue) => sum + queue.waiting, 0),
    active: Object.values(state.stats).reduce((sum, queue) => sum + queue.active, 0),
    completed: Object.values(state.stats).reduce((sum, queue) => sum + queue.completed, 0),
    failed: Object.values(state.stats).reduce((sum, queue) => sum + queue.failed, 0),
    delayed: Object.values(state.stats).reduce((sum, queue) => sum + queue.delayed, 0),
    paused: Object.values(state.stats).reduce((sum, queue) => sum + queue.paused, 0),
  } : null;

  const queueHealth = state.stats ? {
    notifications: calculateQueueHealth(state.stats.notifications),
    reports: calculateQueueHealth(state.stats.reports),
    cleanup: calculateQueueHealth(state.stats.cleanup),
    sync: calculateQueueHealth(state.stats.sync),
    overall: calculateOverallHealth(state.stats),
  } : null;

  return {
    ...state,
    totalJobs,
    queueHealth,
    refresh,
    pauseAutoRefresh,
    resumeAutoRefresh,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function calculateQueueHealth(queueStats: QueueStats['notifications']) {
  const total = queueStats.waiting + queueStats.active + queueStats.completed + queueStats.failed;
  
  if (total === 0) return 'idle';
  
  const failureRate = total > 0 ? (queueStats.failed / total) * 100 : 0;
  const activeRate = total > 0 ? (queueStats.active / total) * 100 : 0;
  
  if (failureRate > 20) return 'critical';
  if (failureRate > 10) return 'warning';
  if (activeRate > 80) return 'busy';
  if (activeRate > 50) return 'moderate';
  
  return 'healthy';
}

function calculateOverallHealth(stats: QueueStats) {
  const queues = [stats.notifications, stats.reports, stats.cleanup, stats.sync];
  const healthScores = queues.map(queue => {
    const total = queue.waiting + queue.active + queue.completed + queue.failed;
    if (total === 0) return 1; // idle = healthy
    
    const failureRate = total > 0 ? (queue.failed / total) : 0;
    return Math.max(0, 1 - failureRate);
  });
  
  const averageHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
  
  if (averageHealth >= 0.9) return 'excellent';
  if (averageHealth >= 0.7) return 'good';
  if (averageHealth >= 0.5) return 'moderate';
  if (averageHealth >= 0.3) return 'poor';
  
  return 'critical';
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

// Hook para estatísticas de uma fila específica
export function useSpecificQueueStats(queueName: keyof QueueStats, refreshInterval = 5000) {
  const { stats, loading, error, lastUpdated, refresh } = useQueueStats(refreshInterval);
  
  return {
    stats: stats ? stats[queueName] : null,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}

// Hook para estatísticas de notificações
export function useNotificationQueueStats(refreshInterval = 5000) {
  return useSpecificQueueStats('notifications', refreshInterval);
}

// Hook para estatísticas de relatórios
export function useReportQueueStats(refreshInterval = 5000) {
  return useSpecificQueueStats('reports', refreshInterval);
}

// Hook para estatísticas de limpeza
export function useCleanupQueueStats(refreshInterval = 5000) {
  return useSpecificQueueStats('cleanup', refreshInterval);
}

// Hook para estatísticas de sincronização
export function useSyncQueueStats(refreshInterval = 5000) {
  return useSpecificQueueStats('sync', refreshInterval);
}

// Hook para estatísticas gerais (resumidas)
export function useGeneralQueueStats(refreshInterval = 10000) {
  const { stats, loading, error, lastUpdated, refresh, totalJobs, queueHealth } = useQueueStats(refreshInterval);
  
  if (!stats || !totalJobs || !queueHealth) {
    return {
      loading,
      error,
      lastUpdated,
      refresh,
      totalJobs: null,
      queueHealth: null,
    };
  }
  
  // Calcular métricas resumidas
  const summary = {
    totalJobs: totalJobs.waiting + totalJobs.active + totalJobs.completed + totalJobs.failed,
    activeJobs: totalJobs.active,
    failedJobs: totalJobs.failed,
    successRate: totalJobs.completed > 0 
      ? ((totalJobs.completed - totalJobs.failed) / totalJobs.completed) * 100 
      : 100,
    overallHealth: queueHealth.overall,
  };
  
  return {
    loading,
    error,
    lastUpdated,
    refresh,
    totalJobs,
    queueHealth,
    summary,
  };
}
