import { z } from 'zod'

/**
 * Esquemas de Validação para Notificações
 * 
 * Este arquivo centraliza todas as validações relacionadas a notificações,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para email
export const EmailSchema = z.string().email('Email deve ser válido')

// Validador para telefone brasileiro
export const PhoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números, espaços, parênteses, hífens e +')

// Validador para tipo de notificação
export const NotificationTypeSchema = z.enum([
  'whatsapp',
  'sms',
  'email',
  'push'
], {
  errorMap: () => ({ message: 'Tipo de notificação deve ser um dos valores permitidos' })
})

// Validador para status de notificação
export const NotificationStatusSchema = z.enum([
  'pending',
  'sent',
  'delivered',
  'failed',
  'cancelled'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Esquema para mensagem WhatsApp
export const WhatsAppMessageSchema = z.object({
  phoneNumber: PhoneSchema,
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem deve ter no máximo 1000 caracteres'),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  clientId: UUIDSchema.optional(),
  appointmentId: UUIDSchema.optional(),
})

// Esquema para mensagem SMS
export const SmsMessageSchema = z.object({
  phoneNumber: PhoneSchema,
  message: z.string().min(1, 'Mensagem é obrigatória').max(160, 'Mensagem deve ter no máximo 160 caracteres'),
  clientId: UUIDSchema.optional(),
  appointmentId: UUIDSchema.optional(),
})

// Esquema para email
export const EmailMessageSchema = z.object({
  to: EmailSchema,
  subject: z.string().min(1, 'Assunto é obrigatório').max(200, 'Assunto deve ter no máximo 200 caracteres'),
  body: z.string().min(1, 'Corpo do email é obrigatório'),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  clientId: UUIDSchema.optional(),
  appointmentId: UUIDSchema.optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string()
  })).optional(),
})

// Esquema para confirmação de agendamento
export const AppointmentConfirmationSchema = z.object({
  appointmentId: UUIDSchema,
  channels: z.array(NotificationTypeSchema).min(1, 'Pelo menos um canal deve ser selecionado'),
  customMessage: z.string().max(500, 'Mensagem personalizada deve ter no máximo 500 caracteres').optional(),
  sendReminder: z.boolean().default(true),
  reminderTime: z.number().min(1, 'Tempo de lembrete deve ser maior que 0').max(1440, 'Tempo de lembrete deve ser menor que 1440 minutos').default(60),
})

// Esquema para busca de notificações
export const SearchNotificationsSchema = z.object({
  clientId: UUIDSchema.optional(),
  appointmentId: UUIDSchema.optional(),
  type: NotificationTypeSchema.optional(),
  status: NotificationStatusSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['createdAt', 'sentAt', 'type', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Esquema para reenvio de notificação
export const ResendNotificationSchema = z.object({
  notificationId: UUIDSchema,
  reason: z.string().max(200, 'Motivo deve ter no máximo 200 caracteres').optional(),
})

// Tipos inferidos dos esquemas
export type WhatsAppMessageInput = z.infer<typeof WhatsAppMessageSchema>
export type SmsMessageInput = z.infer<typeof SmsMessageSchema>
export type EmailMessageInput = z.infer<typeof EmailMessageSchema>
export type AppointmentConfirmationInput = z.infer<typeof AppointmentConfirmationSchema>
export type SearchNotificationsInput = z.infer<typeof SearchNotificationsSchema>
export type ResendNotificationInput = z.infer<typeof ResendNotificationSchema>
export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>
