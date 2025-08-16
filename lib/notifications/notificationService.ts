import { 
  addWhatsAppJob, 
  addEmailJob, 
  addSMSJob,
  WhatsAppJobData,
  EmailJobData,
  SMSJobData
} from '../queue/notificationJobs';
import { 
  getTemplateById, 
  renderTemplate, 
  validateTemplateVariables,
  commonTemplates
} from './templates';
import { logAuditEvent } from '../audit';

// ============================================================================
// INTERFACES
// ============================================================================

export interface NotificationRequest {
  type: 'whatsapp' | 'email' | 'sms';
  templateId: string;
  recipient: string;
  variables: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
  userId?: string;
  unidadeId?: string;
}

export interface NotificationResult {
  success: boolean;
  jobId?: string;
  message: string;
  error?: string;
}

// ============================================================================
// SERVIÇO PRINCIPAL DE NOTIFICAÇÕES
// ============================================================================

export class NotificationService {
  
  /**
   * Envia uma notificação usando o template especificado
   */
  static async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    try {
      console.log(`📤 Enviando notificação ${request.type} para ${request.recipient}`);
      
      // Validar template
      const template = getTemplateById(request.templateId);
      if (!template) {
        throw new Error(`Template não encontrado: ${request.templateId}`);
      }
      
      if (!template.isActive) {
        throw new Error(`Template inativo: ${request.templateId}`);
      }
      
      // Validar variáveis
      if (!validateTemplateVariables(template, request.variables)) {
        throw new Error(`Variáveis obrigatórias não fornecidas para template: ${request.templateId}`);
      }
      
      // Renderizar conteúdo
      const content = renderTemplate(template, request.variables);
      
      // Adicionar job à fila apropriada
      let jobId: string;
      
      switch (request.type) {
        case 'whatsapp':
          const whatsappData: WhatsAppJobData = {
            type: 'whatsapp',
            recipient: request.recipient,
            template: request.templateId,
            data: request.variables,
            phoneNumber: request.recipient,
            message: content,
            variables: request.variables,
            priority: request.priority,
            scheduledFor: request.scheduledFor,
            userId: request.userId,
          };
          jobId = await addWhatsAppJob(whatsappData);
          break;
          
        case 'email':
          const emailData: EmailJobData = {
            type: 'email',
            recipient: request.recipient,
            template: request.templateId,
            data: request.variables,
            email: request.recipient,
            subject: template.subject || 'Notificação',
            template: request.templateId,
            variables: request.variables,
            priority: request.priority,
            scheduledFor: request.scheduledFor,
            userId: request.userId,
          };
          jobId = await addEmailJob(emailData);
          break;
          
        case 'sms':
          const smsData: SMSJobData = {
            type: 'sms',
            recipient: request.recipient,
            template: request.templateId,
            data: request.variables,
            phoneNumber: request.recipient,
            message: content,
            priority: request.priority,
            scheduledFor: request.scheduledFor,
            userId: request.userId,
          };
          jobId = await addSMSJob(smsData);
          break;
          
        default:
          throw new Error(`Tipo de notificação não suportado: ${request.type}`);
      }
      
      // Log de auditoria
      await logAuditEvent({
        userId: request.userId,
        action: 'NOTIFICATION_QUEUED',
        resource: 'NOTIFICATION',
        resourceId: jobId,
        metadata: {
          type: request.type,
          templateId: request.templateId,
          recipient: request.recipient,
          variables: request.variables,
          priority: request.priority,
          scheduledFor: request.scheduledFor,
          success: true,
        },
        success: true,
      });
      
      return {
        success: true,
        jobId,
        message: `Notificação ${request.type} adicionada à fila com sucesso`,
      };
      
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação ${request.type}:`, error);
      
      // Log de auditoria do erro
      await logAuditEvent({
        userId: request.userId,
        action: 'NOTIFICATION_FAILED',
        resource: 'NOTIFICATION',
        resourceId: 'unknown',
        metadata: {
          type: request.type,
          templateId: request.templateId,
          recipient: request.recipient,
          variables: request.variables,
          error: error.message,
          success: false,
        },
        success: false,
      });
      
      return {
        success: false,
        message: `Erro ao enviar notificação: ${error.message}`,
        error: error.message,
      };
    }
  }
  
  /**
   * Envia confirmação de agendamento
   */
  static async sendAppointmentConfirmation(
    clientPhone: string,
    clientEmail: string,
    appointmentData: {
      clientName: string;
      appointmentDate: string;
      appointmentTime: string;
      professionalName: string;
      unidadeName: string;
      serviceName: string;
    },
    userId?: string,
    unidadeId?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // Enviar WhatsApp
    if (clientPhone) {
      const whatsappResult = await this.sendNotification({
        type: 'whatsapp',
        templateId: commonTemplates.appointmentConfirmation.whatsapp!,
        recipient: clientPhone,
        variables: appointmentData,
        priority: 'high',
        userId,
        unidadeId,
      });
      results.push(whatsappResult);
    }
    
    // Enviar Email
    if (clientEmail) {
      const emailResult = await this.sendNotification({
        type: 'email',
        templateId: commonTemplates.appointmentConfirmation.email!,
        recipient: clientEmail,
        variables: appointmentData,
        priority: 'high',
        userId,
        unidadeId,
      });
      results.push(emailResult);
    }
    
    return results;
  }
  
  /**
   * Envia lembrete de agendamento
   */
  static async sendAppointmentReminder(
    clientPhone: string,
    clientEmail: string,
    appointmentData: {
      clientName: string;
      appointmentDate: string;
      appointmentTime: string;
      professionalName: string;
      unidadeName: string;
      phoneNumber: string;
    },
    userId?: string,
    unidadeId?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // Enviar WhatsApp
    if (clientPhone) {
      const whatsappResult = await this.sendNotification({
        type: 'whatsapp',
        templateId: commonTemplates.appointmentReminder.whatsapp!,
        recipient: clientPhone,
        variables: appointmentData,
        priority: 'normal',
        userId,
        unidadeId,
      });
      results.push(whatsappResult);
    }
    
    // Enviar Email
    if (clientEmail) {
      const emailResult = await this.sendNotification({
        type: 'email',
        templateId: commonTemplates.appointmentReminder.email!,
        recipient: clientEmail,
        variables: appointmentData,
        priority: 'normal',
        userId,
        unidadeId,
      });
      results.push(emailResult);
    }
    
    // Enviar SMS
    if (clientPhone) {
      const smsResult = await this.sendNotification({
        type: 'sms',
        templateId: commonTemplates.appointmentReminder.sms!,
        recipient: clientPhone,
        variables: appointmentData,
        priority: 'normal',
        userId,
        unidadeId,
      });
      results.push(smsResult);
    }
    
    return results;
  }
  
  /**
   * Envia confirmação de pagamento
   */
  static async sendPaymentConfirmation(
    clientPhone: string,
    clientEmail: string,
    paymentData: {
      clientName: string;
      amount: string;
      paymentDate: string;
      transactionId: string;
      paymentMethod: string;
      unidadeName: string;
    },
    userId?: string,
    unidadeId?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // Enviar WhatsApp
    if (clientPhone) {
      const whatsappResult = await this.sendNotification({
        type: 'whatsapp',
        templateId: commonTemplates.paymentConfirmation.whatsapp!,
        recipient: clientPhone,
        variables: paymentData,
        priority: 'high',
        userId,
        unidadeId,
      });
      results.push(whatsappResult);
    }
    
    // Enviar Email
    if (clientEmail) {
      const emailResult = await this.sendNotification({
        type: 'email',
        templateId: commonTemplates.paymentConfirmation.email!,
        recipient: clientEmail,
        variables: paymentData,
        priority: 'high',
        userId,
        unidadeId,
      });
      results.push(emailResult);
    }
    
    return results;
  }
  
  /**
   * Envia atualização de posição na fila
   */
  static async sendQueuePositionUpdate(
    clientPhone: string,
    queueData: {
      clientName: string;
      unidadeName: string;
      position: string;
      total: string;
      estimatedTime: string;
    },
    userId?: string,
    unidadeId?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // Enviar WhatsApp
    if (clientPhone) {
      const whatsappResult = await this.sendNotification({
        type: 'whatsapp',
        templateId: commonTemplates.queuePosition.whatsapp!,
        recipient: clientPhone,
        variables: queueData,
        priority: 'normal',
        userId,
        unidadeId,
      });
      results.push(whatsappResult);
    }
    
    // Enviar SMS
    if (clientPhone) {
      const smsResult = await this.sendNotification({
        type: 'sms',
        templateId: commonTemplates.queuePosition.sms!,
        recipient: clientPhone,
        variables: queueData,
        priority: 'normal',
        userId,
        unidadeId,
      });
      results.push(smsResult);
    }
    
    return results;
  }
  
  /**
   * Envia notificação personalizada
   */
  static async sendCustomNotification(
    type: 'whatsapp' | 'email' | 'sms',
    recipient: string,
    templateId: string,
    variables: Record<string, string>,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      scheduledFor?: Date;
      userId?: string;
      unidadeId?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      type,
      templateId,
      recipient,
      variables,
      priority: options?.priority || 'normal',
      scheduledFor: options?.scheduledFor,
      userId: options?.userId,
      unidadeId: options?.unidadeId,
    });
  }
  
  /**
   * Agenda notificação para envio futuro
   */
  static async scheduleNotification(
    type: 'whatsapp' | 'email' | 'sms',
    recipient: string,
    templateId: string,
    variables: Record<string, string>,
    scheduledFor: Date,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      userId?: string;
      unidadeId?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      type,
      templateId,
      recipient,
      variables,
      priority: options?.priority || 'normal',
      scheduledFor,
      userId: options?.userId,
      unidadeId: options?.unidadeId,
    });
  }
}

// ============================================================================
// FUNÇÕES DE UTILIDADE PARA USO DIRETO
// ============================================================================

export const sendNotification = NotificationService.sendNotification.bind(NotificationService);
export const sendAppointmentConfirmation = NotificationService.sendAppointmentConfirmation.bind(NotificationService);
export const sendAppointmentReminder = NotificationService.sendAppointmentReminder.bind(NotificationService);
export const sendPaymentConfirmation = NotificationService.sendPaymentConfirmation.bind(NotificationService);
export const sendQueuePositionUpdate = NotificationService.sendQueuePositionUpdate.bind(NotificationService);
export const sendCustomNotification = NotificationService.sendCustomNotification.bind(NotificationService);
export const scheduleNotification = NotificationService.scheduleNotification.bind(NotificationService);
