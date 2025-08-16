import { z } from 'zod'

/**
 * Esquemas de Validação para Agendamentos
 * 
 * Este arquivo centraliza todas as validações relacionadas a agendamentos,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para data ISO
export const DateISOSchema = z.string().datetime('Data deve estar no formato ISO')

// Validador para horário de início (deve ser no futuro)
export const StartTimeSchema = DateISOSchema.refine(
  (date) => new Date(date) > new Date(),
  {
    message: 'Data de início deve ser no futuro',
    path: ['startTime']
  }
)

// Validador para horário de fim (deve ser posterior ao início)
export const EndTimeSchema = DateISOSchema

// Validador para status de agendamento
export const AppointmentStatusSchema = z.enum([
  'agendado',
  'confirmado',
  'atendido',
  'cancelado',
  'faltou',
  'em-andamento'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Validador para status de pagamento
export const PaymentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'received',
  'failed',
  'refunded'
], {
  errorMap: () => ({ message: 'Status de pagamento deve ser um dos valores permitidos' })
})

// Esquema base para agendamento
export const AppointmentBaseSchema = z.object({
  clientId: UUIDSchema,
  professionalId: UUIDSchema,
  serviceId: UUIDSchema,
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  unidadeId: UUIDSchema,
  notes: z.string().optional(),
})

// Esquema para criação de agendamento
export const createAppointmentSchema = AppointmentBaseSchema.refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
)

// Esquema para atualização de agendamento
export const updateAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  clientId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  serviceId: UUIDSchema.optional(),
  startTime: StartTimeSchema.optional(),
  endTime: EndTimeSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  status: AppointmentStatusSchema.optional(),
  notes: z.string().optional(),
  paymentStatus: PaymentStatusSchema.optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.endTime) > new Date(data.startTime)
    }
    return true
  },
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
)

// Esquema para cancelamento de agendamento
export const cancelAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  reason: z.string().min(1, 'Motivo do cancelamento é obrigatório').optional(),
})

// Esquema para confirmação de agendamento
export const confirmAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  notes: z.string().optional(),
})

// Esquema para início de agendamento
export const startAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  notes: z.string().optional(),
})

// Esquema para finalização de agendamento
export const finishAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  notes: z.string().optional(),
  paymentStatus: PaymentStatusSchema.optional(),
})

// Esquema para reagendamento
export const rescheduleAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  notes: z.string().optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
)

// Esquema para verificação de conflitos
export const checkConflictsSchema = z.object({
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  professionalId: UUIDSchema.optional(),
  excludeAppointmentId: UUIDSchema.optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
)

// Esquema para bloqueio de horário
export const blockTimeSlotSchema = z.object({
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  professionalId: UUIDSchema.optional(),
  reason: z.string().min(1, 'Motivo do bloqueio é obrigatório'),
  unidadeId: UUIDSchema,
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endDate']
  }
)

// Esquema para busca de agendamentos
export const searchAppointmentsSchema = z.object({
  clientId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  serviceId: UUIDSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  status: AppointmentStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  startDate: DateISOSchema.optional(),
  endDate: DateISOSchema.optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['startTime', 'createdAt', 'updatedAt']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Tipos inferidos dos esquemas
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>
export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>
export type StartAppointmentInput = z.infer<typeof startAppointmentSchema>
export type FinishAppointmentInput = z.infer<typeof finishAppointmentSchema>
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>
export type CheckConflictsInput = z.infer<typeof checkConflictsSchema>
export type BlockTimeSlotInput = z.infer<typeof blockTimeSlotSchema>
export type SearchAppointmentsInput = z.infer<typeof searchAppointmentsSchema>
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
