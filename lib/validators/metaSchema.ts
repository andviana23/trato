import { z } from 'zod'

/**
 * Esquemas de Validação para Metas
 * 
 * Este arquivo centraliza todas as validações relacionadas a metas e bonificações,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para data ISO
export const DateISOSchema = z.string().datetime('Data deve estar no formato ISO')

// Validador para valor monetário
export const CurrencySchema = z.number()
  .positive('Valor deve ser positivo')
  .min(0.01, 'Valor deve ser maior que zero')

// Validador para porcentagem
export const PercentageSchema = z.number()
  .min(0, 'Porcentagem deve ser maior ou igual a 0')
  .max(100, 'Porcentagem deve ser menor ou igual a 100')

// Validador para status de meta
export const MetaStatusSchema = z.enum([
  'active',
  'inactive',
  'completed',
  'cancelled',
  'expired'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Esquema para criação de meta
export const createMetaSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título deve ter no máximo 200 caracteres'),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  targetValue: CurrencySchema,
  currentValue: CurrencySchema.default(0),
  startDate: DateISOSchema,
  endDate: DateISOSchema,
  bonusPercentage: PercentageSchema,
  maxBonusPercentage: PercentageSchema.optional(),
  partialBonusThreshold: PercentageSchema.optional(),
  partialBonusMultiplier: z.number().min(0).max(1).optional(),
  minimumProgressThreshold: PercentageSchema.optional(),
  status: MetaStatusSchema.default('active'),
  unidadeId: UUIDSchema.optional(),
  createdBy: UUIDSchema.optional(),
})

// Esquema para atualização de meta
export const updateMetaSchema = z.object({
  metaId: UUIDSchema,
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título deve ter no máximo 200 caracteres').optional(),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  targetValue: CurrencySchema.optional(),
  currentValue: CurrencySchema.optional(),
  startDate: DateISOSchema.optional(),
  endDate: DateISOSchema.optional(),
  bonusPercentage: PercentageSchema.optional(),
  maxBonusPercentage: PercentageSchema.optional(),
  partialBonusThreshold: PercentageSchema.optional(),
  partialBonusMultiplier: z.number().min(0).max(1).optional(),
  minimumProgressThreshold: PercentageSchema.optional(),
  status: MetaStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate)
    }
    return true
  },
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['endDate']
  }
)

// Esquema para cálculo de bônus
export const calculateBonusSchema = z.object({
  metaId: UUIDSchema,
})

// Esquema para aplicação de bônus mensal
export const applyMonthlyBonusSchema = z.object({
  month: z.number().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12'),
  year: z.number().min(2020, 'Ano deve ser maior ou igual a 2020'),
  unidadeId: UUIDSchema.optional(),
})

// Esquema para busca de metas
export const searchMetasSchema = z.object({
  title: z.string().optional(),
  status: MetaStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  startDate: DateISOSchema.optional(),
  endDate: DateISOSchema.optional(),
  minProgress: PercentageSchema.optional(),
  maxProgress: PercentageSchema.optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['title', 'startDate', 'endDate', 'progress', 'createdAt']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Esquema para obtenção de progresso de meta
export const getMetaProgressSchema = z.object({
  metaId: UUIDSchema,
})

// Esquema para cálculo de progresso de meta
export const calculateMetaProgressSchema = z.object({
  metaId: UUIDSchema,
})

// Esquema para cálculo de comissão
export const calculateCommissionSchema = z.object({
  metaId: UUIDSchema,
  professionalId: UUIDSchema.optional(),
  month: z.number().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12').optional(),
  year: z.number().min(2020, 'Ano deve ser maior ou igual a 2020').optional(),
})

// Tipos inferidos dos esquemas
export type CreateMetaInput = z.infer<typeof createMetaSchema>
export type UpdateMetaInput = z.infer<typeof updateMetaSchema>
export type CalculateBonusInput = z.infer<typeof calculateBonusSchema>
export type ApplyMonthlyBonusInput = z.infer<typeof applyMonthlyBonusSchema>
export type SearchMetasInput = z.infer<typeof searchMetasSchema>
export type GetMetaProgressInput = z.infer<typeof getMetaProgressSchema>
export type CalculateMetaProgressInput = z.infer<typeof calculateMetaProgressSchema>
export type CalculateCommissionInput = z.infer<typeof calculateCommissionSchema>
export type MetaStatus = z.infer<typeof MetaStatusSchema>
