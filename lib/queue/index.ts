// ============================================================================
// SISTEMA DE FILAS - EXPORTAÇÕES CENTRALIZADAS
// ============================================================================

// Tipos principais
export type {
  NotificationJob,
  ReportJob,
  CleanupJob,
  SyncJob,
} from './queueService';

// Filas principais
export {
  notificationQueue,
  reportQueue,
  cleanupQueue,
  syncQueue,
} from './queueService';

// Funções para adicionar tarefas
export {
  addNotificationJob,
  addReportJob,
  addCleanupJob,
  addSyncJob,
} from './queueService';

// Funções de monitoramento
export {
  getQueueStats,
  getFailedJobs,
  retryFailedJob,
} from './queueService';

// Funções de agendamento
export {
  scheduleDailyCleanup,
  scheduleWeeklyReports,
  scheduleGoogleCalendarSync,
} from './queueService';

// Funções de inicialização e finalização
export {
  initializeQueueSystem,
  closeQueueSystem,
} from './queueService';

// ============================================================================
// HOOKS REACT PARA USO NO FRONTEND
// ============================================================================

export { useQueueStats } from './hooks/useQueueStats';
export { useQueueMonitoring } from './hooks/useQueueMonitoring';
export { useQueueActions } from './hooks/useQueueActions';

// ============================================================================
// UTILITÁRIOS PARA DESENVOLVIMENTO
// ============================================================================

export { createTestJob } from './utils/testUtils';
export { validateJobData } from './utils/validationUtils';
export { formatQueueStats } from './utils/formatUtils';
