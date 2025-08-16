import { Queue, Worker, Job } from 'bullmq';
import { redis, jobConfigs, queueConfigs } from './queueConfig';
import { 
  WhatsAppJobData, 
  EmailJobData, 
  SMSJobData, 
  JobResult 
} from './types';
import { logAuditEvent } from '../audit';

// ============================================================================
// FILAS DE NOTIFICAÇÃO
// ============================================================================

// Fila para notificações WhatsApp
export const whatsappQueue = new Queue('whatsapp-notifications', {
  connection: redis,
  defaultJobOptions: jobConfigs.notifications,
});

// Fila para notificações de email
export const emailQueue = new Queue('email-notifications', {
  connection: redis,
  defaultJobOptions: jobConfigs.notifications,
});

// Fila para notificações SMS
export const smsQueue = new Queue('sms-notifications', {
  connection: redis,
  defaultJobOptions: jobConfigs.notifications,
});

// ============================================================================
// WORKERS DE PROCESSAMENTO
// ============================================================================

// Worker para WhatsApp
export const whatsappWorker = new Worker('whatsapp-notifications', async (job: Job<WhatsAppJobData>) => {
  const startTime = Date.now();
  const { phoneNumber, message, template, variables } = job.data;
  
  try {
    console.log(`📱 Processando notificação WhatsApp para ${phoneNumber}`);
    
    // Aqui você implementaria a integração real com a API do WhatsApp
    // Por exemplo, usando a API oficial do WhatsApp Business ou serviços como Twilio
    const result = await sendWhatsAppMessage(phoneNumber, message, template, variables);
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria
    await logAuditEvent({
      userId: job.data.userId,
      action: 'WHATSAPP_SENT',
      resource: 'NOTIFICATION',
      resourceId: job.id,
      metadata: {
        phoneNumber,
        template,
        variables,
        duration,
        success: true,
      },
      success: true,
    });
    
    return {
      success: true,
      message: 'WhatsApp enviado com sucesso',
      data: result,
      timestamp: new Date(),
      duration,
    } as JobResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao enviar WhatsApp para ${phoneNumber}:`, error);
    
    // Log de auditoria do erro
    await logAuditEvent({
      userId: job.data.userId,
      action: 'WHATSAPP_FAILED',
      resource: 'NOTIFICATION',
      resourceId: job.id,
      metadata: {
        phoneNumber,
        template,
        variables,
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
  concurrency: queueConfigs.notifications.concurrency,
});

// Worker para Email
export const emailWorker = new Worker('email-notifications', async (job: Job<EmailJobData>) => {
  const startTime = Date.now();
  const { email, subject, template, variables, attachments } = job.data;
  
  try {
    console.log(`📧 Processando notificação de email para ${email}`);
    
    // Aqui você implementaria o envio real de email
    // Por exemplo, usando Nodemailer, SendGrid, ou AWS SES
    const result = await sendEmail(email, subject, template, variables, attachments);
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria
    await logAuditEvent({
      userId: job.data.userId,
      action: 'EMAIL_SENT',
      resource: 'NOTIFICATION',
      resourceId: job.id,
      metadata: {
        email,
        subject,
        template,
        variables,
        duration,
        success: true,
      },
      success: true,
    });
    
    return {
      success: true,
      message: 'Email enviado com sucesso',
      data: result,
      timestamp: new Date(),
      duration,
    } as JobResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao enviar email para ${email}:`, error);
    
    // Log de auditoria do erro
    await logAuditEvent({
      userId: job.data.userId,
      action: 'EMAIL_FAILED',
      resource: 'NOTIFICATION',
      resourceId: job.id,
      metadata: {
        email,
        subject,
        template,
        variables,
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
  concurrency: queueConfigs.notifications.concurrency,
});

// Worker para SMS
export const smsWorker = new Worker('sms-notifications', async (job: Job<SMSJobData>) => {
  const startTime = Date.now();
  const { phoneNumber, message } = job.data;
  
  try {
    console.log(`📱 Processando notificação SMS para ${phoneNumber}`);
    
    // Aqui você implementaria o envio real de SMS
    // Por exemplo, usando Twilio, AWS SNS, ou outros provedores
    const result = await sendSMS(phoneNumber, message);
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria
    await logAuditEvent({
      userId: job.data.userId,
      action: 'SMS_SENT',
      resource: 'NOTIFICATION',
      resourceId: job.id,
      metadata: {
        phoneNumber,
        message,
        duration,
        success: true,
      },
      success: true,
    });
    
    return {
      success: true,
      message: 'SMS enviado com sucesso',
      data: result,
      timestamp: new Date(),
      duration,
    } as JobResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao enviar SMS para ${phoneNumber}:`, error);
    
    // Log de auditoria do erro
    await logAuditEvent({
      userId: job.data.userId,
      action: 'SMS_FAILED',
      resource: 'NOTIFICATION',
      resourceId: job.id,
      metadata: {
        phoneNumber,
        message,
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
  concurrency: queueConfigs.notifications.concurrency,
});

// ============================================================================
// FUNÇÕES DE ENVIO (IMPLEMENTAÇÕES MOCK - SUBSTITUA PELAS REAIS)
// ============================================================================

async function sendWhatsAppMessage(
  phoneNumber: string, 
  message: string, 
  template?: string, 
  variables?: Record<string, string>
): Promise<any> {
  // Simular delay de envio
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Aqui você implementaria a integração real com a API do WhatsApp
  console.log(`📱 WhatsApp enviado para ${phoneNumber}: ${message}`);
  
  return {
    messageId: `wa_${Date.now()}`,
    status: 'sent',
    timestamp: new Date(),
  };
}

async function sendEmail(
  email: string, 
  subject: string, 
  template: string, 
  variables?: Record<string, string>,
  attachments?: Array<{ filename: string; content: string; contentType: string }>
): Promise<any> {
  // Simular delay de envio
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Aqui você implementaria o envio real de email
  console.log(`📧 Email enviado para ${email}: ${subject}`);
  
  return {
    messageId: `email_${Date.now()}`,
    status: 'sent',
    timestamp: new Date(),
  };
}

async function sendSMS(phoneNumber: string, message: string): Promise<any> {
  // Simular delay de envio
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Aqui você implementaria o envio real de SMS
  console.log(`📱 SMS enviado para ${phoneNumber}: ${message}`);
  
  return {
    messageId: `sms_${Date.now()}`,
    status: 'sent',
    timestamp: new Date(),
  };
}

// ============================================================================
// FUNÇÕES DE UTILIDADE PARA ADICIONAR JOBS ÀS FILAS
// ============================================================================

export async function addWhatsAppJob(data: WhatsAppJobData): Promise<string> {
  const job = await whatsappQueue.add('send-whatsapp', data, {
    priority: data.priority === 'high' ? 1 : data.priority === 'low' ? 3 : 2,
    delay: data.scheduledFor ? new Date(data.scheduledFor).getTime() - Date.now() : 0,
  });
  
  console.log(`📱 Job WhatsApp adicionado à fila: ${job.id}`);
  return job.id;
}

export async function addEmailJob(data: EmailJobData): Promise<string> {
  const job = await emailQueue.add('send-email', data, {
    priority: data.priority === 'high' ? 1 : data.priority === 'low' ? 3 : 2,
    delay: data.scheduledFor ? new Date(data.scheduledFor).getTime() - Date.now() : 0,
  });
  
  console.log(`📧 Job Email adicionado à fila: ${job.id}`);
  return job.id;
}

export async function addSMSJob(data: SMSJobData): Promise<string> {
  const job = await smsQueue.add('send-sms', data, {
    priority: data.priority === 'high' ? 1 : data.priority === 'low' ? 3 : 2,
    delay: data.scheduledFor ? new Date(data.scheduledFor).getTime() - Date.now() : 0,
  });
  
  console.log(`📱 Job SMS adicionado à fila: ${job.id}`);
  return job.id;
}

// ============================================================================
// FUNÇÕES DE MONITORAMENTO DAS FILAS
// ============================================================================

export async function getNotificationQueueStats() {
  const [whatsappStats, emailStats, smsStats] = await Promise.all([
    whatsappQueue.getJobCounts(),
    emailQueue.getJobCounts(),
    smsQueue.getJobCounts(),
  ]);
  
  return {
    whatsapp: {
      queueName: 'whatsapp-notifications',
      ...whatsappStats,
      timestamp: new Date(),
    },
    email: {
      queueName: 'email-notifications',
      ...emailStats,
      timestamp: new Date(),
    },
    sms: {
      queueName: 'sms-notifications',
      ...smsStats,
      timestamp: new Date(),
    },
  };
}

export async function clearNotificationQueues() {
  await Promise.all([
    whatsappQueue.clean(0, 'completed'),
    whatsappQueue.clean(0, 'failed'),
    emailQueue.clean(0, 'completed'),
    emailQueue.clean(0, 'failed'),
    smsQueue.clean(0, 'completed'),
    smsQueue.clean(0, 'failed'),
  ]);
  
  console.log('🧹 Filas de notificação limpas');
}

// ============================================================================
// INICIALIZAÇÃO DOS WORKERS
// ============================================================================

export function initializeNotificationWorkers() {
  console.log('🚀 Inicializando workers de notificação...');
  
  // Configurar handlers de eventos para os workers
  whatsappWorker.on('completed', (job) => {
    console.log(`✅ WhatsApp job ${job.id} completado com sucesso`);
  });
  
  whatsappWorker.on('failed', (job, err) => {
    console.error(`❌ WhatsApp job ${job.id} falhou:`, err.message);
  });
  
  emailWorker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completado com sucesso`);
  });
  
  emailWorker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job.id} falhou:`, err.message);
  });
  
  smsWorker.on('completed', (job) => {
    console.log(`✅ SMS job ${job.id} completado com sucesso`);
  });
  
  smsWorker.on('failed', (job, err) => {
    console.error(`❌ SMS job ${job.id} falhou:`, err.message);
  });
  
  console.log('✅ Workers de notificação inicializados');
}
