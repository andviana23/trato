"use client";

import { useState, useCallback } from 'react';
import { 
  addNotificationJob, 
  addReportJob, 
  addCleanupJob, 
  addSyncJob,
  NotificationJob,
  ReportJob,
  CleanupJob,
  SyncJob,
} from '../queueService';
import { toast } from 'sonner';

// ============================================================================
// TIPOS PARA AÇÕES DAS FILAS
// ============================================================================

export interface QueueActionState {
  loading: boolean;
  error: string | null;
  lastAction: string | null;
  lastActionTime: Date | null;
}

export interface JobCreationResult {
  success: boolean;
  jobId?: string;
  error?: string;
  queueName: string;
  jobType: string;
}

// ============================================================================
// HOOK PRINCIPAL PARA AÇÕES
// ============================================================================

export function useQueueActions() {
  const [state, setState] = useState<QueueActionState>({
    loading: false,
    error: null,
    lastAction: null,
    lastActionTime: null,
  });

  // Função para adicionar job de notificação
  const addNotification = useCallback(async (
    data: NotificationJob, 
    options?: { priority?: number; delay?: number }
  ): Promise<JobCreationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const job = await addNotificationJob(data, options);
      
      setState(prev => ({
        ...prev,
        loading: false,
        lastAction: `Notificação ${data.type} adicionada`,
        lastActionTime: new Date(),
      }));

      toast.success(`Notificação ${data.type} adicionada à fila`);
      
      return {
        success: true,
        jobId: job.id,
        queueName: 'notifications',
        jobType: data.type,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastAction: `Falha ao adicionar notificação ${data.type}`,
        lastActionTime: new Date(),
      }));

      toast.error(`Erro ao adicionar notificação: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        queueName: 'notifications',
        jobType: data.type,
      };
    }
  }, []);

  // Função para adicionar job de relatório
  const addReport = useCallback(async (
    data: ReportJob, 
    options?: { priority?: number; delay?: number }
  ): Promise<JobCreationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const job = await addReportJob(data, options);
      
      setState(prev => ({
        ...prev,
        loading: false,
        lastAction: `Relatório ${data.type} adicionado`,
        lastActionTime: new Date(),
      }));

      toast.success(`Relatório ${data.type} adicionado à fila`);
      
      return {
        success: true,
        jobId: job.id,
        queueName: 'reports',
        jobType: data.type,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastAction: `Falha ao adicionar relatório ${data.type}`,
        lastActionTime: new Date(),
      }));

      toast.error(`Erro ao adicionar relatório: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        queueName: 'reports',
        jobType: data.type,
      };
    }
  }, []);

  // Função para adicionar job de limpeza
  const addCleanup = useCallback(async (
    data: CleanupJob, 
    options?: { priority?: number; delay?: number }
  ): Promise<JobCreationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const job = await addCleanupJob(data, options);
      
      setState(prev => ({
        ...prev,
        loading: false,
        lastAction: `Limpeza ${data.type} agendada`,
        lastActionTime: new Date(),
      }));

      toast.success(`Limpeza ${data.type} agendada`);
      
      return {
        success: true,
        jobId: job.id,
        queueName: 'cleanup',
        jobType: data.type,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastAction: `Falha ao agendar limpeza ${data.type}`,
        lastActionTime: new Date(),
      }));

      toast.error(`Erro ao agendar limpeza: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        queueName: 'cleanup',
        jobType: data.type,
      };
    }
  }, []);

  // Função para adicionar job de sincronização
  const addSync = useCallback(async (
    data: SyncJob, 
    options?: { priority?: number; delay?: number }
  ): Promise<JobCreationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const job = await addSyncJob(data, options);
      
      setState(prev => ({
        ...prev,
        loading: false,
        lastAction: `Sincronização ${data.type} agendada`,
        lastActionTime: new Date(),
      }));

      toast.success(`Sincronização ${data.type} agendada`);
      
      return {
        success: true,
        jobId: job.id,
        queueName: 'sync',
        jobType: data.type,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastAction: `Falha ao agendar sincronização ${data.type}`,
        lastActionTime: new Date(),
      }));

      toast.error(`Erro ao agendar sincronização: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        queueName: 'sync',
        jobType: data.type,
      };
    }
  }, []);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Função para limpar histórico de ações
  const clearHistory = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      lastAction: null, 
      lastActionTime: null 
    }));
  }, []);

  // Função para resetar estado
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      lastAction: null,
      lastActionTime: null,
    });
  }, []);

  return {
    ...state,
    addNotification,
    addReport,
    addCleanup,
    addSync,
    clearError,
    clearHistory,
    reset,
  };
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

// Hook para ações de notificação
export function useNotificationActions() {
  const { addNotification, loading, error, lastAction, lastActionTime, clearError, clearHistory } = useQueueActions();

  const sendWhatsApp = useCallback(async (
    recipient: string, 
    message: string, 
    metadata?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addNotification({
      type: 'whatsapp',
      recipient,
      message,
      metadata,
    }, options);
  }, [addNotification]);

  const sendSMS = useCallback(async (
    recipient: string, 
    message: string, 
    metadata?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addNotification({
      type: 'sms',
      recipient,
      message,
      metadata,
    }, options);
  }, [addNotification]);

  const sendEmail = useCallback(async (
    recipient: string, 
    message: string, 
    metadata?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addNotification({
      type: 'email',
      recipient,
      message,
      metadata,
    }, options);
  }, [addNotification]);

  return {
    sendWhatsApp,
    sendSMS,
    sendEmail,
    loading,
    error,
    lastAction,
    lastActionTime,
    clearError,
    clearHistory,
  };
}

// Hook para ações de relatório
export function useReportActions() {
  const { addReport, loading, error, lastAction, lastActionTime, clearError, clearHistory } = useQueueActions();

  const generateDailyReport = useCallback(async (
    unidadeId: string,
    format: 'pdf' | 'csv' | 'xlsx' = 'pdf',
    filters?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addReport({
      type: 'daily',
      unidadeId,
      format,
      filters,
    }, options);
  }, [addReport]);

  const generateWeeklyReport = useCallback(async (
    unidadeId: string,
    format: 'pdf' | 'csv' | 'xlsx' = 'pdf',
    filters?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addReport({
      type: 'weekly',
      unidadeId,
      format,
      filters,
    }, options);
  }, [addReport]);

  const generateMonthlyReport = useCallback(async (
    unidadeId: string,
    format: 'pdf' | 'csv' | 'xlsx' = 'pdf',
    filters?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addReport({
      type: 'monthly',
      unidadeId,
      format,
      filters,
    }, options);
  }, [addReport]);

  return {
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport,
    loading,
    error,
    lastAction,
    lastActionTime,
    clearError,
    clearHistory,
  };
}

// Hook para ações de limpeza
export function useCleanupActions() {
  const { addCleanup, loading, error, lastAction, lastActionTime, clearError, clearHistory } = useQueueActions();

  const scheduleAuditLogsCleanup = useCallback(async (
    retentionDays: number = 90,
    options?: { priority?: number; delay?: number }
  ) => {
    return addCleanup({
      type: 'audit_logs',
      retentionDays,
    }, options);
  }, [addCleanup]);

  const scheduleTempFilesCleanup = useCallback(async (
    retentionDays: number = 7,
    options?: { priority?: number; delay?: number }
  ) => {
    return addCleanup({
      type: 'temp_files',
      retentionDays,
    }, options);
  }, [addCleanup]);

  const scheduleCacheCleanup = useCallback(async (
    retentionDays: number = 1,
    options?: { priority?: number; delay?: number }
  ) => {
    return addCleanup({
      type: 'cache',
      retentionDays,
    }, options);
  }, [addCleanup]);

  return {
    scheduleAuditLogsCleanup,
    scheduleTempFilesCleanup,
    scheduleCacheCleanup,
    loading,
    error,
    lastAction,
    lastActionTime,
    clearError,
    clearHistory,
  };
}

// Hook para ações de sincronização
export function useSyncActions() {
  const { addSync, loading, error, lastAction, lastActionTime, clearError, clearHistory } = useQueueActions();

  const syncGoogleCalendar = useCallback(async (
    entityId: string = 'all',
    metadata?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addSync({
      type: 'google_calendar',
      entityId,
      metadata,
    }, options);
  }, [addSync]);

  const syncAsaasWebhooks = useCallback(async (
    entityId: string = 'all',
    metadata?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addSync({
      type: 'asaas_webhooks',
      entityId,
      metadata,
    }, options);
  }, [addSync]);

  const syncExternalAPI = useCallback(async (
    entityId: string,
    metadata?: Record<string, any>,
    options?: { priority?: number; delay?: number }
  ) => {
    return addSync({
      type: 'external_api',
      entityId,
      metadata,
    }, options);
  }, [addSync]);

  return {
    syncGoogleCalendar,
    syncAsaasWebhooks,
    syncExternalAPI,
    loading,
    error,
    lastAction,
    lastActionTime,
    clearError,
    clearHistory,
  };
}

// Hook para ações em lote
export function useBatchQueueActions() {
  const { 
    addNotification, 
    addReport, 
    addCleanup, 
    addSync,
    loading, 
    error, 
    lastAction, 
    lastActionTime, 
    clearError, 
    clearHistory 
  } = useQueueActions();

  const addMultipleNotifications = useCallback(async (
    notifications: NotificationJob[],
    options?: { priority?: number; delay?: number }
  ) => {
    const results = await Promise.allSettled(
      notifications.map(notification => addNotification(notification, options))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    if (failed > 0) {
      toast.error(`${failed} notificações falharam ao ser adicionadas`);
    }

    if (successful > 0) {
      toast.success(`${successful} notificações adicionadas com sucesso`);
    }

    return { successful, failed, results };
  }, [addNotification]);

  const addMultipleReports = useCallback(async (
    reports: ReportJob[],
    options?: { priority?: number; delay?: number }
  ) => {
    const results = await Promise.allSettled(
      reports.map(report => addReport(report, options))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    if (failed > 0) {
      toast.error(`${failed} relatórios falharam ao ser adicionados`);
    }

    if (successful > 0) {
      toast.success(`${successful} relatórios adicionados com sucesso`);
    }

    return { successful, failed, results };
  }, [addReport]);

  return {
    addMultipleNotifications,
    addMultipleReports,
    loading,
    error,
    lastAction,
    lastActionTime,
    clearError,
    clearHistory,
  };
}
