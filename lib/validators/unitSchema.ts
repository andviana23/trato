import { z } from 'zod'

/**
 * Esquemas de Validação para Unidades
 * 
 * Este arquivo centraliza todas as validações relacionadas a unidades,
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

// Validador para CEP
export const CEPSchema = z.string()
  .length(8, 'CEP deve ter 8 dígitos')
  .regex(/^\d+$/, 'CEP deve conter apenas números')

// Validador para CNPJ
export const CNPJSchema = z.string()
  .length(14, 'CNPJ deve ter 14 dígitos')
  .regex(/^\d+$/, 'CNPJ deve conter apenas números')

// Validador para status de unidade
export const UnitStatusSchema = z.enum([
  'active',
  'inactive',
  'maintenance',
  'closed'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Validador para tipo de unidade
export const UnitTypeSchema = z.enum([
  'clinic',
  'hospital',
  'laboratory',
  'imaging_center',
  'pharmacy',
  'other'
], {
  errorMap: () => ({ message: 'Tipo de unidade deve ser um dos permitidos' })
})

// Esquema para endereço
export const AddressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória').max(200, 'Rua deve ter no máximo 200 caracteres'),
  number: z.string().min(1, 'Número é obrigatório').max(20, 'Número deve ter no máximo 20 caracteres'),
  complement: z.string().max(100, 'Complemento deve ter no máximo 100 caracteres').optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório').max(100, 'Bairro deve ter no máximo 100 caracteres'),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Cidade deve ter no máximo 100 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').regex(/^[A-Z]{2}$/, 'Estado deve ser a sigla em maiúsculas'),
  cep: CEPSchema,
})

// Esquema para horário de funcionamento
export const BusinessHoursSchema = z.object({
  dayOfWeek: z.number().min(0, 'Dia da semana deve ser entre 0 e 6').max(6, 'Dia da semana deve ser entre 0 e 6'),
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de abertura deve estar no formato HH:MM'),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fechamento deve estar no formato HH:MM'),
  isOpen: z.boolean().default(true),
  isLunchBreak: z.boolean().default(false),
  lunchStartTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de início do almoço deve estar no formato HH:MM').optional(),
  lunchEndTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fim do almoço deve estar no formato HH:MM').optional(),
}).refine(
  (data) => {
    const open = new Date(`2000-01-01T${data.openTime}:00`)
    const close = new Date(`2000-01-01T${data.closeTime}:00`)
    return open < close
  },
  {
    message: 'Horário de fechamento deve ser posterior ao horário de abertura',
    path: ['closeTime']
  }
).refine(
  (data) => {
    if (!data.isLunchBreak || !data.lunchStartTime || !data.lunchEndTime) {
      return true
    }
    const open = new Date(`2000-01-01T${data.openTime}:00`)
    const close = new Date(`2000-01-01T${data.closeTime}:00`)
    const lunchStart = new Date(`2000-01-01T${data.lunchStartTime}:00`)
    const lunchEnd = new Date(`2000-01-01T${data.lunchEndTime}:00`)
    
    return lunchStart >= open && lunchEnd <= close && lunchStart < lunchEnd
  },
  {
    message: 'Horário de almoço deve estar dentro do horário de funcionamento',
    path: ['lunchStartTime']
  }
)

// Esquema para criação de unidade
export const CreateUnitSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  tradeName: z.string().max(200, 'Nome fantasia deve ter no máximo 200 caracteres').optional(),
  cnpj: CNPJSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  type: UnitTypeSchema,
  status: UnitStatusSchema.default('active'),
  address: AddressSchema,
  businessHours: z.array(BusinessHoursSchema).min(1, 'Pelo menos um horário de funcionamento é obrigatório'),
  managerId: UUIDSchema.optional(),
  parentUnitId: UUIDSchema.optional(),
  website: z.string().url('Website deve ser uma URL válida').optional(),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  capacity: z.number().positive('Capacidade deve ser positiva').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para atualização de unidade
export const UpdateUnitSchema = z.object({
  unitId: UUIDSchema,
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres').optional(),
  tradeName: z.string().max(200, 'Nome fantasia deve ter no máximo 200 caracteres').optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  type: UnitTypeSchema.optional(),
  status: UnitStatusSchema.optional(),
  address: AddressSchema.optional(),
  businessHours: z.array(BusinessHoursSchema).optional(),
  managerId: UUIDSchema.optional(),
  parentUnitId: UUIDSchema.optional(),
  website: z.string().url('Website deve ser uma URL válida').optional(),
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  capacity: z.number().positive('Capacidade deve ser positiva').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para busca de unidades
export const SearchUnitsSchema = z.object({
  name: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  cnpj: CNPJSchema.optional(),
  type: UnitTypeSchema.optional(),
  status: UnitStatusSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  managerId: UUIDSchema.optional(),
  parentUnitId: UUIDSchema.optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['name', 'city', 'state', 'type', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Esquema para estatísticas de unidade
export const UnitStatsSchema = z.object({
  unitId: UUIDSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
})

// Tipos inferidos dos esquemas
export type CreateUnitInput = z.infer<typeof CreateUnitSchema>
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>
export type SearchUnitsInput = z.infer<typeof SearchUnitsSchema>
export type UnitStatsInput = z.infer<typeof UnitStatsSchema>
export type AddressInput = z.infer<typeof AddressSchema>
export type BusinessHoursInput = z.infer<typeof BusinessHoursSchema>
export type UnitStatus = z.infer<typeof UnitStatusSchema>
export type UnitType = z.infer<typeof UnitTypeSchema>
