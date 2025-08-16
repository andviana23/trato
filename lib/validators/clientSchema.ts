import { z } from 'zod'

/**
 * Esquemas de Validação para Clientes
 * 
 * Este arquivo centraliza todas as validações relacionadas a clientes,
 * promovendo reutilização e consistência.
 */

// Validador para UUID
export const UUIDSchema = z.string().uuid('Deve ser um UUID válido')

// Validador para email
export const EmailSchema = z.string().email('Email deve ser válido')

// Validador para nome
export const NameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')

// Validador para CPF
export const CPFSchema = z.string()
  .length(11, 'CPF deve ter 11 dígitos')
  .regex(/^\d+$/, 'CPF deve conter apenas números')

// Validador para CNPJ
export const CNPJSchema = z.string()
  .length(14, 'CNPJ deve ter 14 dígitos')
  .regex(/^\d+$/, 'CNPJ deve conter apenas números')

// Validador para telefone brasileiro
export const PhoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números, espaços, parênteses, hífens e +')

// Validador para CEP
export const CEPSchema = z.string()
  .length(8, 'CEP deve ter 8 dígitos')
  .regex(/^\d+$/, 'CEP deve conter apenas números')

// Validador para data de nascimento
export const BirthDateSchema = z.string().datetime('Data de nascimento deve estar no formato ISO')

// Validador para status de cliente
export const ClientStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending'
], {
  errorMap: () => ({ message: 'Status deve ser um dos valores permitidos' })
})

// Validador para tipo de cliente
export const ClientTypeSchema = z.enum([
  'individual',
  'corporate'
], {
  errorMap: () => ({ message: 'Tipo de cliente deve ser um dos valores permitidos' })
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

// Esquema para cliente individual
export const IndividualClientSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  cpf: CPFSchema,
  birthDate: BirthDateSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: AddressSchema.optional(),
  emergencyContact: z.object({
    name: NameSchema,
    phone: PhoneSchema,
    relationship: z.string().max(50, 'Relacionamento deve ter no máximo 50 caracteres'),
  }).optional(),
  medicalHistory: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para cliente corporativo
export const CorporateClientSchema = z.object({
  companyName: z.string().min(1, 'Nome da empresa é obrigatório').max(200, 'Nome da empresa deve ter no máximo 200 caracteres'),
  tradeName: z.string().max(200, 'Nome fantasia deve ter no máximo 200 caracteres').optional(),
  cnpj: CNPJSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  address: AddressSchema.optional(),
  contactPerson: z.object({
    name: NameSchema,
    position: z.string().max(100, 'Cargo deve ter no máximo 100 caracteres'),
    phone: PhoneSchema,
    email: EmailSchema.optional(),
  }),
  industry: z.string().max(100, 'Setor deve ter no máximo 100 caracteres').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
})

// Esquema para criação de cliente
export const createClientSchema = z.object({
  type: ClientTypeSchema,
  status: ClientStatusSchema.default('active'),
  unidadeId: UUIDSchema.optional(),
  // Dados específicos baseados no tipo
  individual: IndividualClientSchema.optional(),
  corporate: CorporateClientSchema.optional(),
}).refine(
  (data) => {
    if (data.type === 'individual' && !data.individual) {
      return false
    }
    if (data.type === 'corporate' && !data.corporate) {
      return false
    }
    return true
  },
  {
    message: 'Dados específicos do tipo de cliente são obrigatórios',
    path: ['type']
  }
)

// Esquema para atualização de cliente
export const updateClientSchema = z.object({
  clientId: UUIDSchema,
  status: ClientStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  // Dados específicos baseados no tipo
  individual: IndividualClientSchema.partial().optional(),
  corporate: CorporateClientSchema.partial().optional(),
})

// Esquema para desativação de cliente
export const deactivateClientSchema = z.object({
  clientId: UUIDSchema,
  reason: z.string().max(200, 'Motivo da desativação deve ter no máximo 200 caracteres').optional(),
  deactivatedBy: UUIDSchema.optional(),
})

// Esquema para reativação de cliente
export const reactivateClientSchema = z.object({
  clientId: UUIDSchema,
  reason: z.string().max(200, 'Motivo da reativação deve ter no máximo 200 caracteres').optional(),
  reactivatedBy: UUIDSchema.optional(),
})

// Esquema para busca de clientes
export const searchClientsSchema = z.object({
  name: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  cpf: CPFSchema.optional(),
  cnpj: CNPJSchema.optional(),
  type: ClientTypeSchema.optional(),
  status: ClientStatusSchema.optional(),
  unidadeId: UUIDSchema.optional(),
  startDate: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  endDate: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastVisit']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Tipos inferidos dos esquemas
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type SearchClientsInput = z.infer<typeof searchClientsSchema>
export type DeactivateClientInput = z.infer<typeof deactivateClientSchema>
export type ReactivateClientInput = z.infer<typeof reactivateClientSchema>
export type IndividualClientInput = z.infer<typeof IndividualClientSchema>
export type CorporateClientInput = z.infer<typeof CorporateClientSchema>
export type AddressInput = z.infer<typeof AddressSchema>
export type ClientStatus = z.infer<typeof ClientStatusSchema>
export type ClientType = z.infer<typeof ClientTypeSchema>
