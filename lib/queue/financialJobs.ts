import { Queue, Worker, Job } from 'bullmq';
import { redis } from './queueConfig';
import { processAutomaticRevenue } from '@/app/actions/financial';
import { logAuditEvent } from '../audit';

// ============================================================================
// CONFIGURAÇÃO DA FILA FINANCEIRA
// ============================================================================

// Fila para processamento de receitas automáticas
export const financialRevenueQueue = new Queue('financial-revenue-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

export interface PaymentWebhookData {
  event: string;
  payment: {
    id: string;
    customer: string;
    subscription?: string;
    description: string;
    value: number;
    date: string;
    nextDueDate: string;
    billingType: string;
    invoiceUrl?: string;
    transactionReceiptUrl?: string;
  };
  timestamp: string;
  webhookId: string;
}

export interface FinancialJobData {
  type: 'process-payment';
  data: PaymentWebhookData;
}

// ============================================================================
// WORKER PARA PROCESSAMENTO DE RECEITAS
// ============================================================================

const financialRevenueWorker = new Worker(
  'financial-revenue-processing',
  async (job: Job<FinancialJobData>) => {
    const { type, data } = job.data;
    
    try {
      console.log(`🔄 Processando job financeiro: ${type} - Pagamento ${data.payment.id}`);
      
      switch (type) {
        case 'process-payment':
          // Processar receita automática
          const result = await processAutomaticRevenue(data);
          
          if (result.success) {
            console.log(`✅ Receita processada com sucesso para pagamento ${data.payment.id}`);
            
            // Log de auditoria de sucesso
            await logAuditEvent(
              {
                userId: 'system',
                userEmail: 'system@trato.com',
                userRole: 'system',
                ipAddress: '127.0.0.1',
                userAgent: 'ASAAS Webhook',
                sessionId: data.webhookId,
              },
              'FINANCIAL_REVENUE_PROCESSED',
              'FINANCIAL',
              {
                paymentId: data.payment.id,
                customerId: data.payment.customer,
                value: data.payment.value,
                description: data.payment.description,
                result: result.data,
              }
            );
            
            return {
              success: true,
              paymentId: data.payment.id,
              revenueId: result.data?.id,
              message: 'Receita processada com sucesso',
            };
          } else {
            throw new Error(`Falha ao processar receita: ${result.error}`);
          }
          
        default:
          throw new Error(`Tipo de job desconhecido: ${type}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar job financeiro ${job.id}:`, error);
      
      // Log de auditoria de erro
      try {
        await logAuditEvent(
          {
            userId: 'system',
            userEmail: 'system@trato.com',
            userRole: 'system',
            ipAddress: '127.0.0.1',
            userAgent: 'ASAAS Webhook',
            sessionId: data.webhookId,
          },
          'FINANCIAL_REVENUE_PROCESSING_FAILED',
          'FINANCIAL',
          {
            paymentId: data.payment.id,
            customerId: data.payment.customer,
            value: data.payment.value,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            jobId: job.id,
          }
        );
      } catch (auditError) {
        console.error('❌ Erro ao registrar log de auditoria:', auditError);
      }
      
      // Re-throw para permitir retry
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // Processar 3 jobs simultaneamente
    removeOnComplete: 100,
    removeOnFail: 50,
  }
);

// ============================================================================
// EVENTOS DO WORKER
// ============================================================================

financialRevenueWorker.on('completed', (job: Job<FinancialJobData>) => {
  console.log(`✅ Job financeiro ${job.id} completado com sucesso`);
});

financialRevenueWorker.on('failed', (job: Job<FinancialJobData> | undefined, err: Error) => {
  if (job) {
    console.error(`❌ Job financeiro ${job.id} falhou:`, err.message);
  } else {
    console.error('❌ Job financeiro falhou (job undefined):', err.message);
  }
});

financialRevenueWorker.on('error', (err: Error) => {
  console.error('❌ Erro no worker financeiro:', err);
});

financialRevenueWorker.on('stalled', (jobId: string) => {
  console.warn(`⚠️ Job financeiro ${jobId} travou`);
});

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Obtém estatísticas da fila financeira
 */
async function getFinancialQueueStats() {
  try {
    const waiting = await financialRevenueQueue.getWaiting();
    const active = await financialRevenueQueue.getActive();
    const completed = await financialRevenueQueue.getCompleted();
    const failed = await financialRevenueQueue.getFailed();
    const delayed = await financialRevenueQueue.getDelayed();
    const paused = await financialRevenueQueue.getPaused();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: paused.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length + paused.length,
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas da fila financeira:', error);
    return null;
  }
}

/**
 * Limpa jobs antigos da fila financeira
 */
async function cleanFinancialQueue() {
  try {
    const completed = await financialRevenueQueue.clean(0, 'completed');
    const failed = await financialRevenueQueue.clean(0, 'failed');
    
    console.log(`🧹 Fila financeira limpa: ${completed.length} completados, ${failed.length} falhados removidos`);
    
    return { completed: completed.length, failed: failed.length };
  } catch (error) {
    console.error('❌ Erro ao limpar fila financeira:', error);
    return null;
  }
}

/**
 * Pausa a fila financeira
 */
async function pauseFinancialQueue() {
  try {
    await financialRevenueQueue.pause();
    console.log('⏸️ Fila financeira pausada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao pausar fila financeira:', error);
    return false;
  }
}

/**
 * Resume a fila financeira
 */
async function resumeFinancialQueue() {
  try {
    await financialRevenueQueue.resume();
    console.log('▶️ Fila financeira resumida');
    return true;
  } catch (error) {
    console.error('❌ Erro ao resumir fila financeira:', error);
    return false;
  }
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export {
  financialRevenueWorker,
  getFinancialQueueStats,
  cleanFinancialQueue,
  pauseFinancialQueue,
  resumeFinancialQueue,
};
