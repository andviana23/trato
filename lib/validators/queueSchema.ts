import { z } from 'zod'

/**
 * Esquemas de Validação para Fila de Atendimento
 * 
 * Este arquivo centraliza todas as validações relacionadas à fila de atendimento,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para status da fila
export const QueueStatusSchema = z.enum([
  'em espera',
  'em atendimento',
  'atendido',
  'cancelado',
  'faltou'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Esquema para adicionar cliente à fila
export const addToQueueSchema = z.object({
  clientId: UUIDSchema,
  serviceId: UUIDSchema,
  priority: z.number().min(1, 'Prioridade deve ser maior que 0').max(10, 'Prioridade deve ser menor ou igual a 10').default(5),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
  unidadeId: UUIDSchema.optional(),
})

// Esquema para atualizar posição na fila
export const updateQueuePositionSchema = z.object({
  queueId: UUIDSchema,
  newPosition: z.number().min(1, 'Posição deve ser maior que 0'),
})

// Esquema para chamar próximo da fila
export const callNextFromQueueSchema = z.object({
  queueId: UUIDSchema,
  professionalId: UUIDSchema.optional(),
})

// Esquema para atender próximo cliente
export const attendNextSchema = z.object({
  queueId: UUIDSchema,
  professionalId: UUIDSchema.optional(),
})

// Esquema para passar a vez
export const passaTurnSchema = z.object({
  queueId: UUIDSchema,
  reason: z.string().max(200, 'Motivo deve ter no máximo 200 caracteres').optional(),
})

// Esquema para reorganizar fila
export const reorganizeQueueSchema = z.object({
  queueIds: z.array(UUIDSchema).min(1, 'Lista de IDs não pode estar vazia'),
  unidadeId: UUIDSchema.optional(),
})

// Esquema para remover da fila
export const removeFromQueueSchema = z.object({
  queueId: UUIDSchema,
  reason: z.string().max(200, 'Motivo deve ter no máximo 200 caracteres').optional(),
})

// Esquema para busca na fila
export const searchQueueSchema = z.object({
  clientId: UUIDSchema.optional(),
  serviceId: UUIDSchema.optional(),
  status: QueueStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['position', 'createdAt', 'priority']).default('position'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Esquema para estatísticas da fila
export const queueStatsSchema = z.object({
  unidadeId: UUIDSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
})

// Tipos inferidos dos esquemas
export type AddToQueueInput = z.infer<typeof addToQueueSchema>
export type UpdateQueuePositionInput = z.infer<typeof updateQueuePositionSchema>
export type CallNextFromQueueInput = z.infer<typeof callNextFromQueueSchema>
export type AttendNextInput = z.infer<typeof attendNextSchema>
export type PassaTurnInput = z.infer<typeof passaTurnSchema>
export type ReorganizeQueueInput = z.infer<typeof reorganizeQueueSchema>
export type RemoveFromQueueInput = z.infer<typeof removeFromQueueSchema>
export type SearchQueueInput = z.infer<typeof searchQueueSchema>
export type QueueStatsInput = z.infer<typeof queueStatsSchema>
export type QueueStatus = z.infer<typeof QueueStatusSchema>
