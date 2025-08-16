import { z } from 'zod'

/**
 * Esquemas de Validação para Serviços
 * 
 * Este arquivo centraliza todas as validações relacionadas a serviços,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para valor monetário
export const CurrencySchema = z.number()
  .positive('Valor deve ser positivo')
  .min(0.01, 'Valor deve ser maior que zero')

// Validador para duração em minutos
export const DurationSchema = z.number()
  .positive('Duração deve ser positiva')
  .min(15, 'Duração mínima é 15 minutos')
  .max(480, 'Duração máxima é 8 horas (480 minutos)')

// Validador para status de serviço
export const ServiceStatusSchema = z.enum([
  'active',
  'inactive',
  'discontinued'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Validador para categoria de serviço
export const ServiceCategorySchema = z.enum([
  'consultation',
  'procedure',
  'examination',
  'therapy',
  'surgery',
  'other'
], {
  errorMap: () => ({ message: 'Categoria deve ser um dos valores permitidos' })
})

// Esquema para criação de serviço
export const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  price: CurrencySchema,
  duration: DurationSchema,
  category: ServiceCategorySchema,
  status: ServiceStatusSchema.default('active'),
  unidadeId: UUIDSchema.optional(),
  professionalIds: z.array(UUIDSchema).optional(),
  requirements: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  preparationInstructions: z.string().max(1000, 'Instruções de preparação devem ter no máximo 1000 caracteres').optional(),
  aftercareInstructions: z.string().max(1000, 'Instruções de cuidados pós-serviço devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para atualização de serviço
export const UpdateServiceSchema = z.object({
  serviceId: UUIDSchema,
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres').optional(),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  price: CurrencySchema.optional(),
  duration: DurationSchema.optional(),
  category: ServiceCategorySchema.optional(),
  status: ServiceStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  professionalIds: z.array(UUIDSchema).optional(),
  requirements: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  preparationInstructions: z.string().max(1000, 'Instruções de preparação devem ter no máximo 1000 caracteres').optional(),
  aftercareInstructions: z.string().max(1000, 'Instruções de cuidados pós-serviço devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para busca de serviços
export const SearchServicesSchema = z.object({
  name: z.string().optional(),
  category: ServiceCategorySchema.optional(),
  status: ServiceStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  professionalId: UUIDSchema.optional(),
  minPrice: CurrencySchema.optional(),
  maxPrice: CurrencySchema.optional(),
  minDuration: DurationSchema.optional(),
  maxDuration: DurationSchema.optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['name', 'price', 'duration', 'category', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Esquema para agendamento de serviço
export const BookServiceSchema = z.object({
  serviceId: UUIDSchema,
  clientId: UUIDSchema,
  professionalId: UUIDSchema,
  startTime: z.string().datetime('Data e hora de início deve estar no formato ISO'),
  unidadeId: UUIDSchema.optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
})

// Esquema para disponibilidade de serviço
export const ServiceAvailabilitySchema = z.object({
  serviceId: UUIDSchema,
  professionalId: UUIDSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO'),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO'),
  unidadeId: UUIDSchema.optional(),
})

// Tipos inferidos dos esquemas
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>
export type SearchServicesInput = z.infer<typeof SearchServicesSchema>
export type BookServiceInput = z.infer<typeof BookServiceSchema>
export type ServiceAvailabilityInput = z.infer<typeof ServiceAvailabilitySchema>
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>
