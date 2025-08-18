import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// CONFIGURAÇÃO DO REDIS
// ============================================================================

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// ============================================================================
// TIPOS DE TAREFAS
// ============================================================================

export interface NotificationJob {
  type: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ReportJob {
  type: 'daily' | 'weekly' | 'monthly';
  unidadeId: string;
  format: 'pdf' | 'csv' | 'xlsx';
  filters?: Record<string, any>;
}

export interface CleanupJob {
  type: 'audit_logs' | 'temp_files' | 'cache';
  retentionDays: number;
}

export interface SyncJob {
  type: 'google_calendar' | 'asaas_webhooks' | 'external_api';
  entityId: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONFIGURAÇÃO DAS FILAS
// ============================================================================

// Fila para notificações (alta prioridade)
export const notificationQueue = new Queue('notifications', {
  connection: new Redis(redisConfig),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Fila para relatórios (média prioridade)
export const reportQueue = new Queue('reports', {
  connection: new Redis(redisConfig),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
});

// Fila para limpeza (baixa prioridade)
export const cleanupQueue = new Queue('cleanup', {
  connection: new Redis(redisConfig),
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: 20,
    removeOnFail: 10,
  },
});

// Fila para sincronização (média prioridade)
export const syncQueue = new Queue('sync', {
  connection: new Redis(redisConfig),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 75,
    removeOnFail: 40,
  },
});

// ============================================================================
// WORKERS PARA PROCESSAMENTO
// ============================================================================

// Worker para notificações
const notificationWorker = new Worker('notifications', async (job: Job<NotificationJob>) => {
  const { type, recipient, message, metadata } = job.data;
  
  try {
    console.log(`[Queue] Processando notificação ${type} para ${recipient}`);
    
    switch (type) {
      case 'whatsapp':
        await processWhatsAppNotification(recipient, message, metadata);
        break;
      case 'sms':
        await processSmsNotification(recipient, message, metadata);
        break;
      case 'email':
        await processEmailNotification(recipient, message, metadata);
        break;
      default:
        throw new Error(`Tipo de notificação não suportado: ${type}`);
    }
    
    console.log(`[Queue] Notificação ${type} processada com sucesso`);
    return { success: true, type, recipient };
    
  } catch (error) {
    console.error(`[Queue] Erro ao processar notificação ${type}:`, error);
    throw error;
  }
}, {
  connection: new Redis(redisConfig),
  concurrency: 5,
});

// Worker para relatórios
const reportWorker = new Worker('reports', async (job: Job<ReportJob>) => {
  const { type, unidadeId, format, filters } = job.data;
  
  try {
    console.log(`[Queue] Processando relatório ${type} para unidade ${unidadeId}`);
    
    const report = await generateReport(type, unidadeId, format, filters);
    
    console.log(`[Queue] Relatório ${type} gerado com sucesso`);
    return { success: true, type, unidadeId, report };
    
  } catch (error) {
    console.error(`[Queue] Erro ao gerar relatório ${type}:`, error);
    throw error;
  }
}, {
  connection: new Redis(redisConfig),
  concurrency: 2,
});

// Worker para limpeza
const cleanupWorker = new Worker('cleanup', async (job: Job<CleanupJob>) => {
  const { type, retentionDays } = job.data;
  
  try {
    console.log(`[Queue] Executando limpeza ${type} com retenção de ${retentionDays} dias`);
    
    const result = await performCleanup(type, retentionDays);
    
    console.log(`[Queue] Limpeza ${type} executada com sucesso`);
    return { success: true, type, result };
    
  } catch (error) {
    console.error(`[Queue] Erro ao executar limpeza ${type}:`, error);
    throw error;
  }
}, {
  connection: new Redis(redisConfig),
  concurrency: 1,
});

// Worker para sincronização
const syncWorker = new Worker('sync', async (job: Job<SyncJob>) => {
  const { type, entityId, metadata } = job.data;
  
  try {
    console.log(`[Queue] Executando sincronização ${type} para entidade ${entityId}`);
    
    const result = await performSync(type, entityId, metadata);
    
    console.log(`[Queue] Sincronização ${type} executada com sucesso`);
    return { success: true, type, entityId, result };
    
  } catch (error) {
    console.error(`[Queue] Erro ao executar sincronização ${type}:`, error);
    throw error;
  }
}, {
  connection: new Redis(redisConfig),
  concurrency: 3,
});

// ============================================================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================================================

async function processWhatsAppNotification(recipient: string, message: string, metadata?: Record<string, any>) {
  // TODO: Implementar integração com WhatsApp Business API
  console.log(`[WhatsApp] Enviando para ${recipient}: ${message}`);
  
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular sucesso
  return { messageId: `wa_${Date.now()}`, status: 'sent' };
}

async function processSmsNotification(recipient: string, message: string, metadata?: Record<string, any>) {
  // TODO: Implementar integração com Twilio ou similar
  console.log(`[SMS] Enviando para ${recipient}: ${message}`);
  
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simular sucesso
  return { messageId: `sms_${Date.now()}`, status: 'sent' };
}

async function processEmailNotification(recipient: string, message: string, metadata?: Record<string, any>) {
  // TODO: Implementar integração com SendGrid ou similar
  console.log(`[Email] Enviando para ${recipient}: ${message}`);
  
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simular sucesso
  return { messageId: `email_${Date.now()}`, status: 'sent' };
}

async function generateReport(type: string, unidadeId: string, format: string, filters?: Record<string, any>) {
  const supabase = createClient();
  
  // TODO: Implementar geração de relatórios baseada no tipo
  console.log(`[Report] Gerando relatório ${type} em formato ${format}`);
  
  // Simular geração de relatório
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    reportId: `report_${type}_${Date.now()}`,
    format,
    size: Math.floor(Math.random() * 1000000) + 100000, // 100KB - 1MB
    url: `/reports/${type}_${Date.now()}.${format}`,
  };
}

async function performCleanup(type: string, retentionDays: number) {
  const supabase = createClient();
  
  try {
    let deletedCount = 0;
    
    switch (type) {
      case 'audit_logs':
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        const { count } = await supabase
          .from('audit_logs')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id', { count: 'exact', head: true });
        
        deletedCount = count || 0;
        break;
        
      case 'temp_files':
        // TODO: Implementar limpeza de arquivos temporários
        deletedCount = Math.floor(Math.random() * 100);
        break;
        
      case 'cache':
        // TODO: Implementar limpeza de cache
        deletedCount = Math.floor(Math.random() * 50);
        break;
        
      default:
        throw new Error(`Tipo de limpeza não suportado: ${type}`);
    }
    
    return { deletedCount, type, retentionDays };
    
  } catch (error) {
    console.error(`[Cleanup] Erro ao executar limpeza ${type}:`, error);
    throw error;
  }
}

async function performSync(type: string, entityId: string, metadata?: Record<string, any>) {
  try {
    switch (type) {
      case 'google_calendar':
        // TODO: Implementar sincronização com Google Calendar
        return { synced: true, eventsCount: Math.floor(Math.random() * 100) };
        
      case 'asaas_webhooks':
        // TODO: Implementar sincronização com ASAAS
        return { synced: true, webhooksCount: Math.floor(Math.random() * 50) };
        
      case 'external_api':
        // TODO: Implementar sincronização com APIs externas
        return { synced: true, dataCount: Math.floor(Math.random() * 200) };
        
      default:
        throw new Error(`Tipo de sincronização não suportado: ${type}`);
    }
  } catch (error) {
    console.error(`[Sync] Erro ao executar sincronização ${type}:`, error);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES PÚBLICAS PARA ADICIONAR TAREFAS
// ============================================================================

export async function addNotificationJob(data: NotificationJob, options?: { priority?: number; delay?: number }) {
  return await notificationQueue.add('notification', data, {
    priority: options?.priority || 1,
    delay: options?.delay,
  });
}

export async function addReportJob(data: ReportJob, options?: { priority?: number; delay?: number }) {
  return await reportQueue.add('report', data, {
    priority: options?.priority || 2,
    delay: options?.delay,
  });
}

export async function addCleanupJob(data: CleanupJob, options?: { priority?: number; delay?: number }) {
  return await cleanupQueue.add('cleanup', data, {
    priority: options?.priority || 3,
    delay: options?.delay,
  });
}

export async function addSyncJob(data: SyncJob, options?: { priority?: number; delay?: number }) {
  return await syncQueue.add('sync', data, {
    priority: options?.priority || 2,
    delay: options?.delay,
  });
}

// ============================================================================
// FUNÇÕES DE MONITORAMENTO
// ============================================================================

export async function getQueueStats() {
  const [notificationStats, reportStats, cleanupStats, syncStats] = await Promise.all([
    notificationQueue.getJobCounts(),
    reportQueue.getJobCounts(),
    cleanupQueue.getJobCounts(),
    syncQueue.getJobCounts(),
  ]);
  
  return {
    notifications: notificationStats,
    reports: reportStats,
    cleanup: cleanupStats,
    sync: syncStats,
  };
}

export async function getFailedJobs(queueName: string, limit = 10) {
  let queue: Queue;
  
  switch (queueName) {
    case 'notifications':
      queue = notificationQueue;
      break;
    case 'reports':
      queue = reportQueue;
      break;
    case 'cleanup':
      queue = cleanupQueue;
      break;
    case 'sync':
      queue = syncQueue;
      break;
    default:
      throw new Error(`Fila não encontrada: ${queueName}`);
  }
  
  return await queue.getFailed(0, limit);
}

export async function retryFailedJob(queueName: string, jobId: string) {
  let queue: Queue;
  
  switch (queueName) {
    case 'notifications':
      queue = notificationQueue;
      break;
    case 'reports':
      queue = reportQueue;
      break;
    case 'cleanup':
      queue = cleanupQueue;
      break;
    case 'sync':
      queue = syncQueue;
      break;
    default:
      throw new Error(`Fila não encontrada: ${queueName}`);
  }
  
  const job = await queue.getJob(jobId);
  if (!job) {
    throw new Error(`Job não encontrado: ${jobId}`);
  }
  
  await job.retry();
  return { success: true, jobId };
}

// ============================================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================================

// Eventos de notificação
notificationWorker.on('completed', (job) => {
  console.log(`[Queue] Notificação completada: ${job.id}`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Queue] Notificação falhou: ${job.id}`, err);
  toast.error(`Falha ao enviar notificação: ${err.message}`);
});

// Eventos de relatório
reportWorker.on('completed', (job) => {
  console.log(`[Queue] Relatório completado: ${job.id}`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`[Queue] Relatório falhou: ${job.id}`, err);
  toast.error(`Falha ao gerar relatório: ${err.message}`);
});

// Eventos de limpeza
cleanupWorker.on('completed', (job) => {
  console.log(`[Queue] Limpeza completada: ${job.id}`);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`[Queue] Limpeza falhou: ${job.id}`, err);
  toast.error(`Falha ao executar limpeza: ${err.message}`);
});

// Eventos de sincronização
syncWorker.on('completed', (job) => {
  console.log(`[Queue] Sincronização completada: ${job.id}`);
});

syncWorker.on('failed', (job, err) => {
  console.error(`[Queue] Sincronização falhou: ${job.id}`, err);
  toast.error(`Falha na sincronização: ${err.message}`);
});

// ============================================================================
// AGENDADOR DE TAREFAS RECORRENTES
// ============================================================================

// const scheduler = new QueueScheduler('scheduler', {
//   connection: new Redis(redisConfig),
// });

// Agendar limpeza diária de logs antigos
export async function scheduleDailyCleanup() {
  await cleanupQueue.add('cleanup', {
    type: 'audit_logs',
    retentionDays: 90,
  }, {
    repeat: {
      pattern: '0 2 * * *', // 2h da manhã todos os dias
    },
  });
}

// Agendar relatórios semanais
export async function scheduleWeeklyReports() {
  await reportQueue.add('report', {
    type: 'weekly',
    unidadeId: 'all',
    format: 'pdf',
  }, {
    repeat: {
      pattern: '0 8 * * 1', // 8h da manhã toda segunda-feira
    },
  });
}

// Agendar sincronização com Google Calendar
export async function scheduleGoogleCalendarSync() {
  await syncQueue.add('sync', {
    type: 'google_calendar',
    entityId: 'all',
  }, {
    repeat: {
      pattern: '*/15 * * * *', // A cada 15 minutos
    },
  });
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

export async function initializeQueueSystem() {
  try {
    console.log('[Queue] Inicializando sistema de filas...');
    
    // Agendar tarefas recorrentes
    await scheduleDailyCleanup();
    await scheduleWeeklyReports();
    await scheduleGoogleCalendarSync();
    
    console.log('[Queue] Sistema de filas inicializado com sucesso');
    
    // Retornar estatísticas iniciais
    return await getQueueStats();
    
  } catch (error) {
    console.error('[Queue] Erro ao inicializar sistema de filas:', error);
    throw error;
  }
}

// ============================================================================
// LIMPEZA E FINALIZAÇÃO
// ============================================================================

export async function closeQueueSystem() {
  try {
    console.log('[Queue] Finalizando sistema de filas...');
    
    await Promise.all([
      notificationQueue.close(),
      reportQueue.close(),
      cleanupQueue.close(),
      syncQueue.close(),
      // scheduler.close(),
    ]);
    
    console.log('[Queue] Sistema de filas finalizado com sucesso');
    
  } catch (error) {
    console.error('[Queue] Erro ao finalizar sistema de filas:', error);
    throw error;
  }
}
