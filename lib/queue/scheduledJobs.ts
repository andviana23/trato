import { Queue, Worker, Job } from 'bullmq';
import { redis, jobConfigs, queueConfigs } from './queueConfig';
import { 
  ReminderJobData, 
  MonthlyBonusJobData, 
  CleanupJobData,
  JobResult 
} from './types';
import { logAuditEvent } from '../audit';

// ============================================================================
// FILAS DE JOBS AGENDADOS
// ============================================================================

// Fila para lembretes de agendamento
export const reminderQueue = new Queue('appointment-reminders', {
  connection: redis,
  defaultJobOptions: jobConfigs.reminders,
});

// Fila para cálculos mensais de bônus
export const monthlyBonusQueue = new Queue('monthly-bonus', {
  connection: redis,
  defaultJobOptions: jobConfigs.monthlyBonus,
});

// Fila para limpeza e manutenção
export const cleanupQueue = new Queue('system-cleanup', {
  connection: redis,
  defaultJobOptions: jobConfigs.cleanup,
});

// ============================================================================
// WORKERS DE PROCESSAMENTO
// ============================================================================

// Worker para lembretes de agendamento
export const reminderWorker = new Worker('appointment-reminders', async (job: Job<ReminderJobData>) => {
  const startTime = Date.now();
  const { appointmentId, clientId, appointmentDate, reminderType } = job.data;
  
  try {
    console.log(`⏰ Processando lembrete ${reminderType} para agendamento ${appointmentId}`);
    
    // Aqui você implementaria a lógica de envio de lembretes
    // Por exemplo, buscar dados do agendamento e enviar notificações
    const result = await processAppointmentReminder(appointmentId, clientId, appointmentDate, reminderType);
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria
    await logAuditEvent({
      userId: 'system',
      action: 'REMINDER_PROCESSED',
      resource: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: {
        appointmentId,
        clientId,
        appointmentDate,
        reminderType,
        duration,
        success: true,
      },
      success: true,
    });
    
    return {
      success: true,
      message: `Lembrete ${reminderType} processado com sucesso`,
      data: result,
      timestamp: new Date(),
      duration,
    } as JobResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao processar lembrete ${reminderType}:`, error);
    
    // Log de auditoria do erro
    await logAuditEvent({
      userId: 'system',
      action: 'REMINDER_FAILED',
      resource: 'APPOINTMENT',
      resourceId: appointmentId,
      metadata: {
        appointmentId,
        clientId,
        appointmentDate,
        reminderType,
        duration,
        error: error.message,
        success: false,
      },
      success: false,
    });
    
    throw error;
  }
}, {
  connection: redis,
  concurrency: queueConfigs.reminders.concurrency,
});

// Worker para cálculos mensais de bônus
export const monthlyBonusWorker = new Worker('monthly-bonus', async (job: Job<MonthlyBonusJobData>) => {
  const startTime = Date.now();
  const { month, year, unidadeId } = job.data;
  
  try {
    console.log(`💰 Processando cálculo de bônus para ${month}/${year}${unidadeId ? ` - Unidade: ${unidadeId}` : ''}`);
    
    // Aqui você implementaria a lógica de cálculo de bônus mensal
    // Por exemplo, chamar a Server Action applyMonthlyBonus
    const result = await processMonthlyBonus(month, year, unidadeId);
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria
    await logAuditEvent({
      userId: 'system',
      action: 'MONTHLY_BONUS_CALCULATED',
      resource: 'BONUS',
      resourceId: `${month}-${year}`,
      metadata: {
        month,
        year,
        unidadeId,
        duration,
        success: true,
        result,
      },
      success: true,
    });
    
    return {
      success: true,
      message: `Bônus mensal calculado com sucesso para ${month}/${year}`,
      data: result,
      timestamp: new Date(),
      duration,
    } as JobResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao calcular bônus mensal ${month}/${year}:`, error);
    
    // Log de auditoria do erro
    await logAuditEvent({
      userId: 'system',
      action: 'MONTHLY_BONUS_FAILED',
      resource: 'BONUS',
      resourceId: `${month}-${year}`,
      metadata: {
        month,
        year,
        unidadeId,
        duration,
        error: error.message,
        success: false,
      },
      success: false,
    });
    
    throw error;
  }
}, {
  connection: redis,
  concurrency: queueConfigs.monthlyBonus.concurrency,
});

// Worker para limpeza e manutenção
export const cleanupWorker = new Worker('system-cleanup', async (job: Job<CleanupJobData>) => {
  const startTime = Date.now();
  const { type, retentionDays } = job.data;
  
  try {
    console.log(`🧹 Processando limpeza do tipo: ${type}`);
    
    // Aqui você implementaria a lógica de limpeza
    const result = await processCleanup(type, retentionDays);
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria
    await logAuditEvent({
      userId: 'system',
      action: 'CLEANUP_COMPLETED',
      resource: 'SYSTEM',
      resourceId: type,
      metadata: {
        type,
        retentionDays,
        duration,
        success: true,
        result,
      },
      success: true,
    });
    
    return {
      success: true,
      message: `Limpeza ${type} concluída com sucesso`,
      data: result,
      timestamp: new Date(),
      duration,
    } as JobResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao processar limpeza ${type}:`, error);
    
    // Log de auditoria do erro
    await logAuditEvent({
      userId: 'system',
      action: 'CLEANUP_FAILED',
      resource: 'SYSTEM',
      resourceId: type,
      metadata: {
        type,
        retentionDays,
        duration,
        error: error.message,
        success: false,
      },
      success: false,
    });
    
    throw error;
  }
}, {
  connection: redis,
  concurrency: queueConfigs.cleanup.concurrency,
});

// ============================================================================
// FUNÇÕES DE PROCESSAMENTO (IMPLEMENTAÇÕES MOCK - SUBSTITUA PELAS REAIS)
// ============================================================================

async function processAppointmentReminder(
  appointmentId: string, 
  clientId: string, 
  appointmentDate: Date, 
  reminderType: 'day_before' | 'hour_before' | 'confirmation'
): Promise<any> {
  // Simular processamento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`⏰ Lembrete ${reminderType} processado para agendamento ${appointmentId}`);
  
  // Aqui você implementaria:
  // 1. Buscar dados do agendamento no banco
  // 2. Buscar dados do cliente
  // 3. Enviar notificações usando o NotificationService
  
  return {
    appointmentId,
    clientId,
    reminderType,
    processedAt: new Date(),
  };
}

async function processMonthlyBonus(month: number, year: number, unidadeId?: string): Promise<any> {
  // Simular processamento
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`💰 Bônus mensal processado para ${month}/${year}`);
  
  // Aqui você implementaria:
  // 1. Chamar a Server Action applyMonthlyBonus
  // 2. Processar todas as unidades ou uma específica
  // 3. Calcular e aplicar bônus
  
  return {
    month,
    year,
    unidadeId,
    processedAt: new Date(),
    totalBonus: Math.random() * 1000, // Mock
  };
}

async function processCleanup(type: string, retentionDays: number): Promise<any> {
  // Simular processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`🧹 Limpeza ${type} processada com retenção de ${retentionDays} dias`);
  
  // Aqui você implementaria:
  // 1. Limpeza de logs antigos
  // 2. Limpeza de arquivos temporários
  // 3. Limpeza de notificações antigas
  
  return {
    type,
    retentionDays,
    cleanedAt: new Date(),
    itemsRemoved: Math.floor(Math.random() * 100), // Mock
  };
}

// ============================================================================
// FUNÇÕES DE UTILIDADE PARA AGENDAR JOBS
// ============================================================================

/**
 * Agenda lembretes de agendamento
 */
export async function scheduleAppointmentReminders(): Promise<void> {
  try {
    console.log('📅 Agendando lembretes de agendamento...');
    
    // Buscar agendamentos para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Aqui você implementaria a busca real no banco
    const appointments = await getAppointmentsForDate(tomorrow);
    
    for (const appointment of appointments) {
      // Agendar lembrete para o dia anterior
      const reminderDate = new Date(appointment.date);
      reminderDate.setDate(reminderDate.getDate() - 1);
      
      await reminderQueue.add('appointment-reminder', {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        appointmentDate: appointment.date,
        reminderType: 'day_before',
      }, {
        delay: reminderDate.getTime() - Date.now(),
        priority: 2,
      });
      
      // Agendar lembrete para 1 hora antes
      const hourBeforeDate = new Date(appointment.date);
      hourBeforeDate.setHours(hourBeforeDate.getHours() - 1);
      
      await reminderQueue.add('appointment-reminder', {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        appointmentDate: appointment.date,
        reminderType: 'hour_before',
      }, {
        delay: hourBeforeDate.getTime() - Date.now(),
        priority: 1, // Prioridade alta para lembretes próximos
      });
    }
    
    console.log(`✅ ${appointments.length} lembretes agendados`);
    
  } catch (error) {
    console.error('❌ Erro ao agendar lembretes:', error);
    throw error;
  }
}

/**
 * Agenda cálculo de bônus mensal
 */
export async function scheduleMonthlyBonusCalculation(): Promise<void> {
  try {
    console.log('📅 Agendando cálculo de bônus mensal...');
    
    // Calcular primeiro dia do próximo mês
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Agendar para 00:05 do primeiro dia do mês
    nextMonth.setHours(0, 5, 0, 0);
    
    await monthlyBonusQueue.add('monthly-bonus', {
      month: nextMonth.getMonth() + 1,
      year: nextMonth.getFullYear(),
    }, {
      delay: nextMonth.getTime() - Date.now(),
      priority: 3,
    });
    
    console.log(`✅ Cálculo de bônus agendado para ${nextMonth.toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Erro ao agendar cálculo de bônus:', error);
    throw error;
  }
}

/**
 * Agenda limpeza do sistema
 */
export async function scheduleSystemCleanup(): Promise<void> {
  try {
    console.log('📅 Agendando limpeza do sistema...');
    
    // Limpeza diária às 02:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    
    await cleanupQueue.add('daily-cleanup', {
      type: 'audit_logs',
      retentionDays: 90, // Manter logs por 90 dias
    }, {
      delay: tomorrow.getTime() - Date.now(),
      priority: 4,
      repeat: {
        pattern: '0 2 * * *', // Todos os dias às 02:00
      },
    });
    
    // Limpeza semanal aos domingos às 03:00
    const nextSunday = new Date();
    const daysUntilSunday = 7 - nextSunday.getDay();
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(3, 0, 0, 0);
    
    await cleanupQueue.add('weekly-cleanup', {
      type: 'temp_files',
      retentionDays: 7, // Manter arquivos por 7 dias
    }, {
      delay: nextSunday.getTime() - Date.now(),
      priority: 4,
      repeat: {
        pattern: '0 3 * * 0', // Todos os domingos às 03:00
      },
    });
    
    console.log('✅ Limpeza do sistema agendada');
    
  } catch (error) {
    console.error('❌ Erro ao agendar limpeza:', error);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function getAppointmentsForDate(date: Date): Promise<any[]> {
  // Mock - substitua pela implementação real
  return [
    {
      id: 'app-1',
      clientId: 'client-1',
      date: date,
      time: '10:00',
    },
    {
      id: 'app-2',
      clientId: 'client-2',
      date: date,
      time: '14:00',
    },
  ];
}

// ============================================================================
// INICIALIZAÇÃO DOS WORKERS
// ============================================================================

export function initializeScheduledWorkers() {
  console.log('🚀 Inicializando workers de jobs agendados...');
  
  // Configurar handlers de eventos para os workers
  reminderWorker.on('completed', (job) => {
    console.log(`✅ Reminder job ${job.id} completado com sucesso`);
  });
  
  reminderWorker.on('failed', (job, err) => {
    console.error(`❌ Reminder job ${job.id} falhou:`, err.message);
  });
  
  monthlyBonusWorker.on('completed', (job) => {
    console.log(`✅ Monthly bonus job ${job.id} completado com sucesso`);
  });
  
  monthlyBonusWorker.on('failed', (job, err) => {
    console.error(`❌ Monthly bonus job ${job.id} falhou:`, err.message);
  });
  
  cleanupWorker.on('completed', (job) => {
    console.log(`✅ Cleanup job ${job.id} completado com sucesso`);
  });
  
  cleanupWorker.on('failed', (job, err) => {
    console.error(`❌ Cleanup job ${job.id} falhou:`, err.message);
  });
  
  console.log('✅ Workers de jobs agendados inicializados');
}

// ============================================================================
// FUNÇÃO DE INICIALIZAÇÃO COMPLETA
// ============================================================================

export async function initializeScheduledJobs(): Promise<void> {
  try {
    console.log('🚀 Inicializando sistema de jobs agendados...');
    
    // Inicializar workers
    initializeScheduledWorkers();
    
    // Agendar jobs iniciais
    await scheduleAppointmentReminders();
    await scheduleMonthlyBonusCalculation();
    await scheduleSystemCleanup();
    
    console.log('✅ Sistema de jobs agendados inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar jobs agendados:', error);
    throw error;
  }
}
