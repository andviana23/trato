/**
 * Tipos para o sistema de agendamentos
 */

export interface Appointment {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  unidade_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  servicos?: AppointmentService[];
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
  // Campos relacionados (populados via join)
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  barbeiro_nome?: string;
  unidade_nome?: string;
}

export type AppointmentStatus = 
  | 'agendado'
  | 'confirmado'
  | 'atendido'
  | 'cancelado'
  | 'no_show'
  | 'bloqueado';

export interface AppointmentService {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number;
  categoria?: string;
}

export interface AppointmentConflict {
  id: string;
  start: string;
  end: string;
  resourceId: string;
  clientName?: string;
  serviceName?: string;
  status: AppointmentStatus;
}

// Inputs para operações
export interface CreateAppointmentInput {
  cliente_id: string;
  barbeiro_id: string;
  unidade_id: string;
  start_at: string;
  end_at: string;
  servicos?: string[]; // IDs dos serviços
  observacoes?: string;
}

export interface UpdateAppointmentInput {
  appointmentId: string;
  start_at?: string;
  end_at?: string;
  barbeiro_id?: string;
  servicos?: string[];
  observacoes?: string;
  status?: AppointmentStatus;
}

export interface MoveAppointmentInput {
  appointmentId: string;
  start_at: string;
  end_at: string;
  barbeiro_id?: string;
}

export interface ResizeAppointmentInput {
  appointmentId: string;
  end_at: string;
}

// Filtros para busca
export interface AppointmentFilters {
  id?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  unidadeId?: string;
  professionalId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  serviceId?: string;
}

// Resultados de busca
export interface AppointmentSearchResult {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Estatísticas
export interface AppointmentStats {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  byProfessional: Record<string, number>;
  byService: Record<string, number>;
  averageDuration: number;
  occupancyRate: number;
}

// Períodos bloqueados
export interface BlockedRange {
  id: string;
  resourceId: string;
  startISO: string;
  endISO: string;
  reason: string;
  created_at: string;
}

// Recursos (profissionais)
export interface AppointmentResource {
  resourceId: string;
  resourceTitle: string;
  color: string;
  isAvailable: boolean;
  specialties?: string[];
  workingHours?: {
    start: string;
    end: string;
    days: number[]; // 0-6 (domingo-sábado)
  };
}

// Configurações da agenda
export interface AgendaConfig {
  startHour: number;
  endHour: number;
  slotMinutes: number;
  workingDays: number[]; // 0-6 (domingo-sábado)
  timezone: string;
  allowOverlap: boolean;
  maxConcurrentAppointments: number;
}

// Eventos de drag & drop
export interface AppointmentDragEvent {
  appointmentId: string;
  start_at: string;
  end_at: string;
  resourceId: string;
}

export interface AppointmentResizeEvent {
  appointmentId: string;
  end_at: string;
}

// Notificações
export interface AppointmentNotification {
  id: string;
  appointmentId: string;
  type: 'reminder_24h' | 'reminder_1h' | 'reminder_15min' | 'confirmation' | 'cancellation';
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'pending' | 'sent' | 'failed';
  scheduled_for: string;
  sent_at?: string;
  error_message?: string;
}

// Histórico de mudanças
export interface AppointmentHistory {
  id: string;
  appointmentId: string;
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'resized' | 'status_changed';
  changes: Record<string, { from: any; to: any }>;
  changed_by: string;
  changed_at: string;
  reason?: string;
}
