import { z } from 'zod'

/**
 * Esquemas de Validação para Bloqueios de Horário
 * 
 * Este arquivo centraliza todas as validações relacionadas a bloqueios de horário,
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

// Validador para tipo de bloqueio
export const BlockTypeSchema = z.enum([
  'lunch',
  'break',
  'meeting',
  'maintenance',
  'holiday',
  'vacation',
  'other'
], {
  errorMap: () => ({ message: 'Tipo de bloqueio deve ser um dos valores permitidos' })
})

// Validador para recorrência
export const RecurrenceSchema = z.enum([
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly'
], {
  errorMap: () => ({ message: 'Recorrência deve ser um dos valores permitidos' })
})

// Esquema para criação de bloqueio de horário
export const CreateTimeBlockSchema = z.object({
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  reason: z.string().min(1, 'Motivo do bloqueio é obrigatório').max(500, 'Motivo deve ter no máximo 500 caracteres'),
  type: BlockTypeSchema,
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema,
  isRecurring: z.boolean().default(false),
  recurrence: RecurrenceSchema.default('none'),
  recurrenceDays: z.array(z.number().min(0).max(6)).optional(), // 0 = Domingo, 6 = Sábado
  recurrenceEndDate: DateISOSchema.optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
).refine(
  (data) => {
    if (data.isRecurring && data.recurrence !== 'none') {
      return data.recurrenceEndDate && new Date(data.recurrenceEndDate) > new Date(data.startTime)
    }
    return true
  },
  {
    message: 'Data de fim da recorrência deve ser posterior à data de início',
    path: ['recurrenceEndDate']
  }
)

// Esquema para atualização de bloqueio de horário
export const UpdateTimeBlockSchema = z.object({
  timeBlockId: UUIDSchema,
  startTime: StartTimeSchema.optional(),
  endTime: EndTimeSchema.optional(),
  reason: z.string().min(1, 'Motivo do bloqueio é obrigatório').max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
  type: BlockTypeSchema.optional(),
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  isRecurring: z.boolean().optional(),
  recurrence: RecurrenceSchema.optional(),
  recurrenceDays: z.array(z.number().min(0).max(6)).optional(),
  recurrenceEndDate: DateISOSchema.optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
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

// Esquema para busca de bloqueios de horário
export const SearchTimeBlocksSchema = z.object({
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  type: BlockTypeSchema.optional(),
  startDate: DateISOSchema.optional(),
  endDate: DateISOSchema.optional(),
  isRecurring: z.boolean().optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['startTime', 'endTime', 'type', 'createdAt']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Esquema para verificação de conflitos com bloqueios
export const CheckTimeBlockConflictsSchema = z.object({
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  excludeTimeBlockId: UUIDSchema.optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
)

// Esquema para bloqueio recorrente
export const RecurringTimeBlockSchema = z.object({
  startTime: StartTimeSchema,
  endTime: EndTimeSchema,
  reason: z.string().min(1, 'Motivo do bloqueio é obrigatório').max(500, 'Motivo deve ter no máximo 500 caracteres'),
  type: BlockTypeSchema,
  professionalId: UUIDSchema.optional(),
  unidadeId: UUIDSchema,
  recurrence: RecurrenceSchema,
  recurrenceDays: z.array(z.number().min(0).max(6)).optional(),
  recurrenceEndDate: DateISOSchema,
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Horário de fim deve ser posterior ao início',
    path: ['endTime']
  }
).refine(
  (data) => {
    if (data.recurrence === 'weekly' && data.recurrenceDays) {
      return data.recurrenceDays.length > 0
    }
    return true
  },
  {
    message: 'Dias da semana são obrigatórios para recorrência semanal',
    path: ['recurrenceDays']
  }
)

// Tipos inferidos dos esquemas
export type CreateTimeBlockInput = z.infer<typeof CreateTimeBlockSchema>
export type UpdateTimeBlockInput = z.infer<typeof UpdateTimeBlockSchema>
export type SearchTimeBlocksInput = z.infer<typeof SearchTimeBlocksSchema>
export type CheckTimeBlockConflictsInput = z.infer<typeof CheckTimeBlockConflictsSchema>
export type RecurringTimeBlockInput = z.infer<typeof RecurringTimeBlockSchema>
export type BlockType = z.infer<typeof BlockTypeSchema>
export type Recurrence = z.infer<typeof RecurrenceSchema>
