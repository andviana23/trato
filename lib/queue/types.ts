// Tipos para jobs de notificação
export interface NotificationJobData {
  type: 'whatsapp' | 'email' | 'sms';
  recipient: string;
  template: string;
  data: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
}

export interface WhatsAppJobData extends NotificationJobData {
  type: 'whatsapp';
  phoneNumber: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

export interface EmailJobData extends NotificationJobData {
  type: 'email';
  email: string;
  subject: string;
  template: string;
  variables?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface SMSJobData extends NotificationJobData {
  type: 'sms';
  phoneNumber: string;
  message: string;
}

// Tipos para jobs de agendamento
export interface ReminderJobData {
  appointmentId: string;
  clientId: string;
  appointmentDate: Date;
  reminderType: 'day_before' | 'hour_before' | 'confirmation';
}

export interface MonthlyBonusJobData {
  month: number;
  year: number;
  unidadeId?: string;
}

export interface CleanupJobData {
  type: 'audit_logs' | 'temp_files' | 'old_notifications';
  retentionDays: number;
}

// Tipos para resultados de jobs
export interface JobResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: Date;
  duration: number;
}

// Tipos para métricas de fila
export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  timestamp: Date;
}

// Tipos para configuração de templates
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para configuração de agendamento
export interface CronJobConfig {
  name: string;
  schedule: string; // Expressão cron
  handler: string;  // Nome da função/Server Action
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  description: string;
}

// Tipos para métricas de negócio
export interface BusinessMetrics {
  date: string;
  appointments: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  clients: {
    new: number;
    active: number;
    total: number;
  };
  revenue: {
    daily: number;
    monthly: number;
    averageTicket: number;
  };
  queue: {
    current: number;
    averageWaitTime: number;
  };
  bonuses: {
    totalCalculated: number;
    totalPaid: number;
    averageBonus: number;
  };
}

// Tipos para monitoramento de performance
export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  unidadeId?: string;
  error?: string;
}

// Tipos para alertas
export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}
